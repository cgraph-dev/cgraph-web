/**
 * Create Commission Modal — Form for posting a new commission with bounty.
 *
 */

import { useState } from 'react';
import { FocusTrap } from '@/shared/components/accessibility';
import { useCommissionStore } from '@/modules/forums/store/commissionStore';
interface CreateCommissionModalProps {
  readonly forumId: string;
  readonly boardId: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}
/** Create Commission Modal. */
export default function CreateCommissionModal({
  forumId,
  boardId,
  isOpen,
  onClose,
}: CreateCommissionModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bountyNodes, setBountyNodes] = useState(10);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { createCommission, isActing, error } = useCommissionStore();

  if (!isOpen) return null;

  function validate(): boolean {
    if (title.trim().length < 3) {
      setValidationError('Title must be at least 3 characters');
      return false;
    }
    if (title.trim().length > 200) {
      setValidationError('Title must be under 200 characters');
      return false;
    }
    if (bountyNodes < 10) {
      setValidationError('Minimum bounty is 10 Nodes');
      return false;
    }
    setValidationError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const result = await createCommission(forumId, boardId, {
      title: title.trim(),
      description: description.trim() || undefined,
      bounty_nodes: bountyNodes,
    });

    if (result) {
      setTitle('');
      setDescription('');
      setBountyNodes(10);
      onClose();
    }
  }

  const displayError = validationError ?? error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="New Commission"
    >
      <FocusTrap>
        <div className="w-full max-w-md rounded-xl border border-zinc-700/50 bg-zinc-900 p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-zinc-100">New Commission</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Post a bounty for work you need done. Nodes will be held in escrow.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="commission-title" className="block text-sm font-medium text-zinc-300">
                Title
              </label>
              <input
                id="commission-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="What do you need done?"
              />
            </div>

            <div>
              <label htmlFor="commission-desc" className="block text-sm font-medium text-zinc-300">
                Description
              </label>
              <textarea
                id="commission-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                rows={4}
                className="mt-1 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Describe the work in detail..."
              />
            </div>

            <div>
              <label
                htmlFor="commission-bounty"
                className="block text-sm font-medium text-zinc-300"
              >
                Bounty (Nodes)
              </label>
              <input
                id="commission-bounty"
                type="number"
                min={10}
                step={1}
                value={bountyNodes}
                onChange={(e) => setBountyNodes(Math.max(10, Number(e.target.value)))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Minimum 10 Nodes. This amount will be held in escrow until the commission is
                completed or cancelled.
              </p>
            </div>

            {displayError ? <p className="text-sm text-red-400">{displayError}</p> : null}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                data-close
                aria-label="Close"
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                disabled={isActing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isActing}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
              >
                {isActing ? 'Creating...' : `Post Commission (${bountyNodes} Nodes)`}
              </button>
            </div>
          </form>
        </div>
      </FocusTrap>
    </div>
  );
}
