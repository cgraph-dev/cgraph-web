import { useState, useEffect } from 'react';

/** Detects system high-contrast preference and manages `.high-contrast` class on `<html>`. */
export function useHighContrast(): boolean {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(forced-colors: active)').matches ||
      window.matchMedia('(prefers-contrast: more)').matches
    );
  });

  useEffect(() => {
    const forcedColors = window.matchMedia('(forced-colors: active)');
    const prefersMore = window.matchMedia('(prefers-contrast: more)');

    function update() {
      const enabled = forcedColors.matches || prefersMore.matches;
      setIsHighContrast(enabled);
      document.documentElement.classList.toggle('high-contrast', enabled);
    }

    update();

    forcedColors.addEventListener('change', update);
    prefersMore.addEventListener('change', update);

    return () => {
      forcedColors.removeEventListener('change', update);
      prefersMore.removeEventListener('change', update);
    };
  }, []);

  return isHighContrast;
}
