import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LottieBorderRenderer } from '../lottie-border-renderer';

vi.mock('../lottie-player', () => ({
  loadLottieCanvasPlayer: vi.fn(async () => ({
    loadAnimation: vi.fn(() => ({
      addEventListener: vi.fn(),
      destroy: vi.fn(),
      isPaused: true,
      pause: vi.fn(),
      play: vi.fn(),
      setSpeed: vi.fn(),
    })),
  })),
}));

describe('LottieBorderRenderer', () => {
  it('masks the animation layer to the border ring so the avatar stays opaque', () => {
    const { container } = render(
      <LottieBorderRenderer lottieUrl="/lottie/avatar-borders/test.json" avatarSize={64} borderWidth={10}>
        <img src="/avatar.png" alt="Avatar" />
      </LottieBorderRenderer>
    );

    const shell = container.firstElementChild as HTMLElement | null;
    const animationLayer = shell?.children.item(0) as HTMLElement | null;
    const avatarLayer = shell?.children.item(1) as HTMLElement | null;

    expect(animationLayer?.style.maskImage).toContain('radial-gradient');
    expect(animationLayer?.style.zIndex).toBe('2');
    expect(avatarLayer?.style.zIndex).toBe('3');
    expect(avatarLayer?.style.background).toContain('linear-gradient');
  });
});
