import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Header from "../../components/Header/Header";
import { useAuth } from "@/context/AuthContext";
import { useSettings, type ThemePreference } from "@/context/SettingsContext";

const settingsSections = [
  {
    key: "general",
    title: "Général",
    description: "Préférences de l’application",
    icon: "options-outline",
  },
  {
    key: "profile",
    title: "Profil",
    description: "Vos informations personnelles",
    icon: "person-circle-outline",
  },
  {
    key: "language",
    title: "Langue",
    description: "Langue de l’application",
    icon: "language-outline",
  },
  {
    key: "privacy",
    title: "Confidentialité",
    description: "Données et confidentialité",
    icon: "lock-closed-outline",
  },
  {
    key: "downloads",
    title: "Téléchargements",
    description: "Documents disponibles hors ligne",
    icon: "download-outline",
  },
] as const;

type SettingsSection = (typeof settingsSections)[number]["key"];

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, notificationsEnabled, messagePreviewsEnabled, voiceMessagesEnabled, updateSettings } = useSettings();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SettingsSection | null>(null);
  const section = settingsSections.find((item) => item.key === selectedSection);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      <Header />

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-6">
        {section ? (
          <>
            <Pressable
              onPress={() => setSelectedSection(null)}
              accessibilityRole="button"
              className="mb-6 min-h-10 flex-row items-center self-start"
            >
              <Ionicons name="arrow-back" size={20} color="#3366cc" />
              <Text className="ml-2 text-sm font-semibold text-[#3366cc]">
                Tous les paramètres
              </Text>
            </Pressable>

            <View className="mb-6 flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-[#eaf3ff]">
                  <Ionicons
                  name={section.icon}
                  size={23}
                  color={theme === "dark" ? "#8fb8ff" : "#3366cc"}
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                  {section.title}
                </Text>
                <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {section.description}
                </Text>
              </View>
            </View>

            {selectedSection === "profile" ? (
              <View className="border-t border-[#eaecf0]">
                {[
                  ["Nom", user ? `${user.firstName} ${user.lastName}`.trim() : "Utilisateur"],
                  ["E-mail", user?.email || "Non renseigné"],
                  ["Établissement", user?.schoolName || "Non renseigné"],
                  ["Rôle", user?.role || "Non renseigné"],
                ].map(([label, value]) => (
                  <View key={label} className="border-b border-[#eaecf0] py-4">
                    <Text className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      {label}
                    </Text>
                    <Text className="mt-1 text-base font-medium text-slate-900 dark:text-white">
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : selectedSection === "general" ? (
              <View className="border-t border-slate-200 py-4 dark:border-slate-800">
                <Text className="mb-3 text-sm font-bold text-slate-800 dark:text-white">Thème de l’application</Text>
                <View className="flex-row rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                  {([
                    ["system", "Système"],
                    ["light", "Clair"],
                    ["dark", "Sombre"],
                  ] as [ThemePreference, string][]).map(([value, label]) => (
                    <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: theme === value }} onPress={() => void updateSettings({ theme: value })} className={`min-h-10 flex-1 items-center justify-center rounded-md px-2 ${theme === value ? "bg-[#13786c]" : "bg-transparent"}`}>
                      <Text className={`text-xs font-bold ${theme === value ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                <PreferenceToggle label="Notifications dans l’application" description="Masquer ou afficher la liste des notifications." value={notificationsEnabled} onValueChange={(value) => void updateSettings({ notificationsEnabled: value })} />
                <PreferenceToggle label="Aperçus des messages" description="Afficher le contenu des derniers messages dans les listes." value={messagePreviewsEnabled} onValueChange={(value) => void updateSettings({ messagePreviewsEnabled: value })} />
                <PreferenceToggle label="Messages vocaux" description="Autoriser l’enregistrement et l’envoi de notes vocales." value={voiceMessagesEnabled} onValueChange={(value) => void updateSettings({ voiceMessagesEnabled: value })} />
              </View>
            ) : selectedSection === "privacy" ? (
              <View className="border-t border-slate-200 py-4 dark:border-slate-800">
                <Text className="text-base font-bold text-slate-900 dark:text-white">Politique de confidentialité</Text>
                <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">Dernière mise à jour : 30 septembre 2026</Text>
                <PolicyParagraph title="Données traitées" text="Taslim traite les informations de compte (nom, prénom, identifiant, adresse e-mail et téléphone), les liens parent-élève, les classes, les présences, retards, notes, bulletins, emplois du temps et échanges avec l’établissement. Les messages vocaux sont enregistrés uniquement après autorisation du microphone." />
                <PolicyParagraph title="Finalités" text="Ces données servent à authentifier les utilisateurs, associer les parents à leurs enfants, transmettre le suivi scolaire et permettre les échanges entre les membres autorisés de l’établissement." />
                <PolicyParagraph title="Accès et conservation" text="L’accès est limité par le compte et le rôle attribué. Les données scolaires et les messages sont transmis au serveur Django de l’établissement; leur durée de conservation dépend de l’établissement et de ses obligations. Le jeton de session et les préférences sont conservés sur l’appareil." />
                <PolicyParagraph title="Microphone" text="Le microphone n’est sollicité qu’au démarrage d’un enregistrement vocal. Vous pouvez refuser l’autorisation; les messages texte restent disponibles. Un brouillon vocal peut être supprimé avant l’envoi." />
                <PolicyParagraph title="Vos droits" text="Pour consulter, corriger ou demander la suppression de vos données, contactez la direction de votre établissement, qui administre le serveur et les comptes. Les coordonnées de contact doivent être communiquées par l’établissement." />
                <PolicyParagraph title="Sécurité" text="L’application transmet les échanges à l’API configurée. L’établissement doit utiliser HTTPS en production et gérer les accès, sauvegardes et durées de conservation de son serveur." />
                <PreferenceToggle label="Masquer les aperçus" description="Remplacer les extraits par une indication neutre dans les listes." value={!messagePreviewsEnabled} onValueChange={(value) => void updateSettings({ messagePreviewsEnabled: !value })} />
              </View>
            ) : (
              <View className="border-t border-[#eaecf0] py-5">
                <Text className="text-base font-semibold text-slate-900 dark:text-white">
                  {selectedSection === "general" && "Apparence"}
                  {selectedSection === "language" && "Langue actuelle"}
                  {selectedSection === "privacy" && "Confidentialité du compte"}
                  {selectedSection === "downloads" && "Fichiers hors ligne"}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {selectedSection === "language" && "Français. Le changement de langue n’est pas encore disponible."}
                  {selectedSection === "downloads" && "Aucun document téléchargé pour le moment."}
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text className="text-[26px] font-extrabold text-[#202122] dark:text-white">
              Paramètres
            </Text>
            <Text className="mt-1 text-sm text-[#72777d] dark:text-slate-400">
              Gérez votre compte et les préférences de l’application.
            </Text>

            <View className="mt-6 border-t border-[#eaecf0]">
              {settingsSections.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => setSelectedSection(item.key)}
                  accessibilityRole="button"
                  className="min-h-[68px] flex-row items-center border-b border-[#eaecf0] py-3 active:bg-[#f1f4f8]"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-[#eaf3ff]">
                    <Ionicons name={item.icon} size={20} color="#3366cc" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-[15px] font-semibold text-[#202122] dark:text-white">
                      {item.title}
                    </Text>
                    <Text className="mt-1 text-xs text-[#72777d] dark:text-slate-400">
                      {item.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#72777d" />
                </Pressable>
              ))}
            </View>

            <Text className="mt-6 text-base font-semibold text-slate-900 dark:text-white">
              {user ? `${user.firstName} ${user.lastName}`.trim() : "Utilisateur"}
            </Text>
            <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {user?.email}
            </Text>
            <Pressable
              onPress={handleSignOut}
              disabled={isSigningOut}
              className="mt-6 min-h-12 flex-row items-center justify-center rounded-lg bg-red-600 px-4 active:opacity-80"
            >
              {isSigningOut ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-bold text-white">Se déconnecter</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function PreferenceToggle({ label, description, value, onValueChange }: { label: string; description: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View className="mt-5 min-h-16 flex-row items-center justify-between gap-4 border-b border-slate-200 py-3 dark:border-slate-800">
      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-900 dark:text-white">{label}</Text>
        <Text className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#cbd5e1", true: "#8bc8bb" }} thumbColor={value ? "#13786c" : "#f8fafc"} accessibilityLabel={label} />
    </View>
  );
}

function PolicyParagraph({ title, text }: { title: string; text: string }) {
  return (
    <View className="mt-5">
      <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</Text>
      <Text className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</Text>
    </View>
  );
}