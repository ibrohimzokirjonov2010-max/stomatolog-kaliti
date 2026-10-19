"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, GraduationCap, UserCog, X } from "lucide-react";
import { Card, Empty, ErrorBox, Loading, PageHead, Pill, adminPost, btn, fmtDate, useAdminData, useToast, type Tone } from "@/components/admin/ui";
import { SEMINAR_STATUS_LABEL, type SeminarRow } from "@/lib/seminar-remote";
import { cn } from "@/lib/utils";

type App = { id: string; applicantName: string | null; orgName: string; phone: string; city: string | null; bio: string | null; telegram: string | null; status: "pending" | "approved" | "rejected"; rejectReason: string | null; createdAt: string };
type Data = { applications: App[]; seminars: (SeminarRow & { organizerName: string | null })[]; organizers: { seminarId: string; organizerName: string | null }[] };

const statusTone: Record<string, Tone> = { pending: "orange", approved: "green", published: "green", rejected: "red", closed: "gray" };

/** Inline "reject with a reason" control shared by applications and seminars. */
function ReviewActions({ onApprove, onReject, approveLabel, busy }: { onApprove?: () => void; onReject: (reason: string) => void; approveLabel: string; busy: boolean }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  if (rejecting) {
    return (
      <div className="mt-2 space-y-2">
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={2} placeholder="Rad etish sababini yozing…" className="w-full rounded-lg border border-[#e2e8f0] bg-white p-2.5 text-[13px] outline-none" aria-label="Rad etish sababi" />
        <div className="flex gap-2">
          <button type="button" className={btn.outline} onClick={() => setRejecting(false)}>Bekor</button>
          <button type="button" className={btn.dangerSolid} disabled={busy || reason.trim().length < 3} onClick={() => onReject(reason.trim())}>Rad etishni yuborish</button>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {onApprove ? <button type="button" className={btn.primary} disabled={busy} onClick={onApprove}><Check className="size-4" /> {approveLabel}</button> : null}
      <button type="button" className={btn.danger} disabled={busy} onClick={() => setRejecting(true)}><X className="size-4" /> Rad etish</button>
    </div>
  );
}

export function SeminarsView() {
  const { data, error, loading, reload } = useAdminData<Data>("/api/admin/seminars");
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [assign, setAssign] = useState({ seminarId: "", phone: "" });

  async function review(action: "review_application" | "review_seminar", id: string, approve: boolean, reason: string, okText: string) {
    setBusy(id);
    const res = await adminPost("/api/admin/seminars", { action, id, approve, reason });
    setBusy(null);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show(okText);
    void reload();
  }

  async function doAssign() {
    if (!assign.seminarId) return toast.show("Seminarni tanlang.", "err");
    if (assign.phone.trim() && assign.phone.replace(/\D/g, "").length < 9) return toast.show("Telefon raqamini to‘liq kiriting.", "err");
    setBusy("assign");
    const res = await adminPost("/api/admin/seminar-organizer", assign);
    setBusy(null);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show(assign.phone.trim() ? "Tashkilotchi tayinlandi" : "Tashkilotchi olib tashlandi");
    setAssign({ ...assign, phone: "" });
    void reload();
  }

  const pendingApps = data?.applications.filter((a) => a.status === "pending").length ?? 0;
  const pendingSems = data?.seminars.filter((s) => s.status === "pending").length ?? 0;
  const organizerOf = (id: string) => data?.organizers.find((o) => o.seminarId === id)?.organizerName;

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHead title="Seminarlar" subtitle="Tashkilotchi arizalari, seminarlarni tasdiqlash va tashkilotchi tayinlash" />
      {error ? <ErrorBox text={error} onRetry={reload} /> : !data ? <Loading /> : (
        <div className="space-y-4" style={{ opacity: loading ? 0.7 : 1 }}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden" >
              <p className="flex items-center gap-2 p-4 pb-2 font-heading text-[16px] font-bold">Tashkilotchi arizalari {pendingApps ? <Pill tone="orange">{pendingApps} yangi</Pill> : null}</p>
              {data.applications.length === 0 ? <Empty icon={<UserCog className="size-5" />} title="Arizalar yo‘q" /> : (
                <ul className="divide-y divide-[#f1f5f9]" data-testid="org-apps">
                  {data.applications.map((a) => (
                    <li key={a.id} className="px-4 py-3 text-[13px]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">{a.orgName}</p>
                          <p className="text-[12px] text-slate-500">{a.applicantName ?? "—"} · +998 {a.phone}{a.city ? ` · ${a.city}` : ""} · {fmtDate(a.createdAt, true)}</p>
                          {a.bio ? <p className="mt-1 text-slate-600">{a.bio}</p> : null}
                          {a.rejectReason ? <p className="mt-1 text-[#b91c1c]">Sabab: {a.rejectReason}</p> : null}
                        </div>
                        <Pill tone={statusTone[a.status]}>{a.status === "pending" ? "Yangi" : a.status === "approved" ? "Tasdiqlangan" : "Rad etilgan"}</Pill>
                      </div>
                      {a.status !== "approved" ? (
                        <ReviewActions busy={busy === a.id} approveLabel="Tasdiqlash" onApprove={() => review("review_application", a.id, true, "", "Tashkilotchi tasdiqlandi")} onReject={(r) => review("review_application", a.id, false, r, "Ariza rad etildi")} />
                      ) : (
                        <ReviewActions busy={busy === a.id} approveLabel="" onReject={(r) => review("review_application", a.id, false, r, "Tashkilotchilik bekor qilindi")} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <p className="font-heading text-[16px] font-bold">Tashkilotchi tayinlash</p>
              <p className="mt-1 text-[12.5px] text-slate-500">Seminarga tashkilotchini telefon raqami bo‘yicha biriktiring (u ro‘yxatdan o‘tgan bo‘lishi kerak). Bo‘sh qoldirsangiz tashkilotchi olib tashlanadi.</p>
              <div className="mt-3 space-y-2">
                <select value={assign.seminarId} onChange={(e) => setAssign({ ...assign, seminarId: e.target.value })} className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-[13px]" aria-label="Seminar">
                  <option value="">Seminarni tanlang…</option>
                  {data.seminars.length ? (
                    <optgroup label="Tashkilotchilar seminarlari">
                      {data.seminars.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </optgroup>
                  ) : null}
                </select>
                <input value={assign.phone} onChange={(e) => setAssign({ ...assign, phone: e.target.value })} inputMode="tel" placeholder="+998 90 123 45 67" className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-[13px]" aria-label="Tashkilotchi telefoni" />
                <button type="button" className={btn.primary} disabled={busy === "assign"} onClick={doAssign}>Saqlash</button>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <p className="flex items-center gap-2 p-4 pb-2 font-heading text-[16px] font-bold">Tashkilotchilar seminarlari {pendingSems ? <Pill tone="orange">{pendingSems} tasdiq kutmoqda</Pill> : null}</p>
            {data.seminars.length === 0 ? <Empty icon={<GraduationCap className="size-5" />} title="Hali seminar yaratilmagan" /> : (
              <ul className="divide-y divide-[#f1f5f9]" data-testid="admin-seminars">
                {data.seminars.map((s) => (
                  <li key={s.id} className="px-4 py-3 text-[13px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{s.title}</p>
                        <p className="text-[12px] text-slate-500">
                          {s.organizerName ?? "—"} · {s.date ? fmtDate(s.date) : "—"} {s.time} · {s.city} · {s.price > 0 ? `${s.price.toLocaleString("ru-RU")} so‘m` : "Bepul"} · {s.registered}/{s.seats} yozilgan
                        </p>
                        {s.rejectReason ? <p className="mt-1 text-[#b91c1c]">Sabab: {s.rejectReason}</p> : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Pill tone={statusTone[s.status]}>{SEMINAR_STATUS_LABEL[s.status]}</Pill>
                        <Link href={`/seminarlar/${s.id}`} target="_blank" className={cn("inline-flex items-center gap-1 text-[12px] font-semibold text-primary")}>Ko‘rish <ExternalLink className="size-3.5" /></Link>
                      </div>
                    </div>
                    {s.status === "pending" || s.status === "rejected" ? (
                      <ReviewActions busy={busy === s.id} approveLabel="E’lon qilish" onApprove={() => review("review_seminar", s.id, true, "", "Seminar e’lon qilindi")} onReject={(r) => review("review_seminar", s.id, false, r, "Seminar rad etildi")} />
                    ) : (
                      <ReviewActions busy={busy === s.id} approveLabel="" onReject={(r) => review("review_seminar", s.id, false, r, "Seminar yashirildi (rad etildi)")} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
      {toast.node}
    </div>
  );
}
