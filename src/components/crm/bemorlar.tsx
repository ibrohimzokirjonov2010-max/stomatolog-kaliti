"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  StickyNote,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import { PatientForm, Sheet, VisitForm, type Patient, type Visit } from "@/components/clinic-dashboard";
import { cn } from "@/lib/utils";
import { CrmFrame, CrmTitle, fmtDate, initials, selectCls, type useClinic } from "./crm-shared";
import { Odontogram } from "./odontogram";

type Clinic = ReturnType<typeof useClinic>;
type Modal = null | { kind: "patient"; patient: Patient | null } | { kind: "visit" };
const PAGE = 10;

const pill: Record<Patient["status"], string> = {
  Faol: "bg-[#e8f8ef] text-[#17914f]",
  Noaktiv: "bg-[#fdecec] text-[#d93b3b]",
};
const pillLabel: Record<Patient["status"], string> = { Faol: "Faol", Noaktiv: "Nofaol" };
const visitTone: Record<Visit["status"], string> = {
  Keldi: "bg-[#e8f8ef] text-[#17914f]",
  Kutilyapti: "bg-[#eaf2ff] text-[#0066FF]",
  Bekor: "bg-[#f1f3f7] text-[#6b7590]",
};

export function BemorlarPage() {
  return <CrmFrame next="/klinika/bemorlar">{(c) => <Bemorlar c={c} />}</CrmFrame>;
}

function Bemorlar({ c }: { c: Clinic }) {
  const patients = useMemo(() => c.state?.patients ?? [], [c.state]);
  const visits = useMemo(() => c.state?.visits ?? [], [c.state]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | Patient["status"]>("");
  const [sort, setSort] = useState<"new" | "name" | "last" | "next">("new");
  const [page, setPage] = useState(1);
  const [selId, setSelId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [menu, setMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = patients.filter(
      (p) => (!status || p.status === status) && (!term || `${p.name} ${p.phone ?? ""} ${p.id}`.toLowerCase().includes(term)),
    );
    const s = [...rows];
    if (sort === "name") s.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "last") s.sort((a, b) => (b.lastVisit ?? "").localeCompare(a.lastVisit ?? ""));
    if (sort === "next") s.sort((a, b) => (a.nextVisit ?? "9").localeCompare(b.nextVisit ?? "9"));
    return s;
  }, [patients, q, sort, status]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(page, pages);
  const rows = list.slice((cur - 1) * PAGE, cur * PAGE);
  const sel = patients.find((p) => p.id === selId) ?? rows[0] ?? null;

  function exportCsv() {
    const head = ["Ism", "Telefon", "Status", "Oxirgi tashrif", "Keyingi qabul", "Izoh"];
    const esc = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const body = list.map((p) => [p.name, p.phone, pillLabel[p.status], p.lastVisit, p.nextVisit, p.note].map(esc).join(","));
    const blob = new Blob([`\uFEFF${[head.join(","), ...body].join("\n")}`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bemorlar.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /** CSV import: first column = name, second = phone (optional header row). Uses the same patient_save op. */
  async function importCsv(file: File) {
    const lines = (await file.text()).split(/\r?\n/).map((l) => l.split(/[,;]/).map((x) => x.replace(/^"|"$/g, "").trim()));
    const data = lines.filter((l) => l[0] && !/^(ism|name)$/i.test(l[0]));
    let added = 0;
    for (const [name, phone] of data) {
      const res = await c.op("patient_save", { name, phone: phone ?? "", status: "Faol", note: "" });
      if (res.ok) added += 1;
    }
    c.setError(added ? "" : "Import: hech qanday bemor qo‘shilmadi");
  }

  const patientVisits = (id: string) => visits.filter((v) => v.patientId === id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <div>
      <CrmTitle
        title="Bemorlar CRM"
        subtitle="Barcha bemorlaringizni boshqaring"
        actions={
          <div className="hidden items-center gap-2 lg:flex">
            <button type="button" onClick={() => setModal({ kind: "patient", patient: null })} className="flex h-10 items-center gap-2 rounded-xl bg-[#0066FF] px-5 text-[13px] font-semibold text-white hover:bg-[#0057d9]">
              <Plus className="size-4" /> Yangi bemor qo‘shish
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="flex h-10 items-center gap-2 rounded-xl border border-[#d6e4ff] bg-white px-4 text-[13px] font-semibold text-[#0066FF]">
              <Upload className="size-4" /> Import
            </button>
            <button type="button" onClick={exportCsv} disabled={!list.length} className="flex h-10 items-center gap-2 rounded-xl border border-[#d6e4ff] bg-white px-4 text-[13px] font-semibold text-[#0066FF] disabled:opacity-50">
              <Download className="size-4" /> Eksport
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && void importCsv(e.target.files[0])} />
          </div>
        }
      />
      {c.error ? <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-600">{c.error}</p> : null}

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-2.5">
            <label className="relative min-w-0 flex-1 max-lg:basis-full">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#0066FF]" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Bemor qidirish (ism, telefon)..."
                className="h-10 w-full rounded-xl border border-[#e6eaf2] bg-white pr-3 pl-10 text-[12.5px] outline-none placeholder:text-[#9aa3b2] focus:border-[#0066FF]"
              />
            </label>
            <label className="relative flex-1 lg:w-[150px] lg:flex-none">
              <select value={status} onChange={(e) => { setStatus(e.target.value as "" | Patient["status"]); setPage(1); }} className={selectCls}>
                <option value="">Barcha statuslar</option>
                <option value="Faol">Faol</option>
                <option value="Noaktiv">Nofaol</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
            </label>
            <label className="relative flex-1 lg:w-[150px] lg:flex-none">
              <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={cn(selectCls, "pl-9")}>
                <option value="new">Yangi oldin</option>
                <option value="name">Ism (A–Z)</option>
                <option value="last">Oxirgi tashrif</option>
                <option value="next">Keyingi qabul</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
            </label>
          </div>

          {patients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9e0ec] bg-white px-6 py-14 text-center">
              <UserPlus className="mx-auto size-10 text-[#0066FF]" strokeWidth={1.5} />
              <p className="mt-3 text-[15px] font-semibold text-[#0B1F4D]">Hali bemor yo‘q</p>
              <p className="mt-1 text-[13px] text-[#8b93a7]">Birinchi bemoringizni qo‘shing. Ma’lumotlar faqat sizga ko‘rinadi.</p>
              <button type="button" onClick={() => setModal({ kind: "patient", patient: null })} className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0066FF] px-4 text-[13px] font-semibold text-white">
                <Plus className="size-4" /> Yangi bemor qo‘shish
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-2xl border border-[#eceff5] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] lg:block">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="border-b border-[#eef1f6] text-[11.5px] text-[#6b7590]">
                    <tr>
                      <th className="w-10 py-3 pl-4">
                        <input type="checkbox" aria-label="Hammasini tanlash" checked={rows.length > 0 && rows.every((r) => checked.includes(r.id))} onChange={(e) => setChecked(e.target.checked ? rows.map((r) => r.id) : [])} />
                      </th>
                      <th className="w-8 font-medium">#</th>
                      <th className="font-medium">Bemor</th>
                      <th className="font-medium">Telefon</th>
                      <th className="font-medium">Status</th>
                      <th className="font-medium">Oxirgi tashrif</th>
                      <th className="font-medium">Keyingi qabul</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p, i) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelId(p.id)}
                        className={cn("cursor-pointer border-b border-[#f2f4f8] last:border-0 hover:bg-[#f8faff]", sel?.id === p.id && "bg-[#f3f7ff]")}
                      >
                        <td className="py-2.5 pl-4" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" aria-label={`${p.name} tanlash`} checked={checked.includes(p.id)} onChange={(e) => setChecked(e.target.checked ? [...checked, p.id] : checked.filter((x) => x !== p.id))} />
                        </td>
                        <td className="text-[#6b7590]">{(cur - 1) * PAGE + i + 1}</td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={p.name} />
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-[#0B1F4D]">{p.name}</div>
                              {p.note ? <div className="max-w-[180px] truncate text-[11px] text-[#8b93a7]">{p.note}</div> : null}
                            </div>
                          </div>
                        </td>
                        <td className="text-[#1f2a44]">{p.phone || "—"}</td>
                        <td>
                          <span className={cn("rounded-md px-2 py-0.5 text-[11.5px] font-semibold", pill[p.status])}>{pillLabel[p.status]}</span>
                        </td>
                        <td className="text-[#1f2a44]">{fmtDate(p.lastVisit)}</td>
                        <td className={p.nextVisit ? "font-medium text-[#0066FF]" : "text-[#9aa3b2]"}>{p.nextVisit ? fmtDate(p.nextVisit) : "—"}</td>
                        <td className="relative pr-3" onClick={(e) => e.stopPropagation()}>
                          <RowMenu
                            open={menu === p.id}
                            onToggle={() => setMenu(menu === p.id ? null : p.id)}
                            onEdit={() => { setMenu(null); setModal({ kind: "patient", patient: p }); }}
                            onDelete={() => { setMenu(null); if (window.confirm(`${p.name} ni o‘chirasizmi? Qabul yozuvlari saqlanadi.`)) void c.op("patient_delete", {}, p.id); }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center gap-3 border-t border-[#eef1f6] px-4 py-3 text-[12px] text-[#6b7590]">
                  <span>Jami: {list.length} bemor</span>
                  <div className="mx-auto flex items-center gap-1">
                    <PageBtn disabled={cur === 1} onClick={() => setPage(cur - 1)}><ChevronLeft className="size-4" /></PageBtn>
                    {Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, cur - 3), Math.max(0, cur - 3) + 5).map((n) => (
                      <PageBtn key={n} active={n === cur} onClick={() => setPage(n)}>{n}</PageBtn>
                    ))}
                    <PageBtn disabled={cur === pages} onClick={() => setPage(cur + 1)}><ChevronRight className="size-4" /></PageBtn>
                  </div>
                  <span>Sahifada: {PAGE}</span>
                </div>
              </div>

              {/* Mobile cards */}
              <ul className="space-y-2.5 lg:hidden">
                {list.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => { setSelId(p.id); setMobileOpen(true); }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-[#eceff5] bg-white p-3 text-left shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
                    >
                      <Avatar name={p.name} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-bold text-[#0B1F4D]">{p.name}</span>
                          <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", pill[p.status])}>{pillLabel[p.status]}</span>
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#6b7590]">{p.phone || "Telefon yo‘q"}</div>
                        <div className="mt-1 flex gap-3 text-[11.5px] text-[#8b93a7]">
                          <span>Oxirgi: {fmtDate(p.lastVisit)}</span>
                          {p.nextVisit ? <span className="font-medium text-[#0066FF]">Keyingi: {fmtDate(p.nextVisit)}</span> : null}
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-[#9aa3b2]" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {sel ? (
          <aside className="sticky top-0 hidden w-[300px] shrink-0 rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] lg:block 2xl:w-[330px]">
            <PatientDetail p={sel} visits={patientVisits(sel.id)} onVisit={() => setModal({ kind: "visit" })} onEdit={() => setModal({ kind: "patient", patient: sel })} />
          </aside>
        ) : null}
      </div>

      {mobileOpen && sel ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-[#F4F7FC] p-4 pb-28 lg:hidden">
          <button type="button" onClick={() => setMobileOpen(false)} className="mb-3 flex items-center gap-1.5 text-[14px] font-semibold text-[#0B1F4D]">
            <ArrowLeft className="size-5" /> Bemorlar
          </button>
          <div className="rounded-2xl border border-[#eceff5] bg-white p-4">
            <PatientDetail p={sel} visits={patientVisits(sel.id)} onVisit={() => setModal({ kind: "visit" })} onEdit={() => setModal({ kind: "patient", patient: sel })} />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Yangi bemor qo‘shish"
        onClick={() => setModal({ kind: "patient", patient: null })}
        className="fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-[0_8px_24px_rgba(0,102,255,0.4)] lg:hidden"
      >
        <Plus className="size-6" />
      </button>

      {modal?.kind === "patient" ? (
        <Sheet title={modal.patient ? "Bemorni tahrirlash" : "Bemor qo‘shish"} onClose={() => setModal(null)}>
          <PatientForm patient={modal.patient} onSubmit={(d) => c.op("patient_save", d, modal.patient?.id)} onDone={() => setModal(null)} />
        </Sheet>
      ) : null}
      {modal?.kind === "visit" ? (
        <Sheet title="Qabul qo‘shish" onClose={() => setModal(null)}>
          <VisitForm patients={patients} today={c.state?.today ?? ""} onSubmit={(d) => c.op("visit_save", d)} onDone={() => setModal(null)} />
        </Sheet>
      ) : null}
    </div>
  );
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#e3edff] to-[#cddcff] font-bold text-[#0066FF]"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}

function PageBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn("grid size-8 place-items-center rounded-lg border text-[12px] font-semibold disabled:opacity-40", active ? "border-[#0066FF] bg-[#0066FF] text-white" : "border-[#e6eaf2] bg-white text-[#1f2a44]")}
    >
      {children}
    </button>
  );
}

function RowMenu({ open, onToggle, onEdit, onDelete }: { open: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <>
      <button type="button" aria-label="Amallar" onClick={onToggle} className="grid size-8 place-items-center rounded-lg text-[#4a5470] hover:bg-[#f1f3f7]">
        <MoreHorizontal className="size-4" />
      </button>
      {open ? (
        <div className="absolute top-9 right-3 z-20 w-40 rounded-xl border border-[#eceff5] bg-white p-1 shadow-lg">
          <button type="button" onClick={onEdit} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] hover:bg-[#f4f7fc]">
            <Pencil className="size-3.5" /> Tahrirlash
          </button>
          <button type="button" onClick={onDelete} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-red-600 hover:bg-red-50">
            <Trash2 className="size-3.5" /> O‘chirish
          </button>
        </div>
      ) : null}
    </>
  );
}

function PatientDetail({ p, visits, onVisit, onEdit }: { p: Patient; visits: Visit[]; onVisit: () => void; onEdit: () => void }) {
  const [tab, setTab] = useState<"umumiy" | "davolash" | "tolov" | "hujjat">("umumiy");
  return (
    <div>
      <div className="flex items-start gap-3">
        <Avatar name={p.name} size={56} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-[#0B1F4D]">{p.name}</div>
          <div className="text-[11.5px] text-[#8b93a7]">#{p.id.slice(0, 8).toUpperCase()}</div>
          <span className={cn("mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold", pill[p.status])}>{pillLabel[p.status]}</span>
        </div>
        <button type="button" onClick={onEdit} aria-label="Tahrirlash" className="grid size-8 place-items-center rounded-lg border border-[#e6eaf2] text-[#4a5470]">
          <Pencil className="size-3.5" />
        </button>
      </div>
      <div className="mt-3 space-y-1.5 text-[12.5px] text-[#1f2a44]">
        {p.phone ? (
          <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="flex items-center gap-2"><Phone className="size-3.5 text-[#6b7590]" /> {p.phone}</a>
        ) : null}
        {p.note ? (
          <p className="flex items-start gap-2"><StickyNote className="mt-0.5 size-3.5 shrink-0 text-[#6b7590]" /> {p.note}</p>
        ) : null}
      </div>
      <button type="button" onClick={onVisit} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0066FF] text-[13px] font-semibold text-white hover:bg-[#0057d9]">
        <CalendarPlus className="size-4" /> Qabul qo‘shish
      </button>
      <div className="mt-3 flex border-b border-[#eef1f6] text-[12.5px]">
        {(
          [
            ["umumiy", "Umumiy"],
            ["davolash", "Davolash"],
            ["tolov", "To‘lovlar"],
            ["hujjat", "Hujjatlar"],
          ] as const
        ).map(([id, l]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={cn("-mb-px flex-1 border-b-2 py-2 font-medium", tab === id ? "border-[#0066FF] text-[#0066FF]" : "border-transparent text-[#4a5470]")}>
            {l}
          </button>
        ))}
      </div>
      {tab === "umumiy" ? (
        <>
          <h3 className="mt-3 mb-2 text-[13px] font-bold text-[#0B1F4D]">Tish kartasi</h3>
          <Odontogram />
          <VisitList visits={visits.slice(0, 4)} title="So‘nggi tashriflar" />
        </>
      ) : tab === "davolash" ? (
        <VisitList visits={visits} title="Barcha qabullar" />
      ) : (
        <p className="py-8 text-center text-[12.5px] text-[#8b93a7]">Hozircha ma’lumot yo‘q</p>
      )}
    </div>
  );
}

function VisitList({ visits, title }: { visits: Visit[]; title: string }) {
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-[13px] font-bold text-[#0B1F4D]">{title}</h3>
      {visits.length === 0 ? (
        <p className="text-[12px] text-[#8b93a7]">Tashriflar yo‘q</p>
      ) : (
        <ul className="divide-y divide-[#f2f4f8]">
          {visits.map((v) => (
            <li key={v.id} className="flex items-center gap-2 py-2 text-[12px]">
              <span className="w-[70px] shrink-0 text-[#1f2a44]">{fmtDate(v.date)}</span>
              <span className="min-w-0 flex-1 truncate text-[#4a5470]">{v.procedure}</span>
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", visitTone[v.status])}>{v.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
