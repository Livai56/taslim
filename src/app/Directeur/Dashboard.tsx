import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Header from "@/components/Header/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAuth } from "@/context/AuthContext";
import { schoolApi } from "@/services/api";
import type { DashboardStat, Student } from "@/types/school";

export default function DirecteurDashboard() {
	const { user, token } = useAuth();
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(Boolean(token));
	const [loadError, setLoadError] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let current = true;
		if (!token) {
			setStudents([]);
			setLoadError("Connectez-vous pour charger les données de l'établissement.");
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
				setLoadError(error instanceof Error ? error.message : "Impossible de charger les élèves depuis Django.");
			})
			.finally(() => { if (current) setLoading(false); });
		return () => { current = false; };
	}, [token, reload]);

	const attendance = students.length
		? Math.round(students.reduce((sum, student) => sum + student.attendance, 0) / students.length)
		: 0;
	const average = students
		.map((student) => Number(student.average.replace(",", ".")))
		.filter(Number.isFinite);
	const mean = average.length ? (average.reduce((sum, value) => sum + value, 0) / average.length).toFixed(1).replace(".", ",") : "—";
	const stats: DashboardStat[] = [
		{ label: "Élèves inscrits", value: String(students.length), change: "Effectif", icon: "account-school-outline", tone: "teal" },
		{ label: "Présence moyenne", value: `${attendance} %`, change: "Sur les élèves chargés", icon: "calendar-check-outline", tone: "blue" },
		{ label: "Moyenne générale", value: mean, change: "Résultats disponibles", icon: "chart-line", tone: "orange" },
	];

	return (
		<View className="flex-1 bg-[#f7faf8] dark:bg-slate-950">
			<Header />
			<ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-5">
				<Text className="text-[13px] font-bold uppercase text-[#78908a]">Direction</Text>
				<Text className="mt-1 text-[26px] font-extrabold text-[#173f43] dark:text-white">Bonjour{user?.firstName ? `, ${user.firstName}` : ""}</Text>
				<Text className="mt-1 text-sm text-[#788a86]">{user?.schoolName ?? "Vue d'ensemble de l'établissement"}</Text>

				<View className="mt-6">
					<SectionHeader title="Indicateurs clés" />
					{loading ? <ActivityIndicator color="#13786c" /> : loadError ? (
						<View className="rounded-xl border border-[#f0c4bd] bg-white p-4 dark:bg-slate-900">
							<Text className="text-sm text-[#a23b2a]">{loadError}</Text>
							{token ? <Pressable onPress={() => setReload((value) => value + 1)} className="mt-3 self-start"><Text className="font-bold text-[#3366cc]">Réessayer</Text></Pressable> : null}
						</View>
					) : (
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							{stats.map((stat) => <MetricCard key={stat.label} stat={stat} />)}
						</ScrollView>
					)}
				</View>

				<View className="mt-7">
					<SectionHeader title="Accès rapides" />
					<View className="flex-row gap-3">
						<Pressable onPress={() => router.push("/Directeur/liste")} className="flex-1 rounded-xl border border-[#e5ece8] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
							<Text className="font-bold text-[#173f43] dark:text-white">Élèves et équipes</Text>
							<Text className="mt-1 text-xs text-[#788a86]">Consulter les inscrits</Text>
						</Pressable>
						<Pressable onPress={() => router.push("/Directeur/statistique")} className="flex-1 rounded-xl border border-[#e5ece8] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
							<Text className="font-bold text-[#173f43] dark:text-white">Statistiques</Text>
							<Text className="mt-1 text-xs text-[#788a86]">Suivre les résultats</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}
