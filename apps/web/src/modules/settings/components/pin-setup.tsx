import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 20;

type KeyboardType = 'numeric' | 'alphanumeric';

/**
 * PIN creation screen for registration lock.
 *
 * Mirrors Signal's CreateSvrPinFragment: two-step flow (enter + confirm),
 * keyboard type toggle, minimum length validation.
 *
 * Called from Settings > Security when user wants to enable registration lock.
 */
function PinSetup({ onSuccess }: { readonly onSuccess?: () => void }): ReactNode {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [keyboardType, setKeyboardType] = useState<KeyboardType>('numeric');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handlePinChange(value: string): void {
    const filtered = keyboardType === 'numeric' ? value.replace(/[^0-9]/g, '') : value;
    if (step === 'enter') {
      setPin(filtered);
    } else {
      setConfirmPin(filtered);
    }
    setError(null);
  }

  function handleNext(): void {
    if (step === 'enter') {
      if (pin.length < MIN_PIN_LENGTH) {
        setError(`PIN must be at least ${MIN_PIN_LENGTH} characters`);
        return;
      }
      setStep('confirm');
      return;
    }

    if (confirmPin !== pin) {
      setError('PINs do not match. Try again.');
      setConfirmPin('');
      return;
    }

    submitPin();
  }

  async function submitPin(): Promise<void> {
    setLoading(true);
    try {
      const result = await apiClient.pin.setPin({ pin, keyboard_type: keyboardType });
      if (result.ok) {
        setPin('');
        setConfirmPin('');
        setStep('enter');
        onSuccess?.();
      } else {
        setError(result.error.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to set PIN';
      setError(message);
      logger.error('pin_setup_failed', { error: message });
    } finally {
      setLoading(false);
    }
  }

  function toggleKeyboardType(): void {
    setKeyboardType((prev) => (prev === 'numeric' ? 'alphanumeric' : 'numeric'));
    setPin('');
    setConfirmPin('');
    setStep('enter');
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      handleNext();
    }
  }

  const inputType = keyboardType === 'numeric' ? 'tel' : 'text';
  const currentValue = step === 'enter' ? pin : confirmPin;
  const isDisabled = loading || currentValue.length < MIN_PIN_LENGTH;

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 p-6">
      <h2 className="text-xl font-semibold">
        {step === 'enter' ? 'Create a PIN' : 'Confirm your PIN'}
      </h2>

      <p className="text-muted-foreground text-center text-sm">
        {step === 'enter'
          ? 'Your PIN will be required if you re-register your phone number.'
          : 'Enter your PIN again to confirm.'}
      </p>

      <input
        type={inputType}
        inputMode={keyboardType === 'numeric' ? 'numeric' : 'text'}
        value={currentValue}
        onChange={(e) => handlePinChange(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_PIN_LENGTH}
        className="w-full rounded-lg border bg-transparent p-3 text-center text-2xl tracking-widest"
        autoFocus
        autoComplete="off"
        aria-label={step === 'enter' ? 'Enter PIN' : 'Confirm PIN'}
      />

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-destructive text-sm"
            role="alert"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <button
        onClick={handleNext}
        disabled={isDisabled}
        className="text-primary-foreground w-full rounded-lg bg-primary py-3 font-medium disabled:opacity-50"
      >
        {loading ? 'Setting PIN...' : step === 'enter' ? 'Next' : 'Confirm'}
      </button>

      <button
        onClick={toggleKeyboardType}
        className="text-muted-foreground text-sm underline"
        type="button"
      >
        {keyboardType === 'numeric' ? 'Use alphanumeric PIN' : 'Use numeric PIN'}
      </button>

      {step === 'confirm' ? (
        <button
          onClick={() => {
            setStep('enter');
            setConfirmPin('');
            setError(null);
          }}
          className="text-muted-foreground text-sm"
          type="button"
        >
          Back
        </button>
      ) : null}
    </div>
  );
}

export { PinSetup };
