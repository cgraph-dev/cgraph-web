/**
 * Explore Groups Page
 *
 * Dedicated page for discovering and joining public groups.
 * Features search, sort, and join functionality.
 *
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useGroupStore } from '@/modules/groups/store';
import type { Group } from '@/modules/groups/store';
import { GlassCard } from '@/shared/components/ui';
import { durations } from '@cgraph-dev/animation-constants';
import { tweens, loop, springs } from '@/lib/animation-presets';
import { captureError } from '@/lib/error-tracking';
import { NodeGateModal } from '@/modules/groups/components/node-gate-modal';
import { getGroupRoute, getKnownGroupRoute } from '@/modules/groups/routing';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
] as const;

/**
 * Explore Groups page component.
 */
export default function ExploreGroups() {
  const navigate = useNavigate();
  const {
    discoverableGroups,
    isLoadingDiscover,
    fetchDiscoverableGroups,
    joinPublicGroup,
    groups,
  } = useGroupStore();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string>('popular');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [nodeGateGroup, setNodeGateGroup] = useState<Group | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Initial fetch
  useEffect(() => {
    fetchDiscoverableGroups({ sort });
  }, [fetchDiscoverableGroups, sort]);

  // Debounced search
  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDiscoverableGroups({ search: value, sort });
    }, 300);
  }

  // Join a public group (or open gate modal for node-gated groups)
  const handleJoin = async (group: Group) => {
    if (group.is_node_gated) {
      setNodeGateGroup(group);
      return;
    }
    setJoiningId(group.id);
    try {
      const joinedGroup = await joinPublicGroup(group.id);
      navigate(getGroupRoute(joinedGroup ?? group));
    } catch (error: unknown) {
      captureError(error instanceof Error ? error : new Error('Failed to join group'));
    } finally {
      setJoiningId(null);
    }
  };

  const handleNodeGateSuccess = () => {
    const groupId = nodeGateGroup?.id;
    const route = getKnownGroupRoute(nodeGateGroup);
    setNodeGateGroup(null);
    if (groupId) {
      navigate(getKnownGroupRoute(groups.find((group) => group.id === groupId), route));
    }
  };

  // Check if user is already a member
  const isMember = (groupId: string) => groups.some((g) => g.id === groupId);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <div className="border-b border-[var(--token-card-border)] px-6 py-4">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate('/groups')}
            className="rounded-lg p-2 text-white/60 transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </motion.button>

          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={loop(tweens.ambient)}
              className="inline-block"
            >
              <GlobeAltIcon className="h-6 w-6 text-primary-400" />
            </motion.div>
            <h1 className="text-xl font-bold text-white">Explore Groups</h1>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search public groups..."
              className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] py-2.5 pl-10 pr-4 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:bg-[var(--token-card-bg)/0.6] focus:outline-none focus:ring-4"
            />
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="focus:ring-primary-500/50 rounded-xl bg-white/[0.08] px-4 py-2.5 text-sm text-white outline-none ring-1 ring-white/10"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {isLoadingDiscover && discoverableGroups.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : discoverableGroups.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springs.bouncy}
            >
              <GlassCard variant="holographic" className="p-16 text-center">
                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-1 w-1 rounded-full bg-primary-400"
                    style={{
                      left: `${50 + Math.cos((i * Math.PI * 2) / 6) * 20}%`,
                      top: `${40 + Math.sin((i * Math.PI * 2) / 6) * 20}%`,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: durations.cinematic.ms / 1000,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                  transition={loop(tweens.glacial)}
                  className="relative mb-4 inline-block"
                >
                  <MagnifyingGlassIcon className="mx-auto h-20 w-20 text-primary-400" />
                  <motion.div
                    className="border-primary-500/30 absolute inset-0 rounded-full border-2"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={loop(tweens.decorative)}
                  />
                </motion.div>
                <h3 className="mb-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
                  No groups found
                </h3>
                <p className="max-w-md text-gray-400">
                  {search ? 'Try a different search term' : 'No public groups available yet'}
                </p>
              </GlassCard>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discoverableGroups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hover:border-primary-500/30 cursor-pointer rounded-xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] p-4 transition-colors hover:bg-[var(--token-card-bg)/0.4]"
                onClick={() => navigate(getGroupRoute(group))}
              >
                {/* Group Banner / Icon */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 text-lg font-bold text-white">
                    {group.iconUrl ? (
                      <img
                        src={group.iconUrl}
                        alt={group.name}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      group.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-white">{group.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="h-3.5 w-3.5" />
                        <span>
                          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      {group.is_node_gated && (
                        <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-amber-400">
                          <CurrencyDollarIcon className="h-3 w-3" />
                          <span>{group.gate_price_nodes} Nodes</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {group.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-white/60">{group.description}</p>
                )}

                {/* Join Button */}
                <motion.button
                  whileTap={!isMember(group.id) && joiningId !== group.id ? { scale: 0.98 } : {}}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isMember(group.id)) handleJoin(group);
                  }}
                  disabled={isMember(group.id) || joiningId === group.id}
                  className={`w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                    isMember(group.id)
                      ? 'bg-[var(--token-card-bg)/0.6] text-white/40'
                      : joiningId === group.id
                        ? 'bg-primary-600/50 text-white/60'
                        : 'bg-primary-600 text-white hover:bg-primary-500'
                  }`}
                >
                  {isMember(group.id)
                    ? 'Joined'
                    : joiningId === group.id
                      ? 'Joining...'
                      : group.is_node_gated
                        ? `Pay ${group.gate_price_nodes} Nodes`
                        : 'Join Group'}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Node Gate Modal */}
      <AnimatePresence>
        {nodeGateGroup && (
          <NodeGateModal
            group={nodeGateGroup}
            onSuccess={handleNodeGateSuccess}
            onClose={() => setNodeGateGroup(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
