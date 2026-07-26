import { ArrowLeft, Bookmark, Palette, Phone, RotateCcw, Video } from 'lucide-react';
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
import { IconButton } from '@/components/ui/button';
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
            <IconButton
              icon={<ArrowLeft />}
              label="Back to conversations"
              size="sm"
              variant="ghost"
              onClick={onBack}
              className="h-10 w-10 shrink-0 lg:hidden"
            />
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
            <IconButton
              icon={
                <span className="relative block h-5 w-5">
                  <Bookmark className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--token-interactive-primary)] px-1 text-[10px] font-semibold text-[var(--token-text-on-primary)]">
                    {pinnedCount}
                  </span>
                </span>
              }
              label={showPinnedMessages ? 'Close pinned messages' : 'Open pinned messages'}
              size="sm"
              variant={showPinnedMessages ? 'secondary' : 'ghost'}
              onClick={onTogglePinnedMessages}
              className="h-9 w-9"
            />
          )}

          {canStartCall && (
            <>
              <IconButton
                icon={<Phone />}
                label="Start voice call"
                size="sm"
                variant="ghost"
                onClick={onStartVoiceCall}
                className="h-9 w-9"
              />

              <IconButton
                icon={<Video />}
                label="Start video call"
                size="sm"
                variant="ghost"
                onClick={onStartVideoCall}
                className="h-9 w-9"
              />
            </>
          )}

          {conversationId ? (
            <IconButton
              icon={<Palette />}
              label="Change conversation appearance"
              size="sm"
              variant="ghost"
              onClick={() => setShowAppearancePicker(true)}
              className="h-9 w-9"
            />
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
                  <IconButton
                    icon={<RotateCcw />}
                    label="Reset conversation wallpaper"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    disabled={!conversationWallpaperOverride}
                    onClick={() => resetConversationChatThemeWallpaper(conversationId)}
                  />
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
