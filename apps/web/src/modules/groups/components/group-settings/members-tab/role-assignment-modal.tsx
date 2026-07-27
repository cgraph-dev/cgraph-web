import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GroupMember, GroupRole } from './types';

interface RoleAssignmentModalProps {
  memberId: string | null;
  members: readonly GroupMember[];
  availableRoles: readonly GroupRole[];
  selectedRoleIds: ReadonlySet<string>;
  isSubmitting: boolean;
  onToggleRole: (roleId: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function RoleAssignmentModal({
  memberId,
  members,
  availableRoles,
  selectedRoleIds,
  isSubmitting,
  onToggleRole,
  onSave,
  onClose,
}: RoleAssignmentModalProps) {
  const member = members.find((candidate) => candidate.id === memberId);
  const displayName = member?.displayName || member?.username || 'this member';
  const assignableRoles = [...availableRoles]
    .filter((role) => !role.isDefault)
    .sort((left, right) => right.position - left.position || left.name.localeCompare(right.name));

  return (
    <Dialog
      open={memberId !== null}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent ariaLabel="Assign roles">
        <DialogHeader>
          <DialogTitle>Assign roles</DialogTitle>
          <DialogDescription>Select the roles for {displayName}.</DialogDescription>
        </DialogHeader>

        <fieldset disabled={isSubmitting} className="max-h-64 space-y-2 overflow-y-auto">
          <legend className="sr-only">Available roles</legend>
          {assignableRoles.map((role) => (
            <label
              key={role.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-[var(--token-bg-secondary)] px-3 py-2"
            >
              <input
                type="checkbox"
                checked={selectedRoleIds.has(role.id)}
                onChange={() => onToggleRole(role.id)}
                className="h-4 w-4 rounded border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] text-primary-600 focus:ring-primary-500"
              />
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: role.color }}
              />
              <span className="text-sm text-white">{role.name}</span>
            </label>
          ))}
          {assignableRoles.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">No assignable roles configured</p>
          )}
        </fieldset>

        <DialogFooter>
          <Button variant="ghost" disabled={isSubmitting} onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isSubmitting} onClick={onSave}>
            Save roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
