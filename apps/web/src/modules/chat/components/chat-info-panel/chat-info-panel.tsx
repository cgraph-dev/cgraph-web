/**
 * ChatInfoPanel Component
 *
 * Side panel showing user info, stats, mutual connections, and actions.
 */

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { FADE_UP, springs } from '@/lib/animations/transitions';
import { useChatInfoPanel } from './useChatInfoPanel';
import { ProfileSection } from './profile-section';
import { StatsGrid } from './stats-grid';
import { BadgesList } from './badges-list';
import { MutualFriendsList } from './mutual-friends-list';
import { SharedForumsList } from './shared-forums-list';
import { QuickActions } from './quick-actions';
import { SharedMediaGrid } from './shared-media-grid';
import { BlockConfirmModal, ReportModal } from './confirmation-modals';
import { DisappearingMessagesToggle } from '../disappearing-messages-toggle';
import { useConversationMedia } from '../../hooks/useConversationMedia';
import type { ChatInfoPanelProps } from './types';

type SharedMediaType = 'image' | 'video' | 'gif';

interface ParsedLinkPreview {
  readonly url?: string;
  readonly title?: string;
  readonly image?: string;
}

/**
 * Chat Info Panel component.
 */
export default function ChatInfoPanel({
  userId,
  conversationId,
  user,
  mutualFriends = [],
  sharedForums = [],
  onClose,
  onMuteToggle,
  onBlock,
  onReport,
}: ChatInfoPanelProps) {
  const {
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
    handleMuteToggle,
    handleBlock,
    handleReport,
    handleViewProfile,
    handleCustomizeChat,
    handleNavigateToUser,
    handleNavigateToForum,
    handleUpdateTTL,
  } = useChatInfoPanel({
    userId,
    conversationId,
    onMuteToggle,
    onBlock,
    onReport,
    onClose,
  });

  // Shared media data — fetch on mount
  const {
    media: mediaMessages,
    isLoading: isMediaLoading,
    fetchMedia,
  } = useConversationMedia(conversationId);

  // Fetch media when panel mounts
  useEffect(() => {
    if (conversationId) {
      fetchMedia('all');
    }
  }, [conversationId, fetchMedia]);

  // Transform API messages into SharedMediaGrid format
  const mediaItems = mediaMessages
    .filter((m) => getSharedMediaType(m.content_type) !== null)
    .map((m) => ({
      id: m.id,
      type: getSharedMediaType(m.content_type) ?? 'image',
      thumbnailUrl: m.thumbnail_url || m.file_url || '',
      url: m.file_url || '',
    }));

  const fileItems = mediaMessages
    .filter((m) => m.content_type === 'file')
    .map((m) => ({
      id: m.id,
      name: m.file_name || 'Unknown file',
      size: formatFileSize(m.file_size),
      type: m.file_mime_type || '',
      url: m.file_url || '',
    }));

  const linkItems = mediaMessages
    .filter((m) => m.link_preview !== null && m.link_preview !== undefined)
    .map((m) => {
      const preview = parseLinkPreview(m.link_preview);
      const previewUrl = preview.url || m.content || '';
      return {
        id: m.id,
        url: previewUrl,
        title: preview.title || 'Link',
        domain: extractDomain(previewUrl),
        thumbnailUrl: preview.image,
      };
    });

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={springs.smooth}
      className="flex h-full flex-col overflow-hidden border-l border-[var(--token-card-border)] bg-gradient-to-b from-dark-900 to-dark-950"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--token-card-border)] p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <UserCircleIcon className="h-5 w-5 text-primary-400" />
          User Info
        </h3>
        <motion.button
          type="button"
          aria-label="Close user info panel"
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          whileHover={{ rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <XMarkIcon className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Profile Section */}
        <ProfileSection user={user} />

        {/* Stats Grid */}
        <StatsGrid pulse={user.pulse || 0} streak={user.streak || 0} />

        {/* Bio */}
        {user.bio && (
          <motion.div {...FADE_UP} transition={{ delay: 0.55 }}>
            <GlassCard variant="frosted" className="p-3">
              <p className="text-sm leading-relaxed text-gray-300">{user.bio}</p>
            </GlassCard>
          </motion.div>
        )}

        {/* Top Badges */}
        <BadgesList badges={user.badges || []} />

        {/* Mutual Friends */}
        <MutualFriendsList friends={mutualFriends} onFriendClick={handleNavigateToUser} />

        {/* Shared Forums */}
        <SharedForumsList forums={sharedForums} onForumClick={handleNavigateToForum} />

        {/* Shared Media */}
        <motion.div {...FADE_UP} transition={{ delay: 0.65 }}>
          <GlassCard variant="frosted" className="p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-white/30">Shared Media</p>
            <SharedMediaGrid
              media={mediaItems}
              files={fileItems}
              links={linkItems}
              isLoading={isMediaLoading}
            />
          </GlassCard>
        </motion.div>

        {/* Disappearing Messages */}
        {conversationId && (
          <motion.div {...FADE_UP} transition={{ delay: 0.7 }}>
            <GlassCard variant="frosted" className="p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-white/30">
                Disappearing Messages
              </p>
              <DisappearingMessagesToggle
                conversationId={conversationId}
                currentTTL={messageTTL}
                onUpdate={handleUpdateTTL}
              />
            </GlassCard>
          </motion.div>
        )}

        {/* Quick Actions */}
        <QuickActions
          isMuted={isMuted}
          isBlocking={isBlocking}
          isBlockLoading={isBlockLoading}
          onViewProfile={handleViewProfile}
          onCustomizeChat={handleCustomizeChat}
          onMuteToggle={handleMuteToggle}
          onBlockClick={() => setShowBlockConfirm(true)}
          onReportClick={() => setShowReportModal(true)}
        />
      </div>

      {/* Block Confirmation Modal */}
      <BlockConfirmModal
        isOpen={showBlockConfirm}
        userName={user.displayName || user.username}
        isBlocking={isBlocking}
        onConfirm={handleBlock}
        onCancel={() => setShowBlockConfirm(false)}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        userName={user.displayName || user.username}
        isReporting={isReporting}
        reportReason={reportReason}
        onReasonChange={setReportReason}
        onConfirm={handleReport}
        onCancel={() => {
          setShowReportModal(false);
          setReportReason('');
        }}
      />
    </motion.aside>
  );
}

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const idx = Math.min(i, SIZE_UNITS.length - 1);
  return `${(bytes / Math.pow(1024, idx)).toFixed(1)} ${SIZE_UNITS[idx]}`;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getSharedMediaType(contentType: string): SharedMediaType | null {
  switch (contentType) {
    case 'image':
    case 'video':
    case 'gif':
      return contentType;
    default:
      return null;
  }
}

function parseLinkPreview(preview: Record<string, unknown> | null): ParsedLinkPreview {
  if (!preview) {
    return {};
  }

  return {
    url: typeof preview.url === 'string' ? preview.url : undefined,
    title: typeof preview.title === 'string' ? preview.title : undefined,
    image: typeof preview.image === 'string' ? preview.image : undefined,
  };
}
