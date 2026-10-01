import type { Href } from "expo-router";
import type { UserRole } from "@/types/auth";

export type MenuItem = {
  title: string;
  route: Href;
  icon: string;
};

export type RoleMenu = Record<UserRole, MenuItem[]>;