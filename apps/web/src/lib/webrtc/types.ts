/**
 * WebRTC Types and Constants
 *
 * Shared types, interfaces, and configuration for the WebRTC module.
 *
 */

export interface CallParticipant {
  userId: string;
  username: string;
  avatarUrl: string | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeaking: boolean;
}

export interface CallState {
  roomId: string | null;
  status: 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended';
  participants: CallParticipant[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  error: string | null;
}

export type CallEventHandler = {
  onIncomingCall?: (callerId: string, callerName: string, roomId: string) => void;
  onCallConnected?: () => void;
  onCallEnded?: (reason: string) => void;
  onParticipantJoined?: (participant: CallParticipant) => void;
  onParticipantLeft?: (userId: string) => void;
  onRemoteStream?: (userId: string, stream: MediaStream) => void;
  onError?: (error: string) => void;
};

/** Build ICE servers list from env vars + STUN fallbacks */
function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  // Add TURN server from env if configured
  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUser = import.meta.env.VITE_TURN_USERNAME;
  const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: turnUser || undefined,
      credential: turnCred || undefined,
    });
  }

  return servers;
}

export const ICE_SERVERS: RTCIceServer[] = buildIceServers();

/**
 * Creates a fresh default CallState
 */
export function createDefaultCallState(): CallState {
  return {
    roomId: null,
    status: 'idle',
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    isMuted: false,
    isVideoEnabled: true,
    isScreenSharing: false,
    error: null,
  };
}
