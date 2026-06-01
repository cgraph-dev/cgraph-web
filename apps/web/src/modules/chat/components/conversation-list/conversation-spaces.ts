import { ensureObject } from '@/lib/api-utils';
import type { Conversation } from '@/modules/chat/store/chatStore.impl';

export interface ConversationSpace {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly position: number;
  readonly includeAllIndividual: boolean;
  readonly includeAllGroups: boolean;
  readonly showOnlyUnread: boolean;
  readonly showMuted: boolean;
  readonly includedConversationIds: readonly string[];
  readonly excludedConversationIds: readonly string[];
}

function boolValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function uniqueWithout(values: readonly string[], removed: string): string[] {
  return [...new Set(values.filter((value) => value !== removed))];
}

function uniqueWith(values: readonly string[], added: string): string[] {
  return [...new Set([...values, added])];
}

/**
 * Normalize a backend Space payload into the routed conversation-list shape.
 */
export function readConversationSpace(raw: unknown): ConversationSpace | null {
  const value = ensureObject<Record<string, unknown>>(raw);
  if (!value || typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    emoji: typeof value.emoji === 'string' ? value.emoji : '',
    position: typeof value.position === 'number' ? value.position : 0,
    includeAllIndividual: boolValue(
      value.includeAllIndividual ?? value.include_all_individual,
      true
    ),
    includeAllGroups: boolValue(value.includeAllGroups ?? value.include_all_groups, true),
    showOnlyUnread: boolValue(value.showOnlyUnread ?? value.show_only_unread, false),
    showMuted: boolValue(value.showMuted ?? value.show_muted, true),
    includedConversationIds: stringArray(
      value.includedConversationIds ?? value.included_conversation_ids
    ),
    excludedConversationIds: stringArray(
      value.excludedConversationIds ?? value.excluded_conversation_ids
    ),
  };
}

/**
 * Decide whether a conversation belongs to a Space after broad rules and explicit overrides.
 */
export function conversationMatchesSpace(
  conversation: Pick<Conversation, 'id' | 'type' | 'unreadCount' | 'isMuted'>,
  space: ConversationSpace
): boolean {
  if (space.excludedConversationIds.includes(conversation.id)) {
    return false;
  }

  const isExplicitlyIncluded = space.includedConversationIds.includes(conversation.id);
  const typeAllowed =
    conversation.type === 'group' ? space.includeAllGroups : space.includeAllIndividual;

  if (!isExplicitlyIncluded && !typeAllowed) {
    return false;
  }

  if (space.showOnlyUnread && conversation.unreadCount === 0) {
    return false;
  }

  if (!space.showMuted && conversation.isMuted) {
    return false;
  }

  return true;
}

/**
 * Build the server patch that adds or removes one conversation from a Space.
 */
export function spaceConversationPatch(
  space: ConversationSpace,
  conversationId: string,
  shouldInclude: boolean
): {
  readonly included_conversation_ids: readonly string[];
  readonly excluded_conversation_ids: readonly string[];
} {
  if (shouldInclude) {
    return {
      included_conversation_ids: uniqueWith(space.includedConversationIds, conversationId),
      excluded_conversation_ids: uniqueWithout(space.excludedConversationIds, conversationId),
    };
  }

  return {
    included_conversation_ids: uniqueWithout(space.includedConversationIds, conversationId),
    excluded_conversation_ids: uniqueWith(space.excludedConversationIds, conversationId),
  };
}

/**
 * Apply a Space membership patch locally for optimistic UI state.
 */
export function applySpaceConversationPatch(
  space: ConversationSpace,
  conversationId: string,
  shouldInclude: boolean
): ConversationSpace {
  const patch = spaceConversationPatch(space, conversationId, shouldInclude);
  return {
    ...space,
    includedConversationIds: patch.included_conversation_ids,
    excludedConversationIds: patch.excluded_conversation_ids,
  };
}
