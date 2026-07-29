import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ForumPageLoadingState } from '../forum-page-loading-state';

describe('ForumPageLoadingState', () => {
  it('fills the route workspace without owning route-specific data behavior', () => {
    const { container } = render(<ForumPageLoadingState label="Loading forum" />);

    expect(container.firstChild).toHaveClass('cgraph-workspace', 'flex-1');
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
  });

  it('exposes the route-specific loading status', () => {
    render(<ForumPageLoadingState label="Loading forum settings" />);

    expect(
      screen.getByRole('status', { name: 'Loading forum settings' })
    ).toBeInTheDocument();
  });
});
