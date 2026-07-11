/**
 * ConversationHeader - glassmorphic header with user info and actions
 */

import { motion } from 'motion/react';
import {
  BookmarkIcon,
  PhoneIcon,
  ShieldCheckIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { Palette, RotateCcw } from 'lucide-react';
import { resolveChatThemeConversationWallpaper } from '@cgraph-dev/shared-types/chat-theme';
import { GlassCardNeon } from '@/shared/components/ui';
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
import type { ConversationHeaderProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';
import { useState } from 'react';

/**
 */
/**
 * Conversation Header component.
 */
export function ConversationHeader({
  conversationId,
  conversationName,
  isTyping,
  canStartCall = false,
  pinnedCount = 0,
  showPinnedMessages = false,
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
    <GlassCardNeon className="border-primary-500/20 flex h-16 flex-shrink-0 items-center justify-between rounded-none border-b px-4">
      <motion.div
        className="flex items-center gap-3"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <motion.div
            className="ring-primary-500/50 h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-700 ring-2"
            whileTap={{ scale: 0.88 }}
          >
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
              {(conversationName || 'U').charAt(0).toUpperCase()}
            </div>
          </motion.div>
          <motion.div
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-dark-900 bg-green-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={loop(tweens.ambient)}
          />
        </div>

        <div>
          <h2 className="font-semibold text-white">{conversationName || 'Conversation'}</h2>
          <div className="flex items-center gap-1.5">
            <ShieldCheckIcon className="h-3 w-3 text-green-400" />
            <p className="text-xs text-gray-400">
              {isTyping ? (
                <motion.span
                  className="text-primary-400"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={loop(tweens.verySlow)}
                >
                  typing...
                </motion.span>
              ) : (
                'Online'
              )}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center gap-2"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {pinnedCount > 0 && onTogglePinnedMessages && (
          <motion.button
            type="button"
            onClick={onTogglePinnedMessages}
            className={`relative rounded-lg p-2 transition-colors ${
              showPinnedMessages
                ? 'bg-primary-500/20 text-primary-200'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
            whileTap={{ scale: 0.88 }}
            aria-label={showPinnedMessages ? 'Close pinned messages' : 'Open pinned messages'}
            title="Pinned messages"
          >
            <BookmarkIcon className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-dark-950">
              {pinnedCount}
            </span>
          </motion.button>
        )}

        {canStartCall && (
          <>
            <motion.button
              type="button"
              onClick={onStartVoiceCall}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              whileTap={{ scale: 0.88 }}
              aria-label="Start voice call"
              title="Start voice call"
            >
              <PhoneIcon className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="button"
              onClick={onStartVideoCall}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              whileTap={{ scale: 0.88 }}
              aria-label="Start video call"
              title="Start video call"
            >
              <VideoCameraIcon className="h-5 w-5" />
            </motion.button>
          </>
        )}

        {conversationId ? (
          <motion.button
            type="button"
            onClick={() => setShowAppearancePicker(true)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            whileTap={{ scale: 0.88 }}
            aria-label="Change conversation appearance"
            title="Conversation appearance"
          >
            <Palette className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        ) : null}

        <ConnectionStatus />
      </motion.div>
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
    </GlassCardNeon>
  );
}
