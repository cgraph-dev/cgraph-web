/**
 * Commission Board View — List of commissions with status filter tabs.
 *
 * Displays all commissions for a commission-type board with cursor
 * pagination and status filtering.
 *
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommissionStore } from '@/modules/forums/store/commissionStore';
import type { CommissionStatus } from '@/modules/forums/services/commission-service';
import CommissionCard from './commission-card';
import CreateCommissionModal from './create-commission-modal';
interface FilterTab {
  readonly label: string;
  readonly value: CommissionStatus | null;
}

const FILTER_TABS: readonly FilterTab[] = [
  { label: 'All', value: null },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'accepted' },
  { label: 'Disputed', value: 'disputed' },
];
/** Commission Board View. */
export default function CommissionBoardView() {
  const { forumId, boardId } = useParams<{ forumId: string; boardId: string }>();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const { commissions, meta, statusFilter, isLoading, isLoadingMore, fetchCommissions, fetchMore } =
    useCommissionStore();

  useEffect(() => {
    if (forumId && boardId) {
      fetchCommissions(forumId, boardId, statusFilter);
    }
  }, [forumId, boardId, statusFilter, fetchCommissions]);

  function handleFilterChange(status: CommissionStatus | null) {
    if (!forumId || !boardId) return;
    fetchCommissions(forumId, boardId, status);
  }

  function handleCardClick(commissionId: string) {
    navigate(`/forums/${forumId}/boards/${boardId}/commissions/${commissionId}`);
  }

  function handleLoadMore() {
    if (!forumId || !boardId) return;
    fetchMore(forumId, boardId);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Commission Board</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
        >
          Post Commission
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mt-5 flex gap-1 overflow-x-auto rounded-lg bg-zinc-800/50 p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => handleFilterChange(tab.value)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Commission List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : commissions.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-zinc-500">No commissions found.</p>
          <p className="mt-1 text-xs text-zinc-600">
            Be the first to post a commission on this board.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {commissions.map((commission) => (
            <CommissionCard key={commission.id} commission={commission} onClick={handleCardClick} />
          ))}

          {meta.has_more ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50"
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Create Modal */}
      {forumId && boardId ? (
        <CreateCommissionModal
          forumId={forumId}
          boardId={boardId}
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
        />
      ) : null}
    </div>
  );
}
