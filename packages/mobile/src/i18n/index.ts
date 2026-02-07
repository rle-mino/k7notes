import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { NativeModules, Platform } from "react-native";
import en from "./locales/en";
import fr from "./locales/fr";

let deviceLang = "en";

// On web, use navigator.language; on native, use expo-localization if the native module is available
if (Platform.OS === "web") {
  const navLang = typeof navigator !== "undefined" ? navigator.language?.split("-")[0] : "en";
  deviceLang = navLang ?? "en";
} else if (NativeModules.ExpoLocalization) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getLocales } = require("expo-localization");
    deviceLang = getLocales()[0]?.languageCode ?? "en";
  } catch {
    // fallback to "en"
  }
}

const defaultLang = deviceLang === "fr" ? "fr" : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: defaultLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
export { defaultLang };
