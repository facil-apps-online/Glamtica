import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

const locales = {
  es,
  en: enUS,
};

// Global variable to store the timezone, will be updated dynamically
export let currentTimeZone: string = 'UTC'; // Default to UTC

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
      format: (value, fmt, lng) => {
        if (value instanceof Date) {
          // Use formatInTimeZone for dates, applying the current timezone
          return formatInTimeZone(value, currentTimeZone, fmt, { locale: locales[lng] });
        }

        if (fmt === 'currency') {
          return new Intl.NumberFormat(lng, { style: 'currency', currency: 'USD' }).format(value);
        }

        if (fmt === 'number') {
          return new Intl.NumberFormat(lng).format(value);
        }

        return value;
      },
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    ns: ['common'], // Namespaces a cargar
    defaultNS: 'common',
  });

export default i18n;

// Function to update the timezone dynamically
export const setAppTimeZone = (timeZone: string) => {
  currentTimeZone = timeZone;
  // Optionally, re-render components that depend on i18n if needed,
  // though formatInTimeZone will use the updated currentTimeZone directly.
};