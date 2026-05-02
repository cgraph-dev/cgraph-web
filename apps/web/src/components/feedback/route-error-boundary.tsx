import { Component, ErrorInfo, ReactNode } from 'react';
import { captureError, addBreadcrumb } from '@/lib/error-tracking';
import { routeLogger } from '@/lib/logger';
import { ErrorFallback } from '@/shared/components/error-fallback';

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    addBreadcrumb('navigation', `Route error in ${this.props.routeName || 'unknown route'}`, {
      routeName: this.props.routeName,
      componentStack: errorInfo.componentStack?.substring(0, 300),
    });

    captureError(error, {
      component: this.props.routeName || 'RouteErrorBoundary',
      action: 'route_crash',
      level: 'error',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
      tags: {
        errorBoundary: 'route',
        recoverable: 'true',
      },
    });

    this.setState({ errorId: error.message });

    if (import.meta.env.DEV) {
      routeLogger.error(`${this.props.routeName || 'Route'} crashed:`, error);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error!}
          resetErrorBoundary={this.handleRetry}
          componentName={this.props.routeName}
        />
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
