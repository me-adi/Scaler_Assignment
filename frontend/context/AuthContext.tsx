"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { getUsers } from "@/lib/api";
import type { UserOut } from "@/lib/types";

/**
 * Mocked auth per CLAUDE.md: no real session, just a selected "current
 * user" — centralized here so the rest of the app never hardcodes a user id.
 */

const STORAGE_KEY = "airbnb-clone:current-user-id";

type AuthContextValue = {
  users: UserOut[];
  currentUser: UserOut | null;
  setCurrentUserId: (id: number) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [currentUserId, setCurrentUserIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getUsers()
      .then((fetched) => {
        if (cancelled) return;
        setUsers(fetched);

        const stored = Number(localStorage.getItem(STORAGE_KEY));
        const storedIsValid = fetched.some((u) => u.id === stored);
        if (storedIsValid) {
          setCurrentUserIdState(stored);
        } else {
          const defaultUser = fetched.find((u) => u.role === "guest") ?? fetched[0];
          setCurrentUserIdState(defaultUser ? defaultUser.id : null);
        }
      })
      .catch(() => {
        // Backend unreachable — leave users empty. Dependents (BookingSummary,
        // UserSwitcher) treat a null currentUser as "not available yet",
        // not a crash.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function setCurrentUserId(id: number) {
    setCurrentUserIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }

  const currentUser = users.find((u) => u.id === currentUserId) ?? null;

  return (
    <AuthContext.Provider value={{ users, currentUser, setCurrentUserId, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
