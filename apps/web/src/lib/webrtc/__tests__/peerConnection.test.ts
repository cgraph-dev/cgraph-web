/**
 * Tests for peerConnection.ts - Type guards and channel handler setup
 *
 * Covers:
 * - Type guard functions (isParticipantJoinedPayload, isSignalPayload, isIceCandidatePayload)
 * - setupChannelHandlers null channel guard
 * - Channel event handler wiring
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Channel } from 'phoenix';
import { setupChannelHandlers } from '../peerConnection';
import type { CallState, CallEventHandler } from '../types';
import { createDefaultCallState } from '../types';

// Mock RTCPeerConnection
const mockPC = {
  addTrack: vi.fn(),
  createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
  createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' }),
  setLocalDescription: vi.fn().mockResolvedValue(undefined),
  setRemoteDescription: vi.fn().mockResolvedValue(undefined),
  addIceCandidate: vi.fn().mockResolvedValue(undefined),
  close: vi.fn(),
  getSenders: vi.fn().mockReturnValue([]),
  onicecandidate: null,
  ontrack: null,
  onconnectionstatechange: null,
  connectionState: 'new',
};

vi.stubGlobal(
  'RTCPeerConnection',
  vi.fn(() => ({ ...mockPC }))
);
vi.stubGlobal('RTCSessionDescription', vi.fn((init: unknown) => init));
vi.stubGlobal('RTCIceCandidate', vi.fn((init: unknown) => init));

// Helpers

function createMockChannel(): Channel & { handlers: Record<string, ((data: unknown) => void)[]> } {
  const handlers: Record<string, ((data: unknown) => void)[]> = {};
  return {
    on: vi.fn((event: string, cb: (data: unknown) => void) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(cb);
    }),
    push: vi.fn().mockReturnValue({ receive: vi.fn().mockReturnThis() }),
    join: vi.fn().mockReturnValue({ receive: vi.fn().mockReturnThis() }),
    leave: vi.fn(),
    handlers,
  } as unknown as Channel & { handlers: Record<string, ((data: unknown) => void)[]> };
}

describe('setupChannelHandlers', () => {
  let channel: ReturnType<typeof createMockChannel>;
  let state: CallState;
  let eventHandlers: CallEventHandler;
  let peerConnections: Map<string, RTCPeerConnection>;
  let endCallFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    channel = createMockChannel();
    state = createDefaultCallState();
    eventHandlers = {
      onParticipantJoined: vi.fn(),
      onParticipantLeft: vi.fn(),
      onCallEnded: vi.fn(),
      onCallConnected: vi.fn(),
      onRemoteStream: vi.fn(),
      onError: vi.fn(),
    };
    peerConnections = new Map();
    endCallFn = vi.fn().mockResolvedValue(undefined);
  });

  it('does nothing when channel is null', () => {
    // Should not throw
    setupChannelHandlers(null, null, peerConnections, state, eventHandlers, endCallFn);
    expect(peerConnections.size).toBe(0);
  });

  it('registers all expected event handlers on channel', () => {
    setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

    expect(channel.on).toHaveBeenCalledWith('participant:joined', expect.any(Function));
    expect(channel.on).toHaveBeenCalledWith('participant:left', expect.any(Function));
    expect(channel.on).toHaveBeenCalledWith('signal:offer', expect.any(Function));
    expect(channel.on).toHaveBeenCalledWith('signal:answer', expect.any(Function));
    expect(channel.on).toHaveBeenCalledWith('signal:ice_candidate', expect.any(Function));
    expect(channel.on).toHaveBeenCalledWith('call:ended', expect.any(Function));
  });

  describe('participant:joined handler', () => {
    it('ignores invalid payloads', async () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      // Trigger with invalid data
      const handler = channel.handlers['participant:joined']![0]!;
      await handler('not-an-object');
      await handler(null);
      await handler({ no_user_id: true });

      expect(eventHandlers.onParticipantJoined).not.toHaveBeenCalled();
    });

    it('handles valid participant joined payload', async () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const handler = channel.handlers['participant:joined']![0]!;
      await handler({
        participant_id: 'user-123',
        user_id: 'user-123',
        device: 'web',
        media: { audio: true, video: false },
      });

      expect(eventHandlers.onParticipantJoined).toHaveBeenCalled();
      expect(state.participants).toHaveLength(1);
      expect(state.participants[0]!.userId).toBe('user-123');
    });
  });

  describe('participant:left handler', () => {
    it('ignores invalid payloads', () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const handler = channel.handlers['participant:left']![0]!;
      handler('not-an-object');
      handler({ no_user_id: 123 });

      expect(eventHandlers.onParticipantLeft).not.toHaveBeenCalled();
    });

    it('removes participant and closes peer connection', () => {
      const mockPc = { close: vi.fn() } as unknown as RTCPeerConnection;
      peerConnections.set('user-456', mockPc);
      state.participants = [
        { userId: 'user-456', username: 'test', avatarUrl: null, isMuted: false, isVideoEnabled: true, isSpeaking: false },
      ];
      state.remoteStreams.set('user-456', {} as MediaStream);

      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const handler = channel.handlers['participant:left']![0]!;
      handler({ user_id: 'user-456' });

      expect(mockPc.close).toHaveBeenCalled();
      expect(peerConnections.has('user-456')).toBe(false);
      expect(state.participants).toHaveLength(0);
      expect(state.remoteStreams.has('user-456')).toBe(false);
      expect(eventHandlers.onParticipantLeft).toHaveBeenCalledWith('user-456');
    });
  });

  describe('signal:offer handler', () => {
    it('ignores invalid payloads', async () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const handler = channel.handlers['signal:offer']![0]!;
      await handler('not-an-object');
      await handler({ from: 123 }); // from not string
      await handler({ from: 'user', sdp: 'not-object' }); // sdp not record

      // No peer connections should be created
      expect(peerConnections.size).toBe(0);
    });
  });

  describe('signal:answer handler', () => {
    it('ignores invalid payloads', async () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const handler = channel.handlers['signal:answer']![0]!;
      await handler(null);
      await handler({ from: 123 });

      // Should not throw
    });
  });

  describe('signal:ice_candidate handler', () => {
    it('ignores invalid payloads', async () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const handler = channel.handlers['signal:ice_candidate']![0]!;
      await handler(null);
      await handler({ from: 123 });

      // Should not throw
    });
  });

  describe('call:ended handler', () => {
    it('calls endCallFn and event handler with reason', () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const handler = channel.handlers['call:ended']![0]!;
      handler({ reason: 'timeout' });

      expect(endCallFn).toHaveBeenCalled();
      expect(eventHandlers.onCallEnded).toHaveBeenCalledWith('timeout');
    });

    it('defaults reason to unknown for invalid payloads', () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const handler = channel.handlers['call:ended']![0]!;
      handler(null);

      expect(endCallFn).toHaveBeenCalled();
      expect(eventHandlers.onCallEnded).toHaveBeenCalledWith('unknown');
    });

    it('defaults reason to unknown for non-string reason', () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const handler = channel.handlers['call:ended']![0]!;
      handler({ reason: 42 });

      expect(eventHandlers.onCallEnded).toHaveBeenCalledWith('unknown');
    });
  });
});
