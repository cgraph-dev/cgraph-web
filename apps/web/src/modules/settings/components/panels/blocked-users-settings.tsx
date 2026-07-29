import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import {
  Avatar,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  GlassCard,
} from '@/shared/components/ui';
import { InlineLoadingSpinner } from '@/components/feedback/loading-spinner';
import { useProfileStore, type BlockedUser } from '@/modules/social/store';

const PAGE_SIZE = 50;

interface BlockedUsersPageState {
  endCursor: string | null;
  hasNextPage: boolean;
  totalCount: number | null;
}

const EMPTY_PAGE_STATE: BlockedUsersPageState = {
  endCursor: null,
  hasNextPage: false,
  totalCount: null,
};

function displayName(user: BlockedUser): string {
  return user.displayName || user.username || 'Blocked user';
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Unable to update blocked users.';
}

export function BlockedUsersSettings() {
  const { blockedUsers, fetchBlockedUsers, isLoadingBlocked, unblockUser } = useProfileStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [pageState, setPageState] = useState<BlockedUsersPageState>(EMPTY_PAGE_STATE);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const blockedCount = pageState.totalCount ?? blockedUsers.length;

  const loadFirstPage = useCallback(async () => {
    setError(null);

    try {
      const nextPage = await fetchBlockedUsers({
        limit: PAGE_SIZE,
        includeTotal: true,
      });
      setPageState(nextPage);
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, [fetchBlockedUsers]);

  const loadMore = useCallback(async () => {
    if (!pageState.hasNextPage || !pageState.endCursor || isLoadingBlocked) return;

    setError(null);

    try {
      const nextPage = await fetchBlockedUsers({
        cursor: pageState.endCursor,
        limit: PAGE_SIZE,
        append: true,
      });
      setPageState((current) => ({
        ...nextPage,
        totalCount: nextPage.totalCount ?? current.totalCount,
      }));
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, [fetchBlockedUsers, isLoadingBlocked, pageState.endCursor, pageState.hasNextPage]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const selectedUserName = useMemo(
    () => (selectedUser ? displayName(selectedUser) : ''),
    [selectedUser]
  );

  async function confirmUnblock() {
    if (!selectedUser) return;

    setError(null);
    setSuccessMessage(null);
    setIsUnblocking(true);

    try {
      await unblockUser(selectedUser.id);
      setPageState((current) => ({
        ...current,
        totalCount: current.totalCount === null ? null : Math.max(0, current.totalCount - 1),
      }));
      setSuccessMessage(`${selectedUserName} is no longer blocked.`);
      setSelectedUser(null);
    } catch (unblockError) {
      setError(errorMessage(unblockError));
    } finally {
      setIsUnblocking(false);
    }
  }

  function closeDialog() {
    if (isUnblocking) return;

    setSelectedUser(null);
    setError(null);
    setSuccessMessage(null);
    setIsOpen(false);
  }

  function openDialog() {
    setIsOpen(true);
    void loadFirstPage();
  }

  return (
    <>
      <GlassCard variant="default" className="aurora-social-panel p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-red-500/10 text-red-300">
              <NoSymbolIcon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Blocked users</h3>
              <p className="text-sm text-[var(--token-text-muted)]">
                {isLoadingBlocked ? 'Checking blocked users...' : `${blockedCount} blocked`}
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={openDialog}>
            Manage
          </Button>
        </div>
        {error && !isOpen ? (
          <div className="mt-3 flex items-center justify-between gap-3" role="alert">
            <p className="text-sm text-red-300">{error}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => void loadFirstPage()}>
              Retry
            </Button>
          </div>
        ) : null}
      </GlassCard>

      <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent ariaLabel="Blocked users" className="max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto">
          {selectedUser ? (
            <>
              <DialogHeader>
                <DialogTitle>Unblock {selectedUserName}?</DialogTitle>
                <DialogDescription>
                  They can send you a friend request again after you unblock them.
                </DialogDescription>
              </DialogHeader>
              {error ? (
                <p className="text-sm text-red-300" role="alert">
                  {error}
                </p>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedUser(null)}
                  disabled={isUnblocking}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => void confirmUnblock()}
                  isLoading={isUnblocking}
                >
                  Unblock user
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Blocked users</DialogTitle>
                <DialogDescription>
                  Blocked people cannot send you direct messages or see your friend presence.
                </DialogDescription>
              </DialogHeader>

              {error ? (
                <div className="flex items-center justify-between gap-3" role="alert">
                  <p className="text-sm text-red-300">{error}</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void loadFirstPage()}>
                    Retry
                  </Button>
                </div>
              ) : null}

              {successMessage ? (
                <p className="text-sm text-emerald-300" role="status">
                  {successMessage}
                </p>
              ) : null}

              {isLoadingBlocked && blockedUsers.length === 0 ? (
                <div className="flex justify-center py-8">
                  <InlineLoadingSpinner label="Loading blocked users" size="lg" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--token-text-muted)]">
                  No blocked users.
                </p>
              ) : (
                <div className="divide-y divide-[var(--token-border-muted)]">
                  {blockedUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 py-3">
                      <Avatar size="md" name={displayName(user)} src={user.avatarUrl ?? undefined} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--token-text-primary)]">
                          {displayName(user)}
                        </p>
                        {user.username ? (
                          <p className="truncate text-sm text-[var(--token-text-muted)]">@{user.username}</p>
                        ) : null}
                      </div>
                      <Button type="button" variant="danger" size="sm" onClick={() => setSelectedUser(user)}>
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void loadFirstPage()}
                  disabled={isLoadingBlocked}
                >
                  <ArrowPathIcon className="size-4" aria-hidden="true" />
                  Refresh
                </Button>
                {pageState.hasNextPage ? (
                  <Button type="button" variant="secondary" onClick={() => void loadMore()} disabled={isLoadingBlocked}>
                    Load more
                  </Button>
                ) : null}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
