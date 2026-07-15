import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from 'react';
import { normalizeCallingCodeInput } from '@cgraph-dev/utils';
import { usePhoneRegistrationStore } from '@/modules/auth/store/registration-store';
import {
  TurnstileWidget,
  isTurnstileEnabled,
  type TurnstileWidgetHandle,
} from './turnstile-widget';

function placeholderForCountry(countryCode: string | undefined): string {
  switch (countryCode) {
    case 'US':
    case 'CA':
      return '(415) 555-1234';
    case 'GB':
      return '7911 123456';
    case 'JP':
      return '90 1234 5678';
    default:
      return 'Phone number';
  }
}

/**
 * Phone number entry step — country selector trigger and local-format phone input with validation.
 */
export function PhoneEntry(): ReactElement {
  const selectedCountry = usePhoneRegistrationStore((state) => state.selectedCountry);
  const phoneNumber = usePhoneRegistrationStore((state) => state.phoneNumber);
  const isLoadingCountries = usePhoneRegistrationStore((state) => state.isLoadingCountries);
  const isSubmitting = usePhoneRegistrationStore((state) => state.isSubmitting);
  const error = usePhoneRegistrationStore((state) => state.error);
  const setPhoneNumber = usePhoneRegistrationStore((state) => state.setPhoneNumber);
  const setCountryPickerOpen = usePhoneRegistrationStore((state) => state.setCountryPickerOpen);
  const setCallingCode = usePhoneRegistrationStore((state) => state.setCallingCode);
  const requestCode = usePhoneRegistrationStore((state) => state.requestCode);
  const captchaRef = useRef<TurnstileWidgetHandle | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const captchaRequired = isTurnstileEnabled();

  const [callingCodeDraft, setCallingCodeDraft] = useState<string>(
    selectedCountry?.calling_code ?? '+1'
  );

  useEffect(() => {
    if (selectedCountry?.calling_code && selectedCountry.calling_code !== callingCodeDraft) {
      setCallingCodeDraft(selectedCountry.calling_code);
    }
    // Intentionally syncs only when the *country* changes (e.g. via picker),
    // not when the user is mid-edit on the calling-code input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry?.code]);

  const handleCallingCodeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const normalized = normalizeCallingCodeInput(event.target.value);
    setCallingCodeDraft(normalized);
    setCallingCode(normalized);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
          CGraph registration
        </p>
        <h2 className="text-2xl font-semibold text-white">Enter your phone number</h2>
        <p className="text-sm text-white/60">
          Choose your country, then enter the number people can reach you on.
        </p>
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => setCountryPickerOpen(true)}
          disabled={isLoadingCountries}
          className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-wait disabled:opacity-70"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="text-2xl">{selectedCountry?.flag ?? '🌍'}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">
                {isLoadingCountries
                  ? 'Loading countries...'
                  : (selectedCountry?.name ?? 'Choose your country')}
              </span>
              <span className="block text-xs text-white/45">
                {selectedCountry
                  ? `${selectedCountry.calling_code} • ${selectedCountry.code}`
                  : 'Country code'}
              </span>
            </span>
          </span>
          <span className="shrink-0 text-sm text-white/45">Change</span>
        </button>

        <label className="block rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
            Phone Number
          </span>
          <span className="mt-2 grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3">
            <input
              type="tel"
              inputMode="tel"
              value={callingCodeDraft}
              onChange={handleCallingCodeChange}
              aria-label="Calling code"
              className="focus:border-violet-300/50 h-10 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 text-center text-sm font-medium text-white/80 outline-none placeholder:text-white/35"
            />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder={placeholderForCountry(selectedCountry?.code)}
              className="h-10 min-w-0 bg-transparent text-lg text-white outline-none placeholder:text-white/25"
            />
          </span>
        </label>
      </div>

      <p className="text-center text-xs text-white/40">
        We format the number for your selected region and send a six-digit SMS code next.
      </p>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <TurnstileWidget ref={captchaRef} onTokenChange={setTurnstileToken} />

      <button
        type="button"
        onClick={async () => {
          const ok = await requestCode(turnstileToken);

          if (!ok) {
            captchaRef.current?.reset();
          }
        }}
        disabled={
          isSubmitting ||
          isLoadingCountries ||
          !selectedCountry ||
          (captchaRequired && !turnstileToken)
        }
        className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Sending code…' : 'Next'}
      </button>
    </div>
  );
}
