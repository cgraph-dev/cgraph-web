/**
 * Forum type entrypoint for cross-client forum features.
 */
export {
  CUSTOMIZATION_CATEGORIES,
  isCustomFieldTarget,
  isCustomFieldType,
  isCustomizationCategory,
  isForumThemePresetKey,
} from './forum-customization';
export type {
  AppearanceOptions,
  BadgeConfig,
  CustomCssAndAdvancedOptions,
  CustomField,
  CustomFieldTarget,
  CustomFieldType,
  CustomFieldsOptions,
  CustomizationCategory,
  ForumCustomizationOptions,
  ForumThemePreset,
  ForumThemePresetKey,
  HeaderAndBrandingOptions,
  LayoutOptions,
  PostAndThreadDisplayOptions,
  RankThreshold,
  ReputationAndRanksOptions,
  SidebarWidgetOptions,
  WidgetConfig,
} from './forum-customization';
export type {
  BundlePurchase,
  ContentBundle,
  CreatorShelfItem,
  ForumPromotionSettings,
  ForumSubscription,
  ForumSubscriptionTier,
  PromotionType,
  SubscriberPerks,
  ThreadPromotion,
} from './forum-economy';
export {
  DEFAULT_FORUM_XP_CONFIG,
  DEFAULT_RANKS,
  LEADERBOARD_PERIODS,
  LEADERBOARD_PERIOD_LABELS,
} from './forum-leaderboard';
export type {
  ForumRank,
  ForumXpConfig,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardRequest,
  LeaderboardResponse,
  MyRankResponse,
  RankProgress,
  RanksResponse,
  ScoreChange,
  ScoreChangeDirection,
} from './forum-leaderboard';
export type {
  AutomodAction,
  CapsFilterConfig,
  DailyModActions,
  ForumAutomodRules,
  ForumModAction,
  ForumWarning,
  IssueWarningPayload,
  LinkFilterConfig,
  ModActionPayload,
  ModQueueItem,
  ModQueueReporter,
  ModQueueStatus,
  ModQueueUser,
  ModResolution,
  ModStats,
  SpamFilterConfig,
  UpdateAutomodPayload,
  WarningThreshold,
  WordFilterConfig,
} from './forum-moderation';
export type {
  BoardPermission,
  EffectivePermission,
  ForumPermission,
  PermissionLevel,
  PermissionTemplate,
} from './forum-permissions';
export type {
  AutoRuleType,
  ForumGroupPermissions,
  ForumUserGroup,
  GroupAutoRule,
  SecondaryGroupMembership,
  UserGroupType,
} from './forum-user-groups';
