"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useIsClient } from "@/lib/use-is-client";

type FavoritesContextValue = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
};

const STORAGE_KEY = "sk-favorites-v1";
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readStoredIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  if (isClient && !ready) {
    setIds(readStoredIds());
    setReady(true);
  }

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, ready]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ids,
      has: (id) => ids.includes(id),
      toggle: (id) => {
        setIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
      },
    }),
    [ids]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
