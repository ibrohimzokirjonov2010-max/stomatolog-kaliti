"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buildPatients, patientStatuses } from "@/data/crm";
import { useStoredList } from "@/lib/stored-list";
import { NewPatientModal, patientFromDraft, type NewPatientDraft } from "@/components/crm/NewPatientModal";

export function PatientsPhone() {
  const [items, setItems] = useStoredList("sk-crm-patients-v1", buildPatients());
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");

  function save(draft: NewPatientDraft) {
    const next = patientFromDraft(draft, items.length + 1);
    setItems((prev) => [next, ...prev]);
    setOpen(false);
    setToast(`${next.name} qo‘shildi`);
    window.setTimeout(() => setToast(""), 2800);
  }

  return (
    <section className="space-y-2 px-1 py-2 lg:hidden" data-testid="phone-fallback">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-[22px] font-extrabold text-[#0f1e3d]">Bemorlar CRM</h1>
        <button type="button" className="inline-flex h-10 items-center gap-1 rounded-[10px] bg-[#0F8A8A] px-3 text-[13px] font-bold text-white" data-testid="patient-add-mobile" onClick={() => setOpen(true)}>
          <Plus size={16} /> Yangi bemor
        </button>
      </div>
      <p className="text-[13px] text-[#6a7c93]">Bemor qidirish, status va qabul.</p>
      <ul className="space-y-2">
        {items.slice(0, 12).map((item) => (
          <li key={item.id} className="rounded-xl border border-[#e6edf5] bg-white px-3 py-2 text-[14px] text-[#0f1e3d]" data-testid="patient-phone-row">
            <b><Link href={`/crm/bemorlar/${item.id}`}>{item.name}</Link></b>
            <span className="mt-0.5 block text-[12px] text-[#6a7c93]">{item.phone} · {item.city} · {patientStatuses.find((entry) => entry.id === item.status)?.label}</span>
          </li>
        ))}
      </ul>
      {open ? <NewPatientModal onClose={() => setOpen(false)} onSave={save} /> : null}
      {toast ? <div className="nb-toast" role="status"><i />{toast}</div> : null}
    </section>
  );
}
