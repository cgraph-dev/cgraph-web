import { describe, expect, it } from 'vitest';
import {
  applySpaceConversationPatch,
  conversationMatchesSpace,
  readConversationSpace,
  spaceConversationPatch,
  type ConversationSpace,
} from '@/modules/chat/components/conversation-list';

const baseSpace: ConversationSpace = {
  id: 'space-1',
  name: 'Priority',
  emoji: 'p',
  position: 0,
  includeAllIndividual: false,
  includeAllGroups: false,
  showOnlyUnread: false,
  showMuted: true,
  includedConversationIds: [],
  excludedConversationIds: [],
};

describe('readConversationSpace', () => {
  it('normalizes camelCase and snake_case space payloads', () => {
    const space = readConversationSpace({
      id: 'space-1',
      name: 'Priority',
      emoji: 'p',
      include_all_individual: false,
      includeAllGroups: true,
      show_only_unread: true,
      showMuted: false,
      included_conversation_ids: ['conv-1'],
      excludedConversationIds: ['conv-2'],
    });

    expect(space).toMatchObject({
      id: 'space-1',
      name: 'Priority',
      includeAllIndividual: false,
      includeAllGroups: true,
      showOnlyUnread: true,
      showMuted: false,
      includedConversationIds: ['conv-1'],
      excludedConversationIds: ['conv-2'],
    });
  });

  it('rejects malformed space payloads', () => {
    expect(readConversationSpace({ id: 'space-1' })).toBeNull();
    expect(readConversationSpace(null)).toBeNull();
  });
});

describe('conversationMatchesSpace', () => {
  it('includes explicitly added conversations when type flags are off', () => {
    const space = { ...baseSpace, includedConversationIds: ['conv-1'] };

    expect(
      conversationMatchesSpace(
        { id: 'conv-1', type: 'direct', unreadCount: 0, isMuted: false },
        space
      )
    ).toBe(true);
  });

  it('excludes conversations explicitly removed from broad type rules', () => {
    const space = {
      ...baseSpace,
      includeAllIndividual: true,
      excludedConversationIds: ['conv-1'],
    };

    expect(
      conversationMatchesSpace(
        { id: 'conv-1', type: 'direct', unreadCount: 1, isMuted: false },
        space
      )
    ).toBe(false);
  });

  it('honors unread and muted filters', () => {
    const space = {
      ...baseSpace,
      includeAllIndividual: true,
      showOnlyUnread: true,
      showMuted: false,
    };

    expect(
      conversationMatchesSpace(
        { id: 'conv-1', type: 'direct', unreadCount: 0, isMuted: false },
        space
      )
    ).toBe(false);
    expect(
      conversationMatchesSpace(
        { id: 'conv-1', type: 'direct', unreadCount: 1, isMuted: true },
        space
      )
    ).toBe(false);
  });
});

describe('spaceConversationPatch', () => {
  it('adds a conversation and clears any explicit exclusion', () => {
    const patch = spaceConversationPatch(
      { ...baseSpace, excludedConversationIds: ['conv-1'] },
      'conv-1',
      true
    );

    expect(patch).toEqual({
      included_conversation_ids: ['conv-1'],
      excluded_conversation_ids: [],
    });
  });

  it('removes a conversation and records an explicit exclusion', () => {
    const patch = spaceConversationPatch(
      { ...baseSpace, includedConversationIds: ['conv-1', 'conv-2'] },
      'conv-1',
      false
    );

    expect(patch).toEqual({
      included_conversation_ids: ['conv-2'],
      excluded_conversation_ids: ['conv-1'],
    });
  });

  it('applies patches to local space state', () => {
    const updated = applySpaceConversationPatch(baseSpace, 'conv-1', true);

    expect(updated.includedConversationIds).toEqual(['conv-1']);
    expect(updated.excludedConversationIds).toEqual([]);
  });
});
