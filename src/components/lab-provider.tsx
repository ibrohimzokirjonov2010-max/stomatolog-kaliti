"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data loading effects kick off async fetches */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, FlaskConical, X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import type { Lab, LabMaterial, LabService } from "@/data/labs";
import { latestActiveOrder, type LabOrder, type LabOrderStatus } from "@/lib/lab-work";
import { api } from "@/lib/work-client";

export type PlaceOrderInput = {
  labId: string;
  service: LabService;
  material: LabMaterial;
  patientCode: string;
  dueDays: number;
  phone: string;
  note?: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string; errors?: Record<string, string>; status?: number };

type Ctx = {
  labs: Lab[];
  labsReady: boolean;
  /** Orders I placed as a doctor */
  orders: LabOrder[];
  /** Orders received by my lab */
  incoming: LabOrder[];
  ordersReady: boolean;
  authed: boolean;
  latest: LabOrder | null;
  placeOrder: (input: PlaceOrderInput) => Promise<ActionResult>;
  setOrderStatus: (id: string, status: LabOrderStatus) => Promise<ActionResult>;
  refresh: () => Promise<void>;
};

const LabCtx = createContext<Ctx | null>(null);

export function LabWorkProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, ready: profileReady } = useDoctorProfile();
  const active = pathname.startsWith("/laboratoriya");
  // The clinic dashboard lists the doctor's open lab orders too.
  const ordersActive = active || pathname.startsWith("/mening-klinikam") || pathname.startsWith("/klinika");
  const userId = profile?.id ?? null;
  const [labs, setLabs] = useState<Lab[]>([]);
  const [labsReady, setLabsReady] = useState(false);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [incoming, setIncoming] = useState<LabOrder[]>([]);
  const [ordersReady, setOrdersReady] = useState(false);
  const [toast, setToast] = useState<{ text: string; href?: string; hrefLabel?: string } | null>(null);

  const loadCatalog = useCallback(async () => {
    const res = await api<{ labs: Lab[] }>("/api/work/labs");
    if (res.ok) setLabs(res.data.labs ?? []);
    setLabsReady(true);
  }, []);

  const loadOrders = useCallback(async () => {
    const res = await api<{ outgoing: LabOrder[]; incoming: LabOrder[] }>("/api/work/labs/orders");
    if (res.ok) {
      setOrders(res.data.outgoing ?? []);
      setIncoming(res.data.incoming ?? []);
    }
    setOrdersReady(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    void loadCatalog();
  }, [active, loadCatalog, userId]);

  useEffect(() => {
    if (!ordersActive || !profileReady) return;
    if (!userId) return;
    void loadOrders();
  }, [ordersActive, profileReady, userId, loadOrders]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const placeOrder = useCallback(
    async (input: PlaceOrderInput): Promise<ActionResult> => {
      const res = await api("/api/work/labs/orders", { body: input });
      if (!res.ok) return { ok: false, error: res.error, errors: res.errors, status: res.status };
      setToast({ text: "Buyurtma yuborildi. Lab qabul qilsa, xabar olasiz.", href: "/laboratoriya/buyurtmalarim", hrefLabel: "Mening lab buyurtmalarim" });
      void loadOrders();
      return { ok: true };
    },
    [loadOrders],
  );

  const setOrderStatus = useCallback(
    async (id: string, status: LabOrderStatus): Promise<ActionResult> => {
      const res = await api(`/api/work/labs/orders/${id}`, { body: { status } });
      if (!res.ok) return { ok: false, error: res.error, status: res.status };
      await loadOrders();
      return { ok: true };
    },
    [loadOrders],
  );

  const latest = useMemo(() => (userId ? latestActiveOrder(orders) : null), [orders, userId]);

  const value = useMemo<Ctx>(
    () => ({ labs, labsReady, orders: userId ? orders : [], incoming: userId ? incoming : [], ordersReady: profileReady && (userId ? ordersReady : true), authed: Boolean(userId), latest, placeOrder, setOrderStatus, refresh: loadOrders }),
    [incoming, labs, labsReady, latest, loadOrders, orders, ordersReady, placeOrder, profileReady, setOrderStatus, userId],
  );

  return (
    <LabCtx.Provider value={value}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-[min(100%-2rem,380px)]">
          <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-[#F0FDFA] bg-white p-4 shadow-[0_12px_40px_rgba(17, 24, 39, 0.16)] lg:mx-0">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a]">
                <Check className="size-4" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1a1d26]">{toast.text}</p>
                {toast.href ? (
                  <Link href={toast.href} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0F766E] hover:underline">
                    <FlaskConical className="size-3.5" />
                    {toast.hrefLabel}
                  </Link>
                ) : null}
              </div>
              <button type="button" onClick={() => setToast(null)} className="text-[#8b93a7] hover:text-[#1a1d26]" aria-label="Yopish">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </LabCtx.Provider>
  );
}

export function useLabWork() {
  const ctx = useContext(LabCtx);
  if (!ctx) throw new Error("useLabWork must be used within LabWorkProvider");
  return ctx;
}
