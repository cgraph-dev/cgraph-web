import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { ProfileCardPreview } from './profile-card-preview';

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: (selector: (state: { user: unknown }) => unknown) =>
    selector({
      user: {
        id: 'preview-user',
        username: 'preview',
        displayName: 'Preview User',
        avatarUrl: '/preview.png',
        pulse: 8,
        streak: 2,
      },
    }),
}));

vi.mock('@/modules/social/components/user-profile-card', () => ({
  NewProfileCard: ({
    className,
    mode,
    variant,
  }: {
    className?: string;
    mode: string;
    variant?: string;
  }) => (
    <div data-testid="profile-card-preview" data-mode={mode} data-variant={variant} className={className} />
  ),
  useProfileCardData: (user: Record<string, unknown>) => ({ ...user, accentTheme: 'aurora' }),
}));

describe('ProfileCardPreview', () => {
  it('uses the live preview width and preview card mode by default', () => {
    render(<ProfileCardPreview />);

    const preview = screen.getByTestId('profile-card-preview');
    expect(preview).toHaveClass('w-[288px]', 'max-w-full');
    expect(preview).toHaveAttribute('data-mode', 'preview');
    expect(preview).toHaveAttribute('data-variant', 'mini');
  });

  it('uses the profile-panel width without changing preview mode', () => {
    render(<ProfileCardPreview widthClassName="w-[320px]" />);

    const preview = screen.getByTestId('profile-card-preview');
    expect(preview).toHaveClass('w-[320px]', 'max-w-full');
    expect(preview).toHaveAttribute('data-mode', 'preview');
    expect(preview).toHaveAttribute('data-variant', 'mini');
  });
});
