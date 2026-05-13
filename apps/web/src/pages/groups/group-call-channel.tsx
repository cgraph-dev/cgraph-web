import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { SpeakerWaveIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { GroupCallView } from '@/modules/calls/components/group-call-view';
import { useGroupStore } from '@/modules/groups/store';
import {
  collectGroupChannels,
  findGroupChannel,
  getGroupChannelRouteForChannel,
  getGroupLiveKitRoomName,
} from '@/modules/groups/routing';

export default function GroupCallChannel() {
  const { groupId, channelId } = useParams<{
    groupId: string;
    channelId: string;
  }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const groups = useGroupStore((state) => state.groups);

  const expectedType = pathname.includes('/video/') ? 'video' : 'voice';
  const group = groups.find((candidate) => candidate.id === groupId);
  const channel = group ? findGroupChannel(group, channelId) : null;

  if (!groupId || !channelId) {
    return <Navigate to="/groups" replace />;
  }

  if (group && channel && channel.type !== expectedType) {
    return (
      <Navigate
        to={getGroupChannelRouteForChannel(group.id, channel)}
        replace
      />
    );
  }

  const Icon = expectedType === 'video' ? VideoCameraIcon : SpeakerWaveIcon;
  const label = expectedType === 'video' ? 'Video Room' : 'Voice Room';
  const returnChannel = group
    ? collectGroupChannels(group).find(
        (candidate) =>
          candidate.id !== channelId &&
          candidate.type !== 'voice' &&
          candidate.type !== 'video',
      )
    : null;

  return (
    <div className="flex flex-1 flex-col bg-[var(--token-bg-primary)]">
      <header className="flex h-12 items-center gap-3 border-b border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] px-4">
        <Icon className="h-5 w-5 text-gray-400" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-white">
              {channel?.name ?? label}
            </span>
            <span className="rounded bg-white/[0.08] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/60">
              {label}
            </span>
          </div>
          {channel?.topic && (
            <p className="truncate text-xs text-gray-400">{channel.topic}</p>
          )}
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <GroupCallView
          roomName={getGroupLiveKitRoomName(groupId, channelId)}
          groupId={groupId}
          channelId={channelId}
          audioEnabled
          videoEnabled={expectedType === 'video'}
          onCallEnd={() => {
            if (group && returnChannel) {
              navigate(getGroupChannelRouteForChannel(group.id, returnChannel));
            } else {
              navigate('/groups');
            }
          }}
        />
      </div>
    </div>
  );
}
