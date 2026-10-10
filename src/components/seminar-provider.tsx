"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSeminar, seatsLeft as catalogSeatsLeft, setRemoteSeminars, type Seminar } from "@/data/seminars";
import { rowToSeminar, type SeminarRow } from "@/lib/seminar-remote";
import {
  findActiveReg,
  fromServer,
  type Occupancy,
  type SeminarRegistration,
  type ServerRegistration,
} from "@/lib/seminar-registrations";

type RegisterInput = {
  seminarId: string;
  name: string;
  phone: string;
  telegram?: string;
  clinic?: string;
};

type RegisterResult =
  | { ok: true; registration: SeminarRegistration }
  | { ok: false; reason: "duplicate" | "full" | "missing" | "invalid" | "auth" | "closed" | "error"; error?: string };

type Ctx = {
  ready: boolean;
  /** Bumps whenever the organizer-created (DB) seminars were reloaded — add to memo deps that read the shared list. */
  catalogVersion: number;
  /** Signed-in user (registrations are tied to the account). */
  auth: boolean;
  registrations: SeminarRegistration[];
  register: (input: RegisterInput) => Promise<RegisterResult>;
  confirm: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  activeReg: (seminarId: string) => SeminarRegistration | undefined;
  isRegistered: (seminarId: string) => boolean;
  liveSeminar: (seminar: Seminar) => Seminar;
  seatsLeft: (seminar: Seminar) => number;
  occupancyOf: (seminarId: string) => { confirmed: number; pending: number; active: number };
};

const SeminarCtx = createContext<Ctx | null>(null);

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function SeminarRegsProvider({ children }: { children: ReactNode }) {
  const [regs, setRegs] = useState<SeminarRegistration[]>([]);
  const [occ, setOcc] = useState<Occupancy>({});
  const [auth, setAuth] = useState(false);
  const [ready, setReady] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);

  const refresh = useCallback(async () => {
    const [o, mine, cat] = await Promise.all([
      getJson<{ ok?: boolean; occ?: Occupancy }>("/api/seminars/occupancy"),
      getJson<{ ok?: boolean; auth?: boolean; items?: ServerRegistration[] }>("/api/seminars/my"),
      getJson<{ ok?: boolean; seminars?: SeminarRow[] }>("/api/seminars/catalog"),
    ]);
    if (cat?.ok) {
      setRemoteSeminars((cat.seminars ?? []).map(rowToSeminar));
      setCatalogVersion((v) => v + 1);
    }
    if (o?.ok) setOcc(o.occ ?? {});
    if (mine?.ok) {
      setAuth(Boolean(mine.auth));
      setRegs((mine.items ?? []).map(fromServer));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    // Initial load from the server (registrations live in the database, not in the browser).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [refresh]);

  const occupancyOf = useCallback(
    (seminarId: string) => {
      const o = occ[seminarId];
      const confirmed = (o?.confirmed ?? 0) + (o?.attended ?? 0);
      const pending = o?.registered ?? 0;
      return { confirmed, pending, active: confirmed + pending };
    },
    [occ],
  );

  /* eslint-disable react-hooks/exhaustive-deps -- catalogVersion invalidates callers when the shared seminar list changes */
  const liveSeminar = useCallback(
    (seminar: Seminar): Seminar => {
      const catalog = getSeminar(seminar.id) ?? seminar;
      const extra = occupancyOf(catalog.id).active;
      const seatsTaken = Math.min(catalog.seatsTotal, catalog.seatsTaken + extra);
      return { ...catalog, seatsTaken };
    },
    [occupancyOf, catalogVersion],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const seatsRemaining = useCallback((seminar: Seminar) => catalogSeatsLeft(liveSeminar(seminar)), [liveSeminar]);

  const register = useCallback(
    async (input: RegisterInput): Promise<RegisterResult> => {
      try {
        const res = await fetch("/api/seminars/register", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const j = (await res.json().catch(() => ({}))) as { ok?: boolean; registration?: ServerRegistration; reason?: string; error?: string };
        if (j.ok && j.registration) {
          await refresh();
          return { ok: true, registration: fromServer(j.registration) };
        }
        if (res.status === 401) return { ok: false, reason: "auth" };
        const known = ["duplicate", "full", "invalid", "closed"] as const;
        const reason = known.find((k) => k === j.reason) ?? "error";
        if (reason === "duplicate" || reason === "full") void refresh();
        return { ok: false, reason, error: j.error };
      } catch {
        return { ok: false, reason: "error", error: "Aloqa xatosi. Qayta urinib ko‘ring." };
      }
    },
    [refresh],
  );

  const act = useCallback(
    async (id: string, action: "confirm" | "cancel") => {
      const reg = regs.find((r) => r.id === id);
      try {
        await fetch(`/api/seminars/registrations/${id}`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, seminarId: reg?.seminarId }),
        });
      } finally {
        await refresh();
      }
    },
    [refresh, regs],
  );

  const value = useMemo<Ctx>(
    () => ({
      ready,
      catalogVersion,
      auth,
      registrations: regs,
      register,
      confirm: (id) => act(id, "confirm"),
      cancel: (id) => act(id, "cancel"),
      refresh,
      activeReg: (seminarId) => findActiveReg(regs, seminarId),
      isRegistered: (seminarId) => Boolean(findActiveReg(regs, seminarId)),
      liveSeminar,
      seatsLeft: seatsRemaining,
      occupancyOf,
    }),
    [act, auth, catalogVersion, liveSeminar, occupancyOf, ready, refresh, register, regs, seatsRemaining],
  );

  return <SeminarCtx.Provider value={value}>{children}</SeminarCtx.Provider>;
}

export function useSeminarRegs() {
  const ctx = useContext(SeminarCtx);
  if (!ctx) throw new Error("useSeminarRegs must be used within SeminarRegsProvider");
  return ctx;
}
