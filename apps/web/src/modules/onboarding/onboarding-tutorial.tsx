/**
 * OnboardingTutorial — floating card with post-registration tutorial checklist.
 *
 * Appears in the bottom-right corner after first login (non-modal).
 * Shows 4 checklist items with progress tracking and "Do it" links.
 * Slides in from right with spring animation after 2s delay.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircleIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { springs } from '@/lib/animation-presets';
import { useOnboardingStore } from './onboarding-store';
import { ONBOARDING_STEPS } from './onboarding-steps';
import { OnboardingChecklist } from './onboarding-checklist';

/**
 * Renders the full onboarding tutorial card and the collapsed pill.
 * Mount this in the app layout — it handles its own visibility.
 */
export function OnboardingTutorial(): React.ReactNode {
  const navigate = useNavigate();
  const {
    isVisible,
    isCompleted,
    isExpanded,
    steps,
    isLoading,
    fetchStatus,
    skipTutorial,
    toggleExpanded,
  } = useOnboardingStore();

  // Fetch onboarding status on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (isLoading || !isVisible || isCompleted) {
    return <OnboardingChecklist />;
  }

  const completedCount = ONBOARDING_STEPS.filter((s) => steps[s.key]).length;
  const totalCount = ONBOARDING_STEPS.length;

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            role="complementary"
            aria-label="Getting started tutorial"
            className="fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-xl border border-white/10 bg-[rgb(30,32,40)]/95 shadow-2xl backdrop-blur-lg"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ ...springs.gentle, delay: 2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Getting Started</h3>
                <p className="text-xs text-gray-400">
                  {completedCount} of {totalCount} completed
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleExpanded}
                  className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Collapse tutorial"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={skipTutorial}
                  className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Dismiss tutorial"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/5">
              <motion.div
                className="h-full bg-primary-500"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                transition={springs.gentle}
              />
            </div>

            {/* Steps */}
            <div className="divide-y divide-white/5">
              {ONBOARDING_STEPS.map((step) => {
                const isStepCompleted = steps[step.key];

                return (
                  <motion.div
                    key={step.key}
                    className="flex items-start gap-3 px-4 py-3"
                    layout
                    transition={springs.gentle}
                  >
                    {/* Check icon */}
                    <div className="mt-0.5 shrink-0">
                      {isStepCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={springs.gentle}
                        >
                          <CheckCircleSolidIcon className="h-5 w-5 text-green-400" />
                        </motion.div>
                      ) : (
                        <CheckCircleIcon className="h-5 w-5 text-gray-600" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isStepCompleted ? 'text-gray-500 line-through' : 'text-white'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>

                    {/* Do it link */}
                    {!isStepCompleted && (
                      <button
                        type="button"
                        onClick={() => navigate(step.navigateTo)}
                        className="shrink-0 text-xs font-medium text-primary-400 transition-colors hover:text-primary-300"
                      >
                        Do it
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 px-4 py-2">
              <button
                type="button"
                onClick={skipTutorial}
                className="text-xs text-gray-500 transition-colors hover:text-gray-400"
              >
                Skip tutorial
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed pill badge */}
      <OnboardingChecklist />
    </>
  );
}
