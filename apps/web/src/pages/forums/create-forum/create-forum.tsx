import { ArrowLeft, ArrowRight, Sparkles, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateForum } from './useCreateForum';
import { StepIndicator } from './step-indicator';
import { BasicInfoStep } from './basic-info-step';
import { AppearanceStep } from './appearance-step';
import { SettingsStep } from './settings-step';
import { ConfirmStep } from './confirm-step';

export default function CreateForum() {
  const {
    step,
    formData,
    isSubmitting,
    error,
    isAuthenticated,
    user,
    handleNameChange,
    updateFormData,
    handleSubmit,
    goToNextStep,
    goToPrevStep,
    isStep1Valid,
    navigate,
  } = useCreateForum();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <TriangleAlert className="mx-auto mb-4 h-12 w-12 text-[var(--token-status-warning)]" />
          <h2 className="mb-2 text-2xl font-bold text-[var(--token-text-primary)]">
            Login required
          </h2>
          <p className="mb-4 text-[var(--token-text-secondary)]">
            You need to be logged in to create a forum.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/login')}
          >
            Log in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="cgraph-section-surface border-b border-[var(--token-border-default)] px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <Sparkles
              className="h-8 w-8 text-[var(--token-interactive-primary)]"
              aria-hidden="true"
            />
            <h1 className="text-3xl font-bold text-[var(--token-text-primary)]">
              Create your forum
            </h1>
          </div>
          <p className="text-[var(--token-text-secondary)]">
            Build a community with boards, discussions, and moderation controls.
          </p>
        </div>
      </div>

      <StepIndicator currentStep={step} />

      <div className="mx-auto max-w-3xl px-6 py-8">
        {error && (
          <div
            className="cgraph-card mb-6 flex items-center gap-3 border border-[var(--token-feedback-error)] p-4"
            role="alert"
          >
            <TriangleAlert
              className="h-5 w-5 shrink-0 text-[var(--token-feedback-error)]"
              aria-hidden="true"
            />
            <p className="text-[var(--token-feedback-error)]">{error}</p>
          </div>
        )}

        {step === 1 && (
          <BasicInfoStep
            formData={formData}
            onNameChange={handleNameChange}
            onUpdateField={updateFormData}
          />
        )}

        {step === 2 && <AppearanceStep formData={formData} onUpdateField={updateFormData} />}

        {step === 3 && <SettingsStep formData={formData} onUpdateField={updateFormData} />}

        {step === 4 && (
          <ConfirmStep formData={formData} subscriptionTier={user?.subscription?.tier ?? 'free'} />
        )}

        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            size="lg"
            onClick={goToPrevStep}
            leftIcon={<ArrowLeft aria-hidden="true" />}
          >
            {step > 1 ? 'Previous' : 'Cancel'}
          </Button>

          {step < 4 ? (
            <Button
              size="lg"
              onClick={goToNextStep}
              disabled={step === 1 && !isStep1Valid()}
              rightIcon={<ArrowRight aria-hidden="true" />}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="success"
              size="lg"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={<Sparkles aria-hidden="true" />}
            >
              {isSubmitting ? 'Creating…' : 'Create forum'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
