import type { ReactElement } from 'react';
import { AlertTriangle, ArrowLeft, Flag, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Card from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
  recoveryLabel?: string;
  showSecondaryActions?: boolean;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  componentName,
  recoveryLabel = 'Try again',
  showSecondaryActions = true,
}: ErrorFallbackProps): ReactElement {
  function handleGoBack(): void {
    window.history.back();
  }

  function handleReport(): void {
    const subject = encodeURIComponent(`Bug Report: ${error.name}`);
    const body = encodeURIComponent(
      [
        `Error: ${error.message}`,
        `Component: ${componentName ?? 'unknown'}`,
        `URL: ${window.location.href}`,
        `Time: ${new Date().toISOString()}`,
        `User Agent: ${navigator.userAgent}`,
      ].join('\n')
    );
    window.open(
      `mailto:support@cgraph.org?subject=${subject}&body=${body}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4 sm:p-8">
      <Card padding="lg" className="w-full max-w-lg">
        <div className="text-center" role="alert" aria-live="assertive">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--token-feedback-error)_30%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] text-[var(--token-feedback-error)]">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>

          <h2 className="text-xl font-semibold text-[var(--token-text-primary)]">
            Something went wrong
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--token-text-secondary)]">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row sm:flex-wrap">
            <Button
              onClick={resetErrorBoundary}
              leftIcon={<RotateCcw aria-hidden="true" />}
              animated={false}
              className="w-full sm:w-auto"
            >
              {recoveryLabel}
            </Button>
            {showSecondaryActions ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleGoBack}
                  leftIcon={<ArrowLeft aria-hidden="true" />}
                  animated={false}
                  className="w-full sm:w-auto"
                >
                  Go back
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleReport}
                  leftIcon={<Flag aria-hidden="true" />}
                  animated={false}
                  className="w-full sm:w-auto"
                >
                  Report issue
                </Button>
              </>
            ) : null}
          </div>

          {import.meta.env.DEV && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-xs text-[var(--token-text-muted)]">
                Error details
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] p-4 text-xs text-[var(--token-feedback-error)]">
                {error.stack ?? error.toString()}
              </pre>
            </details>
          )}
        </div>
      </Card>
    </div>
  );
}

export default ErrorFallback;
