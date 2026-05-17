/**
 * PinnedMessagesPanel — Right sidebar panel showing pinned messages
 * in the current channel. Fetches from GET /api/v1/groups/:gid/channels/:cid/pins.
 *
 */

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { ChannelMessage } from '@/modules/groups/store';
import { springs } from '@/lib/animation-presets';

const logger = createLogger('PinnedMessagesPanel');

interface PinnedMessageEntry {
  id: string;
  channel_id: string;
  message_id: string;
  pinned_by_id: string;
  position: number;
  pinned_at: string;
  message?: ChannelMessage;
}

interface PinnedMessagesPanelProps {
  groupId: string;
  channelId: string;
  /** Locally loaded channel messages used to hydrate pin metadata */
  channelMessages: readonly ChannelMessage[];
  onClose: () => void;
  onUnpin?: (pin: PinnedMessageEntry) => void;
}

/**
 */
/**
 * Pinned Messages Panel component.
 */
export function PinnedMessagesPanel({
  groupId,
  channelId,
  channelMessages,
  onClose,
  onUnpin,
}: PinnedMessagesPanelProps) {
  const [pins, setPins] = useState<PinnedMessageEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPins = useCallback(async () => {
    try {
      const res = await http.get(`/api/v1/groups/${groupId}/channels/${channelId}/pins`);
      const data: PinnedMessageEntry[] = res.data?.data ?? res.data ?? [];

      // Hydrate each pin with its full message from local state
      const hydrated = data.map((pin) => ({
        ...pin,
        message: channelMessages.find((m) => m.id === pin.message_id),
      }));

      setPins(hydrated);
    } catch (err) {
      logger.warn('Failed to fetch pinned messages', err);
    } finally {
      setIsLoading(false);
    }
  }, [channelId, channelMessages, groupId]);

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  async function handleUnpin(pin: PinnedMessageEntry) {
    try {
      await http.delete(`/api/v1/groups/${groupId}/channels/${channelId}/pins/${pin.id}`);
      setPins((prev) => prev.filter((p) => p.id !== pin.id));
      onUnpin?.(pin);
    } catch (err) {
      logger.warn('Failed to unpin message', err);
    }
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ ...springs.stiff, mass: 0.8 }}
      className="flex flex-col overflow-hidden border-l border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4]"
      role="complementary"
      aria-label="Pinned messages"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--token-border-muted)] px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Pinned Messages</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          aria-label="Close pinned messages"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        )}

        {!isLoading && pins.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center px-6 py-12 text-center"
          >
            <span className="mb-2 text-3xl">📌</span>
            <p className="text-sm font-medium text-gray-300">No pinned messages</p>
            <p className="mt-1 text-xs text-gray-500">Use a message menu to pin it here.</p>
          </motion.div>
        )}

        <AnimatePresence>
          {pins.map((pin) => (
            <motion.div
              key={pin.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={springs.stiff}
              className="group border-b border-[var(--token-border-muted)] px-4 py-3 hover:bg-[var(--token-card-bg)/0.5]"
            >
              {pin.message ? (
                <>
                  {/* Author row */}
                  <div className="mb-1 flex items-center gap-2">
                    {pin.message.author?.avatarUrl ? (
                      <img
                        src={pin.message.author.avatarUrl}
                        alt=""
                        className="h-5 w-5 rounded-full"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                        {(pin.message.author?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-white">
                      {pin.message.author?.displayName || pin.message.author?.username || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(pin.message.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Message content */}
                  <p className="line-clamp-3 text-sm leading-relaxed text-gray-300">
                    {pin.message.content}
                  </p>

                  {/* Unpin button (visible on hover) */}
                  <button
                    onClick={() => handleUnpin(pin)}
                    className="mt-2 hidden text-xs text-red-400 transition-colors hover:text-red-300 group-hover:inline-block"
                    aria-label={`Unpin ${pin.message.content}`}
                  >
                    Unpin
                  </button>
                </>
              ) : (
                <p className="text-xs italic text-gray-500">
                  Message not loaded (ID: {pin.message_id?.slice(0, 8)}...)
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
