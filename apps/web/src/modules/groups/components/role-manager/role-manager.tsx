/**
 * RoleManager Component
 *
 * Full-featured role management interface.
 * Features:
 * - Create/edit/delete roles
 * - Drag-and-drop reordering
 * - Permission toggles with descriptions
 * - Color picker
 * - Role hierarchy visualization
 * - Member assignment preview
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Reorder } from 'motion/react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ShieldCheckIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useGroupStore, type Role } from '@/modules/groups/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { PERMISSIONS, ROLE_COLORS } from './constants';
import { RoleEditor } from './role-editor';
import type { RoleManagerProps } from './types';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { getGroupPermissionError } from '../../permission-errors';

const logger = createLogger('RoleManager');

/**
 */
/**
 * Role Manager component.
 */
export function RoleManager({ groupId, className = '' }: RoleManagerProps) {
  const { groups, createRole, updateRole, deleteRole } = useGroupStore();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [roleNameError, setRoleNameError] = useState<string | null>(null);

  const activeGroup = groups.find((g) => g.id === groupId);

  useEffect(() => {
    setRoles([...(activeGroup?.roles ?? [])].sort((a, b) => b.position - a.position));
  }, [activeGroup?.roles]);

  const handleReorder = (newOrder: Role[]) => {
    const previousRoles = roles;
    setRoles(newOrder);
    setMutationError(null);
    HapticFeedback.light();
    // Persist new role order to backend
    const roleIds = newOrder.map((r) => r.id).filter((id) => !id.startsWith('temp-'));
    if (roleIds.length > 0) {
      http.put(`/api/v1/groups/${groupId}/roles/reorder`, { role_ids: roleIds }).catch((error) => {
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
      });
    }
  };

  const handleMoveRole = (roleId: string, delta: -1 | 1) => {
    if (isSaving) return;
    const currentIndex = roles.findIndex((role) => role.id === roleId);
    const nextIndex = currentIndex + delta;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= roles.length) return;

    const nextRoles = [...roles];
    const [movedRole] = nextRoles.splice(currentIndex, 1);
    if (!movedRole) return;

    nextRoles.splice(nextIndex, 0, movedRole);
    handleReorder(nextRoles);
  };

  const handleCreateRole = () => {
    if (isSaving) return;
    setMutationError(null);
    setRoleNameError(null);
    const sendMessages = PERMISSIONS.SEND_MESSAGES?.value ?? 0;
    const addReactions = PERMISSIONS.ADD_REACTIONS?.value ?? 0;
    const newRole: Role = {
      id: `temp-${Date.now()}`,
      name: 'New Role',
      color: ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)] ?? '#10b981',
      position: roles.length,
      permissions: sendMessages | addReactions,
      isDefault: false,
      isMentionable: false,
    };
    setRoles([newRole, ...roles]);
    setSelectedRole(newRole);
    setIsCreating(true);
    HapticFeedback.success();
  };

  const handleDeleteRole = (roleId: string) => {
    if (isSaving) return;
    setMutationError(null);
    setRoleNameError(null);
    const previousRoles = roles;
    const previousSelectedRole = selectedRole;
    setRoles(roles.filter((r) => r.id !== roleId));
    if (selectedRole?.id === roleId) {
      setSelectedRole(null);
    }
    HapticFeedback.warning();
    if (!roleId.startsWith('temp-')) {
      deleteRole(groupId, roleId).catch((error) => {
        logger.error('Role deletion failed', error);
        setRoles(previousRoles);
        setSelectedRole(previousSelectedRole);
        setMutationError(
          getGroupPermissionError(
            error,
            'You do not have permission to delete roles in this group.',
            'Could not delete role. Please try again.',
            { preferSpecificServerCopy: true }
          )
        );
        HapticFeedback.error();
      });
    }
  };

  const handleUpdateRole = (updates: Partial<Role>) => {
    if (typeof updates.name === 'string' && updates.name.trim().length > 0) {
      setRoleNameError(null);
    }

    setSelectedRole((currentRole) => {
      if (!currentRole) return currentRole;

      const updatedRole = { ...currentRole, ...updates };
      setRoles((currentRoles) =>
        currentRoles.map((role) => (role.id === currentRole.id ? updatedRole : role))
      );
      return updatedRole;
    });
  };

  const handleSaveRole = () => {
    if (!selectedRole || isSaving) return;
    const trimmedName = selectedRole.name.trim();

    if (!trimmedName) {
      setRoleNameError('Role name is required.');
      HapticFeedback.error();
      return;
    }

    setIsSaving(true);
    setMutationError(null);
    setRoleNameError(null);
    const savingRole = { ...selectedRole, name: trimmedName };

    if (savingRole.name !== selectedRole.name) {
      setSelectedRole(savingRole);
      setRoles((prev) =>
        prev.map((role) => (role.id === selectedRole.id ? { ...role, name: savingRole.name } : role))
      );
    }

    if (selectedRole.id.startsWith('temp-')) {
      createRole(groupId, {
        name: savingRole.name,
        color: savingRole.color,
        permissions: savingRole.permissions,
        is_mentionable: savingRole.isMentionable,
      })
        .then((created) => {
          setRoles((prev) => prev.map((r) => (r.id === savingRole.id ? created : r)));
          setSelectedRole(created);
          setIsCreating(false);
          HapticFeedback.success();
        })
        .catch((error) => {
          logger.error('Role creation failed', error);
          setRoles((prev) => prev.filter((role) => role.id !== savingRole.id));
          setSelectedRole(null);
          setIsCreating(false);
          setMutationError(
            getGroupPermissionError(
              error,
              'You do not have permission to create roles in this group.',
              'Could not create role. Please try again.',
              { preferSpecificServerCopy: true }
            )
          );
          HapticFeedback.error();
        })
        .finally(() => setIsSaving(false));
    } else {
      updateRole(groupId, savingRole.id, {
        name: savingRole.name,
        color: savingRole.color,
        permissions: savingRole.permissions,
        is_mentionable: savingRole.isMentionable,
      })
        .then((updated) => {
          setRoles((prev) => prev.map((r) => (r.id === savingRole.id ? updated : r)));
          setSelectedRole(updated);
          HapticFeedback.success();
        })
        .catch((error) => {
          logger.error('Role update failed', error);
          setMutationError(
            getGroupPermissionError(
              error,
              'You do not have permission to update roles in this group.',
              'Could not update role. Please try again.',
              { preferSpecificServerCopy: true }
            )
          );
          HapticFeedback.error();
        })
        .finally(() => setIsSaving(false));
    }
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Role List */}
      <div className="w-64 border-r border-[var(--token-border-muted)] p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <ShieldCheckIcon className="h-5 w-5 text-primary-400" />
            Roles
          </h3>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            disabled={isSaving}
            onClick={handleCreateRole}
            aria-label="Create role"
            className="bg-primary-600/20 hover:bg-primary-600/30 rounded-lg p-1.5 text-primary-400 disabled:cursor-wait disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
          </motion.button>
        </div>

        <Reorder.Group axis="y" values={roles} onReorder={handleReorder} className="space-y-1">
          {roles.map((role, index) => (
            <Reorder.Item key={role.id} value={role} className="cursor-grab active:cursor-grabbing">
              <div
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  selectedRole?.id === role.id
                    ? 'border-primary-500/50 bg-primary-600/20 border'
                    : 'hover:bg-[var(--token-card-bg)]'
                }`}
              >
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedRole(role);
                    setIsCreating(false);
                    setRoleNameError(null);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="flex-1 truncate text-left text-sm font-medium text-gray-300">
                    {role.name}
                  </span>
                  {role.isDefault && <span className="text-[10px] text-gray-500">DEFAULT</span>}
                </motion.button>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMoveRole(role.id, -1)}
                    disabled={isSaving || index === 0}
                    aria-label={`Move ${role.name} up`}
                    className="rounded p-1 text-gray-500 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronUpIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveRole(role.id, 1)}
                    disabled={isSaving || index === roles.length - 1}
                    aria-label={`Move ${role.name} down`}
                    className="rounded p-1 text-gray-500 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {roles.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">No roles yet</div>
        )}
      </div>

      {/* Role Editor */}
      <div className="flex-1 overflow-y-auto p-6">
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
            isSaving={isSaving}
            nameError={roleNameError}
            onUpdate={handleUpdateRole}
            onDelete={() => handleDeleteRole(selectedRole.id)}
            onSave={handleSaveRole}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <ShieldCheckIcon className="mx-auto mb-4 h-16 w-16 text-gray-700" />
              <p className="text-gray-500">Select a role to edit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoleManager;
