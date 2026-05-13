import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { GroupSettings } from '@/modules/groups/components/group-settings';
import { useGroupStore } from '@/modules/groups/store';
import { getGroupRoute } from '@/modules/groups/routing';

/**
 * Routed group settings owner.
 */
export default function GroupSettingsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const groups = useGroupStore((state) => state.groups);
  const group = groups.find((candidate) => candidate.id === groupId);

  if (!groupId) {
    return <Navigate to="/groups" replace />;
  }

  return (
    <GroupSettings
      groupId={groupId}
      onClose={() =>
        navigate(group ? getGroupRoute(group) : `/groups/${groupId}`)
      }
    />
  );
}
