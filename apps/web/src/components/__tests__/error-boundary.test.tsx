import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const { mockLoggerError } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: mockLoggerError },
}));

import ErrorBoundary from '../error-boundary';

// Suppress React error boundary console errors during tests
const originalConsoleError = console.error;
beforeEach(() => {
  mockLoggerError.mockClear();
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Error Boundary')) return;
    if (typeof args[0] === 'string' && args[0].includes('The above error')) return;
    originalConsoleError(...args);
  };
  return () => {
    console.error = originalConsoleError;
  };
});

// Helper component that throws
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
    expect(screen.getByText(/unexpected error/)).toBeInTheDocument();
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

  it('renders Reload Page button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument();
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

  it('does not render Try Again or Report Issue buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.queryByRole('button', { name: 'Try Again' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Report Issue' })).toBeNull();
  });
});
