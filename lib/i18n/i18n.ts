import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translations
import enTranslation from "./locales/en/translation.json";
import trTranslation from "./locales/tr/translation.json";

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    debug: process.env.NODE_ENV === "development",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    resources: {
      en: {
        translation: enTranslation,
      },
      tr: {
        translation: trTranslation,
      },
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
