import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";
import type { QuickAction } from "@/types/school";

export function QuickActionCard({ action, onPress }: { action: QuickAction; onPress?: () => void }) {
	const colors = { teal: "#13786c", orange: "#c56a1b", blue: "#3f67c8" };
	return (
		<Pressable onPress={onPress} className="mr-3 w-[145px] rounded-[20px] bg-[#f3f8f6] p-4 active:opacity-70 dark:bg-slate-900">
			<MaterialCommunityIcons name={action.icon} size={25} color={colors[action.tone]} />
			<Text className="mt-4 text-[14px] font-extrabold text-[#173f43] dark:text-white">{action.label}</Text>
			<Text className="mt-1 text-[11px] leading-4 text-[#78908a] dark:text-slate-400">{action.description}</Text>
		</Pressable>
	);
}
