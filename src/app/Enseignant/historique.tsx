import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "@/components/Header/Header";
import { useAuth } from "@/context/AuthContext";
import { schoolApi } from "@/services/api";

type HistoryEntry = { id: string; type: string; label: string; detail: string; date: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap };

function textValue(value: unknown, fallback: string) {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

export default function Historique() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let current = true;
    schoolApi.getTeacherHistory(token)
      .then((history) => {
        if (!current) return;
        const records: HistoryEntry[] = [
          ...history.absences.map((raw, index) => {
            const item = raw as Record<string, unknown>;
            return { id: `absence-${String(item.id ?? index)}`, type: "Absence", label: textValue(item.nom ?? item.Nom ?? item.student_name, "Élève"), detail: textValue(item.classe ?? item.class_name, "Classe"), date: textValue(item.date ?? item.created_at, "Date inconnue"), color: "#b54736", icon: "account-cancel-outline" };
          }),
          ...history.retards.map((raw, index) => {
            const item = raw as Record<string, unknown>;
            return { id: `retard-${String(item.id ?? index)}`, type: "Retard", label: textValue(item.nom ?? item.Nom ?? item.student_name, "Élève"), detail: `${textValue(item.classe ?? item.class_name, "Classe")} · ${textValue(item.minutes ?? item.heure, "")}`, date: textValue(item.date ?? item.created_at, "Date inconnue"), color: "#3366cc", icon: "clock-alert-outline" };
          }),
          ...history.devoirs.map((raw, index) => {
            const item = raw as Record<string, unknown>;
            return { id: `devoir-${String(item.id ?? index)}`, type: "Devoir", label: textValue(item.name ?? item.nom ?? item.filename ?? item.title, "Devoir"), detail: textValue(item.description ?? item.matiere, "Document déposé"), date: textValue(item.date ?? item.created_at, "Date inconnue"), color: "#14804a", icon: "file-document-outline" };
          }),
        ];
        setEntries(records);
      })
      .catch((reason: unknown) => { if (current) setError(reason instanceof Error ? reason.message : "Impossible de charger l'historique."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [token]);

  return (
    <View className="flex-1 bg-[#f7f8fa] dark:bg-slate-950">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-6">
        <Text className="text-[26px] font-extrabold text-[#202122]">Historique</Text>
        <Text className="mt-1 text-sm text-[#72777d]">Absences, retards et devoirs enregistrés.</Text>
        {loading ? <ActivityIndicator className="mt-8" color="#3366cc" /> : null}
        {error ? <Text accessibilityRole="alert" className="mt-5 rounded-lg border border-[#f0c4bd] bg-white p-4 text-sm text-[#a23b2a]">{error}</Text> : null}
        {!loading && !error && entries.length === 0 ? <Text className="mt-10 text-center text-sm text-[#72777d]">Aucun historique disponible.</Text> : null}
        {entries.map((entry) => (
          <View key={entry.id} className="mt-3 flex-row rounded-lg border border-[#eaecf0] bg-white p-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#f1f3f5]"><MaterialCommunityIcons name={entry.icon} size={20} color={entry.color} /></View>
            <View className="flex-1"><Text className="text-xs font-bold uppercase text-[#72777d]">{entry.type} · {entry.date}</Text><Text className="mt-1 font-bold text-[#202122]">{entry.label}</Text><Text className="mt-1 text-sm text-[#54595d]">{entry.detail}</Text></View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}