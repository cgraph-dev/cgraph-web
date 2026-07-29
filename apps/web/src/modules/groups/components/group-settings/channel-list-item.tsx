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
  disabled?: boolean;
  saving?: boolean;
}

export type { ChannelItem };

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
  disabled = false,
  saving = false,
}: ChannelListItemProps) {
  const Icon: React.ElementType = hasChannelIcon(channel.type)
    ? channelIcons[channel.type]
    : HashtagIcon;

  return (
    <div
      role="listitem"
      data-testid={`channel-settings-row-${channel.id}`}
      className="cgraph-list-row flex flex-wrap items-center justify-between gap-3 rounded-none border-0 px-4 py-3"
    >
      {editingId === channel.id ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <Icon
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-[var(--token-text-muted)]"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
            <Input
              aria-label={`Channel name for ${channel.name}`}
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              size="sm"
              className="min-h-9"
              disabled={disabled}
            />
            <Input
              aria-label={`Channel topic for ${channel.name}`}
              value={editTopic}
              onChange={(e) => onEditTopicChange(e.target.value)}
              placeholder="Topic"
              size="sm"
              className="min-h-9"
              disabled={disabled}
            />
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={() => onSave(channel.id)}
              disabled={disabled || !editName.trim()}
              isLoading={saving}
            >
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancelEdit} disabled={disabled}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-3">
            <Icon
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-[var(--token-text-muted)]"
            />
            <div className="min-w-0">
              <span className="block truncate font-medium text-[var(--token-text-primary)]">
                {channel.name}
              </span>
              {channel.topic && (
                <p className="truncate text-xs text-[var(--token-text-muted)]">{channel.topic}</p>
              )}
            </div>
            {channel.nsfw && (
              <span className="rounded border border-[var(--token-feedback-error)] px-1.5 py-0.5 text-xs text-[var(--token-feedback-error)]">
                NSFW
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              icon={<ChevronUpIcon aria-hidden="true" />}
              label={`Move ${channel.name} up`}
              size="sm"
              onClick={onMoveUp}
              disabled={disabled || reorderDisabled || index === 0}
            />
            <IconButton
              icon={<ChevronDownIcon aria-hidden="true" />}
              label={`Move ${channel.name} down`}
              size="sm"
              onClick={onMoveDown}
              disabled={disabled || reorderDisabled || index === totalCount - 1}
            />
            <IconButton
              icon={<ShieldCheckIcon aria-hidden="true" />}
              label={`Permissions for ${channel.name}`}
              size="sm"
              disabled={disabled}
              onClick={() => onPermissions(channel.id)}
            />
            <IconButton
              icon={<PencilIcon aria-hidden="true" />}
              label={`Edit ${channel.name}`}
              size="sm"
              disabled={disabled}
              onClick={() => onStartEdit(channel)}
            />
            <IconButton
              icon={<TrashIcon aria-hidden="true" />}
              label={`Delete ${channel.name}`}
              variant="danger"
              size="sm"
              disabled={disabled}
              onClick={() => onDelete(channel.id)}
            />
          </div>
        </>
      )}
    </div>
  );
}
