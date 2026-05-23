import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useForumStore } from '@/modules/forums/store';

interface WhosOnlineProps {
  readonly forumId: string;
}

/** Lightweight live-directory summary using the loaded forum dataset. */
export function WhosOnline(_props: WhosOnlineProps) {
  const forums = useForumStore((state) => state.forums);
  const totalMembers = forums.reduce((sum, forum) => sum + forum.memberCount, 0);
  const totalThreads = forums.reduce((sum, forum) => sum + (forum.threadCount ?? 0), 0);
  const totalPosts = forums.reduce((sum, forum) => sum + (forum.postCount ?? 0), 0);

  return (
    <section className="rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserGroupIcon className="h-4 w-4 text-primary-300" />
        <h2 className="text-sm font-semibold text-white">Forum Network</h2>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-white/[0.04] px-2 py-3">
          <dt className="text-xs text-white/45">Forums</dt>
          <dd className="mt-1 text-sm font-semibold text-white">{forums.length}</dd>
        </div>
        <div className="rounded-md bg-white/[0.04] px-2 py-3">
          <dt className="text-xs text-white/45">Threads</dt>
          <dd className="mt-1 text-sm font-semibold text-white">{totalThreads}</dd>
        </div>
        <div className="rounded-md bg-white/[0.04] px-2 py-3">
          <dt className="text-xs text-white/45">Members</dt>
          <dd className="mt-1 text-sm font-semibold text-white">{totalMembers}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-white/40">{totalPosts.toLocaleString()} total posts</p>
    </section>
  );
}
