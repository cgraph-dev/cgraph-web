import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 20;

type KeyboardType = 'numeric' | 'alphanumeric';

/**
 * PIN change screen for registration lock.
 *
 * Three-step flow: enter current PIN, enter new PIN, confirm new PIN.
 * Mirrors Signal's CreateSvrPinActivity in CHANGE_FROM_SETTINGS mode.
 */
function PinChange({ onSuccess }: { readonly onSuccess?: () => void }): ReactNode {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [keyboardType, setKeyboardType] = useState<KeyboardType>('numeric');
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function currentValue(): string {
    if (step === 'current') return currentPin;
    if (step === 'new') return newPin;
    return confirmPin;
  }

  function handlePinChange(value: string): void {
    const filtered = keyboardType === 'numeric' ? value.replace(/[^0-9]/g, '') : value;
    if (step === 'current') setCurrentPin(filtered);
    else if (step === 'new') setNewPin(filtered);
    else setConfirmPin(filtered);
    setError(null);
  }

  function handleNext(): void {
    if (step === 'current') {
      if (currentPin.length < MIN_PIN_LENGTH) {
        setError(`PIN must be at least ${MIN_PIN_LENGTH} characters`);
        return;
      }
      setStep('new');
      return;
    }

    if (step === 'new') {
      if (newPin.length < MIN_PIN_LENGTH) {
        setError(`PIN must be at least ${MIN_PIN_LENGTH} characters`);
        return;
      }
      setStep('confirm');
      return;
    }

    if (confirmPin !== newPin) {
      setError('PINs do not match. Try again.');
      setConfirmPin('');
      return;
    }

    submitChange();
  }

  async function submitChange(): Promise<void> {
    setLoading(true);
    try {
      const result = await apiClient.pin.setPin({
        pin: newPin,
        current_pin: currentPin,
        keyboard_type: keyboardType,
      });
      if (result.ok) {
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setStep('current');
        onSuccess?.();
      } else {
        setError(result.error.message);
        if (result.error.code === 'WRONG_PIN' || result.status === 403) {
          setStep('current');
          setCurrentPin('');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change PIN';
      setError(message);
      logger.error('pin_change_failed', { error: message });
    } finally {
      setLoading(false);
    }
  }

  function toggleKeyboardType(): void {
    setKeyboardType((prev) => (prev === 'numeric' ? 'alphanumeric' : 'numeric'));
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setStep('current');
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      handleNext();
    }
  }

  function stepTitle(): string {
    if (step === 'current') return 'Enter current PIN';
    if (step === 'new') return 'Enter new PIN';
    return 'Confirm new PIN';
  }

  const inputType = keyboardType === 'numeric' ? 'tel' : 'text';

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 p-6">
      <h2 className="text-xl font-semibold">{stepTitle()}</h2>

      <input
        type={inputType}
        inputMode={keyboardType === 'numeric' ? 'numeric' : 'text'}
        value={currentValue()}
        onChange={(e) => handlePinChange(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_PIN_LENGTH}
        className="w-full rounded-lg border bg-transparent p-3 text-center text-2xl tracking-widest"
        autoFocus
        autoComplete="off"
        aria-label={stepTitle()}
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
        disabled={loading || currentValue().length < MIN_PIN_LENGTH}
        className="text-primary-foreground w-full rounded-lg bg-primary py-3 font-medium disabled:opacity-50"
      >
        {loading ? 'Updating...' : step === 'confirm' ? 'Change PIN' : 'Next'}
      </button>

      <button
        onClick={toggleKeyboardType}
        className="text-muted-foreground text-sm underline"
        type="button"
      >
        {keyboardType === 'numeric' ? 'Use alphanumeric PIN' : 'Use numeric PIN'}
      </button>

      {step !== 'current' ? (
        <button
          onClick={() => {
            if (step === 'confirm') {
              setStep('new');
              setConfirmPin('');
            } else {
              setStep('current');
              setNewPin('');
            }
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

export { PinChange };
