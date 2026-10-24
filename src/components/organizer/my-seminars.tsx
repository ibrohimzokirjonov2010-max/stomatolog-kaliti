"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { formatUzDate } from "@/lib/format";
import { SEMINAR_STATUS_LABEL, seminarRowPriceText, type SeminarRow } from "@/lib/seminar-remote";
import { cn } from "@/lib/utils";

const tone: Record<SeminarRow["status"], string> = {
  pending: "bg-amber-50 text-amber-800",
  published: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-800",
  closed: "bg-slate-100 text-slate-600",
  deleted: "bg-slate-100 text-slate-600",
};

/** Organizer's own seminars with edit / close / delete. Delete cancels active registrations and notifies registrants. */
export function MySeminars({ seminars, onChanged }: { seminars: SeminarRow[]; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function act(id: string, action: "close" | "reopen" | "delete") {
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/seminars/mine/${id}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!j.ok) setError(j.error ?? "Amalni bajarib bo‘lmadi.");
      setConfirmDel(null);
      onChanged();
    } catch {
      setError("Aloqa xatosi. Qayta urinib ko‘ring.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mb-5" data-testid="my-seminars">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-[#1a1d26]">Mening seminarlarim</h2>
        <Link href="/seminarlar/yozuvlarim/tashkilotchi/yangi" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 text-[13.5px] font-semibold text-white shadow-[0_6px_14px_rgba(15, 118, 110, 0.28)]" data-testid="new-seminar">
          <Plus className="size-4" /> Yangi seminar
        </Link>
      </div>
      {error ? <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-800">{error}</p> : null}
      {seminars.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[#CCFBF1] bg-[#f8faff] px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-[#1a1d26]">Hali seminar yaratmagansiz</p>
          <p className="mt-1 text-sm text-[#8b93a7]">“Yangi seminar” tugmasi orqali birinchi seminaringizni qo‘shing.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {seminars.map((s) => {
            const date = s.date ? formatUzDate(s.date) : null;
            return (
              <li key={s.id} className="rounded-[16px] border border-[#eceff5] bg-white p-4" data-testid="my-seminar">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-[#1a1d26]">{s.title}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#8b93a7]">
                      {date ? (
                        <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{date.when}, {s.time}</span>
                      ) : null}
                      <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{s.city}</span>
                    </p>
                    <p className="mt-1 text-[12.5px] text-[#4b5568]">
                      Yozilgan: <b>{s.registered}</b> / {s.seats} · Narx: <b>{seminarRowPriceText(s.price)}</b>
                    </p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", tone[s.status])}>{SEMINAR_STATUS_LABEL[s.status]}</span>
                </div>
                {s.status === "rejected" && s.rejectReason ? <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-800">Sabab: {s.rejectReason}</p> : null}
                {s.status === "pending" ? <p className="mt-2 text-[12.5px] text-amber-800">Administrator tasdiqlashini kutmoqda — hozircha hamma ko‘rmaydi.</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] font-semibold">
                  {s.status === "published" || s.status === "closed" ? (
                    <Link href={`/seminarlar/${s.id}`} className="rounded-lg border border-[#e1e6ef] px-3 py-1.5 text-[#111827]">Ko‘rish</Link>
                  ) : null}
                  <Link href={`/seminarlar/yozuvlarim/tashkilotchi/${s.id}`} className="inline-flex items-center gap-1 rounded-lg border border-[#e1e6ef] px-3 py-1.5 text-[#111827]" data-testid="edit-seminar">
                    <Pencil className="size-3.5" /> Tahrirlash
                  </Link>
                  {s.status === "published" ? (
                    <button type="button" disabled={busy === s.id} onClick={() => void act(s.id, "close")} className="rounded-lg border border-[#e1e6ef] px-3 py-1.5 text-[#111827]" data-testid="close-seminar">Yozilishni yopish</button>
                  ) : null}
                  {s.status === "closed" ? (
                    <button type="button" disabled={busy === s.id} onClick={() => void act(s.id, "reopen")} className="rounded-lg border border-[#e1e6ef] px-3 py-1.5 text-[#111827]">Qayta ochish</button>
                  ) : null}
                  {confirmDel === s.id ? (
                    <span className="inline-flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-red-800">
                      {s.registered > 0 ? `${s.registered} ta yozilgan doktorga bildirishnoma ketadi. ` : ""}O‘chiraymi?
                      <button type="button" disabled={busy === s.id} onClick={() => void act(s.id, "delete")} className="font-bold underline" data-testid="confirm-delete">Ha, o‘chirish</button>
                      <button type="button" onClick={() => setConfirmDel(null)} className="font-medium">Yo‘q</button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirmDel(s.id)} className="ml-auto inline-flex items-center gap-1 px-2 py-1.5 text-[#dc2626]" data-testid="delete-seminar">
                      <Trash2 className="size-3.5" /> O‘chirish
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
