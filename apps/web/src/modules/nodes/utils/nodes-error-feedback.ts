import { NodesApiError } from '../services/nodesApi';

export type NodesActionKind = 'tip' | 'gift' | 'contentUnlock' | 'paidFileUnlock';

export interface NodesActionFeedback {
  readonly code?: string;
  readonly title: string;
  readonly detail?: string;
  readonly shouldOpenShop: boolean;
  readonly alreadyComplete: boolean;
}

const actionFallbacks: Record<NodesActionKind, string> = {
  tip: 'Tip failed. Please try again.',
  gift: 'Gift failed. Please try again.',
  contentUnlock: 'Unlock failed. Please try again.',
  paidFileUnlock: 'Failed to unlock file. Check your Node balance.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeCode(code: string | undefined): string | undefined {
  return code?.trim().toLowerCase().replaceAll('-', '_') || undefined;
}

function codeFromErrorPayload(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return normalizeCode(value);
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const directCode = stringFrom(value.code);
  if (directCode) {
    return normalizeCode(directCode);
  }

  return codeFromErrorPayload(value.error);
}

/**
 * Extract the normalized backend error code from Nodes action failures.
 */
export function getNodesErrorCode(error: unknown): string | undefined {
  if (error instanceof NodesApiError) {
    return normalizeCode(error.code);
  }

  if (!isRecord(error)) {
    return undefined;
  }

  const directCode = codeFromErrorPayload(error);
  if (directCode) {
    return directCode;
  }

  const response = error.response;
  if (isRecord(response)) {
    return codeFromErrorPayload(response.data);
  }

  return undefined;
}

/**
 * Convert Nodes action failures into consistent user-facing recovery states.
 */
export function getNodesActionFeedback(
  error: unknown,
  action: NodesActionKind
): NodesActionFeedback {
  const code = getNodesErrorCode(error);

  switch (code) {
    case 'insufficient_balance':
    case 'insufficient_nodes':
    case 'not_enough_nodes':
      return {
        code,
        title: 'Not enough Nodes',
        detail: 'Add Nodes to continue.',
        shouldOpenShop: true,
        alreadyComplete: false,
      };

    case 'already_unlocked':
    case 'content_already_unlocked':
    case 'paid_file_already_unlocked':
      return {
        code,
        title: 'Already unlocked',
        detail: 'You already have access.',
        shouldOpenShop: false,
        alreadyComplete: true,
      };

    case 'self_gift':
    case 'self_tip':
    case 'cannot_gift_self':
    case 'cannot_tip_self':
      return {
        code,
        title: 'Cannot send Nodes to yourself',
        detail: 'Choose another recipient.',
        shouldOpenShop: false,
        alreadyComplete: false,
      };

    case 'rate_limited':
    case 'too_many_requests':
      return {
        code,
        title: 'Too many attempts',
        detail: 'Please wait a moment and try again.',
        shouldOpenShop: false,
        alreadyComplete: false,
      };

    default:
      return {
        code,
        title: actionFallbacks[action],
        shouldOpenShop: false,
        alreadyComplete: false,
      };
  }
}

/**
 * Build a compact toast message from normalized Nodes failure feedback.
 */
export function formatNodesToast(feedback: NodesActionFeedback): string {
  return feedback.detail ? `${feedback.title}. ${feedback.detail}` : feedback.title;
}
