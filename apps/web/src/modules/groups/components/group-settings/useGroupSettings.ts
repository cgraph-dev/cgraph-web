import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupStore } from '@/modules/groups/store';
import { useAuthStore } from '@/modules/auth/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';
import type { TabId, OverviewFormData } from './types';
import { PERMISSIONS } from '../role-manager/constants';
import { getGroupPermissionError } from '../../permission-errors';

const logger = createLogger('GroupSettings');
const ADMINISTRATOR = PERMISSIONS.ADMINISTRATOR?.value ?? 0;
const MANAGE_GROUP = PERMISSIONS.MANAGE_GROUP?.value ?? 0;
const MANAGE_ROLES = PERMISSIONS.MANAGE_ROLES?.value ?? 0;
const MANAGE_CHANNELS = PERMISSIONS.MANAGE_CHANNELS?.value ?? 0;
const KICK_MEMBERS = PERMISSIONS.KICK_MEMBERS?.value ?? 0;
const BAN_MEMBERS = PERMISSIONS.BAN_MEMBERS?.value ?? 0;
const VIEW_AUDIT_LOG = PERMISSIONS.VIEW_AUDIT_LOG?.value ?? 0;

/**
 * Hook for managing group settings.
 *
 * @param groupId - The group id.
 */
export function useGroupSettings(groupId: string) {
  const navigate = useNavigate();
  const { groups, leaveGroup, updateGroup, deleteGroup } = useGroupStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dangerError, setDangerError] = useState<string | null>(null);

  const activeGroup = groups.find((g) => g.id === groupId);
  const isOwner = activeGroup?.ownerId === user?.id;
  const permissionMask =
    activeGroup?.myMember?.roles.reduce((mask, role) => mask | role.permissions, 0) ?? 0;
  const isAdministrator = Boolean(permissionMask & ADMINISTRATOR);
  const hasPermission = (permission: number) =>
    Boolean(isOwner || isAdministrator || permissionMask & permission);
  const permissions = {
    isOwner,
    canManageGroup: hasPermission(MANAGE_GROUP),
    canManageRoles: hasPermission(MANAGE_ROLES),
    canManageChannels: hasPermission(MANAGE_CHANNELS),
    canManageMembers:
      hasPermission(KICK_MEMBERS) || hasPermission(BAN_MEMBERS) || hasPermission(MANAGE_ROLES),
    canManageInvites: hasPermission(MANAGE_GROUP),
    canViewAuditLog: hasPermission(VIEW_AUDIT_LOG),
    canManageAutomod: hasPermission(MANAGE_GROUP),
  };

  const [formData, setFormData] = useState<OverviewFormData>({
    name: activeGroup?.name || '',
    description: activeGroup?.description || '',
    isPublic: activeGroup?.isPublic || false,
  });

  const handleFormChange = (data: OverviewFormData) => {
    setFormData(data);
    setHasChanges(true);
    setSaveError(null);
    setDangerError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateGroup(groupId, {
        name: formData.name,
        description: formData.description || null,
        isPublic: formData.isPublic,
      });
      setHasChanges(false);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to save:', error);
      setSaveError(
        getGroupPermissionError(
          error,
          'You do not have permission to update group settings.',
          'Could not save group settings. Please try again.'
        )
      );
      HapticFeedback.error();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: activeGroup?.name || '',
      description: activeGroup?.description || '',
      isPublic: activeGroup?.isPublic || false,
    });
    setHasChanges(false);
    setSaveError(null);
  };

  const handleLeave = async () => {
    setDangerError(null);
    try {
      await leaveGroup(groupId);
      HapticFeedback.warning();
      navigate('/groups');
    } catch (error) {
      logger.error('Failed to leave group:', error);
      setShowLeaveConfirm(false);
      setDangerError(
        getGroupPermissionError(
          error,
          'You do not have permission to leave this group.',
          'Could not leave group. Please try again.'
        )
      );
      HapticFeedback.error();
    }
  };

  const handleDelete = async () => {
    setDangerError(null);
    try {
      await deleteGroup(groupId);
      HapticFeedback.warning();
      navigate('/groups');
    } catch (error) {
      logger.error('Failed to delete group:', error);
      setShowDeleteConfirm(false);
      setDangerError(
        getGroupPermissionError(
          error,
          'You do not have permission to delete this group.',
          'Could not delete group. Please try again.'
        )
      );
      HapticFeedback.error();
    }
  };

  return {
    activeGroup,
    activeTab,
    setActiveTab,
    isOwner,
    permissions,
    formData,
    handleFormChange,
    hasChanges,
    isSaving,
    handleSave,
    saveError,
    handleReset,
    dangerError,
    showLeaveConfirm,
    setShowLeaveConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleLeave,
    handleDelete,
  };
}
