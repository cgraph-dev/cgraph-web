/**
 * Groups Page - Main component
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, List } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { useGroupStore } from '@/modules/groups/store';
import {
  ServerList,
  ChannelList,
  ContentArea,
  LoadingOverlay,
} from './components';
import { findGroupChannel, getGroupRoute } from '@/modules/groups/routing';

/**
 * Groups component.
 */
export default function Groups() {
  const { groupId, channelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { groups, isLoadingGroups, fetchGroups, fetchGroup, setActiveGroup, setActiveChannel } =
    useGroupStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showMobileChannels, setShowMobileChannels] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Fetch full group data when selected
  useEffect(() => {
    if (groupId) {
      setActiveGroup(groupId);
      fetchGroup(groupId);
    }
    if (channelId) {
      setActiveChannel(channelId);
    }
  }, [groupId, channelId, setActiveGroup, fetchGroup, setActiveChannel]);

  const activeGroup = groups.find((g) => g.id === groupId);
  const activeChannel = activeGroup && channelId ? findGroupChannel(activeGroup, channelId) : null;
  const defaultGroupRoute = activeGroup ? getGroupRoute(activeGroup) : null;

  useEffect(() => {
    setShowMobileChannels(false);
  }, [location.pathname]);

  // Initialize all categories as expanded
  useEffect(() => {
    if (activeGroup?.categories) {
      setExpandedCategories(new Set(activeGroup.categories.map((c) => c.id)));
    }
  }, [activeGroup?.id, activeGroup?.categories]);

  if (
    groupId &&
    !channelId &&
    location.pathname === `/groups/${groupId}` &&
    activeGroup &&
    defaultGroupRoute &&
    defaultGroupRoute !== `/groups/${activeGroup.id}`
  ) {
    return <Navigate to={defaultGroupRoute} replace />;
  }

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <div className="aurora-hub-shell cgraph-workspace max-h-screen flex-1">
      {/* Loading state */}
      {isLoadingGroups && groups.length === 0 && <LoadingOverlay />}

      {/* Server List */}
      <ServerList
        groups={groups}
        activeGroupId={groupId}
        showMobileDirectory={!activeGroup}
      />

      {/* Channel List */}
      <ChannelList
        activeGroup={activeGroup}
        channelId={channelId}
        expandedCategories={expandedCategories}
        toggleCategory={toggleCategory}
        mobileVisible={Boolean(activeGroup && showMobileChannels)}
        onCloseMobile={() => setShowMobileChannels(false)}
        onBackToGroups={() => navigate('/groups')}
      />

      {/* Channel Content */}
      <div
        data-testid="group-content-pane"
        className={`${activeGroup && !showMobileChannels ? 'flex' : 'hidden'} aurora-hub-main cgraph-workspace relative z-10 h-full min-w-0 flex-1 flex-col lg:flex`}
        aria-label="Group content"
        tabIndex={0}
      >
        {activeGroup && (
          <header
            data-testid="mobile-group-toolbar"
            className="flex h-14 shrink-0 items-center gap-1 border-b border-[var(--token-border-muted)] bg-[var(--token-bg-primary)] px-2 lg:hidden"
          >
            <IconButton
              icon={<ArrowLeft />}
              label="Back to groups"
              size="md"
              onClick={() => navigate('/groups')}
              className="h-11 w-11 shrink-0"
            />
            <button
              type="button"
              onClick={() => setShowMobileChannels(true)}
              className="cgraph-control cgraph-control-ghost flex h-11 min-w-0 flex-1 items-center gap-2 px-2 text-left"
              aria-label={`Open ${activeGroup.name} channels`}
              data-cgraph-material="solid"
              data-cgraph-surface="control"
              data-cgraph-state="idle"
              data-cgraph-variant="ghost"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--token-interactive-primary)] text-xs font-bold text-[var(--token-text-on-primary)]">
                {activeGroup.iconUrl ? (
                  <img
                    src={activeGroup.iconUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  activeGroup.name.charAt(0).toLocaleUpperCase()
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--token-text-primary)]">
                  {activeGroup.name}
                </span>
                <span className="block truncate text-[11px] text-[var(--token-text-muted)]">
                  {activeChannel ? `# ${activeChannel.name}` : 'Channels'}
                </span>
              </span>
              <List className="h-5 w-5 shrink-0 text-[var(--token-text-secondary)]" />
            </button>
          </header>
        )}
        <ContentArea activeGroup={activeGroup} groupId={groupId} channelId={channelId} />
      </div>
    </div>
  );
}
