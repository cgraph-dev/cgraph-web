import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { Nameplate } from '../nameplate';

describe('profile card Nameplate', () => {
  it('renders image-backed nameplates without frosted fallback layers', () => {
    const { container } = render(
      <Nameplate displayName="tricker" nameplateId="plate_gilded_sapphire_loop_01" />
    );

    expect(screen.getByText('tricker')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/cosmetics/pixellab/nameplate/plate_gilded_sapphire_loop_01/plate_gilded_sapphire_loop_01_0.gif'
    );
    expect(container.querySelector('.cgraph-game-nameplate-frame')).toHaveStyle({
      background: 'transparent',
      boxShadow: 'none',
    });
    expect(container.querySelector('.cgraph-game-nameplate-glow')).not.toBeInTheDocument();
    expect(container.querySelector('.cgraph-game-nameplate-sheen')).not.toBeInTheDocument();
  });

  it('centers image-backed plates and clips very long display names', () => {
    const longName = 'ThisUsernameIsWayTooLongForAProfileNameplate';
    const { container } = render(
      <Nameplate displayName={longName} nameplateId="plate_gilded_sapphire_loop_01" />
    );

    expect(container.querySelector('.cgraph-game-nameplate-frame')).toHaveStyle({
      width: 'min(15.5rem, 100%)',
      height: '3rem',
    });
    expect(screen.getByText(longName).parentElement).toHaveClass(
      'nameplate-scroll-text',
      'text-center',
      'leading-none'
    );
  });
});
