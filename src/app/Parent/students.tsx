import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import Header from "@/components/Header/Header";
import { useAuth } from "@/context/AuthContext";
import { schoolApi } from "@/services/api";
import type { Student } from "@/types/school";

export default function EnfantsSuivis() {
	const { token } = useAuth();
	const [children, setChildren] = useState<Student[]>([]);
	const [loading, setLoading] = useState(Boolean(token));
	const [error, setError] = useState("");

	useEffect(() => {
		if (!token) { setLoading(false); return; }
		let current = true;
		schoolApi.getChildren(token)
			.then((result) => { if (current) setChildren(result); })
			.catch((reason: unknown) => { if (current) setError(reason instanceof Error ? reason.message : "Impossible de charger les enfants."); })
			.finally(() => { if (current) setLoading(false); });
		return () => { current = false; };
	}, [token]);

	return (
		<View className="flex-1 bg-[#f7f8fa] dark:bg-slate-950">
			<Header />
			<ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-6">
				<Text className="text-[26px] font-extrabold text-[#202122] dark:text-white">Mes enfants</Text>
				<Text className="mt-1 text-sm text-[#72777d] dark:text-slate-400">Leur présence et leurs résultats scolaires.</Text>
				{loading ? <ActivityIndicator className="mt-8" color="#3366cc" /> : null}
				{error ? <Text accessibilityRole="alert" className="mt-5 rounded-lg border border-[#f0c4bd] bg-white p-4 text-sm text-[#a23b2a]">{error}</Text> : null}
				{!loading && !error && children.length === 0 ? <Text className="mt-8 text-center text-sm text-[#72777d]">Aucun enfant n’est associé à ce compte.</Text> : null}
				{children.map((child) => (
					<View key={child.id} className="mt-4 rounded-xl border border-[#eaecf0] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
						<View className="flex-row items-center">
							<View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#eaf3ff]"><Text className="font-bold text-[#3366cc]">{child.name.slice(0, 1).toUpperCase()}</Text></View>
							<View className="flex-1"><Text className="font-bold text-[#202122] dark:text-white">{child.name}</Text><Text className="mt-1 text-xs text-[#72777d] dark:text-slate-400">{child.className}</Text></View>
						</View>
						<View className="mt-4 flex-row border-t border-[#eaecf0] pt-3 dark:border-slate-800">
							<View className="flex-1"><Text className="text-xs text-[#72777d] dark:text-slate-400">Présence</Text><Text className="mt-1 font-bold text-[#13786c] dark:text-emerald-300">{child.attendance}%</Text></View>
							<View className="flex-1"><Text className="text-xs text-[#72777d] dark:text-slate-400">Moyenne</Text><Text className="mt-1 font-bold text-[#202122] dark:text-white">{child.average}</Text></View>
							<View className="flex-1"><Text className="text-xs text-[#72777d] dark:text-slate-400">Statut</Text><Text className="mt-1 font-bold text-[#202122] dark:text-white">{child.status}</Text></View>
						</View>
					</View>
				))}
			</ScrollView>
		</View>
	);
}
