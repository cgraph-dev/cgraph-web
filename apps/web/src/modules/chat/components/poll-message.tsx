/**
 * Poll message component for rendering in-chat polls.
 *
 * Displays poll question and options as either vote buttons
 * (when user has not voted) or animated result bars (after voting).
 * Mirrors Telegram's poll rendering with quiz mode support.
 */
import { useState, type ReactNode } from 'react';
import type { ChatPoll, VotePollParams } from '@cgraph/shared-types';
import { PollResultsBar } from './poll-results-bar';
import { cn } from '@/lib/utils';

interface PollMessageProps {
  readonly poll: ChatPoll;
  readonly onVote: (params: VotePollParams) => void;
  readonly onRetract: () => void;
  readonly className?: string;
}

/** Renders an in-chat poll as vote buttons or animated result bars. */
function PollMessage(props: PollMessageProps): ReactNode {
  const { poll, onVote, onRetract } = props;
  const hasVoted = poll.myVote !== undefined && poll.myVote !== null;
  const showResults = hasVoted || poll.isClosed;
  const [selectedIds, setSelectedIds] = useState<ReadonlyArray<number>>([]);

  function handleOptionClick(optionId: number): void {
    if (showResults) return;

    if (poll.isMultipleChoice) {
      setSelectedIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      onVote({ optionIds: [optionId] });
    }
  }

  function handleSubmitMultiple(): void {
    if (selectedIds.length === 0) return;
    onVote({ optionIds: [...selectedIds] });
  }

  return (
    <div className={cn('bg-surface-secondary max-w-sm rounded-xl p-4', props.className)}>
      <p className="mb-1 font-semibold">{poll.question}</p>
      <p className="text-text-secondary mb-3 text-xs">
        {poll.isAnonymous ? 'Anonymous Poll' : 'Public Poll'}
        {poll.isQuiz && ' \u00b7 Quiz'}
        {poll.isMultipleChoice && ' \u00b7 Multiple Choice'}
      </p>

      {showResults ? (
        <div>
          {poll.options.map((opt) => {
            const optCount = poll.optionCounts?.find((c) => c.optionId === opt.id);
            return (
              <PollResultsBar
                key={opt.id}
                text={opt.text}
                count={optCount?.count ?? 0}
                totalVoters={poll.totalVoterCount}
                isSelected={poll.myVote?.includes(opt.id) ?? false}
                isCorrect={poll.isQuiz ? poll.correctOptionId === opt.id : undefined}
                isQuiz={poll.isQuiz}
              />
            );
          })}
          {poll.isQuiz && poll.explanation && hasVoted && (
            <p className="text-text-secondary mt-2 text-xs italic">{poll.explanation}</p>
          )}
          {hasVoted && !poll.isClosed && !poll.isQuiz && (
            <button type="button" onClick={onRetract} className="mt-2 text-xs text-primary">
              Retract Vote
            </button>
          )}
        </div>
      ) : (
        <div>
          {poll.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleOptionClick(opt.id)}
              className={cn(
                'mb-1.5 w-full rounded-lg border p-2.5 text-left text-sm transition-colors',
                selectedIds.includes(opt.id)
                  ? 'bg-primary/10 border-primary'
                  : 'border-surface-tertiary hover:bg-surface-tertiary/50'
              )}
            >
              {opt.text}
            </button>
          ))}
          {poll.isMultipleChoice && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleSubmitMultiple}
              className="mt-2 w-full rounded-lg bg-primary p-2.5 text-sm font-medium text-white"
            >
              Vote
            </button>
          )}
        </div>
      )}

      <p className="text-text-secondary mt-3 text-xs">
        {poll.totalVoterCount} {poll.totalVoterCount === 1 ? 'vote' : 'votes'}
        {poll.isClosed && ' \u00b7 Closed'}
      </p>
    </div>
  );
}

export { PollMessage };
