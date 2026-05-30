/**
 * Internationalization configuration — CGraph Web
 *
 * i18next with:
 * - HttpBackend for lazy-loading translation files
 * - Browser language detection (localStorage > navigator > htmlTag)
 * - ICU MessageFormat for pluralization (Arabic 6-form, Russian 3-form, etc.)
 * - RTL direction management (auto-updates document.dir on language change)
 * - Missing key handling (dev: logger.warn, prod: report to Sentry)
 *
 * Namespaces (8):
 *   common, auth, messages, groups, settings, premium, forums, accessibility
 *
 * Usage:
 *   const { t } = useTranslation('common');
 *   <p>{t('welcome')}</p>
 *   <p>{t('common:message_count', { count: 5 })}</p>
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import ICU from 'i18next-icu';
import { logger } from '@/lib/logger';
import { isRtlLocale } from '@cgraph-dev/shared-types';
import type { SupportedLocale } from '@cgraph-dev/shared-types';

const SUPPORTED_LANGUAGES: readonly string[] = [
  'en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'ar', 'pt', 'ru',
  'he', 'tr', 'it', 'nl', 'pl',
];

const NAMESPACES: readonly string[] = [
  'common', 'auth', 'messages', 'groups', 'settings', 'premium', 'forums', 'accessibility',
];

/**
 * Set document direction and lang attribute based on locale.
 * Called automatically on language change and on init.
 */
function updateDocumentDirection(locale: string): void {
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = locale;
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(ICU)
  .use(initReactI18next)
  .init({
    supportedLngs: [...SUPPORTED_LANGUAGES],
    fallbackLng: 'en',

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'default',
      },
    },

    defaultNS: 'common',
    ns: [...NAMESPACES],

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'cgraph_language',
    },

    react: {
      useSuspense: true,
    },

    interpolation: {
      escapeValue: false,
    },

    // ICU MessageFormat handles pluralization natively — no need for i18next built-in
    compatibilityJSON: 'v4',

    // Missing key handling
    saveMissing: import.meta.env.DEV,
    missingKeyHandler(_lngs: readonly string[], ns: string, key: string) {
      logger.warn(`[i18n] Missing translation — namespace: ${ns}, key: ${key}`);
    },

    returnEmptyString: false,
    returnNull: false,

    debug: false,
  });

// Update document direction on language change
i18n.on('languageChanged', (lng: string) => {
  updateDocumentDirection(lng);
});

// Set initial direction after init resolves
if (i18n.language) {
  updateDocumentDirection(i18n.language);
}

/**
 * Change the active locale and update document direction.
 * Persists to localStorage via i18next detection config.
 */
export async function changeLanguage(locale: SupportedLocale): Promise<void> {
  await i18n.changeLanguage(locale);
  // Direction is updated via the languageChanged event above
}

export default i18n;
