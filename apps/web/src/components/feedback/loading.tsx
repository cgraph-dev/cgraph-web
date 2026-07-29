import type { ReactElement } from 'react';
import Card from '@/components/ui/card';
import Skeleton from '@/components/ui/skeleton';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps): ReactElement {
  const label = message ?? 'Loading';

  return (
    <div
      className="cgraph-workspace absolute inset-0 z-20 flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label={label}
      aria-busy="true"
    >
      <Card className="w-full max-w-sm space-y-3" padding="md">
        {message ? <p className="text-sm">{message}</p> : null}
        <Skeleton shape="card" count={3} />
      </Card>
    </div>
  );
}

export default LoadingOverlay;
