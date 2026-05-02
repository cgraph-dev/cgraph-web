import React, { useEffect, useState } from 'react';
import { useCreatorDashboard } from '@/modules/creator/hooks/useCreatorDashboard';
import { creatorService } from '@/modules/creator/services/creatorService';

/**
 * AnalyticsPage — creator analytics dashboard.
 *
 * Shows quick stats, revenue by type, subscriber growth, top content,
 * earnings over time, and top forums. Supports CSV export.
 * Route: /creator/analytics
 */

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatNodes(amount: number): string {
  return amount.toLocaleString();
}

function formatMonth(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

type Period = '7d' | '30d' | '90d';

const REVENUE_TYPE_LABELS: Record<string, string> = {
  tip_received: 'Tips',
  subscription_received: 'Subscriptions',
  content_unlock: 'Premium Content',
  paid_dm_earning: 'Paid DMs',
};

const REVENUE_TYPE_COLORS: Record<string, string> = {
  tip_received: 'bg-emerald-500',
  subscription_received: 'bg-blue-500',
  content_unlock: 'bg-purple-500',
  paid_dm_earning: 'bg-amber-500',
};

/** Analytics Page component. */
export function AnalyticsPage(): React.ReactElement {
  const {
    analyticsOverview: overview,
    earningsData,
    revenueBreakdown,
    subscriberGrowth,
    contentAnalyticsEnhanced,
    isLoadingAnalytics,
    fetchAllAnalytics,
  } = useCreatorDashboard();
  const [period, setPeriod] = useState<Period>('30d');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchAllAnalytics({ period });
  }, [period, fetchAllAnalytics]);

  const loading = isLoadingAnalytics;

  if (loading && !overview) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <div className="flex items-center gap-3">
          <ExportButton period={period} isExporting={isExporting} setIsExporting={setIsExporting} />
          {/* Period selector */}
          <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-[var(--token-card-border)]">
            {(['7d', '30d', '90d'] satisfies Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[var(--token-bg-secondary)]'
                }`}
              >
                {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Revenue (30d)"
          value={formatCents(overview?.revenue30dCents ?? 0)}
          description="Total revenue in last 30 days"
        />
        <MetricCard
          label="Subscribers"
          value={(overview?.totalSubscribers ?? overview?.subscriberCount ?? 0).toString()}
          description="Active paid subscribers"
        />
        <MetricCard
          label="Avg Rev / Sub"
          value={formatCents(overview?.avgRevenuePerSubscriberCents ?? 0)}
          description="Average revenue per subscriber"
        />
        <MetricCard
          label="Pending Balance"
          value={formatCents(overview?.pendingBalanceCents ?? 0)}
          description="Funds in hold period"
        />
      </div>

      {/* Secondary stats row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="MRR"
          value={formatCents(overview?.mrrCents ?? 0)}
          description="Monthly recurring revenue"
        />
        <MetricCard
          label="Churn Rate"
          value={`${overview?.churnRate?.toFixed(1) ?? '0.0'}%`}
          description="Cancellations in period"
        />
        <MetricCard
          label="Your Share"
          value={`${100 - (overview?.platformFeePercent ?? 15)}%`}
          description={`CGraph takes ${overview?.platformFeePercent ?? 15}% platform fee`}
        />
      </div>

      {/* Revenue breakdown by type */}
      <RevenueBreakdownChart
        breakdown={(revenueBreakdown?.breakdown ?? []).map((b) => ({
          type: b.type,
          periodLabel: b.periodLabel ?? b.period_label ?? '',
          totalAmount: b.totalAmount ?? b.total_amount ?? 0,
          count: b.count,
        }))}
      />

      {/* Subscriber growth chart */}
      <SubscriberGrowthChart growth={subscriberGrowth?.growth ?? []} />

      {/* Earnings over time */}
      {earningsData?.earningsOverTime && earningsData.earningsOverTime.length > 0 && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Earnings Over Time
          </h2>
          <div className="flex h-[200px] items-end gap-2">
            {earningsData.earningsOverTime!.map((m) => {
              const maxVal = Math.max(...earningsData.earningsOverTime!.map((e) => e.netCents), 1);
              const height = Math.max((m.netCents / maxVal) * 100, 4);
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{formatCents(m.netCents)}</span>
                  <div
                    className="w-full rounded-t bg-blue-500 transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-400">{formatMonth(m.month)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top content table */}
      <TopContentTable
        content={(contentAnalyticsEnhanced?.topContent ?? []).map((entry) => {
          const e: Record<string, unknown> =
            typeof entry === 'object' && entry !== null ? { ...entry } : {};
          return {
            threadId: String(e.threadId ?? e.thread_id ?? ''),
            title: String(e.title ?? ''),
            revenue: Number(e.revenue ?? 0),
            unlockCount: Number(e.unlockCount ?? e.unlock_count ?? 0),
            priceNodes: Number(e.priceNodes ?? e.price_nodes ?? 0),
          };
        })}
      />

      {/* Top performing forums */}
      {earningsData?.topForums && earningsData.topForums.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-[var(--token-card-border)]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Performing Forums
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[var(--token-bg-secondary)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Forum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Subscribers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    MRR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {earningsData.topForums.map((f) => (
                  <tr key={f.forumId}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {f.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {f.subscribers}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {formatCents(f.mrrCents ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fee transparency */}
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        CGraph takes {overview?.platformFeePercent ?? 15}% platform fee. You keep{' '}
        {100 - (overview?.platformFeePercent ?? 15)}%.
      </p>
    </div>
  );
}
interface MetricCardProps {
  readonly label: string;
  readonly value: string;
  readonly description: string;
}

function MetricCard({ label, value, description }: MetricCardProps): React.ReactElement {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{description}</p>
    </div>
  );
}

interface ExportButtonProps {
  readonly period: Period;
  readonly isExporting: boolean;
  readonly setIsExporting: (v: boolean) => void;
}

function ExportButton({
  period,
  isExporting,
  setIsExporting,
}: ExportButtonProps): React.ReactElement {
  function handleExport(): void {
    setIsExporting(true);
    creatorService
      .exportAnalyticsCsv({ period })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `creator-analytics-${period}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        // Export failed silently — user can retry
      })
      .finally(() => setIsExporting(false));
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:border-[var(--token-card-border)] dark:text-gray-400 dark:hover:bg-[var(--token-bg-secondary)]"
    >
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}

interface RevenueBreakdownChartProps {
  readonly breakdown: ReadonlyArray<{
    readonly type: string;
    readonly periodLabel: string;
    readonly totalAmount: number;
    readonly count: number;
  }>;
}

function RevenueBreakdownChart({
  breakdown,
}: RevenueBreakdownChartProps): React.ReactElement | null {
  if (breakdown.length === 0) {
    return null;
  }

  // Aggregate by type for a summary view
  const byType = new Map<string, number>();
  for (const entry of breakdown) {
    byType.set(entry.type, (byType.get(entry.type) ?? 0) + entry.totalAmount);
  }

  const totalAll = Array.from(byType.values()).reduce((sum, v) => sum + v, 0);

  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Revenue by Type</h2>
      <div className="space-y-3">
        {Array.from(byType.entries()).map(([type, amount]) => {
          const pct = totalAll > 0 ? (amount / totalAll) * 100 : 0;
          return (
            <div key={type}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {REVENUE_TYPE_LABELS[type] ?? type}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatNodes(amount)} nodes
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all ${REVENUE_TYPE_COLORS[type] ?? 'bg-gray-400'}`}
                  style={{ width: `${Math.max(pct, 1)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SubscriberGrowthChartProps {
  readonly growth: ReadonlyArray<{
    readonly date: string;
    readonly new: number;
    readonly churned: number;
    readonly net: number;
  }>;
}

function SubscriberGrowthChart({ growth }: SubscriberGrowthChartProps): React.ReactElement | null {
  if (growth.length === 0) {
    return null;
  }

  const maxVal = Math.max(...growth.map((g) => Math.max(g.new, g.churned, Math.abs(g.net))), 1);

  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Subscriber Growth
      </h2>
      <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> New
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400" /> Churned
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Net
        </span>
      </div>
      <div className="flex h-[160px] items-end gap-1">
        {growth.map((g) => {
          const newH = Math.max((g.new / maxVal) * 100, 2);
          const churnH = Math.max((g.churned / maxVal) * 100, 2);
          return (
            <div key={g.date} className="flex flex-1 flex-col items-center gap-0.5">
              <div className="flex w-full gap-0.5" style={{ height: `${Math.max(newH, churnH)}%` }}>
                <div className="flex-1 rounded-t bg-emerald-500" style={{ height: `${newH}%` }} />
                <div className="flex-1 rounded-t bg-red-400" style={{ height: `${churnH}%` }} />
              </div>
              <span className="w-full truncate text-center text-[10px] text-gray-400">
                {new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TopContentTableProps {
  readonly content: ReadonlyArray<{
    readonly threadId: string;
    readonly title: string;
    readonly revenue: number;
    readonly unlockCount: number;
    readonly priceNodes: number;
  }>;
}

function TopContentTable({ content }: TopContentTableProps): React.ReactElement | null {
  if (content.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)]">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-[var(--token-card-border)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Content</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[var(--token-bg-secondary)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Thread
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Revenue (Nodes)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Unlocks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Price
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {content.map((item) => (
              <tr key={item.threadId}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {item.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {formatNodes(item.revenue)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {item.unlockCount}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {formatNodes(item.priceNodes)} nodes
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default AnalyticsPage;
