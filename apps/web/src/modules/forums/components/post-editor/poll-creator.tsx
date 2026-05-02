import type { CSSProperties, ReactNode } from 'react';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

import type { PollCreatorProps } from './types';

type CSSPropertiesWithVars = CSSProperties & Record<`--${string}`, string>;

function ringColorStyle(color: string): CSSPropertiesWithVars {
  return { '--tw-ring-color': color };
}

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
}: PollCreatorProps): ReactNode {
  return (
    <div className="border-border/50 space-y-4 border-t p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">Poll</span>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground rounded-lg p-1 hover:text-foreground"
          aria-label="Remove poll"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">
          Question
        </span>
        <input
          type="text"
          value={pollQuestion}
          onChange={(event) => setPollQuestion(event.target.value)}
          placeholder="Ask a question"
          className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-2"
          style={ringColorStyle(primaryColor)}
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Options</span>
          <button
            type="button"
            onClick={addPollOption}
            disabled={pollOptions.length >= 10}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
            style={{ backgroundColor: primaryColor }}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        {pollOptions.map((option, index) => (
          <div key={option.id} className="flex items-center gap-2">
            <input
              type="text"
              value={option.text}
              onChange={(event) => updatePollOption(option.id, event.target.value)}
              placeholder={`Option ${index + 1}`}
              className="min-w-0 flex-1 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-2"
              style={ringColorStyle(primaryColor)}
            />
            <button
              type="button"
              onClick={() => removePollOption(option.id)}
              disabled={pollOptions.length <= 2}
              className="rounded-lg p-2 text-gray-400 hover:text-white disabled:opacity-30"
              aria-label={`Remove option ${index + 1}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={pollAllowMultiple}
            onChange={(event) => setPollAllowMultiple(event.target.checked)}
            className="rounded"
          />
          Allow multiple choices
        </label>

        <label className="block">
          <span className="sr-only">Poll duration</span>
          <select
            value={pollDuration ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setPollDuration(value ? Number(value) : undefined);
            }}
            className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">No expiration</option>
            <option value="24">24 hours</option>
            <option value="72">3 days</option>
            <option value="168">7 days</option>
            <option value="720">30 days</option>
          </select>
        </label>
      </div>
    </div>
  );
}
