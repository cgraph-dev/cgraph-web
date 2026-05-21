import { themeEngine } from '@/lib/theme/theme-engine';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Return the browser media-query object for reduced motion when it is available. */
function getReducedMotionMediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

/** Return whether the operating system currently requests reduced motion. */
export function getSystemReducedMotionPreference(): boolean {
  return getReducedMotionMediaQuery()?.matches ?? false;
}

/** Return whether the app/theme preference explicitly requests reduced motion. */
export function getAppReducedMotionPreference(): boolean {
  try {
    return Boolean(themeEngine.getPreferences().settings.reduceMotion);
  } catch {
    return false;
  }
}

/** Return the effective reduced-motion decision used by animation helpers. */
export function getReducedMotionPreference(): boolean {
  return getAppReducedMotionPreference() || getSystemReducedMotionPreference();
}

/** Subscribe to app/theme and OS reduced-motion preference changes. */
export function subscribeReducedMotionPreference(onChange: () => void): () => void {
  const mediaQuery = getReducedMotionMediaQuery();
  const handleChange = () => onChange();
  const unsubscribeTheme = themeEngine.subscribe(handleChange);

  mediaQuery?.addEventListener('change', handleChange);

  return () => {
    mediaQuery?.removeEventListener('change', handleChange);
    unsubscribeTheme();
  };
}
