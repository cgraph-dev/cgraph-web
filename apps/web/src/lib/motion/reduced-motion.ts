import { themeEngine } from '@/lib/theme/theme-engine';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getReducedMotionMediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

export function getSystemReducedMotionPreference(): boolean {
  return getReducedMotionMediaQuery()?.matches ?? false;
}

export function getAppReducedMotionPreference(): boolean {
  try {
    return Boolean(themeEngine.getPreferences().settings.reduceMotion);
  } catch {
    return false;
  }
}

export function getReducedMotionPreference(): boolean {
  return getAppReducedMotionPreference() || getSystemReducedMotionPreference();
}

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
