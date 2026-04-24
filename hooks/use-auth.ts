"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  settings?: {
    workDuration: number;
    breakDuration: number;
    language: string;
    autostart: boolean;
  } | null;
}

interface AuthContext {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Listen for auth changes triggered by the auth modal (no full page reload needed)
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("auth-changed", handler);
    return () => window.removeEventListener("auth-changed", handler);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Login failed" };
    setUser(data.user);
    return {};
  }, []);

  const register = useCallback(async (
    name: string, email: string, password: string, confirmPassword: string
  ) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Registration failed" };
    setUser(data.user);
    return {};
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return React.createElement(
    AuthCtx.Provider,
    { value: { user, loading, isAdmin: user?.role === "ADMIN", login, register, logout, refresh } },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
