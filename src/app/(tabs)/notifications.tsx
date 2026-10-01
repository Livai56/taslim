import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Header from "@/components/Header/Header";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useForegroundPolling } from "@/hooks/useForegroundPolling";
import { schoolApi } from "@/services/api";
import type { Message } from "@/types/school";

export default function Notifications() {
  const { token } = useAuth();
  const { notificationsEnabled, messagePreviewsEnabled } = useSettings();
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token || !notificationsEnabled) {
      setItems([]);
      setLoading(false);
      return;
    }
    let isCurrent = true;
    setLoading(true);
    setError("");
    schoolApi.getNotifications(token)
      .then((result) => { if (isCurrent) setItems(result); })
      .catch((reason: unknown) => {
        if (isCurrent) setError(reason instanceof Error ? reason.message : "Impossible de charger les notifications.");
      })
      .finally(() => { if (isCurrent) setLoading(false); });
    return () => { isCurrent = false; };
  }, [token, reload, notificationsEnabled]);

  useForegroundPolling(async () => {
    if (!token || !notificationsEnabled) return;
    try {
      setItems(await schoolApi.getNotifications(token));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible d’actualiser les notifications.");
    }
  }, 15000, Boolean(token) && notificationsEnabled);

  async function openNotification(item: Message) {
    if (!token || !/^\d+$/.test(item.id)) return;
    try {
      await schoolApi.clickNotification(token, item.id);
      setItems(await schoolApi.getNotifications(token));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de mettre à jour cette notification.");
    }
  }

  return (
    <View className="flex-1 bg-[#f7faf8] dark:bg-slate-950">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-6">
        <Text className="text-[26px] font-extrabold text-[#173f43] dark:text-white">
          Notifications
        </Text>
        <Text className="mt-1 text-sm text-[#788a86] dark:text-slate-400">
          Les informations importantes de votre établissement.
        </Text>
        {loading ? <ActivityIndicator className="mt-10" color="#3366cc" /> : null}
        {!notificationsEnabled && !loading ? (
          <View className="mt-8 items-center rounded-xl border border-[#eaecf0] bg-white px-5 py-8 dark:border-slate-800 dark:bg-slate-900">
            <Ionicons name="notifications-off-outline" size={28} color="#72777d" />
            <Text className="mt-3 text-center text-base font-bold text-[#202122] dark:text-white">Notifications désactivées</Text>
            <Text className="mt-1 text-center text-sm text-[#72777d] dark:text-slate-400">Réactivez-les dans Paramètres, section Général.</Text>
          </View>
        ) : !token && !loading ? (
          <View className="mt-8 items-center rounded-xl border border-[#eaecf0] bg-white px-5 py-8">
            <Ionicons name="lock-closed-outline" size={28} color="#72777d" />
            <Text className="mt-3 text-base font-bold text-[#202122]">Connectez-vous pour consulter vos notifications</Text>
            <Pressable onPress={() => router.push("/login")} className="mt-4 rounded-lg bg-[#3366cc] px-5 py-3">
              <Text className="font-bold text-white">Se connecter</Text>
            </Pressable>
          </View>
        ) : null}
        {error ? (
          <View className="mt-7 items-center rounded-xl border border-[#f0c4bd] bg-white p-5">
            <Text className="text-center text-sm text-[#a23b2a]">Impossible de charger les notifications depuis Django.</Text>
            <Pressable onPress={() => setReload((value) => value + 1)} className="mt-3 rounded-lg px-4 py-2">
              <Text className="font-bold text-[#3366cc]">Réessayer</Text>
            </Pressable>
          </View>
        ) : null}
        {!loading && !error && token && items.length === 0 ? (
          <View className="mt-8 items-center rounded-xl border border-[#eaecf0] bg-white px-5 py-8">
            <Ionicons name="notifications-outline" size={28} color="#72777d" />
            <Text className="mt-3 text-base font-bold text-[#202122]">Aucune notification</Text>
            <Text className="mt-1 text-center text-sm text-[#72777d]">Les nouvelles informations apparaîtront ici.</Text>
          </View>
        ) : null}
        {items.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" onPress={() => void openNotification(item)} className="mt-4 flex-row rounded-xl border border-[#eaecf0] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <View className="mr-3 mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-[#eaf3ff]">
              <Ionicons name="notifications-outline" size={18} color="#3366cc" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-start justify-between gap-3">
                <Text className="flex-1 text-sm font-bold text-[#202122] dark:text-white">{item.sender}</Text>
                <Text className="text-[11px] text-[#72777d]">{item.time}</Text>
              </View>
              <Text className="mt-1 text-sm leading-5 text-[#54595d] dark:text-slate-300">{messagePreviewsEnabled ? item.preview : "Contenu masqué"}</Text>
              {item.role ? <Text className="mt-2 text-xs font-semibold text-[#3366cc]">{item.role}</Text> : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}