/** Message Bubble — memoized message display with media, reactions, and actions. */

import { useState, memo } from 'react';
import type { Achievement, AchievementRarity } from '@cgraph-dev/shared-types';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Lock, Reply, ShieldAlert } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { countIsolatedAnimatedEmojis } from '@/lib/lottie/emoji-text-renderer';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import MessageReactions from '@/modules/chat/components/message-reactions';
import RichMediaEmbed from '@/modules/chat/components/rich-media-embed';
import { MarkdownContent } from '@/modules/chat/components/markdown-content';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import UserProfileCard from '@/modules/social/components/user-profile-card';
import type {
  BadgeDisplayTier,
  ProfileBadge,
  ProfileCardUser,
  ProfileCardUserV2,
} from '@/modules/social/components/user-profile-card';
import { aggregateReactions, handleRemoveReaction } from '@/lib/chat';
import { cn } from '@/lib/utils';
import { getBadgeById } from '@/data/badgesCollection';
import { getTitleById } from '@/data/titlesCollection';
import { getNameplateBubbleStyle } from '@/lib/cosmetics/nameplate-bubble';

import { useChatStore } from '@/modules/chat/store/chatStore.impl';
import type { MessageBubbleProps } from './types';
import { formatMessageTime, handleAddReaction, areMessageBubblePropsEqual } from './utils';
import { ReadReceipts } from './read-receipts';
import { MessageStatusIndicator } from './message-status-indicator';
import { MessageEditForm } from './message-edit-form';
import { EditHistoryViewer } from './edit-history-viewer';
import { MessageActionMenu } from './message-action-menu';
import { MessageMediaContent } from './message-media-content';
import { ThreadReplyBadge } from './thread-reply-badge';
import { ReplyPreview } from './reply-preview';
import { ForwardedBadge } from './forwarded-badge';
import { getMessageBubbleClass, getMessageEffectClass } from './preferences';
import { InlineTitle, DisplayName } from '@/shared/components/ui';

type SenderIdentity = MessageBubbleProps['message']['sender'];

const ACHIEVEMENT_RARITY_BY_VALUE: Record<string, AchievementRarity> = {
  common: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
  mythic: 'mythic',
};

function achievementRarity(value: string | undefined): AchievementRarity {
  return value ? (ACHIEVEMENT_RARITY_BY_VALUE[value] ?? 'common') : 'common';
}

function badgeAchievementFromId(id: string): Achievement {
  const badge = getBadgeById(id);

  return {
    id,
    title: badge?.name ?? id,
    description: badge?.description ?? '',
    category: 'social',
    rarity: achievementRarity(badge?.rarity),
    icon: badge?.icon ?? '◇',
    maxProgress: 1,
    isHidden: false,
    unlocked: true,
  };
}

function badgeDisplayTier(value: string | undefined): BadgeDisplayTier {
  switch (value) {
    case 'rare':
    case 'epic':
    case 'legendary':
      return value;
    case 'mythic':
      return 'legendary';
    default:
      return 'dim';
  }
}

function profileBadgeFromId(id: string): ProfileBadge {
  const badge = getBadgeById(id);

  return {
    id,
    name: badge?.name ?? id,
    icon: badge?.icon ?? '◇',
    rarity: badgeDisplayTier(badge?.rarity),
    lottieUrl: badge?.lottieUrl ?? '/lottie/effects/placeholder.json',
    animationType: 'lottie',
  };
}

function titleFromId(titleId: string | null | undefined): ProfileCardUser['equippedTitle'] {
  if (!titleId) return undefined;
  const title = getTitleById(titleId);

  if (!title) {
    return {
      id: titleId,
      name: titleId,
      rarity: 'common',
      animation: { type: 'none', speed: 1, intensity: 1 },
      color: '#ffffff',
      lottieUrl: '/lottie/effects/placeholder.json',
    };
  }

  return {
    id: title.id,
    name: title.displayName,
    rarity: title.rarity,
    animation: { type: title.animationType, speed: 1, intensity: 1 },
    color: title.colors[0] ?? '#ffffff',
    gradient: title.gradient,
    lottieUrl: title.lottieUrl ?? '/lottie/effects/placeholder.json',
    imageUrl: title.imageUrl ?? title.previewUrl,
  };
}

function profileCardUserFromSender(sender: SenderIdentity): ProfileCardUserV2 {
  const displayName = sender.displayName || sender.username || 'User';
  const equippedBadgeIds = sender.equippedBadgeIds ?? [];

  return {
    id: sender.id,
    username: sender.username || sender.id,
    displayName,
    avatarUrl: sender.avatarUrl ?? '',
    avatarBorderId: sender.avatarBorderId ?? undefined,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    pulse: 0,
    streak: 0,
    equippedTitle: titleFromId(sender.equippedTitleId),
    equippedBadges: equippedBadgeIds.map(badgeAchievementFromId),
    profileBadges: equippedBadgeIds.map(profileBadgeFromId),
    isOnline: false,
    profileColor: sender.profileColor ?? undefined,
    profile_color: sender.profileColor ?? undefined,
    profile_theme: sender.profileTheme ?? sender.theme ?? undefined,
    equipped_nameplate: sender.equippedNameplateId ?? undefined,
    display_name_font: sender.displayNameFont ?? undefined,
    display_name_effect: sender.displayNameEffect ?? undefined,
    display_name_color: sender.displayNameColor ?? undefined,
    display_name_secondary_color: sender.displayNameSecondaryColor ?? undefined,
  };
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onReply,
  uiPreferences,
  onEdit,
  onDelete,
  onPin,
  onForward,
  isMenuOpen,
  onToggleMenu,
  onSelect,
  isEditing,
  editContent,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  chatThemeAppearance,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const currentUserId = useAuthStore((s) => s.user?.id) || '';
  const authEquippedNameplateId = useAuthStore((s) => s.user?.equippedNameplateId ?? null);

  function toggleEditHistory() {
    setShowEditHistory((prev) => !prev);
  }

  const usesLegacyBubbleAppearance = !chatThemeAppearance;
  const ownBubbleStyle = useCustomizationStore((s) =>
    usesLegacyBubbleAppearance ? s.chatBubbleStyle : undefined,
  );
  const ownBubbleRadius = useCustomizationStore((s) =>
    usesLegacyBubbleAppearance ? s.bubbleBorderRadius : undefined,
  );
  const ownMessageEffect = useCustomizationStore((s) =>
    usesLegacyBubbleAppearance ? s.messageEffect : undefined,
  );
  const ownEquippedTitle = useCustomizationStore((s) => s.equippedTitle);
  const ownEquippedNameplate = useCustomizationStore((s) => s.equippedNameplate);

  const bubbleStyle = usesLegacyBubbleAppearance
    ? isOwn
      ? ownBubbleStyle
      : (message.sender?.bubbleStyle ?? 'default')
    : undefined;
  const bubbleColor = usesLegacyBubbleAppearance && !isOwn ? (message.sender?.bubbleColor ?? null) : null;
  const bubbleRadius = usesLegacyBubbleAppearance
    ? isOwn
      ? ownBubbleRadius
      : (message.sender?.bubbleRadius ?? null)
    : null;
  const messageEffect = usesLegacyBubbleAppearance
    ? isOwn
      ? (ownMessageEffect ?? 'none')
      : (message.sender?.messageEffect ?? 'none')
    : 'none';
  const equippedTitleId = isOwn ? ownEquippedTitle : (message.sender?.equippedTitleId ?? null);
  const equippedNameplateId = isOwn
    ? (ownEquippedNameplate ?? authEquippedNameplateId)
    : (message.sender?.equippedNameplateId ?? null);
  const senderProfileUser = message.sender ? profileCardUserFromSender(message.sender) : undefined;

  const bubbleCssClass = bubbleStyle ? getMessageBubbleClass(bubbleStyle) : undefined;
  const nameplateBubble = getNameplateBubbleStyle(equippedNameplateId, {
    isOwn,
    surface: 'message',
  });
  const effectCssClass = getMessageEffectClass(messageEffect ?? 'none');
  const canShowActionMenu = Boolean(
    onToggleMenu && (onSelect || onEdit || onPin || onForward || onDelete)
  );
  const rendersTextContent = Boolean(
    message.content &&
      message.messageType !== 'voice' &&
      message.messageType !== 'audio' &&
      message.messageType !== 'gif' &&
      message.messageType !== 'sticker' &&
      message.messageType !== 'file' &&
      message.messageType !== 'contact'
  );
  const isolatedEmojiCount =
    rendersTextContent && !isEditing && !message.decryptionFailed
      ? countIsolatedAnimatedEmojis(message.content)
      : 0;
  const isolatedEmojiSize = isolatedEmojiCount === 1 ? 72 : isolatedEmojiCount === 2 ? 56 : 48;

  const bubbleInlineStyle: React.CSSProperties = {
    ...(nameplateBubble?.style ?? {}),
    ...(chatThemeAppearance
      ? isOwn
        ? chatThemeAppearance.outgoingBubbleStyle
        : chatThemeAppearance.incomingBubbleStyle
      : {}),
  };
  if (usesLegacyBubbleAppearance && bubbleColor && !nameplateBubble) {
    bubbleInlineStyle.backgroundColor = bubbleColor;
  }
  if (usesLegacyBubbleAppearance && bubbleRadius != null) {
    bubbleInlineStyle.borderRadius = `${bubbleRadius}px`;
  }

  // Soft-deleted messages: render a non-interactive placeholder
  if (message.deletedAt) {
    return (
      <div className={cn('group flex items-end gap-2', isOwn ? 'flex-row-reverse' : '')}>
        <div
          className={cn(
            'flex max-w-[min(430px,78%)] flex-col',
            isOwn ? 'items-end' : 'items-start'
          )}
        >
          <div className="rounded-2xl border border-transparent bg-[var(--token-card-bg)/0.4] px-4 py-2 backdrop-blur-[8px] dark:border-[var(--token-border-muted)] dark:bg-[var(--token-bg-secondary)]">
            <p className="text-sm italic text-gray-500 dark:text-gray-500">Message deleted</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('group flex items-end gap-2', effectCssClass, isOwn ? 'flex-row-reverse' : '')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && message.sender?.id && (
            <UserProfileCard
              userId={message.sender.id}
              user={senderProfileUser}
              trigger="both"
              className="cursor-pointer"
            >
              <ThemedAvatar
                src={message.sender?.avatarUrl}
                alt={message.sender?.displayName || message.sender?.username || 'User'}
                size="small"
                avatarBorderId={message.sender?.avatarBorderId}
              />
            </UserProfileCard>
          )}
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          'flex min-w-0 max-w-[min(430px,78%)] flex-col',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        {/* Sender name + title badge (for other users' messages) */}
        {!isOwn && showAvatar && (
          <div className="mb-0.5 flex items-center gap-1.5 px-1">
            <DisplayName
              name={message.sender?.displayName || message.sender?.username || 'User'}
              font={message.sender?.displayNameFont ?? 'default'}
              effect={message.sender?.displayNameEffect ?? 'solid'}
              color={message.sender?.displayNameColor ?? undefined}
              secondaryColor={message.sender?.displayNameSecondaryColor ?? undefined}
              size="0.75rem"
              className="font-medium"
            />
            {equippedTitleId && <InlineTitle titleId={equippedTitleId} size="sm" />}
          </div>
        )}

        {/* Forwarded message attribution */}
        {message.forwardedFromUserId && (
          <ForwardedBadge
            forwardedFromUserName={message.forwardedFromUserName ?? null}
            isOwn={isOwn}
          />
        )}

        {/* Reply preview — links back to the referenced message */}
        {message.replyToId && (
          <ReplyPreview
            replyToId={message.replyToId}
            authorName={
              message.replyTo?.sender?.displayName ?? message.replyTo?.sender?.username ?? null
            }
            snippet={message.replyTo?.content ?? null}
            isOwn={isOwn}
          />
        )}

        <div className="flex min-w-0 items-center gap-2">
          {/* Actions (for own messages, show on left) */}
          {isOwn && (showActions || isMenuOpen) && (
            <MessageActionMenu
              onReply={onReply}
              onEdit={onEdit}
              onPin={onPin}
              onForward={onForward}
              onDelete={onDelete}
              onSelect={onSelect}
              isMenuOpen={isMenuOpen}
              onToggleMenu={onToggleMenu}
              isOwn={true}
            />
          )}

          {/* Bubble — dynamic styling from customization + liquid glass */}
          <div
            className={cn(
              'min-w-0 max-w-full break-words text-[15px] leading-5',
              isolatedEmojiCount > 0
                ? 'bg-transparent px-0 py-0 text-white'
                : 'min-w-40 border px-[11px] py-2 shadow-sm transition-colors',
              isolatedEmojiCount === 0 &&
                (isOwn
                  ? 'is-own rounded-2xl rounded-br-md border-white/10 text-white'
                  : 'rounded-2xl rounded-bl-md border-[var(--token-border-muted)] text-white'),
              isolatedEmojiCount === 0 && bubbleCssClass,
              isolatedEmojiCount === 0 && nameplateBubble?.className,
              // Fallback Tailwind classes only when no custom bubble CSS class applies
              isolatedEmojiCount === 0 &&
                chatThemeAppearance &&
                'bg-[var(--token-card-bg)]',
              isolatedEmojiCount === 0 &&
              !chatThemeAppearance &&
                !bubbleColor &&
                !nameplateBubble &&
                bubbleStyle === 'default' &&
                (isOwn
                  ? 'bg-primary-600/95 hover:bg-primary-500/95'
                  : 'bg-[var(--token-card-bg)] hover:bg-[var(--token-card-bg)]')
            )}
            style={isolatedEmojiCount > 0 ? undefined : bubbleInlineStyle}
            data-chat-theme-bubble={
              chatThemeAppearance && isolatedEmojiCount === 0
                ? isOwn
                  ? 'outgoing'
                  : 'incoming'
                : undefined
            }
            data-nameplate-bubble-id={
              isolatedEmojiCount === 0 ? nameplateBubble?.entry.id : undefined
            }
            data-isolated-emoji-count={isolatedEmojiCount || undefined}
          >
            {message.isPinned && (
              <div className="bg-primary-500/15 mb-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-primary-200">
                Pinned
              </div>
            )}

            <MessageMediaContent
              message={message}
              isOwn={isOwn}
              voiceVisualizerTheme={uiPreferences.voiceVisualizerTheme}
            />

            {/* Text content */}
            {rendersTextContent && (
                <>
                  {isEditing ? (
                    <MessageEditForm
                      editContent={editContent || ''}
                      onEditContentChange={onEditContentChange}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                    />
                  ) : (
                    <>
                      {message.decryptionFailed ? (
                        <p className="text-sm italic text-gray-500">
                          {message.content || 'Unable to decrypt message'}
                        </p>
                      ) : (
                        <>
                          <MarkdownContent
                            content={message.content}
                            emojiSize={isolatedEmojiSize}
                            className={isolatedEmojiCount > 0 ? 'leading-none' : undefined}
                          />
                          <RichMediaEmbed content={message.content} isOwnMessage={isOwn} />
                        </>
                      )}
                    </>
                  )}
                </>
              )}

            <div
              className={cn(
                'mt-1 flex w-fit items-center gap-1 text-[11px] leading-4',
                isolatedEmojiCount > 0
                  ? 'rounded-full bg-black/55 px-1.5 py-0.5 text-white/85'
                  : isOwn
                    ? 'text-primary-100/90'
                    : 'text-white/65'
              )}
              style={
                isolatedEmojiCount === 0 && chatThemeAppearance
                  ? {
                      color: isOwn
                        ? chatThemeAppearance.ownTextColor
                        : chatThemeAppearance.incomingTextColor,
                      opacity: 0.68,
                    }
                  : undefined
              }
            >
              <span>{formatMessageTime(message.createdAt)}</span>
              {message.isEdited && (
                <span className="relative">
                  {message.edits && message.edits.length > 0 ? (
                    <>
                      <button
                        onClick={toggleEditHistory}
                        className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-white"
                      >
                        (edited)
                      </button>
                      <EditHistoryViewer
                        edits={message.edits}
                        currentContent={message.content}
                        isOpen={showEditHistory}
                        onClose={() => setShowEditHistory(false)}
                      />
                    </>
                  ) : (
                    <span>(edited)</span>
                  )}
                </span>
              )}
              {message.decryptionFailed && (
                <span
                  className="flex items-center gap-0.5 text-amber-400/70"
                  title="This message could not be decrypted"
                >
                  <ShieldAlert className="h-3 w-3" />
                </span>
              )}
              {message.isEncrypted && !message.decryptionFailed && (
                <span
                  className="flex items-center gap-0.5 text-gray-500/60"
                  title="End-to-end encrypted"
                >
                  <Lock className="h-3 w-3" />
                </span>
              )}
              {'expiresAt' in message && !!message.expiresAt && (
                <span
                  className="flex items-center gap-0.5 text-amber-400/70"
                  title="Disappearing message"
                >
                  <ClockIcon className="h-3 w-3" />
                </span>
              )}
              {isOwn && (
                <>
                  <MessageStatusIndicator
                    status={
                      message.deliveryStatus ??
                      (Array.isArray(message.metadata?.readBy) && message.metadata.readBy.length > 0
                        ? 'read'
                        : message.metadata?.deliveredAt
                          ? 'delivered'
                          : 'sent')
                    }
                  />
                  {message.deliveryStatus === 'failed' && (
                    <button
                      onClick={() =>
                        useChatStore.getState().resendMessage(message.conversationId, message.id)
                      }
                      className="ml-1 text-[10px] font-medium text-red-400 underline decoration-dotted underline-offset-2 hover:text-red-300"
                      title="Click to retry sending"
                    >
                      Retry
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions (for other messages, show on right) */}
          {!isOwn && (showActions || isMenuOpen) && (
            <div className="flex items-center gap-1">
              {canShowActionMenu ? (
                <MessageActionMenu
                  onReply={onReply}
                  onPin={onPin}
                  onForward={onForward}
                  onDelete={onDelete}
                  onSelect={onSelect}
                  isMenuOpen={isMenuOpen}
                  onToggleMenu={onToggleMenu}
                  isOwn={false}
                />
              ) : (
                <IconButton
                  icon={<Reply />}
                  label="Reply to message"
                  size="sm"
                  onClick={onReply}
                  className="h-8 w-8 flex-none"
                />
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        <div
          className={cn(
            message.reactions.length > 0
              ? 'mt-1'
              : 'h-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100'
          )}
        >
          <MessageReactions
            messageId={message.id}
            reactions={aggregateReactions(message.reactions)}
            onAddReaction={handleAddReaction}
            onRemoveReaction={handleRemoveReaction}
            currentUserId={currentUserId}
            disabled={false}
            isOwn={isOwn}
          />
        </div>

        {/* Thread replies indicator */}
        <ThreadReplyBadge
          messageId={message.id}
          conversationId={message.conversationId}
          message={message}
        />
        {isOwn && message.metadata?.readBy && Array.isArray(message.metadata.readBy) && (
          <ReadReceipts
            readBy={message.metadata.readBy.filter(
              (entry) => typeof entry === 'object' && entry !== null
            )}
          />
        )}
      </div>
    </div>
  );
}, areMessageBubblePropsEqual);

export default MessageBubble;
