/**
 * BodyRange range tree builder and collapse utilities.
 *
 * Follows Signal's BodyRange.std.ts insertRange + collapseRangeTree pattern exactly.
 * See: reference/Signal/Signal-Desktop/ts/types/BodyRange.std.ts
 *
 * Flow:
 * 1. insertRange -- builds a nested range tree from flat BodyRange array
 * 2. collapseRangeTree -- flattens the tree into DisplayNode[] ready for rendering
 * 3. groupContiguousSpoilers -- groups spoiler nodes by spoilerId for unified reveal
 */

import type { BodyRange, DisplayNode, RangeNode, PartialDisplayData } from './types';

import { logger } from '@/lib/logger';

/**
 * Insert a range into an existing range tree, splitting it if it intersects
 * with an existing range. Follows Signal insertRange() exactly.
 */
export function insertRange(
  range: RangeNode,
  rangeTree: ReadonlyArray<RangeNode>
): ReadonlyArray<RangeNode> {
  const [current, ...rest] = rangeTree;

  if (!current) {
    return [{ ...range, ranges: [] }];
  }

  const rangeEnd = range.start + range.length;
  const currentEnd = current.start + current.length;

  // ends before current starts
  if (rangeEnd <= current.start) {
    return [{ ...range, ranges: [] }, current, ...rest];
  }

  // starts after current one ends
  if (range.start >= currentEnd) {
    return [current, ...insertRange(range, rest)];
  }

  // range is contained by first
  if (range.start >= current.start && rangeEnd <= currentEnd) {
    return [
      {
        ...current,
        ranges: insertRange({ ...range, start: range.start - current.start }, current.ranges),
      },
      ...rest,
    ];
  }

  // range contains first (but might contain more) -- split into 3
  if (range.start < current.start && rangeEnd > currentEnd) {
    return [
      { ...range, length: current.start - range.start, ranges: [] },
      {
        ...current,
        ranges: insertRange({ ...range, start: 0, length: current.length }, current.ranges),
      },
      ...insertRange({ ...range, start: currentEnd, length: rangeEnd - currentEnd }, rest),
    ];
  }

  // range intersects beginning -- split into 2
  if (range.start < current.start && rangeEnd <= currentEnd) {
    return [
      { ...range, length: current.start - range.start, ranges: [] },
      {
        ...current,
        ranges: insertRange(
          {
            ...range,
            start: 0,
            length: range.length - (current.start - range.start),
          },
          current.ranges
        ),
      },
      ...rest,
    ];
  }

  // range intersects ending -- split into 2
  if (range.start >= current.start && rangeEnd > currentEnd) {
    return [
      {
        ...current,
        ranges: insertRange(
          {
            ...range,
            start: range.start - current.start,
            length: currentEnd - range.start,
          },
          current.ranges
        ),
      },
      ...insertRange(
        {
          ...range,
          start: currentEnd,
          length: range.length - (currentEnd - range.start),
        },
        rest
      ),
    ];
  }

  logger.error('FormattedText: unhandled range intersection');
  return rangeTree;
}

/** Convert a BodyRange style to partial display flags */
function rangeToPartialData(range: RangeNode): PartialDisplayData {
  switch (range.style) {
    case 'bold':
      return { isBold: true };
    case 'italic':
      return { isItalic: true };
    case 'monospace':
      return { isMonospace: true };
    case 'spoiler':
      return { isSpoiler: true, spoilerId: range.spoilerId };
    case 'strikethrough':
      return { isStrikethrough: true };
    default:
      return {};
  }
}

/**
 * Collapse a range tree into a flat list of DisplayNodes.
 * Follows Signal collapseRangeTree() exactly.
 */
export function collapseRangeTree(opts: {
  parentData?: PartialDisplayData;
  parentOffset?: number;
  text: string;
  tree: ReadonlyArray<RangeNode>;
}): ReadonlyArray<DisplayNode> {
  const { parentData, parentOffset = 0, text, tree } = opts;
  const collapsed: DisplayNode[] = [];
  let offset = 0;

  for (const range of tree) {
    // Empty space between ranges
    if (range.start > offset) {
      collapsed.push({
        ...parentData,
        text: text.slice(offset, range.start),
        start: offset + parentOffset,
        length: range.start - offset,
      });
    }

    // Recurse into this node's children
    const partialNode = { ...parentData, ...rangeToPartialData(range) };
    const children = collapseRangeTree({
      parentData: partialNode,
      parentOffset: range.start + parentOffset,
      text: text.slice(range.start, range.start + range.length),
      tree: range.ranges,
    });
    collapsed.push(...children);

    offset = range.start + range.length;
  }

  // Remaining text after last range
  if (text.length > offset) {
    collapsed.push({
      ...parentData,
      text: text.slice(offset),
      start: offset + parentOffset,
      length: text.length - offset,
    });
  }

  return collapsed;
}

/**
 * Group contiguous spoiler nodes by spoilerId for unified reveal.
 * Follows Signal groupContiguousSpoilers() exactly.
 */
export function groupContiguousSpoilers(
  nodes: ReadonlyArray<DisplayNode>
): ReadonlyArray<DisplayNode> {
  const result: DisplayNode[] = [];
  let spoilerContainer: (DisplayNode & { spoilerChildren: DisplayNode[] }) | undefined;

  for (const node of nodes) {
    if (node.isSpoiler) {
      if (
        spoilerContainer &&
        typeof spoilerContainer.spoilerId === 'number' &&
        spoilerContainer.spoilerId === node.spoilerId
      ) {
        spoilerContainer.spoilerChildren.push(node);
      } else {
        spoilerContainer = {
          ...node,
          isSpoiler: true,
          spoilerChildren: [node],
        };
        result.push(spoilerContainer);
      }
    } else {
      spoilerContainer = undefined;
      result.push(node);
    }
  }

  return result;
}

/**
 * Main entry point: convert message text + body ranges into display-ready nodes.
 *
 * 1. Sort ranges by start position
 * 2. Build range tree via insertRange
 * 3. Collapse tree into flat DisplayNode list
 * 4. Group contiguous spoilers
 */
export function buildDisplayNodes(
  text: string,
  ranges: ReadonlyArray<BodyRange>
): ReadonlyArray<DisplayNode> {
  if (ranges.length === 0) {
    return [{ text, start: 0, length: text.length }];
  }

  // Sort by start position, then by length (longer ranges first for proper nesting)
  const sorted = [...ranges].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.length - a.length;
  });

  // Build range tree
  let tree: ReadonlyArray<RangeNode> = [];
  for (const range of sorted) {
    const rangeNode: RangeNode = { ...range, ranges: [] };
    tree = insertRange(rangeNode, tree);
  }

  // Collapse to flat display nodes
  const displayNodes = collapseRangeTree({ text, tree });

  // Group contiguous spoilers for unified reveal
  return groupContiguousSpoilers(displayNodes);
}
