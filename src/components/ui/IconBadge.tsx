import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const tones = {
	teal: { background: "bg-[#e2f3ee]", color: "#13786c" },
	orange: { background: "bg-[#fff0dc]", color: "#c56a1b" },
	blue: { background: "bg-[#e8efff]", color: "#3f67c8" },
	pink: { background: "bg-[#ffe6ed]", color: "#cb5372" },
} as const;

type IconBadgeProps = { icon: IconName; tone: keyof typeof tones; size?: number };

export function IconBadge({ icon, tone, size = 20 }: IconBadgeProps) {
	return (
		<View className={`h-11 w-11 items-center justify-center rounded-2xl ${tones[tone].background}`}>
			<MaterialCommunityIcons name={icon} size={size} color={tones[tone].color} />
		</View>
	);
}
