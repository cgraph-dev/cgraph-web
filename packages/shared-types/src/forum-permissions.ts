export type PermissionLevel = 'inherit' | 'allow' | 'deny';

export interface BoardPermission {
  id: string;
  board_id: string;
  group_id: string;
  group_name: string;
  group_color: string | null;
  can_view: PermissionLevel;
  can_view_threads: PermissionLevel;
  can_create_threads: PermissionLevel;
  can_reply: PermissionLevel;
  can_edit_own_posts: PermissionLevel;
  can_delete_own_posts: PermissionLevel;
  can_upload_attachments: PermissionLevel;
  can_create_polls: PermissionLevel;
  can_vote_polls: PermissionLevel;
  can_moderate: PermissionLevel;
  can_edit_posts: PermissionLevel;
  can_delete_posts: PermissionLevel;
  can_move_threads: PermissionLevel;
  can_lock_threads: PermissionLevel;
  can_pin_threads: PermissionLevel;
  created_at: string;
  updated_at: string;
}

export interface ForumPermission {
  id: string;
  forum_id: string;
  group_id: string;
  group_name: string;
  group_color: string | null;
  can_view: PermissionLevel;
  can_view_boards: PermissionLevel;
  can_create_threads: PermissionLevel;
  can_reply: PermissionLevel;
  can_manage_boards: PermissionLevel;
  can_manage_groups: PermissionLevel;
  can_manage_settings: PermissionLevel;
  can_moderate: PermissionLevel;
  can_manage_permissions: PermissionLevel;
  created_at: string;
  updated_at: string;
}

export interface PermissionTemplate {
  id: string;
  forum_id: string | null;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: Record<string, PermissionLevel>;
  created_at: string;
  updated_at: string;
}

export interface EffectivePermission {
  permission: string;
  level: PermissionLevel;
  source: 'board' | 'forum' | 'group' | 'default';
  inherited_from?: string;
}
