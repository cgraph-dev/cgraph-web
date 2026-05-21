/**
 * useReducedMotion - Respects system & app-level motion preferences
 * Returns true if animations should be disabled or reduced
 */
import { useState, useEffect } from 'react';
import { useAnimationSpeed } from '@/modules/settings/store/customization';
import {
  getReducedMotionPreference,
  subscribeReducedMotionPreference,
} from '@/lib/motion/reduced-motion';

/**
 * Hook that checks both system reduced-motion preference and
 * app-level animation intensity setting.
 *
 * @returns `true` if animations should be simplified/disabled
 *
 * Usage:
 *   const reducedMotion = useReducedMotion();
 *   <motion.div animate={reducedMotion ? {} : { scale: 1.1 }} />
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(getReducedMotionPreference);

  useEffect(() => {
    return subscribeReducedMotionPreference(() => {
      setPrefersReduced(getReducedMotionPreference());
    });
  }, []);

  return prefersReduced;
}

const SPEED_TO_INTENSITY: Record<string, number> = {
  slow: 0.5,
  normal: 1,
  fast: 1,
};

/**
 * Returns the user's animation intensity preference.
 * 0 = disabled (system reduced-motion), 0.5 = subtle (slow), 1 = full
 *
 * If system reduced motion is enabled, returns 0 regardless.
 * Reads from the customization store's animationSpeed setting.
 */
export function useAnimationIntensity(): number {
  const prefersReduced = useReducedMotion();
  const animationSpeed = useAnimationSpeed();

  if (prefersReduced) return 0;

  return SPEED_TO_INTENSITY[animationSpeed] ?? 1;
}

/**
 * Helper to conditionally apply spring or instant transition
 * based on motion preferences.
 */
export function getMotionTransition(
  reducedMotion: boolean,
  springConfig?: { damping?: number; stiffness?: number }
) {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return {
    type: 'spring' as const,
    damping: springConfig?.damping ?? 20,
    stiffness: springConfig?.stiffness ?? 200,
  };
}
