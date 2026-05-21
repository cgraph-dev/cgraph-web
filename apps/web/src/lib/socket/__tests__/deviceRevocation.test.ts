import { describe, expect, it } from 'vitest';
import { shouldLogoutForDeviceRevocation } from '../deviceRevocation';

describe('shouldLogoutForDeviceRevocation', () => {
  it('logs out only when the revoked device is the current browser device', () => {
    expect(
      shouldLogoutForDeviceRevocation({ device_id: 'web-current' }, 'web-current')
    ).toBe(true);
  });

  it('ignores revocation events for other devices', () => {
    expect(
      shouldLogoutForDeviceRevocation({ device_id: 'ios-phone' }, 'web-current')
    ).toBe(false);
  });

  it('ignores broad revocation events with no device id', () => {
    expect(shouldLogoutForDeviceRevocation({ reason: 'revoked_by_user' }, 'web-current')).toBe(
      false
    );
  });
});
