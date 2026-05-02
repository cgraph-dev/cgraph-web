/**
 * Tests for webrtc/types.ts
 *
 * Covers:
 * - createDefaultCallState factory
 * - ICE_SERVERS configuration
 */
import { describe, it, expect } from 'vitest';
import { createDefaultCallState, ICE_SERVERS } from '../types';

describe('createDefaultCallState', () => {
  it('returns a fresh state with idle status', () => {
    const state = createDefaultCallState();
    expect(state.status).toBe('idle');
    expect(state.roomId).toBeNull();
    expect(state.isMuted).toBe(false);
    expect(state.isVideoEnabled).toBe(true);
    expect(state.isScreenSharing).toBe(false);
    expect(state.error).toBeNull();
  });

  it('returns empty participants array', () => {
    const state = createDefaultCallState();
    expect(state.participants).toEqual([]);
  });

  it('returns null localStream', () => {
    const state = createDefaultCallState();
    expect(state.localStream).toBeNull();
  });

  it('returns empty remoteStreams map', () => {
    const state = createDefaultCallState();
    expect(state.remoteStreams).toBeInstanceOf(Map);
    expect(state.remoteStreams.size).toBe(0);
  });

  it('returns unique instances each call', () => {
    const state1 = createDefaultCallState();
    const state2 = createDefaultCallState();

    expect(state1).not.toBe(state2);
    expect(state1.participants).not.toBe(state2.participants);
    expect(state1.remoteStreams).not.toBe(state2.remoteStreams);
  });
});

describe('ICE_SERVERS', () => {
  it('contains at least Google STUN servers', () => {
    expect(ICE_SERVERS.length).toBeGreaterThanOrEqual(2);

    const stunUrls = ICE_SERVERS.map((s) =>
      typeof s.urls === 'string' ? s.urls : (s.urls as string[])[0]
    );
    expect(stunUrls).toContain('stun:stun.l.google.com:19302');
    expect(stunUrls).toContain('stun:stun1.l.google.com:19302');
  });

  it('each server has a urls property', () => {
    for (const server of ICE_SERVERS) {
      expect(server).toHaveProperty('urls');
    }
  });
});
