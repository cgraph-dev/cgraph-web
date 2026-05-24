import type { PermissionDef } from './types';

/**
 * Permission definitions with bitwise values
 */
export const PERMISSIONS: Record<string, PermissionDef> = {
  VIEW_CHANNELS: {
    value: 1 << 0,
    label: 'View Channels',
    description: 'See text, voice, and forum channels',
  },
  ADMINISTRATOR: {
    value: 0x80000000,
    label: 'Administrator',
    description: 'Full access to all settings',
    danger: true,
  },
  MANAGE_GROUP: {
    value: 1 << 16,
    label: 'Manage Group',
    description: 'Edit group settings and info',
  },
  MANAGE_ROLES: {
    value: 1 << 15,
    label: 'Manage Roles',
    description: 'Create and edit roles below this one',
  },
  MANAGE_CHANNELS: {
    value: 1 << 14,
    label: 'Manage Channels',
    description: 'Create, edit, and delete channels',
  },
  KICK_MEMBERS: {
    value: 1 << 17,
    label: 'Kick Members',
    description: 'Remove members from the group',
  },
  BAN_MEMBERS: { value: 1 << 18, label: 'Ban Members', description: 'Permanently ban members' },
  MANAGE_MESSAGES: {
    value: 1 << 7,
    label: 'Manage Messages',
    description: 'Delete and pin messages',
  },
  MANAGE_AUTOMOD: {
    value: 1 << 23,
    label: 'Manage AutoMod',
    description: 'Configure automatic moderation rules',
  },
  CREATE_INVITES: {
    value: 1 << 19,
    label: 'Create Invites',
    description: 'Create invite links for this group',
  },
  MENTION_EVERYONE: {
    value: 1 << 6,
    label: 'Mention Everyone',
    description: 'Use @everyone and @here',
  },
  CHANGE_NICKNAME: {
    value: 1 << 20,
    label: 'Change Nickname',
    description: 'Change your own group nickname',
  },
  MANAGE_NICKNAMES: {
    value: 1 << 21,
    label: 'Manage Nicknames',
    description: "Change other members' nicknames",
  },
  MANAGE_EMOJIS: {
    value: 1 << 22,
    label: 'Manage Emojis',
    description: 'Reserved for historical group emoji permissions',
  },
  SEND_MESSAGES: {
    value: 1 << 1,
    label: 'Send Messages',
    description: 'Send messages in text channels',
  },
  READ_MESSAGE_HISTORY: {
    value: 1 << 8,
    label: 'Read Message History',
    description: 'Read messages sent before joining or opening a channel',
  },
  EMBED_LINKS: { value: 1 << 3, label: 'Embed Links', description: 'Links will show previews' },
  ATTACH_FILES: { value: 1 << 2, label: 'Attach Files', description: 'Upload images and files' },
  ADD_REACTIONS: {
    value: 1 << 4,
    label: 'Add Reactions',
    description: 'Add reactions to messages',
  },
  USE_EXTERNAL_EMOJIS: {
    value: 1 << 5,
    label: 'Use External Emojis',
    description: 'Use emoji from other groups',
  },
  CONNECT: { value: 1 << 9, label: 'Connect', description: 'Join voice channels' },
  SPEAK: { value: 1 << 10, label: 'Speak', description: 'Speak in voice channels' },
  MUTE_MEMBERS: { value: 1 << 11, label: 'Mute Members', description: 'Mute others in voice' },
  DEAFEN_MEMBERS: {
    value: 1 << 12,
    label: 'Deafen Members',
    description: 'Deafen others in voice',
  },
  MOVE_MEMBERS: {
    value: 1 << 13,
    label: 'Move Members',
    description: 'Move members between voice channels',
  },
};

/**
 * Available role colors
 */
export const ROLE_COLORS = [
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
  '#14b8a6',
  '#e11d48',
  '#7c3aed',
  '#0ea5e9',
  '#22c55e',
  '#eab308',
];
