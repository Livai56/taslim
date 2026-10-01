import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, Redirect, router } from "expo-router";

import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { user, isLoading, signIn } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f7faf8] dark:bg-slate-950">
        <ActivityIndicator size="large" color="#13786c" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) {
      setError("Veuillez renseigner votre nom d’utilisateur et votre mot de passe.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn({
        username: username.trim(),
        password,
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error(
        "Erreur login :",
        error?.response?.data || error?.message
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Identifiant ou mot de passe incorrect."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#f7faf8] dark:bg-slate-950"
    >
      <View className="flex-1 justify-center px-6">

        <View className="mb-10 h-16 w-16 items-center justify-center rounded-[22px] bg-[#13786c]">
          <MaterialCommunityIcons
            name="school-outline"
            size={34}
            color="white"
          />
        </View>

        <Text className="text-[14px] font-bold uppercase tracking-[1.5px] text-[#78908a]">
          Taslim École
        </Text>

        <Text className="mt-2 text-[32px] font-extrabold text-[#173f43]">
          Bienvenue.
        </Text>

        <Text className="mt-2 text-[15px] leading-6 text-[#788a86]">
          Suivez la vie de votre établissement depuis un seul espace.
        </Text>

        <View className="mt-9 gap-4">

          <TextInput
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              setError("");
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Nom d’utilisateur"
            placeholderTextColor="#9aa9a5"
            editable={!loading}
            className="rounded-2xl border border-[#dce8e3] bg-white px-4 py-4 text-[15px] text-[#173f43]"
          />

          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError("");
            }}
            secureTextEntry
            placeholder="Mot de passe"
            placeholderTextColor="#9aa9a5"
            editable={!loading}
            className="rounded-2xl border border-[#dce8e3] bg-white px-4 py-4 text-[15px] text-[#173f43]"
          />

        </View>

        {error ? (
          <Text className="mt-3 text-[13px] font-semibold text-[#c84f61]">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="mt-6 items-center rounded-2xl bg-[#13786c] py-4 active:opacity-80"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-[15px] font-extrabold text-white">
              Se connecter
            </Text>
          )}
        </Pressable>

        <Link
          href="/forgot-password"
          className="mt-6 text-center text-[13px] font-bold text-[#13786c]"
        >
          Mot de passe oublié ?
        </Link>

      </View>
    </KeyboardAvoidingView>
  );
}