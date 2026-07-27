import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { Button, IconButton } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useChatStore } from '@/modules/chat/store/chatStore.impl';
import { createLogger } from '@/lib/logger';
import { http } from '@/lib/api-client';
import { isRecord, asString, asOptionalString, asEnum } from '@/lib/api-utils';
import {
  getMaxRateLimitRemainingMs,
  rememberRateLimit,
  SEARCH_READ_RATE_LIMIT_SCOPE,
} from '@/lib/api-rate-limit';
import { getAvatarBorderId } from '@/lib/utils';
import type { NewChatModalProps, MockUser } from './types';
import { TypePicker, type ChatTierType } from '@/pages/messages/new-chat/type-picker';
import { WebOnlyRecipientPrompt } from '@/pages/messages/new-chat/web-only-recipient-prompt';

const logger = createLogger('NewChatModal');
const USER_SEARCH_RATE_LIMIT_SCOPES = [SEARCH_READ_RATE_LIMIT_SCOPE] as const;

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
        if (getMaxRateLimitRemainingMs(USER_SEARCH_RATE_LIMIT_SCOPES) > 0) {
          setUsers([]);
          return;
        }

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
        if (!rememberRateLimit(USER_SEARCH_RATE_LIMIT_SCOPES, error)) {
          logger.error('Failed to search users:', error);
        }
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent ariaLabel="New conversation" className="max-w-md p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>Choose people and the conversation type.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 pt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cgraph-field peer w-full pl-9 pr-4 text-sm"
              autoFocus
            />
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Selected people">
              {selectedUsers.map((userId) => {
                const user = users.find((u) => u.id === userId);
                if (!user) return null;
                return (
                  <div
                    key={userId}
                    className="flex items-center gap-1 rounded-full border border-[var(--product-line)] bg-[var(--product-surface-selected)] py-1 pl-2.5 pr-1 text-sm text-[var(--token-text-primary)]"
                  >
                    <span>{user.displayName}</span>
                    <IconButton
                      icon={<XMarkIcon />}
                      label={`Remove ${user.displayName}`}
                      size="sm"
                      onClick={() => setSelectedUsers((prev) => prev.filter((id) => id !== userId))}
                      className="h-7 min-h-7 w-7 min-w-7"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="max-h-60 space-y-1 overflow-y-auto" aria-label="People">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  setSelectedUsers((prev) =>
                    prev.includes(user.id)
                      ? prev.filter((id) => id !== user.id)
                      : [...prev, user.id]
                  );
                }}
                aria-pressed={selectedUsers.includes(user.id)}
                className="cgraph-list-row flex w-full items-center gap-3 px-3 py-2"
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
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium text-[var(--token-text-primary)]">
                    {user.displayName}
                  </p>
                  <p className="truncate text-xs text-[var(--token-text-muted)]">@{user.username}</p>
                </div>
                {selectedUsers.includes(user.id) && (
                  <CheckIcon className="h-5 w-5 text-[var(--token-interactive-primary)]" />
                )}
              </button>
            ))}
          </div>

          {/* Tier picker — only shown for 1:1 conversations. Group chats
              use their own E2EE path and don't surface the cloud/secret
              choice here. */}
          {selectedUsers.length === 1 && (
            <div
              className="cgraph-section space-y-3 p-3"
              data-cgraph-material="recessed"
            >
              <TypePicker onChange={setChatType} defaultValue={chatType} />
              <WebOnlyRecipientPrompt
                recipientId={selectedUsers[0]!}
                chosenType={chatType}
                onChange={setChatType}
              />
            </div>
          )}

        </div>

        <DialogFooter className="mx-5 mb-5">
            <Button onClick={onClose} variant="ghost" animated={false}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleStartChat()}
              disabled={selectedUsers.length === 0 || isStarting}
              isLoading={isStarting}
              animated={false}
            >
              {selectedUsers.length > 1
                  ? 'Create Group'
                  : 'Start Chat'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
