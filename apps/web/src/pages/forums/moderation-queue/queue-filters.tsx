
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { FilterState } from './types';

interface QueueFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const STATUS_OPTIONS: FilterState['status'][] = ['pending', 'all'];
const ITEM_TYPE_OPTIONS: FilterState['itemType'][] = [
  'all',
  'thread',
  'post',
  'comment',
  'user',
  'attachment',
];
const PRIORITY_OPTIONS: FilterState['priority'][] = ['all', 'critical', 'high', 'normal', 'low'];
const REASON_OPTIONS: FilterState['reason'][] = [
  'all',
  'new_user',
  'flagged',
  'auto_spam',
  'reported',
  'manual',
];
const STATUS_VALUES = new Set<string>(STATUS_OPTIONS);
const ITEM_TYPE_VALUES = new Set<string>(ITEM_TYPE_OPTIONS);
const PRIORITY_VALUES = new Set<string>(PRIORITY_OPTIONS);
const REASON_VALUES = new Set<string>(REASON_OPTIONS);

function isStatus(value: string): value is FilterState['status'] {
  return STATUS_VALUES.has(value);
}

function isItemType(value: string): value is FilterState['itemType'] {
  return ITEM_TYPE_VALUES.has(value);
}

function isPriority(value: string): value is FilterState['priority'] {
  return PRIORITY_VALUES.has(value);
}

function isReason(value: string): value is FilterState['reason'] {
  return REASON_VALUES.has(value);
}

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
            const status = e.target.value;
            if (isStatus(status)) {
              setFilters((prev) => ({ ...prev, status }));
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
            const itemType = e.target.value;
            if (isItemType(itemType)) {
              setFilters((prev) => ({ ...prev, itemType }));
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
            const priority = e.target.value;
            if (isPriority(priority)) {
              setFilters((prev) => ({ ...prev, priority }));
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
            const reason = e.target.value;
            if (isReason(reason)) {
              setFilters((prev) => ({ ...prev, reason }));
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
