/**
 * Thread poll component — renders poll UI within forum thread posts.
 * Stub — full implementation arrives with forum polls plan.
 */
import type { ReactNode } from 'react';
import type { ThreadPoll as ThreadPollType } from '../../../types';

interface ThreadPollProps {
  readonly poll: ThreadPollType;
  readonly primaryColor: string;
  readonly canModerate: boolean;
}

/** Renders a poll embedded in a forum thread post. */
export function ThreadPoll({ poll }: ThreadPollProps): ReactNode {
  return (
    <div className="border-border/50 text-muted-foreground rounded-lg border p-4 text-sm">
      Poll #{poll.id.slice(0, 8)} — {poll.question} ({poll.totalVotes} votes)
    </div>
  );
}
