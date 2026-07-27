/**
 * Explore Page
 *
 * Unified discovery destination with tab-based navigation.
 * Tabs: Discover (communities), Feed, People, Groups
 *
 * Routes:
 *   /explore           → Discover tab (default)
 *   /explore/feed      → Feed tab
 *   /explore/people    → People search tab
 *   /explore/groups    → Groups-only discovery tab
 */

import { useParams, useNavigate } from 'react-router-dom';
import { GlobeAltIcon, RssIcon, UsersIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { DiscoverTab } from './tabs/discover-tab';
import { FeedTab } from './tabs/feed-tab';
import { PeopleTab } from './tabs/people-tab';
import { GroupsTab } from './tabs/groups-tab';

type ExploreTab = 'discover' | 'feed' | 'people' | 'groups';

const VALID_TABS = new Set<string>(['discover', 'feed', 'people', 'groups']);

function isExploreTab(value: string): value is ExploreTab {
  return VALID_TABS.has(value);
}

const TABS: Array<{ id: ExploreTab; label: string; icon: typeof GlobeAltIcon }> = [
  { id: 'discover', label: 'Discover', icon: GlobeAltIcon },
  { id: 'feed', label: 'Feed', icon: RssIcon },
  { id: 'people', label: 'People', icon: UsersIcon },
  { id: 'groups', label: 'Groups', icon: UserGroupIcon },
];

/**
 * Explore page — single discovery destination with tabbed navigation.
 */
export default function ExplorePage() {
  const { tab: rawTab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const activeTab: ExploreTab = rawTab && isExploreTab(rawTab) ? rawTab : 'discover';

  function handleTabChange(tab: ExploreTab) {
    if (tab === 'discover') {
      navigate('/explore');
    } else {
      navigate(`/explore/${tab}`);
    }
  }

  return (
    <div className="cgraph-workspace flex flex-1 flex-col overflow-hidden">
      {/* Tab bar */}
      <header className="cgraph-pane-header flex shrink-0 items-center gap-5 px-4 sm:px-6">
        <div className="hidden min-w-0 sm:block">
          <h1 className="text-lg font-semibold text-[var(--token-text-primary)]">Explore</h1>
          <p className="text-xs text-[var(--token-text-muted)]">People and communities</p>
        </div>
        <div
          className="cgraph-segmented scrollbar-hide min-w-0 overflow-x-auto"
          role="tablist"
          aria-label="Explore"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                className="cgraph-segmented-item flex shrink-0 items-center gap-2 px-3 text-sm font-medium"
                role="tab"
                aria-selected={isActive}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'people' && <PeopleTab />}
        {activeTab === 'groups' && <GroupsTab />}
      </div>
    </div>
  );
}
