import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import type { NameplateEntry } from '@cgraph-dev/animation-constants';
import { NameplateRenderer } from '../nameplate-renderer';

const BASE_NAMEPLATE: NameplateEntry = {
  id: 'plate_test',
  name: 'Test Plate',
  rarity: 'epic',
  free: false,
  lottieFile: 'placeholder.json',
  textColor: '#f8fafc',
  description: 'Test nameplate',
  textEffect: 'none',
  textColorSecondary: null,
  emblem: null,
  lottieUrl: 'nameplates/placeholder.json',
  animationType: 'lottie',
  barGradient: ['#111827', '#1f2937'],
  borderStyle: 'glow',
  borderColor: '#38bdf8',
  category: 'test',
};

describe('NameplateRenderer', () => {
  it('renders image-backed nameplates without fallback frame overlays', () => {
    const imageNameplate: NameplateEntry = {
      ...BASE_NAMEPLATE,
      emblem: '◆',
      imageUrl: '/cosmetics/pixellab/nameplate/plate_gilded_emerald_loop_01/plate_gilded_emerald_loop_01_0.gif',
      previewUrl: '/cosmetics/pixellab/nameplate/plate_gilded_emerald_loop_01/plate_gilded_emerald_loop_01_0.png',
      barGradient: null,
      borderStyle: 'none',
      borderColor: null,
    };

    const { container } = render(<NameplateRenderer nameplate={imageNameplate} username="tricker" />);

    expect(screen.getByText('tricker')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', imageNameplate.imageUrl);
    expect(container.querySelector('.cgraph-game-nameplate-glow')).not.toBeInTheDocument();
    expect(container.querySelector('.cgraph-game-nameplate-sheen')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveStyle({ background: 'transparent' });
    expect(container.firstElementChild).toHaveStyle({ width: '11rem', maxWidth: '100%' });
    expect(screen.getByText('tricker').parentElement).toHaveClass('nameplate-scroll-text');
    expect(screen.queryByText('◆')).not.toBeInTheDocument();
  });

  it('keeps fallback overlays for non-image nameplates', () => {
    const { container } = render(<NameplateRenderer nameplate={BASE_NAMEPLATE} username="tricker" />);

    expect(container.querySelector('.cgraph-game-nameplate-glow')).toBeInTheDocument();
    expect(container.querySelector('.cgraph-game-nameplate-sheen')).toBeInTheDocument();
  });

  it.each(['metallic', 'holographic', 'fire', 'ice', 'rainbow'] as const)(
    'keeps %s text readable in picker previews',
    (textEffect) => {
      render(
        <NameplateRenderer
          nameplate={{ ...BASE_NAMEPLATE, textEffect, lottieUrl: undefined, lottieFile: undefined }}
          username="tricker"
        />
      );

      const renderedName = screen.getByText('tricker');
      expect(renderedName).toBeInTheDocument();
      expect(renderedName.getAttribute('style') ?? '').not.toContain(
        '-webkit-text-fill-color: transparent'
      );
      expect(renderedName.getAttribute('style') ?? '').not.toContain('color: transparent');
      expect(renderedName.getAttribute('style') ?? '').not.toContain('background:');
    }
  );
});
