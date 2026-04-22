"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiFetch } from "@/lib/api";
import type { AuthResponse, User, UserRole } from "@/lib/types";

const STORAGE_KEY = "nexus.auth.token";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (input: { email: string; password: string }) => Promise<User>;
  register: (input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<User>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const persistToken = (token: string | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateSession = async (nextToken: string) => {
    const me = await apiFetch<User>("/users/me", {
      token: nextToken,
    });

    setToken(nextToken);
    setUser(me);
    persistToken(nextToken);
  };

  useEffect(() => {
    const restoreSession = async () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      const storedToken = window.localStorage.getItem(STORAGE_KEY);

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        await hydrateSession(storedToken);
      } catch {
        persistToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const login = async (input: { email: string; password: string }) => {
    const result = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: input,
    });

    await hydrateSession(result.token);
    return result.user;
  };

  const register = async (input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {
    const result = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: input,
    });

    await hydrateSession(result.token);
    return result.user;
  };

  const logout = () => {
    persistToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshSession = async () => {
    if (!token) {
      return;
    }

    await hydrateSession(token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshSession,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
};
