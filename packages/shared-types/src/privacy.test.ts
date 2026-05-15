import { describe, expect, it } from 'vitest';
import {
  boolToSelectivePrivacyRule,
  DEFAULT_SELECTIVE_PRIVACY_SETTINGS,
  normalizeSelectivePrivacySettings,
  selectivePrivacyRuleEnabled,
  selectivePrivacySettingsToApi,
} from './privacy';

describe('selective privacy contract', () => {
  it('normalizes snake_case API rules into camelCase settings', () => {
    const settings = normalizeSelectivePrivacySettings({
      message_requests: {
        mode: 'contacts',
        always_allow_user_ids: ['user-1', 'user-1'],
        never_allow_user_ids: ['user-2', 42],
      },
      phone_number: { mode: 'nobody' },
      calls: { mode: 'everyone', never_allow_user_ids: ['blocked'] },
    });

    expect(settings.messageRequests).toEqual({
      mode: 'contacts',
      alwaysAllowUserIds: ['user-1'],
      neverAllowUserIds: ['user-2'],
    });
    expect(settings.phoneNumber.mode).toBe('nobody');
    expect(settings.calls.neverAllowUserIds).toEqual(['blocked']);
  });

  it('serializes the shared settings shape to backend snake_case JSON', () => {
    const api = selectivePrivacySettingsToApi({
      ...DEFAULT_SELECTIVE_PRIVACY_SETTINGS,
      messageRequests: {
        mode: 'contacts',
        alwaysAllowUserIds: ['friend-id'],
        neverAllowUserIds: ['blocked-id'],
      },
    });

    expect(api.message_requests).toEqual({
      mode: 'contacts',
      always_allow_user_ids: ['friend-id'],
      never_allow_user_ids: ['blocked-id'],
    });
  });

  it('keeps legacy boolean affordances compatible with the richer model', () => {
    expect(boolToSelectivePrivacyRule(false).mode).toBe('nobody');
    expect(boolToSelectivePrivacyRule(true).mode).toBe('everyone');
    expect(
      selectivePrivacyRuleEnabled({ mode: 'nobody', alwaysAllowUserIds: [], neverAllowUserIds: [] })
    ).toBe(false);
    expect(
      selectivePrivacyRuleEnabled({
        mode: 'nobody',
        alwaysAllowUserIds: ['override'],
        neverAllowUserIds: [],
      })
    ).toBe(true);
  });
});
