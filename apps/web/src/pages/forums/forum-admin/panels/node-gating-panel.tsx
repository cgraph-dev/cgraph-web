import type { ReactNode } from 'react';

interface NodeGatingPanelProps {
  readonly forumId: string;
}

/** Node Gating Panel. */
export function NodeGatingPanel(_props: NodeGatingPanelProps): ReactNode {
  return (
    <div className="border-border/50 text-muted-foreground rounded-lg border p-4 text-sm">
      Node Gating — coming soon
    </div>
  );
}
