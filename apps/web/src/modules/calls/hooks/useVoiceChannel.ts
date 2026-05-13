/**
 * useVoiceChannel Hook
 *
 * Manages persistent voice channel connections via Phoenix Channel + LiveKit.
 * Handles join/leave, mute/deafen/video, and voice state synchronization.
 *
 */

import { useEffect, useRef } from 'react';
import type { Channel } from 'phoenix';
import { useVoiceStateStore } from '@/stores/voiceStateStore';
import { LiveKitService } from '@/lib/webrtc/livekitService';
import { useSocket } from '@/lib/socket';
import type { Room } from 'livekit-client';
/** Payload shape for voice channel events from Phoenix */
interface VoiceEventPayload {
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  self_mute?: boolean;
  self_deafen?: boolean;
  video?: boolean;
  token?: string;
  url?: string;
  room_name?: string;
  members?: Array<Record<string, unknown>>;
}
/** Type guard: narrows unknown to Record<string, unknown>. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function toRecord(v: unknown): Record<string, unknown> | null {
  return isRecord(v) ? v : null;
}

function isVoicePayload(v: unknown): v is VoiceEventPayload {
  const r = toRecord(v);
  return r !== null && typeof r.user_id === 'string';
}

function isJoinResponse(v: unknown): v is { token: string; room_name: string } {
  const r = toRecord(v);
  return r !== null && typeof r.token === 'string' && typeof r.room_name === 'string';
}

function extractErrorReason(v: unknown): string {
  const r = toRecord(v);
  return r !== null && typeof r.reason === 'string' ? r.reason : 'join_failed';
}

export interface UseVoiceChannelReturn {
  /** Currently connected channel ID */
  currentChannelId: string | null;
  /** Whether currently connecting */
  isConnecting: boolean;
  /** Whether local audio is muted */
  isMuted: boolean;
  /** Whether local audio is deafened */
  isDeafened: boolean;
  /** Whether video is on */
  isVideoOn: boolean;
  /** Error message */
  error: string | null;
  /** Join a voice channel */
  joinChannel: (channelId: string, groupId: string) => Promise<void>;
  /** Leave the current voice channel */
  leaveChannel: () => Promise<void>;
  /** Toggle mute */
  toggleMute: () => void;
  /** Toggle deafen */
  toggleDeafen: () => void;
  /** Toggle video */
  toggleVideo: () => void;
}
/** Description. */
/** Hook for voice channel. */
export function useVoiceChannel(): UseVoiceChannelReturn {
  const socketManager = useSocket();
  const channelRef = useRef<Channel | null>(null);
  const roomRef = useRef<Room | null>(null);

  const {
    currentChannelId,
    isConnecting,
    isMuted,
    isDeafened,
    isVideoOn,
    error,
    setConnected,
    setDisconnected,
    setConnecting,
    toggleMute: storeToggleMute,
    toggleDeafen: storeToggleDeafen,
    toggleVideo: storeToggleVideo,
    setError,
    addChannelMember,
    removeChannelMember,
    updateMemberState,
    setChannelMembers,
  } = useVoiceStateStore();
  const joinChannel = async (channelId: string, groupId: string) => {
      // If already in this channel, do nothing
      if (currentChannelId === channelId) return;

      // If in another channel, leave first
      if (currentChannelId) {
        await leaveChannelInternal();
      }

      setConnecting(true);
      setError(null);

      try {
        const socket = socketManager.getSocket();
        if (!socket) {
          throw new Error('Socket not connected');
        }

        // Join the Phoenix voice channel
        const channel = socket.channel(`voice:${channelId}`, {});

        // Set up event handlers
        channel.on('voice_member_joined', (_payload: unknown) => {
          if (!isVoicePayload(_payload)) return;
          addChannelMember(channelId, {
            userId: _payload.user_id,
            username: _payload.username,
            displayName: _payload.display_name,
            avatarUrl: _payload.avatar_url,
            selfMute: _payload.self_mute ?? false,
            selfDeafen: _payload.self_deafen ?? false,
            video: false,
          });
        });

        channel.on('voice_member_left', (_payload: unknown) => {
          if (!isVoicePayload(_payload)) return;
          removeChannelMember(channelId, _payload.user_id);
        });

        channel.on('voice_state_update', (_payload: unknown) => {
          if (!isVoicePayload(_payload)) return;
          updateMemberState(channelId, _payload.user_id, {
            selfMute: _payload.self_mute,
            selfDeafen: _payload.self_deafen,
            video: _payload.video,
          });
        });

        channel.on('presence_state', (_payload: unknown) => {
          if (!isVoicePayload(_payload)) return;
          if (_payload.members) {
            const members = _payload.members.map((m) => ({
              userId: typeof m.user_id === 'string' ? m.user_id : '',
              selfMute: typeof m.self_mute === 'boolean' ? m.self_mute : false,
              selfDeafen: typeof m.self_deafen === 'boolean' ? m.self_deafen : false,
              video: typeof m.video === 'boolean' ? m.video : false,
            }));
            setChannelMembers(channelId, members);
          }
        });

        // Join and get token
        const joinResult = await new Promise<{ token: string; room_name: string }>(
          (resolve, reject) => {
            channel
              .join()
              .receive('ok', (resp: unknown) => {
                if (isJoinResponse(resp)) {
                  resolve(resp);
                } else {
                  reject(new Error('Invalid join response'));
                }
              })
              .receive('error', (resp: unknown) => reject(new Error(extractErrorReason(resp))))
              .receive('timeout', () => reject(new Error('join_timeout')));
          }
        );

        channelRef.current = channel;

        // Connect to LiveKit using the token
        const wsUrl = import.meta.env.VITE_LIVEKIT_URL ?? 'ws://localhost:7880';
        const lkRoom = await LiveKitService.connect(wsUrl, joinResult.token);
        roomRef.current = lkRoom;

        // Publish local tracks
        await LiveKitService.publishLocalTracks(lkRoom, {
          audio: true,
          video: false,
        });

        setConnected(channelId, groupId, joinResult.token, joinResult.room_name);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to join voice channel';
        setError(message);
        setConnecting(false);
        // Clean up partial connection
        if (channelRef.current) {
          channelRef.current.leave();
          channelRef.current = null;
        }
      }
    };
  const leaveChannelInternal = async () => {
    // Send leave event via Phoenix Channel
    if (channelRef.current) {
      channelRef.current.push('leave', {});
      channelRef.current.leave();
      channelRef.current = null;
    }

    // Disconnect from LiveKit
    if (roomRef.current) {
      await LiveKitService.disconnect(roomRef.current);
      roomRef.current = null;
    }

    setDisconnected();
  };

  const leaveChannel = async () => {
    await leaveChannelInternal();
  };
  const toggleMute = () => {
    storeToggleMute();
    const newMuted = !useVoiceStateStore.getState().isMuted;
    // Sync to server
    channelRef.current?.push(newMuted ? 'mute' : 'unmute', {});
    // Sync to LiveKit
    if (roomRef.current?.localParticipant) {
      roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
    }
  };

  const toggleDeafen = () => {
    storeToggleDeafen();
    const state = useVoiceStateStore.getState();
    channelRef.current?.push(state.isDeafened ? 'undeafen' : 'deafen', {});
    // When deafened, mute mic too
    if (roomRef.current?.localParticipant) {
      roomRef.current.localParticipant.setMicrophoneEnabled(!state.isMuted);
    }
  };

  const toggleVideo = () => {
    storeToggleVideo();
    const newVideoOn = !useVoiceStateStore.getState().isVideoOn;
    channelRef.current?.push(newVideoOn ? 'video_on' : 'video_off', {});
    if (roomRef.current?.localParticipant) {
      roomRef.current.localParticipant.setCameraEnabled(newVideoOn);
    }
  };
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.push('leave', {});
        channelRef.current.leave();
        channelRef.current = null;
      }
      if (roomRef.current) {
        LiveKitService.disconnect(roomRef.current);
        roomRef.current = null;
      }
    };
  }, []);

  return {
    currentChannelId,
    isConnecting,
    isMuted,
    isDeafened,
    isVideoOn,
    error,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    toggleVideo,
  };
}
