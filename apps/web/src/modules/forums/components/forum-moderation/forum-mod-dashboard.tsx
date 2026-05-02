/**
 * Forum Moderation Dashboard
 *
 * Tabbed interface: Queue, Warnings, Automod, Stats.
 *
 */
import { useState, useEffect } from 'react';
import { useForumModerationStore } from '../../store/use-forum-moderation-store';
import ForumAutomodSettings from './forum-automod-settings';
import WarningPanel from './warning-panel';
import { createLogger } from '@/lib/logger';
import type { ModerationQueueItem } from '../../store/forumStore.types';

const logger = createLogger('ForumModDashboard');

interface ForumModDashboardProps {
  forumId: string;
}

type TabId = 'queue' | 'warnings' | 'automod' | 'stats';

const TABS: { id: TabId; label: string }[] = [
  { id: 'queue', label: 'Queue' },
  { id: 'warnings', label: 'Warnings' },
  { id: 'automod', label: 'Automod' },
  { id: 'stats', label: 'Stats' },
];

type ForumModAction = 'approve' | 'remove' | 'hide';

/**
 * Forum moderation dashboard with tabbed navigation.
 */
export default function ForumModDashboard({ forumId }: ForumModDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('queue');

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex border-b dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'queue' && <ModQueueTab forumId={forumId} />}
        {activeTab === 'warnings' && <WarningPanel forumId={forumId} />}
        {activeTab === 'automod' && <ForumAutomodSettings forumId={forumId} />}
        {activeTab === 'stats' && <ModStatsTab forumId={forumId} />}
      </div>
    </div>
  );
}
function ModQueueTab({ forumId }: { forumId: string }) {
  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchForumModQueue = useForumModerationStore().fetchForumModQueue;
  const takeForumModAction = useForumModerationStore().takeForumModAction;

  useEffect(() => {
    let cancelled = false;
    const loadQueue = async () => {
      setIsLoading(true);
      try {
        const data = await fetchForumModQueue(forumId);
        if (!cancelled) setItems([...data]);
      } catch (error) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'loadQueue');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadQueue();
    return () => {
      cancelled = true;
    };
  }, [forumId, fetchForumModQueue]);

  const handleAction = async (postId: string, action: ForumModAction) => {
    try {
      await takeForumModAction(forumId, postId, action);
      setItems((prev) => prev.filter((i) => i.id !== postId));
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'handleAction');
    }
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading queue…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg">No items in moderation queue</p>
        <p className="mt-1 text-sm">All clear!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start justify-between rounded-lg border p-4 dark:border-gray-700"
        >
          <div className="flex-1">
            <p className="text-sm text-gray-900 dark:text-white">{item.content}</p>
            <p className="mt-1 text-xs text-gray-500">
              Reason: {item.reason || 'N/A'} · {item.createdAt}
            </p>
          </div>
          <div className="ml-4 flex gap-2">
            <button
              onClick={() => handleAction(item.id, 'approve')}
              className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(item.id, 'remove')}
              className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
function ModStatsTab({ forumId }: { forumId: string }) {
  const [stats, setStats] = useState<{ pending_count: number; resolved_count: number } | null>(
    null
  );
  const fetchForumModStats = useForumModerationStore().fetchForumModStats;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchForumModStats(forumId);
        if (!cancelled) {
          setStats({
            pending_count: typeof data.pending_count === 'number' ? data.pending_count : 0,
            resolved_count: typeof data.resolved_count === 'number' ? data.resolved_count : 0,
          });
        }
      } catch (error) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'loadStats');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forumId, fetchForumModStats]);

  if (!stats) {
    return <div className="p-4 text-sm text-gray-500">Loading stats…</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Pending Items" value={stats.pending_count} color="amber" />
      <StatCard label="Resolved Items" value={stats.resolved_count} color="green" />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'amber' | 'green' | 'red' | 'blue';
}) {
  const colorClasses = {
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm">{label}</p>
    </div>
  );
}
