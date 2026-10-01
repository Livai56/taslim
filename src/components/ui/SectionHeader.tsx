import { Text, View } from "react-native";

type SectionHeaderProps = { title: string; action?: string };

export function SectionHeader({ title, action }: SectionHeaderProps) {
	return (
		<View className="mb-3 flex-row items-center justify-between">
			<Text className="text-[18px] font-extrabold text-[#173f43]">{title}</Text>
			{action ? <Text className="text-[13px] font-bold text-[#13786c]">{action}</Text> : null}
		</View>
	);
}
