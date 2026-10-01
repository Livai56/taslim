import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { useForegroundPolling } from "@/hooks/useForegroundPolling";
import { schoolApi } from "@/services/api";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const { updateSettings, notificationsEnabled } = useSettings();
  const { user, token } = useAuth();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(user ? "/(tabs)" : "/login");
  }

  async function refreshUnreadNotifications() {
    if (!token || !notificationsEnabled) {
      setHasUnreadNotifications(false);
      return;
    }
    try {
      const notifications = await schoolApi.getNotifications(token);
      setHasUnreadNotifications(notifications.some((notification) => notification.unread));
    } catch {
    }
  }

  useEffect(() => {
    if (!token || !notificationsEnabled) {
      setHasUnreadNotifications(false);
      return;
    }
    let isCurrent = true;
    schoolApi.getNotifications(token)
      .then((notifications) => {
        if (isCurrent) setHasUnreadNotifications(notifications.some((notification) => notification.unread));
      })
      .catch(() => {});
    return () => { isCurrent = false; };
  }, [token, notificationsEnabled]);

  useForegroundPolling(refreshUnreadNotifications, 15000, Boolean(token) && notificationsEnabled);

  const isDashboard =
    pathname === "/(tabs)" ||
    pathname === "/" ||
    pathname === "/index";

  return (
    <View className="flex-row items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">

      {!isDashboard && (
        <Pressable
          onPress={handleBack}
          className="h-10 w-10 shrink-0 items-center justify-center rounded-full"
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color={colorScheme === "dark" ? "#e2e8f0" : "#334155"}
          />
        </Pressable>
      )}

      <View className="h-10 min-w-0 flex-1 flex-row items-center rounded-xl bg-slate-100 px-3 dark:bg-slate-900">
        <Ionicons
          name="search-outline"
          size={20}
          color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
        />

        <TextInput
          placeholder="Rechercher..."
          placeholderTextColor={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
          className="ml-2 min-w-0 flex-1 text-slate-800 dark:text-slate-100"
        />
      </View>

      <Pressable
        onPress={() => void updateSettings({ theme: colorScheme === "dark" ? "light" : "dark" })}
        accessibilityRole="button"
        accessibilityLabel={colorScheme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
        className="h-10 w-10 shrink-0 items-center justify-center rounded-full"
      >
        <Ionicons
          name={colorScheme === "dark" ? "sunny-outline" : "moon-outline"}
          size={22}
          color={colorScheme === "dark" ? "#e2e8f0" : "#334155"}
        />
      </Pressable>

      <Pressable
        onPress={() => router.navigate("/(tabs)/notifications")}
        accessibilityRole="button"
        accessibilityLabel="Ouvrir les notifications"
        className="relative h-10 w-10 shrink-0 items-center justify-center rounded-full"
      >
        <Ionicons
          name="notifications-outline"
          size={22}
          color={colorScheme === "dark" ? "#e2e8f0" : "#334155"}
        />

        {hasUnreadNotifications ? <View className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
      </Pressable>
    </View>
  );
}