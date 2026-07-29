import { ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Card from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
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
  disabled?: boolean;
}

export function AddOverrideForm({
  show,
  addType,
  selectedTargetId,
  availableRoles,
  onTypeChange,
  onTargetChange,
  onAdd,
  onCancel,
  disabled = false,
}: AddOverrideFormProps) {
  if (!show) return null;

  return (
    <Card className="space-y-3">
      <div className="flex gap-3">
        <Button
          variant={addType === 'role' ? 'secondary' : 'outline'}
          size="sm"
          leftIcon={<ShieldCheckIcon aria-hidden="true" />}
          disabled={disabled}
          onClick={() => onTypeChange('role')}
          aria-pressed={addType === 'role'}
        >
          Role
        </Button>
        <Button
          variant={addType === 'member' ? 'secondary' : 'outline'}
          size="sm"
          leftIcon={<UserIcon aria-hidden="true" />}
          disabled={disabled}
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
          onChange={(event) => onTargetChange(event.target.value)}
          placeholder="Select a role..."
          options={availableRoles.map((role) => ({ value: role.id, label: role.name }))}
          disabled={disabled}
        />
      ) : (
        <Input
          label="Member ID"
          placeholder="Enter member ID..."
          value={selectedTargetId}
          onChange={(e) => onTargetChange(e.target.value)}
          disabled={disabled}
        />
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={disabled}>
          Cancel
        </Button>
        <Button size="sm" onClick={onAdd} disabled={disabled || !selectedTargetId}>
          Add
        </Button>
      </div>
    </Card>
  );
}
