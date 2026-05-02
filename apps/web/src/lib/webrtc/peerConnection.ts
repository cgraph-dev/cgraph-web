/**
 * WebRTC Peer Connection & Signaling
 *
 * Handles RTCPeerConnection creation, ICE candidate exchange,
 * and Phoenix Channel signaling events.
 *
 */

import { Channel } from 'phoenix';
import { CallParticipant, CallState, CallEventHandler, ICE_SERVERS } from './types';
import { isRecord } from '@/lib/api-utils/response-extractors';
interface ParticipantJoinedPayload {
  user_id: string;
  user?: CallParticipant;
  participant_id: string;
  device: string;
  media: Record<string, boolean>;
}

function isParticipantJoinedPayload(data: unknown): data is ParticipantJoinedPayload {
  if (!isRecord(data)) return false;
  return typeof data.participant_id === 'string' || typeof data.user_id === 'string';
}

interface SignalOfferPayload {
  from: string;
  sdp: RTCSessionDescriptionInit;
}

function isSignalPayload(data: unknown): data is SignalOfferPayload {
  if (!isRecord(data)) return false;
  return typeof data.from === 'string' && isRecord(data.sdp);
}

interface IceCandidatePayload {
  from: string;
  candidate: RTCIceCandidateInit;
}

function isIceCandidatePayload(data: unknown): data is IceCandidatePayload {
  if (!isRecord(data)) return false;
  return typeof data.from === 'string';
}

/**
 * Create a new RTCPeerConnection for a remote user and wire up
 * ICE candidate, track, and connection-state handlers.
 *
 * If `initiator` is true, an SDP offer is created and sent via the channel.
 */
async function createPeerConnection(
  userId: string,
  initiator: boolean,
  localStream: MediaStream | null,
  channel: Channel | null,
  peerConnections: Map<string, RTCPeerConnection>,
  state: CallState,
  eventHandlers: CallEventHandler,
  iceServers?: RTCIceServer[]
): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection({ iceServers: iceServers ?? ICE_SERVERS });
  peerConnections.set(userId, pc);

  // Add local tracks
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate && channel) {
      channel.push('signal:ice_candidate', {
        to: userId,
        candidate: event.candidate.toJSON(),
      });
    }
  };

  // Handle remote stream
  pc.ontrack = (event) => {
    const remoteStream = event.streams[0];
    if (remoteStream) {
      state.remoteStreams.set(userId, remoteStream);
      eventHandlers.onRemoteStream?.(userId, remoteStream);
    }
  };

  // Handle connection state
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') {
      state.status = 'connected';
      eventHandlers.onCallConnected?.();
    }
  };

  // If initiator, create and send offer
  if (initiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    if (channel) {
      channel.push('signal:offer', { to: userId, sdp: offer });
    }
  }

  return pc;
}

/**
 * Set up Phoenix Channel event handlers for WebRTC signaling.
 *
 * Listens for user_joined, user_left, offer, answer, ice_candidate,
 * and call_ended events.
 */
export function setupChannelHandlers(
  channel: Channel | null,
  localStream: MediaStream | null,
  peerConnections: Map<string, RTCPeerConnection>,
  state: CallState,
  eventHandlers: CallEventHandler,
  endCallFn: () => Promise<void>,
  iceServers?: RTCIceServer[]
): void {
  if (!channel) return;

  // Handle new participant joining
  channel.on('participant:joined', async (data: unknown) => {
    if (!isParticipantJoinedPayload(data)) return;
    const payload = data;
    const participant: CallParticipant = payload.user ?? {
      userId: payload.participant_id,
      username: '',
      avatarUrl: null,
      isMuted: !payload.media?.audio,
      isVideoEnabled: !!payload.media?.video,
      isSpeaking: false,
    };
    state.participants.push(participant);
    eventHandlers.onParticipantJoined?.(participant);

    // Create peer connection for new participant
    await createPeerConnection(
      payload.participant_id || payload.user_id,
      true,
      localStream,
      channel,
      peerConnections,
      state,
      eventHandlers,
      iceServers
    );
  });

  // Handle participant leaving
  channel.on('participant:left', (data: unknown) => {
    if (!isRecord(data) || typeof data.user_id !== 'string') return;
    const payload = { user_id: data.user_id };
    state.participants = state.participants.filter((p) => p.userId !== payload.user_id);
    peerConnections.get(payload.user_id)?.close();
    peerConnections.delete(payload.user_id);
    state.remoteStreams.delete(payload.user_id);
    eventHandlers.onParticipantLeft?.(payload.user_id);
  });

  // Handle incoming offer
  channel.on('signal:offer', async (data: unknown) => {
    if (!isSignalPayload(data)) return;
    const payload = data;
    const pc = await createPeerConnection(
      payload.from,
      false,
      localStream,
      channel,
      peerConnections,
      state,
      eventHandlers,
      iceServers
    );
    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    channel.push('signal:answer', { to: payload.from, sdp: answer });
  });

  // Handle incoming answer
  channel.on('signal:answer', async (data: unknown) => {
    if (!isSignalPayload(data)) return;
    const payload = data;
    const pc = peerConnections.get(payload.from);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }
  });

  // Handle ICE candidate
  channel.on('signal:ice_candidate', async (data: unknown) => {
    if (!isIceCandidatePayload(data)) return;
    const payload = data;
    const pc = peerConnections.get(payload.from);
    if (pc && payload.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  });

  // Handle call ended
  channel.on('call:ended', (data: unknown) => {
    const reason = isRecord(data) && typeof data.reason === 'string' ? data.reason : 'unknown';
    endCallFn();
    eventHandlers.onCallEnded?.(reason);
  });
}
