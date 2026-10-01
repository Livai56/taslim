import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import Header from "../../components/Header/Header";
import { ROLE_MENUS } from "../../constants/menu";
import { ROLE_LABELS } from "../../constants/permissions";
import { useAuth } from "../../context/AuthContext";

export default function Menu() {
  const router = useRouter();
  const { user } = useAuth();
  const menuItems = user ? ROLE_MENUS[user.role] : [];
  const roleLabel = user ? ROLE_LABELS[user.role] : null;

  return (
    <View className="flex-1 bg-[#f7faf8] dark:bg-slate-950">
      <Header />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-6"
      >
        <Text className="text-[26px] font-extrabold text-[#202122] dark:text-white">
          Menu
        </Text>
        <Text className="mt-1 text-sm text-[#72777d] dark:text-slate-400">
          {roleLabel
            ? `Outils disponibles pour votre profil ${roleLabel.toLowerCase()}.`
            : "Connectez-vous pour afficher les options de votre profil."}
        </Text>

        {menuItems.length ? (
          <View className="mt-7 border-t border-[#eaecf0]">
            {menuItems.map((item) => (
              <Pressable
                key={item.title}
                onPress={() => router.push(item.route)}
                accessibilityRole="button"
                className="min-h-[68px] flex-row items-center border-b border-[#eaecf0] py-3 active:bg-[#f1f4f8] dark:border-slate-800 dark:active:bg-slate-900"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#eaf3ff] dark:bg-slate-800">
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color="#3366cc"
                  />
                </View>
                <Text className="ml-4 flex-1 text-[15px] font-semibold text-[#202122] dark:text-white">
                  {item.title}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#72777d" />
              </Pressable>
            ))}
          </View>
        ) : (
          <Pressable
            onPress={() => router.replace("/login")}
            className="mt-7 min-h-12 items-center justify-center rounded-lg bg-[#3366cc] px-4 active:opacity-80"
          >
            <Text className="font-bold text-white">Se connecter</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}