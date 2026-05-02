/** @module tier-badge tests */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TierBadge } from './tier-badge';

describe('TierBadge', () => {
  it('renders lock icon for secret', () => {
    const { getByLabelText } = render(<TierBadge type="secret" />);
    expect(
      getByLabelText('Secret Chat — end-to-end encrypted on mobile and desktop')
    ).toBeInTheDocument();
  });

  it('renders cloud icon for cloud', () => {
    const { getByLabelText } = render(<TierBadge type="cloud" />);
    expect(getByLabelText('Cloud Chat — works on every device')).toBeInTheDocument();
  });
});
