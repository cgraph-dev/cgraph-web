/**
 * Forum Header - Re-export from modularized module
 *
 * @see ./forum-header for implementation
 */

export {
  ForumHeader,
  default,
  VoteButtons,
  ForumStats,
  ForumActions,
  ForumIcon,
  ForumHeaderCompact,
  ForumHeaderHero,
  formatNumber,
} from './forum-header/index';

export type {
  ForumHeaderProps,
  VoteButtonsProps,
  ForumStatsProps,
  ForumActionsProps,
  ForumIconProps,
  Forum,
} from './forum-header/index';
