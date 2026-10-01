import { Text, View } from "react-native";
import { IconBadge } from "@/components/ui/IconBadge";
import type { DashboardStat } from "@/types/school";

export function MetricCard({ stat }: { stat: DashboardStat }) {
	return (
		<View className="mr-3 w-[157px] rounded-[20px] border border-[#e5ece8] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
			<IconBadge icon={stat.icon} tone={stat.tone} size={18} />
			<Text className="mt-4 text-[25px] font-extrabold text-[#173f43] dark:text-white">{stat.value}</Text>
			<Text className="mt-1 text-[13px] font-semibold text-[#6d817c] dark:text-slate-300">{stat.label}</Text>
			<Text className="mt-3 text-[11px] font-bold text-[#13786c]">{stat.change}</Text>
		</View>
	);
}
