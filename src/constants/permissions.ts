import type { UserRole } from "@/types/auth";

export type Permission =
  | "manage_users"
  | "manage_students"
  | "manage_attendance"
  | "manage_grades"
  | "view_bulletins"
  | "view_statistics"
  | "view_timetable"
  | "send_messages"
  | "view_history";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Direction",
  ENSEIGNANT: "Enseignant",
  PARENT: "Parent",
};

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: ["manage_users", "manage_students", "manage_attendance", "manage_grades", "view_bulletins", "view_statistics", "view_timetable", "send_messages", "view_history"],
  ENSEIGNANT: ["manage_students", "manage_attendance", "manage_grades", "view_statistics", "send_messages", "view_history"],
  PARENT: ["view_bulletins", "view_statistics", "view_timetable", "send_messages"],
};

export function hasPermission(role: UserRole | undefined, permission: Permission) {
  return role ? ROLE_PERMISSIONS[role].includes(permission) : false;
}

export const ROLE_HIGHLIGHTS: Record<UserRole, string> = {
  ADMIN: "Supervisez les élèves, les équipes et les résultats de l'établissement.",
  ENSEIGNANT: "Suivez vos classes, les présences et les résultats de vos élèves.",
  PARENT: "Consultez les résultats, absences et informations de vos enfants.",
};
