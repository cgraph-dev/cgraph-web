import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { ErrorFallback } from '@/shared/components/error-fallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error(error, { componentStack: errorInfo.componentStack, source: 'ErrorBoundary' });

    const isChunkError =
      error.message?.includes('dynamically imported module') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch') ||
      error.name === 'ChunkLoadError';

    if (isChunkError) {
      const KEY = 'chunk_reload_ts';
      const lastReload = sessionStorage.getItem(KEY);
      const now = Date.now();

      if (!lastReload || now - Number(lastReload) > 10_000) {
        sessionStorage.setItem(KEY, String(now));
        window.location.reload();
        return;
      }
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error ?? new Error('Application failed');

      return (
        <ErrorFallback
          error={error}
          resetErrorBoundary={this.handleReload}
          componentName="Application"
          recoveryLabel="Reload page"
          showSecondaryActions={false}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
