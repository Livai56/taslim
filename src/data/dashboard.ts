import type { Activity, DashboardStat, Message, QuickAction, Student, User } from "@/types/school";

export const demoUser: User = {
  id: 1,
  firstName: "Aminata",
  lastName: "Diallo",
  email: "aminata@taslim-ecole.test",
  role: "ADMIN",
  schoolName: "Groupe scolaire Taslim",
};

export const dashboardStats: DashboardStat[] = [
  { label: "Élèves", value: "1 248", change: "+12,5 %", icon: "account-school-outline", tone: "teal" },
  { label: "Admis", value: "1 064", change: "+8,2 %", icon: "school-outline", tone: "blue" },
  { label: "Classes", value: "32", change: "+2 cette année", icon: "google-classroom", tone: "orange" },
  { label: "Présence", value: "94 %", change: "+3,4 %", icon: "calendar-check-outline", tone: "pink" },
];

export const quickActions: QuickAction[] = [
  { label: "Faire l'appel", description: "Présence du jour", icon: "clipboard-check-outline", tone: "teal" },
  { label: "Ajouter un élève", description: "Nouvelle inscription", icon: "account-plus-outline", tone: "orange" },
  { label: "Emploi du temps", description: "Voir les cours", icon: "calendar-month-outline", tone: "blue" },
];

export const activities: Activity[] = [
  { id: "1", title: "Appel terminé", detail: "Classe de 4e B · 28 présents", time: "Il y a 12 min", icon: "check-circle-outline", tone: "teal" },
  { id: "2", title: "Nouveau message", detail: "Mme Diallo vous a écrit", time: "Il y a 36 min", icon: "message-text-outline", tone: "blue" },
  { id: "3", title: "Bulletin publié", detail: "Trimestre 2 · 3e A", time: "Hier, 16:42", icon: "file-document-outline", tone: "orange" },
];

export const students: Student[] = [
  { id: "1", name: "Mariam Traore", className: "4e B", attendance: 98, average: "16,8", status: "Présent" },
  { id: "2", name: "Ibrahim Kone", className: "3e A", attendance: 92, average: "15,4", status: "Présent" },
  { id: "3", name: "Fatoumata Camara", className: "5e C", attendance: 87, average: "13,9", status: "En retard" },
  { id: "4", name: "Ousmane Sy", className: "4e A", attendance: 76, average: "12,2", status: "Absent" },
];

export const messages: Message[] = [
  { id: "1", sender: "Équipe pédagogique", preview: "Les informations de la semaine sont disponibles.", time: "Aujourd'hui", unread: true, role: "Établissement" },
  { id: "2", sender: "Secrétariat", preview: "Votre demande a bien été prise en compte.", time: "Hier", role: "Information" },
];