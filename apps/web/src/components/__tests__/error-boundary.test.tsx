import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const { mockLoggerError } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
}));

vi.mock('@/lib/logger', async () => {
  const loggerModule = await vi.importActual<typeof import('@/lib/logger')>('@/lib/logger');

  return {
    ...loggerModule,
    logger: { ...loggerModule.logger, error: mockLoggerError },
  };
});

import ErrorBoundary from '../error-boundary';

beforeEach(() => {
  mockLoggerError.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Child content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders default fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Test error');
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('displays the error message in the fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders the shared root recovery control', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: 'Reload page' })).toHaveAttribute(
      'data-cgraph-surface',
      'control'
    );
    expect(document.querySelector('[data-cgraph-surface="card"]')).toBeInTheDocument();
  });

  it('logs error via logger in componentDidCatch', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(mockLoggerError).toHaveBeenCalledOnce();
    expect(mockLoggerError.mock.calls[0]![0]).toBeInstanceOf(Error);
    expect(mockLoggerError.mock.calls[0]![0].message).toBe('Test error');
    expect(mockLoggerError.mock.calls[0]![1]).toMatchObject({ source: 'ErrorBoundary' });
  });

  it('keeps route-only recovery actions out of the root fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Report issue' })).toBeNull();
  });
});
