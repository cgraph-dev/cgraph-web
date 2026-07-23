/**
 * Internationalization configuration — CGraph Web
 *
 * English-only i18next runtime with:
 * - HttpBackend for lazy-loading translation files
 * - ICU MessageFormat for pluralization (Arabic 6-form, Russian 3-form, etc.)
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
import HttpBackend from 'i18next-http-backend';
import ICU from 'i18next-icu';
import { logger } from '@/lib/logger';

const NAMESPACES: readonly string[] = [
  'common', 'auth', 'messages', 'groups', 'settings', 'premium', 'forums', 'accessibility',
];

/**
 * The browser runtime currently ships English only. Keep the document declaration aligned with
 * the locale that the application can actually render.
 */
function applyDocumentLanguage(): void {
  if (typeof document === 'undefined') return;

  document.documentElement.dir = 'ltr';
  document.documentElement.lang = 'en';
}

i18n
  .use(HttpBackend)
  .use(ICU)
  .use(initReactI18next)
  .init({
    lng: 'en',
    supportedLngs: ['en'],
    fallbackLng: 'en',

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'default',
      },
    },

    defaultNS: 'common',
    ns: [...NAMESPACES],

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

applyDocumentLanguage();

export default i18n;
