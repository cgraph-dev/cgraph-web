import { Link } from 'react-router-dom';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useForumStore } from '@/modules/forums/store';

interface ShoutboxProps {
  readonly forumId: string;
  readonly className?: string;
}

/** Recent forum activity summary for the directory route. */
export function Shoutbox({ className }: ShoutboxProps) {
  const forums = useForumStore((state) => state.forums);
  const recentForums = [...forums]
    .sort((a, b) => {
      const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return right - left;
    })
    .slice(0, 3);

  return (
    <section
      className={`rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-4 ${
        className ?? ''
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="h-4 w-4 text-primary-300" />
        <h2 className="text-sm font-semibold text-white">Recent Forum Activity</h2>
      </div>
      {recentForums.length === 0 ? (
        <p className="text-sm text-white/45">Activity appears here after forums are created.</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-3">
          {recentForums.map((forum) => (
            <Link
              key={forum.id}
              to={`/forums/${forum.slug}`}
              className="rounded-md border border-white/10 bg-white/[0.03] p-3 transition hover:border-primary-400/40 hover:bg-primary-500/10"
            >
              <p className="truncate text-sm font-semibold text-white">{forum.name}</p>
              <p className="mt-1 text-xs text-white/45">
                {(forum.threadCount ?? 0).toLocaleString()} threads ·{' '}
                {(forum.postCount ?? 0).toLocaleString()} posts
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
