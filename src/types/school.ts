export type { User, UserRole } from "@/types/auth";

export type DashboardStat = {
  label: string;
  value: string;
  change: string;
  icon: keyof typeof import("@expo/vector-icons").MaterialCommunityIcons.glyphMap;
  tone: "teal" | "orange" | "blue" | "pink";
};

export type QuickAction = {
  label: string;
  description: string;
  icon: keyof typeof import("@expo/vector-icons").MaterialCommunityIcons.glyphMap;
  tone: "teal" | "orange" | "blue";
};

export type Activity = {
  id: string;
  title: string;
  detail: string;
  time: string;
  icon: keyof typeof import("@expo/vector-icons").MaterialCommunityIcons.glyphMap;
  tone: "teal" | "orange" | "blue";
};

export type Student = {
  id: string;
  name: string;
  className: string;
  attendance: number;
  average: string;
  status: "Présent" | "Absent" | "En retard" | "Non renseigné";
};

export type Message = {
  id: string;
  sender: string;
  preview: string;
  time: string;
  unread?: boolean;
  role?: string;
};

export type SchoolClass = { id: string; name: string };

export type AttendanceRecord = {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  minutes: number;
  reason: string;
};

export type SchoolDocument = {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
  childName?: string;
  trimester?: string;
  createdAt?: string;
};