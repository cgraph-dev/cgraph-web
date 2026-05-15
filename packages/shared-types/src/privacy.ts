/**
 * Runtime-neutral selective privacy contract.
 *
 * Mirrors Telegram-style visibility rules: a default audience plus explicit
 * always-allow and never-allow exceptions. Backend JSON uses snake_case keys;
 * web/native state uses camelCase keys.
 */

export const SELECTIVE_PRIVACY_MODES = ['everyone', 'contacts', 'nobody'] as const;

export type SelectivePrivacyMode = (typeof SELECTIVE_PRIVACY_MODES)[number];

export const SELECTIVE_PRIVACY_TARGETS = ['message_requests', 'phone_number', 'calls'] as const;

export type SelectivePrivacyTarget = (typeof SELECTIVE_PRIVACY_TARGETS)[number];

export interface SelectivePrivacyRule {
  readonly mode: SelectivePrivacyMode;
  readonly alwaysAllowUserIds: readonly string[];
  readonly neverAllowUserIds: readonly string[];
}

export interface SelectivePrivacyRuleApi {
  readonly mode: SelectivePrivacyMode;
  readonly always_allow_user_ids: readonly string[];
  readonly never_allow_user_ids: readonly string[];
}

export interface SelectivePrivacySettings {
  readonly messageRequests: SelectivePrivacyRule;
  readonly phoneNumber: SelectivePrivacyRule;
  readonly calls: SelectivePrivacyRule;
}

export interface SelectivePrivacySettingsApi {
  readonly message_requests: SelectivePrivacyRuleApi;
  readonly phone_number: SelectivePrivacyRuleApi;
  readonly calls: SelectivePrivacyRuleApi;
}

export const DEFAULT_SELECTIVE_PRIVACY_RULE: SelectivePrivacyRule = {
  mode: 'everyone',
  alwaysAllowUserIds: [],
  neverAllowUserIds: [],
};

export const DEFAULT_SELECTIVE_PRIVACY_SETTINGS: SelectivePrivacySettings = {
  messageRequests: DEFAULT_SELECTIVE_PRIVACY_RULE,
  phoneNumber: {
    ...DEFAULT_SELECTIVE_PRIVACY_RULE,
    mode: 'nobody',
  },
  calls: DEFAULT_SELECTIVE_PRIVACY_RULE,
};

/** Checks whether an unknown value is a supported selective privacy mode. */
export function isSelectivePrivacyMode(value: unknown): value is SelectivePrivacyMode {
  return value === 'everyone' || value === 'contacts' || value === 'nobody';
}

/** Normalizes one selective privacy rule from API or client state. */
export function normalizeSelectivePrivacyRule(
  value: unknown,
  fallback: SelectivePrivacyRule = DEFAULT_SELECTIVE_PRIVACY_RULE
): SelectivePrivacyRule {
  if (!isRecord(value)) return cloneRule(fallback);

  const mode = isSelectivePrivacyMode(value.mode) ? value.mode : fallback.mode;

  return {
    mode,
    alwaysAllowUserIds: normalizeUserIdList(
      value.alwaysAllowUserIds ?? value.always_allow_user_ids,
      fallback.alwaysAllowUserIds
    ),
    neverAllowUserIds: normalizeUserIdList(
      value.neverAllowUserIds ?? value.never_allow_user_ids,
      fallback.neverAllowUserIds
    ),
  };
}

/** Normalizes the full selective privacy settings object. */
export function normalizeSelectivePrivacySettings(
  value: unknown,
  fallback: SelectivePrivacySettings = DEFAULT_SELECTIVE_PRIVACY_SETTINGS
): SelectivePrivacySettings {
  if (!isRecord(value)) return cloneSettings(fallback);

  return {
    messageRequests: normalizeSelectivePrivacyRule(
      value.messageRequests ?? value.message_requests,
      fallback.messageRequests
    ),
    phoneNumber: normalizeSelectivePrivacyRule(
      value.phoneNumber ?? value.phone_number,
      fallback.phoneNumber
    ),
    calls: normalizeSelectivePrivacyRule(value.calls, fallback.calls),
  };
}

/** Converts unknown backend JSON into the shared camelCase settings shape. */
export function selectivePrivacySettingsFromApi(
  value: unknown,
  fallback: SelectivePrivacySettings = DEFAULT_SELECTIVE_PRIVACY_SETTINGS
): SelectivePrivacySettings {
  return normalizeSelectivePrivacySettings(value, fallback);
}

/** Converts shared camelCase settings into backend snake_case JSON. */
export function selectivePrivacySettingsToApi(
  settings: SelectivePrivacySettings
): SelectivePrivacySettingsApi {
  return {
    message_requests: selectivePrivacyRuleToApi(settings.messageRequests),
    phone_number: selectivePrivacyRuleToApi(settings.phoneNumber),
    calls: selectivePrivacyRuleToApi(settings.calls),
  };
}

/** Converts a legacy boolean privacy flag into a selective rule. */
export function boolToSelectivePrivacyRule(
  enabled: boolean | undefined,
  enabledMode: SelectivePrivacyMode = 'everyone',
  disabledMode: SelectivePrivacyMode = 'nobody'
): SelectivePrivacyRule {
  return {
    ...DEFAULT_SELECTIVE_PRIVACY_RULE,
    mode: enabled === false ? disabledMode : enabledMode,
  };
}

/** Returns whether a selective rule allows anyone by default or exception. */
export function selectivePrivacyRuleEnabled(rule: SelectivePrivacyRule): boolean {
  return rule.mode !== 'nobody' || rule.alwaysAllowUserIds.length > 0;
}

/** Converts one selective privacy rule into backend snake_case JSON. */
function selectivePrivacyRuleToApi(rule: SelectivePrivacyRule): SelectivePrivacyRuleApi {
  const normalized = normalizeSelectivePrivacyRule(rule);

  return {
    mode: normalized.mode,
    always_allow_user_ids: normalized.alwaysAllowUserIds,
    never_allow_user_ids: normalized.neverAllowUserIds,
  };
}

/** Deep-clones a selective privacy settings object. */
function cloneSettings(settings: SelectivePrivacySettings): SelectivePrivacySettings {
  return {
    messageRequests: cloneRule(settings.messageRequests),
    phoneNumber: cloneRule(settings.phoneNumber),
    calls: cloneRule(settings.calls),
  };
}

/** Deep-clones a selective privacy rule. */
function cloneRule(rule: SelectivePrivacyRule): SelectivePrivacyRule {
  return {
    mode: rule.mode,
    alwaysAllowUserIds: [...rule.alwaysAllowUserIds],
    neverAllowUserIds: [...rule.neverAllowUserIds],
  };
}

/** Normalizes and deduplicates user ID exception lists. */
function normalizeUserIdList(value: unknown, fallback: readonly string[]): readonly string[] {
  if (!Array.isArray(value)) return [...fallback];

  return Array.from(
    new Set(value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0))
  );
}

/** Checks whether a value is a plain record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
