import type { ReactNode } from 'react';

interface WhosOnlineProps {
  readonly forumId: string;
}

/** Whos Online. */
export function WhosOnline(_props: WhosOnlineProps): ReactNode {
  return (
    <div className="border-border/50 text-muted-foreground rounded-lg border p-4 text-sm">
      Who&apos;s Online — coming soon
    </div>
  );
}
