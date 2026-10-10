"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, CheckCircle2, Clock, ExternalLink, FileText, Globe, Camera as Instagram, Search, Send, X } from "lucide-react";
import { Avatar, Card, Empty, ErrorBox, Loading, PageHead, Pill, adminPost, btn, fmtDate, fmtInt, hashTone, timeAgo, useAdminData, useToast } from "@/components/admin/ui";
import { fmtPhone } from "@/components/admin/users-view";
import { cn } from "@/lib/utils";

type Doc = { path: string; name: string; size: number; type: string };
type App = {
  id: string; status: "pending" | "approved" | "rejected"; ownerName: string; phone: string; shopName: string; city: string | null;
  bio: string | null; telegram: string | null; instagram: string | null; facebook: string | null; website: string | null; address: string | null;
  yearsInBusiness: number | null; stir: string | null; docs: Doc[] | null; rejectReason: string | null; createdAt: string; reviewedAt: string | null;
  storeId: string | null; applicant: { id: string; fullName: string; phone: string | null; provider: string }; duplicate: boolean;
};
type Data = { counts: { pending: number; approved: number; rejected: number }; avgReviewHours: number | null; rows: App[] };
type Tab = "pending" | "approved" | "rejected";

const REASONS = ["Ijtimoiy tarmoq faol emas", "Hujjat yetishmaydi", "Ma’lumot noto‘g‘ri", "Takroriy ariza", "Mahsulot yo‘nalishi mos emas"];

function kb(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}
function handle(v: string | null) {
  return v ? v.replace(/^https?:\/\/(www\.)?(t\.me|instagram\.com|facebook\.com)\//i, "").replace(/^@/, "").replace(/\/$/, "") : "";
}

export function ApplicationsView() {
  const [tab, setTab] = useState<Tab>("pending");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const { data, error, loading, reload } = useAdminData<Data>(`/api/admin/applications?status=${tab}`);
  const [sel, setSel] = useState<string | null>(null);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data?.rows ?? []).filter(
      (r) => (!city || r.city === city) && (!t || [r.shopName, r.ownerName, r.phone, r.stir].some((v) => (v ?? "").toLowerCase().includes(t))),
    );
  }, [data, q, city]);
  const cities = useMemo(() => [...new Set((data?.rows ?? []).map((r) => r.city).filter(Boolean) as string[])], [data]);
  const [now] = useState(() => Date.now());
  const sla = (data?.rows ?? []).filter((r) => r.status === "pending" && now - new Date(r.createdAt).getTime() > 48 * 3600e3).length;
  const current = rows.find((r) => r.id === sel) ?? rows[0] ?? null;

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHead
        title="Sotuvchi arizalari"
        subtitle={`Tasdiqlangan do‘kon marketplace’da sotuv huquqini oladi${data?.avgReviewHours != null ? ` · o‘rtacha ko‘rib chiqish ${fmtInt(data.avgReviewHours)} soat` : ""}`}
        actions={
          <>
            <label className="flex h-9 w-[240px] items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 text-[13px]">
              <Search className="size-4 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Do‘kon, telefon, STIR…" className="min-w-0 flex-1 bg-transparent outline-none" />
            </label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="h-9 rounded-xl border border-[#e2e8f0] bg-white px-2.5 text-[13px]" aria-label="Shahar">
              <option value="">Barcha shaharlar</option>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </>
        }
      />
      <div className="mb-4 flex gap-5 border-b border-[#e2e8f0]">
        {([["pending", "Yangi"], ["approved", "Tasdiqlangan"], ["rejected", "Rad etilgan"]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setTab(id); setSel(null); }} className={cn("-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-[13.5px] font-semibold", tab === id ? "border-primary text-primary" : "border-transparent text-slate-500")}>
            {label}
            <span className={cn("rounded-md px-1.5 text-[11px]", tab === id ? "bg-primary text-white" : "bg-[#f1f5f9] text-slate-500")}>{fmtInt(data?.counts[id] ?? 0)}</span>
          </button>
        ))}
      </div>

      {error ? (
        <ErrorBox text={error} onRetry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Card>
          <Empty icon={<FileText className="size-5" />} title={tab === "pending" ? "Yangi ariza yo‘q" : tab === "approved" ? "Tasdiqlangan ariza yo‘q" : "Rad etilgan ariza yo‘q"}
            hint={tab === "pending" ? "Foydalanuvchilar “Sotuvchi bo‘lish” formasini yuborganda shu yerda navbatga tushadi." : undefined} />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Card className="h-fit p-3">
            <div className="mb-2 flex items-center justify-between px-1 text-[12.5px]">
              <span className="font-semibold">Navbat</span>
              <span className="text-slate-400">{tab === "pending" ? "Eskisi birinchi ↑" : "Yangisi birinchi"}</span>
            </div>
            <ul className="space-y-1">
              {rows.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setSel(r.id)} className={cn("flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left", current?.id === r.id ? "bg-[#eef4ff]" : "hover:bg-slate-50")}>
                    <Avatar name={r.shopName} tone={hashTone(r.id)} className="size-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{r.shopName}</span>
                      <span className="block truncate text-[11.5px] text-slate-400">{[r.city, timeAgo(r.createdAt)].filter(Boolean).join(" · ")}</span>
                    </span>
                    {r.status === "pending" ? <span className="size-2 rounded-full bg-[#f97316]" /> : null}
                  </button>
                </li>
              ))}
            </ul>
            {tab === "pending" && sla > 0 ? (
              <p className="mt-2 rounded-xl bg-[#fff7ed] px-3 py-2 text-[12px] text-[#c2410c]"><b>SLA:</b> 48 soatdan oshgan {sla} ta ariza bor.</p>
            ) : null}
          </Card>
          {current ? <AppCard key={current.id} a={current} onDone={reload} /> : null}
        </div>
      )}
    </div>
  );
}

function AppCard({ a, onDone }: { a: App; onDone: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const docs = a.docs ?? [];
  const stirOk = /^\d{9}$/.test(a.stir ?? "");
  const checks: [boolean, string][] = [
    [Boolean(a.phone), a.phone ? `Telefon ko‘rsatilgan: ${fmtPhone(a.phone)}` : "Telefon ko‘rsatilmagan"],
    [stirOk, a.stir ? (stirOk ? "STIR formati to‘g‘ri (9 raqam)" : "STIR formati noto‘g‘ri") : "STIR ko‘rsatilmagan"],
    [docs.length > 0, docs.length ? `${docs.length} ta hujjat yuklangan` : "Hujjat yuklanmagan"],
    [!a.duplicate, a.duplicate ? "Shu telefon/STIR bilan boshqa ariza bor" : "Takroriy ariza topilmadi"],
    [Boolean(a.telegram || a.instagram || a.facebook || a.website), a.telegram || a.instagram || a.facebook || a.website ? "Ijtimoiy tarmoq / sayt ko‘rsatilgan" : "Ijtimoiy tarmoq ko‘rsatilmagan"],
    [a.applicant.provider !== "phone", a.applicant.provider === "phone" ? "Akkaunt telefon orqali (SMS tasdiqsiz)" : `Akkaunt ${a.applicant.provider === "google" ? "Google" : "Telegram"} orqali tasdiqlangan`],
  ];

  async function review(approve: boolean) {
    setBusy(true);
    const res = await adminPost(`/api/admin/applications/${a.id}`, { approve, reason: approve ? "" : reason });
    setBusy(false);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show(approve ? "Ariza tasdiqlandi — do‘kon faollashdi" : "Ariza rad etildi");
    onDone();
    router.refresh();
  }

  const links = [
    a.telegram && { icon: Send, label: `Telegram: @${handle(a.telegram)}`, href: `https://t.me/${handle(a.telegram)}` },
    a.instagram && { icon: Instagram, label: `Instagram: @${handle(a.instagram)}`, href: `https://instagram.com/${handle(a.instagram)}` },
    a.facebook && { icon: Globe, label: `Facebook: ${handle(a.facebook)}`, href: `https://facebook.com/${handle(a.facebook)}` },
    a.website && { icon: Globe, label: `Sayt: ${a.website.replace(/^https?:\/\//, "")}`, href: /^https?:\/\//.test(a.website) ? a.website : `https://${a.website}` },
  ].filter(Boolean) as { icon: typeof Send; label: string; href: string }[];

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Avatar name={a.shopName} tone={hashTone(a.id)} className="size-12 text-[15px]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-[19px] font-bold">{a.shopName}</p>
            {a.status === "pending" ? <Pill tone="orange"><Clock className="size-3" /> Yangi</Pill> : a.status === "approved" ? <Pill tone="green">Tasdiqlangan</Pill> : <Pill tone="red">Rad etilgan</Pill>}
            <span className="text-[12px] text-slate-400">{timeAgo(a.createdAt)}</span>
          </div>
          <p className="text-[12.5px] text-slate-500">
            {[a.ownerName, fmtPhone(a.phone), a.city, a.yearsInBusiness ? `${a.yearsInBusiness} yil tajriba` : null].filter(Boolean).join(" · ")}
          </p>
          <p className="text-[12px] text-slate-400">Akkaunt: {a.applicant.fullName}{a.address ? ` · Manzil: ${a.address}` : ""}</p>
        </div>
      </div>
      {a.bio ? <p className="mt-3 whitespace-pre-line text-[13.5px] text-slate-700">{a.bio}</p> : null}
      {links.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe7ff] bg-[#f5f9ff] px-2.5 py-1 text-[12px] font-semibold text-primary">
              <l.icon className="size-3.5" /> {l.label} <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-[#eceff5] p-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#f1f5f9] text-slate-500"><FileText className="size-4" /></span>
          <span className="min-w-0 flex-1 text-[12.5px]"><span className="block font-semibold">STIR: {a.stir || "kiritilmagan"}</span><span className="text-slate-400">{stirOk ? "format to‘g‘ri" : "—"}</span></span>
          {stirOk ? <CheckCircle2 className="size-4 text-[#16a34a]" /> : <AlertCircle className="size-4 text-[#f97316]" />}
        </div>
        {docs.map((d) => (
          <a key={d.path} href={`/api/admin/applications/${a.id}/doc?path=${encodeURIComponent(d.path)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border border-[#eceff5] p-2.5 hover:bg-slate-50">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#f1f5f9] text-slate-500"><FileText className="size-4" /></span>
            <span className="min-w-0 flex-1 text-[12.5px]"><span className="block truncate font-semibold">{d.name}</span><span className="text-slate-400">{kb(d.size)}</span></span>
            <ExternalLink className="size-4 text-slate-400" />
          </a>
        ))}
        {docs.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-[#e2e8f0] p-2.5 text-[12.5px] text-slate-400">Hujjat yuklanmagan (ixtiyoriy)</div>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl bg-[#f8fafc] p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avto-tekshiruv</p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {checks.map(([ok, text]) => (
            <span key={text} className={cn("flex items-center gap-1.5 text-[12.5px]", ok ? "text-slate-600" : "text-[#c2410c]")}>
              {ok ? <CheckCircle2 className="size-4 text-[#16a34a]" /> : <AlertCircle className="size-4" />} {text}
            </span>
          ))}
        </div>
      </div>

      {a.status === "pending" ? (
        rejecting ? (
          <div className="mt-3 rounded-xl border border-[#fecaca] bg-[#fff8f8] p-3">
            <p className="mb-2 text-[12.5px] font-semibold text-[#b91c1c]">Rad etish sababi</p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setReason((v) => (v.includes(r) ? v : v ? `${v}. ${r}` : r))} className="rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-600 hover:border-[#fecaca]">
                  {r}
                </button>
              ))}
            </div>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} placeholder="Sotuvchiga nima tuzatish kerakligini yozing…" className="w-full rounded-lg border border-[#e2e8f0] bg-white p-2.5 text-[13px] outline-none" />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11.5px] text-slate-400">Sabab sotuvchi kabinetida ko‘rinadi, u qayta ariza yuborishi mumkin.</span>
              <span className="flex gap-2">
                <button type="button" className={btn.outline} onClick={() => setRejecting(false)}>Bekor</button>
                <button type="button" className={btn.dangerSolid} disabled={busy || !reason.trim()} onClick={() => review(false)}>Rad etishni yuborish</button>
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <button type="button" className={cn(btn.primary, "h-10 flex-1")} disabled={busy} onClick={() => review(true)}><Check className="size-4" /> Tasdiqlash</button>
            <button type="button" className={cn(btn.outline, "h-10 flex-1")} onClick={() => setRejecting(true)}><X className="size-4" /> Rad etish</button>
          </div>
        )
      ) : (
        <div className="mt-3 rounded-xl border border-[#eceff5] p-3 text-[12.5px] text-slate-600">
          {a.status === "approved" ? "Tasdiqlangan" : "Rad etilgan"}: {fmtDate(a.reviewedAt, true)}
          {a.rejectReason ? <span className="block text-[#b91c1c]">Sabab: {a.rejectReason}</span> : null}
        </div>
      )}
      {toast.node}
    </Card>
  );
}
