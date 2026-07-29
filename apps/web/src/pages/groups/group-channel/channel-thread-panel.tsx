/**
 * ChannelThreadPanel - Side panel for viewing/replying to channel message threads
 *
 * Opens when clicking "Reply in Thread" on a channel message.
 * Displays parent message, thread replies, and a send input.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { entranceVariants, springs } from '@/lib/animation-presets';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useChannelThreadStore } from '@/modules/groups/store/channelThreadStore';
import { captureError } from '@/lib/error-tracking';
import { IconButton } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';

/**
 * Channel Thread Panel component.
 */
export function ChannelThreadPanel() {
  const { activeThread, threadReplies, isLoading, closeThread, sendThreadReply } =
    useChannelThreadStore();

  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isOpen = !!activeThread;

  // Auto-scroll on new replies
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threadReplies.length]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!replyText.trim() || isSending) return;
    const content = replyText.trim();
    setReplyText('');
    setIsSending(true);
    try {
      await sendThreadReply(content);
    } catch (error: unknown) {
      captureError(error instanceof Error ? error : new Error('Failed to send thread reply'));
      setReplyText(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && activeThread && (
        <motion.div
          variants={entranceVariants.slideRight}
          initial="initial"
          animate="animate"
          exit="initial"
          transition={springs.gentle}
          role="complementary"
          aria-label="Message thread"
          className="cgraph-pane absolute inset-0 z-40 flex h-full w-full flex-col border-l xl:static xl:w-96"
        >
          {/* Header */}
          <div className="cgraph-pane-header flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-[var(--token-interactive-primary)]" />
              <h3 className="font-semibold text-[var(--token-text-primary)]">Thread</h3>
              <span className="text-xs text-[var(--token-text-muted)]">
                {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
              </span>
            </div>
            <IconButton
              icon={<XMarkIcon />}
              label="Close thread"
              size="sm"
              onClick={closeThread}
            />
          </div>

          {/* Parent message */}
          <div className="border-b border-[var(--product-line)] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--product-surface-recessed)] text-[var(--token-interactive-primary)]">
                {activeThread.author.avatarUrl ? (
                  <img
                    src={activeThread.author.avatarUrl}
                    alt={activeThread.author.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold">
                    {(activeThread.author.displayName ?? activeThread.author.username)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-[var(--token-text-primary)]">
                    {activeThread.author.displayName ?? activeThread.author.username}
                  </span>
                  <span className="text-xs text-[var(--token-text-muted)]">
                    {formatTime(activeThread.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--token-text-secondary)]">
                  {activeThread.content}
                </p>
              </div>
            </div>
          </div>

          {/* Replies list */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
            {isLoading ? (
              <div className="space-y-3 py-4" role="status" aria-label="Loading thread replies">
                <span className="sr-only">Loading thread replies</span>
                <Skeleton shape="message" count={3} />
              </div>
            ) : threadReplies.length === 0 ? (
              <EmptyState
                icon={<ChatBubbleLeftRightIcon className="h-7 w-7" />}
                title="No replies yet"
                message="Be the first to reply."
                className="min-h-52"
              />
            ) : (
              <div className="space-y-4">
                {threadReplies.map((reply) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--product-surface-recessed)] text-[var(--token-interactive-primary)]">
                      {reply.author?.avatarUrl ? (
                        <img
                          src={reply.author.avatarUrl}
                          alt={reply.author.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold">
                          {(reply.author?.displayName ?? reply.author?.username ?? '?')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-[var(--token-text-primary)]">
                          {reply.author?.displayName ?? reply.author?.username}
                        </span>
                        <span className="text-xs text-[var(--token-text-muted)]">
                          {formatTime(reply.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-[var(--token-text-secondary)]">
                        {reply.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Reply input */}
          <div className="border-t border-[var(--product-line)] p-3">
            <div className="cgraph-field flex items-end gap-2 px-2 py-1">
              <textarea
                ref={inputRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to thread..."
                rows={1}
                className="min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[var(--token-text-primary)] placeholder:text-[var(--token-text-muted)] focus:outline-none"
                style={{ maxHeight: '100px' }}
              />
              <IconButton
                icon={<PaperAirplaneIcon />}
                label="Send thread reply"
                size="sm"
                variant="primary"
                onClick={handleSend}
                disabled={!replyText.trim() || isSending}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
