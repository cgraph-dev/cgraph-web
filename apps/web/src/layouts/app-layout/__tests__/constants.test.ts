import { describe, expect, it } from 'vitest';
import { navItems } from '../constants';

describe('primary navigation', () => {
  it('opens the settings root from the Settings entry', () => {
    expect(navItems.find(({ label }) => label === 'Settings')?.path).toBe('/me/settings');
  });
});
