import type { ReactNode } from 'react';

interface PopularTagsProps {
  readonly forumId: string;
}

/** Popular Tags. */
export function PopularTags(_props: PopularTagsProps): ReactNode {
  return (
    <div className="border-border/50 text-muted-foreground rounded-lg border p-4 text-sm">
      Popular Tags — coming soon
    </div>
  );
}
