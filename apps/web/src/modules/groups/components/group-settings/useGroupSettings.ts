import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupStore } from '@/modules/groups/store';
import { useAuthStore } from '@/modules/auth/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';
import type { TabId, OverviewFormData } from './types';
import { PERMISSIONS } from '../role-manager/constants';
import { getGroupPermissionError } from '../../permission-errors';
import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  GROUP_NAME_MIN_LENGTH,
} from './constants';
import type { Group } from '@/modules/groups/store';

const logger = createLogger('GroupSettings');
const ADMINISTRATOR = PERMISSIONS.ADMINISTRATOR?.value ?? 0;
const MANAGE_GROUP = PERMISSIONS.MANAGE_GROUP?.value ?? 0;
const MANAGE_ROLES = PERMISSIONS.MANAGE_ROLES?.value ?? 0;
const MANAGE_CHANNELS = PERMISSIONS.MANAGE_CHANNELS?.value ?? 0;
const KICK_MEMBERS = PERMISSIONS.KICK_MEMBERS?.value ?? 0;
const BAN_MEMBERS = PERMISSIONS.BAN_MEMBERS?.value ?? 0;
const MUTE_MEMBERS = PERMISSIONS.MUTE_MEMBERS?.value ?? 0;
const VIEW_AUDIT_LOG = PERMISSIONS.VIEW_AUDIT_LOG?.value ?? 0;

function getOverviewFormData(group: Group | undefined): OverviewFormData {
  return {
    name: group?.name ?? '',
    description: group?.description ?? '',
    isPublic: group?.isPublic ?? false,
  };
}

function isSameOverviewForm(left: OverviewFormData, right: OverviewFormData) {
  return (
    left.name === right.name &&
    left.description === right.description &&
    left.isPublic === right.isPublic
  );
}

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
  const canManageRoles = hasPermission(MANAGE_ROLES);
  const canKickMembers = hasPermission(KICK_MEMBERS);
  const canBanMembers = hasPermission(BAN_MEMBERS);
  const canMuteMembers = hasPermission(MUTE_MEMBERS);
  const permissions = {
    isOwner,
    canManageGroup: hasPermission(MANAGE_GROUP),
    canManageRoles,
    canManageChannels: hasPermission(MANAGE_CHANNELS),
    canManageMembers: canKickMembers || canBanMembers || canMuteMembers || canManageRoles,
    canKickMembers,
    canBanMembers,
    canMuteMembers,
    canManageInvites: hasPermission(MANAGE_GROUP),
    canViewAuditLog: hasPermission(VIEW_AUDIT_LOG),
    canManageAutomod: hasPermission(MANAGE_GROUP),
  };

  const [formData, setFormData] = useState<OverviewFormData>(() =>
    getOverviewFormData(activeGroup)
  );
  const trimmedName = formData.name.trim();
  const canSave =
    trimmedName.length >= GROUP_NAME_MIN_LENGTH &&
    trimmedName.length <= GROUP_NAME_MAX_LENGTH &&
    formData.description.length <= GROUP_DESCRIPTION_MAX_LENGTH;

  useEffect(() => {
    if (!hasChanges && !isSaving) {
      setFormData(getOverviewFormData(activeGroup));
    }
  }, [activeGroup, hasChanges, isSaving]);

  const handleFormChange = (data: OverviewFormData) => {
    setFormData(data);
    setHasChanges(!isSameOverviewForm(data, getOverviewFormData(activeGroup)));
    setSaveError(null);
    setDangerError(null);
  };

  const handleSave = async () => {
    if (!canSave) {
      setSaveError(
        `Group name must be ${GROUP_NAME_MIN_LENGTH}-${GROUP_NAME_MAX_LENGTH} characters and the description cannot exceed ${GROUP_DESCRIPTION_MAX_LENGTH} characters.`
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await updateGroup(groupId, {
        name: trimmedName,
        description: formData.description.trim() || null,
        isPublic: formData.isPublic,
      });
      setFormData((current) => ({
        ...current,
        name: trimmedName,
        description: current.description.trim(),
      }));
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
    setFormData(getOverviewFormData(activeGroup));
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
    canSave,
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
