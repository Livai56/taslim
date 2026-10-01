import { RoleMenu } from "../types/menu";
import { USER_ROLES } from "./Fonction";

export const ROLE_MENUS: RoleMenu = {
  [USER_ROLES.ENSEIGNANT]: [
    {
      title: "Devoirs",
      route: "/Enseignant/devoir",
      icon: "document-text-outline",
    },
    {
      title: "Absences",
      route: "/Enseignant/absence",
      icon: "person-remove-outline",
    },
    {
      title: "Retards",
      route: "/Enseignant/retards",
      icon: "time-outline",
    },
    {
      title: "Emploi du temps",
      route: "/Enseignant/emploi-du-temps",
      icon: "calendar-outline",
    },
    {
      title: "Liste des élèves",
      route: "/Enseignant/liste",
      icon: "people-outline",
    },
    {
      title: "Historique",
      route: "/Enseignant/historique",
      icon: "time-outline",
    },
  ],

  [USER_ROLES.PARENT]: [
    {
      title: "Mes enfants",
      route: "/Parent/students",
      icon: "people-outline",
    },
    {
      title: "Bulletins",
      route: "/Parent/bulletin",
      icon: "document-text-outline",
    },
    {
      title: "Notes",
      route: "/Parent/notes",
      icon: "school-outline",
    },
    {
      title: "Emploi du temps",
      route: "/Parent/emploi-du-temps",
      icon: "calendar-outline",
    },
  ],

  [USER_ROLES.DIRECTEUR]: [
    {
      title: "Liste",
      route: "/Directeur/liste",
      icon: "people-outline",
    },
    {
      title: "Statistiques",
      route: "/Directeur/statistique",
      icon: "stats-chart-outline",
    },
    {
      title: "Bulletins",
      route: "/Directeur/bulletin",
      icon: "document-text-outline",
    },
    {
      title: "Emploi du temps",
      route: "/Directeur/emploi-du-temps",
      icon: "calendar-outline",
    },
    {
      title: "Inscription",
      route: "/Directeur/register",
      icon: "person-add-outline",
    },
  ],
};