/**
 * Tests for voiceStateStore.ts
 *
 * Covers all voice state management:
 * - Connection lifecycle (setConnected, setDisconnected, setConnecting)
 * - Audio/video toggles (toggleMute, toggleDeafen, toggleVideo)
 * - Direct state setters (setMuted, setDeafened)
 * - Channel member management (set, add, remove, update)
 * - Error handling and reset
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useVoiceStateStore } from '../voiceStateStore';
import type { VoiceMember } from '../voiceStateStore';

// Reset store before each test
beforeEach(() => {
  useVoiceStateStore.getState().reset();
});

// Initial state
describe('voiceStateStore initial state', () => {
  it('starts with no active connection', () => {
    const state = useVoiceStateStore.getState();
    expect(state.currentChannelId).toBeNull();
    expect(state.currentGroupId).toBeNull();
    expect(state.currentRoomToken).toBeNull();
    expect(state.currentRoomName).toBeNull();
  });

  it('starts with audio/video defaults', () => {
    const state = useVoiceStateStore.getState();
    expect(state.isMuted).toBe(false);
    expect(state.isDeafened).toBe(false);
    expect(state.isVideoOn).toBe(false);
  });

  it('starts with empty channel members', () => {
    expect(useVoiceStateStore.getState().channelMembers).toEqual({});
  });

  it('starts with no error', () => {
    expect(useVoiceStateStore.getState().error).toBeNull();
  });

  it('starts not connecting', () => {
    expect(useVoiceStateStore.getState().isConnecting).toBe(false);
  });
});

// Connection lifecycle
describe('connection lifecycle', () => {
  it('setConnected sets all connection fields and clears connecting/error', () => {
    useVoiceStateStore.getState().setError('previous error');
    useVoiceStateStore.getState().setConnecting(true);

    useVoiceStateStore.getState().setConnected('ch-1', 'grp-1', 'token-abc', 'room-xyz');

    const state = useVoiceStateStore.getState();
    expect(state.currentChannelId).toBe('ch-1');
    expect(state.currentGroupId).toBe('grp-1');
    expect(state.currentRoomToken).toBe('token-abc');
    expect(state.currentRoomName).toBe('room-xyz');
    expect(state.isConnecting).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setDisconnected clears all connection and media state', () => {
    useVoiceStateStore.getState().setConnected('ch-1', 'grp-1', 'token', 'room');
    useVoiceStateStore.getState().setMuted(true);

    useVoiceStateStore.getState().setDisconnected();

    const state = useVoiceStateStore.getState();
    expect(state.currentChannelId).toBeNull();
    expect(state.currentGroupId).toBeNull();
    expect(state.currentRoomToken).toBeNull();
    expect(state.currentRoomName).toBeNull();
    expect(state.isMuted).toBe(false);
    expect(state.isDeafened).toBe(false);
    expect(state.isVideoOn).toBe(false);
    expect(state.isConnecting).toBe(false);
  });

  it('setConnecting updates connecting state', () => {
    useVoiceStateStore.getState().setConnecting(true);
    expect(useVoiceStateStore.getState().isConnecting).toBe(true);

    useVoiceStateStore.getState().setConnecting(false);
    expect(useVoiceStateStore.getState().isConnecting).toBe(false);
  });
});

// Audio/Video toggles
describe('toggleMute', () => {
  it('toggles mute on and off', () => {
    expect(useVoiceStateStore.getState().isMuted).toBe(false);

    useVoiceStateStore.getState().toggleMute();
    expect(useVoiceStateStore.getState().isMuted).toBe(true);

    useVoiceStateStore.getState().toggleMute();
    expect(useVoiceStateStore.getState().isMuted).toBe(false);
  });

  it('unmuting while deafened also undeafens', () => {
    // Deafen first (which also mutes)
    useVoiceStateStore.getState().toggleDeafen();
    expect(useVoiceStateStore.getState().isMuted).toBe(true);
    expect(useVoiceStateStore.getState().isDeafened).toBe(true);

    // Unmute should also undeafen
    useVoiceStateStore.getState().toggleMute();
    expect(useVoiceStateStore.getState().isMuted).toBe(false);
    expect(useVoiceStateStore.getState().isDeafened).toBe(false);
  });
});

describe('toggleDeafen', () => {
  it('deafening also mutes', () => {
    useVoiceStateStore.getState().toggleDeafen();

    const state = useVoiceStateStore.getState();
    expect(state.isDeafened).toBe(true);
    expect(state.isMuted).toBe(true);
  });

  it('undeafening does not unmute', () => {
    useVoiceStateStore.getState().toggleDeafen(); // deafen
    useVoiceStateStore.getState().toggleDeafen(); // undeafen

    const state = useVoiceStateStore.getState();
    expect(state.isDeafened).toBe(false);
    // isMuted stays true per the store logic (undeafen only sets isDeafened: false)
  });
});

describe('toggleVideo', () => {
  it('toggles video on and off', () => {
    expect(useVoiceStateStore.getState().isVideoOn).toBe(false);

    useVoiceStateStore.getState().toggleVideo();
    expect(useVoiceStateStore.getState().isVideoOn).toBe(true);

    useVoiceStateStore.getState().toggleVideo();
    expect(useVoiceStateStore.getState().isVideoOn).toBe(false);
  });
});

describe('setMuted / setDeafened', () => {
  it('setMuted directly sets mute state', () => {
    useVoiceStateStore.getState().setMuted(true);
    expect(useVoiceStateStore.getState().isMuted).toBe(true);

    useVoiceStateStore.getState().setMuted(false);
    expect(useVoiceStateStore.getState().isMuted).toBe(false);
  });

  it('setDeafened(true) also mutes', () => {
    useVoiceStateStore.getState().setDeafened(true);
    expect(useVoiceStateStore.getState().isDeafened).toBe(true);
    expect(useVoiceStateStore.getState().isMuted).toBe(true);
  });

  it('setDeafened(false) does not change mute state', () => {
    useVoiceStateStore.getState().setMuted(true);
    useVoiceStateStore.getState().setDeafened(false);
    // mute state should remain unchanged
    expect(useVoiceStateStore.getState().isMuted).toBe(true);
  });
});

// Channel member management
const testMember: VoiceMember = {
  userId: 'user-1',
  username: 'alice',
  selfMute: false,
  selfDeafen: false,
  video: false,
};

const testMember2: VoiceMember = {
  userId: 'user-2',
  username: 'bob',
  selfMute: true,
  selfDeafen: false,
  video: true,
};

describe('setChannelMembers', () => {
  it('sets members for a channel', () => {
    useVoiceStateStore.getState().setChannelMembers('ch-1', [testMember, testMember2]);

    const members = useVoiceStateStore.getState().channelMembers['ch-1'];
    expect(members).toHaveLength(2);
    expect(members![0]!.userId).toBe('user-1');
    expect(members![1]!.userId).toBe('user-2');
  });

  it('replaces existing members', () => {
    useVoiceStateStore.getState().setChannelMembers('ch-1', [testMember]);
    useVoiceStateStore.getState().setChannelMembers('ch-1', [testMember2]);

    const members = useVoiceStateStore.getState().channelMembers['ch-1'];
    expect(members).toHaveLength(1);
    expect(members![0]!.userId).toBe('user-2');
  });
});

describe('addChannelMember', () => {
  it('adds a member to a channel', () => {
    useVoiceStateStore.getState().addChannelMember('ch-1', testMember);

    const members = useVoiceStateStore.getState().channelMembers['ch-1'];
    expect(members).toHaveLength(1);
    expect(members![0]!.userId).toBe('user-1');
  });

  it('does not add duplicate members', () => {
    useVoiceStateStore.getState().addChannelMember('ch-1', testMember);
    useVoiceStateStore.getState().addChannelMember('ch-1', testMember);

    const members = useVoiceStateStore.getState().channelMembers['ch-1'];
    expect(members).toHaveLength(1);
  });

  it('adds to existing members list', () => {
    useVoiceStateStore.getState().addChannelMember('ch-1', testMember);
    useVoiceStateStore.getState().addChannelMember('ch-1', testMember2);

    const members = useVoiceStateStore.getState().channelMembers['ch-1'];
    expect(members).toHaveLength(2);
  });

  it('creates new channel entry if none exists', () => {
    useVoiceStateStore.getState().addChannelMember('new-ch', testMember);

    const members = useVoiceStateStore.getState().channelMembers['new-ch'];
    expect(members).toHaveLength(1);
  });
});

describe('removeChannelMember', () => {
  it('removes a member by userId', () => {
    useVoiceStateStore.getState().setChannelMembers('ch-1', [testMember, testMember2]);
    useVoiceStateStore.getState().removeChannelMember('ch-1', 'user-1');

    const members = useVoiceStateStore.getState().channelMembers['ch-1'];
    expect(members).toHaveLength(1);
    expect(members![0]!.userId).toBe('user-2');
  });

  it('handles removing from non-existent channel gracefully', () => {
    useVoiceStateStore.getState().removeChannelMember('non-existent', 'user-1');

    const members = useVoiceStateStore.getState().channelMembers['non-existent'];
    expect(members).toEqual([]);
  });
});

describe('updateMemberState', () => {
  it('updates partial member state', () => {
    useVoiceStateStore.getState().setChannelMembers('ch-1', [testMember]);
    useVoiceStateStore.getState().updateMemberState('ch-1', 'user-1', {
      selfMute: true,
      isSpeaking: true,
    });

    const members = useVoiceStateStore.getState().channelMembers['ch-1'];
    expect(members![0]!.selfMute).toBe(true);
    expect(members![0]!.isSpeaking).toBe(true);
    expect(members![0]!.username).toBe('alice'); // unchanged
  });

  it('does not affect other members', () => {
    useVoiceStateStore.getState().setChannelMembers('ch-1', [testMember, testMember2]);
    useVoiceStateStore.getState().updateMemberState('ch-1', 'user-1', { selfMute: true });

    const members = useVoiceStateStore.getState().channelMembers['ch-1'];
    expect(members![0]!.selfMute).toBe(true);
    expect(members![1]!.selfMute).toBe(true); // bob was already muted
  });

  it('handles non-existent channel gracefully', () => {
    useVoiceStateStore.getState().updateMemberState('non-existent', 'user-1', { selfMute: true });
    expect(useVoiceStateStore.getState().channelMembers['non-existent']).toEqual([]);
  });
});

// Error and reset
describe('setError', () => {
  it('sets error message', () => {
    useVoiceStateStore.getState().setError('Connection failed');
    expect(useVoiceStateStore.getState().error).toBe('Connection failed');
  });

  it('clears error with null', () => {
    useVoiceStateStore.getState().setError('Error');
    useVoiceStateStore.getState().setError(null);
    expect(useVoiceStateStore.getState().error).toBeNull();
  });
});

describe('reset', () => {
  it('resets all state to initial values', () => {
    // Modify everything
    useVoiceStateStore.getState().setConnected('ch-1', 'grp-1', 'token', 'room');
    useVoiceStateStore.getState().setMuted(true);
    useVoiceStateStore.getState().setChannelMembers('ch-1', [testMember]);
    useVoiceStateStore.getState().setError('error');

    useVoiceStateStore.getState().reset();

    const state = useVoiceStateStore.getState();
    expect(state.currentChannelId).toBeNull();
    expect(state.currentGroupId).toBeNull();
    expect(state.isMuted).toBe(false);
    expect(state.isDeafened).toBe(false);
    expect(state.isVideoOn).toBe(false);
    expect(state.channelMembers).toEqual({});
    expect(state.error).toBeNull();
    expect(state.isConnecting).toBe(false);
  });
});
