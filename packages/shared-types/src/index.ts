// @cgraph/shared-types — barrel exporting only actively used types

// achievements
export type { Achievement, AchievementCategory, AchievementRarity } from './achievements';

// batch-operations
export type { BatchOperation, BatchCopyResult } from './batch-operations';
export { MAX_BATCH_COPY, MAX_BATCH_DELETE, MAX_BATCH_FORWARD } from './batch-operations';

// body-range (rich text / Signal formatting)
export type { BodyRange, BodyRangeStyle, DisplayNode, RangeNode } from './body-range';
export {
  SPOILER_REPLACEMENT,
  BODY_RANGE_STYLE_VALUES,
  STYLE_TO_VALUE,
  VALID_STYLES,
  isValidBodyRangeStyle,
  isFormattingRange,
  isMentionRange,
} from './body-range';

// call-quality
export type { CallQualityRating, CallQualityIssue, CallQualityReportPayload } from './call-quality';
export {
  CALL_QUALITY_ISSUES,
  CALL_QUALITY_ISSUE_LABELS,
  MIN_CALL_DURATION_FOR_FEEDBACK,
  FEEDBACK_AUTO_DISMISS_MS,
} from './call-quality';

// chat-poll
export type { ChatPoll, ChatPollOption, CreatePollParams, VotePollParams } from './chat-poll';

// contact-card
export type { ContactCardData } from './contact-card';

// contact (discovery)
export type {
  RegisteredContact,
  ContactSyncStatus,
  DiscoveredContact,
  DiscoveryResult,
} from './contact';

// cosmetics
export type {
  AnimationType,
  CosmeticBundle,
  CosmeticItem,
  CosmeticSku,
  CosmeticType,
  Entitlement,
  EntitlementSource,
  EntitlementType,
  EquippedCosmetics,
  InventoryItem,
  MarketplaceFilters,
  MarketplaceListing,
  UnlockEntry,
  UnlockType,
  UpcomingUnlock,
  UserCosmeticInventory,
  UserProgression,
} from './cosmetics';
export { hasCosmetics } from './cosmetics';

// forum-customization
export type {
  BadgeConfig,
  CustomField,
  CustomFieldTarget,
  CustomFieldType,
  CustomizationCategory,
  ForumCustomizationOptions,
  RankThreshold,
} from './forum-customization';

// forum-leaderboard
export type { ForumRank, LeaderboardEntry } from './forum-leaderboard';

// identity
export type { CanonicalUserIdentity, IdentityCosmetics, IdentityStatus } from './identity';

// locale
export type { SupportedLocale } from './locale';
export { SUPPORTED_LOCALES, isRtlLocale } from './locale';

// location (live location sharing)
export type {
  LiveLocationUpdate,
  LocationShareConfig,
  StartLocationShareParams,
  ProximityAlert,
  ActiveLocationShare,
} from './location';
export {
  LOCATION_SHARE_DURATIONS,
  DURATION_LABELS,
  MIN_PROXIMITY_THRESHOLD,
  MAX_PROXIMITY_THRESHOLD,
} from './location';

// media
export type {
  MediaVariant,
  MediaProcessingStatus,
  ConnectionQuality,
  CompressOptions,
  CompressedImage,
  MessageAttachmentContentType,
  MessageAttachmentMetadata,
  MessageAttachmentSendPayload,
  MediaVariantReadyEvent,
  MediaCompleteEvent,
  MediaFailedEvent,
  MediaUploadState,
  UploadedMessageAttachment,
} from './media';
export {
  MESSAGE_ATTACHMENT_CONTENT_TYPES,
  buildMessageAttachmentMetadata,
  buildMessageAttachmentSendPayload,
  messageContentTypeForMime,
} from './media';

// media-album
export type { MediaAlbumItem, AlbumLayout } from './media-album';
export { computeAlbumLayout } from './media-album';

// message-request
export type {
  MessageRequestStatus,
  MessageRequestItem,
  MessageRequestInfo,
} from './message-request';

// nodes
export { MIN_TIP, MIN_WITHDRAWAL, NODES_EXCHANGE_RATE_EUR, PLATFORM_CUT_PERCENT } from './nodes';
export type { NodeBundle, NodeTransaction, NodeTransactionType, NodeWallet } from './nodes';

// notification-profiles
export type {
  DayOfWeek,
  NotificationProfileSchedule,
  NotificationProfile,
  NotificationProfileAllowedMember,
} from './notification-profiles';
export {
  DAY_LABELS,
  DAY_LETTERS,
  ALL_DAYS,
  WEEKDAYS,
  QUICK_ENABLE_DURATIONS,
  MAX_PROFILES,
  hhmmToDisplayString,
  timeInputToHhmm,
  hhmmToTimeInput,
} from './notification-profiles';

// notifications
export type {
  NotificationMode,
  NotificationPreference,
  NotificationType,
  Notification,
} from './notifications';

// privacy
export type {
  SelectivePrivacyMode,
  SelectivePrivacyRule,
  SelectivePrivacyRuleApi,
  SelectivePrivacySettings,
  SelectivePrivacySettingsApi,
  SelectivePrivacyTarget,
} from './privacy';
export {
  DEFAULT_SELECTIVE_PRIVACY_RULE,
  DEFAULT_SELECTIVE_PRIVACY_SETTINGS,
  SELECTIVE_PRIVACY_MODES,
  SELECTIVE_PRIVACY_TARGETS,
  boolToSelectivePrivacyRule,
  isSelectivePrivacyMode,
  normalizeSelectivePrivacyRule,
  normalizeSelectivePrivacySettings,
  selectivePrivacyRuleEnabled,
  selectivePrivacySettingsFromApi,
  selectivePrivacySettingsToApi,
} from './privacy';

// settings
export type {
  AppearanceSettings,
  AutoDownloadPolicy,
  CallsSettings,
  DateFormat,
  EmojiSkinTone,
  FontSize,
  GroupInvitePermission,
  KeyboardSettings,
  LocaleSettings,
  MediaSettings,
  MessageDensity,
  NotificationSettings,
  PrivacySettings,
  ProfileVisibility,
  StickersEmojiSettings,
  Theme,
  TimeFormat,
  UserSettings,
  VideoResolution,
} from './settings';
export {
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_CALLS_SETTINGS,
  DEFAULT_KEYBOARD_SETTINGS,
  DEFAULT_LOCALE_SETTINGS,
  DEFAULT_MEDIA_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_SETTINGS,
  DEFAULT_STICKERS_EMOJI_SETTINGS,
} from './settings';

// rarity
export { RARITY_HEX_COLORS, RARITY_LABELS, RARITY_TIERS } from './rarity';
export type { RarityTier } from './rarity';

// auth
export type { WalletConnectorType } from './auth';

// transcription
export type {
  TranscriptionStatus,
  TranscriptionCompleteEvent,
  TranscriptionFailedEvent,
  TranscriptionProcessingEvent,
} from './transcription';

// vanish-timer
export type { VanishTimerDuration, VanishTimerPreset } from './vanish-timer';
export {
  VANISH_TIMER_PRESETS,
  VANISH_TIMER_VALUES,
  getVanishTimerLabel,
  getVanishTimerShortLabel,
} from './vanish-timer';

// view-once
export type { ViewOnceState, ViewOnceFields } from './view-once';
export { deriveViewOnceState } from './view-once';

// models — core domain types used by mobile feature modules
export type {
  Message,
  Conversation,
  ConversationParticipant,
  Group,
  Channel,
  Role,
  Member,
  ForumCategory,
  ForumBoard,
  ForumPost,
  ThreadPrefix,
} from './models';

// pagination
export type { PageInfo, PaginatedResponse } from './pagination';
