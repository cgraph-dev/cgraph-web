/**
 * PinnedMessagesPanel — Right sidebar panel showing pinned messages
 * in the current channel. Fetches from GET /api/v1/groups/:gid/channels/:cid/pins.
 *
 */

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookmarkIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getErrorMessage } from '@/lib/api';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { ChannelMessage } from '@/modules/groups/store';
import { springs } from '@/lib/animation-presets';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button, IconButton } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';

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

function getResponseStatus(error: unknown): number | undefined {
  if (!(typeof error === 'object' && error !== null && 'response' in error)) {
    return undefined;
  }

  const response = error.response;
  if (!(typeof response === 'object' && response !== null && 'status' in response)) {
    return undefined;
  }

  return typeof response.status === 'number' ? response.status : undefined;
}

function getPinnedMessageError(error: unknown, forbiddenMessage: string, fallback: string): string {
  if (getResponseStatus(error) === 403) {
    return forbiddenMessage;
  }

  const message = getErrorMessage(error).trim();
  return message || fallback;
}

/** Pinned messages for the active channel. */
export function PinnedMessagesPanel({
  groupId,
  channelId,
  channelMessages,
  onClose,
  onUnpin,
}: PinnedMessagesPanelProps) {
  const isNarrowLayout = useMediaQuery('(max-width: 1279px)');
  const [pins, setPins] = useState<PinnedMessageEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unpinningId, setUnpinningId] = useState<string | null>(null);

  const fetchPins = useCallback(async () => {
    try {
      setErrorMessage(null);
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
      setErrorMessage(
        getPinnedMessageError(
          err,
          'You do not have permission to view pinned messages in this channel.',
          'Pinned messages could not be loaded.'
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [channelId, channelMessages, groupId]);

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  async function handleUnpin(pin: PinnedMessageEntry) {
    try {
      setErrorMessage(null);
      setUnpinningId(pin.id);
      await http.delete(`/api/v1/groups/${groupId}/channels/${channelId}/pins/${pin.id}`);
      setPins((prev) => prev.filter((p) => p.id !== pin.id));
      onUnpin?.(pin);
    } catch (err) {
      logger.warn('Failed to unpin message', err);
      setErrorMessage(
        getPinnedMessageError(
          err,
          'You do not have permission to unpin messages in this channel.',
          'Pinned message could not be unpinned.'
        )
      );
    } finally {
      setUnpinningId(null);
    }
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: isNarrowLayout ? '100%' : 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ ...springs.stiff, mass: 0.8 }}
      className="cgraph-pane absolute inset-0 z-40 flex flex-col overflow-hidden border-l xl:static"
      role="complementary"
      aria-label="Pinned messages"
    >
      {/* Header */}
      <div className="cgraph-pane-header flex items-center justify-between px-4">
        <h3 className="text-sm font-semibold text-[var(--token-text-primary)]">Pinned Messages</h3>
        <IconButton
          icon={<XMarkIcon />}
          label="Close pinned messages"
          size="sm"
          onClick={onClose}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {errorMessage && (
          <div
            role="alert"
            className="m-3 rounded-md border border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] px-3 py-2 text-xs text-[var(--token-feedback-error)]"
          >
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3 p-4" role="status" aria-label="Loading pinned messages">
            <span className="sr-only">Loading pinned messages</span>
            <Skeleton shape="message" count={3} />
          </div>
        )}

        {!isLoading && pins.length === 0 && (
          <EmptyState
            icon={<BookmarkIcon className="h-7 w-7" />}
            title="No pinned messages"
            message="Use a message menu to pin it here."
            className="min-h-52"
          />
        )}

        <AnimatePresence>
          {pins.map((pin) => (
            <motion.div
              key={pin.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={springs.stiff}
              className="group border-b border-[var(--product-line)] px-4 py-3 hover:bg-[color-mix(in_srgb,var(--token-text-primary)_4%,transparent)]"
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
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--token-interactive-primary)] text-[10px] font-bold text-[var(--token-text-on-primary)]">
                        {(pin.message.author?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-[var(--token-text-primary)]">
                      {pin.message.author?.displayName || pin.message.author?.username || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-[var(--token-text-muted)]">
                      {new Date(pin.message.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Message content */}
                  <p className="line-clamp-3 text-sm leading-relaxed text-[var(--token-text-secondary)]">
                    {pin.message.content}
                  </p>

                  {/* Unpin button (visible on hover) */}
                  <Button
                    size="sm"
                    variant="danger"
                    animated={false}
                    onClick={() => handleUnpin(pin)}
                    disabled={unpinningId === pin.id}
                    className="mt-2 hidden group-hover:inline-flex group-focus-within:inline-flex"
                    aria-label={`Unpin ${pin.message.content}`}
                  >
                    {unpinningId === pin.id ? 'Unpinning...' : 'Unpin'}
                  </Button>
                </>
              ) : (
                <p className="text-xs italic text-[var(--token-text-muted)]">
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
