import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { NameplateBar } from '../nameplate-bar';

describe('NameplateBar', () => {
  it('renders image-backed nameplates without fallback panel layers', () => {
    const { container } = render(
      <NameplateBar
        nameplateId="plate_gilded_sapphire_loop_01"
        username="tricker"
        width={240}
        height={36}
      />
    );

    expect(screen.getByText('tricker')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /gilded sapphire loop nameplate/i })).toHaveStyle({
      background: 'transparent',
    });
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/cosmetics/pixellab/nameplate/plate_gilded_sapphire_loop_01/plate_gilded_sapphire_loop_01_0.gif'
    );
    expect(container.querySelector('.cgraph-game-nameplate-glow')).not.toBeInTheDocument();
    expect(container.querySelector('.cgraph-game-nameplate-sheen')).not.toBeInTheDocument();
  });

  it('keeps long usernames inside the fixed plate slot', () => {
    render(
      <NameplateBar
        nameplateId="plate_gilded_sapphire_loop_01"
        username="ThisUsernameIsWayTooLongForANameplate"
        width={240}
        height={36}
      />
    );

    expect(screen.getByText('ThisUsernameIsWayTooLongForANameplate').parentElement).toHaveClass(
      'nameplate-scroll-text',
      'flex-1',
      'text-center'
    );
  });
});
