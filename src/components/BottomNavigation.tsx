import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const destinations = [
  { key: "menu", label: "Menu", icon: "menu-outline", route: "/(tabs)/menu" },
  { key: "index", label: "Dashboard", icon: "home-outline", route: "/(tabs)" },
  { key: "message", label: "Messages", icon: "chatbubble-outline", route: "/(tabs)/message" },
  { key: "notifications", label: "Notifications", icon: "notifications-outline", route: "/(tabs)/notifications" },
  { key: "settings", label: "Paramètres", icon: "settings-outline", route: "/(tabs)/settings" },
] as const;

const roleRouteGroups = ["Directeur", "Enseignant", "Parent"];

export default function BottomNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const isRoleRoute = roleRouteGroups.includes(segments[0] ?? "");
  const activeKey = isRoleRoute ? "menu" : segments[1] ?? "index";

  return (
    <View
      className="flex-row border-t border-[#eaecf0] bg-white px-1 pt-2 dark:border-slate-800 dark:bg-slate-950"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {destinations.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => router.navigate(item.route)}
            className="min-h-12 flex-1 items-center justify-center gap-1"
          >
            <View className={`h-7 min-w-10 items-center justify-center rounded-full px-3 ${isActive ? "bg-[#eaf3ff] dark:bg-slate-800" : "bg-transparent"}`}>
              <Ionicons
                name={item.icon}
                size={19}
                color={isActive ? "#3366cc" : "#54595d"}
              />
            </View>
            <Text className={`text-[10px] ${isActive ? "font-bold text-[#3366cc] dark:text-blue-300" : "font-medium text-[#54595d] dark:text-slate-400"}`}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}