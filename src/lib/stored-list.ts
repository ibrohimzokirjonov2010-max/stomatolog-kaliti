"use client";

import { useEffect, useState } from "react";

export function useStoredList<T>(key: string, seed: T[]) {
  const [items, setItems] = useState<T[]>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as T[];
        if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
      }
    } catch {
      /* keep the seed */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(key, JSON.stringify(items));
  }, [items, key, ready]);

  return [items, setItems] as const;
}
