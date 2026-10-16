"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data loading effects kick off async fetches */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CalendarDays, CalendarPlus, Phone, Plus, Search, Settings, Trash2, UserPlus, Users, X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { MobileSectionHeader } from "@/components/mobile-section-header";
import { EmptyState, Gate, StatusPill, inputCls, FormField, textareaCls } from "@/components/work-ui";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/work-client";
import { validateClinicOp, type FieldErrors } from "@/lib/work-validate";
import { cn } from "@/lib/utils";

export type VisitStatus = "Keldi" | "Kutilyapti" | "Bekor";
export type Clinic = { id: string; name: string; branch: string | null; address: string | null; openTime: string; closeTime: string };
export type Patient = { id: string; name: string; phone: string | null; status: "Faol" | "Noaktiv"; note: string | null; lastVisit: string | null; nextVisit: string | null };
export type Visit = { id: string; patientId: string | null; name: string; date: string; time: string; procedure: string; status: VisitStatus };
export type Staff = { id: string; name: string; role: string; onDuty: boolean };
export type State = { today: string; clinic: Clinic | null; patients: Patient[]; visits: Visit[]; staff: Staff[] };
type Modal = null | "clinic" | "patient" | "visit" | "staff";

const statusClass: Record<VisitStatus, string> = {
  Keldi: "bg-emerald-50 text-emerald-700",
  Kutilyapti: "bg-sky-50 text-sky-700",
  Bekor: "bg-slate-100 text-slate-500",
};

const fmtDate = (iso: string | null) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "—");
const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export function ClinicDashboard() {
  const { profile, ready } = useDoctorProfile();
  const userId = profile?.id ?? null;
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await api<{ state: State }>("/api/work/clinic");
    if (res.ok) setState(res.data.state ?? null);
    else setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      setState(null);
      setLoading(false);
      return;
    }
    void load();
  }, [ready, userId, load]);

  /** Runs a write op; the server answers with the fresh state. */
  async function op(name: string, data: Record<string, unknown>, id?: string): Promise<{ ok: true } | { ok: false; error: string; errors?: FieldErrors }> {
    if (busy) return { ok: false, error: "Iltimos, kuting…" };
    setBusy(true);
    setError("");
    const res = await api<{ state: State }>("/api/work/clinic", { body: { op: name, id, data } });
    setBusy(false);
    if (!res.ok) return { ok: false, error: res.error, errors: res.errors };
    setState(res.data.state);
    return { ok: true };
  }

  async function quick(name: string, data: Record<string, unknown>, id?: string) {
    const res = await op(name, data, id);
    if (!res.ok) setError(res.error);
  }

  const clinic = state?.clinic ?? null;
  const today = state?.today ?? "";
  const todays = useMemo(() => (state?.visits ?? []).filter((v) => v.date === today), [state, today]);
  const upcoming = useMemo(() => (state?.visits ?? []).filter((v) => v.date > today && v.status !== "Bekor").slice(0, 8), [state, today]);
  const patients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (state?.patients ?? []).filter((p) => !q || p.name.toLowerCase().includes(q) || (p.phone ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "") || "§"));
  }, [state, search]);

  return (
    <div
      className="-m-4 min-h-screen bg-gradient-to-b from-[#d9ebff] via-[#edf4fe] to-[#f4f7fa] p-4 pb-28 text-[#0f172a] lg:m-0 lg:min-h-0 lg:bg-none lg:p-0 lg:pb-0"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <MobileSectionHeader
        title="Mening klinikam"
        subtitle={clinic ? [clinic.name, clinic.branch, clinic.address].filter(Boolean).join(" · ") : "Klinikangiz ma’lumotlari faqat sizga ko‘rinadi."}
        className="mb-0"
      />

      <div className="mt-3 flex flex-col gap-3 lg:mt-0 lg:flex-row lg:items-start lg:justify-between">
        <div className="hidden lg:block">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#0d1727] lg:font-bold">Mening klinikam</h1>
          <p className="mt-0.5 text-[13px] text-[#7b879d] lg:text-sm">
            {clinic ? [clinic.name, clinic.branch, clinic.address].filter(Boolean).join(" · ") : "Klinikangiz ma’lumotlari faqat sizga ko‘rinadi."}
          </p>
        </div>
        {clinic ? (
          <div className="flex flex-wrap gap-2">
            <Button className="h-12 !rounded-2xl px-4 lg:h-10 lg:!rounded-xl" onClick={() => { setEditPatient(null); setModal("patient"); }}>
              <UserPlus className="size-4" />
              Bemor qo‘shish
            </Button>
            <Button variant="outline" className="h-12 !rounded-2xl bg-white px-4 lg:h-10 lg:!rounded-xl" onClick={() => setModal("visit")}>
              <CalendarPlus className="size-4" />
              Yozuv ochish
            </Button>
            <Button variant="outline" className="h-12 !rounded-2xl bg-white px-3.5 lg:h-10 lg:!rounded-xl" onClick={() => setModal("clinic")} aria-label="Klinika sozlamalari">
              <Settings className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {userId ? (
        <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
          {[
            ["/klinika/bemorlar", "Bemorlar CRM"],
            ["/klinika/uchrashuvlar", "Uchrashuvlar"],
            ["/klinika/ombor", "Ombor"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#d6e4ff] bg-white px-4 text-[13px] font-semibold text-[#0066FF] hover:bg-[#f3f8ff]">
              {label}
            </Link>
          ))}
        </nav>
      ) : null}

      {error ? <p role="alert" className="mt-3 rounded-xl bg-[#fef2f2] px-3.5 py-2.5 text-[13px] font-medium text-[#b91c1c]">{error}</p> : null}

      <div className="mt-4 space-y-4">
        {ready && !userId ? (
          <Gate title="Kirish talab qilinadi" text="Klinika ma’lumotlari (bemorlar, xodimlar) shaxsiy — faqat egasi ko‘radi. Davom etish uchun tizimga kiring." next="/klinika" />
        ) : loading || !ready ? (
          <p className="py-16 text-center text-sm text-[#7b879d]">Yuklanmoqda…</p>
        ) : !clinic ? (
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
            <h2 className="text-[17px] font-bold text-[#0d1727]">Klinikangizni sozlang</h2>
            <p className="mb-4 mt-1 text-sm text-[#7b879d]">Nom va ish vaqtini kiriting — keyin bemorlar, qabullar va xodimlarni qo‘shishingiz mumkin. Ma’lumotlar faqat sizga ko‘rinadi.</p>
            <ClinicForm onSubmit={(d) => op("clinic_save", d)} onDone={() => setModal(null)} />
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3" data-testid="clinic-kpis">
              <Kpi icon={<CalendarDays className="size-5" />} tone="bg-sky-50 text-sky-600" label="Bugungi qabullar" value={todays.filter((v) => v.status !== "Bekor").length} />
              <Kpi icon={<CalendarPlus className="size-5" />} tone="bg-amber-50 text-amber-600" label="Kutilmoqda" value={todays.filter((v) => v.status === "Kutilyapti").length} />
              <Kpi icon={<Users className="size-5" />} tone="bg-emerald-50 text-emerald-600" label="Jami bemorlar" value={state?.patients.length ?? 0} />
              <Kpi icon={<UserPlus className="size-5" />} tone="bg-violet-50 text-violet-600" label="Xodimlar" value={state?.staff.length ?? 0} />
            </section>
            <p className="text-center text-[12px] text-[#7b879d] lg:text-left">Ish vaqti: {clinic.openTime} – {clinic.closeTime} · Bugun {fmtDate(today)}</p>

            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)] lg:rounded-2xl">
                <h2 className="mb-3 text-[16px] font-bold text-[#0d1727]">Bugungi qabullar</h2>
                {todays.length === 0 ? (
                  <p className="rounded-2xl bg-[#f7f9fc] px-4 py-8 text-center text-sm text-[#7b879d]" data-testid="no-visits">Bugun qabul yo‘q. “Yozuv ochish” orqali qo‘shing.</p>
                ) : (
                  <ul className="space-y-2" data-testid="visit-list">
                    {todays.map((v) => (
                      <VisitRow key={v.id} v={v} busy={busy} onStatus={(s) => quick("visit_status", { status: s }, v.id)} onDelete={() => window.confirm("Yozuvni o‘chirasizmi?") && void quick("visit_delete", {}, v.id)} />
                    ))}
                  </ul>
                )}
                {upcoming.length ? (
                  <>
                    <h3 className="mb-2 mt-5 text-[13px] font-bold text-[#4b5568]">Keyingi qabullar</h3>
                    <ul className="space-y-2">
                      {upcoming.map((v) => (
                        <VisitRow key={v.id} v={v} showDate busy={busy} onStatus={(s) => quick("visit_status", { status: s }, v.id)} onDelete={() => window.confirm("Yozuvni o‘chirasizmi?") && void quick("visit_delete", {}, v.id)} />
                      ))}
                    </ul>
                  </>
                ) : null}
              </section>

              <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)] lg:rounded-2xl">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-[16px] font-bold text-[#0d1727]">Xodimlar</h2>
                  <button type="button" onClick={() => setModal("staff")} className="inline-flex h-9 items-center gap-1 rounded-full bg-[#eef4ff] px-3 text-[13px] font-semibold text-[#0066FF]">
                    <Plus className="size-3.5" />
                    Qo‘shish
                  </button>
                </div>
                {(state?.staff.length ?? 0) === 0 ? (
                  <p className="rounded-2xl bg-[#f7f9fc] px-4 py-8 text-center text-sm text-[#7b879d]" data-testid="no-staff">Hali xodim yo‘q.</p>
                ) : (
                  <ul className="space-y-2" data-testid="staff-list">
                    {state!.staff.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-[#eceff5] bg-[#fbfcfd] p-2.5">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[12px] font-bold text-[#0066FF]">{initials(s.name)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-bold text-[#0d1727]">{s.name}</span>
                          <span className="block truncate text-[12px] text-[#7b879d]">{s.role}</span>
                        </span>
                        <button type="button" disabled={busy} onClick={() => quick("staff_save", { name: s.name, role: s.role, onDuty: !s.onDuty }, s.id)} aria-pressed={s.onDuty}>
                          <StatusPill label={s.onDuty ? "Navbatchi" : "Dam olishda"} cls={s.onDuty ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"} />
                        </button>
                        <button type="button" disabled={busy} onClick={() => window.confirm(`${s.name} ni o‘chirasizmi?`) && void quick("staff_delete", {}, s.id)} className="grid size-9 place-items-center rounded-full text-[#8b93a7] hover:bg-[#f1f3f7]" aria-label="O‘chirish">
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)] lg:rounded-2xl">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[16px] font-bold text-[#0d1727]">Bemorlar <span className="text-[13px] font-semibold text-[#7b879d]">{state?.patients.length ?? 0} ta</span></h2>
                {(state?.patients.length ?? 0) > 0 ? (
                  <label className="relative block w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b93a7]" />
                    <input data-section-search value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism yoki telefon" className="h-11 w-full rounded-xl border border-[#dfe5ef] bg-white pl-9 pr-3 text-[14px] outline-none focus:border-[#0066FF]" />
                  </label>
                ) : null}
              </div>
              {(state?.patients.length ?? 0) === 0 ? (
                <EmptyState title="Hali bemor yo‘q" text="Birinchi bemoringizni qo‘shing. Bemor ma’lumotlari faqat sizga ko‘rinadi." icon={<UserPlus className="size-6" />} />
              ) : patients.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#7b879d]">Hech narsa topilmadi.</p>
              ) : (
                <ul className="divide-y divide-[#eef1f6]" data-testid="patient-list">
                  {patients.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[12px] font-bold text-[#0066FF]">{initials(p.name)}</span>
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { setEditPatient(p); setModal("patient"); }}>
                        <span className="block truncate text-[14px] font-bold text-[#0d1727]">{p.name}</span>
                        <span className="block truncate text-[12px] text-[#7b879d]">
                          Oxirgi: {fmtDate(p.lastVisit)} · Keyingi: {fmtDate(p.nextVisit)}
                        </span>
                      </button>
                      {p.phone ? (
                        <a href={`tel:+${p.phone.replace(/\D/g, "")}`} className="hidden items-center gap-1 text-[13px] font-semibold text-[#0066FF] sm:inline-flex">
                          <Phone className="size-3.5" />
                          {p.phone}
                        </a>
                      ) : null}
                      <StatusPill label={p.status} cls={p.status === "Faol" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"} />
                      <button type="button" disabled={busy} onClick={() => window.confirm(`${p.name} ni o‘chirasizmi? Qabul yozuvlari saqlanadi.`) && void quick("patient_delete", {}, p.id)} className="grid size-9 place-items-center rounded-full text-[#8b93a7] hover:bg-[#f1f3f7]" aria-label="O‘chirish">
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {modal === "clinic" && clinic ? (
        <Sheet title="Klinika sozlamalari" onClose={() => setModal(null)}>
          <ClinicForm clinic={clinic} onSubmit={(d) => op("clinic_save", d)} onDone={() => setModal(null)} />
        </Sheet>
      ) : null}
      {modal === "patient" ? (
        <Sheet title={editPatient ? "Bemorni tahrirlash" : "Bemor qo‘shish"} onClose={() => setModal(null)}>
          <PatientForm patient={editPatient} onSubmit={(d) => op("patient_save", d, editPatient?.id)} onDone={() => setModal(null)} />
        </Sheet>
      ) : null}
      {modal === "visit" ? (
        <Sheet title="Yozuv ochish" onClose={() => setModal(null)}>
          <VisitForm patients={state?.patients ?? []} today={today} onSubmit={(d) => op("visit_save", d)} onDone={() => setModal(null)} />
        </Sheet>
      ) : null}
      {modal === "staff" ? (
        <Sheet title="Xodim qo‘shish" onClose={() => setModal(null)}>
          <StaffForm onSubmit={(d) => op("staff_save", d)} onDone={() => setModal(null)} />
        </Sheet>
      ) : null}
    </div>
  );
}

function Kpi({ icon, tone, label, value }: { icon: ReactNode; tone: string; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
      <span className={cn("grid size-9 place-items-center rounded-xl", tone)}>{icon}</span>
      <p className="mt-2 text-[24px] font-extrabold leading-none text-[#0d1727]">{value}</p>
      <p className="mt-1 text-[12px] text-[#7b879d]">{label}</p>
    </div>
  );
}

function VisitRow({ v, showDate, busy, onStatus, onDelete }: { v: Visit; showDate?: boolean; busy: boolean; onStatus: (s: VisitStatus) => void; onDelete: () => void }) {
  return (
    <li className="flex items-center gap-2.5 rounded-2xl border border-[#eceff5] bg-[#fbfcfd] p-2.5">
      <span className="w-[58px] shrink-0 text-[13px] font-bold text-[#0d1727]">
        {v.time}
        {showDate ? <span className="block text-[10.5px] font-medium text-[#7b879d]">{fmtDate(v.date).slice(0, 5)}</span> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold text-[#0d1727]">{v.name}</span>
        <span className="block truncate text-[12px] text-[#7b879d]">{v.procedure}</span>
      </span>
      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", statusClass[v.status])}>{v.status}</span>
      {v.status === "Kutilyapti" ? (
        <>
          <button type="button" disabled={busy} onClick={() => onStatus("Keldi")} className="h-9 rounded-full bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-700">Keldi</button>
          <button type="button" disabled={busy} onClick={() => onStatus("Bekor")} className="h-9 rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-500">Bekor</button>
        </>
      ) : null}
      <button type="button" disabled={busy} onClick={onDelete} className="grid size-9 place-items-center rounded-full text-[#8b93a7] hover:bg-[#f1f3f7]" aria-label="O‘chirish">
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

export type Submit = (data: Record<string, unknown>) => Promise<{ ok: true } | { ok: false; error: string; errors?: FieldErrors }>;

function useForm(op: string, onSubmit: Submit, onDone: () => void) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent, data: Record<string, unknown>) {
    event.preventDefault();
    if (busy) return;
    const check = validateClinicOp(op, data);
    setErrors(check.errors);
    setFormError("");
    if (Object.keys(check.errors).length) return;
    setBusy(true);
    const res = await onSubmit(check.clean);
    setBusy(false);
    if (!res.ok) {
      if (res.errors) setErrors(res.errors);
      setFormError(res.error);
      return;
    }
    onDone();
  }
  return { errors, formError, busy, submit };
}

function Actions({ busy, label, formError }: { busy: boolean; label: string; formError: string }) {
  return (
    <>
      {formError ? <p role="alert" className="mt-3 text-sm font-medium text-[#dc2626]">{formError}</p> : null}
      <Button type="submit" disabled={busy} className="mt-4 h-12 w-full !rounded-2xl text-[15px] font-semibold">
        {busy ? "Saqlanmoqda…" : label}
      </Button>
    </>
  );
}

export function ClinicForm({ clinic, onSubmit, onDone }: { clinic?: Clinic; onSubmit: Submit; onDone: () => void }) {
  const [f, setF] = useState({ name: clinic?.name ?? "", branch: clinic?.branch ?? "", address: clinic?.address ?? "", openTime: clinic?.openTime ?? "09:00", closeTime: clinic?.closeTime ?? "18:00" });
  const { errors, formError, busy, submit } = useForm("clinic_save", onSubmit, onDone);
  return (
    <form onSubmit={(e) => submit(e, f)} noValidate className="space-y-3">
      <FormField label="Klinika nomi *" error={errors.name}>
        <input className={inputCls} aria-invalid={errors.name ? true : undefined} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Masalan: Smile Dental" />
      </FormField>
      <FormField label="Filial (ixtiyoriy)">
        <input className={inputCls} value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value })} placeholder="Chilonzor filiali" />
      </FormField>
      <FormField label="Manzil (ixtiyoriy)">
        <input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Toshkent, Chilonzor" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Ochilish vaqti" error={errors.openTime}>
          <input className={inputCls} value={f.openTime} onChange={(e) => setF({ ...f, openTime: e.target.value })} placeholder="09:00" inputMode="numeric" />
        </FormField>
        <FormField label="Yopilish vaqti">
          <input className={inputCls} value={f.closeTime} onChange={(e) => setF({ ...f, closeTime: e.target.value })} placeholder="18:00" inputMode="numeric" />
        </FormField>
      </div>
      <Actions busy={busy} label="Saqlash" formError={formError} />
    </form>
  );
}

export function PatientForm({ patient, onSubmit, onDone }: { patient: Patient | null; onSubmit: Submit; onDone: () => void }) {
  const [f, setF] = useState({ name: patient?.name ?? "", phone: patient?.phone ?? "", status: patient?.status ?? "Faol", note: patient?.note ?? "" });
  const { errors, formError, busy, submit } = useForm("patient_save", onSubmit, onDone);
  return (
    <form onSubmit={(e) => submit(e, f)} noValidate className="space-y-3">
      <FormField label="Bemor ismi *" error={errors.name}>
        <input className={inputCls} aria-invalid={errors.name ? true : undefined} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ism familiya" />
      </FormField>
      <FormField label="Telefon (ixtiyoriy)" error={errors.phone}>
        <input className={inputCls} inputMode="tel" aria-invalid={errors.phone ? true : undefined} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="90 123 45 67" />
      </FormField>
      <FormField label="Holat">
        <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as "Faol" | "Noaktiv" })}>
          <option value="Faol">Faol</option>
          <option value="Noaktiv">Noaktiv</option>
        </select>
      </FormField>
      <FormField label="Izoh (ixtiyoriy)">
        <textarea className={textareaCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </FormField>
      <p className="text-[12px] text-[#8b93a7]">Bu ma’lumot faqat sizga ko‘rinadi.</p>
      <Actions busy={busy} label="Saqlash" formError={formError} />
    </form>
  );
}

export function VisitForm({ patients, today, onSubmit, onDone }: { patients: Patient[]; today: string; onSubmit: Submit; onDone: () => void }) {
  const [f, setF] = useState({ patientId: "", name: "", date: today, time: "10:00", procedure: "" });
  const { errors, formError, busy, submit } = useForm("visit_save", onSubmit, onDone);
  return (
    <form onSubmit={(e) => submit(e, f)} noValidate className="space-y-3">
      {patients.length ? (
        <FormField label="Bemor" error={errors.patientId}>
          <select className={inputCls} value={f.patientId} onChange={(e) => setF({ ...f, patientId: e.target.value })}>
            <option value="">— Boshqa (ismini yozing) —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </FormField>
      ) : null}
      {!f.patientId ? (
        <FormField label="Bemor ismi" error={!patients.length ? errors.patientId : undefined}>
          <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ism familiya" />
        </FormField>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Sana *" error={errors.date}>
          <input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </FormField>
        <FormField label="Vaqt *" error={errors.time}>
          <input className={inputCls} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} placeholder="14:30" inputMode="numeric" />
        </FormField>
      </div>
      <FormField label="Muolaja">
        <input className={inputCls} value={f.procedure} onChange={(e) => setF({ ...f, procedure: e.target.value })} placeholder="Ko‘rik" />
      </FormField>
      <Actions busy={busy} label="Yozuvni saqlash" formError={formError} />
    </form>
  );
}

function StaffForm({ onSubmit, onDone }: { onSubmit: Submit; onDone: () => void }) {
  const [f, setF] = useState({ name: "", role: "", onDuty: true });
  const { errors, formError, busy, submit } = useForm("staff_save", onSubmit, onDone);
  return (
    <form onSubmit={(e) => submit(e, f)} noValidate className="space-y-3">
      <FormField label="Ism *" error={errors.name}>
        <input className={inputCls} aria-invalid={errors.name ? true : undefined} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Dr. Ism F." />
      </FormField>
      <FormField label="Lavozim *" error={errors.role}>
        <input className={inputCls} aria-invalid={errors.role ? true : undefined} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="Stomatolog-terapevt" />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-[#4b5568]">
        <input type="checkbox" checked={f.onDuty} onChange={(e) => setF({ ...f, onDuty: e.target.checked })} className="size-4" />
        Hozir navbatchi
      </label>
      <Actions busy={busy} label="Qo‘shish" formError={formError} />
    </form>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Yopish" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#0B1F4D]">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full bg-[#f1f3f7] text-[#4b5568]" aria-label="Yopish">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}


