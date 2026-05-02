/**
 * Message forwarding modal dialog.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createLogger } from '@/lib/logger';
import { springs } from '@/lib/animation-presets';
import { FocusTrap } from '@/shared/components/accessibility';

const logger = createLogger('ForwardMessageModal');
import {
  PaperAirplaneIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useChatStore, type Message } from '@/modules/chat/store/chatStore.impl';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { FADE_IN } from '@/lib/animations/transitions';

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForward: (conversationIds: string[]) => Promise<void>;
  message: Message;
}

function isRecord(value: unknown): value is { [key: string]: unknown } {
  return typeof value === 'object' && value !== null;
}

function readAvatarBorderId(source: unknown): string | null {
  if (!isRecord(source)) return null;
  const camel = source['avatarBorderId'];
  if (typeof camel === 'string') return camel;
  const snake = source['avatar_border_id'];
  if (typeof snake === 'string') return snake;
  return null;
}

/**
 * ForwardMessageModal Component
 *
 * Modal for forwarding messages to one or multiple conversations.
 *
 * Features:
 * - Search conversations by name
 * - Multi-select conversations
 * - Message preview
 * - Smooth animations
 * - Glassmorphism design
 */
export function ForwardMessageModal({
  isOpen,
  onClose,
  onForward,
  message,
}: ForwardMessageModalProps) {
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  const conversations = useChatStore((state) => state.conversations);

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) => {
    const name = conv.name || 'Unknown';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const MAX_FORWARD_TARGETS = 5;

  const handleToggleConversation = (conversationId: string) => {
    const newSelected = new Set(selectedConversations);
    if (newSelected.has(conversationId)) {
      newSelected.delete(conversationId);
    } else if (newSelected.size < MAX_FORWARD_TARGETS) {
      newSelected.add(conversationId);
    }
    setSelectedConversations(newSelected);
    HapticFeedback.light();
  };

  const handleForward = async () => {
    if (selectedConversations.size === 0 || isForwarding) return;

    setIsForwarding(true);
    try {
      await onForward(Array.from(selectedConversations));
      HapticFeedback.success();
      handleClose();
    } catch (error) {
      logger.error('Failed to forward message:', error);
      HapticFeedback.error();
    } finally {
      setIsForwarding(false);
    }
  };

  const handleClose = () => {
    setSelectedConversations(new Set());
    setSearchQuery('');
    onClose();
  };

  // Get message preview text
  const getMessagePreview = () => {
    if (message.messageType === 'text') {
      return message.content;
    } else if (message.messageType === 'gif') {
      return '🎬 GIF';
    } else if (message.messageType === 'file') {
      return `📎 ${message.metadata?.fileName || 'File'}`;
    } else if (message.messageType === 'voice' || message.messageType === 'audio') {
      return '🎤 Voice message';
    } else if (message.messageType === 'sticker') {
      return '🎨 Sticker';
    }
    return message.content;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          {...FADE_IN}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Forward Message"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={springs.stiff}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <GlassCard variant="neon" glow className="relative overflow-hidden">
              <FocusTrap>
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  data-close
                  aria-label="Close"
                  className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="mb-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, ...springs.dramatic }}
                    className="bg-primary-500/20 mb-4 inline-flex rounded-full p-4"
                  >
                    <PaperAirplaneIcon className="h-8 w-8 text-primary-400" />
                  </motion.div>

                  <h2 className="mb-2 text-2xl font-bold text-white">Forward Message</h2>
                  <p className="text-sm text-gray-400">
                    Select up to {MAX_FORWARD_TARGETS} conversations to forward this message
                  </p>
                </div>

                {/* Message Preview */}
                <div className="border-primary-500/30 bg-primary-500/10 mb-4 rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-400">
                    Message Preview
                  </p>
                  <p className="mt-1 line-clamp-3 text-sm text-gray-300">{getMessagePreview()}</p>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] py-2 pl-10 pr-4 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:bg-[var(--token-card-bg)/0.6] focus:outline-none focus:ring-4"
                    />
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
                  </div>
                </div>

                {/* Conversation List */}
                <div className="mb-6 max-h-64 space-y-2 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      {searchQuery ? 'No conversations found' : 'No conversations available'}
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const isSelected = selectedConversations.has(conversation.id);
                      const avatarBorderId = readAvatarBorderId(conversation);
                      return (
                        <motion.button
                          key={conversation.id}
                          onClick={() => handleToggleConversation(conversation.id)}
                          whileHover={{ opacity: 0.9 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                            isSelected
                              ? 'bg-primary-500/20 border-primary-500'
                              : 'bg-[var(--token-card-bg)/0.4]/50 border-[var(--token-card-border)] hover:border-gray-500 hover:bg-[var(--token-card-bg)/0.4]'
                          }`}
                        >
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            {conversation.avatarUrl ? (
                              <ThemedAvatar
                                src={conversation.avatarUrl}
                                alt={conversation.name || 'Conversation'}
                                size="medium"
                                avatarBorderId={avatarBorderId}
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-semibold text-white">
                                {(conversation.name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Name */}
                          <div className="flex-1">
                            <p className="font-semibold text-white">
                              {conversation.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {conversation.type === 'direct' ? 'Direct message' : 'Group'}
                            </p>
                          </div>

                          {/* Checkmark */}
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                              isSelected
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-[var(--token-card-border)]'
                            }`}
                          >
                            {isSelected && <CheckIcon className="h-4 w-4 text-white" />}
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ opacity: 0.9 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="bg-[var(--token-card-bg)/0.4]/50 flex-1 rounded-xl border border-[var(--token-card-border)] px-6 py-3 font-semibold text-gray-300 transition-all hover:border-gray-500 hover:bg-[var(--token-card-bg)/0.4]"
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={{ opacity: selectedConversations.size > 0 ? 0.9 : 1 }}
                    whileTap={{ scale: selectedConversations.size > 0 ? 0.98 : 1 }}
                    onClick={handleForward}
                    disabled={selectedConversations.size === 0 || isForwarding}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all ${
                      selectedConversations.size > 0 && !isForwarding
                        ? 'shadow-primary-500/30 hover:shadow-primary-500/50 bg-primary-500 text-white shadow-lg hover:bg-primary-600'
                        : 'cursor-not-allowed bg-[var(--token-card-bg)/0.6] text-gray-500'
                    }`}
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                    {isForwarding
                      ? 'Forwarding...'
                      : `Forward${selectedConversations.size > 0 ? ` (${selectedConversations.size})` : ''}`}
                  </motion.button>
                </div>
              </FocusTrap>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
