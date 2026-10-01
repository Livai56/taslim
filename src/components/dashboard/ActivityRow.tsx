import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import type { Activity } from "@/types/school";

export function ActivityRow({ activity }: { activity: Activity }) {
	const colors = { teal: "#13786c", orange: "#c56a1b", blue: "#3f67c8" };
	return (
		<View className="flex-row items-center border-b border-[#eef2f0] py-3 last:border-b-0">
			<View className="h-10 w-10 items-center justify-center rounded-full bg-[#f1f6f4]">
				<MaterialCommunityIcons name={activity.icon} size={19} color={colors[activity.tone]} />
			</View>
			<View className="ml-3 flex-1">
				<Text className="text-[14px] font-bold text-[#173f43]">{activity.title}</Text>
				<Text className="mt-1 text-[12px] text-[#788a86]">{activity.detail}</Text>
			</View>
			<Text className="text-[11px] text-[#9aa9a5]">{activity.time}</Text>
		</View>
	);
}
