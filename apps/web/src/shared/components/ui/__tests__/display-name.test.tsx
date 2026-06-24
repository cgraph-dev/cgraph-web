import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { DisplayName, WEB_NAME_EFFECT_KEYS } from '../display-name';

describe('DisplayName', () => {
  it.each(WEB_NAME_EFFECT_KEYS)('renders readable text for the %s effect', (effect) => {
    render(
      <DisplayName
        name="tricker"
        effect={effect}
        color="#ff4d6d"
        secondaryColor="#4cc9f0"
      />
    );

    const name = screen.getByText('tricker');
    expect(name).toBeInTheDocument();
    expect(name).toHaveAttribute('data-display-name-effect', effect);
    expect(name).toHaveClass('cgraph-display-name', `cgraph-display-name--effect-${effect}`);
  });

  it('falls back to safe shared defaults for unknown inputs', () => {
    render(<DisplayName name="tricker" font="missing-font" effect="missing-effect" />);

    const name = screen.getByText('tricker');
    expect(name).toHaveAttribute('data-display-name-effect', 'solid');
    expect(name).toHaveStyle({ maxWidth: '100%' });
  });
});
