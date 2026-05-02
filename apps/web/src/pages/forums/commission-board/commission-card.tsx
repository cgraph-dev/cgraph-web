/**
 * Commission Card — Displays a single commission in the board listing.
 *
 * Shows title, bounty amount, status badge, requester info, and claimer.
 *
 */

import type { Commission, CommissionStatus } from '@/modules/forums/services/commission-service';
interface StatusConfig {
  readonly label: string;
  readonly color: string;
  readonly bg: string;
}

const STATUS_MAP: Record<CommissionStatus, StatusConfig> = {
  open: { label: 'Open', color: 'text-green-400', bg: 'bg-green-400/10' },
  claimed: { label: 'Claimed', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  in_progress: { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  delivered: { label: 'Delivered', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  accepted: { label: 'Accepted', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  disputed: { label: 'Disputed', color: 'text-red-400', bg: 'bg-red-400/10' },
  cancelled: { label: 'Cancelled', color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
};
interface CommissionCardProps {
  readonly commission: Commission;
  readonly onClick: (id: string) => void;
}
/** Commission Card. */
export default function CommissionCard({ commission, onClick }: CommissionCardProps) {
  const status = STATUS_MAP[commission.status] ?? STATUS_MAP.open;
  const requesterName =
    commission.requester?.display_name ?? commission.requester?.username ?? 'Unknown';

  return (
    <button
      type="button"
      className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-4 text-left transition-colors hover:border-zinc-600/50 hover:bg-zinc-800"
      onClick={() => onClick(commission.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-zinc-100">{commission.title}</h3>
          {commission.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{commission.description}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.color} ${status.bg}`}
          >
            {status.label}
          </span>
          <span className="text-sm font-semibold text-amber-400">
            {commission.bounty_nodes} Nodes
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
        <span>by {requesterName}</span>
        {commission.claimer ? (
          <span>
            claimed by{' '}
            <span className="text-zinc-400">
              {commission.claimer.display_name ?? commission.claimer.username}
            </span>
          </span>
        ) : null}
        <span className="ml-auto">{new Date(commission.inserted_at).toLocaleDateString()}</span>
      </div>
    </button>
  );
}
