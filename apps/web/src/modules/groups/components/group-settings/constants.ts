import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  UsersIcon,
  LinkIcon,
  HashtagIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { SettingsTab } from './types';

export const GROUP_NAME_MIN_LENGTH = 2;
export const GROUP_NAME_MAX_LENGTH = 100;
export const GROUP_DESCRIPTION_MAX_LENGTH = 1000;

export const SETTINGS_TABS: SettingsTab[] = [
  { id: 'overview', label: 'Overview', icon: Cog6ToothIcon },
  { id: 'roles', label: 'Roles', icon: ShieldCheckIcon },
  { id: 'members', label: 'Members', icon: UsersIcon },
  { id: 'invites', label: 'Invites', icon: LinkIcon },
  { id: 'channels', label: 'Channels', icon: HashtagIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'audit-log', label: 'Audit Log', icon: ClipboardDocumentListIcon },
  { id: 'automod', label: 'AutoMod', icon: ShieldExclamationIcon },
  { id: 'danger', label: 'Danger Zone', icon: ExclamationTriangleIcon },
];
