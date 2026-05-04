import { useEffect, type ReactElement } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CountryPicker } from '@/modules/auth/components/country-picker';
import { DeviceVerification } from '@/modules/auth/components/device-verification';
import { OtpEntry } from '@/modules/auth/components/otp-entry';
import { PermissionRequests } from '@/modules/auth/components/permission-requests';
import { PinEntry } from '@/modules/auth/components/pin-entry';
import { PhoneEntry } from '@/modules/auth/components/phone-entry';
import { ProfileSetup } from '@/modules/auth/components/profile-setup';
import { useAuthStore } from '@/modules/auth/store';
import {
  usePhoneRegistrationStore,
  type RegistrationStep,
} from '@/modules/auth/store/registration-store';

const registrationSteps = [
  'phone',
  'otp',
  'registration_lock',
  'device_attestation',
  'profile',
  'permissions',
] as const;

function stepLabel(step: RegistrationStep): string {
  switch (step) {
    case 'phone':
      return 'Phone';
    case 'otp':
      return 'Code';
    case 'profile':
      return 'Profile';
    case 'permissions':
      return 'Permissions';
    case 'registration_lock':
      return 'PIN';
    case 'device_attestation':
      return 'Device';
  }
}

function StepProgress({
  step,
  isPhoneLogin,
}: {
  readonly step: RegistrationStep;
  readonly isPhoneLogin: boolean;
}): ReactElement {
  const activeIndex = registrationSteps.indexOf(step);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-white/40">
        <span>{isPhoneLogin ? 'Phone login' : 'Signal-style registration'}</span>
        <span>{stepLabel(step)}</span>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {registrationSteps.map((entry, index) => (
          <div
            key={entry}
            className={`h-1.5 rounded-full transition ${
              index <= activeIndex ? 'bg-violet-400' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Phone registration page — orchestrates the multi-step Signal-style registration flow
 * (phone entry → OTP verification → registration lock if needed → profile setup → permissions).
 */
export default function PhoneRegister(): ReactElement {
  const step = usePhoneRegistrationStore((state) => state.step);
  const sessionId = usePhoneRegistrationStore((state) => state.sessionId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();
  const isPhoneLogin = location.pathname.startsWith('/login/phone');

  useEffect(() => {
    const store = usePhoneRegistrationStore.getState();
    store.reset();
    void store.loadCountries();

    return () => {
      usePhoneRegistrationStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    if (isPhoneLogin && isAuthenticated) {
      navigate('/messages', { replace: true });
    }
  }, [isAuthenticated, isPhoneLogin, navigate]);

  const handleComplete = async () => {
    const success = await usePhoneRegistrationStore.getState().completeRegistration();

    if (success) {
      navigate('/messages', { replace: true });
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <StepProgress step={step} isPhoneLogin={isPhoneLogin} />

      {step === 'phone' ? <PhoneEntry /> : null}
      {step === 'otp' ? <OtpEntry completeExistingUser={isPhoneLogin} /> : null}
      {step === 'registration_lock' ? (
        <PinEntry
          sessionId={sessionId}
          completeExistingUser={isPhoneLogin}
          onNeedHelp={() => usePhoneRegistrationStore.getState().returnToPhoneEntry()}
        />
      ) : null}
      {step === 'device_attestation' ? <DeviceVerification /> : null}
      {step === 'profile' ? <ProfileSetup /> : null}
      {step === 'permissions' ? <PermissionRequests onContinue={handleComplete} /> : null}

      <div className="border-t border-white/10 pt-4 text-center text-sm text-white/50">
        Prefer email?{' '}
        <Link
          to={isPhoneLogin ? '/login' : '/register'}
          className="text-violet-300 hover:text-violet-200"
        >
          Switch back to email {isPhoneLogin ? 'login' : 'registration'}
        </Link>
        <span className="mx-2 text-white/20">•</span>
        <Link
          to={isPhoneLogin ? '/register' : '/login'}
          className="text-violet-300 hover:text-violet-200"
        >
          {isPhoneLogin ? 'Need an account?' : 'Already have an account?'}
        </Link>
      </div>

      <CountryPicker />
    </motion.div>
  );
}
