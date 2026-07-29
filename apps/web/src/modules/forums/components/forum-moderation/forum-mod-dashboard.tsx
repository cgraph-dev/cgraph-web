import { useEffect, useState, type ReactNode } from 'react';
import {
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  Inbox,
  ListChecks,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { createLogger } from '@/lib/logger';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  EmptyState,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@/shared/components/ui';
import { useForumModerationStore } from '../../store/use-forum-moderation-store';
import type { ModerationQueueItem } from '../../store/forumStore.types';
import ForumAutomodSettings from './forum-automod-settings';
import WarningPanel from './warning-panel';

const logger = createLogger('ForumModDashboard');

interface ForumModDashboardProps {
  forumId: string;
}

type TabId = 'queue' | 'warnings' | 'automod' | 'stats';
type ForumModAction = 'approve' | 'remove' | 'hide';
type PendingModerationAction = {
  itemId: string;
  action: ForumModAction;
};

const TABS: ReadonlyArray<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: 'queue', label: 'Queue', icon: <ListChecks aria-hidden="true" /> },
  { id: 'warnings', label: 'Warnings', icon: <TriangleAlert aria-hidden="true" /> },
  { id: 'automod', label: 'Automod', icon: <ShieldCheck aria-hidden="true" /> },
  { id: 'stats', label: 'Stats', icon: <BarChart3 aria-hidden="true" /> },
];

function isTabId(value: string): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

export default function ForumModDashboard({ forumId }: ForumModDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('queue');

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (isTabId(value)) setActiveTab(value);
      }}
      className="space-y-4"
    >
      <TabsList className="w-full justify-start overflow-x-auto">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="inline-flex items-center gap-2">
            <span className="[&_svg]:h-4 [&_svg]:w-4">{tab.icon}</span>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="min-h-[400px]">
        <TabsContent value="queue">
          <ModQueueTab forumId={forumId} />
        </TabsContent>
        <TabsContent value="warnings">
          <WarningPanel forumId={forumId} />
        </TabsContent>
        <TabsContent value="automod">
          <ForumAutomodSettings forumId={forumId} />
        </TabsContent>
        <TabsContent value="stats">
          <ModStatsTab forumId={forumId} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function ModQueueTab({ forumId }: { forumId: string }) {
  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingModerationAction | null>(null);
  const fetchForumModQueue = useForumModerationStore().fetchForumModQueue;
  const takeForumModAction = useForumModerationStore().takeForumModAction;

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setLoadFailed(false);
    void fetchForumModQueue(forumId)
      .then((data) => {
        if (!cancelled) setItems([...data]);
      })
      .catch((error: unknown) => {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'loadQueue');
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [forumId, fetchForumModQueue, reloadKey]);

  const handleAction = async (postId: string, action: ForumModAction) => {
    if (pendingAction) return;

    setPendingAction({ itemId: postId, action });
    try {
      await takeForumModAction(forumId, postId, action);
      setItems((current) => current.filter((item) => item.id !== postId));
      toast.success(action === 'approve' ? 'Post approved' : 'Post removed');
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'handleAction');
      toast.error('Moderation action failed');
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading moderation queue">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} shape="card" />
        ))}
      </div>
    );
  }

  if (loadFailed) {
    return (
      <Alert variant="error">
        <AlertTitle>Moderation queue unavailable</AlertTitle>
        <AlertDescription>
          <p>Check the connection and load the queue again.</p>
          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Moderation queue is clear"
        message="There are no pending items to review."
        icon={<Inbox className="h-7 w-7" />}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isApprovePending =
          pendingAction?.itemId === item.id && pendingAction.action === 'approve';
        const isRemovePending =
          pendingAction?.itemId === item.id && pendingAction.action === 'remove';
        return (
          <Card key={item.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm text-[var(--token-text-primary)]">
                  {item.content}
                </p>
                <p className="mt-2 text-xs text-[var(--token-text-muted)]">
                  Reason: {item.reason || 'Not provided'} · {item.createdAt}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="success"
                  leftIcon={<Check aria-hidden="true" />}
                  disabled={pendingAction !== null}
                  isLoading={isApprovePending}
                  onClick={() => void handleAction(item.id, 'approve')}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  leftIcon={<Trash2 aria-hidden="true" />}
                  disabled={pendingAction !== null}
                  isLoading={isRemovePending}
                  onClick={() => void handleAction(item.id, 'remove')}
                >
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

interface ModerationStats {
  pending_count: number;
  resolved_count: number;
}

function ModStatsTab({ forumId }: { forumId: string }) {
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const fetchForumModStats = useForumModerationStore().fetchForumModStats;

  useEffect(() => {
    let cancelled = false;

    setStats(null);
    setLoadFailed(false);
    void fetchForumModStats(forumId)
      .then((data) => {
        if (cancelled) return;
        setStats({
          pending_count: typeof data.pending_count === 'number' ? data.pending_count : 0,
          resolved_count: typeof data.resolved_count === 'number' ? data.resolved_count : 0,
        });
      })
      .catch((error: unknown) => {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'loadStats');
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [forumId, fetchForumModStats, reloadKey]);

  if (loadFailed) {
    return (
      <Alert variant="error">
        <AlertTitle>Moderation statistics unavailable</AlertTitle>
        <AlertDescription>
          <p>Check the connection and load the statistics again.</p>
          <Button
            className="mt-3"
            variant="secondary"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2"
        role="status"
        aria-label="Loading moderation statistics"
      >
        <Skeleton shape="card" />
        <Skeleton shape="card" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard
        label="Pending items"
        value={stats.pending_count}
        icon={<Clock3 aria-hidden="true" />}
      />
      <StatCard
        label="Resolved items"
        value={stats.resolved_count}
        icon={<CheckCircle2 aria-hidden="true" />}
      />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className="cgraph-card flex h-10 w-10 items-center justify-center text-[var(--token-interactive-primary)]"
          data-cgraph-material="recessed"
          aria-hidden="true"
        >
          <span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums text-[var(--token-text-primary)]">
            {value}
          </p>
          <p className="text-sm text-[var(--token-text-muted)]">{label}</p>
        </div>
      </div>
    </Card>
  );
}
