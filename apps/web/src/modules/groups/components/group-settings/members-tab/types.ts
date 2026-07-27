export interface GroupMember {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  roles: GroupRole[];
  joinedAt: string;
  isMuted: boolean;
  mutedUntil: string | null;
}

export interface GroupRole {
  id: string;
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
}

export type MemberAction = 'none' | 'kick' | 'ban' | 'mute';

export interface MemberCapabilities {
  canManageRoles: boolean;
  canKick: boolean;
  canBan: boolean;
  canMute: boolean;
}
