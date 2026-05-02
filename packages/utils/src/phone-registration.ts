export interface PhoneCountryLike {
  readonly code: string;
  readonly calling_code: string;
}

export const PHONE_REGISTRATION_OTP_LENGTH = 6;
export const PHONE_REGISTRATION_CODE_EXPIRY_SECONDS = 600;
export const PHONE_REGISTRATION_TROUBLE_HINT_SECONDS = 30;
export const PHONE_REGISTRATION_RETRY_SECONDS = 60;

const MAX_PHONE_DIGITS = 15;

const SPACED_PATTERNS: Record<string, number[]> = {
  AE: [2, 3, 4],
  AT: [3, 6],
  AU: [1, 4, 4],
  BE: [3, 2, 2, 2],
  DE: [3, 7],
  FR: [1, 2, 2, 2, 2],
  IN: [5, 5],
  JP: [2, 4, 4],
};

const MIN_LOCAL_DIGITS: Record<string, number> = {
  AU: 9,
  CA: 10,
  DE: 6,
  FR: 9,
  GB: 10,
  IN: 10,
  JP: 10,
  US: 10,
};

/**
 * Strips all non-digit characters from a string.
 */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Normalizes a user-typed calling code into a `+<digits>` form, clamping to 4 digits
 * (the maximum length of any ITU calling code). Returns an empty string when no
 * digits are present.
 */
export function normalizeCallingCodeInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length === 0 ? '' : `+${digits}`;
}

/**
 * Finds the country whose `calling_code` exactly matches the typed value. Used to
 * power Telegram-style "type the country code" entry where typing `+44` switches
 * the selected country to the United Kingdom.
 *
 * Falls back to longest-prefix matching when an exact match is not found, so that
 * shared codes (e.g. `+1` for US/CA) still resolve to a default country.
 */
export function findCountryByCallingCode<T extends PhoneCountryLike>(
  value: string,
  countries: readonly T[]
): T | null {
  const normalized = normalizeCallingCodeInput(value);

  if (normalized.length <= 1) {
    return null;
  }

  const exactMatches = countries.filter((country) => country.calling_code === normalized);

  if (exactMatches.length === 1) {
    return exactMatches[0] ?? null;
  }

  if (exactMatches.length > 1) {
    return (
      exactMatches.find((country) => country.code === 'US') ??
      exactMatches.find((country) => country.code === 'GB') ??
      exactMatches[0] ??
      null
    );
  }

  return null;
}

/**
 * Strips non-digits and clamps to the E.164 maximum of 15 digits.
 */
export function clampPhoneDigits(value: string): string {
  return digitsOnly(value).slice(0, MAX_PHONE_DIGITS);
}

/**
 * Formats a raw digit string as a human-readable local phone number for the given country code.
 */
export function formatPhoneEntryValue(value: string, countryCode: string | null): string {
  const digits = clampPhoneDigits(value);

  if (digits.length === 0) {
    return '';
  }

  switch (countryCode) {
    case 'US':
    case 'CA':
      return formatNorthAmericanNumber(digits);
    case 'GB':
      return formatGroups(digits, [4, 6]);
    case 'JP':
      return formatJapaneseNumber(digits);
    default:
      return formatGroups(digits, SPACED_PATTERNS[countryCode ?? ''] ?? [3, 3, 3, 3]);
  }
}

/**
 * Normalizes a local or international phone number string to E.164 format (+<digits>).
 * Returns null if the value cannot be resolved to a valid E.164 number.
 */
export function normalizePhoneNumber(
  value: string,
  country: PhoneCountryLike | null
): string | null {
  if (!country) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.startsWith('+')) {
    const internationalDigits = clampPhoneDigits(trimmed);
    return internationalDigits ? `+${internationalDigits}` : null;
  }

  const localDigits = normalizeLocalDigits(clampPhoneDigits(trimmed), country.code);
  const callingCodeDigits = clampPhoneDigits(country.calling_code);

  if (!localDigits || !callingCodeDigits) {
    return null;
  }

  const fullDigits = localDigits.startsWith(callingCodeDigits)
    ? localDigits
    : `${callingCodeDigits}${localDigits}`;

  if (fullDigits.length > MAX_PHONE_DIGITS) {
    return null;
  }

  return `+${fullDigits}`;
}

/**
 * Returns true if the entered local phone number has enough digits to be a plausible number for the given country.
 */
export function isPlausiblePhoneNumber(value: string, country: PhoneCountryLike | null): boolean {
  if (!country) {
    return false;
  }

  const localDigits = normalizeLocalDigits(clampPhoneDigits(value), country.code);
  const minDigits = MIN_LOCAL_DIGITS[country.code] ?? 4;

  return localDigits.length >= minDigits && localDigits.length <= MAX_PHONE_DIGITS;
}

/**
 * Splits an OTP code string into an array of individual digit strings, padded to OTP_LENGTH with empty strings.
 */
export function splitOtpCode(code: string): string[] {
  const normalized = clampOtpDigits(code);

  return Array.from({ length: PHONE_REGISTRATION_OTP_LENGTH }, (_, index) => {
    return normalized[index] ?? '';
  });
}

/**
 * Strips non-digits and clamps to the configured OTP length.
 */
export function clampOtpDigits(code: string): string {
  return digitsOnly(code).slice(0, PHONE_REGISTRATION_OTP_LENGTH);
}

/**
 * Joins an array of digit strings into a single clamped OTP code string.
 */
export function buildOtpCode(digits: string[]): string {
  return clampOtpDigits(digits.join(''));
}

/**
 * Replaces the digit at the given index in an OTP code string with the last digit of nextValue.
 */
export function replaceOtpDigit(code: string, index: number, nextValue: string): string {
  const nextDigits = splitOtpCode(code);
  const digit = digitsOnly(nextValue).slice(-1);

  nextDigits[index] = digit;

  return buildOtpCode(nextDigits);
}

/**
 * Applies a pasted value into an OTP code string starting at the given digit index.
 */
export function applyOtpPaste(code: string, index: number, pastedValue: string): string {
  const nextDigits = splitOtpCode(code);
  const pastedDigits = clampOtpDigits(pastedValue).split('');

  pastedDigits.forEach((digit, offset) => {
    const nextIndex = index + offset;

    if (nextIndex < PHONE_REGISTRATION_OTP_LENGTH) {
      nextDigits[nextIndex] = digit;
    }
  });

  return buildOtpCode(nextDigits);
}

function formatNorthAmericanNumber(digits: string): string {
  if (digits.length <= 3) {
    return digits;
  }

  const areaCode = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const lineNumber = digits.slice(6, 10);

  if (digits.length <= 6) {
    return `(${areaCode}) ${prefix}`;
  }

  return `(${areaCode}) ${prefix}-${lineNumber}`;
}

function formatJapaneseNumber(digits: string): string {
  if (digits.startsWith('0') && digits.length >= 3) {
    return formatGroups(digits, [3, 4, 4]);
  }

  return formatGroups(digits, [2, 4, 4]);
}

function formatGroups(digits: string, groups: number[]): string {
  if (digits.length === 0) {
    return '';
  }

  const parts: string[] = [];
  let cursor = 0;

  for (const groupLength of groups) {
    if (cursor >= digits.length) {
      break;
    }

    const nextPart = digits.slice(cursor, cursor + groupLength);

    if (nextPart.length > 0) {
      parts.push(nextPart);
    }

    cursor += groupLength;
  }

  if (cursor < digits.length) {
    parts.push(digits.slice(cursor));
  }

  return parts.join(' ');
}

function normalizeLocalDigits(digits: string, countryCode: string): string {
  if (digits.length === 0) {
    return '';
  }

  if (countryCode === 'US' || countryCode === 'CA') {
    return digits;
  }

  return digits.replace(/^0+/, '');
}
