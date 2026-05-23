import { useMemo } from 'react';
import { TagIcon } from '@heroicons/react/24/outline';
import { useForumStore } from '@/modules/forums/store';

interface PopularTagsProps {
  readonly forumId: string;
}

/** Category-derived tag summary for the routed forum directory. */
export function PopularTags(_props: PopularTagsProps) {
  const forums = useForumStore((state) => state.forums);
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const forum of forums) {
      for (const category of forum.categories ?? []) {
        counts.set(category.name, (counts.get(category.name) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8);
  }, [forums]);

  return (
    <section className="rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-primary-300" />
        <h2 className="text-sm font-semibold text-white">Popular Categories</h2>
      </div>
      {tags.length === 0 ? (
        <p className="text-sm text-white/45">No categories have been created yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(([name, count]) => (
            <span
              key={name}
              className="rounded-full bg-primary-500/10 px-2.5 py-1 text-xs font-medium text-primary-100"
            >
              {name} · {count}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
