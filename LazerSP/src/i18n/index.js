import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";

const LANGUAGE_KEY = "@lazersp:language";
const SUPPORTED = ["pt", "en", "es"];

const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: async (callback) => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored && SUPPORTED.includes(stored)) return callback(stored);
      const locale = Localization.getLocales()[0]?.languageCode || "pt";
      callback(SUPPORTED.includes(locale) ? locale : "pt");
    } catch {
      callback("pt");
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch {}
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: "pt",
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
  });

export default i18n;
