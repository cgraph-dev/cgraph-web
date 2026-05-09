/**
 * @file Tests for AvatarPreviewCard component (avatar-settings)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: ({ className }: { className?: string }) => (
    <span data-testid="sparkles-icon" className={className} />
  ),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({
    src,
    alt,
    size,
    avatarBorderId,
  }: {
    src?: string | null;
    alt: string;
    size?: string;
    avatarBorderId?: string;
  }) => (
    <div
      data-testid="themed-avatar"
      data-src={src ?? ''}
      data-alt={alt}
      data-size={size}
      data-avatar-border-id={avatarBorderId}
    />
  ),
}));

vi.mock('@/modules/settings/store/customization', () => ({
  useCustomizationStore: vi.fn((selector: (state: { selectedBorderId: string }) => unknown) =>
    selector({ selectedBorderId: 'default-border' })
  ),
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: vi.fn((selector: (state: { selectedBorderId: string }) => unknown) =>
    selector({ selectedBorderId: 'default-border' })
  ),
}));

import { AvatarPreviewCard } from '../avatar-settings/avatar-preview-card';

describe('AvatarPreviewCard', () => {
  it('renders "Live Preview" heading', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
  });

  it('renders sparkles icon', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('renders GlassCard with frosted variant', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('glass-card')).toHaveAttribute('data-variant', 'frosted');
  });

  it('renders ThemedAvatar', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('themed-avatar')).toBeInTheDocument();
  });

  it('passes avatarUrl to ThemedAvatar', () => {
    render(<AvatarPreviewCard avatarUrl="https://example.com/avatar.jpg" />);
    expect(screen.getByTestId('themed-avatar')).toHaveAttribute(
      'data-src',
      'https://example.com/avatar.jpg'
    );
  });

  it('passes displayName as alt text', () => {
    render(<AvatarPreviewCard displayName="Alice" />);
    expect(screen.getByTestId('themed-avatar')).toHaveAttribute('data-alt', 'Alice');
  });

  it('uses "User" as default alt text', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('themed-avatar')).toHaveAttribute('data-alt', 'User');
  });

  it('renders description text', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByText('Your avatar with current border')).toBeInTheDocument();
  });

  it('passes xlarge size to avatar', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('themed-avatar')).toHaveAttribute('data-size', 'xlarge');
  });

  it('passes selected border id to avatar', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('themed-avatar')).toHaveAttribute(
      'data-avatar-border-id',
      'default-border'
    );
  });
});
