import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { orpc } from "@/lib/orpc";
import type { SupportedLanguage } from "@k7notes/contracts";

function getDeviceLanguage(): string {
  if (Platform.OS === "web") {
    const navLang = typeof navigator !== "undefined" ? navigator.language?.split("-")[0] : "en";
    return navLang ?? "en";
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NativeModules } = require("react-native");
    if (NativeModules.ExpoLocalization) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getLocales } = require("expo-localization");
      return getLocales()[0]?.languageCode ?? "en";
    }
  } catch {
    // fallback
  }
  return "en";
}

interface PreferencesContextValue {
  appLanguage: SupportedLanguage;
  transcriptionLanguage: SupportedLanguage | null;
  resolvedTranscriptionLanguage: SupportedLanguage;
  loading: boolean;
  updateAppLanguage: (lang: SupportedLanguage) => Promise<void>;
  updateTranscriptionLanguage: (lang: SupportedLanguage | null) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [appLanguage, setAppLanguage] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || "en"
  );
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<SupportedLanguage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const deviceLang = getDeviceLanguage();
        const prefs = await orpc.preferences.get({
          deviceLanguage: deviceLang === "fr" ? "fr" : "en",
        });
        setAppLanguage(prefs.appLanguage);
        setTranscriptionLanguage(prefs.transcriptionLanguage);
        if (prefs.appLanguage !== i18n.language) {
          i18n.changeLanguage(prefs.appLanguage);
        }
      } catch (err) {
        console.error("Failed to fetch preferences:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const updateAppLanguage = useCallback(async (lang: SupportedLanguage) => {
    setAppLanguage(lang);
    i18n.changeLanguage(lang);
    try {
      await orpc.preferences.update({ appLanguage: lang });
    } catch (err) {
      console.error("Failed to update app language:", err);
    }
  }, [i18n]);

  const updateTranscriptionLanguage = useCallback(async (lang: SupportedLanguage | null) => {
    setTranscriptionLanguage(lang);
    try {
      await orpc.preferences.update({ transcriptionLanguage: lang });
    } catch (err) {
      console.error("Failed to update transcription language:", err);
    }
  }, []);

  const resolvedTranscriptionLanguage = transcriptionLanguage ?? appLanguage;

  const value = useMemo(() => ({
    appLanguage,
    transcriptionLanguage,
    resolvedTranscriptionLanguage,
    loading,
    updateAppLanguage,
    updateTranscriptionLanguage,
  }), [appLanguage, transcriptionLanguage, resolvedTranscriptionLanguage, loading, updateAppLanguage, updateTranscriptionLanguage]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
