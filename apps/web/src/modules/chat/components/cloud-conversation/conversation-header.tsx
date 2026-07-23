import {
  ArrowLeftIcon,
  BookmarkIcon,
  PhoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { Palette, RotateCcw } from 'lucide-react';
import { resolveChatThemeConversationWallpaper } from '@cgraph-dev/shared-types/chat-theme';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConnectionStatus } from '@/shared/components/connection-status';
import { ChatColorPicker } from '@/modules/settings/components/customize/panels/chat-color-picker';
import { ChatWallpaperGrid } from '@/modules/chat/theme/chat-wallpaper-grid';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import type { ConversationHeaderProps } from './types';
import { useState } from 'react';

/**
 * Conversation Header component.
 */
export function ConversationHeader({
  conversationId,
  conversationName,
  avatarUrl,
  avatarBorderId,
  isOnline = false,
  isTyping,
  canStartCall = false,
  pinnedCount = 0,
  showPinnedMessages = false,
  onBack,
  onTogglePinnedMessages,
  onStartVoiceCall,
  onStartVideoCall,
}: ConversationHeaderProps) {
  const [showAppearancePicker, setShowAppearancePicker] = useState(false);
  const globalWallpaper = useCustomizationStore((state) => state.chatThemeSettings.wallpaper);
  const conversationWallpaperOverride = useCustomizationStore((state) =>
    conversationId ? state.conversationChatThemeOverrides[conversationId]?.wallpaper : undefined,
  );
  const conversationWallpaper = resolveChatThemeConversationWallpaper(globalWallpaper, {
    ...(conversationWallpaperOverride ? { wallpaper: conversationWallpaperOverride } : {}),
  });
  const setConversationChatThemeWallpaper = useCustomizationStore(
    (state) => state.setConversationChatThemeWallpaper,
  );
  const resetConversationChatThemeWallpaper = useCustomizationStore(
    (state) => state.resetConversationChatThemeWallpaper,
  );

  return (
    <>
      <header
        data-testid="conversation-header"
        className="relative z-20 flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-[var(--token-card-border)] bg-[var(--token-bg-primary)]/95 px-4 backdrop-blur-xl"
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-[var(--token-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
              aria-label="Back to conversations"
              title="Back to conversations"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          ) : null}
          <div className="relative shrink-0">
            <ThemedAvatar
              src={avatarUrl}
              alt={conversationName || 'Conversation'}
              size="small"
              className="h-10 w-10"
              avatarBorderId={avatarBorderId ?? undefined}
            />
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--token-bg-primary)] ${
                isOnline ? 'bg-emerald-500' : 'bg-neutral-500'
              }`}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-[var(--token-text-primary)]">
              {conversationName || 'Conversation'}
            </h2>
            <p
              className={`truncate text-xs ${
                isTyping ? 'text-primary-400' : 'text-[var(--token-text-muted)]'
              }`}
            >
              {isTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        <div
          className="flex shrink-0 items-center gap-1"
          role="toolbar"
          aria-label="Conversation actions"
        >
          {pinnedCount > 0 && onTogglePinnedMessages && (
            <button
              type="button"
              onClick={onTogglePinnedMessages}
              className={`relative grid h-9 w-9 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                showPinnedMessages
                  ? 'bg-primary-500/15 text-primary-300'
                  : 'text-[var(--token-text-muted)] hover:bg-[var(--token-card-bg)] hover:text-[var(--token-text-primary)]'
              }`}
              aria-label={showPinnedMessages ? 'Close pinned messages' : 'Open pinned messages'}
              title="Pinned messages"
            >
              <BookmarkIcon className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-white">
                {pinnedCount}
              </span>
            </button>
          )}

          {canStartCall && (
            <>
              <button
                type="button"
                onClick={onStartVoiceCall}
                className="grid h-9 w-9 place-items-center rounded-md text-[var(--token-text-muted)] transition-colors hover:bg-[var(--token-card-bg)] hover:text-[var(--token-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Start voice call"
                title="Start voice call"
              >
                <PhoneIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={onStartVideoCall}
                className="grid h-9 w-9 place-items-center rounded-md text-[var(--token-text-muted)] transition-colors hover:bg-[var(--token-card-bg)] hover:text-[var(--token-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Start video call"
                title="Start video call"
              >
                <VideoCameraIcon className="h-5 w-5" />
              </button>
            </>
          )}

          {conversationId ? (
            <button
              type="button"
              onClick={() => setShowAppearancePicker(true)}
              className="grid h-9 w-9 place-items-center rounded-md text-[var(--token-text-muted)] transition-colors hover:bg-[var(--token-card-bg)] hover:text-[var(--token-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Change conversation appearance"
              title="Conversation appearance"
            >
              <Palette className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}

          <div className="ml-1 hidden sm:block">
            <ConnectionStatus />
          </div>
        </div>
      </header>
      <Dialog open={showAppearancePicker} onOpenChange={setShowAppearancePicker}>
        <DialogContent ariaLabel="Conversation appearance" className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Conversation Appearance</DialogTitle>
          </DialogHeader>
          {conversationId ? (
            <div className="space-y-6">
              <ChatColorPicker conversationId={conversationId} />
              <section className="space-y-4" aria-label="Conversation wallpaper settings">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">Conversation Background</span>
                  <button
                    type="button"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Reset conversation wallpaper"
                    title="Reset conversation wallpaper"
                    disabled={!conversationWallpaperOverride}
                    onClick={() => resetConversationChatThemeWallpaper(conversationId)}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <ChatWallpaperGrid
                  wallpaper={conversationWallpaper}
                  onSelect={(wallpaper) =>
                    setConversationChatThemeWallpaper(conversationId, wallpaper)
                  }
                  ariaLabel="Conversation wallpaper"
                />
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
