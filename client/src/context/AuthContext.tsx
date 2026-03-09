import React, { createContext, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_TOKEN_KEY = "auth_token";

type AuthResponse = {
  token: string;
  user: { id?: string; _id?: string; name: string; email: string };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  const meQuery = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: async () => {
      const res = await apiRequest<{ user: { id?: string; _id?: string; name: string; email: string } }>(
        "/api/auth/me",
        { token }
      );
      return {
        id: res.user.id || res.user._id || "",
        name: res.user.name,
        email: res.user.email
      } satisfies User;
    },
    enabled: Boolean(token),
    staleTime: 60_000
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) =>
      apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password }
      })
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) =>
      apiRequest<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: { name, email, password }
      })
  });

  const login = async (email: string, password: string) => {
    const res = await loginMutation.mutateAsync({ email, password });
    localStorage.setItem(AUTH_TOKEN_KEY, res.token);
    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await registerMutation.mutateAsync({ name, email, password });
    localStorage.setItem(AUTH_TOKEN_KEY, res.token);
    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    disconnectSocket();
    queryClient.clear();
  };

  const value = useMemo(
    () => ({
      user: meQuery.data || null,
      isAuthenticated: Boolean(meQuery.data),
      authLoading: meQuery.isLoading,
      login,
      register,
      logout
    }),
    [meQuery.data, meQuery.isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
