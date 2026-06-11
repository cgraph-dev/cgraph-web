import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NameplateScrollText } from '../nameplate-scroll-text';

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('NameplateScrollText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pans overflowing names inside a fixed nameplate slot', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(240);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(112);

    const { container } = render(<NameplateScrollText text="ThisUsernameNeedsToMove" />);

    expect(container.querySelector('.nameplate-scroll-text--scrolling')).toBeInTheDocument();
    expect(container.querySelector('.nameplate-scroll-text')).toHaveAttribute(
      'data-nameplate-text-overflow',
      'scroll'
    );
    expect(screen.getByText('ThisUsernameNeedsToMove')).toHaveClass(
      'nameplate-scroll-text__inner'
    );
  });
});
