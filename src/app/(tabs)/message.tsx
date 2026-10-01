import { Ionicons } from "@expo/vector-icons";
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useForegroundPolling } from "@/hooks/useForegroundPolling";
import { schoolApi } from "@/services/api";
import ChatAudioPlayer from "@/components/chat/ChatAudioPlayer";
import type { ChatContact, ChatMessage } from "@/types/chat";

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

export default function Messages() {
  const { token, user } = useAuth();
  const { messagePreviewsEnabled, voiceMessagesEnabled } = useSettings();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [contactsLoading, setContactsLoading] = useState(Boolean(token));
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactsError, setContactsError] = useState("");
  const [conversationError, setConversationError] = useState("");
  const [sendError, setSendError] = useState("");
  const [contactsVersion, setContactsVersion] = useState(0);
  const [conversationVersion, setConversationVersion] = useState(0);
  const conversationRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!token) {
      setContacts([]);
      setContactsLoading(false);
      return;
    }
    let isCurrent = true;
    setContactsLoading(true);
    setContactsError("");
    schoolApi.getChatContacts(token)
      .then((result) => { if (isCurrent) setContacts(result); })
      .catch((error: unknown) => {
        if (isCurrent) setContactsError(error instanceof Error ? error.message : "Les discussions sont indisponibles.");
      })
      .finally(() => { if (isCurrent) setContactsLoading(false); });
    return () => { isCurrent = false; };
  }, [token, contactsVersion]);

  useEffect(() => {
    if (!token || !selectedContact) {
      setMessages([]);
      return;
    }
    let isCurrent = true;
    setMessages([]);
    setConversationLoading(true);
    setConversationError("");
    schoolApi.getConversation(token, selectedContact.id)
      .then((result) => { if (isCurrent) setMessages(result); })
      .catch((error: unknown) => {
        if (isCurrent) setConversationError(error instanceof Error ? error.message : "Impossible de charger cette conversation.");
      })
      .finally(() => { if (isCurrent) setConversationLoading(false); });
    return () => { isCurrent = false; };
  }, [token, selectedContact?.id, conversationVersion]);

  useForegroundPolling(async () => {
    if (!token || selectedContact) return;
    try {
      setContacts(await schoolApi.getChatContacts(token));
      setContactsError("");
    } catch (error) {
      setContactsError(error instanceof Error ? error.message : "Les discussions sont indisponibles.");
    }
  }, 15000, Boolean(token) && !selectedContact);

  useForegroundPolling(async () => {
    if (!token || !selectedContact) return;
    try {
      setMessages(await schoolApi.getConversation(token, selectedContact.id));
      setConversationError("");
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : "Impossible d’actualiser cette conversation.");
    }
  }, 10000, Boolean(token) && Boolean(selectedContact));

  useEffect(() => {
    if (messages.length) requestAnimationFrame(() => conversationRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  async function sendMessage() {
    const content = draft.trim();
    if (!token || !selectedContact || !content || sending) return;
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      senderId: String(user?.id ?? ""),
      text: content,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setDraft("");
    setSending(true);
    setSendError("");
    try {
      const sent = await schoolApi.sendChatMessage(token, selectedContact.id, content);
      if (sent.length) setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), ...sent]);
    } catch (error) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setDraft(content);
      setSendError(error instanceof Error ? error.message : "Le message n'a pas pu être envoyé.");
    } finally {
      setSending(false);
    }
  }

  async function toggleRecording() {
    if (!token || !selectedContact || sending) return;
    setSendError("");
    try {
      if (recorderState.isRecording) {
        await recorder.stop();
        setVoiceUri(recorder.uri);
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        return;
      }
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setSendError("L’autorisation du microphone est nécessaire pour enregistrer un message vocal.");
        return;
      }
      setVoiceUri(null);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Impossible d’accéder au microphone.");
    }
  }

  async function sendVoiceMessage() {
    if (!token || !selectedContact || !voiceUri || sending) return;
    const localUri = voiceUri;
    const optimistic: ChatMessage = {
      id: `local-audio-${Date.now()}`,
      senderId: String(user?.id ?? ""),
      text: "Message vocal",
      createdAt: new Date().toISOString(),
      audioUrl: localUri,
    };
    setMessages((current) => [...current, optimistic]);
    setVoiceUri(null);
    setSending(true);
    setSendError("");
    try {
      const sent = await schoolApi.sendChatAudioMessage(token, selectedContact.id, localUri);
      if (sent.length) setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), ...sent]);
    } catch (error) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setVoiceUri(localUri);
      setSendError(error instanceof Error ? error.message : "Le message vocal n’a pas pu être envoyé.");
    } finally {
      setSending(false);
    }
  }

  const filteredContacts = contacts.filter((contact) => contact.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <KeyboardAvoidingView className="flex-1 bg-[#f7f8fa] dark:bg-slate-950" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {selectedContact ? (
        <>
          <View className="flex-row items-center border-b border-[#eaecf0] bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <Pressable accessibilityRole="button" accessibilityLabel="Retour aux discussions" onPress={() => { setSelectedContact(null); setConversationError(""); setSendError(""); }} className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-[#f1f3f5]">
              <Ionicons name="arrow-back" size={21} color="#202122" />
            </Pressable>
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#eaf3ff]">
              <Text className="font-bold text-[#3366cc]">{initials(selectedContact.name)}</Text>
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-base font-bold text-[#202122] dark:text-white">{selectedContact.name}</Text>
              <Text numberOfLines={1} className="text-xs text-[#72777d]">{selectedContact.role ?? "Discussion"}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Actualiser la conversation" onPress={() => setConversationVersion((version) => version + 1)} className="h-10 w-10 items-center justify-center rounded-full active:bg-[#f1f3f5]">
              <Ionicons name="refresh-outline" size={20} color="#54595d" />
            </Pressable>
          </View>

          <ScrollView ref={conversationRef} className="flex-1" contentContainerClassName="px-4 py-5">
            <Text className="mb-5 self-center rounded-full bg-white px-3 py-1 text-[11px] text-[#72777d] dark:bg-slate-900 dark:text-slate-400">Conversation privée</Text>
            {conversationLoading ? <ActivityIndicator className="mt-8" color="#3366cc" /> : null}
            {conversationError ? (
              <View className="items-center py-8">
                <Text className="text-center text-sm text-[#b54736]">{conversationError}</Text>
                <Pressable onPress={() => setConversationVersion((version) => version + 1)} className="mt-3 rounded-lg px-4 py-2"><Text className="font-bold text-[#3366cc]">Réessayer</Text></Pressable>
              </View>
            ) : null}
            {!conversationLoading && !conversationError && messages.length === 0 ? (
              <View className="items-center py-12">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-900"><Ionicons name="chatbubble-ellipses-outline" size={23} color="#72777d" /></View>
                <Text className="mt-3 text-sm font-semibold text-[#54595d]">Commencez la conversation</Text>
                <Text className="mt-1 text-center text-xs text-[#72777d]">Votre message apparaîtra ici.</Text>
              </View>
            ) : null}
            {messages.map((item) => {
              const isMine = item.senderId !== "" && item.senderId === String(user?.id ?? "");
              return (
                <View key={item.id} className={`mb-3 flex-row ${isMine ? "justify-end" : "justify-start"}`}>
                  <View className={`max-w-[84%] rounded-2xl px-3 py-2 ${isMine ? "rounded-br-sm bg-[#3366cc]" : "rounded-bl-sm border border-[#eaecf0] bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
                    {item.audioUrl ? <ChatAudioPlayer uri={item.audioUrl} token={token} light={isMine} /> : <Text className={`text-[15px] leading-5 ${isMine ? "text-white" : "text-[#202122] dark:text-slate-100"}`}>{item.text}</Text>}
                    <Text className={`mt-1 self-end text-[10px] ${isMine ? "text-blue-100" : "text-[#72777d] dark:text-slate-400"}`}>{formatTime(item.createdAt)}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View className="border-t border-[#eaecf0] bg-white px-3 pb-3 pt-2 dark:border-slate-800 dark:bg-slate-900">
            {sendError ? <Text accessibilityRole="alert" className="mb-2 text-xs text-[#b54736]">{sendError}</Text> : null}
            {voiceUri ? (
              <View className="mb-2 flex-row items-center justify-between rounded-lg border border-[#eaecf0] p-2 dark:border-slate-700">
                <ChatAudioPlayer uri={voiceUri} />
                <View className="ml-2 flex-row items-center gap-1">
                  <Pressable accessibilityRole="button" accessibilityLabel="Supprimer le brouillon vocal" onPress={() => setVoiceUri(null)} className="h-9 w-9 items-center justify-center"><Ionicons name="trash-outline" size={18} color="#b54736" /></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Envoyer le message vocal" onPress={sendVoiceMessage} disabled={sending} className="h-9 w-9 items-center justify-center rounded-full bg-[#14804a]">{sending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={16} color="white" />}</Pressable>
                </View>
              </View>
            ) : null}
            <View className="flex-row items-end gap-2">
              {voiceMessagesEnabled ? <Pressable accessibilityRole="button" accessibilityLabel={recorderState.isRecording ? "Arrêter l’enregistrement vocal" : "Enregistrer un message vocal"} accessibilityState={{ selected: recorderState.isRecording }} onPress={toggleRecording} disabled={sending} className={`h-11 w-11 items-center justify-center rounded-full ${recorderState.isRecording ? "bg-[#b54736]" : "bg-[#f1f3f5] dark:bg-slate-800"}`}><Ionicons name={recorderState.isRecording ? "stop" : "mic-outline"} size={19} color={recorderState.isRecording ? "white" : "#13786c"} /></Pressable> : null}
              <TextInput value={draft} onChangeText={setDraft} multiline maxLength={2000} placeholder={recorderState.isRecording ? "Enregistrement en cours…" : "Écrire un message…"} placeholderTextColor="#72777d" accessibilityLabel="Votre message" editable={!recorderState.isRecording} className="max-h-28 min-h-11 flex-1 rounded-2xl bg-[#f1f3f5] px-4 py-3 text-[15px] text-[#202122] dark:bg-slate-800 dark:text-white" />
              <Pressable accessibilityRole="button" accessibilityLabel="Envoyer le message" onPress={sendMessage} disabled={!draft.trim() || sending} className={`h-11 w-11 items-center justify-center rounded-full ${draft.trim() && !sending ? "bg-[#3366cc]" : "bg-[#c8ccd1]"}`}>
                {sending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={18} color="white" />}
              </Pressable>
            </View>
          </View>
        </>
      ) : (
        <>
          <View className="border-b border-[#eaecf0] bg-white px-5 pb-4 pt-5 dark:border-slate-800 dark:bg-slate-900">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[26px] font-extrabold text-[#202122] dark:text-white">Messages</Text>
                <Text className="mt-1 text-sm text-[#72777d]">Échangez avec votre établissement.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Actualiser les discussions" onPress={() => setContactsVersion((version) => version + 1)} className="h-10 w-10 items-center justify-center rounded-full active:bg-[#f1f3f5]">
                <Ionicons name="refresh-outline" size={20} color="#54595d" />
              </Pressable>
            </View>
            <View className="mt-4 flex-row items-center rounded-xl bg-[#f1f3f5] px-3 dark:bg-slate-800">
              <Ionicons name="search-outline" size={19} color="#72777d" />
              <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher une discussion" placeholderTextColor="#72777d" accessibilityLabel="Rechercher une discussion" className="h-11 flex-1 px-2 text-sm text-[#202122] dark:text-white" />
              {search ? <Pressable onPress={() => setSearch("")} accessibilityLabel="Effacer la recherche" className="p-2"><Ionicons name="close-circle" size={18} color="#72777d" /></Pressable> : null}
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="pb-6">
            {contactsLoading ? <ActivityIndicator className="mt-10" color="#3366cc" /> : null}
            {contactsError ? (
              <View className="items-center px-6 py-10">
                <Ionicons name="cloud-offline-outline" size={30} color="#b54736" />
                <Text className="mt-3 text-center text-sm text-[#54595d]">Impossible de charger les discussions.</Text>
                <Pressable onPress={() => setContactsVersion((version) => version + 1)} className="mt-3 rounded-lg px-4 py-2"><Text className="font-bold text-[#3366cc]">Réessayer</Text></Pressable>
              </View>
            ) : null}
            {!contactsLoading && !contactsError && !token ? (
              <View className="items-center px-6 py-12">
                <Ionicons name="lock-closed-outline" size={30} color="#72777d" />
                <Text className="mt-3 text-base font-bold text-[#202122]">Connectez-vous pour voir vos messages</Text>
                <Pressable onPress={() => router.push("/login")} className="mt-4 rounded-lg bg-[#3366cc] px-5 py-3"><Text className="font-bold text-white">Se connecter</Text></Pressable>
              </View>
            ) : null}
            {!contactsLoading && !contactsError && token && filteredContacts.length === 0 ? (
              <View className="items-center px-6 py-12">
                <Ionicons name="chatbubbles-outline" size={30} color="#72777d" />
                <Text className="mt-3 text-base font-bold text-[#202122]">Aucune discussion</Text>
                <Text className="mt-1 text-center text-sm text-[#72777d]">{search ? "Aucun contact ne correspond à cette recherche." : "Vos conversations apparaîtront ici."}</Text>
              </View>
            ) : null}
            {filteredContacts.map((contact) => (
              <Pressable key={contact.id} accessibilityRole="button" onPress={() => setSelectedContact(contact)} className="min-h-[76px] flex-row items-center border-b border-[#eaecf0] bg-white px-4 active:bg-[#f7f8fa] dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800">
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-[#eaf3ff]"><Text className="font-bold text-[#3366cc]">{initials(contact.name)}</Text></View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text numberOfLines={1} className="flex-1 text-[15px] font-bold text-[#202122] dark:text-white">{contact.name}</Text>
                    <Text className="text-[11px] text-[#72777d]">{formatTime(contact.updatedAt)}</Text>
                  </View>
                  <Text numberOfLines={1} className="mt-1 text-sm text-[#72777d] dark:text-slate-400">{messagePreviewsEnabled ? contact.preview ?? contact.role ?? "Ouvrir la discussion" : "Contenu masqué"}</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color="#a2a9b1" />
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}
    </KeyboardAvoidingView>
  );
}