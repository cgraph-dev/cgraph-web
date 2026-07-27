import {
  HashtagIcon,
  SpeakerWaveIcon,
  MegaphoneIcon,
  TrashIcon,
  PencilIcon,
  ShieldCheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Button, IconButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const channelIcons = {
  text: HashtagIcon,
  voice: SpeakerWaveIcon,
  announcement: MegaphoneIcon,
} as const;

function hasChannelIcon(type: string): type is keyof typeof channelIcons {
  return type in channelIcons;
}

interface ChannelItem {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  topic: string | null;
  position: number;
  categoryId: string | null;
  nsfw: boolean;
  slowmodeSeconds: number;
}

interface ChannelListItemProps {
  channel: ChannelItem;
  index: number;
  totalCount: number;
  editingId: string | null;
  editName: string;
  editTopic: string;
  reorderDisabled: boolean;
  onEditNameChange: (name: string) => void;
  onEditTopicChange: (topic: string) => void;
  onSave: (channelId: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (channel: ChannelItem) => void;
  onDelete: (channelId: string) => void;
  onPermissions: (channelId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export type { ChannelItem };

/**
 * Channel List Item component.
 */
export function ChannelListItem({
  channel,
  index,
  totalCount,
  editingId,
  editName,
  editTopic,
  reorderDisabled,
  onEditNameChange,
  onEditTopicChange,
  onSave,
  onCancelEdit,
  onStartEdit,
  onDelete,
  onPermissions,
  onMoveUp,
  onMoveDown,
}: ChannelListItemProps) {
  const Icon: React.ElementType = hasChannelIcon(channel.type)
    ? channelIcons[channel.type]
    : HashtagIcon;

  return (
    <div
      role="listitem"
      data-testid={`channel-settings-row-${channel.id}`}
      className="flex items-center justify-between px-4 py-3"
    >
      {editingId === channel.id ? (
        // Edit mode
        <div className="flex flex-1 items-center gap-3">
          <Icon className="h-5 w-5 shrink-0 text-gray-400" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
            <Input
              aria-label={`Channel name for ${channel.name}`}
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              size="sm"
              className="min-h-9"
            />
            <Input
              aria-label={`Channel topic for ${channel.name}`}
              value={editTopic}
              onChange={(e) => onEditTopicChange(e.target.value)}
              placeholder="Topic"
              size="sm"
              className="min-h-9"
            />
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={() => onSave(channel.id)}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        // View mode
        <>
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-gray-400" />
            <div>
              <span className="font-medium text-white">{channel.name}</span>
              {channel.topic && <p className="text-xs text-gray-500">{channel.topic}</p>}
            </div>
            {channel.nsfw && (
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">NSFW</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              icon={<ChevronUpIcon />}
              label={`Move ${channel.name} up`}
              size="sm"
              onClick={onMoveUp}
              disabled={reorderDisabled || index === 0}
            />
            <IconButton
              icon={<ChevronDownIcon />}
              label={`Move ${channel.name} down`}
              size="sm"
              onClick={onMoveDown}
              disabled={reorderDisabled || index === totalCount - 1}
            />
            <IconButton
              icon={<ShieldCheckIcon />}
              label={`Permissions for ${channel.name}`}
              size="sm"
              onClick={() => onPermissions(channel.id)}
            />
            <IconButton
              icon={<PencilIcon />}
              label={`Edit ${channel.name}`}
              size="sm"
              onClick={() => onStartEdit(channel)}
            />
            <IconButton
              icon={<TrashIcon />}
              label={`Delete ${channel.name}`}
              variant="danger"
              size="sm"
              onClick={() => onDelete(channel.id)}
            />
          </div>
        </>
      )}
    </div>
  );
}
