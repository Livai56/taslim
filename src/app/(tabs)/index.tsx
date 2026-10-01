import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Header from "../../components/Header/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ROLE_LABELS } from "@/constants/permissions";
import { useAuth } from "@/context/AuthContext";
import { quickActions } from "@/data/dashboard";
import { schoolApi } from "@/services/api";
import type { DashboardStat, QuickAction, Student } from "@/types/school";
import type { Href } from "expo-router";

export default function Dashboard() {
  const { user, token } = useAuth();
  const [studentRows, setStudentRows] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    if (!token) {
      setStudentRows([]);
      setLoadError("Connectez-vous pour charger les données de l'établissement.");
      setIsLoading(false);
      return () => { isCurrent = false; };
    }

    setIsLoading(true);
    setLoadError("");
    const loadStudents = user?.role === "PARENT"
      ? schoolApi.getChildren(token)
      : user?.role === "ENSEIGNANT"
        ? schoolApi.getTeacherStudents(token)
        : schoolApi.getStudents(token);

    loadStudents
      .then((result) => {
        if (!isCurrent) return;
        setStudentRows(result);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setStudentRows([]);
        setLoadError(error instanceof Error ? error.message : "Impossible de charger les élèves depuis Django.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => { isCurrent = false; };
  }, [token, user?.role, reload]);

  const isParent = user?.role === "PARENT";
  const averages = studentRows
    .map((student) => Number(student.average.replace(",", ".")))
    .filter(Number.isFinite);
  const average = averages.length
    ? (averages.reduce((sum, value) => sum + value, 0) / averages.length).toFixed(1).replace(".", ",")
    : "—";
  const attendance = studentRows.length
    ? `${Math.round(studentRows.reduce((sum, student) => sum + student.attendance, 0) / studentRows.length)} %`
    : "—";
  const stats: DashboardStat[] = [
    { label: isParent ? "Enfants suivis" : "Élèves inscrits", value: loadError ? "—" : String(studentRows.length), change: token ? "Données Django" : "Connexion requise", icon: "account-school-outline", tone: "teal" },
    { label: "Présence moyenne", value: loadError ? "—" : attendance, change: "D'après les données disponibles", icon: "calendar-check-outline", tone: "blue" },
    { label: "Moyenne scolaire", value: loadError ? "—" : average, change: "Résultats transmis par l'établissement", icon: "chart-line", tone: "orange" },
  ];
  const actions: { action: QuickAction; route: Href }[] = !user
    ? []
    : isParent
    ? [
        { action: { label: "Mes enfants", description: "Consulter leur suivi", icon: "account-child-outline", tone: "teal" }, route: "/Parent/students" },
        { action: { label: "Bulletins", description: "Résultats scolaires", icon: "file-document-outline", tone: "orange" }, route: "/Parent/bulletin" },
        { action: { label: "Emploi du temps", description: "Cours à venir", icon: "calendar-month-outline", tone: "blue" }, route: "/Parent/emploi-du-temps" },
      ]
    : user?.role === "ENSEIGNANT"
      ? [
          { action: quickActions[0], route: "/Enseignant/absence" },
          { action: quickActions[1], route: "/Enseignant/devoir" },
          { action: quickActions[2], route: "/Enseignant/emploi-du-temps" },
        ]
      : [
          { action: quickActions[0], route: "/Directeur/liste" },
          { action: quickActions[1], route: "/Directeur/register" },
          { action: quickActions[2], route: "/Directeur/emploi-du-temps" },
        ];

  return (
    <View className="flex-1 bg-[#f7faf8] dark:bg-slate-950">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-5">
        <Text className="text-[13px] font-bold uppercase text-[#78908a] dark:text-slate-400">
          {user ? ROLE_LABELS[user.role] : "Taslim École"}
        </Text>
        <Text className="mt-1 text-[26px] font-extrabold text-[#173f43] dark:text-white">
          Bonjour{user?.firstName ? `, ${user.firstName}` : ""}
        </Text>
        <Text className="mt-1 text-[14px] text-[#788a86] dark:text-slate-400">
          {user?.schoolName ?? "Votre espace de suivi scolaire"}
        </Text>

        <View className="mt-6">
          <SectionHeader title="Vue d'ensemble" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {stats.map((stat) => <MetricCard key={stat.label} stat={stat} />)}
          </ScrollView>
        </View>

        <View className="mt-7">
          <SectionHeader title="Accès rapides" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {actions.map(({ action, route }) => (
              <QuickActionCard
                key={action.label}
                action={action}
                onPress={() => router.push(route)}
              />
            ))}
          </ScrollView>
        </View>

        <View className="mt-7">
          <SectionHeader title={isParent ? "Mes enfants" : "Élèves"} />
          {isLoading ? (
            <ActivityIndicator color="#13786c" />
          ) : loadError ? (
            <View className="rounded-xl border border-[#f0c4bd] bg-white p-4 dark:bg-slate-900">
              <Text className="text-sm text-[#a23b2a]">{loadError}</Text>
              {token ? <Pressable onPress={() => setReload((value) => value + 1)} className="mt-3 self-start"><Text className="font-bold text-[#3366cc]">Réessayer</Text></Pressable> : null}
            </View>
          ) : studentRows.length ? (
            <View className="rounded-2xl border border-[#e5ece8] bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
              {studentRows.slice(0, 5).map((student) => (
                <View key={student.id} className="flex-row items-center border-b border-[#eef2f0] py-3 last:border-b-0 dark:border-slate-800">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-[#e2f3ee]">
                    <Text className="font-bold text-[#13786c]">{student.name.slice(0, 1)}</Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-[#173f43] dark:text-white">{student.name}</Text>
                    <Text className="mt-1 text-xs text-[#788a86] dark:text-slate-400">{student.className}</Text>
                  </View>
                  <Text className="text-xs font-semibold text-[#788a86]">{student.status}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="py-4 text-sm text-[#788a86]">Aucun élève n'est associé à ce compte.</Text>
          )}
        </View>

        <Pressable onPress={() => router.push("/(tabs)/menu")} className="mt-6 self-start py-2">
          <Text className="font-bold text-[#13786c] dark:text-emerald-300">Ouvrir le menu</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}