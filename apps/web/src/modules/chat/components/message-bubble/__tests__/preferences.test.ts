import { describe, expect, it } from 'vitest';
import { DEFAULT_CHAT_UI_PREFERENCES } from '@cgraph-dev/shared-types';
import { DEFAULT_UI_PREFERENCES } from '../preferences';
import { DEFAULT_UI_PREFERENCES as ROUTE_DEFAULT_UI_PREFERENCES } from '@/pages/messages/conversation/types';

describe('chat UI preferences contract', () => {
  it('owns the default preferences in the shared chat module', () => {
    expect(ROUTE_DEFAULT_UI_PREFERENCES).toBe(DEFAULT_UI_PREFERENCES);
    expect(DEFAULT_UI_PREFERENCES).toBe(DEFAULT_CHAT_UI_PREFERENCES);
  });

  it('keeps decorative particle overlays disabled by default', () => {
    expect(DEFAULT_UI_PREFERENCES.showParticles).toBe(false);
  });
});
