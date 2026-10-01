import { usePathname } from "expo-router";
import { Text, View } from "react-native";
import Header from "@/components/Header/Header";

const routeTitles: Record<string, string> = {
  Dashboard: "Tableau de bord",
  dashboard: "Tableau de bord",
  bulletin: "Bulletin scolaire",
  "emploi-du-temps": "Emploi du temps",
  liste: "Liste des élèves",
  register: "Inscription",
  statistique: "Statistiques",
  students: "Mes enfants",
  devoir: "Devoirs",
};

export default function RoutePlaceholder() {
  const pathname = usePathname();
  const routeName = pathname.split("/").filter(Boolean).pop() ?? "";
  const title = routeTitles[routeName] ?? routeName;

  return (
    <View className="flex-1 bg-[#f7faf8] dark:bg-slate-950">
      <Header />
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-extrabold text-[#173f43] dark:text-white">{title}</Text>
        <Text className="mt-2 text-sm text-[#788a86] dark:text-slate-400">
          Cette rubrique sera bientôt disponible.
        </Text>
      </View>
    </View>
  );
}