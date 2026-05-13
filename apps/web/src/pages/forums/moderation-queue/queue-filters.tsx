/**
 * QueueFilters component
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { FilterState } from './types';

interface QueueFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const STATUS_VALUES: FilterState['status'][] = ['pending', 'all'];
const ITEM_TYPE_VALUES: FilterState['itemType'][] = [
  'all',
  'thread',
  'post',
  'comment',
  'user',
  'attachment',
];
const PRIORITY_VALUES: FilterState['priority'][] = ['all', 'critical', 'high', 'normal', 'low'];
const REASON_VALUES: FilterState['reason'][] = [
  'all',
  'new_user',
  'flagged',
  'auto_spam',
  'reported',
  'manual',
];

function isStatus(value: string): value is FilterState['status'] {
  return STATUS_VALUES.some((option) => option === value);
}

function isItemType(value: string): value is FilterState['itemType'] {
  return ITEM_TYPE_VALUES.some((option) => option === value);
}

function isPriority(value: string): value is FilterState['priority'] {
  return PRIORITY_VALUES.some((option) => option === value);
}

function isReason(value: string): value is FilterState['reason'] {
  return REASON_VALUES.some((option) => option === value);
}

/**
 */
/**
 * Queue Filters component.
 */
export function QueueFilters({ filters, setFilters }: QueueFiltersProps) {
  return (
    <GlassCard className="p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search content or username..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="w-full rounded-lg border border-dark-500 bg-[var(--token-card-bg)] py-2 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => {
            const value = e.target.value;
            if (isStatus(value)) {
              setFilters((prev) => ({ ...prev, status: value }));
            }
          }}
          className="rounded-lg border border-dark-500 bg-[var(--token-card-bg)] px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
        >
          <option value="pending">Pending Only</option>
          <option value="all">All Status</option>
        </select>

        {/* Type Filter */}
        <select
          value={filters.itemType}
          onChange={(e) => {
            const value = e.target.value;
            if (isItemType(value)) {
              setFilters((prev) => ({ ...prev, itemType: value }));
            }
          }}
          className="rounded-lg border border-dark-500 bg-[var(--token-card-bg)] px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
        >
          <option value="all">All Types</option>
          <option value="thread">Threads</option>
          <option value="post">Posts</option>
          <option value="comment">Comments</option>
          <option value="user">Users</option>
          <option value="attachment">Attachments</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => {
            const value = e.target.value;
            if (isPriority(value)) {
              setFilters((prev) => ({ ...prev, priority: value }));
            }
          }}
          className="rounded-lg border border-dark-500 bg-[var(--token-card-bg)] px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        {/* Reason Filter */}
        <select
          value={filters.reason}
          onChange={(e) => {
            const value = e.target.value;
            if (isReason(value)) {
              setFilters((prev) => ({ ...prev, reason: value }));
            }
          }}
          className="rounded-lg border border-dark-500 bg-[var(--token-card-bg)] px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
        >
          <option value="all">All Reasons</option>
          <option value="new_user">New User</option>
          <option value="flagged">Auto-Flagged</option>
          <option value="auto_spam">Spam Detection</option>
          <option value="reported">User Report</option>
          <option value="manual">Manual Review</option>
        </select>
      </div>
    </GlassCard>
  );
}
