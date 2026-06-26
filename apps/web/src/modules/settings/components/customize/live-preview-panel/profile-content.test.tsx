import { render, screen } from '@testing-library/react';
import type { ElementType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ProfileContent } from './profile-content';

vi.mock('../animated-avatar', () => ({
  AnimatedAvatar: () => <div data-testid="preview-avatar" />,
}));

vi.mock('@/shared/components/ui', () => ({
  DisplayName: ({ name }: { name: string }) => <span>{name}</span>,
  FireText: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  GlowText: ({
    as: Tag = 'span',
    children,
  }: {
    as?: ElementType;
    children: ReactNode;
  }) => <Tag>{children}</Tag>,
}));

vi.mock('@/shared/components/ui/cosmetic-display', () => ({
  resolveEquippedBadges: () => [],
}));

describe('ProfileContent live preview nameplate handling', () => {
  it('renders the None nameplate as plain display name text', () => {
    const { container } = render(
      <ProfileContent
        displayName="tricker"
        settings={{
          avatarSize: 'medium',
          glowEnabled: false,
          showBadges: false,
          showStatus: false,
          displayNameFont: 'default',
          displayNameEffect: 'solid',
          displayNameColor: '#ffffff',
          displayNameSecondaryColor: null,
          equippedNameplate: 'plate_none',
        }}
        colors={{
          primary: '#8b5cf6',
          secondary: '#38bdf8',
          glow: 'rgba(139, 92, 246, 0.35)',
          name: 'Test Theme',
        }}
        effectiveBorderType="none"
        effectiveColorPreset="aurora"
        effectiveTitle={null}
        titleInfo={null}
        isLegendaryTitle={false}
        speedMultiplier={1}
      />
    );

    expect(screen.getByText('tricker')).toBeInTheDocument();
    expect(container.querySelector('.cgraph-game-nameplate-frame')).not.toBeInTheDocument();
    expect(container.querySelector('[data-nameplate-id="plate_none"]')).not.toBeInTheDocument();
  });
});
