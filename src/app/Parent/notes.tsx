import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Header from "@/components/Header/Header";
import { useAuth } from "@/context/AuthContext";
import { schoolApi } from "@/services/api";
import type { Student } from "@/types/school";

const trimesters = ["Premier trimestre", "Deuxième trimestre", "Troisième trimestre"] as const;
type GradeRow = { subject: string; homeworkOne: string; homeworkTwo: string; composition: string; average: string; date: string; mention: string };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function text(value: unknown, fallback = "—") {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function normalizeKey(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

function findChildNotes(notes: unknown, child: Student | undefined, index: number) {
  const source = record(notes);
  const childId = child?.id;
  const keyed = childId ? source[childId] ?? source[String(index)] : source[String(index)];
  if (keyed !== undefined) return keyed;
  if (Array.isArray(notes)) {
    return notes.filter((item) => {
      const value = record(item);
      return String(value.eleve_id ?? value.student_id ?? record(value.eleve).id ?? "") === childId;
    });
  }
  return notes;
}

function rowsForTrimester(value: unknown, trimester: string): GradeRow[] {
  const data = record(value);
  const trimesterKey = normalizeKey(trimester);
  const aliases = trimesterKey.includes("premier") ? [trimesterKey, "premier_trimestre", "trimestre_1", "1"]
    : trimesterKey.includes("deuxieme") ? [trimesterKey, "deuxieme_trimestre", "trimestre_2", "2"]
      : [trimesterKey, "troisieme_trimestre", "trimestre_3", "3"];
  let trimesterData: unknown;
  for (const candidate of [data.matieres, data.notes, data.resultats, value]) {
    const object = record(candidate);
    const match = Object.entries(object).find(([key]) => aliases.some((alias) => normalizeKey(key).includes(alias)));
    if (match) { trimesterData = match[1]; break; }
  }
  const grades = record(trimesterData ?? data.matieres ?? data.notes ?? data.resultats ?? value);
  const entries = Array.isArray(trimesterData)
    ? trimesterData.map((item, index) => [text(record(item).matiere ?? record(item).nom_matiere, `Matière ${index + 1}`), item] as const)
    : Object.entries(grades);

  return entries.map(([subject, raw]) => {
    const item = record(raw);
    return {
      subject: text(item.matiere ?? item.nom_matiere ?? item.name, subject),
      homeworkOne: text(item.devoir1 ?? item.Devoir1 ?? item.note1 ?? item.Note1 ?? item.note_1 ?? item["1"] ?? item.devoir_1),
      homeworkTwo: text(item.devoir2 ?? item.Devoir2 ?? item.note2 ?? item.Note2 ?? item.note_2 ?? item["2"] ?? item.devoir_2),
      composition: text(item.composition ?? item.Composition ?? item.composition1 ?? item.comp),
      average: text(item.moyenne ?? item.Moyenne ?? item.moyenne_generale ?? item.average),
      date: text(item.date ?? item.Date ?? item.created_at ?? item.dt),
      mention: text(item.mention ?? item.Mention ?? item.appreciation ?? item.motivation),
    };
  }).filter((item) => item.subject !== "—");
}

export default function ParentNotes() {
  const { token } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [trimester, setTrimester] = useState<string>(trimesters[0]);
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<unknown>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let current = true;
    setLoading(true);
    setError("");
    Promise.all([schoolApi.getChildren(token), schoolApi.getParentNotes(token)])
      .then(([childRows, gradeData]) => {
        if (!current) return;
        setChildren(childRows);
        setNotes(gradeData);
        setSelectedChildId((currentId) => currentId || childRows[0]?.id || "");
      })
      .catch((reason: unknown) => { if (current) setError(reason instanceof Error ? reason.message : "Impossible de charger les notes depuis Django."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [token]);

  const selectedChild = children.find((child) => child.id === selectedChildId);
  const raw = findChildNotes(notes, selectedChild, Math.max(0, children.indexOf(selectedChild!)));
  const rawObject = record(raw);
  const gradeSource = rawObject.notes ?? rawObject.note ?? rawObject.resultats ?? raw;
  const rows = useMemo(() => rowsForTrimester(gradeSource, trimester), [gradeSource, trimester]);
  const filteredRows = rows.filter((item) => item.subject.toLowerCase().includes(search.trim().toLowerCase()));
  const gradeValues = filteredRows.map((item) => Number(item.average.replace(",", "."))).filter(Number.isFinite);
  const average = gradeValues.length ? (gradeValues.reduce((sum, value) => sum + value, 0) / gradeValues.length).toFixed(1).replace(".", ",") : "—";

  return (
    <View className="flex-1 bg-[#f7f8fa] dark:bg-slate-950">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-6">
        <Text className="text-[26px] font-extrabold text-[#202122]">Notes scolaires</Text>
        <Text className="mt-1 text-sm text-[#72777d]">Résultats par enfant et par trimestre.</Text>

        {selectedChild ? (
          <Pressable accessibilityRole="button" onPress={() => setPickerOpen(true)} className="mt-5 flex-row items-center rounded-xl border border-[#eaecf0] bg-white p-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#eaf3ff]"><Text className="font-bold text-[#3366cc]">{selectedChild.name.slice(0, 1).toUpperCase()}</Text></View>
            <View className="flex-1"><Text className="text-xs text-[#72777d]">Enfant sélectionné</Text><Text className="mt-1 font-bold text-[#202122]">{selectedChild.name} · {selectedChild.className}</Text></View>
            <Ionicons name="chevron-down" size={19} color="#54595d" />
          </Pressable>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-5">
          {trimesters.map((item) => (
            <Pressable key={item} onPress={() => setTrimester(item)} className={`mr-2 rounded-full border px-4 py-2 ${trimester === item ? "border-[#3366cc] bg-[#eaf3ff]" : "border-[#c8ccd1] bg-white"}`}>
              <Text className={`text-sm font-semibold ${trimester === item ? "text-[#2454a6]" : "text-[#54595d]"}`}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="mt-5 flex-row items-center rounded-lg bg-white px-3">
          <Ionicons name="search-outline" size={19} color="#72777d" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher une matière" placeholderTextColor="#72777d" className="h-11 flex-1 px-2 text-sm text-[#202122]" />
        </View>

        {loading ? <ActivityIndicator className="mt-8" color="#3366cc" /> : null}
        {error ? <Text accessibilityRole="alert" className="mt-5 rounded-lg border border-[#f0c4bd] bg-white p-4 text-sm text-[#a23b2a]">{error}</Text> : null}
        {!loading && !error && children.length === 0 ? <Text className="mt-8 text-center text-sm text-[#72777d]">Aucun enfant n’est associé à ce compte.</Text> : null}
        {!loading && !error && children.length > 0 ? (
          <>
            <View className="mt-5 flex-row items-center justify-between rounded-lg border border-[#eaecf0] bg-white p-4">
              <View><Text className="text-xs text-[#72777d]">Moyenne du trimestre</Text><Text className="mt-1 text-2xl font-extrabold text-[#173f43]">{average}</Text></View>
              <Text className="text-xs text-[#72777d]">{filteredRows.length} matière(s)</Text>
            </View>
            {filteredRows.length === 0 ? <Text className="mt-8 text-center text-sm text-[#72777d]">Aucune note disponible pour {trimester.toLowerCase()}.</Text> : null}
            {filteredRows.map((item, index) => (
              <View key={`${item.subject}-${index}`} className="mt-3 rounded-xl border border-[#eaecf0] bg-white p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-base font-bold text-[#202122]">{item.subject}</Text>
                  <Text className="ml-3 text-lg font-extrabold text-[#3366cc]">{item.average}</Text>
                </View>
                <View className="mt-3 flex-row border-t border-[#eaecf0] pt-3">
                  <View className="flex-1"><Text className="text-[11px] text-[#72777d]">Devoir 1</Text><Text className="mt-1 text-sm font-semibold text-[#202122]">{item.homeworkOne}</Text></View>
                  <View className="flex-1"><Text className="text-[11px] text-[#72777d]">Devoir 2</Text><Text className="mt-1 text-sm font-semibold text-[#202122]">{item.homeworkTwo}</Text></View>
                  <View className="flex-1"><Text className="text-[11px] text-[#72777d]">Composition</Text><Text className="mt-1 text-sm font-semibold text-[#202122]">{item.composition}</Text></View>
                </View>
                <View className="mt-3 flex-row justify-between"><Text className="text-xs text-[#72777d]">{item.date}</Text><Text className="text-xs font-semibold text-[#13786c]">{item.mention}</Text></View>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <Modal transparent animationType="slide" visible={pickerOpen} onRequestClose={() => setPickerOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[65%] rounded-t-2xl bg-white px-5 pb-8 pt-5">
            <View className="mb-3 flex-row items-center justify-between"><Text className="text-lg font-bold text-[#202122]">Choisir un enfant</Text><Pressable onPress={() => setPickerOpen(false)} accessibilityLabel="Fermer" className="p-2"><Ionicons name="close" size={22} color="#54595d" /></Pressable></View>
            <ScrollView>
              {children.map((child) => (
                <Pressable key={child.id} onPress={() => { setSelectedChildId(child.id); setPickerOpen(false); }} className="min-h-12 flex-row items-center justify-between border-b border-[#eaecf0] py-3">
                  <View><Text className="font-semibold text-[#202122]">{child.name}</Text><Text className="mt-1 text-xs text-[#72777d]">{child.className}</Text></View>
                  {selectedChildId === child.id ? <Ionicons name="checkmark" size={20} color="#3366cc" /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}