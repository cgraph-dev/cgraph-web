import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore, type User } from '@/modules/auth/store';
import {
  DEFAULT_STATE,
  useCustomizationStore,
} from '@/modules/settings/store/customization/customizationStore';
import {
  applyOwnItemEquipped,
  applyOwnItemUnequipped,
  applyOwnProfileUpdate,
} from '../ownIdentitySync';

const baseUser: User = {
  id: 'user-1',
  uid: '1234567890',
  userId: 1,
  userIdDisplay: '#1234567890',
  email: 'test@example.com',
  username: 'test',
  displayName: 'Test User',
  avatarUrl: null,
  avatarBorderId: null,
  equippedTitleId: null,
  equippedBadgeIds: ['badge-newcomer'],
  equippedNameplateId: null,
  profileTheme: null,
  chatTheme: null,
  displayNameFont: null,
  displayNameEffect: null,
  displayNameColor: null,
  displayNameSecondaryColor: null,
  walletAddress: null,
  emailVerifiedAt: null,
  twoFactorEnabled: false,
  status: 'online',
  statusMessage: null,
  pulse: 0,
  isVerified: false,
  isPremium: false,
  isAdmin: false,
  canChangeUsername: true,
  usernameNextChangeAt: null,
  phoneNumber: null,
  createdAt: '2026-05-15T00:00:00Z',
  bannerUrl: null,
};

describe('own identity socket sync owner', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { ...baseUser },
      token: 'token',
      refreshToken: null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    useCustomizationStore.setState({ ...DEFAULT_STATE, isDirty: true, lastSyncedAt: null });
  });

  it('applies profile_updated payloads to auth and customization through one server-sync path', () => {
    useAuthStore.getState().updateUser({
      isPremium: true,
      subscription: {
        tier: 'premium',
        status: 'active',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    });

    applyOwnProfileUpdate({
      avatar_hash: 'avatar-v2',
      banner_hash: 'banner-v2',
      avatar_border_id: 'border_cyberpunk_common_01',
      equipped_title_id: 'elite',
      equipped_badge_ids: ['badge-newcomer', 'badge-founder'],
      nameplate_id: 'plate_gilded_sapphire_loop_01',
      profile_theme: 'aurora-glass',
      chat_theme: 'cyan',
      display_name_font: 'mono',
      display_name_effect: 'sparkle',
      display_name_color: '#abc123',
      display_name_secondary_color: '#def456',
      accent_color: 'gold',
    });

    expect(useAuthStore.getState().user).toMatchObject({
      avatarUrl: '/avatar-v2',
      bannerUrl: null,
      avatarBorderId: 'border_cyberpunk_common_01',
      equippedTitleId: 'elite',
      equippedBadgeIds: ['badge-newcomer', 'badge-founder'],
      equippedNameplateId: 'plate_gilded_sapphire_loop_01',
      profileTheme: 'aurora-glass',
      chatTheme: 'cyan',
      displayNameFont: 'mono',
      displayNameEffect: 'sparkle',
      displayNameColor: '#abc123',
      displayNameSecondaryColor: '#def456',
    });

    expect(useCustomizationStore.getState()).toMatchObject({
      selectedBorderId: 'border_cyberpunk_common_01',
      avatarBorderType: 'static',
      avatarBorder: 'static',
      equippedTitle: 'elite',
      title: 'elite',
      equippedBadges: ['badge-newcomer', 'badge-founder'],
      equippedNameplate: 'plate_gilded_sapphire_loop_01',
      selectedProfileThemeId: 'aurora-glass',
      profileTheme: 'aurora-glass',
      chatTheme: 'cyan',
      chatBubbleColor: 'cyan',
      displayNameFont: 'mono',
      displayNameEffect: 'sparkle',
      displayNameColor: '#abc123',
      displayNameSecondaryColor: '#def456',
      avatarBorderColor: 'gold',
      isDirty: false,
    });
    expect(useCustomizationStore.getState().lastSyncedAt).toEqual(expect.any(Number));
  });

  it('adds and removes equipped item state without duplicating badges', () => {
    applyOwnItemEquipped('badge', 'badge-newcomer');
    applyOwnItemEquipped('badge', 'badge-first-message');
    applyOwnItemEquipped('border', 'border_cyberpunk_common_01');
    applyOwnItemUnequipped('badge', 'badge-newcomer');
    applyOwnItemUnequipped('border');

    expect(useAuthStore.getState().user).toMatchObject({
      avatarBorderId: null,
      equippedBadgeIds: ['badge-first-message'],
    });
    expect(useCustomizationStore.getState()).toMatchObject({
      selectedBorderId: null,
      equippedBadges: ['badge-first-message'],
      isDirty: false,
    });
  });
});
