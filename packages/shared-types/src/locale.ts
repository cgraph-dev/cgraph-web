export const SUPPORTED_LOCALES = [
  'en',
  'es',
  'fr',
  'de',
  'ja',
  'ko',
  'zh',
  'ar',
  'pt',
  'ru',
  'he',
  'tr',
  'it',
  'nl',
  'pl',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const RTL_LOCALES = new Set<SupportedLocale>(['ar', 'he']);

const SUPPORTED_LOCALES_SET = new Set<string>(SUPPORTED_LOCALES);

function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES_SET.has(value);
}

/**
 * Returns true if the given BCP 47 locale tag is a right-to-left locale.
 */
export function isRtlLocale(locale: string): boolean {
  const baseLocale = locale.toLowerCase().split('-')[0] ?? '';
  return isSupportedLocale(baseLocale) && RTL_LOCALES.has(baseLocale);
}
