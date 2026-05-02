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
export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--token-bg-primary)]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <svg
            className="h-12 w-12 animate-spin"
            viewBox="0 0 50 50"
            style={{ animationDuration: '1s' }}
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
          {/* Inner glow — uses theme interactive color */}
          <div className="absolute inset-3 rounded-full bg-[var(--token-interactive-primary)] opacity-[0.10]" />
        </div>

        {/* Brand text */}
        <span className="text-lg font-semibold text-[var(--token-text-secondary)]">
          CGraph
        </span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
