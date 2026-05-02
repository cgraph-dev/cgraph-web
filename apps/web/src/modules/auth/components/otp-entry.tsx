import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { motion } from 'motion/react';
import {
  PHONE_REGISTRATION_OTP_LENGTH,
  PHONE_REGISTRATION_RETRY_SECONDS,
  PHONE_REGISTRATION_TROUBLE_HINT_SECONDS,
  applyOtpPaste,
  replaceOtpDigit,
  splitOtpCode,
} from '@cgraph/utils';
import { usePhoneRegistrationStore } from '@/modules/auth/store/registration-store';
import {
  TurnstileWidget,
  isTurnstileEnabled,
  type TurnstileWidgetHandle,
} from './turnstile-widget';

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

interface OtpEntryProps {
  readonly completeExistingUser?: boolean;
}

/**
 * OTP verification step with paste handling, resend countdown, CAPTCHA, and call fallback.
 */
export function OtpEntry({ completeExistingUser = false }: OtpEntryProps): ReactElement {
  const submittedPhoneNumber = usePhoneRegistrationStore((state) => state.submittedPhoneNumber);
  const code = usePhoneRegistrationStore((state) => state.code);
  const isSubmitting = usePhoneRegistrationStore((state) => state.isSubmitting);
  const error = usePhoneRegistrationStore((state) => state.error);
  const retryAvailableAt = usePhoneRegistrationStore((state) => state.retryAvailableAt);
  const callFallbackAvailableAt = usePhoneRegistrationStore(
    (state) => state.callFallbackAvailableAt
  );
  const codeExpiresAt = usePhoneRegistrationStore((state) => state.codeExpiresAt);
  const debugVerificationCode = usePhoneRegistrationStore((state) => state.debugVerificationCode);
  const incorrectCodeAttempts = usePhoneRegistrationStore((state) => state.incorrectCodeAttempts);
  const verificationChallenges = usePhoneRegistrationStore((state) => state.verificationChallenges);
  const requestedTransport = usePhoneRegistrationStore((state) => state.requestedTransport);
  const setCode = usePhoneRegistrationStore((state) => state.setCode);
  const resendCode = usePhoneRegistrationStore((state) => state.resendCode);
  const requestCallFallback = usePhoneRegistrationStore((state) => state.requestCallFallback);
  const verifyCode = usePhoneRegistrationStore((state) => state.verifyCode);
  const returnToPhoneEntry = usePhoneRegistrationStore((state) => state.returnToPhoneEntry);
  const [now, setNow] = useState(Date.now());
  const [shouldShake, setShouldShake] = useState(false);
  const [resendTurnstileToken, setResendTurnstileToken] = useState<string | null>(null);
  const [verifyTurnstileToken, setVerifyTurnstileToken] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmittedCodeRef = useRef('');
  const resendCaptchaRef = useRef<TurnstileWidgetHandle | null>(null);
  const verifyCaptchaRef = useRef<TurnstileWidgetHandle | null>(null);
  const captchaRequired = isTurnstileEnabled();
  const verifyCaptchaRequired =
    captchaRequired && (verificationChallenges.includes('captcha') || incorrectCodeAttempts >= 2);

  const submitVerificationCode = useCallback(
    async (turnstileToken?: string | null) => {
      if (code.length !== PHONE_REGISTRATION_OTP_LENGTH || isSubmitting) {
        return;
      }

      const submissionKey = `${code}:${completeExistingUser ? 'login' : 'register'}:${
        turnstileToken ?? ''
      }`;

      if (lastSubmittedCodeRef.current === submissionKey) {
        return;
      }

      lastSubmittedCodeRef.current = submissionKey;
      const ok = await verifyCode({ completeExistingUser, turnstileToken });

      if (!ok && turnstileToken) {
        setVerifyTurnstileToken(null);
        verifyCaptchaRef.current?.reset();
      }
    },
    [code, completeExistingUser, isSubmitting, verifyCode]
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    setShouldShake(true);
    const timeoutId = window.setTimeout(() => setShouldShake(false), 320);

    return () => window.clearTimeout(timeoutId);
  }, [error]);

  useEffect(() => {
    if (code.length !== PHONE_REGISTRATION_OTP_LENGTH) {
      lastSubmittedCodeRef.current = '';
      return;
    }

    if (verifyCaptchaRequired) {
      return;
    }

    void submitVerificationCode(null);
  }, [code, submitVerificationCode, verifyCaptchaRequired]);

  const smsRemainingSeconds = useMemo(() => {
    if (!retryAvailableAt) {
      return 0;
    }

    return Math.max(0, Math.ceil((retryAvailableAt - now) / 1000));
  }, [now, retryAvailableAt]);

  const callRemainingSeconds = useMemo(() => {
    if (!callFallbackAvailableAt) {
      return 0;
    }

    return Math.max(0, Math.ceil((callFallbackAvailableAt - now) / 1000));
  }, [callFallbackAvailableAt, now]);

  const allowSmsRetry = smsRemainingSeconds === 0;
  const allowCallFallback = Boolean(callFallbackAvailableAt) && callRemainingSeconds === 0;
  const secondsUntilExpiry = useMemo(() => {
    if (!codeExpiresAt) {
      return 0;
    }

    return Math.max(0, Math.ceil((codeExpiresAt - now) / 1000));
  }, [codeExpiresAt, now]);

  const showTroubleHint =
    incorrectCodeAttempts >= 3 ||
    Boolean(error) ||
    (Boolean(retryAvailableAt) &&
      smsRemainingSeconds <=
        PHONE_REGISTRATION_RETRY_SECONDS - PHONE_REGISTRATION_TROUBLE_HINT_SECONDS);
  const showActionButtons = Boolean(retryAvailableAt || callFallbackAvailableAt);
  const digits = splitOtpCode(code);

  const handleChange = (index: number, nextValue: string) => {
    const nextCode =
      nextValue.length > 1
        ? applyOtpPaste(code, index, nextValue)
        : replaceOtpDigit(code, index, nextValue);

    setCode(nextCode);

    const consumedDigits = nextValue.replace(/\D/g, '').length;

    if (consumedDigits > 1) {
      const nextIndex = Math.min(index + consumedDigits, PHONE_REGISTRATION_OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (nextValue.replace(/\D/g, '').length === 1 && index < PHONE_REGISTRATION_OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') {
      return;
    }

    if (digits[index]) {
      setCode(replaceOtpDigit(code, index, ''));
      return;
    }

    if (index > 0) {
      event.preventDefault();
      setCode(replaceOtpDigit(code, index - 1, ''));
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedValue = event.clipboardData.getData('text');
    const nextCode = applyOtpPaste(code, index, pastedValue);
    setCode(nextCode);
    const lastFilledIndex = Math.min(
      index + pastedValue.replace(/\D/g, '').length,
      PHONE_REGISTRATION_OTP_LENGTH - 1
    );
    inputRefs.current[lastFilledIndex]?.focus();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-white">Enter the verification code</h2>
        <p className="text-sm text-white/60">
          {requestedTransport === 'voice' ? 'We are calling' : 'We sent a text to'}{' '}
          <span className="font-medium text-white">{submittedPhoneNumber}</span>.
        </p>
      </div>

      <motion.div
        animate={shouldShake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.28 }}
        className="space-y-4"
      >
        <div className="flex justify-center gap-2 sm:gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputRefs.current[index] = node;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={(event) => handlePaste(index, event)}
              className="h-14 w-12 rounded-2xl border border-white/10 bg-white/[0.04] text-center text-2xl font-semibold text-white outline-none transition focus:border-violet-400 focus:bg-white/[0.08] sm:h-16 sm:w-14"
              aria-label={`Code digit ${index + 1}`}
              maxLength={PHONE_REGISTRATION_OTP_LENGTH}
            />
          ))}
        </div>

        <div className="space-y-1 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">
            {secondsUntilExpiry > 0
              ? `Code expires in ${formatRemaining(secondsUntilExpiry)}`
              : 'Code expired'}
          </p>

          {smsRemainingSeconds > 0 ? (
            <p className="text-xs text-white/50">
              Resend SMS available in {formatRemaining(smsRemainingSeconds)}
            </p>
          ) : null}

          {callRemainingSeconds > 0 ? (
            <p className="text-xs text-white/50">
              Call fallback available in {formatRemaining(callRemainingSeconds)}
            </p>
          ) : null}

          <p className="text-xs text-white/50">
            Last delivery method: {requestedTransport === 'voice' ? 'voice call' : 'SMS'}
          </p>

          {showTroubleHint ? <p className="text-sm text-white/55">Didn't receive a code?</p> : null}
        </div>
      </motion.div>

      {debugVerificationCode ? (
        <button
          type="button"
          onClick={() => setCode(debugVerificationCode)}
          className="w-full rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-center text-sm text-amber-100 transition hover:border-amber-200/40 hover:bg-amber-300/15"
        >
          Development code:{' '}
          <span className="font-semibold tracking-[0.24em]">{debugVerificationCode}</span>
        </button>
      ) : null}

      {verifyCaptchaRequired ? (
        <div className="space-y-3">
          <TurnstileWidget
            ref={verifyCaptchaRef}
            onTokenChange={setVerifyTurnstileToken}
            size="compact"
          />
          <button
            type="button"
            onClick={() => void submitVerificationCode(verifyTurnstileToken)}
            disabled={
              isSubmitting || !verifyTurnstileToken || code.length !== PHONE_REGISTRATION_OTP_LENGTH
            }
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Verify code
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <p className="text-center text-sm text-white/45">
        {isSubmitting
          ? 'Checking your code…'
          : verifyCaptchaRequired
            ? 'Complete the check, then verify your code.'
            : 'We verify automatically after the sixth digit.'}
      </p>

      {showActionButtons ? (
        <div className={callFallbackAvailableAt ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3'}>
          {allowSmsRetry && captchaRequired ? (
            <div className={callFallbackAvailableAt ? 'sm:col-span-2' : ''}>
              <TurnstileWidget
                ref={resendCaptchaRef}
                onTokenChange={setResendTurnstileToken}
                size="compact"
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={async () => {
              const ok = await resendCode(resendTurnstileToken);

              if (!ok) {
                resendCaptchaRef.current?.reset();
              } else {
                setResendTurnstileToken(null);
                resendCaptchaRef.current?.reset();
              }
            }}
            disabled={
              !allowSmsRetry ||
              isSubmitting ||
              (captchaRequired && allowSmsRetry && !resendTurnstileToken)
            }
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resend SMS
          </button>
          {callFallbackAvailableAt ? (
            <button
              type="button"
              onClick={() => void requestCallFallback()}
              disabled={!allowCallFallback || isSubmitting}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Call me instead
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={returnToPhoneEntry}
        className="w-full text-sm text-white/50 transition hover:text-white"
      >
        Wrong number? Go back.
      </button>
    </div>
  );
}
