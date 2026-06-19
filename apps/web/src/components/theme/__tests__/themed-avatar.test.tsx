import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/stores', () => ({
  THEME_COLORS: {
    purple: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
    },
  },
  useThemeStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      avatarBorder: 'none',
      avatarBorderColor: 'purple',
      animationSpeed: 'normal',
      particlesEnabled: false,
      glowEnabled: false,
      effectPreset: 'none',
    }),
}));

import { ThemedAvatar } from '../themed-avatar';

describe('ThemedAvatar', () => {
  it('renders backend-relative avatar URLs instead of falling back to initials', () => {
    render(<ThemedAvatar src="/uploads/avatars/u1/avatar.jpg" alt="Cipher One" />);

    expect(screen.getByRole('img', { name: 'Cipher One' })).toHaveAttribute(
      'src',
      expect.stringContaining('/uploads/avatars/u1/avatar.jpg')
    );
  });
});
