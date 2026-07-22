import { describe, expect, it } from 'vitest';
import { navItems } from '../constants';

describe('primary navigation', () => {
  it('opens the settings root from the Settings entry', () => {
    expect(navItems.find(({ label }) => label === 'Settings')?.path).toBe('/me/settings');
  });

  it('exposes the existing notification center from primary navigation', () => {
    expect(navItems.find(({ label }) => label === 'Notifications')?.path).toBe(
      '/social/notifications'
    );
  });
});
