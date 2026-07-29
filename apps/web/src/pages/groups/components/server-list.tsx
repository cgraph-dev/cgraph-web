/**
 * ServerList component
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  TicketIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { CreateGroupModal } from '@/modules/groups/components/group-list/create-group-modal';
import { useGroupStore } from '@/modules/groups/store';
import { Button, IconButton } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { ServerListProps } from './types';
import { ServerIcon } from './server-icon';
import { getGroupRoute } from '@/modules/groups/routing';

/**
 * Server List component with create group and join-by-invite support.
 */
export function ServerList({
  groups,
  activeGroupId,
  showMobileDirectory = false,
}: ServerListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { joinGroup } = useGroupStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return groups;

    return groups.filter(
      (group) =>
        group.name.toLocaleLowerCase().includes(query) ||
        group.description?.toLocaleLowerCase().includes(query)
    );
  }, [groups, searchQuery]);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const closeCreateModal = () => {
    setShowCreateModal(false);
    if (searchParams.has('create')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('create');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleJoinByInvite = async () => {
    if (!inviteCode.trim()) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      // Extract code from full URL if pasted
      const code = inviteCode.trim().split('/').pop() || inviteCode.trim();
      const group = await joinGroup(code);
      HapticFeedback.success();
      setShowJoinModal(false);
      setInviteCode('');
      navigate(group ? getGroupRoute(group) : '/groups');
    } catch {
      setJoinError('Invalid or expired invite code');
      HapticFeedback.error();
    } finally {
      setIsJoining(false);
    }
  };
  return (
    <>
      <div
        data-testid="groups-server-rail"
        className="cgraph-navigation-rail relative z-10 hidden w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto py-3 lg:flex"
      >
        <NavLink
          to="/messages"
          onClick={() => HapticFeedback.medium()}
          className="cgraph-control cgraph-control-icon cgraph-control-ghost flex h-12 w-12 shrink-0 items-center justify-center p-3"
          aria-label="Open direct messages"
          data-cgraph-material="solid"
          data-cgraph-surface="control"
          data-cgraph-state="idle"
          data-cgraph-variant="ghost"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </NavLink>

        <div className="mx-auto h-px w-8 bg-[var(--token-border-muted)]" />

        {groups.map((group) => (
          <ServerIcon key={group.id} group={group} isActive={group.id === activeGroupId} />
        ))}

        <IconButton
          icon={<PlusIcon />}
          label="Create new server"
          size="lg"
          className="h-12 w-12 shrink-0"
          onClick={() => {
            HapticFeedback.medium();
            setShowCreateModal(true);
          }}
        />
        <IconButton
          icon={<TicketIcon />}
          label="Join server with invite"
          size="lg"
          className="h-12 w-12 shrink-0"
          onClick={() => {
            HapticFeedback.medium();
            setShowJoinModal(true);
          }}
        />
        <NavLink
          to="/groups/explore"
          onClick={() => HapticFeedback.medium()}
          aria-label="Explore public groups"
          className="cgraph-control cgraph-control-icon cgraph-control-ghost flex h-12 w-12 shrink-0 items-center justify-center p-3"
          data-cgraph-material="solid"
          data-cgraph-surface="control"
          data-cgraph-state="idle"
          data-cgraph-variant="ghost"
        >
          <GlobeAltIcon className="h-6 w-6" />
        </NavLink>
      </div>

      <section
        data-testid="mobile-group-directory"
        aria-label="Your groups"
        className={`${showMobileDirectory ? 'flex' : 'hidden'} cgraph-workspace relative z-10 min-h-0 w-full flex-1 flex-col overflow-hidden lg:hidden`}
      >
        <header className="border-b border-[var(--token-border-muted)] px-5 pb-4 pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[var(--token-text-primary)]">Groups</h1>
              <p className="mt-0.5 text-sm text-[var(--token-text-secondary)]">
                Your communities and channels
              </p>
            </div>
            <NavLink
              to="/groups/explore"
              className="cgraph-control cgraph-control-icon cgraph-control-ghost flex h-11 w-11 shrink-0 items-center justify-center p-2"
              aria-label="Explore public groups"
              data-cgraph-material="solid"
              data-cgraph-surface="control"
              data-cgraph-state="idle"
              data-cgraph-variant="ghost"
            >
              <GlobeAltIcon className="h-5 w-5" />
            </NavLink>
          </div>

          <div className="relative mt-4">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--token-text-muted)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search your groups"
              aria-label="Search your groups"
              className="cgraph-field h-11 w-full pl-10 pr-3 text-sm"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              onClick={() => {
                HapticFeedback.medium();
                setShowCreateModal(true);
              }}
              leftIcon={<PlusIcon />}
              fullWidth
              className="min-h-11"
            >
              Create
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                HapticFeedback.medium();
                setShowJoinModal(true);
              }}
              leftIcon={<TicketIcon />}
              fullWidth
              className="min-h-11"
            >
              Join
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {filteredGroups.length > 0 ? (
            <ul className="space-y-1" aria-label="Group list">
              {filteredGroups.map((group) => (
                <li key={group.id}>
                  <NavLink
                    to={getGroupRoute(group)}
                    onClick={() => HapticFeedback.medium()}
                    className="cgraph-list-row flex min-h-[68px] items-center gap-3 px-3 py-2.5"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--token-interactive-primary)] text-base font-bold text-[var(--token-text-on-primary)]">
                      {group.iconUrl ? (
                        <img
                          src={group.iconUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        group.name.charAt(0).toLocaleUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--token-text-primary)]">
                        {group.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[var(--token-text-muted)]">
                        {group.description ||
                          `${group.memberCount.toLocaleString()} member${group.memberCount === 1 ? '' : 's'}`}
                      </p>
                      {group.onlineMemberCount > 0 && (
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--token-feedback-success)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--token-feedback-success)]" />
                          {group.onlineMemberCount.toLocaleString()} online
                        </p>
                      )}
                    </div>
                    <ChevronRightIcon className="h-5 w-5 shrink-0 text-[var(--token-text-muted)]" />
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
              <UserGroupIcon className="h-10 w-10 text-[var(--token-text-muted)]" />
              <h2 className="mt-3 text-base font-semibold text-[var(--token-text-primary)]">
                {searchQuery ? 'No matching groups' : 'No groups yet'}
              </h2>
              <p className="mt-1 max-w-xs text-sm text-[var(--token-text-muted)]">
                {searchQuery
                  ? 'Try another group name.'
                  : 'Create a group, join with an invite, or explore public communities.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateGroupModal isOpen={showCreateModal} onClose={closeCreateModal} />
        )}
      </AnimatePresence>

      {/* Join by Invite Code Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent ariaLabel="Join a Server">
          <DialogHeader className="text-center">
            <TicketIcon className="mx-auto mb-3 h-10 w-10 text-[var(--token-interactive-primary)]" />
            <DialogTitle>Join a Server</DialogTitle>
            <DialogDescription>Enter an invite link or code</DialogDescription>
          </DialogHeader>

          {joinError && (
            <div
              role="alert"
              className="mt-4 rounded-[var(--product-radius-md)] border border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] px-3 py-2 text-sm text-[var(--token-feedback-error)]"
            >
              {joinError}
            </div>
          )}

          <Input
            type="text"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="https://cgraph.org/invite/abc123 or abc123"
            label="Invite link or code"
            className="mt-4"
            onKeyDown={(event) => event.key === 'Enter' && handleJoinByInvite()}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleJoinByInvite}
              disabled={!inviteCode.trim() || isJoining}
              isLoading={isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Server'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
