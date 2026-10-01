import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import Header from "@/components/Header/Header";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAuth } from "@/context/AuthContext";
import { schoolApi } from "@/services/api";
import type { Student } from "@/types/school";

export default function Statistique() {
	const { token } = useAuth();
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(Boolean(token));
	const [loadError, setLoadError] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let current = true;
		if (!token) {
			setStudents([]);
			setLoadError("Connectez-vous pour charger les statistiques de l'établissement.");
			setLoading(false);
			return () => { current = false; };
		}
		setLoadError("");
		setLoading(true);
		schoolApi.getStudents(token)
			.then((result) => { if (current) setStudents(result); })
			.catch((error: unknown) => {
				if (!current) return;
				setStudents([]);
				setLoadError(error instanceof Error ? error.message : "Impossible de charger les statistiques depuis Django.");
			})
			.finally(() => { if (current) setLoading(false); });
		return () => { current = false; };
	}, [token, reload]);

	const averageAttendance = students.length
		? Math.round(students.reduce((sum, student) => sum + student.attendance, 0) / students.length)
		: 0;
	const classCounts = students.reduce<Record<string, number>>((counts, student) => {
		counts[student.className] = (counts[student.className] ?? 0) + 1;
		return counts;
	}, {});
	const maxClassCount = Math.max(1, ...Object.values(classCounts));
	const statusCounts = ["Présent", "Absent", "En retard", "Non renseigné"].map((status) => ({
		label: status,
		count: students.filter((student) => student.status === status).length,
	}));

	return (
			<View className="flex-1 bg-[#f7faf8] dark:bg-slate-950">
			<Header />
			<ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-6">
				<Text className="text-[26px] font-extrabold text-[#173f43] dark:text-white">Statistiques</Text>
				<Text className="mt-1 text-sm text-[#788a86]">Indicateurs de suivi des élèves.</Text>

				{loading ? <ActivityIndicator className="mt-8" color="#13786c" /> : loadError ? (
					<View className="mt-6 rounded-xl border border-[#f0c4bd] bg-white p-4 dark:bg-slate-900">
						<Text className="text-sm text-[#a23b2a]">{loadError}</Text>
						{token ? <Pressable onPress={() => setReload((value) => value + 1)} className="mt-3 self-start"><Text className="font-bold text-[#3366cc]">Réessayer</Text></Pressable> : null}
					</View>
				) : students.length === 0 ? (
					<View className="mt-6 items-center rounded-xl border border-[#eaecf0] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
						<Text className="text-sm text-[#54595d]">Aucune donnée élève à analyser.</Text>
					</View>
				) : (
					<>
						<View className="mt-6 flex-row gap-3">
							<View className="flex-1 rounded-xl border border-[#e5ece8] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
								<Text className="text-xs font-semibold text-[#788a86]">Élèves suivis</Text>
								<Text className="mt-2 text-2xl font-extrabold text-[#173f43]">{students.length}</Text>
							</View>
							<View className="flex-1 rounded-xl border border-[#e5ece8] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
								<Text className="text-xs font-semibold text-[#788a86]">Présence moyenne</Text>
								<Text className="mt-2 text-2xl font-extrabold text-[#13786c]">{averageAttendance}%</Text>
							</View>
						</View>

						<View className="mt-7">
							<SectionHeader title="Répartition par classe" />
							<View className="rounded-xl border border-[#e5ece8] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
								{Object.entries(classCounts).map(([className, count]) => (
									<View key={className} className="mb-4 last:mb-0">
										<View className="mb-2 flex-row justify-between">
											<Text className="text-sm font-semibold text-[#202122] dark:text-slate-100">{className}</Text>
											<Text className="text-sm text-[#72777d]">{count}</Text>
										</View>
										<View className="h-2 overflow-hidden rounded-full bg-[#eaecf0]">
											<View className="h-full rounded-full bg-[#3366cc]" style={{ width: `${(count / maxClassCount) * 100}%` }} />
										</View>
									</View>
								))}
							</View>
						</View>

						<View className="mt-7">
							<SectionHeader title="Suivi des présences" />
							<View className="rounded-xl border border-[#e5ece8] bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
								{statusCounts.map(({ label, count }) => (
									<View key={label} className="flex-row items-center justify-between border-b border-[#eaecf0] py-3 last:border-b-0">
										<Text className="text-sm text-[#202122] dark:text-slate-100">{label}</Text>
										<Text className="text-sm font-bold text-[#173f43] dark:text-white">{count}</Text>
									</View>
								))}
							</View>
						</View>
					</>
				)}
			</ScrollView>
		</View>
	);
}
