/**
 * ServerList component
 */

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
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
import { GlassCard } from '@/shared/components/ui';
import type { ServerListProps } from './types';
import { ServerIcon } from './server-icon';
import { tweens, springs, loop } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';
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
        className="bg-[var(--token-card-bg)]/40 relative z-10 hidden w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-[var(--token-card-border)] py-3 backdrop-blur-3xl transition-all duration-300 lg:flex"
      >
      {/* Ambient glow */}
      <div className="from-primary-500/5 to-purple-500/5 pointer-events-none absolute inset-0 bg-gradient-to-b via-black/20" />

      {/* Home/DMs button */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={springs.bouncy}
      >
        <NavLink
          to="/messages"
          onClick={() => HapticFeedback.medium()}
          className="group relative"
          aria-label="Open direct messages"
        >
          <motion.div className="group-hover:border-primary-500/30 group-hover:bg-primary-600/20 relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)/0.3] shadow-[0_4px_16px_rgba(0,0,0,0.3),rgba(255,255,255,0.02)_0px_1px_1px_inset] backdrop-blur-md transition-all duration-300">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-white/50 transition-colors group-hover:text-white" />
          </motion.div>
          <motion.div
            className="bg-primary-600/10 pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-md group-hover:opacity-100"
            transition={tweens.standard}
          />
        </NavLink>
      </motion.div>

      <div className="mx-auto h-[1px] w-8 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Server list */}
      {groups.map((group) => (
        <motion.div
          key={group.id}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...springs.bouncy, delay: 0.1 }}
        >
          <ServerIcon group={group} isActive={group.id === activeGroupId} />
        </motion.div>
      ))}

      {/* Add server button */}
      <motion.button
        onClick={() => {
          HapticFeedback.medium();
          setShowCreateModal(true);
        }}
        aria-label="Create new server"
        className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)/0.3] backdrop-blur-md transition-all duration-300 hover:border-[var(--token-card-border)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.08)]"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-brand-purple) 5%, transparent) 0%, rgba(59,130,246,0.03) 100%)',
        }}
      >
        {/* Hover Gradient Overlay */}
        <div className="from-violet-600/10 absolute inset-0 rounded-xl bg-gradient-to-br to-blue-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <PlusIcon className="relative z-10 h-6 w-6 text-white/50 transition-colors group-hover:text-white" />
      </motion.button>

      {/* Join by invite button */}
      <motion.button
        onClick={() => {
          HapticFeedback.medium();
          setShowJoinModal(true);
        }}
        aria-label="Join server with invite"
        className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)/0.3] backdrop-blur-md transition-all duration-300 hover:border-[var(--token-card-border)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.08)]"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-brand-purple) 5%, transparent) 0%, rgba(59,130,246,0.03) 100%)',
        }}
      >
        {/* Hover Gradient Overlay */}
        <div className="from-violet-600/10 absolute inset-0 rounded-xl bg-gradient-to-br to-blue-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <TicketIcon className="relative z-10 h-6 w-6 text-white/40 transition-colors group-hover:text-white" />
      </motion.button>

      {/* Explore public groups */}
      <motion.div>
        <NavLink
          to="/groups/explore"
          onClick={() => HapticFeedback.medium()}
          aria-label="Explore public groups"
          className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)/0.3] backdrop-blur-md transition-all duration-300 hover:border-[var(--token-card-border)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.08)]"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--color-brand-purple) 5%, transparent) 0%, rgba(59,130,246,0.03) 100%)',
          }}
        >
          {/* Hover Gradient Overlay */}
          <div className="from-violet-600/10 absolute inset-0 rounded-xl bg-gradient-to-br to-blue-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={loop(tweens.ambient)}
            className="inline-block"
          >
            <GlobeAltIcon className="relative z-10 h-6 w-6 text-white/40 transition-colors group-hover:text-white" />
          </motion.div>
        </NavLink>
      </motion.div>
      </div>

      <section
        data-testid="mobile-group-directory"
        aria-label="Your groups"
        className={`${showMobileDirectory ? 'flex' : 'hidden'} relative z-10 min-h-0 w-full flex-1 flex-col overflow-hidden bg-[var(--token-bg-primary)] lg:hidden`}
      >
        <header className="border-b border-[var(--token-border-muted)] px-5 pb-4 pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white">Groups</h1>
              <p className="mt-0.5 text-sm text-white/50">Your communities and channels</p>
            </div>
            <NavLink
              to="/groups/explore"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--token-border-muted)] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              aria-label="Explore public groups"
            >
              <GlobeAltIcon className="h-5 w-5" />
            </NavLink>
          </div>

          <div className="relative mt-4">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search your groups"
              aria-label="Search your groups"
              className="h-11 w-full rounded-lg border border-[var(--token-border-muted)] bg-white/[0.04] pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                HapticFeedback.medium();
                setShowCreateModal(true);
              }}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              <PlusIcon className="h-5 w-5" />
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                HapticFeedback.medium();
                setShowJoinModal(true);
              }}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--token-border-muted)] bg-white/[0.04] px-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              <TicketIcon className="h-5 w-5" />
              Join
            </button>
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
                    className="flex min-h-[68px] items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-600 text-base font-bold text-white">
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
                      <p className="truncate text-sm font-semibold text-white">{group.name}</p>
                      <p className="mt-0.5 truncate text-xs text-white/45">
                        {group.description ||
                          `${group.memberCount.toLocaleString()} member${group.memberCount === 1 ? '' : 's'}`}
                      </p>
                      {group.onlineMemberCount > 0 && (
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {group.onlineMemberCount.toLocaleString()} online
                        </p>
                      )}
                    </div>
                    <ChevronRightIcon className="h-5 w-5 shrink-0 text-white/30" />
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
              <UserGroupIcon className="h-10 w-10 text-white/25" />
              <h2 className="mt-3 text-base font-semibold text-white">
                {searchQuery ? 'No matching groups' : 'No groups yet'}
              </h2>
              <p className="mt-1 max-w-xs text-sm text-white/45">
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
      {createPortal(
        <AnimatePresence>
          {showJoinModal && (
            <motion.div
              {...FADE_IN}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => setShowJoinModal(false)}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: 0.2 },
                }}
                className="group relative w-full max-w-md overflow-hidden rounded-[26px] p-[1.5px]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Landing Navbar Style Border - Persistent & Razor Sharp */}
                <motion.div
                  className="absolute inset-0 z-0 bg-[linear-gradient(90deg,transparent_0%,#10b981_25%,var(--color-brand-purple)_50%,#3b82f6_75%,transparent_100%)]"
                  style={{ backgroundSize: '200% 100%', WebkitBackfaceVisibility: 'hidden' }}
                  animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />

                <GlassCard
                  variant="default"
                  className="relative z-10 !rounded-[24.5px] border-none bg-[var(--token-bg-primary)] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
                >
                  <div className="mb-6 text-center">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={loop(tweens.ambient)}
                      className="mb-3 inline-block"
                    >
                      <TicketIcon className="text-primary-400/60 mx-auto h-10 w-10" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-white/90">Join a Server</h2>
                    <p className="mt-1 text-[13px] font-medium text-white/40">
                      Enter an invite link or code
                    </p>
                  </div>

                  {joinError && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                      {joinError}
                    </div>
                  )}

                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="https://cgraph.org/invite/abc123 or abc123"
                    className="mb-6 w-full rounded-xl border border-[var(--token-border-muted)] bg-black/40 px-4 py-3 text-[13px] text-white placeholder-white/20 shadow-[rgba(255,255,255,0.02)_0px_1px_1px_inset] transition-all hover:bg-black/60 focus:border-white/[0.1] focus:bg-black/80 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinByInvite()}
                  />

                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setShowJoinModal(false)}
                      className="flex-1 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-primary)/0.3] py-3 text-[13px] font-bold text-white/40 transition-all hover:border-[var(--token-card-border)] hover:bg-[var(--token-card-bg)/0.6] hover:text-white/80"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleJoinByInvite}
                      disabled={!inviteCode.trim() || isJoining}
                      className="border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/16 flex-1 rounded-xl border py-3 text-[13px] font-bold text-primary-300 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isJoining ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="border-primary-300/30 h-4 w-4 animate-spin rounded-full border-2 border-t-primary-300" />
                          <span>Joining...</span>
                        </div>
                      ) : (
                        'Join Server'
                      )}
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
