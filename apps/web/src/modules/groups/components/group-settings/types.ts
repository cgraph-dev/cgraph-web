import type { Group } from '@/modules/groups/store';

export interface GroupSettingsProps {
  groupId: string;
  onClose?: () => void;
}

export interface OverviewFormData {
  name: string;
  description: string;
  isPublic: boolean;
}

export interface OverviewTabProps {
  group: Group;
  formData: OverviewFormData;
  onChange: (data: OverviewFormData) => void;
  isAdmin: boolean;
}

export interface MembersTabProps {
  groupId: string;
}

export interface InvitesTabProps {
  groupId: string;
  groupName: string;
}

export interface ChannelsTabProps {
  groupId: string;
}

export interface DangerTabProps {
  isOwner: boolean;
  errorMessage?: string | null;
  onLeave: () => void;
  onDelete: () => void;
}

export interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export interface SettingsTab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

export interface GroupSettingsPermissions {
  canManageGroup: boolean;
  canManageRoles: boolean;
  canManageChannels: boolean;
  canManageMembers: boolean;
  canManageInvites: boolean;
  canViewAuditLog: boolean;
  canManageAutomod: boolean;
  isOwner: boolean;
}

export interface AuditLogTabProps {
  groupId: string;
}

export type TabId =
  | 'overview'
  | 'roles'
  | 'members'
  | 'invites'
  | 'channels'
  | 'notifications'
  | 'audit-log'
  | 'automod'
  | 'danger';
