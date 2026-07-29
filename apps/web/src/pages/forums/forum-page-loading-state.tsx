import type { ReactElement } from 'react';
import { InlineLoadingSpinner } from '@/components/feedback/loading-spinner';

interface ForumPageLoadingStateProps {
  readonly label: string;
}

export function ForumPageLoadingState({
  label,
}: ForumPageLoadingStateProps): ReactElement {
  return (
    <div className="cgraph-workspace flex flex-1 items-center justify-center" aria-busy="true">
      <InlineLoadingSpinner label={label} size="lg" />
    </div>
  );
}
