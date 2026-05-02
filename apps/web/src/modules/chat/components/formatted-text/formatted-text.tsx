/**
 * FormattedText -- renders message text with Signal BodyRange formatting.
 *
 * When bodyRanges are present, this component replaces MarkdownContent.
 * It builds a range tree from the flat bodyRanges array, collapses it into
 * display nodes, groups spoilers, and renders each node with appropriate styling.
 *
 * Signal reference: BodyRange.std.ts -> insertRange -> collapseRangeTree -> render
 */

import { memo, type ReactNode } from 'react';
import { EmojiTextRenderer } from '@/lib/lottie/emoji-text-renderer';
import { buildDisplayNodes } from './utils';
import { SpoilerText } from './spoiler-text';
import type { FormattedTextProps, DisplayNode } from './types';

export const FormattedText = memo(function FormattedText({
  content,
  bodyRanges,
  className = '',
}: FormattedTextProps): ReactNode {
  if (!content) return null;

  const displayNodes = buildDisplayNodes(content, bodyRanges);

  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {displayNodes.map((node, idx) => (
        <FormattedNode key={`${node.start}-${idx}`} node={node} />
      ))}
    </p>
  );
});

/** Render a single DisplayNode, dispatching to SpoilerText for spoilers */
function FormattedNode({ node }: { readonly node: DisplayNode }): ReactNode {
  // Spoiler container (has spoilerChildren) -- render grouped spoiler
  if (node.isSpoiler && node.spoilerChildren && typeof node.spoilerId === 'number') {
    return <SpoilerText nodes={node.spoilerChildren} spoilerId={node.spoilerId} />;
  }

  // Regular formatted node
  const text = <EmojiTextRenderer text={node.text} />;
  let rendered: ReactNode = text;

  if (node.isMonospace) {
    rendered = (
      <code className="bg-[var(--token-card-bg)]/60 rounded px-1.5 py-0.5 font-mono text-xs text-pink-300">
        {rendered}
      </code>
    );
  }

  if (node.isBold) {
    rendered = <strong className="font-bold">{rendered}</strong>;
  }

  if (node.isItalic) {
    rendered = <em className="italic">{rendered}</em>;
  }

  if (node.isStrikethrough) {
    rendered = <del className="line-through opacity-60">{rendered}</del>;
  }

  // Individual spoiler (not grouped) -- treat as inline spoiler
  if (node.isSpoiler && !node.spoilerChildren) {
    return <SpoilerText nodes={[node]} spoilerId={node.spoilerId ?? 0} />;
  }

  return <span>{rendered}</span>;
}
