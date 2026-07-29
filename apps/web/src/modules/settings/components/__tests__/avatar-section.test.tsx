/** @module avatar-section tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button onClick={onClick as React.MouseEventHandler} {...rest}>
        {children}
      </button>
    ),
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <img data-testid="themed-avatar" alt={alt} />,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { medium: vi.fn() },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => vi.fn()),
}));

vi.mock('@/lib/avatar-upload', () => ({
  uploadCurrentUserAvatarAndSync: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
  getAvatarBorderId: vi.fn(() => 'border-1'),
}));

import { AvatarSection } from '../avatar-section';

const mockUser = {
  id: 'user-1',
  displayName: 'Test User',
  username: 'testuser',
  avatarUrl: 'https://example.com/avatar.jpg',
};

describe('AvatarSection', () => {
  it('renders "Profile Picture" label', () => {
    render(<AvatarSection user={mockUser as never} />);
    expect(screen.getByText('Profile Picture')).toBeInTheDocument();
  });

  it('renders avatar preview image when user has avatarUrl', () => {
    render(<AvatarSection user={mockUser as never} />);
    expect(screen.getByAltText('Test User avatar preview')).toBeInTheDocument();
  });

  it('renders initial fallback when no avatarUrl', () => {
    const noAvatar = { ...mockUser, avatarUrl: '' };
    render(<AvatarSection user={noAvatar as never} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders change image button when an avatar exists', () => {
    render(<AvatarSection user={mockUser as never} />);
    expect(screen.getByText('Change Image')).toBeInTheDocument();
  });

  it('keeps the upload preview locked to the compact avatar size', () => {
    render(<AvatarSection user={mockUser as never} />);

    expect(screen.getByTestId('avatar-upload-preview-button')).toHaveStyle({
      width: '96px',
      height: '96px',
      maxWidth: '96px',
      maxHeight: '96px',
      borderRadius: '9999px',
    });
  });

  it('renders file size hint', () => {
    render(<AvatarSection user={mockUser as never} />);
    expect(
      screen.getByText('Crop once and it updates your profile, sidebar, chats, and profile cards.')
    ).toBeInTheDocument();
  });

  it('renders inside GlassCard', () => {
    render(<AvatarSection user={mockUser as never} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });

  it('renders fallback initial "U" for null user', () => {
    render(<AvatarSection user={null} />);
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('uses username for initial fallback if no displayName', () => {
    const userNoDisplayName = { ...mockUser, displayName: '', avatarUrl: '' };
    render(<AvatarSection user={userNoDisplayName as never} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
