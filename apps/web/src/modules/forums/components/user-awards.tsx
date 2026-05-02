import type { ReactNode } from 'react';

interface UserAwardsProps {
  readonly userId: string;
  readonly forumId?: string;
  readonly className?: string;
}

/** Renders user forum awards/badges. Stub — full implementation with gamification plan. */
export function UserAwards({ className }: UserAwardsProps): ReactNode {
  return <div className={className}>{/* Awards will be rendered here */}</div>;
}
