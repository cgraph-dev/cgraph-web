import type { LucideIcon } from 'lucide-react';
import { Compass, Rss, Users, UsersRound } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { DiscoverTab } from './tabs/discover-tab';
import { FeedTab } from './tabs/feed-tab';
import { PeopleTab } from './tabs/people-tab';
import { GroupsTab } from './tabs/groups-tab';

type ExploreTab = 'discover' | 'feed' | 'people' | 'groups';

const VALID_TABS = new Set<string>(['discover', 'feed', 'people', 'groups']);

function isExploreTab(value: string): value is ExploreTab {
  return VALID_TABS.has(value);
}

const TABS: ReadonlyArray<{
  readonly id: ExploreTab;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly to: string;
}> = [
  { id: 'discover', label: 'Discover', icon: Compass, to: '/explore' },
  { id: 'feed', label: 'Feed', icon: Rss, to: '/explore/feed' },
  { id: 'people', label: 'People', icon: Users, to: '/explore/people' },
  { id: 'groups', label: 'Groups', icon: UsersRound, to: '/explore/groups' },
];

export default function ExplorePage() {
  const { tab: rawTab } = useParams<{ tab?: string }>();

  if (rawTab && !isExploreTab(rawTab)) return <Navigate to="/explore" replace />;

  const activeTab: ExploreTab = rawTab && isExploreTab(rawTab) ? rawTab : 'discover';
  return (
    <div className="cgraph-workspace flex flex-1 flex-col overflow-hidden">
      <header className="cgraph-pane-header flex shrink-0 items-center gap-5 px-4 sm:px-6">
        <div className="hidden min-w-0 sm:block">
          <h1 className="text-lg font-semibold text-[var(--token-text-primary)]">Explore</h1>
          <p className="text-xs text-[var(--token-text-muted)]">People and communities</p>
        </div>
        <nav
          className="cgraph-segmented scrollbar-hide min-w-0 overflow-x-auto"
          aria-label="Explore"
        >
          {TABS.map(({ id, label, icon: Icon, to }) => {
            const isActive = activeTab === id;
            return (
              <Link
                key={id}
                to={to}
                className="cgraph-segmented-item flex shrink-0 items-center gap-2 px-3 text-sm font-medium"
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'people' && <PeopleTab />}
        {activeTab === 'groups' && <GroupsTab />}
      </div>
    </div>
  );
}
