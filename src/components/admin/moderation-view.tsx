"use client";

import { useState } from "react";
import { Check, EyeOff, ListChecks, X } from "lucide-react";
import { Card, Empty, ErrorBox, Loading, PageHead, Pill, adminPost, btn, fmtDate, useAdminData, useToast, type Tone } from "@/components/admin/ui";

type Item = {
  kind: "master" | "lab" | "job" | "surplus";
  id: string;
  title: string;
  sub: string;
  status: "pending" | "published" | "rejected" | "hidden" | "closed";
  rejectReason: string | null;
  ownerName: string | null;
  phone: string | null;
  detail: string;
  createdAt: string;
};

const KIND: Record<Item["kind"], string> = { master: "Usta", lab: "Laboratoriya", job: "Vakansiya", surplus: "Ortiqcha material" };
const STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Tasdiq kutmoqda", tone: "orange" },
  published: { label: "E’londa", tone: "green" },
  rejected: { label: "Rad etilgan", tone: "red" },
  hidden: { label: "Yashirilgan", tone: "gray" },
  closed: { label: "Yopilgan", tone: "gray" },
};
const FILTERS: { id: "all" | Item["kind"]; label: string }[] = [
  { id: "all", label: "Hammasi" },
  { id: "master", label: "Ustalar" },
  { id: "lab", label: "Laboratoriyalar" },
  { id: "job", label: "Vakansiyalar" },
  { id: "surplus", label: "Ortiqcha material" },
];

export function ModerationView() {
  const { data, error, loading, reload } = useAdminData<Item[]>("/api/admin/moderatsiya");
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Item["kind"]>("all");
  const [reject, setReject] = useState<{ key: string; action: "reject" | "hide"; reason: string } | null>(null);

  async function act(item: Item, action: "approve" | "reject" | "hide", reason = "") {
    setBusy(item.id);
    const res = await adminPost("/api/admin/moderatsiya", { kind: item.kind, id: item.id, action, reason });
    setBusy(null);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show(action === "approve" ? "E’lon qilindi" : action === "reject" ? "Rad etildi" : "Yashirildi");
    setReject(null);
    void reload();
  }

  const list = (data ?? []).filter((i) => filter === "all" || i.kind === filter);
  const pending = (data ?? []).filter((i) => i.status === "pending").length;

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHead title="Moderatsiya" subtitle="Foydalanuvchilar yaratgan usta, laboratoriya, vakansiya va material e’lonlarini tasdiqlash" />
      {error ? <ErrorBox text={error} onRetry={reload} /> : !data ? <Loading /> : (
        <div className="space-y-3" style={{ opacity: loading ? 0.7 : 1 }}>
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Turi">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
                className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${filter === f.id ? "bg-primary text-white" : "bg-white text-slate-600 ring-1 ring-[#e2e8f0]"}`}>
                {f.label}
              </button>
            ))}
            {pending ? <Pill tone="orange">{pending} ta tasdiq kutmoqda</Pill> : null}
          </div>
          <Card className="overflow-hidden">
            {list.length === 0 ? <Empty icon={<ListChecks className="size-5" />} title="Hali e’lon yo‘q" hint="Foydalanuvchilar profil yoki e’lon yaratganda shu yerda ko‘rinadi." /> : (
              <ul className="divide-y divide-[#f1f5f9]" data-testid="mod-list">
                {list.map((i) => {
                  const key = `${i.kind}-${i.id}`;
                  const st = STATUS[i.status] ?? STATUS.pending;
                  return (
                    <li key={key} className="px-4 py-3 text-[13px]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">{i.title} <span className="ml-1 text-[11.5px] font-medium text-slate-400">{KIND[i.kind]}</span></p>
                          <p className="text-[12px] text-slate-500">{i.sub} · {i.ownerName ?? "—"}{i.phone ? ` · ${i.phone}` : ""} · {fmtDate(i.createdAt, true)}</p>
                          {i.detail ? <p className="mt-1 line-clamp-3 text-slate-600">{i.detail}</p> : null}
                          {i.rejectReason ? <p className="mt-1 text-[#b91c1c]">Sabab: {i.rejectReason}</p> : null}
                        </div>
                        <Pill tone={st.tone}>{st.label}</Pill>
                      </div>
                      {reject?.key === key ? (
                        <div className="mt-2 space-y-2">
                          <textarea value={reject.reason} onChange={(e) => setReject({ ...reject, reason: e.target.value })} maxLength={300} rows={2} placeholder="Sababini yozing…" aria-label="Sabab" className="w-full rounded-lg border border-[#e2e8f0] bg-white p-2.5 text-[13px] outline-none" />
                          <div className="flex gap-2">
                            <button type="button" className={btn.outline} onClick={() => setReject(null)}>Bekor</button>
                            <button type="button" className={btn.dangerSolid} disabled={busy === i.id || reject.reason.trim().length < 3} onClick={() => act(i, reject.action, reject.reason.trim())}>Yuborish</button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {i.status !== "published" ? <button type="button" className={btn.primary} disabled={busy === i.id} onClick={() => act(i, "approve")}><Check className="size-4" /> Tasdiqlash</button> : null}
                          {i.status === "pending" ? <button type="button" className={btn.danger} disabled={busy === i.id} onClick={() => setReject({ key, action: "reject", reason: "" })}><X className="size-4" /> Rad etish</button> : null}
                          {i.status === "published" ? <button type="button" className={btn.danger} disabled={busy === i.id} onClick={() => setReject({ key, action: "hide", reason: "" })}><EyeOff className="size-4" /> Yashirish</button> : null}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
      {toast.node}
    </div>
  );
}
