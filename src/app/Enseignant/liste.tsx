import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Header from "@/components/Header/Header";
import { useAuth } from "@/context/AuthContext";
import { schoolApi } from "@/services/api";
import type { SchoolClass, Student } from "@/types/school";

export default function ListeEleves() {
  const { token } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [className, setClassName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let current = true;
    schoolApi.getClasses(token, true)
      .then((result) => { if (current) setClasses(result); })
      .catch((reason: unknown) => { if (current) setError(reason instanceof Error ? reason.message : "Impossible de charger les classes."); });
    return () => { current = false; };
  }, [token]);

  useEffect(() => {
    if (!token) { setStudents([]); setLoading(false); return; }
    let current = true;
    setLoading(true);
    setError("");
    schoolApi.getTeacherStudents(token, className || undefined)
      .then((result) => { if (current) setStudents(result); })
      .catch((reason: unknown) => { if (current) setError(reason instanceof Error ? reason.message : "Impossible de charger les élèves."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [token, className]);

  const filtered = students.filter((student) => `${student.name} ${student.className}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <View className="flex-1 bg-[#f7f8fa] dark:bg-slate-950">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-6">
        <Text className="text-[26px] font-extrabold text-[#202122] dark:text-white">Liste des élèves</Text>
        <Text className="mt-1 text-sm text-[#72777d] dark:text-slate-400">Élèves de vos classes, chargés depuis Django.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-5">
          {[{ id: "all", name: "Toutes" }, ...classes].map((item) => (
            <Pressable key={item.id} onPress={() => setClassName(item.id === "all" ? "" : item.name)} className={`mr-2 rounded-full border px-4 py-2 ${((!className && item.id === "all") || className === item.name) ? "border-[#3366cc] bg-[#eaf3ff] dark:bg-slate-800" : "border-[#c8ccd1] bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
              <Text className={`text-sm font-semibold ${((!className && item.id === "all") || className === item.name) ? "text-[#2454a6] dark:text-blue-300" : "text-[#54595d] dark:text-slate-300"}`}>{item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher un élève" placeholderTextColor="#72777d" className="mt-4 h-11 rounded-lg border border-[#c8ccd1] bg-white px-3 text-sm text-[#202122] dark:border-slate-700 dark:bg-slate-900 dark:text-white" />

        {loading ? <ActivityIndicator className="mt-8" color="#3366cc" /> : null}
        {error ? <Text accessibilityRole="alert" className="mt-5 rounded-lg border border-[#f0c4bd] bg-white p-4 text-sm text-[#a23b2a]">{error}</Text> : null}
        {!loading && !error && filtered.length === 0 ? <Text className="mt-8 text-center text-sm text-[#72777d]">Aucun élève trouvé.</Text> : null}
        {filtered.map((student) => (
          <View key={student.id} className="mt-3 flex-row items-center rounded-lg border border-[#eaecf0] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#eaf3ff]"><Text className="font-bold text-[#3366cc]">{student.name.slice(0, 1).toUpperCase()}</Text></View>
            <View className="flex-1"><Text className="font-bold text-[#202122] dark:text-white">{student.name}</Text><Text className="mt-1 text-xs text-[#72777d] dark:text-slate-400">{student.className}</Text></View>
            <Text className="text-xs font-semibold text-[#54595d]">{student.status}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}