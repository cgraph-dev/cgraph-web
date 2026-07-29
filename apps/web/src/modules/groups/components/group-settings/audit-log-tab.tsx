import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  HashtagIcon,
  ShieldCheckIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  LinkIcon,
  FaceSmileIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Button, IconButton } from '@/components/ui/button';
import Card from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/ui/skeleton';
import { FADE_UP } from '@/lib/animations/transitions';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { getGroupPermissionError } from '../../permission-errors';

const logger = createLogger('AuditLogTab');

interface AuditLogEntry {
  id: string;
  action: string;
  actor_id: string;
  target_user_id: string | null;
  changes: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
  actor_username?: string;
  target_username?: string;
}

interface AuditLogTabProps {
  groupId: string;
}

const ACTION_CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> =
  {
    group_update: {
      label: 'Group Updated',
      icon: Cog6ToothIcon,
      color: 'text-[var(--token-feedback-info)]',
    },
    group_delete: {
      label: 'Group Deleted',
      icon: Cog6ToothIcon,
      color: 'text-[var(--token-feedback-error)]',
    },
    channel_create: {
      label: 'Channel Created',
      icon: HashtagIcon,
      color: 'text-[var(--token-feedback-success)]',
    },
    channel_update: {
      label: 'Channel Updated',
      icon: HashtagIcon,
      color: 'text-[var(--token-feedback-info)]',
    },
    channel_delete: {
      label: 'Channel Deleted',
      icon: HashtagIcon,
      color: 'text-[var(--token-feedback-error)]',
    },
    member_kick: {
      label: 'Member Kicked',
      icon: UsersIcon,
      color: 'text-[var(--token-feedback-warning)]',
    },
    member_ban: {
      label: 'Member Banned',
      icon: UsersIcon,
      color: 'text-[var(--token-feedback-error)]',
    },
    member_unban: {
      label: 'Member Unbanned',
      icon: UsersIcon,
      color: 'text-[var(--token-feedback-success)]',
    },
    member_mute: {
      label: 'Member Muted',
      icon: UsersIcon,
      color: 'text-[var(--token-feedback-warning)]',
    },
    member_unmute: {
      label: 'Member Unmuted',
      icon: UsersIcon,
      color: 'text-[var(--token-feedback-success)]',
    },
    member_role_update: {
      label: 'Role Changed',
      icon: ShieldCheckIcon,
      color: 'text-[var(--token-interactive-primary)]',
    },
    role_create: {
      label: 'Role Created',
      icon: ShieldCheckIcon,
      color: 'text-[var(--token-feedback-success)]',
    },
    role_update: {
      label: 'Role Updated',
      icon: ShieldCheckIcon,
      color: 'text-[var(--token-feedback-info)]',
    },
    role_delete: {
      label: 'Role Deleted',
      icon: ShieldCheckIcon,
      color: 'text-[var(--token-feedback-error)]',
    },
    message_delete: {
      label: 'Message Deleted',
      icon: ChatBubbleLeftIcon,
      color: 'text-[var(--token-feedback-error)]',
    },
    message_pin: {
      label: 'Message Pinned',
      icon: ChatBubbleLeftIcon,
      color: 'text-[var(--token-feedback-warning)]',
    },
    message_unpin: {
      label: 'Message Unpinned',
      icon: ChatBubbleLeftIcon,
      color: 'text-[var(--token-text-muted)]',
    },
    invite_create: {
      label: 'Invite Created',
      icon: LinkIcon,
      color: 'text-[var(--token-feedback-success)]',
    },
    invite_delete: {
      label: 'Invite Deleted',
      icon: LinkIcon,
      color: 'text-[var(--token-feedback-error)]',
    },
    emoji_create: {
      label: 'Emoji Added',
      icon: FaceSmileIcon,
      color: 'text-[var(--token-feedback-success)]',
    },
    emoji_delete: {
      label: 'Emoji Removed',
      icon: FaceSmileIcon,
      color: 'text-[var(--token-feedback-error)]',
    },
  };

const FILTER_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'channel', label: 'Channels' },
  { value: 'member', label: 'Members' },
  { value: 'role', label: 'Roles' },
  { value: 'message', label: 'Messages' },
  { value: 'invite', label: 'Invites' },
  { value: 'emoji', label: 'Emojis' },
  { value: 'group', label: 'Group' },
];

const PER_PAGE = 25;
const AUDIT_PERMISSION_COPY = 'You do not have permission to view this group audit log.';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderChanges(changes: Record<string, unknown> | null) {
  if (!changes || Object.keys(changes).length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {Object.entries(changes).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-xs text-[var(--token-text-muted)]">
          <span className="font-mono text-[var(--token-text-secondary)]">{key}:</span>
          <span className="text-[var(--token-text-secondary)]">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Audit Log Tab component.
 */
export function AuditLogTab({ groupId }: AuditLogTabProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLog = useCallback(
    async (cursor?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await http.get(`/api/v1/groups/${groupId}/audit-log`, {
          params: { cursor, limit: PER_PAGE },
        });
        const incoming: AuditLogEntry[] = res.data.data ?? [];
        const pageInfo = res.data.page_info;

        setEntries((current) => {
          if (!cursor) return incoming;
          const entriesById = new Map(current.map((entry) => [entry.id, entry]));
          incoming.forEach((entry) => entriesById.set(entry.id, entry));
          return Array.from(entriesById.values());
        });
        setNextCursor(pageInfo?.end_cursor ?? null);
        setHasNext(Boolean(pageInfo?.has_next_page && pageInfo?.end_cursor));
      } catch (error) {
        logger.error('Failed to fetch audit log', error);
        setError(
          getGroupPermissionError(
            error,
            AUDIT_PERMISSION_COPY,
            'Failed to load the audit log. Please try again.'
          )
        );
        if (!cursor) {
          setEntries([]);
          setNextCursor(null);
          setHasNext(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [groupId]
  );

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  const handleLoadMore = () => {
    if (nextCursor) fetchAuditLog(nextCursor);
  };

  const filteredEntries = entries.filter((entry) => {
    if (filterCategory && !entry.action.startsWith(filterCategory)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const actionInfo = ACTION_CATEGORIES[entry.action];
      const label = actionInfo?.label.toLowerCase() || '';
      const actor = (entry.actor_username || entry.actor_id || '').toLowerCase();
      const target = (entry.target_username || entry.target_user_id || '').toLowerCase();
      return label.includes(q) || actor.includes(q) || target.includes(q);
    }
    return true;
  });

  return (
    <motion.div {...FADE_UP} className="max-w-3xl space-y-4">
      <div className="cgraph-page-header">
        <div>
          <p className="cgraph-eyebrow">Group settings</p>
          <h2 className="text-2xl font-bold text-[var(--token-text-primary)]">Audit Log</h2>
          <p className="mt-1 text-sm text-[var(--token-text-muted)]">
            Review recent administrative changes in this group.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            icon={<FunnelIcon />}
            label={showFilters ? 'Hide audit filters' : 'Show audit filters'}
            variant={showFilters || filterCategory ? 'primary' : 'ghost'}
            onClick={() => setShowFilters(!showFilters)}
          />
          <IconButton
            icon={<ArrowPathIcon className={loading ? 'animate-spin' : ''} />}
            label="Refresh audit log"
            onClick={() => fetchAuditLog()}
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-[var(--product-radius-md)] border border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] px-3 py-2 text-sm text-[var(--token-feedback-error)]"
        >
          {error}
        </div>
      )}

      <Card className="space-y-3">
        <Input
          aria-label="Search audit log"
          type="search"
          placeholder="Search audit log..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
        />

        <AnimatePresence>
          {showFilters && (
            <motion.div
              key="audit-filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <fieldset>
                <legend className="sr-only">Filter audit log by action category</legend>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.map((option) => {
                    const selected = filterCategory === option.value;
                    return (
                      <label
                        key={option.value}
                        className="cgraph-list-row min-h-9 cursor-pointer px-3 py-2 text-xs font-medium"
                        data-selected={selected || undefined}
                      >
                        <input
                          type="radio"
                          name="audit-action-filter"
                          value={option.value}
                          checked={selected}
                          onChange={() => setFilterCategory(option.value)}
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {loading && entries.length === 0 ? (
          <Skeleton shape="message" count={5} className="p-4" />
        ) : filteredEntries.length === 0 ? (
          <div className="cgraph-empty-state">
            <div className="cgraph-empty-icon">
              <Cog6ToothIcon className="h-6 w-6" />
            </div>
            <h3>{searchQuery || filterCategory ? 'No matching entries' : 'No recent actions'}</h3>
            <p>
              {searchQuery || filterCategory
                ? 'Adjust the search or action filter.'
                : 'Administrative changes will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--product-line)]">
            {filteredEntries.map((entry) => {
              const actionInfo = ACTION_CATEGORIES[entry.action] || {
                label: entry.action,
                icon: Cog6ToothIcon,
                color: 'text-[var(--token-text-muted)]',
              };
              const Icon = actionInfo.icon;

              return (
                <li key={entry.id} className="flex items-start gap-3 p-4">
                  <div className={`cgraph-empty-icon mb-0 h-10 w-10 shrink-0 ${actionInfo.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium text-[var(--token-text-primary)]">
                        {entry.actor_username || entry.actor_id.slice(0, 8)}
                      </span>
                      <span className={`text-sm ${actionInfo.color}`}>{actionInfo.label}</span>
                      {entry.target_user_id && (
                        <>
                          <ArrowRightIcon className="h-3.5 w-3.5 text-[var(--token-text-muted)]" />
                          <span className="text-sm text-[var(--token-text-secondary)]">
                            {entry.target_username || entry.target_user_id.slice(0, 8)}
                          </span>
                        </>
                      )}
                    </div>
                    {entry.reason && (
                      <p className="mt-1 text-xs text-[var(--token-text-muted)]">
                        Reason: {entry.reason}
                      </p>
                    )}
                    {renderChanges(entry.changes)}
                  </div>
                  <time
                    dateTime={entry.created_at}
                    className="shrink-0 text-xs text-[var(--token-text-muted)]"
                  >
                    {formatDate(entry.created_at)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {hasNext && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            animated={false}
            onClick={handleLoadMore}
            disabled={loading}
            isLoading={loading}
          >
            Load more
          </Button>
        </div>
      )}
    </motion.div>
  );
}
