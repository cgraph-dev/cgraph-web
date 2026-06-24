import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';

import type { AvatarBorderConfig } from '@/types/avatar-borders';
import { AvatarBorderRenderer } from '../avatar-border-renderer';

const IMAGE_BORDER: AvatarBorderConfig & { imageUrl: string } = {
  id: 'border_test_image',
  type: 'static',
  name: 'Test Image Border',
  description: 'Image-backed avatar frame',
  theme: 'anime',
  rarity: 'rare',
  unlockType: 'default',
  primaryColor: '#38bdf8',
  secondaryColor: '#f472b6',
  accentColor: '#facc15',
  isPremium: false,
  tags: [],
  imageUrl: '/cosmetics/pixellab/avatar-border/border_test_image/border_test_image_0.gif',
};

describe('AvatarBorderRenderer', () => {
  it('stacks image-backed frame art above the avatar circle', () => {
    const { container } = render(
      <AvatarBorderRenderer border={IMAGE_BORDER} size={80} interactive={false}>
        <span data-testid="avatar-content">avatar</span>
      </AvatarBorderRenderer>
    );

    const frameAsset = container.querySelector('.cgraph-game-avatar-frame-asset');
    const avatarLayer = screen.getByTestId('avatar-content').parentElement;

    expect(frameAsset).toHaveClass('z-[3]');
    expect(avatarLayer).toHaveClass('z-[1]');
    expect(container.querySelector('.cgraph-game-avatar-frame-glow')).not.toBeInTheDocument();
  });
});
