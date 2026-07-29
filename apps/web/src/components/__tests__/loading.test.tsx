import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { LoadingOverlay } from '../feedback/loading';
import { InlineLoadingSpinner } from '../feedback/loading-spinner';

describe('InlineLoadingSpinner', () => {
  it('exposes a compact loading status', () => {
    const { container } = render(<InlineLoadingSpinner />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveClass('h-6', 'w-6');
  });

  it('can be decorative inside a labelled loading owner', () => {
    const { container } = render(<InlineLoadingSpinner decorative />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports explicit labels and stable sizes', () => {
    const { container } = render(
      <InlineLoadingSpinner label="Loading active sessions" size="lg" />
    );

    expect(screen.getByRole('status', { name: 'Loading active sessions' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveClass('h-8', 'w-8');
  });
});

describe('LoadingOverlay', () => {
  it('provides a default accessible loading state', () => {
    render(<LoadingOverlay />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('uses the visible message as its accessible name', () => {
    render(<LoadingOverlay message="Loading groups" />);

    expect(screen.getByRole('status', { name: 'Loading groups' })).toBeInTheDocument();
    expect(screen.getByText('Loading groups')).toBeInTheDocument();
  });

  it('keeps a stable full-owner overlay geometry', () => {
    const { container } = render(<LoadingOverlay />);
    expect(container.firstElementChild).toHaveClass('absolute', 'inset-0');
  });
});
