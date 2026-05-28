/**
 * WebRTC Call Hook
 *
 * React hook for managing voice and video calls.
 *
 * @example
 * ```tsx
 * function CallComponent() {
 *   const {
 *     startCall,
 *     answerCall,
 *     endCall,
 *     toggleMute,
 *     toggleVideo,
 *     callState,
 *     localStream,
 *     remoteStreams,
 *   } = useCall();
 *
 *   return (
 *     <div>
 *       <video ref={(el) => el && (el.srcObject = localStream)} autoPlay muted />
 *       {Array.from(remoteStreams.entries()).map(([id, stream]) => (
 *         <video key={id} ref={(el) => el && (el.srcObject = stream)} autoPlay />
 *       ))}
 *       <button onClick={() => startCall('user-123', { video: true })}>
 *         Start Call
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 */

import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/socket';
import { useAuthStore } from '@/modules/auth/store';
import {
  WebRTCManager,
  getWebRTCManager,
  destroyWebRTCManager,
  CallState,
  CallParticipant,
} from './webrtcService';

export interface UseCallReturn {
  /** Current call state */
  callState: CallState;
  /** Local media stream */
  localStream: MediaStream | null;
  /** Map of remote streams by user ID */
  remoteStreams: Map<string, MediaStream>;
  /** List of call participants */
  participants: CallParticipant[];
  /** Whether user is muted */
  isMuted: boolean;
  /** Whether video is enabled */
  isVideoEnabled: boolean;
  /** Whether screen sharing is active */
  isScreenSharing: boolean;
  /** Start a new call */
  startCall: (
    targetUserId: string,
    options?: { video?: boolean; audio?: boolean }
  ) => Promise<string | null>;
  /** Answer incoming call */
  answerCall: (roomId: string, options?: { video?: boolean; audio?: boolean }) => Promise<boolean>;
  /** End current call */
  endCall: () => Promise<void>;
  /** Toggle mute state */
  toggleMute: () => boolean;
  /** Toggle video state */
  toggleVideo: () => boolean;
  /** Start screen sharing */
  startScreenShare: () => Promise<boolean>;
  /** Stop screen sharing */
  stopScreenShare: () => Promise<void>;
  /** Incoming call info (if ringing) */
  incomingCall: { callerId: string; callerName: string; roomId: string } | null;
  /** Accept incoming call */
  acceptIncomingCall: (options?: { video?: boolean; audio?: boolean }) => Promise<boolean>;
  /** Reject incoming call */
  rejectIncomingCall: () => void;
}

/**
 * Hook for managing WebRTC voice and video calls
 */
export function useCall(): UseCallReturn {
  const socketManager = useSocket();
  const token = useAuthStore((state) => state.token);
  const [manager, setManager] = useState<WebRTCManager | null>(null);
  const [callState, setCallState] = useState<CallState>({
    roomId: null,
    status: 'idle',
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    isMuted: false,
    isVideoEnabled: true,
    isScreenSharing: false,
    error: null,
  });
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    roomId: string;
  } | null>(null);

  // Initialize manager when socket is available
  useEffect(() => {
    let isCurrent = true;

    const initializeManager = async () => {
      if (!socketManager.getSocket() && token) {
        await socketManager.connect();
      }

      if (!isCurrent) return;

      const socket = socketManager.getSocket();
      if (!socket) return;

      const rtcManager = getWebRTCManager(socket);
      setManager(rtcManager);

      // Set up event handlers
      rtcManager.on({
        onIncomingCall: (callerId, callerName, roomId) => {
          setIncomingCall({ callerId, callerName, roomId });
        },
        onCallConnected: () => {
          setCallState((prev) => ({ ...prev, status: 'connected' }));
        },
        onCallEnded: () => {
          setCallState((prev) => ({ ...prev, status: 'ended' }));
          setIncomingCall(null);
        },
        onParticipantJoined: () => {
          setCallState(rtcManager.getState());
        },
        onParticipantLeft: () => {
          setCallState(rtcManager.getState());
        },
        onRemoteStream: () => {
          setCallState(rtcManager.getState());
        },
        onError: (error) => {
          setCallState((prev) => ({ ...prev, error }));
        },
      });
    };

    initializeManager().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      setCallState((prev) => ({ ...prev, error: message }));
    });

    return () => {
      isCurrent = false;
      destroyWebRTCManager();
    };
  }, [socketManager, token]);

  async function startCall(
    targetUserId: string,
    options: { video?: boolean; audio?: boolean } = { video: true, audio: true }
  ): Promise<string | null> {
    if (!manager) return null;
    const roomId = await manager.startCall(targetUserId, options);
    setCallState(manager.getState());
    return roomId;
  }

  async function answerCall(
    roomId: string,
    options: { video?: boolean; audio?: boolean } = { video: true, audio: true }
  ): Promise<boolean> {
    if (!manager) return false;
    const success = await manager.answerCall(roomId, options);
    setCallState(manager.getState());
    return success;
  }

  async function endCall(): Promise<void> {
    if (!manager) return;
    await manager.endCall();
    setCallState(manager.getState());
  }

  function toggleMute(): boolean {
    if (!manager) return false;
    const isMuted = manager.toggleMute();
    setCallState((prev) => ({ ...prev, isMuted }));
    return isMuted;
  }

  function toggleVideo(): boolean {
    if (!manager) return true;
    const isVideoEnabled = manager.toggleVideo();
    setCallState((prev) => ({ ...prev, isVideoEnabled }));
    return isVideoEnabled;
  }

  async function startScreenShare(): Promise<boolean> {
    if (!manager) return false;
    const success = await manager.startScreenShare();
    setCallState((prev) => ({ ...prev, isScreenSharing: success }));
    return success;
  }

  async function stopScreenShare(): Promise<void> {
    if (!manager) return;
    await manager.stopScreenShare();
    setCallState((prev) => ({ ...prev, isScreenSharing: false }));
  }

  async function acceptIncomingCall(options?: { video?: boolean; audio?: boolean }): Promise<boolean> {
    if (!incomingCall) return false;
    const success = await answerCall(incomingCall.roomId, options);
    if (success) {
      setIncomingCall(null);
    }
    return success;
  }

  function rejectIncomingCall() {
    setIncomingCall(null);
    // Could send rejection to server here
  }

  return {
    callState,
    localStream: callState.localStream,
    remoteStreams: callState.remoteStreams,
    participants: callState.participants,
    isMuted: callState.isMuted,
    isVideoEnabled: callState.isVideoEnabled,
    isScreenSharing: callState.isScreenSharing,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    incomingCall,
    acceptIncomingCall,
    rejectIncomingCall,
  };
}

export default useCall;
