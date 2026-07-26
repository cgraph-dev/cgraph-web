import { cn } from '@/lib/utils';

type SkeletonShape = 'text' | 'avatar' | 'card' | 'message' | 'thumbnail';

interface SkeletonProps {
  readonly className?: string;
  readonly variant?: 'text' | 'circular' | 'rectangular';
  readonly shape?: SkeletonShape;
  readonly width?: string | number;
  readonly height?: string | number;
  readonly lines?: number;
  readonly count?: number;
}

const shimmerClass = 'cgraph-skeleton relative overflow-hidden';

/** Skeleton. */
export default function Skeleton({
  className = '',
  variant,
  shape,
  width,
  height,
  lines = 1,
  count = 1,
}: SkeletonProps) {
  // --- Shape-based API ---
  if (shape) {
    const items = Array.from({ length: count });
    return (
      <div aria-hidden="true" data-cgraph-skeleton="true" className={cn('space-y-3', className)}>
        {items.map((_, i) => (
          <SkeletonShape key={i} shape={shape} />
        ))}
      </div>
    );
  }

  // --- Legacy variant API ---
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  const v = variant ?? 'rectangular';

  const style: React.CSSProperties = {
    width: width ?? (v === 'circular' ? height : '100%'),
    height: height ?? (v === 'text' ? '1rem' : v === 'circular' ? width : '100%'),
  };

  if (v === 'text' && lines > 1) {
    return (
      <div aria-hidden="true" data-cgraph-skeleton="true" className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(shimmerClass, variantStyles[v])}
            style={{ ...style, width: i === lines - 1 ? '75%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      data-cgraph-skeleton="true"
      className={cn(shimmerClass, variantStyles[v], className)}
      style={style}
    />
  );
}

function SkeletonShape({ shape }: { shape: SkeletonShape }) {
  switch (shape) {
    case 'text':
      return (
        <div aria-hidden="true" data-cgraph-skeleton="true" className="space-y-1.5">
          <div className={cn(shimmerClass, 'h-3.5 w-full rounded')} />
          <div className={cn(shimmerClass, 'h-3.5 w-4/5 rounded')} />
          <div className={cn(shimmerClass, 'h-3.5 w-3/5 rounded')} />
        </div>
      );
    case 'avatar':
      return <div className={cn(shimmerClass, 'h-10 w-10 rounded-full')} />;
    case 'card':
      return <div className={cn(shimmerClass, 'h-24 w-full rounded-lg')} />;
    case 'message':
      return (
        <div className="flex gap-3 py-2">
          <div className={cn(shimmerClass, 'h-10 w-10 shrink-0 rounded-full')} />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={cn(shimmerClass, 'h-3.5 w-24 rounded')} />
              <div className={cn(shimmerClass, 'h-3 w-14 rounded')} />
            </div>
            <div className={cn(shimmerClass, 'h-3.5 w-full max-w-xs rounded')} />
            <div className={cn(shimmerClass, 'h-3.5 w-3/4 max-w-[200px] rounded')} />
          </div>
        </div>
      );
    case 'thumbnail':
      return <div className={cn(shimmerClass, 'aspect-video w-full rounded-lg')} />;
  }
}

/** Post Card Skeleton. */
export function PostCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-cgraph-skeleton="true"
      className="rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-4"
    >
      <div className="flex gap-3">
        {/* Vote buttons skeleton */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 rounded bg-[var(--token-card-bg)]" />
          <div className="h-4 w-8 rounded bg-[var(--token-card-bg)]" />
          <div className="h-6 w-6 rounded bg-[var(--token-card-bg)]" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1">
          {/* Meta */}
          <div className="mb-2 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-[var(--token-card-bg)]" />
            <div className="h-4 w-24 rounded bg-[var(--token-card-bg)]" />
            <div className="h-4 w-32 rounded bg-[var(--token-card-bg)]" />
          </div>

          {/* Title */}
          <div className="mb-2 h-6 w-3/4 rounded bg-[var(--token-card-bg)]" />

          {/* Content preview */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-[var(--token-card-bg)]" />
            <div className="h-4 w-5/6 rounded bg-[var(--token-card-bg)]" />
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-4">
            <div className="h-6 w-24 rounded bg-[var(--token-card-bg)]" />
            <div className="h-6 w-16 rounded bg-[var(--token-card-bg)]" />
            <div className="h-6 w-16 rounded bg-[var(--token-card-bg)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Forum Card Skeleton. */
export function ForumCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-cgraph-skeleton="true"
      className="rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-[var(--token-card-bg)]" />
        <div className="flex-1">
          <div className="mb-1 h-5 w-32 rounded bg-[var(--token-card-bg)]" />
          <div className="h-4 w-48 rounded bg-[var(--token-card-bg)]" />
        </div>
        <div className="h-8 w-20 rounded-full bg-[var(--token-card-bg)]" />
      </div>
    </div>
  );
}

/** Comment Skeleton. */
export function CommentSkeleton({ depth = 0 }: { depth?: number }) {
  return (
    <div aria-hidden="true" data-cgraph-skeleton="true" style={{ marginLeft: depth * 24 }}>
      <div className="flex gap-3">
        <div className="h-8 w-8 rounded-full bg-[var(--token-card-bg)]" />
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-4 w-24 rounded bg-[var(--token-card-bg)]" />
            <div className="h-4 w-20 rounded bg-[var(--token-card-bg)]" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-[var(--token-card-bg)]" />
            <div className="h-4 w-2/3 rounded bg-[var(--token-card-bg)]" />
          </div>
          <div className="mt-2 flex gap-4">
            <div className="h-5 w-16 rounded bg-[var(--token-card-bg)]" />
            <div className="h-5 w-12 rounded bg-[var(--token-card-bg)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Message Skeleton. */
export function MessageSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-hidden="true" data-cgraph-skeleton="true" className="flex gap-3 px-4 py-2">
      {!compact && <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--token-card-bg)]" />}
      <div className="flex-1 space-y-1.5">
        {!compact && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 rounded bg-[var(--token-card-bg)]" />
            <div className="h-3 w-16 rounded bg-[var(--token-bg-secondary)]" />
          </div>
        )}
        <div className="space-y-1.5">
          <div className="h-4 w-full max-w-[320px] rounded bg-[var(--token-card-bg)]" />
          <div className="h-4 w-3/4 max-w-[240px] rounded bg-[var(--token-card-bg)]" />
        </div>
      </div>
    </div>
  );
}

/** Message List Skeleton. */
export function MessageListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden="true" data-cgraph-skeleton="true" className="flex flex-col gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton key={i} compact={i > 0 && i % 3 !== 0} />
      ))}
    </div>
  );
}
