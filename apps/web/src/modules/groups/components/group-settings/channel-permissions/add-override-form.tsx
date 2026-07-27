import { ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/ui/select';
import type { RoleOption } from './types';

interface AddOverrideFormProps {
  show: boolean;
  addType: 'role' | 'member';
  selectedTargetId: string;
  availableRoles: RoleOption[];
  onTypeChange: (type: 'role' | 'member') => void;
  onTargetChange: (id: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}

/**
 * Add Override Form component.
 */
export function AddOverrideForm({
  show,
  addType,
  selectedTargetId,
  availableRoles,
  onTypeChange,
  onTargetChange,
  onAdd,
  onCancel,
}: AddOverrideFormProps) {
  if (!show) return null;

  return (
    <GlassCard variant="frosted" className="space-y-3 p-4">
      <div className="flex gap-3">
        <Button
          variant={addType === 'role' ? 'secondary' : 'outline'}
          size="sm"
          leftIcon={<ShieldCheckIcon />}
          onClick={() => onTypeChange('role')}
          aria-pressed={addType === 'role'}
        >
          Role
        </Button>
        <Button
          variant={addType === 'member' ? 'secondary' : 'outline'}
          size="sm"
          leftIcon={<UserIcon />}
          onClick={() => onTypeChange('member')}
          aria-pressed={addType === 'member'}
        >
          Member
        </Button>
      </div>

      {addType === 'role' ? (
        <Select
          label="Role"
          value={selectedTargetId}
          onChange={onTargetChange}
          placeholder="Select a role..."
          options={availableRoles.map((role) => ({ value: role.id, label: role.name }))}
        />
      ) : (
        <Input
          label="Member ID"
          placeholder="Enter member ID..."
          value={selectedTargetId}
          onChange={(e) => onTargetChange(e.target.value)}
        />
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onAdd} disabled={!selectedTargetId}>
          Add
        </Button>
      </div>
    </GlassCard>
  );
}
