/**
 * Runtime-neutral user identity projection shared by app clients.
 *
 * This is the display identity contract. It intentionally carries IDs and
 * lightweight presentation fields, not route owners or browser-specific UI
 * state.
 */

export type IdentityStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'invisible' | 'away' | 'busy';

export const IDENTITY_STATUSES: readonly IdentityStatus[] = [
  'online',
  'idle',
  'dnd',
  'offline',
  'invisible',
  'away',
  'busy',
];

export interface IdentityCosmetics {
  readonly avatarBorderId: string | null;
  readonly equippedTitleId: string | null;
  readonly equippedBadgeIds: readonly string[];
  readonly equippedNameplateId: string | null;
  readonly profileTheme: string | null;
  readonly chatTheme: string | null;
  readonly displayNameFont: string | null;
  readonly displayNameEffect: string | null;
  readonly displayNameColor: string | null;
  readonly displayNameSecondaryColor: string | null;
}

export interface CanonicalUserIdentity {
  readonly id: string;
  readonly username: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly bannerUrl: string | null;
  readonly status: IdentityStatus;
  readonly statusMessage: string | null;
  readonly cosmetics: IdentityCosmetics;
}

export interface CanonicalIdentityFields {
  readonly id: string;
  readonly username: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly bannerUrl: string | null;
  readonly status: IdentityStatus;
  readonly statusMessage: string | null;
  readonly avatarBorderId: string | null;
  readonly equippedTitleId: string | null;
  readonly equippedBadgeIds: readonly string[];
  readonly equippedNameplateId: string | null;
  readonly profileTheme: string | null;
  readonly chatTheme: string | null;
  readonly displayNameFont: string | null;
  readonly displayNameEffect: string | null;
  readonly displayNameColor: string | null;
  readonly displayNameSecondaryColor: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function firstString(
  records: readonly Record<string, unknown>[],
  keys: readonly string[]
): string | null {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string') return value;
    }
  }

  return null;
}

function firstStringArray(
  records: readonly Record<string, unknown>[],
  keys: readonly string[]
): readonly string[] {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
        return value;
      }
    }
  }

  return [];
}

function identityRecords(raw: Record<string, unknown>): readonly Record<string, unknown>[] {
  const customization = isRecord(raw.customization) ? raw.customization : null;
  return customization ? [raw, customization] : [raw];
}

/**
 * Checks whether a raw presence string is a supported identity status.
 */
export function isIdentityStatus(value: string | null): value is IdentityStatus {
  return IDENTITY_STATUSES.some((status) => status === value);
}

/**
 * Converts unknown or missing presence values into the shared offline fallback.
 */
export function normalizeIdentityStatus(value: string | null): IdentityStatus {
  return isIdentityStatus(value) ? value : 'offline';
}

/**
 * Builds the shared user identity projection from backend, socket, or cache payloads.
 */
export function canonicalIdentityFromApi(raw: Record<string, unknown>): CanonicalUserIdentity {
  const records = identityRecords(raw);
  const id =
    firstString(records, ['id', 'userId', 'user_id', 'from_user_id', 'request_user_id']) ?? '';
  const username = firstString(records, ['username', 'from_username']) ?? '';

  return {
    id,
    username,
    displayName: firstString(records, ['displayName', 'display_name', 'from_display_name']),
    avatarUrl: firstString(records, ['avatarUrl', 'avatar_url', 'from_avatar_url']),
    bannerUrl: firstString(records, ['bannerUrl', 'banner_url']),
    status: normalizeIdentityStatus(firstString(records, ['status', 'presence'])),
    statusMessage: firstString(records, ['statusMessage', 'status_message', 'custom_status']),
    cosmetics: {
      avatarBorderId: firstString(records, [
        'avatarBorderId',
        'avatar_border_id',
        'from_avatar_border_id',
      ]),
      equippedTitleId: firstString(records, [
        'equippedTitleId',
        'equipped_title_id',
        'titleId',
        'title_id',
      ]),
      equippedBadgeIds: firstStringArray(records, [
        'equippedBadgeIds',
        'equipped_badge_ids',
        'equippedBadges',
        'equipped_badges',
        'badges',
      ]),
      equippedNameplateId: firstString(records, [
        'equippedNameplateId',
        'equipped_nameplate_id',
        'equippedNameplate',
        'equipped_nameplate',
        'nameplateId',
        'nameplate_id',
        'preset_name',
      ]),
      profileTheme: firstString(records, ['profileTheme', 'profile_theme']),
      chatTheme: firstString(records, ['chatTheme', 'chat_theme']),
      displayNameFont: firstString(records, [
        'displayNameFont',
        'display_name_font',
        'nameFont',
        'name_font',
        'font_family',
      ]),
      displayNameEffect: firstString(records, [
        'displayNameEffect',
        'display_name_effect',
        'nameEffect',
        'name_effect',
        'entrance_animation',
      ]),
      displayNameColor: firstString(records, [
        'displayNameColor',
        'display_name_color',
        'nameColor',
        'name_color',
        'text_color',
      ]),
      displayNameSecondaryColor: firstString(records, [
        'displayNameSecondaryColor',
        'display_name_secondary_color',
        'nameSecondaryColor',
        'name_secondary_color',
      ]),
    },
  };
}

/**
 * Flattens the canonical projection into the camelCase fields used by existing stores.
 */
export function identityFieldsFromApi(raw: Record<string, unknown>): CanonicalIdentityFields {
  const identity = canonicalIdentityFromApi(raw);

  return {
    id: identity.id,
    username: identity.username,
    displayName: identity.displayName,
    avatarUrl: identity.avatarUrl,
    bannerUrl: identity.bannerUrl,
    status: identity.status,
    statusMessage: identity.statusMessage,
    avatarBorderId: identity.cosmetics.avatarBorderId,
    equippedTitleId: identity.cosmetics.equippedTitleId,
    equippedBadgeIds: identity.cosmetics.equippedBadgeIds,
    equippedNameplateId: identity.cosmetics.equippedNameplateId,
    profileTheme: identity.cosmetics.profileTheme,
    chatTheme: identity.cosmetics.chatTheme,
    displayNameFont: identity.cosmetics.displayNameFont,
    displayNameEffect: identity.cosmetics.displayNameEffect,
    displayNameColor: identity.cosmetics.displayNameColor,
    displayNameSecondaryColor: identity.cosmetics.displayNameSecondaryColor,
  };
}
