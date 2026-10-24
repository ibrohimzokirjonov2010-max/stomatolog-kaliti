"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

export type OrgApplication = { status: "pending" | "approved" | "rejected"; orgName: string; phone: string; city: string | null; bio: string | null; telegram: string | null; rejectReason: string | null };

const input = "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15";

/** Seminar-organizer application (admin approves). Shown to signed-in users who cannot create seminars yet. */
export function OrganizerGate({ application, onDone }: { application: OrgApplication | null; onDone: () => void }) {
  const [reapply, setReapply] = useState(false);
  const [f, setF] = useState({ orgName: application?.orgName ?? "", phone: application?.phone ? `+998 ${application.phone}` : "", city: application?.city ?? "", telegram: application?.telegram ?? "", bio: application?.bio ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (application?.status === "pending" && !reapply) {
    return (
      <section className="rounded-[16px] border border-[#fde68a] bg-[#fffbeb] p-5" data-testid="org-pending">
        <p className="text-[15px] font-bold text-[#92400e]">Arizangiz ko‘rib chiqilmoqda</p>
        <p className="mt-1 text-[13px] text-[#92400e]/80">Administrator tasdiqlagach, bildirishnoma keladi va seminar yaratish ochiladi. Ariza: {application.orgName}.</p>
      </section>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (f.orgName.trim().length < 2) found.orgName = "Tashkilot yoki ismingizni kiriting.";
    if (f.phone.replace(/\D/g, "").length < 9) found.phone = "Telefon raqamini to‘liq kiriting (kamida 9 raqam).";
    if (f.bio.trim() && f.bio.trim().length < 10) found.bio = "Qisqa tavsif kamida 10 ta belgi bo‘lsin yoki bo‘sh qoldiring.";
    setErrors(found);
    setError("");
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/seminars/organizer-application", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: Record<string, string>; error?: string };
      if (j.ok) {
        setReapply(false);
        onDone();
      } else {
        if (j.errors) setErrors(j.errors);
        setError(j.error ?? "Yuborib bo‘lmadi.");
      }
    } catch {
      setError("Aloqa xatosi. Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) => (errors[k] ? <p role="alert" className="mt-1 text-[12.5px] font-medium text-[#dc2626]">{errors[k]}</p> : null);
  return (
    <section className="rounded-[16px] border border-[#eceff5] bg-white p-4 sm:p-6" data-testid="org-apply">
      <h2 className="text-[17px] font-bold text-[#1a1d26]">Tashkilotchi bo‘lish</h2>
      <p className="mt-1 text-[13px] text-[#8b93a7]">Seminar yaratish uchun ariza qoldiring — administrator tasdiqlaydi.</p>
      {application?.status === "rejected" ? (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-800">Oldingi ariza rad etilgan{application.rejectReason ? `: ${application.rejectReason}` : "."} Tuzatib qayta yuborishingiz mumkin.</p>
      ) : null}
      <form onSubmit={submit} noValidate className="mt-4 space-y-3.5">
        <div>
          <label htmlFor="orgName" className="mb-1.5 block text-[13px] font-semibold">Tashkilot / ism</label>
          <input id="orgName" value={f.orgName} onChange={(e) => setF({ ...f, orgName: e.target.value })} maxLength={120} placeholder="Masalan: DentaLab o‘quv markazi" className={cn(input, errors.orgName ? "border-[#dc2626]" : "border-[#e1e6ef]")} />
          {err("orgName")}
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="orgPhone" className="mb-1.5 block text-[13px] font-semibold">Telefon</label>
            <input id="orgPhone" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+998 90 123 45 67" className={cn(input, errors.phone ? "border-[#dc2626]" : "border-[#e1e6ef]")} />
            {err("phone")}
          </div>
          <div>
            <label htmlFor="orgCity" className="mb-1.5 block text-[13px] font-semibold">Shahar <span className="font-normal text-[#8b93a7]">(ixtiyoriy)</span></label>
            <input id="orgCity" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} maxLength={80} className={cn(input, "border-[#e1e6ef]")} />
          </div>
        </div>
        <div>
          <label htmlFor="orgBio" className="mb-1.5 block text-[13px] font-semibold">Qisqacha o‘zingiz haqingizda <span className="font-normal text-[#8b93a7]">(ixtiyoriy)</span></label>
          <textarea id="orgBio" rows={3} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} maxLength={1000} className={cn(input, "h-auto py-3", errors.bio ? "border-[#dc2626]" : "border-[#e1e6ef]")} />
          {err("bio")}
        </div>
        {error ? <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-800">{error}</p> : null}
        <button type="submit" disabled={busy} className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0F766E] px-6 text-[14px] font-semibold text-white shadow-[0_6px_14px_rgba(15, 118, 110, 0.28)] disabled:opacity-60 sm:w-auto" data-testid="org-submit">
          {busy ? "Yuborilmoqda…" : "Ariza yuborish"}
        </button>
      </form>
    </section>
  );
}
