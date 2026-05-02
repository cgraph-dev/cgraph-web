import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useChatStore } from '@/modules/chat/store/chatStore.impl';
import { createLogger } from '@/lib/logger';
import { http } from '@/lib/api-client';
import { isRecord, asString, asOptionalString, asEnum } from '@/lib/api-utils';
import { getAvatarBorderId } from '@/lib/utils';
import type { NewChatModalProps, MockUser } from './types';
import { FADE_IN } from '@/lib/animations/transitions';
import { TypePicker, type ChatTierType } from '@/pages/messages/new-chat/type-picker';
import { WebOnlyRecipientPrompt } from '@/pages/messages/new-chat/web-only-recipient-prompt';

const logger = createLogger('NewChatModal');

/**
 * Modal for creating a new 1:1 or group conversation. Searches users
 * with debounced `/api/v1/users/search` calls, lets the sender pick a
 * Cloud or Secret tier for 1:1 chats, and creates the conversation via
 * the chat store before navigating to the new thread.
 */
export function NewChatModal({ onClose }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [chatType, setChatType] = useState<ChatTierType>('cloud');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { createConversation } = useChatStore();

  // Search users from API with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Backend exposes user search at /search/users (SearchController),
        // not /users/search. The wrong path 404s and the modal shows an
        // empty list, which looked like "search is broken".
        const response = await http.get('/api/v1/search/users', {
          params: { q: searchQuery, limit: 20 },
        });
        const results = response.data?.users || response.data?.data || [];
        setUsers(
          results.filter(isRecord).map((u: Record<string, unknown>) => ({
            id: asString(u.id),
            username: asString(u.username),
            displayName: asString(u.display_name, asString(u.username)),
            avatarUrl: asOptionalString(u.avatar_url) ?? null,
            status: asEnum(u.status, ['online', 'offline'] as const, 'offline'),
          }))
        );
      } catch (error) {
        logger.error('Failed to search users:', error);
        setUsers([]);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleStartChat = async () => {
    if (selectedUsers.length === 0) return;
    setIsStarting(true);
    try {
      const conversation = await createConversation(selectedUsers, { type: chatType });
      HapticFeedback.success();
      onClose();
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      logger.error('Failed to create conversation:', error);
      HapticFeedback.error();
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <motion.div
      {...FADE_IN}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="crystal" glow className="p-6">
          <h2 className="mb-4 text-xl font-bold text-white">New Conversation</h2>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] py-2 pl-9 pr-4 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:bg-[var(--token-card-bg)/0.6] focus:outline-none focus:ring-4"
              autoFocus
            />
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedUsers.map((userId) => {
                const user = users.find((u) => u.id === userId);
                if (!user) return null;
                return (
                  <motion.div
                    key={userId}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-primary-600/20 flex items-center gap-1 rounded-full px-2 py-1 text-sm text-primary-400"
                  >
                    <span>{user.displayName}</span>
                    <button
                      onClick={() => setSelectedUsers((prev) => prev.filter((id) => id !== userId))}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* User List */}
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {users.map((user) => (
              <motion.button
                key={user.id}
                whileHover={{ x: 2 }}
                onClick={() => {
                  setSelectedUsers((prev) =>
                    prev.includes(user.id)
                      ? prev.filter((id) => id !== user.id)
                      : [...prev, user.id]
                  );
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  selectedUsers.includes(user.id)
                    ? 'bg-primary-600/20'
                    : 'hover:bg-[var(--token-card-bg)]'
                }`}
              >
                <div className="relative">
                  <ThemedAvatar
                    src={user.avatarUrl}
                    alt={user.displayName}
                    size="small"
                    avatarBorderId={getAvatarBorderId(user)}
                  />
                  {user.status === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-dark-900 bg-green-500" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-white">{user.displayName}</p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                </div>
                {selectedUsers.includes(user.id) && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600">
                    <span className="text-xs text-white">✓</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Tier picker — only shown for 1:1 conversations. Group chats
              use their own E2EE path and don't surface the cloud/secret
              choice here. */}
          {selectedUsers.length === 1 && (
            <div className="mt-4 space-y-3 rounded-xl border border-[var(--token-border-muted)] bg-black/20 p-3">
              <TypePicker onChange={setChatType} defaultValue={chatType} />
              <WebOnlyRecipientPrompt
                recipientId={selectedUsers[0]!}
                chosenType={chatType}
                onChange={setChatType}
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-[var(--token-card-bg)/0.6] py-2 text-gray-300 hover:bg-[var(--token-card-bg)/0.8]"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartChat}
              disabled={selectedUsers.length === 0 || isStarting}
              className="flex-1 rounded-xl bg-primary-600 py-2 font-semibold text-white disabled:opacity-50"
            >
              {isStarting
                ? 'Creating...'
                : selectedUsers.length > 1
                  ? 'Create Group'
                  : 'Start Chat'}
            </motion.button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
