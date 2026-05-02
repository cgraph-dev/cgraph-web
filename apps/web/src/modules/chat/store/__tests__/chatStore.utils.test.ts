/**
 * Chat Store Utilities Tests
 *
 * Tests for findConversationForMessage and updateMessageReactions.
 */

import { describe, it, expect } from 'vitest';
import { findConversationForMessage, updateMessageReactions } from '../chatStore.utils';
import type { Message, Reaction } from '../chatStore.types';
function makeMsg(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'hello',
    encryptedContent: null,
    isEncrypted: false,
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    isPinned: false,
    isEdited: false,
    deletedAt: null,
    metadata: {},
    reactions: [],
    sender: { id: 'user-1', username: 'alice', displayName: 'Alice', avatarUrl: null },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeReaction(overrides: Partial<Reaction> = {}): Reaction {
  return {
    id: 'r-1',
    emoji: '👍',
    userId: 'user-1',
    user: { id: 'user-1', username: 'alice' },
    ...overrides,
  };
}
describe('findConversationForMessage', () => {
  it('returns the conversation ID containing the message', () => {
    const messages = {
      'conv-1': [{ id: 'msg-1' }, { id: 'msg-2' }],
      'conv-2': [{ id: 'msg-3' }],
    };
    expect(findConversationForMessage(messages, 'msg-3')).toBe('conv-2');
  });

  it('returns null when message is not found', () => {
    const messages = {
      'conv-1': [{ id: 'msg-1' }],
    };
    expect(findConversationForMessage(messages, 'nonexistent')).toBeNull();
  });

  it('returns null for empty messages map', () => {
    expect(findConversationForMessage({}, 'msg-1')).toBeNull();
  });

  it('returns first conversation when message appears in multiple (edge case)', () => {
    const messages = {
      'conv-a': [{ id: 'msg-1' }],
      'conv-b': [{ id: 'msg-1' }],
    };
    const result = findConversationForMessage(messages, 'msg-1');
    // Should return one of them (first found)
    expect(['conv-a', 'conv-b']).toContain(result);
  });

  it('handles conversations with empty message arrays', () => {
    const messages = {
      'conv-1': [],
      'conv-2': [{ id: 'msg-1' }],
    };
    expect(findConversationForMessage(messages, 'msg-1')).toBe('conv-2');
  });
});
describe('updateMessageReactions', () => {
  it('adds a reaction to a message', () => {
    const msg = makeMsg({ id: 'msg-1', reactions: [] });
    const messages = { 'conv-1': [msg] };

    const result = updateMessageReactions(messages, 'msg-1', (reactions) => [
      ...reactions,
      makeReaction({ emoji: '🎉', userId: 'user-2' }),
    ]);

    expect(result['conv-1']![0]!.reactions).toHaveLength(1);
    expect(result['conv-1']![0]!.reactions[0]!.emoji).toBe('🎉');
  });

  it('removes a reaction from a message', () => {
    const msg = makeMsg({
      id: 'msg-1',
      reactions: [
        makeReaction({ emoji: '👍', userId: 'user-1' }),
        makeReaction({ id: 'r-2', emoji: '❤️', userId: 'user-2' }),
      ],
    });
    const messages = { 'conv-1': [msg] };

    const result = updateMessageReactions(messages, 'msg-1', (reactions) =>
      reactions.filter((r) => !(r.emoji === '👍' && r.userId === 'user-1'))
    );

    expect(result['conv-1']![0]!.reactions).toHaveLength(1);
    expect(result['conv-1']![0]!.reactions[0]!.emoji).toBe('❤️');
  });

  it('does not modify messages in other conversations', () => {
    const msg1 = makeMsg({ id: 'msg-1', conversationId: 'conv-1', reactions: [] });
    const msg2 = makeMsg({ id: 'msg-2', conversationId: 'conv-2', reactions: [] });
    const messages = { 'conv-1': [msg1], 'conv-2': [msg2] };

    const result = updateMessageReactions(messages, 'msg-1', (reactions) => [
      ...reactions,
      makeReaction(),
    ]);

    expect(result['conv-1']![0]!.reactions).toHaveLength(1);
    expect(result['conv-2']![0]!.reactions).toHaveLength(0);
    // conv-2 should be the same reference (not copied)
    expect(result['conv-2']).toBe(messages['conv-2']!);
  });

  it('returns all conversations even when message not found', () => {
    const msg = makeMsg({ id: 'msg-1', reactions: [] });
    const messages = { 'conv-1': [msg] };

    const result = updateMessageReactions(messages, 'nonexistent', (reactions) => [
      ...reactions,
      makeReaction(),
    ]);

    expect(result['conv-1']![0]!.reactions).toHaveLength(0);
  });

  it('handles message with undefined reactions (uses empty array)', () => {
    const msg = makeMsg({ id: 'msg-1' });
    // Force reactions to be falsy to test fallback
    (msg as unknown as Record<string, unknown>).reactions = undefined;
    const messages = { 'conv-1': [msg] };

    const result = updateMessageReactions(messages, 'msg-1', (reactions) => [
      ...reactions,
      makeReaction(),
    ]);

    expect(result['conv-1']![0]!.reactions).toHaveLength(1);
  });

  it('preserves other message properties when updating reactions', () => {
    const msg = makeMsg({ id: 'msg-1', content: 'important', isPinned: true });
    const messages = { 'conv-1': [msg] };

    const result = updateMessageReactions(messages, 'msg-1', (reactions) => [
      ...reactions,
      makeReaction(),
    ]);

    expect(result['conv-1']![0]!.content).toBe('important');
    expect(result['conv-1']![0]!.isPinned).toBe(true);
  });

  it('does not mutate the original messages object', () => {
    const msg = makeMsg({ id: 'msg-1', reactions: [] });
    const messages = { 'conv-1': [msg] };

    updateMessageReactions(messages, 'msg-1', (reactions) => [
      ...reactions,
      makeReaction(),
    ]);

    // Original should be unchanged
    expect(messages['conv-1']![0]!.reactions).toHaveLength(0);
  });
});
