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

// Mock RTCPeerConnection while keeping each instance inspectable.
const peerConnectionInstances: MockPeerConnection[] = [];

class MockPeerConnection {
  readonly config?: RTCConfiguration;
  addTrack = vi.fn();
  createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
  createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer-sdp' });
  setLocalDescription = vi.fn().mockResolvedValue(undefined);
  setRemoteDescription = vi.fn().mockResolvedValue(undefined);
  addIceCandidate = vi.fn().mockResolvedValue(undefined);
  close = vi.fn();
  getSenders = vi.fn().mockReturnValue([]);
  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null;
  ontrack: ((event: RTCTrackEvent) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  connectionState: RTCPeerConnectionState = 'new';

  constructor(config?: RTCConfiguration) {
    this.config = config;
    peerConnectionInstances.push(this);
  }
}

vi.stubGlobal('RTCPeerConnection', vi.fn((config?: RTCConfiguration) => new MockPeerConnection(config)));
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
    peerConnectionInstances.length = 0;
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

    it('creates a peer connection with backend ICE, local tracks, and an outbound offer', async () => {
      const audioTrack = { kind: 'audio' } as MediaStreamTrack;
      const videoTrack = { kind: 'video' } as MediaStreamTrack;
      const localStream = {
        getTracks: vi.fn(() => [audioTrack, videoTrack]),
      } as unknown as MediaStream;
      const iceServers: RTCIceServer[] = [
        {
          urls: 'turn:turn.cgraph.test:3478',
          username: 'turn-user',
          credential: 'turn-secret',
        },
      ];

      setupChannelHandlers(
        channel,
        localStream,
        peerConnections,
        state,
        eventHandlers,
        endCallFn,
        iceServers
      );

      const handler = channel.handlers['participant:joined']![0]!;
      await handler({
        participant_id: 'user-123',
        user_id: 'user-123',
        device: 'web',
        media: { audio: true, video: true },
      });

      const pc = peerConnectionInstances[0]!;
      expect(pc.config).toEqual({ iceServers });
      expect(pc.addTrack).toHaveBeenCalledWith(audioTrack, localStream);
      expect(pc.addTrack).toHaveBeenCalledWith(videoTrack, localStream);
      expect(pc.createOffer).toHaveBeenCalled();
      expect(pc.setLocalDescription).toHaveBeenCalledWith({ type: 'offer', sdp: 'mock-sdp' });
      expect(channel.push).toHaveBeenCalledWith('signal:offer', {
        to: 'user-123',
        sdp: { type: 'offer', sdp: 'mock-sdp' },
      });
      expect(peerConnections.get('user-123')).toBe(pc);
    });

    it('routes ICE candidates, remote streams, and connected state from the peer connection', async () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const handler = channel.handlers['participant:joined']![0]!;
      await handler({
        participant_id: 'user-123',
        user_id: 'user-123',
        device: 'web',
        media: { audio: true, video: true },
      });

      const pc = peerConnectionInstances[0]!;
      const candidate = { toJSON: () => ({ candidate: 'ice-candidate' }) };
      pc.onicecandidate?.({ candidate } as RTCPeerConnectionIceEvent);
      expect(channel.push).toHaveBeenCalledWith('signal:ice_candidate', {
        to: 'user-123',
        candidate: { candidate: 'ice-candidate' },
      });

      const remoteStream = {} as MediaStream;
      pc.ontrack?.({ streams: [remoteStream] } as unknown as RTCTrackEvent);
      expect(state.remoteStreams.get('user-123')).toBe(remoteStream);
      expect(eventHandlers.onRemoteStream).toHaveBeenCalledWith('user-123', remoteStream);

      pc.connectionState = 'connected';
      pc.onconnectionstatechange?.();
      expect(state.status).toBe('connected');
      expect(eventHandlers.onCallConnected).toHaveBeenCalled();
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

    it('answers valid remote offers through the same signaling channel', async () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const handler = channel.handlers['signal:offer']![0]!;
      await handler({
        from: 'user-456',
        sdp: { type: 'offer', sdp: 'remote-sdp' },
      });

      const pc = peerConnectionInstances[0]!;
      expect(pc.setRemoteDescription).toHaveBeenCalledWith({ type: 'offer', sdp: 'remote-sdp' });
      expect(pc.createAnswer).toHaveBeenCalled();
      expect(pc.setLocalDescription).toHaveBeenCalledWith({
        type: 'answer',
        sdp: 'mock-answer-sdp',
      });
      expect(channel.push).toHaveBeenCalledWith('signal:answer', {
        to: 'user-456',
        sdp: { type: 'answer', sdp: 'mock-answer-sdp' },
      });
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

    it('applies a valid remote answer to the existing peer connection', async () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const joined = channel.handlers['participant:joined']![0]!;
      await joined({
        participant_id: 'user-123',
        user_id: 'user-123',
        device: 'web',
        media: { audio: true, video: true },
      });

      const answer = channel.handlers['signal:answer']![0]!;
      await answer({
        from: 'user-123',
        sdp: { type: 'answer', sdp: 'remote-answer-sdp' },
      });

      expect(peerConnectionInstances[0]!.setRemoteDescription).toHaveBeenCalledWith({
        type: 'answer',
        sdp: 'remote-answer-sdp',
      });
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

    it('applies a valid remote ICE candidate to the matching peer connection', async () => {
      setupChannelHandlers(channel, null, peerConnections, state, eventHandlers, endCallFn);

      const joined = channel.handlers['participant:joined']![0]!;
      await joined({
        participant_id: 'user-123',
        user_id: 'user-123',
        device: 'web',
        media: { audio: true, video: true },
      });

      const iceCandidate = channel.handlers['signal:ice_candidate']![0]!;
      await iceCandidate({
        from: 'user-123',
        candidate: { candidate: 'remote-candidate' },
      });

      expect(peerConnectionInstances[0]!.addIceCandidate).toHaveBeenCalledWith({
        candidate: 'remote-candidate',
      });
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
