/**
 * Theme Transition — smooth theme switching via View Transitions API (progressive)
 * with CSS class fallback for browsers without support.
 *
 * Uses `document.startViewTransition()` when available (Chrome 111+),
 * falls back to adding a temporary `.theme-transitioning` class.
 *
 */

const TRANSITION_MS = 200;

interface ViewTransitionCapable {
  startViewTransition: (callback: () => void) => unknown;
}

function hasViewTransitionApi(documentRef: Document): documentRef is Document & ViewTransitionCapable {
  return 'startViewTransition' in documentRef;
}

/**
 * Apply a theme switch with a smooth visual transition.
 *
 * @param applyFn - Synchronous function that applies the new theme (sets CSS vars, classes)
 * @param reduceMotion - If true, transition is instant (no animation)
 */
export function transitionTheme(applyFn: () => void, reduceMotion = false): void {
  // Instant switch when reduced motion is preferred, or SSR
  if (reduceMotion || typeof document === 'undefined') {
    applyFn();
    return;
  }

  const root = document.documentElement;

  // Progressive: View Transitions API (Chrome 111+)
  if (hasViewTransitionApi(document)) {
    document.startViewTransition(() => {
      applyFn();
    });
    return;
  }

  // Fallback: CSS transition class
  root.classList.add('theme-transitioning');
  applyFn();
  setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, TRANSITION_MS + 50);
}
