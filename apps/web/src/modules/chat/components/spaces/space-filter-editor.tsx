/**
 * Space (chat folder) filter editor with Signal ChatFolder enhancements.
 *
 * Adds "Show only unread" and "Show muted chats" toggles below the existing
 * include/exclude flags in the space creation/edit flow.
 * These filters compose with the existing bitmask include/exclude flags.
 */
import { motion } from 'motion/react';
import { EyeIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';

interface SpaceFilterEditorProps {
  readonly showOnlyUnread: boolean;
  readonly showMuted: boolean;
  readonly onShowOnlyUnreadChange: (value: boolean) => void;
  readonly onShowMutedChange: (value: boolean) => void;
}

/**
 * Space filter editor toggles for Signal ChatFolder enhancements.
 *
 * Usage: embed in the space creation/edit form below include/exclude flags.
 * Filtering is applied client-side when rendering the conversation list.
 */
export function SpaceFilterEditor({
  showOnlyUnread,
  showMuted,
  onShowOnlyUnreadChange,
  onShowMutedChange,
}: SpaceFilterEditorProps): React.ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={tweens.standard}
      className="space-y-3"
    >
      {/* Show Only Unread */}
      <GlassCard variant="default" className="aurora-social-panel p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EyeIcon className="h-5 w-5 text-primary-400" />
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Show only unread</h3>
              <p className="text-sm text-[var(--token-text-muted)]">
                Hide conversations with no unread messages
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showOnlyUnread}
            onClick={() => onShowOnlyUnreadChange(!showOnlyUnread)}
            data-checked={showOnlyUnread}
            className="aurora-social-toggle relative h-6 w-11 rounded-full"
          >
            <span className="aurora-social-toggle-thumb absolute left-1 top-1 h-4 w-4 rounded-full" />
          </button>
        </div>
      </GlassCard>

      {/* Show Muted */}
      <GlassCard variant="default" className="aurora-social-panel p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SpeakerXMarkIcon className="h-5 w-5 text-primary-400" />
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Show muted chats</h3>
              <p className="text-sm text-[var(--token-text-muted)]">
                Include muted conversations in this Space
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showMuted}
            onClick={() => onShowMutedChange(!showMuted)}
            data-checked={showMuted}
            className="aurora-social-toggle relative h-6 w-11 rounded-full"
          >
            <span className="aurora-social-toggle-thumb absolute left-1 top-1 h-4 w-4 rounded-full" />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/**
 * Client-side conversation filter for Space display.
 *
 * Apply after the existing bitmask include/exclude evaluation (Telegram DialogFilter).
 * This composes additively — conversations must pass BOTH the bitmask filters AND these.
 */
export function applySpaceFilters(
  conversations: readonly { readonly unread_count?: number; readonly is_muted?: boolean }[],
  showOnlyUnread: boolean,
  showMuted: boolean
): readonly { readonly unread_count?: number; readonly is_muted?: boolean }[] {
  return conversations.filter((conv) => {
    // show_only_unread=true + unread_count === 0 => hide
    if (showOnlyUnread && (conv.unread_count ?? 0) === 0) {
      return false;
    }

    // show_muted=false + is_muted => hide
    if (!showMuted && conv.is_muted) {
      return false;
    }

    return true;
  });
}
