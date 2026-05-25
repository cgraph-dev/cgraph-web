/**
 * Groups Page - Main component
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useGroupStore } from '@/modules/groups/store';
import {
  ServerList,
  ChannelList,
  ContentArea,
  LoadingOverlay,
  AmbientParticles,
} from './components';
import { getGroupRoute } from '@/modules/groups/routing';

/**
 * Groups component.
 */
export default function Groups() {
  const { groupId, channelId } = useParams();
  const location = useLocation();
  const { groups, isLoadingGroups, fetchGroups, fetchGroup, setActiveGroup, setActiveChannel } =
    useGroupStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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
  const defaultGroupRoute = activeGroup ? getGroupRoute(activeGroup) : null;

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
    <div className="aurora-hub-shell max-h-screen flex-1">
      {/* Loading state */}
      {isLoadingGroups && groups.length === 0 && <LoadingOverlay />}

      {/* Ambient particles */}
      <AmbientParticles />

      {/* Server List */}
      <ServerList groups={groups} activeGroupId={groupId} />

      {/* Channel List */}
      <ChannelList
        activeGroup={activeGroup}
        channelId={channelId}
        expandedCategories={expandedCategories}
        toggleCategory={toggleCategory}
      />

      {/* Channel Content */}
      <div
        className="aurora-hub-main relative z-10 flex h-full min-w-0 flex-col bg-transparent"
        aria-label="Group content"
        tabIndex={0}
      >
        <ContentArea activeGroup={activeGroup} groupId={groupId} channelId={channelId} />
      </div>
    </div>
  );
}
