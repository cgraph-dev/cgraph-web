import type { ReactNode } from 'react';

interface ShoutboxProps {
  readonly forumId: string;
  readonly className?: string;
}

/** Shoutbox. */
export function Shoutbox({ className }: ShoutboxProps): ReactNode {
  return (
    <div className={className}>
      <div className="border-border/50 text-muted-foreground rounded-lg border p-4 text-sm">
        Shoutbox — coming soon
      </div>
    </div>
  );
}
