import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { schoolApi } from "@/services/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setError("Saisissez une adresse e-mail valide.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await schoolApi.requestPasswordReset({ email: address });
      setSent(true);
    } catch {
      setError("La demande n'a pas pu être envoyée. Vérifiez votre connexion puis réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-white dark:bg-slate-950" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-md self-center">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-[#eaf3ff]">
            <MaterialCommunityIcons name="lock-reset" size={28} color="#3366cc" />
          </View>
          <Text className="mt-7 text-[28px] font-extrabold text-[#202122]">Mot de passe oublié ?</Text>
          <Text className="mt-2 text-[15px] leading-6 text-[#54595d]">
            Saisissez l’adresse e-mail associée à votre compte. Nous vous enverrons les instructions de réinitialisation.
          </Text>

          {sent ? (
            <View accessibilityRole="alert" className="mt-7 flex-row rounded-xl border border-[#a3d3b2] bg-[#f1f8f3] p-4">
              <MaterialCommunityIcons name="check-circle-outline" size={22} color="#14804a" />
              <Text className="ml-3 flex-1 text-sm leading-5 text-[#245b3c]">
                Si cette adresse correspond à un compte, un lien de réinitialisation vient d’être envoyé.
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-2 mt-7 text-sm font-semibold text-[#202122]">Adresse e-mail</Text>
              <TextInput
                value={email}
                onChangeText={(value) => { setEmail(value); setError(""); }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                accessibilityLabel="Adresse e-mail"
                placeholder="nom@exemple.com"
                placeholderTextColor="#72777d"
                editable={!submitting}
                className={`min-h-12 rounded-lg border bg-white px-4 text-[15px] text-[#202122] ${error ? "border-[#b54736]" : "border-[#a2a9b1]"}`}
              />
              {error ? (
                <View accessibilityRole="alert" className="mt-2 flex-row items-center">
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#b54736" />
                  <Text className="ml-1.5 flex-1 text-xs text-[#b54736]">{error}</Text>
                </View>
              ) : null}
              <Pressable accessibilityRole="button" onPress={handleSubmit} disabled={submitting} className="mt-5 min-h-12 items-center justify-center rounded-lg bg-[#3366cc] px-4 active:opacity-80">
                {submitting ? <ActivityIndicator color="white" /> : <Text className="text-sm font-bold text-white">Envoyer les instructions</Text>}
              </Pressable>
            </>
          )}

          <Link href="/login" className="mt-7 self-center text-sm font-bold text-[#3366cc]">
            Retour à la connexion
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}