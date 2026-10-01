import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-[#f7faf8] px-6">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-[#fff0ed]">
        <MaterialCommunityIcons name="alert-outline" size={30} color="#b54736" />
      </View>
      <Text className="mt-6 text-center text-[24px] font-extrabold text-[#202122]">
        Cette page ne s’est pas chargée
      </Text>
      <Text className="mt-2 max-w-sm text-center text-[14px] leading-5 text-[#54595d]">
        Un problème est survenu. Réessayez, ou revenez un peu plus tard si le problème continue.
      </Text>
      {__DEV__ && error.message ? (
        <Text numberOfLines={3} className="mt-4 max-w-sm text-center text-xs text-[#72777d]">
          {error.message}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={retry}
        className="mt-6 min-h-12 items-center justify-center rounded-lg bg-[#3366cc] px-6 active:opacity-80"
      >
        <Text className="text-sm font-bold text-white">Réessayer</Text>
      </Pressable>
    </View>
  );
}