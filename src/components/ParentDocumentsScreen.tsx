import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import Header from "@/components/Header/Header";
import { useAuth } from "@/context/AuthContext";
import { resolveApiAssetUrl, schoolApi } from "@/services/api";
import type { SchoolDocument } from "@/types/school";

type DocumentKind = "bulletins" | "emplois-du-temps";

export default function ParentDocumentsScreen({ kind }: { kind: DocumentKind }) {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState("");
  const [reload, setReload] = useState(0);
  const isBulletin = kind === "bulletins";
  const title = isBulletin ? "Bulletins scolaires" : "Emplois du temps";

  useEffect(() => {
    if (!token) { setLoading(false); setDocuments([]); return; }
    let current = true;
    setLoading(true);
    setError("");
    schoolApi.getParentDocuments(token, kind)
      .then((result) => { if (current) setDocuments(result); })
      .catch((reason: unknown) => { if (current) setError(reason instanceof Error ? reason.message : `Impossible de charger les ${title.toLowerCase()}.`); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [token, kind, reload]);

  async function openDocument(document: SchoolDocument) {
    if (!document.url) return;
    setOpeningId(document.id);
    setError("");
    try {
      await Linking.openURL(resolveApiAssetUrl(document.url));
    } catch {
      setError("Impossible d'ouvrir ce document sur cet appareil.");
    } finally {
      setOpeningId("");
    }
  }

  return (
    <View className="flex-1 bg-[#f7f8fa] dark:bg-slate-950">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-6">
        <Text className="text-[26px] font-extrabold text-[#202122]">{title}</Text>
        <Text className="mt-1 text-sm text-[#72777d]">Documents transmis par votre établissement.</Text>
        {loading ? <ActivityIndicator className="mt-8" color="#3366cc" /> : null}
        {error ? (
          <View className="mt-5 rounded-lg border border-[#f0c4bd] bg-white p-4">
            <Text className="text-sm text-[#a23b2a]">{error}</Text>
            {token ? <Pressable onPress={() => setReload((value) => value + 1)} className="mt-3 self-start"><Text className="font-bold text-[#3366cc]">Réessayer</Text></Pressable> : null}
          </View>
        ) : null}
        {!loading && !error && !token ? (
          <View className="mt-6 items-center rounded-xl border border-[#eaecf0] bg-white px-5 py-8">
            <Ionicons name="lock-closed-outline" size={28} color="#72777d" />
            <Text className="mt-3 text-center text-sm text-[#54595d]">Connectez-vous pour consulter vos documents.</Text>
          </View>
        ) : null}
        {!loading && !error && token && documents.length === 0 ? (
          <View className="mt-6 items-center rounded-xl border border-[#eaecf0] bg-white px-5 py-8">
            <Ionicons name={isBulletin ? "document-text-outline" : "calendar-outline"} size={29} color="#72777d" />
            <Text className="mt-3 text-base font-bold text-[#202122]">Aucun document disponible</Text>
            <Text className="mt-1 text-center text-sm text-[#72777d]">Les documents publiés par l’établissement apparaîtront ici.</Text>
          </View>
        ) : null}
        {documents.map((document) => (
          <View key={document.id} className="mt-4 flex-row items-center rounded-xl border border-[#eaecf0] bg-white p-4">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#eaf3ff]">
              <Ionicons name={isBulletin ? "document-text-outline" : "calendar-outline"} size={21} color="#3366cc" />
            </View>
            <View className="flex-1">
              <Text numberOfLines={2} className="font-bold text-[#202122]">{document.name}</Text>
              <Text className="mt-1 text-xs text-[#72777d]">
                {[document.childName, document.trimester, document.createdAt].filter(Boolean).join(" · ") || document.mimeType || "Document"}
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Ouvrir ${document.name}`} onPress={() => openDocument(document)} disabled={!document.url || openingId === document.id} className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-[#3366cc]">
              {openingId === document.id ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="open-outline" size={19} color="white" />}
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}