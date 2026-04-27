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
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<string | null>(null);

  const clearSession = () => {
    setToken(null);
    setUser(null);
    setAccessTokenExpiresAt(null);
  };

  const commitSession = (result: AuthResponse) => {
    setToken(result.token);
    setUser(result.user);
    setAccessTokenExpiresAt(result.session?.accessTokenExpiresAt ?? null);
  };

  const refreshSession = async () => {
    const result = await apiFetch<AuthResponse>("/auth/refresh", {
      method: "POST",
    });

    commitSession(result);
  };

  useEffect(() => {
    const restoreSession = async () => {
      try {
        await refreshSession();
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  useEffect(() => {
    if (!accessTokenExpiresAt || typeof window === "undefined") {
      return;
    }

    const refreshDelay = new Date(accessTokenExpiresAt).getTime() - Date.now() - 60_000;

    if (refreshDelay <= 0) {
      void refreshSession().catch(() => {
        clearSession();
      });
      return;
    }

    const timerId = window.setTimeout(() => {
      void refreshSession().catch(() => {
        clearSession();
      });
    }, refreshDelay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [accessTokenExpiresAt]);

  const login = async (input: { email: string; password: string }) => {
    const result = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: input,
    });

    commitSession(result);
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

    commitSession(result);
    return result.user;
  };

  const logout = async () => {
    try {
      await apiFetch<{ loggedOut: boolean }>("/auth/logout", {
        method: "POST",
        token,
      });
    } catch {
      // Always clear client state, even if the network request fails.
    }

    clearSession();
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
