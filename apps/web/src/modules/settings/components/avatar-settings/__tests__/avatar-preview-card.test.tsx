/** @module avatar-preview-card tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: () => <span data-testid="sparkles-icon" />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({
    alt,
    size,
    avatarBorderId,
  }: {
    alt: string;
    size: string;
    avatarBorderId?: string;
  }) => (
    <div
      data-testid="themed-avatar"
      data-alt={alt}
      data-size={size}
      data-avatar-border-id={avatarBorderId}
    />
  ),
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: vi.fn((selector: (state: { selectedBorderId: string }) => unknown) =>
    selector({ selectedBorderId: 'default-border' })
  ),
}));

import { AvatarPreviewCard } from '../avatar-preview-card';

describe('AvatarPreviewCard', () => {
  it('renders Live Preview heading', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
  });

  it('renders sparkles icon', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('renders animated avatar with display name', () => {
    render(<AvatarPreviewCard displayName="John" avatarUrl="/john.png" />);
    const avatar = screen.getByTestId('themed-avatar');
    expect(avatar).toHaveAttribute('data-alt', 'John');
  });

  it('falls back to User when no displayName', () => {
    render(<AvatarPreviewCard />);
    const avatar = screen.getByTestId('themed-avatar');
    expect(avatar).toHaveAttribute('data-alt', 'User');
  });

  it('renders description text', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByText('Your avatar with current border')).toBeInTheDocument();
  });

  it('passes selected border id and current size', () => {
    render(<AvatarPreviewCard />);
    const avatar = screen.getByTestId('themed-avatar');
    expect(avatar).toHaveAttribute('data-size', 'xlarge');
    expect(avatar).toHaveAttribute('data-avatar-border-id', 'default-border');
  });
});
