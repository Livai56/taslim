export const USER_ROLES = {
  ENSEIGNANT: "ENSEIGNANT",
  PARENT: "PARENT",
  DIRECTEUR: "ADMIN",
} as const;

export type UserRole =
  (typeof USER_ROLES)[keyof typeof USER_ROLES];