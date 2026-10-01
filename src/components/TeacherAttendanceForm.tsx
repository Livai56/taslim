import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import Header from "@/components/Header/Header";
import { useAuth } from "@/context/AuthContext";
import { schoolApi } from "@/services/api";
import type { SchoolClass, Student } from "@/types/school";

type AttendanceKind = "absences" | "retards";
type DraftRecord = { id: string; studentId: string; studentName: string; className: string; date: string; minutes: number; reason: string };

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function TeacherAttendanceForm({ kind }: { kind: AttendanceKind }) {
  const { token } = useAuth();
  const isAbsence = kind === "absences";
  const title = isAbsence ? "Signaler une absence" : "Signaler un retard";
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [picker, setPicker] = useState<"class" | "student" | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) return;
    let current = true;
    schoolApi.getClasses(token, true)
      .then((result) => { if (current) setClasses(result); })
      .catch((reason: unknown) => { if (current) setError(reason instanceof Error ? reason.message : "Impossible de charger les classes."); });
    return () => { current = false; };
  }, [token]);

  useEffect(() => {
    if (!token || !className) {
      setStudents([]);
      setStudent(null);
      return;
    }
    let current = true;
    setStudentsLoading(true);
    setError("");
    schoolApi.getTeacherStudents(token, className)
      .then((result) => { if (current) setStudents(result); })
      .catch((reason: unknown) => { if (current) setError(reason instanceof Error ? reason.message : "Impossible de charger les élèves."); })
      .finally(() => { if (current) setStudentsLoading(false); });
    return () => { current = false; };
  }, [token, className]);

  function addRecord() {
    if (!student || !className || minutes === null) return;
    setDrafts((current) => [...current, {
      id: `${Date.now()}-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      className,
      date: localDate(),
      minutes,
      reason: isAbsence ? "Absence" : "Retard",
    }]);
    setStudent(null);
    setMinutes(null);
    setError("");
    setSuccess("");
  }

  async function submitRecords() {
    if (!token || !drafts.length) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await schoolApi.createAttendanceRecords(token, kind, drafts);
      setDrafts([]);
      setConfirmSend(false);
      setSuccess(`${isAbsence ? "Absences" : "Retards"} enregistrés.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "L'envoi a échoué.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-[#f7f8fa] dark:bg-slate-950">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-6">
        <Text className="text-[26px] font-extrabold text-[#202122]">{title}</Text>
        <Text className="mt-1 text-sm text-[#72777d]">Choisissez une classe, un élève et une durée.</Text>

        {!token ? <Text className="mt-6 rounded-lg border border-[#f0c4bd] bg-white p-4 text-sm text-[#a23b2a]">Connectez-vous pour gérer les absences et retards.</Text> : null}
        <View className="mt-6 rounded-xl border border-[#eaecf0] bg-white p-4">
          <Text className="text-sm font-bold text-[#202122]">Classe</Text>
          <Pressable accessibilityRole="button" onPress={() => setPicker("class")} disabled={!token} className="mt-2 min-h-12 flex-row items-center justify-between rounded-lg border border-[#c8ccd1] px-3">
            <Text className={className ? "text-[#202122]" : "text-[#72777d]"}>{className || "Sélectionner une classe"}</Text>
            <Ionicons name="chevron-down" size={18} color="#54595d" />
          </Pressable>

          <Text className="mt-4 text-sm font-bold text-[#202122]">Élève</Text>
          <Pressable accessibilityRole="button" onPress={() => setPicker("student")} disabled={!className || studentsLoading} className="mt-2 min-h-12 flex-row items-center justify-between rounded-lg border border-[#c8ccd1] px-3">
            <Text numberOfLines={1} className={student ? "flex-1 text-[#202122]" : "flex-1 text-[#72777d]"}>{student?.name ?? (studentsLoading ? "Chargement des élèves…" : "Sélectionner un élève")}</Text>
            {studentsLoading ? <ActivityIndicator color="#3366cc" /> : <Ionicons name="chevron-down" size={18} color="#54595d" />}
          </Pressable>

          <Text className="mt-4 text-sm font-bold text-[#202122]">Durée</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {[5, 10, 15, 20, 30, 60].map((value) => (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: minutes === value }} onPress={() => setMinutes(value)} className={`min-w-14 items-center rounded-lg border px-3 py-2 ${minutes === value ? "border-[#3366cc] bg-[#eaf3ff]" : "border-[#c8ccd1] bg-white"}`}>
                <Text className={`text-sm font-semibold ${minutes === value ? "text-[#2454a6]" : "text-[#54595d]"}`}>{value} min</Text>
              </Pressable>
            ))}
          </View>

          <Pressable accessibilityRole="button" onPress={addRecord} disabled={!student || minutes === null} className={`mt-5 min-h-12 items-center justify-center rounded-lg ${student && minutes !== null ? "bg-[#3366cc]" : "bg-[#aeb4bb]"}`}>
            <Text className="font-bold text-white">Ajouter à la liste</Text>
          </Pressable>
        </View>

        {error ? <Text accessibilityRole="alert" className="mt-4 rounded-lg border border-[#f0c4bd] bg-white p-3 text-sm text-[#a23b2a]">{error}</Text> : null}
        {success ? <Text className="mt-4 rounded-lg border border-[#a3d3b2] bg-white p-3 text-sm text-[#245b3c]">{success}</Text> : null}

        <View className="mt-7 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-[#202122]">À envoyer</Text>
          <Text className="text-sm text-[#72777d]">{drafts.length} entrée(s)</Text>
        </View>
        {drafts.length ? drafts.map((item) => (
          <View key={item.id} className="mt-3 flex-row items-center rounded-lg border border-[#eaecf0] bg-white p-3">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-[#fff0ed]">
              <Ionicons name={isAbsence ? "person-remove-outline" : "time-outline"} size={18} color="#b54736" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-[#202122]">{item.studentName}</Text>
              <Text className="mt-1 text-xs text-[#72777d]">{item.className} · {item.minutes} min · {item.date}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Supprimer ${item.studentName}`} onPress={() => setDrafts((current) => current.filter((row) => row.id !== item.id))} className="p-2">
              <Ionicons name="trash-outline" size={19} color="#b54736" />
            </Pressable>
          </View>
        )) : (
          <View className="mt-3 items-center rounded-lg border border-dashed border-[#c8ccd1] bg-white px-4 py-8">
            <Text className="text-sm text-[#72777d]">Les entrées ajoutées apparaîtront ici.</Text>
          </View>
        )}

        <Pressable accessibilityRole="button" onPress={() => setConfirmSend(true)} disabled={!drafts.length || loading} className={`mt-5 min-h-12 items-center justify-center rounded-lg ${drafts.length ? "bg-[#14804a]" : "bg-[#aeb4bb]"}`}>
          <Text className="font-bold text-white">Envoyer {drafts.length ? `(${drafts.length})` : ""}</Text>
        </Pressable>
      </ScrollView>

      <Modal transparent animationType="slide" visible={picker !== null} onRequestClose={() => setPicker(null)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[72%] rounded-t-2xl bg-white px-5 pb-8 pt-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-[#202122]">{picker === "class" ? "Choisir une classe" : "Choisir un élève"}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => setPicker(null)} className="p-2"><Ionicons name="close" size={22} color="#54595d" /></Pressable>
            </View>
            <ScrollView>
              {(picker === "class" ? classes.map((item) => ({ id: item.id, name: item.name })) : students.map((item) => ({ id: item.id, name: item.name }))).map((item) => (
                <Pressable key={item.id} onPress={() => {
                  if (picker === "class") { setClassName(item.name); setStudent(null); }
                  else setStudent(students.find((row) => row.id === item.id) ?? null);
                  setPicker(null);
                }} className="min-h-12 justify-center border-b border-[#eaecf0] py-3">
                  <Text className="text-[15px] text-[#202122]">{item.name}</Text>
                </Pressable>
              ))}
              {picker === "class" && classes.length === 0 ? <Text className="py-6 text-center text-sm text-[#72777d]">Aucune classe disponible.</Text> : null}
              {picker === "student" && students.length === 0 ? <Text className="py-6 text-center text-sm text-[#72777d]">Aucun élève dans cette classe.</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={confirmSend} onRequestClose={() => setConfirmSend(false)}>
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm rounded-xl bg-white p-5">
            <Text className="text-lg font-bold text-[#202122]">Confirmer l’envoi</Text>
            <Text className="mt-2 text-sm leading-5 text-[#54595d]">{drafts.length} {isAbsence ? "absence(s)" : "retard(s)"} seront enregistrés dans Django.</Text>
            <View className="mt-5 flex-row justify-end gap-3">
              <Pressable onPress={() => setConfirmSend(false)} disabled={loading} className="min-h-11 justify-center px-3"><Text className="font-semibold text-[#54595d]">Annuler</Text></Pressable>
              <Pressable onPress={submitRecords} disabled={loading} className="min-h-11 min-w-24 items-center justify-center rounded-lg bg-[#3366cc] px-4">
                {loading ? <ActivityIndicator color="white" /> : <Text className="font-bold text-white">Confirmer</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}