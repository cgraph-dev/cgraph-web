import type { ReactNode } from 'react';
import { Eye, MessageCircle, Users, VolumeX } from 'lucide-react';
import Card from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface SpaceFilterEditorProps {
  readonly includeAllIndividual: boolean;
  readonly includeAllGroups: boolean;
  readonly showOnlyUnread: boolean;
  readonly showMuted: boolean;
  readonly onIncludeAllIndividualChange: (value: boolean) => void;
  readonly onIncludeAllGroupsChange: (value: boolean) => void;
  readonly onShowOnlyUnreadChange: (value: boolean) => void;
  readonly onShowMutedChange: (value: boolean) => void;
  readonly disabled?: boolean;
}

interface FilterToggleProps {
  readonly icon: ReactNode;
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onCheckedChange: (value: boolean) => void;
  readonly disabled: boolean;
}

function FilterToggle({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: FilterToggleProps) {
  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-[var(--product-line)] px-3 py-2 last:border-b-0">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--product-surface-recessed)] text-[var(--token-interactive-primary)]"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-[var(--token-text-primary)]">{label}</span>
        <span className="block text-xs text-[var(--token-text-muted)]">{description}</span>
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        ariaLabel={label}
      />
    </div>
  );
}

export function SpaceFilterEditor({
  includeAllIndividual,
  includeAllGroups,
  showOnlyUnread,
  showMuted,
  onIncludeAllIndividualChange,
  onIncludeAllGroupsChange,
  onShowOnlyUnreadChange,
  onShowMutedChange,
  disabled = false,
}: SpaceFilterEditorProps): React.ReactNode {
  return (
    <Card padding="none" className="overflow-hidden">
      <FilterToggle
        icon={<MessageCircle className="h-4 w-4" />}
        label="Include direct conversations"
        description="Include one-to-one chats"
        checked={includeAllIndividual}
        onCheckedChange={onIncludeAllIndividualChange}
        disabled={disabled}
      />
      <FilterToggle
        icon={<Users className="h-4 w-4" />}
        label="Include group conversations"
        description="Include group chats"
        checked={includeAllGroups}
        onCheckedChange={onIncludeAllGroupsChange}
        disabled={disabled}
      />
      <FilterToggle
        icon={<Eye className="h-4 w-4" />}
        label="Show only unread"
        description="Hide chats with no unread messages"
        checked={showOnlyUnread}
        onCheckedChange={onShowOnlyUnreadChange}
        disabled={disabled}
      />
      <FilterToggle
        icon={<VolumeX className="h-4 w-4" />}
        label="Show muted chats"
        description="Include muted conversations"
        checked={showMuted}
        onCheckedChange={onShowMutedChange}
        disabled={disabled}
      />
    </Card>
  );
}
