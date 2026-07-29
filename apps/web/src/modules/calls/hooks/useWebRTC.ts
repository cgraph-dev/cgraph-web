/**
 * React Hook for WebRTC Call Management
 *
 * Provides a React-friendly interface to the WebRTC system for voice and video calls.
 * Handles call lifecycle, media streams, and WebSocket signaling.
 *
 */

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/lib/socket';
import { WebRTCManager, CallState, CallEventHandler } from '@/lib/webrtc/webrtcService';
import { toast } from '@/shared/components/ui';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/modules/auth/store';
import { useSettingsStore } from '@/modules/settings/store';

export interface UseWebRTCOptions {
  conversationId?: string;
  onCallConnected?: () => void;
  onCallEnded?: (reason: string) => void;
  onError?: (error: string) => void;
}

export interface UseWebRTCReturn {
  /** Current call state */
  callState: CallState;
  /** Local video stream (for self-view) */
  localStream: MediaStream | null;
  /** Remote video stream (for other participant — first remote stream for 1:1 compat) */
  remoteStream: MediaStream | null;
  /** All remote streams keyed by userId (for group calls) */
  remoteStreams: Map<string, MediaStream>;
  /** Start a voice or video call */
  startCall: (
    targetUserId: string,
    options?: { video?: boolean; audio?: boolean }
  ) => Promise<void>;
  /** Answer an incoming call */
  answerCall: (roomId: string, options?: { video?: boolean; audio?: boolean }) => Promise<void>;
  /** End the current call */
  endCall: () => Promise<void>;
  /** Toggle mute state */
  toggleMute: () => boolean;
  /** Toggle video state */
  toggleVideo: () => boolean;
  /** Start screen sharing */
  startScreenShare: () => Promise<boolean>;
  /** Stop screen sharing */
  stopScreenShare: () => Promise<void>;
  /** Check if call is active */
  isCallActive: boolean;
  /** Check if currently connecting */
  isConnecting: boolean;
}

/**
 * Hook for managing WebRTC voice and video calls
 *
 * @example
 * ```tsx
 * const { startCall, endCall, toggleMute, callState } = useWebRTC({
 *   conversationId: '123',
 *   onCallConnected: () => console.log('Call connected!'),
 *   onCallEnded: (reason) => console.log('Call ended:', reason)
 * });
 *
 * // Start video call
 * await startCall(otherUserId, { video: true, audio: true });
 * ```
 */
export function useWebRTC(options: UseWebRTCOptions = {}): UseWebRTCReturn {
  const { conversationId: _conversationId, onCallConnected, onCallEnded, onError } = options;
  const socketManager = useSocket();
  const token = useAuthStore((state) => state.token);
  const callSettings = useSettingsStore((state) => state.settings.calls);
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);
  const isEndingRef = useRef(false);

  // Stable refs for callbacks to avoid re-running the setup effect
  const onCallConnectedRef = useRef(onCallConnected);
  const onCallEndedRef = useRef(onCallEnded);
  const onErrorRef = useRef(onError);
  onCallConnectedRef.current = onCallConnected;
  onCallEndedRef.current = onCallEnded;
  onErrorRef.current = onError;

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

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Initialize WebRTC manager once the authenticated socket is available.
  useEffect(() => {
    let isCurrent = true;

    const initializeManager = async () => {
      if (!socketManager.getSocket() && token) {
        await socketManager.connect();
      }

      if (!isCurrent) return;

      const socket = socketManager.getSocket();
      if (!socket) {
        logger.warn('Socket not available for WebRTC initialization');
        return;
      }

      if (webrtcManagerRef.current) return;

      webrtcManagerRef.current = new WebRTCManager(socket);

      // Register event handlers (use refs so callbacks are always current)
      const handlers: CallEventHandler = {
        onCallConnected: () => {
          logger.log('WebRTC call connected');
          toast.success('Call connected');
          onCallConnectedRef.current?.();
          // Update state from manager
          setCallState(webrtcManagerRef.current!.getState());
        },
        onCallEnded: (reason: string) => {
          logger.log('WebRTC call ended:', reason);
          onCallEndedRef.current?.(reason);
          // Update state from manager
          setCallState(webrtcManagerRef.current!.getState());
        },
        onRemoteStream: (userId: string, stream: MediaStream) => {
          logger.log('Received remote stream from:', userId);
          setRemoteStream(stream);
          // Update state from manager
          setCallState(webrtcManagerRef.current!.getState());
        },
        onError: (error: string) => {
          logger.error('WebRTC error:', error);
          // Don't toast here — let the consuming component decide what to show
          onErrorRef.current?.(error);
          // Update state from manager
          setCallState(webrtcManagerRef.current!.getState());
        },
      };

      webrtcManagerRef.current.on(handlers);
    };

    initializeManager().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to initialize WebRTC manager:', error);
      onErrorRef.current?.(message);
      setCallState((prev) => ({ ...prev, error: message }));
    });

    return () => {
      isCurrent = false;
      // Only clean up the manager if we're truly unmounting, not on callback changes.
      // The manager persists in the ref and is cleaned up when the component unmounts.
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.endCall();
        webrtcManagerRef.current = null;
      }
    };
  }, [socketManager, token]);

  /**
   * Start a new call with a target user
   */
  const startCall = async (
      targetUserId: string,
      callOptions: { video?: boolean; audio?: boolean } = { video: true, audio: true }
    ) => {
      if (!webrtcManagerRef.current) {
        toast.error('WebRTC not initialized');
        return;
      }

      try {
        logger.log('Starting call to:', targetUserId, 'options:', callOptions);
        const roomId = await webrtcManagerRef.current.startCall(
          targetUserId,
          callOptions,
          callSettings
        );

        if (roomId) {
          logger.log('Call initiated, room ID:', roomId);
          // Update state from manager
          setCallState(webrtcManagerRef.current.getState());
        }
        // If roomId is null, onError callback already fired from WebRTCManager
      } catch (error) {
        logger.error('Failed to start call:', error);
        // Only toast if onError didn't already handle it
        if (!onErrorRef.current) {
          toast.error('Failed to start call');
        }
      }
    };

  /**
   * Answer an incoming call
   */
  const answerCall = async (
      roomId: string,
      callOptions: { video?: boolean; audio?: boolean } = { video: true, audio: true }
    ) => {
      if (!webrtcManagerRef.current) {
        toast.error('WebRTC not initialized');
        return;
      }

      try {
        logger.log('Answering call, room ID:', roomId, 'options:', callOptions);
        const success = await webrtcManagerRef.current.answerCall(roomId, callOptions, callSettings);

        if (success) {
          logger.log('Call answered successfully');
          // Update state from manager
          setCallState(webrtcManagerRef.current.getState());
        } else {
          toast.error('Failed to answer call');
        }
      } catch (error) {
        logger.error('Failed to answer call:', error);
        toast.error('Failed to answer call');
      }
    };

  /**
   * End the current call (with re-entrancy guard to prevent mutual recursion
   * with onCallEnded callbacks)
   */
  const endCall = async () => {
    if (!webrtcManagerRef.current || isEndingRef.current) return;

    isEndingRef.current = true;
    try {
      logger.log('Ending call');
      await webrtcManagerRef.current.endCall();
      setRemoteStream(null);
      // Update state from manager
      if (webrtcManagerRef.current) {
        setCallState(webrtcManagerRef.current.getState());
      }
    } catch (error) {
      logger.error('Failed to end call:', error);
    } finally {
      isEndingRef.current = false;
    }
  };

  /**
   * Toggle mute state
   */
  const toggleMute = (): boolean => {
    if (!webrtcManagerRef.current) return false;

    const isMuted = webrtcManagerRef.current.toggleMute();
    logger.log('Mute toggled:', isMuted);
    // Update state from manager
    setCallState(webrtcManagerRef.current.getState());
    return isMuted;
  };

  /**
   * Toggle video state
   */
  const toggleVideo = (): boolean => {
    if (!webrtcManagerRef.current) return false;

    const isVideoOn = webrtcManagerRef.current.toggleVideo();
    logger.log('Video toggled:', isVideoOn);
    // Update state from manager
    setCallState(webrtcManagerRef.current.getState());
    return isVideoOn;
  };

  /**
   * Start screen sharing
   */
  const startScreenShare = async (): Promise<boolean> => {
    if (!webrtcManagerRef.current) return false;

    try {
      const success = await webrtcManagerRef.current.startScreenShare();
      if (success) {
        logger.log('Screen sharing started');
        toast.success('Screen sharing started');
      }
      // Update state from manager
      setCallState(webrtcManagerRef.current.getState());
      return success;
    } catch (error) {
      logger.error('Failed to start screen share:', error);
      toast.error('Failed to share screen');
      return false;
    }
  };

  /**
   * Stop screen sharing
   */
  const stopScreenShare = async () => {
    if (!webrtcManagerRef.current) return;

    await webrtcManagerRef.current.stopScreenShare();
    logger.log('Screen sharing stopped');
    toast.info('Screen sharing stopped');
    // Update state from manager
    setCallState(webrtcManagerRef.current.getState());
  };

  // Derived state
  const isCallActive = callState.status === 'connected' || callState.status === 'connecting';
  const isConnecting = callState.status === 'connecting' || callState.status === 'ringing';

  return {
    callState,
    localStream: callState.localStream,
    remoteStream,
    remoteStreams: callState.remoteStreams,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    isCallActive,
    isConnecting,
  };
}
