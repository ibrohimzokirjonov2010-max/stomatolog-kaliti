"use client";

import { useState, type FormEvent } from "react";
import type { Patient } from "@/components/clinic-dashboard";
import { cn } from "@/lib/utils";
import { METHOD, todayIso, uid, type PayMethod, type Payment } from "./crm-local";

export const fieldCls = "mt-1 h-11 w-full rounded-xl border border-[#e6eaf2] bg-white px-3 text-[14px] outline-none focus:border-[#0066FF]";

export function PaymentForm({
  patients,
  patientId,
  planId,
  method: initialMethod,
  onSave,
}: {
  patients: Patient[];
  patientId?: string;
  planId?: string;
  method?: PayMethod;
  onSave: (p: Payment) => void;
}) {
  const [pid, setPid] = useState(patientId ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PayMethod>(initialMethod ?? "naqd");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    const p = patients.find((x) => x.id === pid);
    const n = Number(amount.replace(/\s/g, ""));
    if (!p) return setErr("Bemorni tanlang");
    if (!n || n <= 0) return setErr("Summani kiriting");
    onSave({ id: uid(), patientId: p.id, patientName: p.name, planId, date, amount: n, method, note: note.trim() || undefined });
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-[12.5px] font-medium text-[#4a5470]">
        Bemor
        <select value={pid} onChange={(e) => setPid(e.target.value)} className={fieldCls} disabled={Boolean(patientId)}>
          <option value="">Tanlang</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-[12.5px] font-medium text-[#4a5470]">
          Summa (so‘m)
          <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className={fieldCls} />
        </label>
        <label className="block text-[12.5px] font-medium text-[#4a5470]">
          Sana
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
        </label>
      </div>
      <div>
        <div className="text-[12.5px] font-medium text-[#4a5470]">To‘lov usuli</div>
        <div className="mt-1 grid grid-cols-4 gap-2">
          {(Object.keys(METHOD) as PayMethod[]).map((m) => (
            <button key={m} type="button" onClick={() => setMethod(m)} className={cn("h-10 rounded-xl border text-[13px] font-semibold", method === m ? "border-[#0066FF] bg-[#0066FF] text-white" : "border-[#e6eaf2] bg-white text-[#1f2a44]")}>
              {METHOD[m].label}
            </button>
          ))}
        </div>
      </div>
      <label className="block text-[12.5px] font-medium text-[#4a5470]">
        Izoh
        <input value={note} onChange={(e) => setNote(e.target.value)} className={fieldCls} />
      </label>
      {err ? <p className="text-[13px] text-red-600">{err}</p> : null}
      <button type="submit" className="h-11 w-full rounded-xl bg-[#0066FF] text-[14px] font-semibold text-white">Saqlash</button>
    </form>
  );
}
