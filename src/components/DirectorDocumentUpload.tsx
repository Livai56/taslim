import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import Header from "@/components/Header/Header";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/services/api";

type DirectorDocumentUploadProps = {
  title: string;
  endpoint: string;
  field: string;
  uploadLabel: string;
  extraFields?: Record<string, string>;
};

export default function DirectorDocumentUpload({ title, endpoint, field, uploadLabel, extraFields = {} }: DirectorDocumentUploadProps) {
  const { token } = useAuth();
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function pickFiles() {
    setError("");
    setFeedback("");
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (!result.canceled) setFiles((current) => [...current, ...result.assets]);
  }

  async function sendFiles() {
    if (!token || !files.length) return;
    setLoading(true);
    setError("");
    setFeedback("");
    try {
      const formData = new FormData();
      files.forEach((file) => {
        if (Platform.OS === "web" && file.file) {
          formData.append(field, file.file as unknown as Blob, file.name);
        } else {
          formData.append(field, {
            uri: file.uri,
            name: file.name,
            type: file.mimeType ?? "application/octet-stream",
          } as unknown as Blob);
        }
      });
      Object.entries(extraFields).forEach(([name, value]) => formData.append(name, value));

      const response = await fetch(`${getApiUrl()}${endpoint}`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { detail?: string; message?: string } | null;
        throw new Error(body?.detail ?? body?.message ?? `Échec de l'envoi (${response.status}).`);
      }

      setFeedback(`${files.length} fichier(s) envoyé(s) avec succès.`);
      setFiles([]);
      setConfirmOpen(false);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "L'envoi a échoué.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-[#f7faf8] dark:bg-slate-950">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-6">
        <Text className="text-[26px] font-extrabold text-[#202122]">{title}</Text>
        <Text className="mt-1 text-sm text-[#72777d]">Sélectionnez les documents PDF ou les images à transmettre.</Text>

        <Pressable
          accessibilityRole="button"
          onPress={pickFiles}
          disabled={loading}
          className="mt-6 min-h-32 items-center justify-center rounded-xl border-2 border-dashed border-[#a7c4eb] bg-white px-5 py-6 active:bg-[#f2f6fc]"
        >
          <Text className="text-base font-bold text-[#3366cc]">Choisir des fichiers</Text>
          <Text className="mt-1 text-center text-xs text-[#72777d]">PDF ou images · sélection multiple</Text>
        </Pressable>

        {files.length ? (
          <View className="mt-6">
            <Text className="mb-2 text-sm font-bold text-[#202122]">Fichiers sélectionnés ({files.length})</Text>
            {files.map((file, index) => (
              <View key={`${file.uri}-${index}`} className="mb-2 min-h-14 flex-row items-center rounded-lg border border-[#eaecf0] bg-white px-3 py-2">
                <Text numberOfLines={1} className="flex-1 text-sm text-[#202122]">{file.name}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer ${file.name}`}
                  onPress={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                  className="ml-2 p-2"
                >
                  <Text className="font-semibold text-[#b32424]">Retirer</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {error ? <Text accessibilityRole="alert" className="mt-4 text-sm font-semibold text-[#b32424]">{error}</Text> : null}
        {feedback ? <Text className="mt-4 text-sm font-semibold text-[#13786c]">{feedback}</Text> : null}

        <View className="mt-6 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirmOpen(true)}
            disabled={!files.length || loading || !token}
            className={`min-h-12 flex-1 items-center justify-center rounded-lg px-4 ${files.length && token ? "bg-[#3366cc] active:opacity-80" : "bg-[#aeb4bb]"}`}
          >
            <Text className="font-bold text-white">{uploadLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => { setFiles([]); setError(""); setFeedback(""); }}
            disabled={!files.length || loading}
            className="min-h-12 items-center justify-center rounded-lg border border-[#c8ccd1] bg-white px-4"
          >
            <Text className="font-semibold text-[#202122]">Annuler</Text>
          </Pressable>
        </View>
        {!token ? <Text className="mt-3 text-xs text-[#72777d]">Connectez-vous pour envoyer des documents.</Text> : null}
      </ScrollView>

      <Modal transparent animationType="fade" visible={confirmOpen} onRequestClose={() => setConfirmOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm rounded-xl bg-white p-5">
            <Text className="text-lg font-bold text-[#202122]">Confirmer l'envoi</Text>
            <Text className="mt-2 text-sm leading-5 text-[#54595d]">{files.length} fichier(s) seront transmis au serveur.</Text>
            <View className="mt-5 flex-row justify-end gap-3">
              <Pressable onPress={() => setConfirmOpen(false)} disabled={loading} className="min-h-11 justify-center px-3">
                <Text className="font-semibold text-[#54595d]">Retour</Text>
              </Pressable>
              <Pressable onPress={sendFiles} disabled={loading} className="min-h-11 min-w-24 items-center justify-center rounded-lg bg-[#3366cc] px-4">
                {loading ? <ActivityIndicator color="white" /> : <Text className="font-bold text-white">Envoyer</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}