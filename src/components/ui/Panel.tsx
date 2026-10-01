import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { cn } from "@/lib/cn";

type PanelProps = PropsWithChildren<{ className?: string }>;

export function Panel({ children, className }: PanelProps) {
	return <View className={cn("rounded-[22px] border border-[#e5ece8] bg-white p-4", className)}>{children}</View>;
}
