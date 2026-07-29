import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RouteSkeleton } from '../skeletons';

describe('RouteSkeleton', () => {
  it('preserves the application shell while a route loads', () => {
    const { container } = render(<RouteSkeleton />);

    expect(screen.getByLabelText('Loading page')).toHaveClass('cgraph-app-shell');
    expect(container.querySelector('.cgraph-navigation-rail')).toBeInTheDocument();
    expect(container.querySelector('.cgraph-pane')).toBeInTheDocument();
    expect(container.querySelector('.cgraph-workspace')).toBeInTheDocument();
  });

  it('uses silent shared skeleton materials for placeholder content', () => {
    const { container } = render(<RouteSkeleton />);

    const shimmerBars = container.querySelectorAll('.cgraph-skeleton');
    expect(shimmerBars.length).toBeGreaterThan(10);
    shimmerBars.forEach((placeholder) => {
      expect(placeholder.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(placeholder).toHaveClass('cgraph-skeleton');
    });
  });
});
