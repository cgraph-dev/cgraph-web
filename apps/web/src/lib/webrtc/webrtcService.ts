/**
 * WebRTC Service
 *
 * Handles peer-to-peer voice and video calls using WebRTC.
 * Connects to Phoenix Channel for signaling.
 *
 */

import { Channel, Socket } from 'phoenix';
import { DEFAULT_CALLS_SETTINGS, type CallsSettings } from '@cgraph-dev/shared-types';
import { CallState, CallEventHandler, createDefaultCallState } from './types';
import { setupChannelHandlers } from './peerConnection';
import { isRecord } from '@/lib/api-utils/response-extractors';

// Re-export types so existing direct imports still work
export type { CallParticipant, CallState, CallEventHandler } from './types';

/**
 * WebRTC Call Manager
 *
 * Manages the complete lifecycle of voice/video calls including:
 * - Signaling via Phoenix Channels
 * - Peer connection management
 * - Media stream handling
 * - Multi-party call support (up to 10 participants via mesh)
 */
export class WebRTCManager {
  private socket: Socket | null = null;
  private channel: Channel | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private eventHandlers: CallEventHandler = {};
  private state: CallState = createDefaultCallState();
  private iceServers: RTCIceServer[] | undefined;

  /** Initialize WebRTC manager with Phoenix socket */
  constructor(socket: Socket) {
    this.socket = socket;
  }

  /** Register event handlers */
  on(handlers: CallEventHandler): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /** Get current call state */
  getState(): CallState {
    return { ...this.state };
  }

  /** Start a new call */
  async startCall(
    targetUserId: string,
    options: { video?: boolean; audio?: boolean } = { video: true, audio: true },
    callSettings: CallsSettings = DEFAULT_CALLS_SETTINGS
  ): Promise<string | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        getMediaConstraints(options, callSettings)
      );
      this.state.localStream = this.localStream;
      this.state.isVideoEnabled = options.video ?? true;
      this.state.status = 'ringing';

      if (!this.socket) {
        throw new Error('WebRTC socket not initialized');
      }

      // Create call room via lobby channel
      const lobbyChannel = this.socket.channel('webrtc:lobby', {});
      await new Promise((resolve, reject) => {
        lobbyChannel
          .join()
          .receive('ok', () => resolve(undefined))
          .receive('error', (reason) => reject(new Error(JSON.stringify(reason))));
      });

      const rawResponse = await new Promise<unknown>(
        (resolve, reject) => {
          lobbyChannel
            .push('create_room', {
              target_ids: [targetUserId],
              type: options.video ? 'video' : 'audio',
            })
            .receive('ok', (resp) => resolve(resp))
            .receive('error', (reason) => reject(new Error(JSON.stringify(reason))));
        }
      );

      lobbyChannel.leave();

      if (!isRecord(rawResponse) || typeof rawResponse.room_id !== 'string') {
        throw new Error('Invalid create_room response');
      }

      const roomId = rawResponse.room_id;
      this.state.roomId = roomId;

      // Use backend-provided ICE servers (includes TURN) when available
      if (Array.isArray(rawResponse.ice_servers) && rawResponse.ice_servers.length > 0) {
        this.iceServers = rawResponse.ice_servers.filter(
          (s): s is RTCIceServer => isRecord(s) && (typeof s.urls === 'string' || Array.isArray(s.urls))
        );
      }

      if (!this.socket) {
        throw new Error('WebRTC socket not initialized');
      }
      this.channel = this.socket.channel(`call:${roomId}`, {
        device: 'web',
        media: { audio: options.audio ?? true, video: options.video ?? true },
      });
      await this.joinChannel();
      this.wireChannelHandlers();

      return roomId;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to start call';
      this.state.status = 'idle';
      this.eventHandlers.onError?.(this.state.error);
      return null;
    }
  }

  /** Answer an incoming call */
  async answerCall(
    roomId: string,
    options: { video?: boolean; audio?: boolean } = { video: true, audio: true },
    callSettings: CallsSettings = DEFAULT_CALLS_SETTINGS
  ): Promise<boolean> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        getMediaConstraints(options, callSettings)
      );
      this.state.localStream = this.localStream;
      this.state.roomId = roomId;
      this.state.status = 'connecting';
      this.state.isVideoEnabled = options.video ?? true;

      if (!this.socket) {
        throw new Error('WebRTC socket not initialized');
      }

      this.channel = this.socket.channel(`call:${roomId}`, {
        device: 'web',
        media: { audio: options.audio ?? true, video: options.video ?? true },
      });
      await this.joinChannel();
      this.wireChannelHandlers();

      return true;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to answer call';
      this.state.status = 'idle';
      this.eventHandlers.onError?.(this.state.error);
      return false;
    }
  }

  /** End the current call */
  async endCall(): Promise<void> {
    await this.cleanupCall();
    this.eventHandlers.onCallEnded?.('user_ended');
  }

  private async cleanupCall(): Promise<void> {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.channel?.leave();
    this.channel = null;

    this.state = { ...createDefaultCallState(), status: 'ended' };
  }

  /** Toggle mute state */
  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.state.isMuted = !audioTrack.enabled;
      }
    }
    return this.state.isMuted;
  }

  /** Toggle video state */
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.state.isVideoEnabled = videoTrack.enabled;
      }
    }
    return this.state.isVideoEnabled;
  }

  /** Start screen sharing */
  async startScreenShare(): Promise<boolean> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return false;

      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      this.state.isScreenSharing = true;
      return true;
    } catch {
      return false;
    }
  }

  /** Stop screen sharing */
  async stopScreenShare(): Promise<void> {
    if (this.localStream && this.state.isScreenSharing) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        this.peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
      this.state.isScreenSharing = false;
    }
  }
  private async joinChannel(): Promise<Record<string, unknown>> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    return new Promise((resolve, reject) => {
      this.channel!.join()
        .receive('ok', (resp: unknown) => {
          // Capture ICE servers from call channel join response
          const response = isRecord(resp) ? resp : {};
          if (Array.isArray(response.ice_servers) && response.ice_servers.length > 0) {
            this.iceServers = response.ice_servers.filter(
              (s): s is RTCIceServer => isRecord(s) && (typeof s.urls === 'string' || Array.isArray(s.urls))
            );
          }
          resolve(response);
        })
        .receive('error', (reason) => reject(new Error(JSON.stringify(reason))));
    });
  }

  private wireChannelHandlers(): void {
    setupChannelHandlers(
      this.channel,
      this.localStream,
      this.peerConnections,
      this.state,
      this.eventHandlers,
      () => this.cleanupCall(),
      this.iceServers
    );
  }
}

function getMediaConstraints(
  options: { video?: boolean; audio?: boolean },
  callSettings: CallsSettings
): MediaStreamConstraints {
  return {
    video: options.video === false ? false : getVideoConstraints(callSettings.defaultVideoResolution),
    audio:
      options.audio === false
        ? false
        : {
            echoCancellation: callSettings.echoCancellation,
            noiseSuppression: callSettings.noiseSuppression,
            autoGainControl: callSettings.autoGainControl,
          },
  };
}

function getVideoConstraints(
  preference: CallsSettings['defaultVideoResolution']
): true | MediaTrackConstraints {
  switch (preference) {
    case '720p':
      return { width: { ideal: 1280 }, height: { ideal: 720 } };
    case '1080p':
      return { width: { ideal: 1920 }, height: { ideal: 1080 } };
    case 'auto':
      return true;
  }
}

// Singleton instance
let webrtcManager: WebRTCManager | null = null;

/** Get or create WebRTC manager instance */
export function getWebRTCManager(socket: Socket): WebRTCManager {
  if (!webrtcManager) {
    webrtcManager = new WebRTCManager(socket);
  }
  return webrtcManager;
}

/** Destroy WebRTC manager instance */
export function destroyWebRTCManager(): void {
  webrtcManager?.endCall();
  webrtcManager = null;
}
