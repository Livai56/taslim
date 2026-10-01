import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <View className="flex-1 items-center justify-center bg-[#f7faf8]"><ActivityIndicator color="#13786c" /></View>;
  return <Redirect href={user ? "/(tabs)" : "/login"} />;
}