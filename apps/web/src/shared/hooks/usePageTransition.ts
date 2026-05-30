/**
 * usePageTransition Hook
 *
 * Provides animation configuration for page-level transitions.
 * Uses shared animation tokens from @cgraph-dev/animation-constants.
 *
 * @module shared/hooks/usePageTransition
 */

import { useLocation } from 'react-router-dom';
import { transitions } from '@cgraph-dev/animation-constants';

/**
 * Returns motion props and a location key for page transitions.
 *
 * @example
 * ```tsx
 * const { motionProps, locationKey } = usePageTransition();
 * return (
 *   <AnimatePresence mode="wait">
 *     <motion.div key={locationKey} {...motionProps}>{children}</motion.div>
 *   </AnimatePresence>
 * );
 * ```
 */
export function usePageTransition() {
  const location = useLocation();

  return {
    locationKey: location.pathname,
    motionProps: {
      initial: transitions.pageEnter.initial,
      animate: transitions.pageEnter.animate,
      exit: transitions.pageEnter.exit,
      transition: transitions.pageEnter.transition,
    },
  } as const;
}

export default usePageTransition;
