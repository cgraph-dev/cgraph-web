import { useAuthStore, type User } from '@/modules/auth/store';
import {
  DEFAULT_STATE,
  THEME_COLORS,
  useCustomizationStore,
  type CustomizationServerPatch,
  type ThemePreset,
} from '@/modules/settings/store/customization/customizationStore';
import { isProfileThemeId } from '@/data/profileThemes';
import { resolveAvatarUrl } from '@/lib/media-url';
import { identityFieldsFromApi } from './canonicalIdentity';

export interface OwnIdentityPatch {
  avatarUrl?: string | null;
  avatarBorderId?: string | null;
  equippedTitleId?: string | null;
  equippedBadgeIds?: readonly string[];
  equippedNameplateId?: string | null;
  profileTheme?: string | null;
  chatTheme?: string | null;
  displayNameFont?: string | null;
  displayNameEffect?: string | null;
  displayNameColor?: string | null;
  displayNameSecondaryColor?: string | null;
  accentColor?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function recordsFor(raw: Record<string, unknown>): readonly Record<string, unknown>[] {
  const customization = isRecord(raw.customization) ? raw.customization : null;
  return customization ? [raw, customization] : [raw];
}

function hasKey(raw: Record<string, unknown>, keys: readonly string[]): boolean {
  return recordsFor(raw).some((record) => keys.some((key) => key in record));
}

function firstString(raw: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const record of recordsFor(raw)) {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string') return value;
    }
  }
  return null;
}

function setDefined<T extends object, K extends keyof T>(
  target: Partial<T>,
  key: K,
  value: T[K] | undefined
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

function currentBadgeIds(): readonly string[] {
  return useAuthStore.getState().user?.equippedBadgeIds ?? [];
}

function isThemePreset(value: string | null): value is ThemePreset {
  return typeof value === 'string' && value in THEME_COLORS;
}

/** Applies an own-user identity patch to auth and customization stores from one sync owner. */
export function applyOwnIdentityPatch(patch: OwnIdentityPatch): void {
  const userUpdates: Partial<User> = {};
  setDefined(userUpdates, 'avatarUrl', patch.avatarUrl);
  setDefined(userUpdates, 'avatarBorderId', patch.avatarBorderId);
  setDefined(userUpdates, 'equippedTitleId', patch.equippedTitleId);
  setDefined(userUpdates, 'equippedBadgeIds', patch.equippedBadgeIds);
  setDefined(userUpdates, 'equippedNameplateId', patch.equippedNameplateId);
  setDefined(userUpdates, 'profileTheme', patch.profileTheme);
  setDefined(userUpdates, 'chatTheme', patch.chatTheme);
  setDefined(userUpdates, 'displayNameFont', patch.displayNameFont);
  setDefined(userUpdates, 'displayNameEffect', patch.displayNameEffect);
  setDefined(userUpdates, 'displayNameColor', patch.displayNameColor);
  setDefined(userUpdates, 'displayNameSecondaryColor', patch.displayNameSecondaryColor);

  if (Object.keys(userUpdates).length > 0) {
    useAuthStore.getState().updateUser(userUpdates);
  }

  const customizationUpdates: CustomizationServerPatch = {};
  if (patch.avatarBorderId !== undefined)
    customizationUpdates.selectedBorderId = patch.avatarBorderId;
  if (patch.equippedTitleId !== undefined)
    customizationUpdates.equippedTitle = patch.equippedTitleId;
  if (patch.equippedBadgeIds !== undefined)
    customizationUpdates.equippedBadges = patch.equippedBadgeIds;
  if (patch.equippedNameplateId !== undefined) {
    customizationUpdates.equippedNameplate = patch.equippedNameplateId;
  }
  if (patch.profileTheme !== undefined) {
    customizationUpdates.selectedProfileThemeId = isProfileThemeId(patch.profileTheme)
      ? patch.profileTheme
      : null;
  }
  if (patch.chatTheme !== undefined) {
    customizationUpdates.chatTheme = isThemePreset(patch.chatTheme)
      ? patch.chatTheme
      : DEFAULT_STATE.chatTheme;
  }
  if (patch.displayNameFont !== undefined)
    customizationUpdates.displayNameFont = patch.displayNameFont ?? DEFAULT_STATE.displayNameFont;
  if (patch.displayNameEffect !== undefined) {
    customizationUpdates.displayNameEffect =
      patch.displayNameEffect ?? DEFAULT_STATE.displayNameEffect;
  }
  if (patch.displayNameColor !== undefined) {
    customizationUpdates.displayNameColor =
      patch.displayNameColor ?? DEFAULT_STATE.displayNameColor;
  }
  if (patch.displayNameSecondaryColor !== undefined) {
    customizationUpdates.displayNameSecondaryColor = patch.displayNameSecondaryColor;
  }
  if (patch.accentColor !== undefined && isThemePreset(patch.accentColor)) {
    customizationUpdates.avatarBorderColor = patch.accentColor;
  }

  if (Object.keys(customizationUpdates).length > 0) {
    useCustomizationStore.getState().applyServerSettings(customizationUpdates);
  }
}

/** Maps a profile_updated socket payload into the own-user identity sync owner. */
export function applyOwnProfileUpdate(raw: Record<string, unknown>): void {
  const identity = identityFieldsFromApi(raw);
  const patch: OwnIdentityPatch = {};

  if (hasKey(raw, ['avatar_hash', 'avatarUrl', 'avatar_url'])) {
    patch.avatarUrl = resolveAvatarUrl(firstString(raw, ['avatar_hash', 'avatarUrl', 'avatar_url']));
  }
  if (hasKey(raw, ['avatarBorderId', 'avatar_border_id', 'from_avatar_border_id'])) {
    patch.avatarBorderId = identity.avatarBorderId;
  }
  if (hasKey(raw, ['equippedTitleId', 'equipped_title_id', 'titleId', 'title_id'])) {
    patch.equippedTitleId = identity.equippedTitleId;
  }
  if (
    hasKey(raw, ['equippedBadgeIds', 'equipped_badge_ids', 'equippedBadges', 'equipped_badges'])
  ) {
    patch.equippedBadgeIds = identity.equippedBadgeIds;
  }
  if (
    hasKey(raw, ['equippedNameplateId', 'equipped_nameplate_id', 'nameplateId', 'nameplate_id'])
  ) {
    patch.equippedNameplateId = identity.equippedNameplateId;
  }
  if (hasKey(raw, ['profileTheme', 'profile_theme'])) patch.profileTheme = identity.profileTheme;
  if (hasKey(raw, ['chatTheme', 'chat_theme'])) patch.chatTheme = identity.chatTheme;
  if (hasKey(raw, ['displayNameFont', 'display_name_font', 'nameFont', 'name_font'])) {
    patch.displayNameFont = identity.displayNameFont;
  }
  if (hasKey(raw, ['displayNameEffect', 'display_name_effect', 'nameEffect', 'name_effect'])) {
    patch.displayNameEffect = identity.displayNameEffect;
  }
  if (hasKey(raw, ['displayNameColor', 'display_name_color', 'nameColor', 'name_color'])) {
    patch.displayNameColor = identity.displayNameColor;
  }
  if (hasKey(raw, ['displayNameSecondaryColor', 'display_name_secondary_color'])) {
    patch.displayNameSecondaryColor = identity.displayNameSecondaryColor;
  }
  if (hasKey(raw, ['accent_color', 'accentColor'])) {
    patch.accentColor = firstString(raw, ['accent_color', 'accentColor']);
  }

  applyOwnIdentityPatch(patch);
}

/** Applies an item_equipped socket payload to the own-user identity sync owner. */
export function applyOwnItemEquipped(itemType: string, itemId: string): void {
  if (itemType === 'border' || itemType === 'avatar_border') {
    applyOwnIdentityPatch({ avatarBorderId: itemId });
    return;
  }
  if (itemType === 'title') {
    applyOwnIdentityPatch({ equippedTitleId: itemId });
    return;
  }
  if (itemType === 'nameplate') {
    applyOwnIdentityPatch({ equippedNameplateId: itemId });
    return;
  }
  if (itemType === 'badge') {
    const badges = currentBadgeIds();
    applyOwnIdentityPatch({
      equippedBadgeIds: badges.includes(itemId) ? badges : [...badges, itemId],
    });
    return;
  }
  if (itemType === 'profile_theme') {
    applyOwnIdentityPatch({ profileTheme: itemId });
    return;
  }
  if (itemType === 'chat_theme') {
    applyOwnIdentityPatch({ chatTheme: itemId });
    return;
  }
  if (itemType === 'name_font') {
    applyOwnIdentityPatch({ displayNameFont: itemId });
    return;
  }
  if (itemType === 'name_style' || itemType === 'name_effect') {
    applyOwnIdentityPatch({ displayNameEffect: itemId });
  }
}

/** Applies an item_unequipped socket payload to the own-user identity sync owner. */
export function applyOwnItemUnequipped(itemType: string, itemId?: string): void {
  if (itemType === 'border' || itemType === 'avatar_border') {
    applyOwnIdentityPatch({ avatarBorderId: null });
    return;
  }
  if (itemType === 'title') {
    applyOwnIdentityPatch({ equippedTitleId: null });
    return;
  }
  if (itemType === 'nameplate') {
    applyOwnIdentityPatch({ equippedNameplateId: null });
    return;
  }
  if (itemType === 'badge' && itemId) {
    applyOwnIdentityPatch({
      equippedBadgeIds: currentBadgeIds().filter((badgeId) => badgeId !== itemId),
    });
    return;
  }
  if (itemType === 'profile_theme') {
    applyOwnIdentityPatch({ profileTheme: null });
    return;
  }
  if (itemType === 'chat_theme') {
    applyOwnIdentityPatch({ chatTheme: null });
    return;
  }
  if (itemType === 'name_font') {
    applyOwnIdentityPatch({ displayNameFont: null });
    return;
  }
  if (itemType === 'name_style' || itemType === 'name_effect') {
    applyOwnIdentityPatch({ displayNameEffect: null });
  }
}
