/**
 * App Layout constants — primary navigation matching mobile tab structure.
 *
 * Sections: Chats, Spaces, Groups, Discover, Forums, Settings
 * Social + Explore removed as standalone items — content merged into Chats/Groups/Forums.
 * Creator accessible from Settings hub.
 *
 * @see reference/Signal/Signal-Android/.../MainNavigation.kt
 * @see reference/Telegram/Telegram-iOS/.../TabBarComponent/
 */
import {
  ChatBubbleLeftRightIcon,
  FolderIcon,
  UserGroupIcon,
  NewspaperIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  FolderIcon as FolderIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
} from '@heroicons/react/24/solid';

export const navItems = [
  {
    path: '/messages',
    label: 'Chats',
    icon: ChatBubbleLeftRightIcon,
    activeIcon: ChatBubbleLeftRightIconSolid,
  },
  {
    path: '/spaces',
    label: 'Spaces',
    icon: FolderIcon,
    activeIcon: FolderIconSolid,
  },
  {
    path: '/groups',
    label: 'Groups',
    icon: UserGroupIcon,
    activeIcon: UserGroupIconSolid,
  },
  {
    path: '/explore',
    label: 'Discover',
    icon: GlobeAltIcon,
    activeIcon: GlobeAltIconSolid,
  },
  {
    path: '/forums',
    label: 'Forums',
    icon: NewspaperIcon,
    activeIcon: NewspaperIconSolid,
  },
  {
    path: '/me',
    label: 'Settings',
    icon: Cog6ToothIcon,
    activeIcon: Cog6ToothIconSolid,
  },
];

export type NavItem = (typeof navItems)[number];
