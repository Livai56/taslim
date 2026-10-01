import "../../global.css";

import { Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import BottomNavigation from "@/components/BottomNavigation";

function AppNavigation() {
  const segments = useSegments();
  const routeGroup = segments[0] ?? "";
  const isAppRoute = ["(tabs)", "Directeur", "Enseignant", "Parent"].includes(routeGroup);

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <Stack screenOptions={{ headerShown: false }} />
      {isAppRoute ? <BottomNavigation /> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <StatusBar style="auto" />
        <AppNavigation />
      </SettingsProvider>
    </AuthProvider>
  );
}