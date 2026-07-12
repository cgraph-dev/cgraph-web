/**
 * Settings Mappers Unit Tests
 *
 * Tests for mapSettingsFromApi and mapSettingsToApi
 * that convert between camelCase frontend and snake_case backend formats.
 */

import { describe, it, expect } from 'vitest';
import { mapSettingsFromApi, mapSettingsToApi } from '../settings-mappers';
import { DEFAULT_LOCALE_SETTINGS } from '../settingsStore.types';
import type { AppearanceSettings } from '../settingsStore.types';
describe('mapSettingsFromApi', () => {
  it('maps notification settings from snake_case', () => {
    const result = mapSettingsFromApi({
      email_notifications: false,
      push_notifications: false,
      notify_messages: false,
      notification_sound: false,
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      dnd_until: '2026-03-01T00:00:00Z',
    });

    expect(result.notifications.emailNotifications).toBe(false);
    expect(result.notifications.pushNotifications).toBe(false);
    expect(result.notifications.notifyMessages).toBe(false);
    expect(result.notifications.notificationSound).toBe(false);
    expect(result.notifications.quietHoursEnabled).toBe(true);
    expect(result.notifications.quietHoursStart).toBe('22:00');
    expect(result.notifications.quietHoursEnd).toBe('07:00');
    expect(result.notifications.dndUntil).toBe('2026-03-01T00:00:00Z');
  });

  it('maps privacy settings from snake_case', () => {
    const result = mapSettingsFromApi({
      show_online_status: false,
      show_read_receipts: false,
      profile_visibility: 'private',
      allow_friend_requests: false,
      allow_group_invites: 'friends',
      selective_privacy: {
        message_requests: {
          mode: 'contacts',
          always_allow_user_ids: ['friend-id'],
          never_allow_user_ids: ['blocked-id'],
        },
        phone_number: {
          mode: 'nobody',
          always_allow_user_ids: [],
          never_allow_user_ids: [],
        },
        calls: {
          mode: 'everyone',
          always_allow_user_ids: [],
          never_allow_user_ids: [],
        },
      },
    });

    expect(result.privacy.showOnlineStatus).toBe(false);
    expect(result.privacy.showReadReceipts).toBe(false);
    expect(result.privacy.profileVisibility).toBe('private');
    expect(result.privacy.allowFriendRequests).toBe(false);
    expect(result.privacy.allowGroupInvites).toBe('friends');
    expect(result.privacy.selectivePrivacy.messageRequests.mode).toBe('contacts');
    expect(result.privacy.selectivePrivacy.messageRequests.alwaysAllowUserIds).toEqual([
      'friend-id',
    ]);
  });

  it('maps appearance settings from snake_case', () => {
    const result = mapSettingsFromApi({
      theme: 'dark',
      compact_mode: true,
      font_size: 'large',
      message_density: 'compact',
      reduce_motion: true,
      high_contrast: true,
    });

    expect(result.appearance.theme).toBe('dark');
    expect(result.appearance.compactMode).toBe(true);
    expect(result.appearance.fontSize).toBe('large');
    expect(result.appearance.messageDensity).toBe('compact');
    expect(result.appearance.reduceMotion).toBe(true);
    expect(result.appearance.highContrast).toBe(true);
  });

  it('maps locale settings from snake_case', () => {
    const result = mapSettingsFromApi({
      language: 'fr',
      timezone: 'Europe/Paris',
      date_format: 'dmy',
      time_format: 'twenty_four_hour',
    });

    expect(result.locale.language).toBe('fr');
    expect(result.locale.timezone).toBe('Europe/Paris');
    expect(result.locale.dateFormat).toBe('dmy');
    expect(result.locale.timeFormat).toBe('twenty_four_hour');
  });

  it('maps keyboard settings from snake_case', () => {
    const result = mapSettingsFromApi({
      keyboard_shortcuts_enabled: false,
      custom_shortcuts: { 'ctrl+k': 'search' },
    });

    expect(result.keyboard.keyboardShortcutsEnabled).toBe(false);
    expect(result.keyboard.customShortcuts).toEqual({ 'ctrl+k': 'search' });
  });

  it('uses defaults for missing fields', () => {
    const result = mapSettingsFromApi({});

    // Notifications defaults
    expect(result.notifications.emailNotifications).toBe(true);
    expect(result.notifications.pushNotifications).toBe(true);
    expect(result.notifications.quietHoursStart).toBeNull();

    // Privacy defaults
    expect(result.privacy.showOnlineStatus).toBe(true);
    expect(result.privacy.profileVisibility).toBe('public');

    // Appearance defaults
    expect(result.appearance.theme).toBe('aurora');
    expect(result.appearance.compactMode).toBe(false);

    // Locale defaults
    expect(result.locale.language).toBe('en');
    expect(result.locale.timezone).toBe(DEFAULT_LOCALE_SETTINGS.timezone);

    // Keyboard defaults
    expect(result.keyboard.keyboardShortcutsEnabled).toBe(true);
    expect(result.keyboard.customShortcuts).toEqual({});
  });

  it('handles partial data mixed with defaults', () => {
    const result = mapSettingsFromApi({
      theme: 'dark',
      language: 'ja',
    });

    expect(result.appearance.theme).toBe('dark');
    expect(result.locale.language).toBe('ja');
    // Untouched fields use defaults
    expect(result.appearance.compactMode).toBe(false);
    expect(result.locale.timezone).toBe(DEFAULT_LOCALE_SETTINGS.timezone);
  });
});
describe('mapSettingsToApi', () => {
  it('maps notification settings to snake_case', () => {
    const result = mapSettingsToApi({
      notifications: {
        emailNotifications: false,
        pushNotifications: true,
        notifyMessages: true,
        notifyMentions: true,
        notifyFriendRequests: true,
        notifyGroupInvites: false,
        notifyForumReplies: true,
        notifyEconomy: true,
        notifySystem: true,
        notificationSound: false,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        dndUntil: null,
      },
    });

    expect(result.email_notifications).toBe(false);
    expect(result.push_notifications).toBe(true);
    expect(result.notify_group_invites).toBe(false);
    expect(result.notification_sound).toBe(false);
    expect(result.quiet_hours_enabled).toBe(true);
    expect(result.quiet_hours_start).toBe('22:00');
  });

  it('maps privacy settings to snake_case', () => {
    const result = mapSettingsToApi({
      privacy: {
        showOnlineStatus: false,
        showReadReceipts: true,
        showTypingIndicators: true,
        profileVisibility: 'private',
        allowFriendRequests: false,
        allowMessageRequests: true,
        showInSearch: false,
        allowGroupInvites: 'friends',
        showBio: true,
        showPostCount: true,
        showJoinDate: true,
        showLastActive: false,
        showSocialLinks: true,
        showActivity: true,
        showInMemberList: true,
        showPhone: false,
        showForwardedFrom: true,
        allowCalls: true,
        autoDeleteDefault: null,
        selectivePrivacy: {
          messageRequests: {
            mode: 'contacts',
            alwaysAllowUserIds: ['friend-id'],
            neverAllowUserIds: ['blocked-id'],
          },
          phoneNumber: {
            mode: 'nobody',
            alwaysAllowUserIds: [],
            neverAllowUserIds: [],
          },
          calls: {
            mode: 'everyone',
            alwaysAllowUserIds: [],
            neverAllowUserIds: [],
          },
        },
      },
    });

    expect(result.show_online_status).toBe(false);
    expect(result.profile_visibility).toBe('private');
    expect(result.allow_friend_requests).toBe(false);
    expect(result.show_last_active).toBe(false);
    expect(result.selective_privacy).toEqual({
      message_requests: {
        mode: 'contacts',
        always_allow_user_ids: ['friend-id'],
        never_allow_user_ids: ['blocked-id'],
      },
      phone_number: {
        mode: 'nobody',
        always_allow_user_ids: [],
        never_allow_user_ids: [],
      },
      calls: {
        mode: 'everyone',
        always_allow_user_ids: [],
        never_allow_user_ids: [],
      },
    });
  });

  it('maps appearance settings to snake_case', () => {
    const result = mapSettingsToApi({
      appearance: {
        theme: 'dark',
        compactMode: true,
        fontSize: 'large',
        messageDensity: 'compact',
        showAvatars: true,
        animateEmojis: false,
        reduceMotion: true,
        highContrast: true,
        screenReaderOptimized: true,
      },
    });

    expect(result.theme).toBe('dark');
    expect(result.compact_mode).toBe(true);
    expect(result.font_size).toBe('large');
    expect(result.high_contrast).toBe(true);
    expect(result.screen_reader_optimized).toBe(true);
  });

  it('maps locale settings to snake_case', () => {
    const result = mapSettingsToApi({
      locale: {
        language: 'de',
        timezone: 'Europe/Berlin',
        dateFormat: 'dmy',
        timeFormat: 'twenty_four_hour',
      },
    });

    expect(result.language).toBe('de');
    expect(result.timezone).toBe('Europe/Berlin');
    expect(result.date_format).toBe('dmy');
    expect(result.time_format).toBe('twenty_four_hour');
  });

  it('maps keyboard settings to snake_case', () => {
    const result = mapSettingsToApi({
      keyboard: {
        keyboardShortcutsEnabled: false,
        customShortcuts: { 'ctrl+s': 'save' },
      },
    });

    expect(result.keyboard_shortcuts_enabled).toBe(false);
    expect(result.custom_shortcuts).toEqual({ 'ctrl+s': 'save' });
  });

  it('returns empty object for empty input', () => {
    const result = mapSettingsToApi({});

    expect(result).toEqual({});
  });

  it('only includes defined fields (skips undefined)', () => {
    const result = mapSettingsToApi({
      appearance: {
        theme: 'dark' as const,
      } as unknown as AppearanceSettings,
    });

    expect(result.theme).toBe('dark');
    // undefined fields should not be in the result
    expect('compact_mode' in result).toBe(false);
  });

  it('handles multiple sections simultaneously', () => {
    const result = mapSettingsToApi({
      notifications: {
        emailNotifications: false,
        pushNotifications: true,
        notifyMessages: true,
        notifyMentions: true,
        notifyFriendRequests: true,
        notifyGroupInvites: true,
        notifyForumReplies: true,
        notifyEconomy: true,
        notifySystem: true,
        notificationSound: true,
        quietHoursEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
        dndUntil: null,
      },
      appearance: {
        theme: 'light',
        compactMode: false,
        fontSize: 'medium',
        messageDensity: 'comfortable',
        showAvatars: true,
        animateEmojis: true,
        reduceMotion: false,
        highContrast: false,
        screenReaderOptimized: false,
      },
    });

    expect(result.email_notifications).toBe(false);
    expect(result.theme).toBe('light');
  });
});
describe('roundtrip mapping', () => {
  it('preserves values through fromApi -> toApi cycle', () => {
    const apiData = {
      email_notifications: false,
      theme: 'dark' as const,
      language: 'fr',
      keyboard_shortcuts_enabled: false,
      show_online_status: false,
    };

    const frontendSettings = mapSettingsFromApi(apiData);
    const backToApi = mapSettingsToApi(frontendSettings);

    expect(backToApi.email_notifications).toBe(false);
    expect(backToApi.theme).toBe('dark');
    expect(backToApi.language).toBe('fr');
    expect(backToApi.keyboard_shortcuts_enabled).toBe(false);
    expect(backToApi.show_online_status).toBe(false);
  });
});
