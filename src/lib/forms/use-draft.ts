"use client";

import { useEffect, useRef, useState } from "react";

type Envelope<T> = { at: number; value: T };

const MONTH = 30 * 24 * 60 * 60 * 1000;

/** Text draft in localStorage. Restores only after the user confirms. */
export function useFormDraft<T>(key: string, value: T, enabled: boolean) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [savedAt, setSavedAt] = useState("");
  const [pending, setPending] = useState<T | null>(null);
  const skip = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Envelope<T>;
      if (!parsed?.at || Date.now() - parsed.at > MONTH || parsed.value == null) {
        window.localStorage.removeItem(key);
        return;
      }
      setPending(parsed.value);
    } catch {
      /* ignore broken drafts */
    }
  }, [enabled, key]);

  useEffect(() => {
    if (!enabled) return;
    if (skip.current) {
      skip.current = false;
      return;
    }
    setStatus("saving");
    const timer = window.setTimeout(() => {
      try {
        const at = Date.now();
        window.localStorage.setItem(key, JSON.stringify({ at, value }));
        setSavedAt(new Date(at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" }));
        setStatus("saved");
      } catch {
        setStatus("idle");
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [enabled, key, value]);

  function discard() {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* private mode */
    }
    setPending(null);
  }

  return { status, savedAt, pending, discard, clearPending: () => setPending(null) };
}

export async function saveFormP0(kind: string, id: string, extra: Record<string, unknown>) {
  if (!id) return { ok: false as const, pending: true };
  const res = await fetch("/api/forms/p0", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, id, extra }),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; pending?: boolean } | null;
  return { ok: Boolean(data?.ok), pending: Boolean(data?.pending) };
}
