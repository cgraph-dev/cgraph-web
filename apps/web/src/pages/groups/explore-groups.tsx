/**
 * Explore Groups Page
 *
 * Dedicated page for discovering and joining public groups.
 * Features search, sort, and join functionality.
 *
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useGroupStore } from '@/modules/groups/store';
import type { Group } from '@/modules/groups/store';
import { Button, IconButton } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
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
    <div className="cgraph-workspace flex flex-1 flex-col overflow-y-auto">
      <header className="cgraph-pane-header px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <IconButton
            icon={<ArrowLeftIcon />}
            label="Back to groups"
            onClick={() => navigate('/groups')}
          />
          <div className="flex min-w-0 items-center gap-2">
            <GlobeAltIcon className="h-6 w-6 shrink-0 text-[var(--token-interactive-primary)]" />
            <div>
              <h1 className="text-xl font-semibold text-[var(--token-text-primary)]">
                Explore Groups
              </h1>
              <p className="text-xs text-[var(--token-text-muted)]">
                Find public communities to join.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search public groups..."
              className="cgraph-field peer w-full py-2 pl-10 pr-4 text-sm"
            />
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--token-text-muted)] peer-focus:text-[var(--token-interactive-primary)]" />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort groups"
            className="cgraph-field px-4 py-2 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="cgraph-content flex-1">
        {isLoadingDiscover && discoverableGroups.length === 0 ? (
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Loading public groups"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="cgraph-card space-y-4 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        ) : discoverableGroups.length === 0 ? (
          <div className="cgraph-empty-state">
            <div className="cgraph-empty-icon">
              <MagnifyingGlassIcon className="h-6 w-6" />
            </div>
            <h2>No groups found</h2>
            <p>{search ? 'Try a different search term.' : 'No public groups are available yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discoverableGroups.map((group) => (
              <article
                key={group.id}
                className="cgraph-card flex cursor-pointer flex-col p-4"
                data-cgraph-emphasis={group.is_node_gated || undefined}
                onClick={() => navigate(getGroupRoute(group))}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--product-line)] bg-[var(--product-surface-recessed)] text-lg font-semibold text-[var(--token-interactive-primary)]">
                    {group.iconUrl ? (
                      <img
                        src={group.iconUrl}
                        alt={group.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      group.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-[var(--token-text-primary)]">
                      {group.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--token-text-muted)]">
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="h-3.5 w-3.5" />
                        <span>
                          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      {group.is_node_gated && (
                        <div className="flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-amber-300">
                          <CurrencyDollarIcon className="h-3 w-3" />
                          <span>{group.gate_price_nodes} Nodes</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {group.description && (
                  <p className="mb-4 line-clamp-2 flex-1 text-sm text-[var(--token-text-muted)]">
                    {group.description}
                  </p>
                )}

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isMember(group.id)) handleJoin(group);
                  }}
                  disabled={isMember(group.id) || joiningId === group.id}
                  isLoading={joiningId === group.id}
                  variant={isMember(group.id) ? 'secondary' : 'primary'}
                  fullWidth
                  animated={false}
                >
                  {isMember(group.id)
                    ? 'Joined'
                    : group.is_node_gated
                        ? `Pay ${group.gate_price_nodes} Nodes`
                        : 'Join Group'}
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>

      {nodeGateGroup && (
        <NodeGateModal
          group={nodeGateGroup}
          onSuccess={handleNodeGateSuccess}
          onClose={() => setNodeGateGroup(null)}
        />
      )}
    </div>
  );
}
