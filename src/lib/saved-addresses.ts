"use client";

import { useCallback, useEffect, useState } from "react";

export type SavedPlace = {
  id: string;
  label: string;
  city?: string | null;
  district?: string | null;
  address: string;
  lat?: number | null;
  lng?: number | null;
};

const LOCAL_KEY = "sk-saved-places-v1";

function readLocal(): SavedPlace[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(LOCAL_KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? (raw as SavedPlace[]).filter((p) => p && typeof p.id === "string" && p.label && p.address) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: SavedPlace[]) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* private mode */
  }
}

/** Saved delivery places: Supabase per user when signed in, otherwise this device only. */
export function useSavedPlaces(signedIn: boolean, ready: boolean) {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    if (!signedIn) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- reading device storage */
      setPlaces(readLocal());
      setLoaded(true);
      return;
    }
    fetch("/api/saved-addresses", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; places?: SavedPlace[] }) => {
        if (alive) setPlaces(j.ok && Array.isArray(j.places) ? j.places : []);
      })
      .catch(() => undefined)
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [signedIn, ready]);

  const save = useCallback(
    async (place: Omit<SavedPlace, "id"> & { id?: string }): Promise<{ ok: true; place: SavedPlace } | { ok: false; error: string }> => {
      if (!signedIn) {
        const next: SavedPlace = { ...place, id: place.id ?? `local-${Date.now().toString(36)}` };
        const list = [...readLocal().filter((p) => p.id !== next.id), next];
        writeLocal(list);
        setPlaces(list);
        return { ok: true, place: next };
      }
      try {
        const r = await fetch("/api/saved-addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(place),
        });
        const j = (await r.json()) as { ok?: boolean; place?: SavedPlace; error?: string };
        if (!j.ok || !j.place) return { ok: false, error: j.error ?? "Saqlab bo‘lmadi." };
        const saved = j.place;
        setPlaces((cur) => [...cur.filter((p) => p.id !== saved.id), saved]);
        return { ok: true, place: saved };
      } catch {
        return { ok: false, error: "Tarmoq xatosi." };
      }
    },
    [signedIn],
  );

  const remove = useCallback(
    async (id: string) => {
      setPlaces((cur) => cur.filter((p) => p.id !== id));
      if (!signedIn) {
        writeLocal(readLocal().filter((p) => p.id !== id));
        return;
      }
      await fetch("/api/saved-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      }).catch(() => undefined);
    },
    [signedIn],
  );

  return { places, loaded, save, remove };
}
