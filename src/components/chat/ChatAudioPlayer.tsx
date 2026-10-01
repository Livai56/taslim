import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Pressable, Text, View } from "react-native";
import { resolveApiAssetUrl } from "@/services/api";

export default function ChatAudioPlayer({ uri, token, light = false }: { uri: string; token?: string | null; light?: boolean }) {
  const source = uri.startsWith("file:") || uri.startsWith("blob:")
    ? { uri }
    : { uri: resolveApiAssetUrl(uri), headers: token ? { Authorization: `Bearer ${token}` } : undefined };
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const foreground = light ? "text-white" : "text-slate-800 dark:text-slate-100";

  return (
    <View className="min-w-44 flex-row items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? "Mettre le message vocal en pause" : "Lire le message vocal"}
        onPress={() => {
          if (status.playing) player.pause();
          else {
            if (status.duration > 0 && status.currentTime >= status.duration) player.seekTo(0);
            player.play();
          }
        }}
        className={`h-9 w-9 items-center justify-center rounded-full ${light ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"}`}
      >
        <Ionicons name={status.playing ? "pause" : "play"} size={17} color={light ? "white" : "#13786c"} />
      </Pressable>
      <View className="flex-1">
        <Text className={`text-xs font-semibold ${foreground}`}>Message vocal</Text>
        <Text className={`text-[10px] ${light ? "text-white/70" : "text-slate-500 dark:text-slate-400"}`}>
          {status.duration ? `${Math.round(status.duration)} s` : "Audio"}
        </Text>
      </View>
    </View>
  );
}
