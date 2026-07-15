import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Country, Tokens } from '@cgraph-dev/api-client';
import {
  PHONE_REGISTRATION_CODE_EXPIRY_SECONDS,
  PHONE_REGISTRATION_OTP_LENGTH,
  PHONE_REGISTRATION_RETRY_SECONDS,
  clampOtpDigits,
  findCountryByCallingCode,
  formatPhoneEntryValue,
  isPlausiblePhoneNumber,
  normalizePhoneNumber as normalizePhoneToE164,
} from '@cgraph-dev/utils';
import { apiClient, http } from '@/lib/api-client';
import { safeSessionStorage } from '@/lib/safeStorage';
import { useAuthStore } from './authStore.impl';
import { getApiErrorMessage, mapUserFromApi } from './authStore.utils';
import { resolvePhoneCountries } from './fallback-countries';

export type RegistrationStep = 'phone' | 'otp' | 'registration_lock' | 'profile' | 'permissions';
export type PermissionState = 'idle' | 'granted' | 'denied' | 'unsupported' | 'skipped';
export type PhoneRegistrationIntent = 'register' | 'login';
type DeliveryTransport = 'sms' | 'voice';

export const PHONE_REGISTRATION_STORAGE_KEY = 'cgraph-phone-registration-v1';
const PHONE_REGISTRATION_STORAGE_VERSION = 1;

type AuthenticatedRegistrationStep = Exclude<
  RegistrationStep,
  'phone' | 'otp' | 'registration_lock'
>;

interface PendingAuthState {
  readonly user: Record<string, unknown>;
  readonly tokens: Tokens;
  readonly isNewUser: boolean;
}

interface ProfileDraft {
  readonly displayName: string;
  readonly username: string;
}

interface PhoneRegistrationState {
  readonly intent: PhoneRegistrationIntent | null;
  readonly step: RegistrationStep;
  readonly countries: Country[];
  readonly selectedCountry: Country | null;
  readonly isCountryPickerOpen: boolean;
  readonly isLoadingCountries: boolean;
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly phoneNumber: string;
  readonly submittedPhoneNumber: string;
  readonly code: string;
  readonly requestedTransport: DeliveryTransport;
  readonly retryAvailableAt: number | null;
  readonly callFallbackAvailableAt: number | null;
  readonly nextVerificationAttemptAt: number | null;
  readonly allowedToRequestCode: boolean;
  readonly codeExpiresAt: number | null;
  readonly debugVerificationCode: string | null;
  readonly incorrectCodeAttempts: number;
  readonly sessionId: string | null;
  readonly pendingChallenges: string[];
  readonly verificationChallenges: string[];
  readonly pendingAuth: PendingAuthState | null;
  readonly profile: ProfileDraft;
  readonly contactsPermission: PermissionState;
  readonly notificationsPermission: PermissionState;
  readonly prepareFlow: (intent: PhoneRegistrationIntent) => void;
  readonly setPhoneNumber: (value: string) => void;
  readonly setCode: (value: string) => void;
  readonly setProfileField: (field: keyof ProfileDraft, value: string) => void;
  readonly setCountryPickerOpen: (isOpen: boolean) => void;
  readonly selectCountry: (country: Country) => void;
  readonly setCallingCode: (value: string) => boolean;
  readonly loadCountries: () => Promise<void>;
  readonly requestCode: (turnstileToken?: string | null) => Promise<boolean>;
  readonly resendCode: (turnstileToken?: string | null) => Promise<boolean>;
  readonly requestCallFallback: () => Promise<boolean>;
  readonly verifyCode: (options?: {
    readonly completeExistingUser?: boolean;
    readonly turnstileToken?: string | null;
  }) => Promise<boolean>;
  readonly completeRegistrationLock: (
    payload: {
      readonly user: unknown;
      readonly tokens?: Tokens | null;
      readonly is_new_user: boolean;
      readonly next_step?: string | null;
      readonly session_id?: string | null;
    },
    options?: { readonly completeExistingUser?: boolean }
  ) => Promise<boolean>;
  readonly submitProfile: (avatarUpload?: FormData | null) => Promise<boolean>;
  readonly refreshPermissionStates: () => Promise<void>;
  readonly requestContactsPermission: () => Promise<PermissionState>;
  readonly skipContactsPermission: () => void;
  readonly requestNotificationsPermission: () => Promise<PermissionState>;
  readonly skipNotificationsPermission: () => void;
  readonly completeRegistration: () => Promise<boolean>;
  readonly returnToPhoneEntry: () => void;
  readonly reset: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function defaultCountry(countries: Country[]): Country | null {
  if (countries.length === 0) {
    return null;
  }

  const locale = typeof navigator === 'undefined' ? null : navigator.language;
  const localeRegion = locale?.split('-')[1]?.toUpperCase();

  if (localeRegion) {
    const matchedCountry = countries.find((country) => country.code === localeRegion);

    if (matchedCountry) {
      return matchedCountry;
    }
  }

  return countries.find((country) => country.code === 'US') ?? countries[0] ?? null;
}

function extractWrappedRecord(payload: unknown): Record<string, unknown> | null {
  if (isRecord(payload) && 'data' in payload && isRecord(payload.data)) {
    return payload.data;
  }

  return isRecord(payload) ? payload : null;
}

function userNeedsProfile(user: Record<string, unknown>, isNewUser: boolean): boolean {
  if (isNewUser) {
    return true;
  }

  const displayName = isString(user.display_name) ? user.display_name.trim() : '';
  return displayName.length < 2;
}

function resolveAuthenticatedStep(
  user: Record<string, unknown>,
  isNewUser: boolean,
  nextStep?: string | null
): AuthenticatedRegistrationStep {
  if (nextStep === 'profile' || nextStep === 'permissions') {
    return nextStep;
  }

  return userNeedsProfile(user, isNewUser) ? 'profile' : 'permissions';
}

function buildProfileDraft(user: Record<string, unknown>): ProfileDraft {
  return {
    displayName: isString(user.display_name) ? user.display_name : '',
    username: isString(user.username) ? user.username : '',
  };
}

function commitPhoneAuth(pendingAuth: PendingAuthState): void {
  useAuthStore.setState({
    user: mapUserFromApi(pendingAuth.user),
    token: pendingAuth.tokens.access_token,
    refreshToken: pendingAuth.tokens.refresh_token,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
}

function formatWaitError(prefix: string, availableAt: number | null): string {
  if (!availableAt) {
    return prefix;
  }

  const remainingSeconds = Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
  return `${prefix} Try again in ${remainingSeconds}s.`;
}

function formatChallengeError(challenges: readonly string[]): string {
  if (challenges.includes('captcha')) {
    return 'Complete the CAPTCHA challenge before requesting another code.';
  }

  if (challenges.includes('push')) {
    return 'Complete the push verification challenge before requesting another code.';
  }

  return 'Additional verification is required before requesting another code.';
}

const nativeDeviceRequiredMessage =
  'This phone sign-in requires native device verification. Open CGraph on mobile or desktop, or switch back to email on web.';

interface PhoneSessionLike {
  readonly session_id?: string | null;
  readonly transport?: string | null;
  readonly expires_in?: number | null;
  readonly retry_after?: number | null;
  readonly call_fallback_available_after?: number | null;
  readonly next_sms_after?: number | null;
  readonly next_call_after?: number | null;
  readonly voice_available?: boolean | null;
  readonly next_verification_attempt?: number | null;
  readonly allowed_to_request_code?: boolean | null;
  readonly verified?: boolean | null;
  readonly challenges?: readonly string[] | null;
  readonly debug_verification_code?: string | null;
}

interface PhoneSessionTimings {
  readonly requestedTransport: DeliveryTransport;
  readonly retryAvailableAt: number;
  readonly callFallbackAvailableAt: number | null;
  readonly nextVerificationAttemptAt: number | null;
  readonly codeExpiresAt: number;
  readonly sessionId: string | null;
  readonly debugVerificationCode: string | null;
  readonly pendingChallenges: string[];
  readonly allowedToRequestCode: boolean;
  readonly challengeMessage: string | null;
}

function deriveSessionTimings(payload: PhoneSessionLike): PhoneSessionTimings {
  const now = Date.now();
  const expiresInSeconds = payload.expires_in ?? PHONE_REGISTRATION_CODE_EXPIRY_SECONDS;
  const nextSmsSeconds =
    payload.next_sms_after ?? payload.retry_after ?? PHONE_REGISTRATION_RETRY_SECONDS;
  const voiceAvailable = payload.voice_available !== false;
  const nextCallSeconds = voiceAvailable
    ? (payload.next_call_after ??
      payload.call_fallback_available_after ??
      PHONE_REGISTRATION_RETRY_SECONDS)
    : null;
  const verificationRetrySeconds = payload.next_verification_attempt ?? null;
  const requestedTransport: DeliveryTransport = payload.transport === 'voice' ? 'voice' : 'sms';
  const pendingChallenges = payload.challenges ? Array.from(payload.challenges) : [];
  const allowedToRequestCode = payload.allowed_to_request_code !== false;

  return {
    requestedTransport,
    retryAvailableAt: now + nextSmsSeconds * 1000,
    callFallbackAvailableAt: nextCallSeconds === null ? null : now + nextCallSeconds * 1000,
    nextVerificationAttemptAt:
      verificationRetrySeconds === null ? null : now + verificationRetrySeconds * 1000,
    codeExpiresAt: now + expiresInSeconds * 1000,
    sessionId: payload.session_id ?? null,
    debugVerificationCode: payload.debug_verification_code ?? null,
    pendingChallenges,
    allowedToRequestCode,
    challengeMessage: pendingChallenges.length > 0 ? formatChallengeError(pendingChallenges) : null,
  };
}

function extractChallengeList(details: unknown): string[] {
  if (!isRecord(details) || !Array.isArray(details.challenges)) {
    return [];
  }

  return details.challenges.filter(
    (challenge): challenge is string => typeof challenge === 'string'
  );
}

type ContactsSelectFn = (
  properties: readonly string[],
  options?: { readonly multiple?: boolean }
) => Promise<unknown>;

function getContactsSelectFunction(): ContactsSelectFn | null {
  if (typeof navigator === 'undefined' || !('contacts' in navigator)) {
    return null;
  }

  const contactsCandidate = Reflect.get(navigator, 'contacts');

  if (!isRecord(contactsCandidate)) {
    return null;
  }

  const selectCandidate = Reflect.get(contactsCandidate, 'select');

  if (typeof selectCandidate !== 'function') {
    return null;
  }

  return (properties, options) => {
    const maybePromise = Reflect.apply(selectCandidate, contactsCandidate, [properties, options]);

    if (maybePromise instanceof Promise) {
      return maybePromise;
    }

    return Promise.resolve(maybePromise);
  };
}

function hasContactsPickerSupport(): boolean {
  return getContactsSelectFunction() !== null;
}

const initialState = {
  intent: null,
  step: 'phone',
  countries: [],
  selectedCountry: null,
  isCountryPickerOpen: false,
  isLoadingCountries: false,
  isSubmitting: false,
  error: null,
  phoneNumber: '',
  submittedPhoneNumber: '',
  code: '',
  requestedTransport: 'sms',
  retryAvailableAt: null,
  callFallbackAvailableAt: null,
  nextVerificationAttemptAt: null,
  allowedToRequestCode: true,
  codeExpiresAt: null,
  debugVerificationCode: null,
  incorrectCodeAttempts: 0,
  sessionId: null,
  pendingChallenges: [],
  verificationChallenges: [],
  pendingAuth: null,
  profile: {
    displayName: '',
    username: '',
  },
  contactsPermission: 'idle',
  notificationsPermission: 'idle',
} satisfies Omit<
  PhoneRegistrationState,
  | 'setPhoneNumber'
  | 'prepareFlow'
  | 'setCode'
  | 'setProfileField'
  | 'setCountryPickerOpen'
  | 'selectCountry'
  | 'setCallingCode'
  | 'loadCountries'
  | 'requestCode'
  | 'resendCode'
  | 'requestCallFallback'
  | 'verifyCode'
  | 'completeRegistrationLock'
  | 'submitProfile'
  | 'refreshPermissionStates'
  | 'requestContactsPermission'
  | 'skipContactsPermission'
  | 'requestNotificationsPermission'
  | 'skipNotificationsPermission'
  | 'completeRegistration'
  | 'returnToPhoneEntry'
  | 'reset'
>;

function validTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function validStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function validCountry(value: unknown): Country | null {
  if (!isRecord(value)) {
    return null;
  }

  const { code, name, calling_code: callingCode, flag } = value;

  if (
    typeof code !== 'string' ||
    typeof name !== 'string' ||
    typeof callingCode !== 'string' ||
    !/^\+[1-9]\d{0,3}$/.test(callingCode)
  ) {
    return null;
  }

  return {
    code,
    name,
    calling_code: callingCode,
    ...(typeof flag === 'string' ? { flag } : {}),
  };
}

function phoneRegistrationCheckpoint(
  state: PhoneRegistrationState
): Partial<PhoneRegistrationState> {
  if (
    (state.step !== 'otp' && state.step !== 'registration_lock') ||
    !state.intent ||
    !state.sessionId ||
    !state.submittedPhoneNumber ||
    !state.codeExpiresAt ||
    !state.selectedCountry
  ) {
    return {};
  }

  return {
    intent: state.intent,
    step: state.step,
    selectedCountry: state.selectedCountry,
    phoneNumber: state.phoneNumber,
    submittedPhoneNumber: state.submittedPhoneNumber,
    requestedTransport: state.requestedTransport,
    retryAvailableAt: state.retryAvailableAt,
    callFallbackAvailableAt: state.callFallbackAvailableAt,
    nextVerificationAttemptAt: state.nextVerificationAttemptAt,
    allowedToRequestCode: state.allowedToRequestCode,
    codeExpiresAt: state.codeExpiresAt,
    incorrectCodeAttempts: state.incorrectCodeAttempts,
    sessionId: state.sessionId,
    pendingChallenges: state.pendingChallenges,
    verificationChallenges: state.verificationChallenges,
  };
}

function restorePhoneRegistrationCheckpoint(value: unknown): Partial<PhoneRegistrationState> {
  if (!isRecord(value)) {
    return {};
  }

  const intent = value.intent;
  const step = value.step;
  const sessionId = value.sessionId;
  const submittedPhoneNumber = value.submittedPhoneNumber;
  const codeExpiresAt = validTimestamp(value.codeExpiresAt);
  const selectedCountry = validCountry(value.selectedCountry);

  if (
    (intent !== 'register' && intent !== 'login') ||
    (step !== 'otp' && step !== 'registration_lock') ||
    typeof sessionId !== 'string' ||
    sessionId.trim().length === 0 ||
    typeof submittedPhoneNumber !== 'string' ||
    !/^\+[1-9]\d{1,14}$/.test(submittedPhoneNumber) ||
    !selectedCountry ||
    !codeExpiresAt ||
    codeExpiresAt <= Date.now()
  ) {
    return {};
  }

  const incorrectCodeAttempts = value.incorrectCodeAttempts;

  return {
    intent,
    step,
    selectedCountry,
    phoneNumber: typeof value.phoneNumber === 'string' ? value.phoneNumber : '',
    submittedPhoneNumber,
    requestedTransport: value.requestedTransport === 'voice' ? 'voice' : 'sms',
    retryAvailableAt: validTimestamp(value.retryAvailableAt),
    callFallbackAvailableAt: validTimestamp(value.callFallbackAvailableAt),
    nextVerificationAttemptAt: validTimestamp(value.nextVerificationAttemptAt),
    allowedToRequestCode: value.allowedToRequestCode !== false,
    codeExpiresAt,
    incorrectCodeAttempts:
      typeof incorrectCodeAttempts === 'number' && Number.isInteger(incorrectCodeAttempts)
        ? Math.max(0, incorrectCodeAttempts)
        : 0,
    sessionId,
    pendingChallenges: validStringList(value.pendingChallenges),
    verificationChallenges: validStringList(value.verificationChallenges),
    code: '',
    debugVerificationCode: null,
    pendingAuth: null,
    error: null,
    isSubmitting: false,
  };
}

const createPhoneRegistrationState: StateCreator<PhoneRegistrationState> = (set, get) => ({
  ...initialState,

  prepareFlow: (intent) => {
    const state = get();

    if (state.intent === intent) {
      return;
    }

    if (state.intent === null) {
      set({ intent });
      return;
    }

    set({
      ...initialState,
      intent,
      countries: state.countries,
      selectedCountry: state.selectedCountry,
    });
  },

  setPhoneNumber: (value) =>
    set((state) => ({
      phoneNumber: formatPhoneEntryValue(value, state.selectedCountry?.code ?? null),
      error: null,
    })),
  setCode: (value) => set({ code: clampOtpDigits(value), error: null }),
  setProfileField: (field, value) =>
    set((state) => ({
      profile: {
        ...state.profile,
        [field]: value,
      },
      error: null,
    })),
  setCountryPickerOpen: (isOpen) => set({ isCountryPickerOpen: isOpen }),
  selectCountry: (country) =>
    set((state) => ({
      selectedCountry: country,
      isCountryPickerOpen: false,
      phoneNumber: formatPhoneEntryValue(state.phoneNumber, country.code),
      error: null,
    })),
  setCallingCode: (value) => {
    const matched = findCountryByCallingCode(value, get().countries);

    if (!matched || matched.code === get().selectedCountry?.code) {
      return Boolean(matched);
    }

    set((state) => ({
      selectedCountry: matched,
      phoneNumber: formatPhoneEntryValue(state.phoneNumber, matched.code),
      error: null,
    }));

    return true;
  },

  loadCountries: async () => {
    if (get().countries.length > 0) {
      return;
    }

    set({ isLoadingCountries: true, error: null });

    const result = await apiClient.auth.phoneCountries();

    if (!result.ok) {
      const countries = resolvePhoneCountries([]);
      set({
        countries,
        selectedCountry: get().selectedCountry ?? defaultCountry(countries),
        isLoadingCountries: false,
        error: null,
      });
      return;
    }

    const countries = resolvePhoneCountries(result.data.countries);

    set({
      countries,
      selectedCountry: get().selectedCountry ?? defaultCountry(countries),
      isLoadingCountries: false,
    });
  },

  requestCode: async (turnstileToken) => {
    const selectedCountry = get().selectedCountry;
    const normalizedPhoneNumber = normalizePhoneToE164(get().phoneNumber, selectedCountry);

    if (
      !selectedCountry ||
      !normalizedPhoneNumber ||
      !isPlausiblePhoneNumber(get().phoneNumber, selectedCountry)
    ) {
      set({ error: 'Enter a valid phone number to continue.' });
      return false;
    }

    set({ isSubmitting: true, error: null });

    const result = await apiClient.auth.phoneRequestCode(
      normalizedPhoneNumber,
      selectedCountry.code,
      turnstileToken
    );

    if (!result.ok) {
      set({ isSubmitting: false, error: result.error.message });
      return false;
    }

    const timings = deriveSessionTimings(result.data);

    set({
      isSubmitting: false,
      submittedPhoneNumber: normalizedPhoneNumber,
      code: '',
      step: 'otp',
      requestedTransport: timings.requestedTransport,
      retryAvailableAt: timings.retryAvailableAt,
      callFallbackAvailableAt: timings.callFallbackAvailableAt,
      nextVerificationAttemptAt: timings.nextVerificationAttemptAt,
      allowedToRequestCode: timings.allowedToRequestCode,
      codeExpiresAt: timings.codeExpiresAt,
      debugVerificationCode: timings.debugVerificationCode,
      incorrectCodeAttempts: 0,
      sessionId: timings.sessionId,
      pendingChallenges: timings.pendingChallenges,
      verificationChallenges: [],
      error: timings.challengeMessage,
    });

    return true;
  },

  resendCode: async (turnstileToken) => {
    const {
      submittedPhoneNumber,
      selectedCountry,
      retryAvailableAt,
      allowedToRequestCode,
      pendingChallenges,
    } = get();

    if (!allowedToRequestCode && pendingChallenges.length > 0) {
      set({ error: formatChallengeError(pendingChallenges) });
      return false;
    }

    if (retryAvailableAt && retryAvailableAt > Date.now()) {
      set({ error: formatWaitError('You requested a code too recently.', retryAvailableAt) });
      return false;
    }

    if (!submittedPhoneNumber || !selectedCountry) {
      set({ error: 'Enter your phone number again.' });
      return false;
    }

    set({ isSubmitting: true, error: null });

    const result = await apiClient.auth.phoneRequestCode(
      submittedPhoneNumber,
      selectedCountry.code,
      turnstileToken
    );

    if (!result.ok) {
      set({ isSubmitting: false, error: result.error.message });
      return false;
    }

    const timings = deriveSessionTimings(result.data);

    set({
      isSubmitting: false,
      requestedTransport: timings.requestedTransport,
      retryAvailableAt: timings.retryAvailableAt,
      callFallbackAvailableAt: timings.callFallbackAvailableAt,
      nextVerificationAttemptAt: timings.nextVerificationAttemptAt,
      allowedToRequestCode: timings.allowedToRequestCode,
      codeExpiresAt: timings.codeExpiresAt,
      debugVerificationCode: timings.debugVerificationCode,
      code: '',
      incorrectCodeAttempts: 0,
      sessionId: timings.sessionId ?? get().sessionId,
      pendingChallenges: timings.pendingChallenges,
      verificationChallenges: [],
      error: timings.challengeMessage,
    });

    return true;
  },

  requestCallFallback: async () => {
    const {
      submittedPhoneNumber,
      callFallbackAvailableAt,
      allowedToRequestCode,
      pendingChallenges,
    } = get();

    if (!allowedToRequestCode && pendingChallenges.length > 0) {
      set({ error: formatChallengeError(pendingChallenges) });
      return false;
    }

    if (callFallbackAvailableAt && callFallbackAvailableAt > Date.now()) {
      set({
        error: formatWaitError('Call fallback is not available yet.', callFallbackAvailableAt),
      });
      return false;
    }

    if (!submittedPhoneNumber) {
      set({ error: 'Enter your phone number again.' });
      return false;
    }

    set({ isSubmitting: true, error: null });

    const result = await apiClient.auth.phoneCallFallback(submittedPhoneNumber);

    if (!result.ok) {
      set({ isSubmitting: false, error: result.error.message });
      return false;
    }

    const timings = deriveSessionTimings(result.data);

    set({
      isSubmitting: false,
      requestedTransport: 'voice',
      retryAvailableAt: timings.retryAvailableAt,
      callFallbackAvailableAt: timings.callFallbackAvailableAt,
      nextVerificationAttemptAt: timings.nextVerificationAttemptAt,
      allowedToRequestCode: timings.allowedToRequestCode,
      codeExpiresAt: timings.codeExpiresAt,
      debugVerificationCode: timings.debugVerificationCode,
      code: '',
      incorrectCodeAttempts: 0,
      sessionId: timings.sessionId ?? get().sessionId,
      pendingChallenges: timings.pendingChallenges,
      verificationChallenges: [],
      error: timings.challengeMessage,
    });

    return true;
  },

  verifyCode: async (options) => {
    const { submittedPhoneNumber, code, sessionId } = get();

    if (!submittedPhoneNumber || clampOtpDigits(code).length !== PHONE_REGISTRATION_OTP_LENGTH) {
      set({ error: 'Enter the 6-digit code we sent you.' });
      return false;
    }

    set({ isSubmitting: true, error: null });

    const result = await apiClient.auth.phoneVerifyCode(
      submittedPhoneNumber,
      code.trim(),
      sessionId,
      options?.turnstileToken
    );

    if (!result.ok) {
      const isInvalidCode = result.error.code === 'INVALID_CODE';
      const nextAttempts = isInvalidCode
        ? get().incorrectCodeAttempts + 1
        : get().incorrectCodeAttempts;
      const errorChallenges = extractChallengeList(result.error.details);
      const verificationChallenges =
        result.error.code === 'CAPTCHA_REQUIRED' || result.error.code === 'CAPTCHA_FAILED'
          ? ['captcha']
          : errorChallenges;

      set({
        isSubmitting: false,
        error: result.error.message,
        incorrectCodeAttempts: nextAttempts,
        verificationChallenges,
      });
      return false;
    }

    const nextUser = extractWrappedRecord(result.data.user);

    if (!nextUser) {
      set({ isSubmitting: false, error: 'Unable to read the phone verification response.' });
      return false;
    }

    if (result.data.next_step === 'registration_lock') {
      set({
        isSubmitting: false,
        step: 'registration_lock',
        sessionId: result.data.session_id ?? get().sessionId,
        pendingAuth: null,
        debugVerificationCode: null,
        incorrectCodeAttempts: 0,
        pendingChallenges: [],
        verificationChallenges: [],
        error: null,
      });

      return true;
    }

    if (result.data.next_step === 'device_attestation') {
      set({
        isSubmitting: false,
        sessionId: result.data.session_id ?? get().sessionId,
        pendingAuth: null,
        debugVerificationCode: null,
        incorrectCodeAttempts: 0,
        pendingChallenges: [],
        verificationChallenges: [],
        error: nativeDeviceRequiredMessage,
      });

      return false;
    }

    if (!result.data.tokens) {
      set({ isSubmitting: false, error: 'Unable to continue registration right now.' });
      return false;
    }

    const step = resolveAuthenticatedStep(nextUser, result.data.is_new_user, result.data.next_step);
    const pendingAuth = {
      user: nextUser,
      tokens: result.data.tokens,
      isNewUser: result.data.is_new_user,
    };

    if (!result.data.is_new_user && options?.completeExistingUser) {
      commitPhoneAuth(pendingAuth);

      set({
        ...initialState,
        countries: get().countries,
        selectedCountry: get().selectedCountry,
      });

      return true;
    }

    set({
      isSubmitting: false,
      pendingAuth,
      profile: buildProfileDraft(nextUser),
      step,
      debugVerificationCode: null,
      incorrectCodeAttempts: 0,
      pendingChallenges: [],
      verificationChallenges: [],
      contactsPermission: 'unsupported',
      error: null,
    });

    if (step === 'permissions') {
      await get().refreshPermissionStates();
    }

    return true;
  },

  completeRegistrationLock: async (payload, options) => {
    if (payload.next_step === 'device_attestation') {
      set({
        sessionId: payload.session_id ?? get().sessionId,
        pendingAuth: null,
        debugVerificationCode: null,
        incorrectCodeAttempts: 0,
        pendingChallenges: [],
        verificationChallenges: [],
        error: nativeDeviceRequiredMessage,
      });

      return false;
    }

    if (!payload.tokens) {
      set({ error: 'Unable to continue registration right now.' });
      return false;
    }

    const nextUser = extractWrappedRecord(payload.user);

    if (!nextUser) {
      set({ error: 'Unable to read the PIN verification response.' });
      return false;
    }

    const step = resolveAuthenticatedStep(nextUser, payload.is_new_user, payload.next_step);
    const pendingAuth = {
      user: nextUser,
      tokens: payload.tokens,
      isNewUser: payload.is_new_user,
    };

    if (!payload.is_new_user && options?.completeExistingUser) {
      commitPhoneAuth(pendingAuth);

      set({
        ...initialState,
        countries: get().countries,
        selectedCountry: get().selectedCountry,
      });

      return true;
    }

    set({
      pendingAuth,
      profile: buildProfileDraft(nextUser),
      step,
      sessionId: payload.session_id ?? get().sessionId,
      debugVerificationCode: null,
      incorrectCodeAttempts: 0,
      pendingChallenges: [],
      verificationChallenges: [],
      error: null,
    });

    if (step === 'permissions') {
      await get().refreshPermissionStates();
    }

    return true;
  },

  submitProfile: async (avatarUpload) => {
    const { pendingAuth, profile } = get();
    const displayName = profile.displayName.trim();
    const username = profile.username.trim();

    if (!pendingAuth) {
      set({ error: 'Verify your code before updating your profile.' });
      return false;
    }

    if (displayName.length < 1 || displayName.length > 64) {
      set({ error: 'Add the name people will see on your account.' });
      return false;
    }

    if (username && !/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      set({ error: 'Username must be 3-32 characters and use letters, numbers, or underscores.' });
      return false;
    }

    set({ isSubmitting: true, error: null });

    try {
      let latestUser = pendingAuth.user;

      if (avatarUpload) {
        const avatarResponse = await http.post('/api/v1/me/avatar', avatarUpload, {
          headers: {
            Authorization: `Bearer ${pendingAuth.tokens.access_token}`,
          },
        });

        const uploadedUser = extractWrappedRecord(avatarResponse.data);

        if (uploadedUser) {
          latestUser = uploadedUser;
        }
      }

      const response = await http.put(
        '/api/v1/me',
        {
          user: {
            display_name: displayName,
            ...(username ? { username } : {}),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${pendingAuth.tokens.access_token}`,
          },
        }
      );

      const updatedUser = extractWrappedRecord(response.data);

      if (!updatedUser) {
        set({ isSubmitting: false, error: 'Unable to save your profile right now.' });
        return false;
      }

      await get().refreshPermissionStates();

      set({
        isSubmitting: false,
        pendingAuth: {
          ...pendingAuth,
          user: {
            ...latestUser,
            ...updatedUser,
          },
        },
        step: 'permissions',
      });

      return true;
    } catch (error: unknown) {
      set({
        isSubmitting: false,
        error: getApiErrorMessage(error, 'Unable to save your profile right now.'),
      });

      return false;
    }
  },

  refreshPermissionStates: async () => {
    const nextNotificationsPermission =
      typeof window === 'undefined' || !('Notification' in window)
        ? 'unsupported'
        : mapNotificationPermission(window.Notification.permission);

    const contactsSupported = hasContactsPickerSupport();

    set((state) => ({
      contactsPermission: contactsSupported
        ? state.contactsPermission === 'granted' ||
          state.contactsPermission === 'denied' ||
          state.contactsPermission === 'skipped'
          ? state.contactsPermission
          : 'idle'
        : 'unsupported',
      notificationsPermission: nextNotificationsPermission,
    }));
  },

  requestContactsPermission: async () => {
    const contactsSelect = getContactsSelectFunction();

    if (!contactsSelect) {
      set({ contactsPermission: 'unsupported' });
      return 'unsupported';
    }

    try {
      await contactsSelect(['name', 'tel'], { multiple: true });
      set({ contactsPermission: 'granted' });
      return 'granted';
    } catch (error: unknown) {
      const errorName = isRecord(error) && isString(error.name) ? error.name : '';

      if (errorName === 'AbortError') {
        set({ contactsPermission: 'skipped' });
        return 'skipped';
      }

      set({ contactsPermission: 'denied' });
      return 'denied';
    }
  },

  skipContactsPermission: () => set({ contactsPermission: 'skipped' }),

  requestNotificationsPermission: async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      set({ notificationsPermission: 'unsupported' });
      return 'unsupported';
    }

    const currentPermission = mapNotificationPermission(window.Notification.permission);

    if (currentPermission !== 'idle') {
      set({ notificationsPermission: currentPermission });
      return currentPermission;
    }

    const permission = await window.Notification.requestPermission();

    if (permission === 'granted') {
      set({ notificationsPermission: 'granted' });
      return 'granted';
    }

    const nextState = permission === 'denied' ? 'denied' : 'skipped';
    set({ notificationsPermission: nextState });
    return nextState;
  },

  skipNotificationsPermission: () => set({ notificationsPermission: 'skipped' }),

  completeRegistration: async () => {
    const pendingAuth = get().pendingAuth;

    if (!pendingAuth) {
      set({ error: 'Complete phone verification before entering the app.' });
      return false;
    }

    commitPhoneAuth(pendingAuth);

    set({
      ...initialState,
      countries: get().countries,
      selectedCountry: get().selectedCountry,
    });

    return true;
  },

  returnToPhoneEntry: () =>
    set({
      step: 'phone',
      code: '',
      submittedPhoneNumber: '',
      requestedTransport: 'sms',
      retryAvailableAt: null,
      callFallbackAvailableAt: null,
      nextVerificationAttemptAt: null,
      allowedToRequestCode: true,
      codeExpiresAt: null,
      debugVerificationCode: null,
      incorrectCodeAttempts: 0,
      sessionId: null,
      pendingChallenges: [],
      verificationChallenges: [],
      pendingAuth: null,
      profile: initialState.profile,
      error: null,
    }),

  reset: () => set({ ...initialState }),
});

export const usePhoneRegistrationStore = create<PhoneRegistrationState>()(
  persist(createPhoneRegistrationState, {
    name: PHONE_REGISTRATION_STORAGE_KEY,
    version: PHONE_REGISTRATION_STORAGE_VERSION,
    storage: createJSONStorage(() => safeSessionStorage),
    partialize: phoneRegistrationCheckpoint,
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...restorePhoneRegistrationCheckpoint(persistedState),
    }),
  })
);

function mapNotificationPermission(permission: NotificationPermission): PermissionState {
  switch (permission) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    default:
      return 'idle';
  }
}
