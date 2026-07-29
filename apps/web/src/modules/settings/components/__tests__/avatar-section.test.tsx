import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User } from '@/modules/auth/store/authStore.types';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button onClick={onClick as React.MouseEventHandler} {...rest}>
        {children}
      </button>
    ),
  },
}));

vi.mock('@/shared/components/ui', async () => {
  const card = await vi.importActual<typeof import('@/components/ui/card')>(
    '@/components/ui/card'
  );
  return {
    Card: card.default,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

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

const mockUser: User = {
  id: 'user-1',
  uid: '4829173650',
  userId: 1,
  userIdDisplay: '#4829173650',
  email: 'test@example.com',
  displayName: 'Test User',
  username: 'testuser',
  avatarUrl: 'https://example.com/avatar.jpg',
  emailVerifiedAt: '2026-07-01T00:00:00Z',
  twoFactorEnabled: false,
  status: 'online',
  statusMessage: null,
  pulse: 0,
  isVerified: true,
  isPremium: false,
  isAdmin: false,
  canChangeUsername: true,
  usernameNextChangeAt: null,
  phoneNumber: null,
  createdAt: '2026-07-01T00:00:00Z',
};

describe('AvatarSection', () => {
  it('renders the profile picture heading', () => {
    render(<AvatarSection user={mockUser} />);
    expect(screen.getByRole('heading', { name: 'Profile picture' })).toBeInTheDocument();
  });

  it('renders avatar preview image when user has avatarUrl', () => {
    render(<AvatarSection user={mockUser} />);
    expect(screen.getByAltText('Test User avatar preview')).toBeInTheDocument();
  });

  it('renders initial fallback when no avatarUrl', () => {
    const noAvatar = { ...mockUser, avatarUrl: '' };
    render(<AvatarSection user={noAvatar} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders change image button when an avatar exists', () => {
    render(<AvatarSection user={mockUser} />);
    expect(screen.getByText('Change Image')).toBeInTheDocument();
  });

  it('keeps the upload preview locked to the compact avatar size', () => {
    render(<AvatarSection user={mockUser} />);

    expect(screen.getByTestId('avatar-upload-preview-button')).toHaveStyle({
      width: '96px',
      height: '96px',
      maxWidth: '96px',
      maxHeight: '96px',
      borderRadius: '9999px',
    });
  });

  it('renders file size hint', () => {
    render(<AvatarSection user={mockUser} />);
    expect(
      screen.getByText('Crop once and it updates your profile, sidebar, chats, and profile cards.')
    ).toBeInTheDocument();
  });

  it('renders inside the shared card material', () => {
    const { container } = render(<AvatarSection user={mockUser} />);
    expect(container.querySelector('[data-cgraph-surface="card"]')).toBeInTheDocument();
  });

  it('renders fallback initial "U" for null user', () => {
    render(<AvatarSection user={null} />);
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('uses username for initial fallback if no displayName', () => {
    const userNoDisplayName = { ...mockUser, displayName: '', avatarUrl: '' };
    render(<AvatarSection user={userNoDisplayName} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
