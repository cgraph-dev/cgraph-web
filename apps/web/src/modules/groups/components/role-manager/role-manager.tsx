import { useEffect, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Button, IconButton } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGroupStore, type Role } from '@/modules/groups/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';
import { getGroupPermissionError } from '../../permission-errors';
import { PERMISSIONS, ROLE_COLORS } from './constants';
import { RoleEditor } from './role-editor';
import type { RoleManagerProps } from './types';

const logger = createLogger('RoleManager');

function sortRoles(roles: readonly Role[]): Role[] {
  return [...roles].sort((left, right) => right.position - left.position);
}

export function RoleManager({ groupId, className = '' }: RoleManagerProps) {
  const { groups, createRole, updateRole, reorderRoles, deleteRole } = useGroupStore();
  const activeGroup = groups.find((group) => group.id === groupId);

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [roleNameError, setRoleNameError] = useState<string | null>(null);

  useEffect(() => {
    const nextRoles = sortRoles(activeGroup?.roles ?? []);
    setRoles(nextRoles);
    setSelectedRole((current) => {
      if (!current || current.id.startsWith('temp-')) return current;
      return nextRoles.find((role) => role.id === current.id) ?? null;
    });
  }, [activeGroup?.roles]);

  const selectRole = (role: Role) => {
    if (isMutating) return;
    setSelectedRole(role);
    setIsCreating(role.id.startsWith('temp-'));
    setRoleNameError(null);
    setMutationError(null);
  };

  const handleCreateRole = () => {
    if (isMutating) return;

    const newRole: Role = {
      id: `temp-${Date.now()}`,
      name: 'New Role',
      color: ROLE_COLORS[roles.length % ROLE_COLORS.length] ?? '#10b981',
      position: Math.max(...roles.map((role) => role.position), 0) + 1,
      permissions:
        (PERMISSIONS.SEND_MESSAGES?.value ?? 0) | (PERMISSIONS.ADD_REACTIONS?.value ?? 0),
      isDefault: false,
      isHoisted: false,
      isMentionable: false,
    };

    setRoles((current) => [newRole, ...current]);
    setSelectedRole(newRole);
    setIsCreating(true);
    setMutationError(null);
    setRoleNameError(null);
    HapticFeedback.success();
  };

  const handleUpdateRole = (updates: Partial<Role>) => {
    if (selectedRole?.isDefault || isMutating) return;
    if (typeof updates.name === 'string' && updates.name.trim()) setRoleNameError(null);

    setSelectedRole((current) => {
      if (!current) return current;
      const updated = { ...current, ...updates };
      setRoles((currentRoles) =>
        currentRoles.map((role) => (role.id === current.id ? updated : role))
      );
      return updated;
    });
  };

  const handleSaveRole = async () => {
    if (!selectedRole || selectedRole.isDefault || isMutating) return;

    const trimmedName = selectedRole.name.trim();
    if (!trimmedName) {
      setRoleNameError('Role name is required.');
      HapticFeedback.error();
      return;
    }

    const savingRole = { ...selectedRole, name: trimmedName };
    setIsMutating(true);
    setMutationError(null);
    setRoleNameError(null);

    try {
      const payload = {
        name: savingRole.name,
        color: savingRole.color,
        permissions: savingRole.permissions,
        is_hoisted: savingRole.isHoisted,
        is_mentionable: savingRole.isMentionable,
      };
      const savedRole = savingRole.id.startsWith('temp-')
        ? await createRole(groupId, payload)
        : await updateRole(groupId, savingRole.id, payload);

      setRoles((current) =>
        current.map((role) => (role.id === savingRole.id ? savedRole : role))
      );
      setSelectedRole(savedRole);
      setIsCreating(false);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Role save failed', error);
      if (savingRole.id.startsWith('temp-')) {
        setRoles((current) => current.filter((role) => role.id !== savingRole.id));
        setSelectedRole(null);
        setIsCreating(false);
      }
      setMutationError(
        getGroupPermissionError(
          error,
          savingRole.id.startsWith('temp-')
            ? 'You do not have permission to create roles in this group.'
            : 'You do not have permission to update roles in this group.',
          savingRole.id.startsWith('temp-')
            ? 'Could not create role. Please try again.'
            : 'Could not update role. Please try again.',
          { preferSpecificServerCopy: true }
        )
      );
      HapticFeedback.error();
    } finally {
      setIsMutating(false);
    }
  };

  const handleMoveRole = async (roleId: string, delta: -1 | 1) => {
    if (isMutating) return;
    const currentIndex = roles.findIndex((role) => role.id === roleId);
    const nextIndex = currentIndex + delta;
    const movingRole = roles[currentIndex];
    const displacedRole = roles[nextIndex];
    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= roles.length ||
      !movingRole ||
      !displacedRole ||
      movingRole.isDefault ||
      displacedRole.isDefault
    ) {
      return;
    }

    const previousRoles = roles;
    const nextRoles = [...roles];
    nextRoles.splice(currentIndex, 1);
    nextRoles.splice(nextIndex, 0, movingRole);
    const roleIds = nextRoles
      .map((role) => role.id)
      .filter((id) => !id.startsWith('temp-'));

    setRoles(nextRoles);
    setIsMutating(true);
    setMutationError(null);
    try {
      await reorderRoles(groupId, roleIds);
      HapticFeedback.light();
    } catch (error) {
      logger.error('Role reorder failed', error);
      setRoles(previousRoles);
      setMutationError(
        getGroupPermissionError(
          error,
          'You do not have permission to reorder roles in this group.',
          'Could not reorder roles. Please try again.',
          { preferSpecificServerCopy: true }
        )
      );
      HapticFeedback.error();
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete || isMutating) return;
    const deletingRole = roleToDelete;
    setIsMutating(true);
    setMutationError(null);

    try {
      if (!deletingRole.id.startsWith('temp-')) {
        await deleteRole(groupId, deletingRole.id);
      }
      setRoles((current) => current.filter((role) => role.id !== deletingRole.id));
      if (selectedRole?.id === deletingRole.id) setSelectedRole(null);
      setIsCreating(false);
      setRoleToDelete(null);
      HapticFeedback.warning();
    } catch (error) {
      logger.error('Role deletion failed', error);
      setRoleToDelete(null);
      setMutationError(
        getGroupPermissionError(
          error,
          'You do not have permission to delete roles in this group.',
          'Could not delete role. Please try again.',
          { preferSpecificServerCopy: true }
        )
      );
      HapticFeedback.error();
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className={`flex h-full min-w-0 flex-col lg:flex-row ${className}`}>
      <aside className="shrink-0 border-b border-[var(--token-border-muted)] p-4 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <ShieldCheckIcon className="h-5 w-5 text-primary-400" />
            Roles
          </h2>
          <IconButton
            icon={<PlusIcon />}
            label="Create role"
            size="sm"
            disabled={isMutating}
            onClick={handleCreateRole}
          />
        </div>

        <ul aria-label="Roles" className="space-y-1">
          {roles.map((role, index) => {
            const previousRole = roles[index - 1];
            const nextRole = roles[index + 1];
            return (
              <li
                key={role.id}
                className={`flex items-center gap-1 rounded-lg border px-1 py-1 ${
                  selectedRole?.id === role.id
                    ? 'border-primary-500/50 bg-primary-600/20'
                    : 'border-transparent'
                }`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  animated={false}
                  aria-current={selectedRole?.id === role.id ? 'true' : undefined}
                  onClick={() => selectRole(role)}
                  className="min-w-0 flex-1 justify-start"
                >
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-left">{role.name}</span>
                  {role.isDefault && <span className="text-[10px] text-gray-500">DEFAULT</span>}
                </Button>
                <IconButton
                  icon={<ChevronUpIcon />}
                  label={`Move ${role.name} up`}
                  size="sm"
                  disabled={isMutating || role.isDefault || index === 0 || previousRole?.isDefault}
                  onClick={() => handleMoveRole(role.id, -1)}
                />
                <IconButton
                  icon={<ChevronDownIcon />}
                  label={`Move ${role.name} down`}
                  size="sm"
                  disabled={
                    isMutating ||
                    role.isDefault ||
                    index === roles.length - 1 ||
                    nextRole?.isDefault
                  }
                  onClick={() => handleMoveRole(role.id, 1)}
                />
              </li>
            );
          })}
        </ul>

        {roles.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">No roles yet</p>
        )}
      </aside>

      <section className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
        {mutationError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {mutationError}
          </div>
        )}

        {selectedRole ? (
          <RoleEditor
            role={selectedRole}
            isNew={isCreating}
            isSaving={isMutating}
            nameError={roleNameError}
            onUpdate={handleUpdateRole}
            onDelete={() => setRoleToDelete(selectedRole)}
            onSave={handleSaveRole}
          />
        ) : (
          <div className="flex min-h-64 items-center justify-center text-center">
            <div>
              <ShieldCheckIcon className="mx-auto mb-4 h-12 w-12 text-gray-700" />
              <p className="text-gray-500">Select a role to edit</p>
            </div>
          </div>
        )}
      </section>

      <Dialog open={roleToDelete !== null} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <DialogContent ariaLabel="Delete role">
          <DialogHeader>
            <DialogTitle>Delete role</DialogTitle>
            <DialogDescription>
              Delete {roleToDelete?.name}? Members will lose this role immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" disabled={isMutating} onClick={() => setRoleToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={isMutating} onClick={handleDeleteRole}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RoleManager;
