import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GlassSearchInput } from '../glass-search-input';

describe('GlassSearchInput', () => {
  it('uses the shared search material without replacing input behavior', () => {
    render(<GlassSearchInput aria-label="Find conversations" placeholder="Search" />);

    const input = screen.getByRole('textbox', { name: 'Find conversations' });
    expect(input).toHaveAttribute('placeholder', 'Search');
    expect(input.parentElement).toHaveClass('cgraph-search-field');
    expect(input.parentElement?.querySelector('.cgraph-search-icon')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
