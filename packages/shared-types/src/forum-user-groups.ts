export type UserGroupType = 'system' | 'custom' | 'joinable';

export type AutoRuleType = 'milestone' | 'time_based' | 'subscription' | 'custom';

export interface ForumGroupPermissions {
  can_view_forum: boolean;
  can_view_boards: boolean;
  can_view_threads: boolean;
  can_post_threads: boolean;
  can_post_replies: boolean;
  can_edit_own_posts: boolean;
  can_delete_own_posts: boolean;
  can_upload_attachments: boolean;
  can_use_bbcode: boolean;
  can_use_smilies: boolean;
  can_create_polls: boolean;
  can_vote_polls: boolean;
  can_rate_threads: boolean;
  can_use_reputation: boolean;
  can_send_pm: boolean;
  can_moderate: boolean;
  can_edit_posts: boolean;
  can_delete_posts: boolean;
  can_lock_threads: boolean;
  can_move_threads: boolean;
  can_split_threads: boolean;
  can_merge_threads: boolean;
  can_approve_posts: boolean;
  can_warn_users: boolean;
  can_ban_users: boolean;
  can_view_logs: boolean;
  can_manage_reports: boolean;
  can_manage_boards: boolean;
  can_manage_groups: boolean;
  can_manage_settings: boolean;
  can_manage_plugins: boolean;
  can_manage_permissions: boolean;
  max_pm_recipients: number;
  pm_quota: number;
  attachment_quota: number;
  max_signature_length: number;
}

export interface ForumUserGroup {
  id: string;
  forum_id: string;
  name: string;
  description: string | null;
  color: string | null;
  type: UserGroupType;
  position: number;
  is_default: boolean;
  is_hidden: boolean;
  is_staff: boolean;
  is_super_mod: boolean;
  can_moderate: boolean;
  can_admin: boolean;
  permissions: ForumGroupPermissions;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface SecondaryGroupMembership {
  id: string;
  user_id: string;
  group_id: string;
  group_name: string;
  group_color: string | null;
  assigned_by: string | null;
  assigned_at: string;
  expires_at: string | null;
  is_active: boolean;
  reason: string | null;
}

export interface GroupAutoRule {
  id: string;
  forum_id: string;
  name: string;
  description: string | null;
  rule_type: AutoRuleType;
  threshold: number;
  target_group_id: string;
  target_group_name: string;
  is_active: boolean;
  last_evaluated_at: string | null;
  users_assigned: number;
  criteria: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
