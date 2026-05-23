import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { PollCreatorProps } from './types';

/** Poll Creator. */
export function PollCreator({
  pollQuestion,
  setPollQuestion,
  pollOptions,
  addPollOption,
  removePollOption,
  updatePollOption,
  pollAllowMultiple,
  setPollAllowMultiple,
  pollDuration,
  setPollDuration,
  onClose,
  primaryColor,
}: PollCreatorProps) {
  return (
    <section
      className="border-border/60 m-4 rounded-xl border bg-[var(--token-bg-secondary)]/70 p-4"
      aria-label="Poll creator"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Poll</h3>
          <p className="mt-0.5 text-xs text-white/50">Attach a question and options to this post.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Close poll creator"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-white/60">Question</span>
        <input
          value={pollQuestion}
          onChange={(event) => setPollQuestion(event.target.value)}
          maxLength={180}
          placeholder="Ask a clear question"
          className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary-400"
        />
      </label>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/60">Options</span>
          <button
            type="button"
            onClick={addPollOption}
            disabled={pollOptions.length >= 10}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        {pollOptions.map((option, index) => (
          <div key={option.id} className="flex items-center gap-2">
            <input
              value={option.text}
              onChange={(event) => updatePollOption(option.id, event.target.value)}
              maxLength={120}
              placeholder={`Option ${index + 1}`}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary-400"
            />
            <button
              type="button"
              onClick={() => removePollOption(option.id)}
              disabled={pollOptions.length <= 2}
              className="rounded-lg p-2 text-white/45 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={`Remove option ${index + 1}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={pollAllowMultiple}
            onChange={(event) => setPollAllowMultiple(event.target.checked)}
            className="rounded"
            style={{ accentColor: primaryColor }}
          />
          Allow multiple choices
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-white/60">Duration</span>
          <select
            value={pollDuration ?? ''}
            onChange={(event) =>
              setPollDuration(event.target.value ? Number(event.target.value) : undefined)
            }
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-primary-400"
          >
            <option value="">No end date</option>
            <option value="24">24 hours</option>
            <option value="72">3 days</option>
            <option value="168">7 days</option>
            <option value="720">30 days</option>
          </select>
        </label>
      </div>
    </section>
  );
}
