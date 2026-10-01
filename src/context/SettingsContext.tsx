import * as SecureStore from "expo-secure-store";
import { Appearance, Platform } from "react-native";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";
type AppSettings = {
  theme: ThemePreference;
  notificationsEnabled: boolean;
  messagePreviewsEnabled: boolean;
  voiceMessagesEnabled: boolean;
};
type SettingsContextValue = AppSettings & {
  isReady: boolean;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
};

const STORAGE_KEY = "taslim.settings";
const defaults: AppSettings = {
  theme: "system",
  notificationsEnabled: true,
  messagePreviewsEnabled: true,
  voiceMessagesEnabled: true,
};
const SettingsContext = createContext<SettingsContextValue | null>(null);

async function readSettings(): Promise<Partial<AppSettings> | null> {
  if (Platform.OS === "web") {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Partial<AppSettings> : null;
  }
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  return raw ? JSON.parse(raw) as Partial<AppSettings> : null;
}

async function saveSettings(settings: AppSettings) {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(settings));
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(settings));
}

function applyTheme(theme: ThemePreference) {
  Appearance.setColorScheme(theme === "system" ? "unspecified" : theme);
  if (Platform.OS === "web" && typeof document !== "undefined") {
    document.documentElement.style.colorScheme = theme === "system" ? "light dark" : theme;
  }
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    readSettings()
      .then((stored) => {
        const next = { ...defaults, ...stored };
        setSettings(next);
        applyTheme(next.theme);
      })
      .catch(() => applyTheme("system"))
      .finally(() => setIsReady(true));
  }, []);

  async function updateSettings(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (patch.theme) applyTheme(patch.theme);
    await saveSettings(next);
  }

  return (
    <SettingsContext.Provider value={{ ...settings, isReady, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings doit être utilisé dans SettingsProvider");
  return value;
}
