import type { ReactNode } from 'react';

interface PopularContributorsProps {
  readonly forumId: string;
}

/** Popular Contributors. */
export function PopularContributors(_props: PopularContributorsProps): ReactNode {
  return (
    <div className="border-border/50 text-muted-foreground rounded-lg border p-4 text-sm">
      Popular Contributors — coming soon
    </div>
  );
}
