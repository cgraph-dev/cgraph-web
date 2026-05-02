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
    <div className="flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-[var(--token-border-muted)] px-6 pt-5">
        <div className="scrollbar-hide flex items-center gap-1 overflow-x-auto pb-0">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex flex-shrink-0 items-center gap-2 border-b-2 px-4 pb-3.5 pt-1 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary-500 text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

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
