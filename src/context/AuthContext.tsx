import * as SecureStore from "expo-secure-store";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { schoolApi, type LoginPayload } from "@/services/api";
import type { User } from "@/types/school";
import { hasPermission } from "@/constants/permissions";
import type { Permission } from "@/constants/permissions";

const SESSION_KEY = "taslim.session";

type Session = { token: string; user: User };
type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY)
      .then((value) => {
        if (value) setSession(JSON.parse(value) as Session);
      })
      .catch(() => SecureStore.deleteItemAsync(SESSION_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  async function signIn(payload: LoginPayload) {
    const response = await schoolApi.login(payload);
    const nextSession = { token: response.token, user: response.user };
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setSession(null);
  }

  const can = (permission: Permission) => hasPermission(session?.user.role, permission);

  return <AuthContext.Provider value={{ user: session?.user ?? null, token: session?.token ?? null, isLoading, signIn, signOut, can }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return value;
}