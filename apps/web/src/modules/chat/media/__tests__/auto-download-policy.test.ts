import { describe, expect, it } from 'vitest';
import {
  shouldAutoDownloadIncomingMedia,
  type BrowserMediaNetwork,
} from '../auto-download-policy';

const ONLINE_UNKNOWN: BrowserMediaNetwork = { isOnline: true, type: 'unknown' };
const ONLINE_WIFI: BrowserMediaNetwork = { isOnline: true, type: 'wifi' };

describe('shouldAutoDownloadIncomingMedia', () => {
  it('allows always while the browser is online', () => {
    expect(shouldAutoDownloadIncomingMedia('always', ONLINE_UNKNOWN)).toBe(true);
  });

  it('blocks never even on Wi-Fi', () => {
    expect(shouldAutoDownloadIncomingMedia('never', ONLINE_WIFI)).toBe(false);
  });

  it('allows Wi-Fi only when the browser exposes a Wi-Fi network type', () => {
    expect(shouldAutoDownloadIncomingMedia('wifi', ONLINE_WIFI)).toBe(true);
    expect(shouldAutoDownloadIncomingMedia('wifi', ONLINE_UNKNOWN)).toBe(false);
  });

  it('blocks every policy while offline', () => {
    expect(
      shouldAutoDownloadIncomingMedia('always', { isOnline: false, type: 'wifi' })
    ).toBe(false);
  });
});
