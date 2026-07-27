import {
  XMarkIcon,
  HashtagIcon,
  SpeakerWaveIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button, IconButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const channelIcons = {
  text: HashtagIcon,
  voice: SpeakerWaveIcon,
  announcement: MegaphoneIcon,
} as const;

interface CreateChannelFormProps {
  show: boolean;
  newName: string;
  newType: 'text' | 'voice' | 'announcement';
  newTopic: string;
  onNameChange: (name: string) => void;
  onTypeChange: (type: 'text' | 'voice' | 'announcement') => void;
  onTopicChange: (topic: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

/**
 * Create Channel Form component.
 */
export function CreateChannelForm({
  show,
  newName,
  newType,
  newTopic,
  onNameChange,
  onTypeChange,
  onTopicChange,
  onClose,
  onCreate,
}: CreateChannelFormProps) {
  if (!show) return null;

  return (
    <GlassCard
      variant="frosted"
      className="space-y-4 p-4 sm:p-6"
      data-testid="new-channel-form"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">New Channel</h3>
        <IconButton icon={<XMarkIcon />} label="Close channel form" onClick={onClose} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Channel type">
        {(['text', 'voice', 'announcement'] as const).map((type) => {
          const Icon: React.ElementType = channelIcons[type];
          return (
            <Button
              key={type}
              variant={newType === type ? 'secondary' : 'outline'}
              size="sm"
              leftIcon={<Icon />}
              onClick={() => onTypeChange(type)}
              aria-pressed={newType === type}
              className="min-h-11 capitalize lg:min-h-9"
            >
              {type}
            </Button>
          );
        })}
      </div>

      <Input
        label="Channel name"
        placeholder="channel-name"
        value={newName}
        onChange={(e) => onNameChange(e.target.value)}
      />
      <Input
        label="Topic"
        placeholder="Channel topic (optional)"
        value={newTopic}
        onChange={(e) => onTopicChange(e.target.value)}
      />
      <div className="flex justify-end">
        <Button onClick={onCreate} disabled={!newName.trim()}>
          Create
        </Button>
      </div>
    </GlassCard>
  );
}
