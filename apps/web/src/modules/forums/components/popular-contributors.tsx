import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useForumStore } from '@/modules/forums/store';

interface PopularContributorsProps {
  readonly forumId: string;
}

/** Activity summary for the routed forum directory. */
export function PopularContributors(_props: PopularContributorsProps) {
  const forums = useForumStore((state) => state.forums);
  const activeForums = useMemo(
    () =>
      [...forums]
        .sort((a, b) => {
          const scoreA = (a.threadCount ?? 0) + (a.postCount ?? 0) + a.memberCount;
          const scoreB = (b.threadCount ?? 0) + (b.postCount ?? 0) + b.memberCount;
          return scoreB - scoreA;
        })
        .slice(0, 4),
    [forums]
  );

  return (
    <section className="rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <ChartBarIcon className="h-4 w-4 text-primary-300" />
        <h2 className="text-sm font-semibold text-white">Active Forums</h2>
      </div>
      {activeForums.length === 0 ? (
        <p className="text-sm text-white/45">Activity appears here after forums receive posts.</p>
      ) : (
        <div className="space-y-2">
          {activeForums.map((forum) => (
            <Link
              key={forum.id}
              to={`/forums/${forum.slug}`}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition hover:bg-white/5"
            >
              <span className="truncate font-medium text-white">{forum.name}</span>
              <span className="shrink-0 text-xs text-white/45">
                {((forum.threadCount ?? 0) + (forum.postCount ?? 0)).toLocaleString()} posts
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
