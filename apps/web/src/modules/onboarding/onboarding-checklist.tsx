/**
 * OnboardingChecklist — small pill/badge that shows tutorial progress.
 *
 * Shows "2/4 steps" when the main tutorial card is collapsed.
 * Click to expand the full checklist.
 */

import { motion } from 'motion/react';
import { springs } from '@/lib/animation-presets';
import { useOnboardingStore } from './onboarding-store';
import { ONBOARDING_STEPS } from './onboarding-steps';

/**
 * Renders a compact pill badge showing onboarding progress.
 * Only visible when the tutorial is active but collapsed.
 */
export function OnboardingChecklist(): React.ReactNode {
  const { isVisible, isCompleted, isExpanded, steps, toggleExpanded } = useOnboardingStore();

  if (!isVisible || isCompleted || isExpanded) return null;

  const completedCount = ONBOARDING_STEPS.filter((s) => steps[s.key]).length;
  const totalCount = ONBOARDING_STEPS.length;

  return (
    <motion.button
      type="button"
      onClick={toggleExpanded}
      className="bg-primary-600/90 fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-primary-600"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={springs.gentle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Onboarding progress: ${completedCount} of ${totalCount} steps completed`}
    >
      {/* Pulsing dot for uncompleted steps */}
      {completedCount < totalCount && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
      )}
      <span>
        {completedCount}/{totalCount} steps
      </span>
    </motion.button>
  );
}
