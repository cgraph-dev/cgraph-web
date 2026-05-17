/**
 * Onboarding Page - main component
 *
 * First-time user experience with progressive profile setup.
 * Features step-by-step wizard with animated transitions.
 */

import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import { useOnboarding } from './useOnboarding';
import { ProgressBar } from './progress-bar';
import { StepHeader } from './step-header';
import { WelcomeStep } from './welcome-step';
import { CommunityStep } from './community-step';
import { InviteStep } from './invite-step';
import { AllSetStep } from './all-set-step';
import { NavigationButtons } from './navigation-buttons';
import { pageVariants } from './animations';
import { tweens } from '@/lib/animation-presets';

/**
 * Onboarding component.
 */
export default function Onboarding() {
  const {
    currentStep,
    isLoading,
    error,
    avatarPreview,
    profileData,
    handleAvatarChange,
    handleNext,
    handleBack,
    handleSkip,
    updateProfileData,
    totalSteps,
  } = useOnboarding();

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            avatarPreview={avatarPreview}
            displayName={profileData.displayName}
            onAvatarChange={handleAvatarChange}
            onDisplayNameChange={(name) => updateProfileData('displayName', name)}
          />
        );
      case 2:
        return <CommunityStep />;
      case 3:
        return <InviteStep />;
      case 4:
        return <AllSetStep />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-full w-full flex-1 items-center justify-center overflow-y-auto bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Animated Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-gradient-radial from-primary-500/10 absolute -right-1/2 -top-1/2 h-full w-full rounded-full to-transparent" />
        <div className="bg-gradient-radial from-purple-500/10 absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full to-transparent" />
      </div>

      <GlassCard variant="frosted" className="relative z-10 w-full max-w-lg" hover3D={false}>
        <div className="p-8">
          <ProgressBar currentStep={currentStep} />
          <StepHeader currentStep={currentStep} />

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${currentStep}`}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={tweens.standard}
              className="min-h-[300px]"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </div>
          )}

          <NavigationButtons
            currentStep={currentStep}
            totalSteps={totalSteps}
            isLoading={isLoading}
            onBack={handleBack}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        </div>
      </GlassCard>
    </div>
  );
}
