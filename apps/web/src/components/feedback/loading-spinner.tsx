/**
 * LoadingSpinner - Theme-aware full-page loading spinner
 *
 * Adapts to the active theme via CSS custom properties.
 * Aurora = purple gradient, Dark = lime brand, Light = deep lime.
 *
 */

/**
 * Loading Spinner — theme-aware loading placeholder.
 */
function SpinnerMark() {
  return (
    <div className="relative h-12 w-12">
      <svg
        className="h-12 w-12 animate-spin"
        viewBox="0 0 50 50"
        style={{ animationDuration: '1s' }}
        aria-hidden="true"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="var(--token-interactive-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="80 45"
          opacity="0.85"
        />
      </svg>
      <div className="absolute inset-3 rounded-full bg-[var(--token-interactive-primary)] opacity-[0.10]" />
    </div>
  );
}

export function InlineLoadingSpinner() {
  return (
    <span role="status" aria-label="Loading" className="inline-flex">
      <SpinnerMark />
    </span>
  );
}

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--token-bg-primary)]">
      <div className="flex flex-col items-center gap-4">
        <SpinnerMark />

        {/* Brand text */}
        <span className="text-lg font-semibold text-[var(--token-text-secondary)]">
          CGraph
        </span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
