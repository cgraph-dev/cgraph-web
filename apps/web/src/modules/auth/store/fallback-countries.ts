import type { Country } from '@cgraph-dev/api-client';

export const FALLBACK_PHONE_COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina', calling_code: '+54' },
  { code: 'AU', name: 'Australia', calling_code: '+61' },
  { code: 'BE', name: 'Belgium', calling_code: '+32' },
  { code: 'BR', name: 'Brazil', calling_code: '+55' },
  { code: 'CA', name: 'Canada', calling_code: '+1' },
  { code: 'CN', name: 'China', calling_code: '+86' },
  { code: 'DE', name: 'Germany', calling_code: '+49' },
  { code: 'ES', name: 'Spain', calling_code: '+34' },
  { code: 'FR', name: 'France', calling_code: '+33' },
  { code: 'GB', name: 'United Kingdom', calling_code: '+44' },
  { code: 'IN', name: 'India', calling_code: '+91' },
  { code: 'IT', name: 'Italy', calling_code: '+39' },
  { code: 'JP', name: 'Japan', calling_code: '+81' },
  { code: 'KR', name: 'South Korea', calling_code: '+82' },
  { code: 'MD', name: 'Moldova', calling_code: '+373' },
  { code: 'MX', name: 'Mexico', calling_code: '+52' },
  { code: 'NL', name: 'Netherlands', calling_code: '+31' },
  { code: 'PL', name: 'Poland', calling_code: '+48' },
  { code: 'RO', name: 'Romania', calling_code: '+40' },
  { code: 'TR', name: 'Turkey', calling_code: '+90' },
  { code: 'UA', name: 'Ukraine', calling_code: '+380' },
  { code: 'US', name: 'United States', calling_code: '+1' },
  { code: 'ZA', name: 'South Africa', calling_code: '+27' },
];

/**
 * Uses backend countries when present and falls back to a small built-in list.
 */
export function resolvePhoneCountries(countries: readonly Country[]): Country[] {
  return countries.length > 0 ? Array.from(countries) : FALLBACK_PHONE_COUNTRIES;
}
