"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data loading effects kick off async fetches */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Wrench, X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import type { Master, RequestService } from "@/data/masters";
import type { RequestStatus, UstaRequest, WhenNeed } from "@/lib/usta-work";
import { api } from "@/lib/work-client";

export type SubmitInput = {
  masterId: string;
  service?: RequestService;
  /** v2 mobile sheet */
  services?: string[];
  timeRange?: string;
  media?: string[];
  extra?: string;
  clinic: string;
  district: string;
  address?: string;
  name: string;
  phone: string;
  note?: string;
  when: WhenNeed;
  date?: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string; errors?: Record<string, string>; status?: number };

type Ctx = {
  masters: Master[];
  mastersReady: boolean;
  /** Requests I sent (as a clinic/doctor) */
  requests: UstaRequest[];
  /** Requests received by my master profile */
  incoming: UstaRequest[];
  requestsReady: boolean;
  authed: boolean;
  submitRequest: (input: SubmitInput) => Promise<ActionResult>;
  setStatus: (id: string, status: RequestStatus) => Promise<ActionResult>;
  refresh: () => Promise<void>;
};

const UstaCtx = createContext<Ctx | null>(null);

export function UstaWorkProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, ready: profileReady } = useDoctorProfile();
  const active = pathname.startsWith("/ustalar");
  const [masters, setMasters] = useState<Master[]>([]);
  const [mastersReady, setMastersReady] = useState(false);
  const [requests, setRequests] = useState<UstaRequest[]>([]);
  const [incoming, setIncoming] = useState<UstaRequest[]>([]);
  const [requestsReady, setRequestsReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const userId = profile?.id ?? null;

  const loadCatalog = useCallback(async () => {
    const res = await api<{ masters: Master[] }>("/api/work/masters");
    if (res.ok) setMasters(res.data.masters ?? []);
    setMastersReady(true);
  }, []);

  const loadRequests = useCallback(async () => {
    const res = await api<{ outgoing: UstaRequest[]; incoming: UstaRequest[] }>("/api/work/masters/requests");
    if (res.ok) {
      setRequests(res.data.outgoing ?? []);
      setIncoming(res.data.incoming ?? []);
    }
    setRequestsReady(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    void loadCatalog();
  }, [active, loadCatalog, userId]);

  useEffect(() => {
    if (!active || !profileReady) return;
    if (!userId) return;
    void loadRequests();
  }, [active, profileReady, userId, loadRequests]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const submitRequest = useCallback(
    async (input: SubmitInput): Promise<ActionResult> => {
      const res = await api("/api/work/masters/requests", { body: input });
      if (!res.ok) return { ok: false, error: res.error, errors: res.errors, status: res.status };
      setToast("So‘rov yuborildi. Usta qabul qilsa, bildirishnoma olasiz.");
      void loadRequests();
      return { ok: true };
    },
    [loadRequests],
  );

  const setStatus = useCallback(
    async (id: string, status: RequestStatus): Promise<ActionResult> => {
      const res = await api(`/api/work/masters/requests/${id}`, { body: { status } });
      if (!res.ok) return { ok: false, error: res.error, status: res.status };
      await loadRequests();
      return { ok: true };
    },
    [loadRequests],
  );

  const value = useMemo<Ctx>(
    () => ({ masters, mastersReady, requests: userId ? requests : [], incoming: userId ? incoming : [], requestsReady: profileReady && (userId ? requestsReady : true), authed: Boolean(userId), submitRequest, setStatus, refresh: loadRequests }),
    [incoming, loadRequests, masters, mastersReady, profileReady, requests, requestsReady, setStatus, submitRequest, userId],
  );

  return (
    <UstaCtx.Provider value={value}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-[min(100%-2rem,380px)]">
          <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-[#CCFBF1] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.16)] lg:mx-0">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a]">
                <Check className="size-4" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1a1d26]">{toast}</p>
                <Link href="/ustalar/sorovlarim" className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0F766E] hover:underline">
                  <Wrench className="size-3.5" />
                  Mening so‘rovlarim
                </Link>
              </div>
              <button type="button" onClick={() => setToast(null)} className="text-[#8b93a7] hover:text-[#1a1d26]" aria-label="Yopish">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </UstaCtx.Provider>
  );
}

export function useUstaWork() {
  const ctx = useContext(UstaCtx);
  if (!ctx) throw new Error("useUstaWork must be used within UstaWorkProvider");
  return ctx;
}
