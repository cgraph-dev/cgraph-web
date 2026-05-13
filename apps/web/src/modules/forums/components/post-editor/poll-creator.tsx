import type { ReactNode } from 'react';

interface PollOptionInput {
  readonly id: string;
  readonly text: string;
}

interface PollCreatorProps {
  readonly pollQuestion: string;
  readonly setPollQuestion: (q: string) => void;
  readonly pollOptions: readonly PollOptionInput[];
  readonly addPollOption: () => void;
  readonly removePollOption: (id: string) => void;
  readonly updatePollOption: (id: string, text: string) => void;
  readonly pollAllowMultiple: boolean;
  readonly setPollAllowMultiple: (v: boolean) => void;
  readonly pollDuration: number | undefined;
  readonly setPollDuration: (v: number) => void;
  readonly onClose: () => void;
  readonly primaryColor: string;
}

/** Poll Creator. */
export function PollCreator({ onClose }: PollCreatorProps): ReactNode {
  return (
    <div className="border-border/50 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Poll Creator — coming soon</span>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground text-xs hover:text-foreground"
        >
          Close
        </button>
      </div>
    </div>
  );
}
