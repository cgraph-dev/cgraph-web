import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { GroupSettings } from '@/modules/groups/components/group-settings';
import { useGroupStore } from '@/modules/groups/store';
import { getGroupRoute } from '@/modules/groups/routing';
import { createLogger } from '@/lib/logger';

const logger = createLogger('GroupSettingsPage');

/**
 * Routed group settings owner.
 */
export default function GroupSettingsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const groups = useGroupStore((state) => state.groups);
  const fetchGroup = useGroupStore((state) => state.fetchGroup);
  const group = groups.find((candidate) => candidate.id === groupId);

  useEffect(() => {
    if (!groupId || group) return;
    fetchGroup(groupId).catch((error: unknown) => {
      logger.error('Failed to load group settings route owner', error);
    });
  }, [fetchGroup, group, groupId]);

  if (!groupId) {
    return <Navigate to="/groups" replace />;
  }

  return (
    <GroupSettings
      groupId={groupId}
      onClose={() => navigate(group ? getGroupRoute(group) : `/groups/${groupId}`)}
    />
  );
}
