/**
 * Member List Module
 *
 * Group member listing with role-based sections, online status indicators,
 * search filtering, and context menu actions.
 *
 */

// Main component
export { MemberList, default } from './member-list';

// Sub-components
export { MemberItem } from './member-item';

// Types
export type {
  MemberListProps,
  StatusType,
  MemberItemProps,
  MemberContextMenuProps,
  RoleSectionProps,
} from './types';

// Constants
export { statusColors, statusLabels } from './constants';
