import { ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Card from '@/components/ui/card';
import { PermissionRow } from './permission-row';
import { getPermState } from './permission-utils';
import { PERMISSION_FLAGS } from './types';
import type { PermissionOverwrite, RoleOption } from './types';

interface OverwriteCardProps {
  overwrite: PermissionOverwrite;
  roles: RoleOption[];
  isEditing: boolean;
  saving: boolean;
  deleting: boolean;
  disabled: boolean;
  pendingAllow: number;
  pendingDeny: number;
  hasPendingChanges: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
  onPermToggle: (bit: number) => void;
  onSave: () => void;
}

function getOverwriteLabel(o: PermissionOverwrite, roles: RoleOption[]): string {
  if (o.type === 'role') {
    return o.roleName ?? roles.find((r) => r.id === o.roleId)?.name ?? 'Unknown Role';
  }
  return o.memberName ?? 'Unknown Member';
}

function getOverwriteColor(o: PermissionOverwrite, roles: RoleOption[]): string | undefined {
  if (o.type === 'role' && o.roleId) {
    return roles.find((r) => r.id === o.roleId)?.color;
  }
  return undefined;
}

export function OverwriteCard({
  overwrite,
  roles,
  isEditing,
  saving,
  deleting,
  disabled,
  pendingAllow,
  pendingDeny,
  hasPendingChanges,
  onToggleEdit,
  onDelete,
  onPermToggle,
  onSave,
}: OverwriteCardProps) {
  const color = getOverwriteColor(overwrite, roles);
  const label = getOverwriteLabel(overwrite, roles);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {overwrite.type === 'role' ? (
            <ShieldCheckIcon aria-hidden="true" className="h-5 w-5 shrink-0" style={{ color }} />
          ) : (
            <UserIcon
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-[var(--token-text-muted)]"
            />
          )}
          <span
            className="truncate font-medium text-[var(--token-text-primary)]"
            style={color ? { color } : undefined}
          >
            {label}
          </span>
          <span className="text-xs text-[var(--token-text-muted)]">({overwrite.type})</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onToggleEdit}
            aria-expanded={isEditing}
          >
            {isEditing ? 'Collapse' : 'Edit'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={disabled}
            isLoading={deleting}
            onClick={onDelete}
          >
            Remove
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-3 space-y-2">
          <div className="grid gap-1.5">
            {PERMISSION_FLAGS.map(({ bit, label: flagLabel, description }) => {
              const state = getPermState(pendingAllow, pendingDeny, bit);
              return (
                <PermissionRow
                  key={bit}
                  bit={bit}
                  label={flagLabel}
                  description={description}
                  state={state}
                  onToggle={onPermToggle}
                  disabled={disabled}
                />
              );
            })}
          </div>

          {hasPendingChanges && (
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={onSave} isLoading={saving} disabled={disabled}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
