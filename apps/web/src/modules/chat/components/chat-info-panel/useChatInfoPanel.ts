/**
 * useChatInfoPanel hook - state and handlers for chat info panel
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLogger } from '@/lib/logger';
import { useFriendStore } from '@/modules/social/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { http } from '@/lib/api-client';
import { publicProfilePath } from '@/lib/profile-route';

const logger = createLogger('ChatInfoPanel');

interface UseChatInfoPanelParams {
  userId: string;
  conversationId?: string;
  onMuteToggle?: (isMuted: boolean) => void;
  onBlock?: () => void;
  onReport?: () => void;
  onClose: () => void;
}

/**
 * State and event handlers for the ChatInfoPanel component.
 */
export function useChatInfoPanel({
  userId,
  conversationId,
  onMuteToggle,
  onBlock,
  onReport,
  onClose,
}: UseChatInfoPanelParams) {
  const navigate = useNavigate();
  const { blockUser, isLoading: isBlockLoading } = useFriendStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [messageTTL, setMessageTTL] = useState<number | null>(null);

  // Fetch conversation TTL on mount
  useEffect(() => {
    if (!conversationId) return;
    http
      .get(`/api/v1/conversations/${conversationId}`)
      .then((res: { data?: { data?: { ttl_seconds?: number } } }) => {
        const resData = res instanceof Object && 'data' in res ? res.data : undefined;
        const data = resData instanceof Object && 'data' in resData ? resData.data : undefined;
        const ttlEntry =
          data instanceof Object
            ? Object.entries(data).find(([k]) => k === 'message_ttl' || k === 'ttl')
            : undefined;
        const ttl = ttlEntry ? ttlEntry[1] : undefined;
        if (ttl !== undefined && (typeof ttl === 'number' || ttl === null)) {
          setMessageTTL(ttl);
        }
      })
      .catch(() => {
        // Silently fail — TTL will default to null (off)
      });
  }, [conversationId]);

  /**
   * Handle vanish timer change from the VanishTimerPicker.
   * Maps Signal preset values: 0 = off (stored as null).
   */
  const handleUpdateTTL = async (ttl: number | null) => {
    if (!conversationId) return;
    const previousTTL = messageTTL;
    const effectiveTTL = ttl === 0 || ttl === null ? null : ttl;
    setMessageTTL(effectiveTTL);

    try {
      await http.put(`/api/v1/conversations/${conversationId}/ttl`, { ttl });
      HapticFeedback.light();
    } catch (error) {
      setMessageTTL(previousTTL);
      logger.error('Failed to update vanish timer:', error);
    }
  };

  // Handle mute toggle with API call
  const handleMuteToggle = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    HapticFeedback.light();

    onMuteToggle?.(newMutedState);

    if (conversationId) {
      try {
        await http.patch(`/api/v1/conversations/${conversationId}/mute`, {
          muted: newMutedState,
        });
      } catch (error) {
        setIsMuted(!newMutedState);
        logger.error('Failed to toggle mute:', error);
      }
    }
  };

  // Handle block user
  const handleBlock = async () => {
    if (isBlocking) return;
    setIsBlocking(true);
    HapticFeedback.warning();

    try {
      await blockUser(userId);
      onBlock?.();
      onClose();
    } catch (error) {
      logger.error('Failed to block user:', error);
    } finally {
      setIsBlocking(false);
      setShowBlockConfirm(false);
    }
  };

  // Handle report user
  const handleReport = async () => {
    if (isReporting || !reportReason.trim()) return;
    setIsReporting(true);
    HapticFeedback.medium();

    try {
      await http.post('/api/v1/reports', {
        reported_user_id: userId,
        reason: reportReason.trim(),
        context: conversationId ? { conversation_id: conversationId } : undefined,
      });
      onReport?.();
      setShowReportModal(false);
      setReportReason('');
    } catch (error) {
      logger.error('Failed to report user:', error);
    } finally {
      setIsReporting(false);
    }
  };

  // Navigation handlers
  const handleViewProfile = () => {
    if (!userId || userId === 'undefined' || userId === 'null') {
      logger.warn('ChatInfoPanel: Cannot view profile - invalid userId');
      return;
    }
    navigate(publicProfilePath({ id: userId }));
  };

  const handleCustomizeChat = () => {
    try {
      navigate('/customize/chat');
    } catch (error) {
      logger.error('Navigation to customize/chat failed:', error);
    }
  };

  const handleNavigateToUser = (friendId: string) => {
    navigate(publicProfilePath({ id: friendId }));
  };

  const handleNavigateToForum = (forumId: string) => {
    navigate(`/forums/${forumId}`);
  };

  return {
    // State
    isMuted,
    isBlocking,
    isBlockLoading,
    isReporting,
    showBlockConfirm,
    setShowBlockConfirm,
    showReportModal,
    setShowReportModal,
    reportReason,
    setReportReason,
    messageTTL,
    // Handlers
    handleMuteToggle,
    handleBlock,
    handleReport,
    handleViewProfile,
    handleCustomizeChat,
    handleNavigateToUser,
    handleNavigateToForum,
    handleUpdateTTL,
  };
}
