import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addBreadcrumb: vi.fn(),
  captureError: vi.fn(),
  routeError: vi.fn(),
}));

vi.mock('@/lib/error-tracking', () => ({
  addBreadcrumb: mocks.addBreadcrumb,
  captureError: mocks.captureError,
}));

vi.mock('@/lib/logger', async () => {
  const logger = await vi.importActual<typeof import('@/lib/logger')>('@/lib/logger');

  return {
    ...logger,
    routeLogger: { error: mocks.routeError },
  };
});

import { RouteErrorBoundary } from '../route-error-boundary';

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('captures a route failure with bounded recovery metadata', () => {
    const error = new Error('Settings crashed');

    render(
      <RouteErrorBoundary routeName="Settings">
        <ThrowingRoute error={error} />
      </RouteErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Settings crashed');
    expect(mocks.addBreadcrumb).toHaveBeenCalledWith(
      'navigation',
      'Route error in Settings',
      expect.objectContaining({ routeName: 'Settings' })
    );
    expect(mocks.captureError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        component: 'Settings',
        action: 'route_crash',
        tags: {
          errorBoundary: 'route',
          recoverable: 'true',
        },
      })
    );
  });

  it('retries the same route without reloading the application shell', () => {
    const error = new Error('Temporary route failure');
    let shouldThrow = true;

    function RecoverableRoute() {
      if (shouldThrow) throw error;
      return <p>Route recovered</p>;
    }

    render(
      <RouteErrorBoundary routeName="Messages">
        <RecoverableRoute />
      </RouteErrorBoundary>
    );

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Route recovered')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

function ThrowingRoute({ error }: { error: Error }): never {
  throw error;
}
