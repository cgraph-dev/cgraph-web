import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorFallback } from '../error-fallback';

describe('ErrorFallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the route error with shared materials and stable recovery controls', () => {
    render(
      <ErrorFallback
        error={new Error('Conversation failed to load')}
        resetErrorBoundary={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('alert')).toHaveTextContent('Conversation failed to load');
    expect(document.querySelector('[data-cgraph-surface="card"]')).toBeInTheDocument();

    for (const name of ['Try again', 'Go back', 'Report issue']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );
    }
  });

  it('resets the route boundary without reloading the page', () => {
    const resetErrorBoundary = vi.fn();
    render(
      <ErrorFallback error={new Error('Temporary error')} resetErrorBoundary={resetErrorBoundary} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(resetErrorBoundary).toHaveBeenCalledOnce();
  });

  it('supports a bounded root recovery action without route controls', () => {
    render(
      <ErrorFallback
        error={new Error('Application failed')}
        resetErrorBoundary={vi.fn()}
        recoveryLabel="Reload page"
        showSecondaryActions={false}
      />
    );

    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Report issue' })).not.toBeInTheDocument();
  });

  it('returns to browser history from the secondary action', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    render(<ErrorFallback error={new Error('Broken route')} resetErrorBoundary={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

    expect(back).toHaveBeenCalledOnce();
  });

  it('opens a bounded support report with route context', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <ErrorFallback
        error={new TypeError('Missing conversation')}
        resetErrorBoundary={vi.fn()}
        componentName="Messages"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Report issue' }));

    expect(open).toHaveBeenCalledWith(
      expect.stringMatching(
        /^mailto:support@cgraph\.org\?subject=Bug%20Report%3A%20TypeError&body=/
      ),
      '_blank',
      'noopener,noreferrer'
    );
    expect(open.mock.calls[0]?.[0]).toContain('Component%3A%20Messages');
  });
});
