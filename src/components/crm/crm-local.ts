"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Treatment plans and payments. The clinic API has no price / payment fields yet,
 * so these live in this browser (localStorage), like Ombor. Shapes are table-ready.
 */
export type ToothMark = "karies" | "plomba" | "endo" | "implant" | "koronka" | "ekstraksiya";
export type StageStatus = "bajarildi" | "davom" | "kutilmoqda";
export type Stage = { id: string; service: string; teeth: number[]; count: number; price: number; status: StageStatus; date?: string };
export type Plan = { id: string; patientId: string; title: string; doctor?: string; createdAt: string; stages: Stage[]; teeth: Record<string, ToothMark> };
export type PayMethod = "naqd" | "karta" | "click" | "payme";
export type Payment = { id: string; patientId: string; patientName: string; planId?: string; date: string; amount: number; method: PayMethod; note?: string };

const PLANS = "stomahub:clinic-plans:v1";
const PAYS = "stomahub:clinic-payments:v1";

function useStored<T>(key: string) {
  const [value, setValue] = useState<T[] | null>(null);
  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage once
      setValue(Array.isArray(raw) ? raw : []);
    } catch {
      setValue([]);
    }
  }, [key]);
  const save = useCallback(
    (next: T[]) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [key],
  );
  return [value, save] as const;
}

export const usePlans = () => useStored<Plan>(PLANS);
export const usePayments = () => useStored<Payment>(PAYS);

export const METHOD: Record<PayMethod, { label: string; cls: string; color: string }> = {
  naqd: { label: "Naqd", cls: "bg-[#eef4ff] text-[#2563eb]", color: "#f59e0b" },
  karta: { label: "Karta", cls: "bg-[#eef4ff] text-[#1d4ed8]", color: "#2f6bff" },
  click: { label: "Click", cls: "bg-[#e8f8ef] text-[#17914f]", color: "#14b8a6" },
  payme: { label: "Payme", cls: "bg-[#f3eaff] text-[#7c3aed]", color: "#a78bfa" },
};

export const planTotal = (p: Plan) => p.stages.reduce((a, s) => a + s.price * Math.max(1, s.count), 0);
export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const som = (n: number) => `${Math.round(n).toLocaleString("ru-RU").replace(/\u00a0/g, " ")} so‘m`;
