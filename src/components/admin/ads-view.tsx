"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, Home, ImagePlus, Link2, Megaphone, MessagesSquare, Pause, Pencil, Play, Presentation, Rocket, ShoppingBag, Archive, Trash2 } from "lucide-react";
import { Card, Empty, ErrorBox, Loading, PageHead, Pill, Segmented, adminPost, btn, fmtDate, fmtInt, moneyParts, moneyShort, useAdminData, useToast, type Tone } from "@/components/admin/ui";
import { prepareImage, uploadWithTicket } from "@/lib/image-upload";
import { cn } from "@/lib/utils";

type Placement = "home" | "marketplace" | "seminar" | "community";
type Ad = {
  id: string; advertiser: string; title: string; imageUrl: string; placements: Placement[]; startsOn: string; endsOn: string;
  pricing: "monthly" | "total"; price: number; linkUrl: string | null; status: "draft" | "active" | "paused" | "archived" | "ended" | "scheduled";
  createdAt: string; views: number; clicks: number; revenue: number;
};
type Data = { rows: Ad[]; revenue30: number; channels30: number; views30: number; clicks30: number };
type ChannelsData = { bids: { id: number; username: string; amount: number; status: string; createdAt: string; bidder: string | null }[]; mrr: number };

const PLACEMENTS: { id: Placement; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Bosh sahifa", icon: Home },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag },
  { id: "seminar", label: "Seminar", icon: Presentation },
  { id: "community", label: "Community", icon: MessagesSquare },
];
const PL_LABEL: Record<Placement, string> = { home: "Bosh sahifa", marketplace: "Marketplace", seminar: "Seminar", community: "Community" };
const STATUS: Record<Ad["status"], [string, Tone]> = {
  active: ["Faol", "green"], scheduled: ["Rejalashtirilgan", "blue"], paused: ["To‘xtatilgan", "orange"], draft: ["Qoralama", "gray"],
  archived: ["Arxiv", "gray"], ended: ["Tugagan", "gray"],
};

type Form = { id?: string; advertiser: string; title: string; imageUrl: string; placements: Placement[]; startsOn: string; endsOn: string; pricing: "monthly" | "total"; price: string; linkUrl: string };

function today(offset = 0) {
  const d = new Date(Date.now() + offset * 86400e3);
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tashkent" });
}
const EMPTY = (): Form => ({ advertiser: "", title: "", imageUrl: "", placements: ["home"], startsOn: today(), endsOn: today(30), pricing: "monthly", price: "", linkUrl: "" });

function Kpi({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-[12px] text-slate-500">{label}</div>
      <span className="font-heading text-[22px] font-bold">{value}</span>
      {unit ? <span className="ml-1 text-[12px] text-slate-400">{unit}</span> : null}
      {sub ? <span className="ml-1 text-[12px] text-slate-400">{sub}</span> : null}
    </Card>
  );
}

export function AdsView() {
  const { data, error, loading, reload } = useAdminData<Data>("/api/admin/ads");
  const ch = useAdminData<ChannelsData>("/api/admin/channels");
  const [tab, setTab] = useState<"live" | "all" | "archived">("live");
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileMeta, setFileMeta] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const rows = useMemo(() => (data?.rows ?? []).filter((a) =>
    tab === "all" ? true : tab === "archived" ? a.status === "archived" || a.status === "ended" : ["active", "scheduled", "paused", "draft"].includes(a.status)), [data, tab]);
  const liveCount = (data?.rows ?? []).filter((a) => a.status === "active").length;
  const ctr = data && data.views30 ? (data.clicks30 / data.views30) * 100 : 0;

  const days = Math.max(1, Math.round((new Date(form.endsOn).getTime() - new Date(form.startsOn).getTime()) / 86400e3) + 1);
  const priceNum = Number(form.price.replace(/\s/g, "")) || 0;
  const total = form.pricing === "monthly" ? Math.round((priceNum / 30) * days) : priceNum;

  async function onFile(f: File | undefined) {
    if (!f) return;
    setUploading(true);
    try {
      const img = await prepareImage(f, 1600, 0.86);
      const url = await uploadWithTicket("/api/admin/ads/upload", {}, img.blob);
      setForm((v) => ({ ...v, imageUrl: url }));
      setFileMeta(`${img.width}×${img.height} · ${Math.round(img.blob.size / 1024)} KB`);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Yuklab bo‘lmadi", "err");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(status: "active" | "draft") {
    setBusy(true);
    const res = await adminPost("/api/admin/ads", { ...form, price: priceNum, status });
    setBusy(false);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show(form.id ? "Reklama saqlandi" : status === "active" ? "Reklama ishga tushirildi" : "Qoralama saqlandi");
    setForm(EMPTY());
    setFileMeta("");
    void reload();
  }

  async function setStatus(a: Ad, status: "active" | "paused" | "archived") {
    const res = await adminPost("/api/admin/ads", { id: a.id, status });
    if (!res.ok) return toast.show(res.error, "err");
    toast.show(status === "paused" ? "To‘xtatildi" : status === "archived" ? "Arxivlandi" : "Faollashtirildi");
    void reload();
  }
  async function del(a: Ad) {
    const res = await adminPost(`/api/admin/ads/${a.id}`, {}, "DELETE");
    setConfirmDel(null);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show("Reklama o‘chirildi");
    void reload();
  }
  function edit(a: Ad) {
    setForm({ id: a.id, advertiser: a.advertiser, title: a.title, imageUrl: a.imageUrl, placements: a.placements, startsOn: a.startsOn, endsOn: a.endsOn, pricing: a.pricing, price: String(a.price), linkUrl: a.linkUrl ?? "" });
    setFileMeta("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const input = "h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-[13px] outline-none focus:border-primary";
  const topBids = (ch.data?.bids ?? []).filter((b) => b.status === "active").sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHead title="Reklama" subtitle="Bannerlar, joylashuvlar va Foydali kanallar auksioni daromadi" />
      {error ? <ErrorBox text={error} onRetry={reload} /> : !data ? <Loading /> : (
        <div className={cn("space-y-4", loading && "opacity-70")}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi label="Reklama daromadi · 30 kun" value={moneyParts(data.revenue30).value} unit={moneyParts(data.revenue30).unit} />
            <Kpi label="Faol reklamalar" value={fmtInt(liveCount)} sub={`/ ${fmtInt(data.rows.length)}`} />
            <Kpi label="Ko‘rishlar · 30 kun" value={fmtInt(data.views30)} />
            <Kpi label="O‘rtacha CTR" value={ctr.toFixed(2)} unit="%" />
            <Kpi label="Kanal auksion · 30 kun" value={moneyParts(data.channels30).value} unit={moneyParts(data.channels30).unit} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
            <Card className="h-fit p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-heading text-[16px] font-bold">{form.id ? "Reklamani tahrirlash" : "Yangi reklama"}</p>
                {form.id ? <button type="button" className="text-[12.5px] font-semibold text-primary" onClick={() => { setForm(EMPTY()); setFileMeta(""); }}>+ Yangi</button> : null}
              </div>
              <div className="space-y-3.5 text-[12.5px]">
                <label className="block"><span className="mb-1 block font-semibold text-slate-600">Reklama beruvchi</span>
                  <input className={input} value={form.advertiser} onChange={(e) => setForm({ ...form, advertiser: e.target.value })} placeholder="Masalan: 3M O‘zbekiston" maxLength={160} /></label>
                <label className="block"><span className="mb-1 block font-semibold text-slate-600">Sarlavha (ixtiyoriy)</span>
                  <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Filtek Universal — 15% chegirma" maxLength={160} /></label>
                <div>
                  <span className="mb-1 block font-semibold text-slate-600">Banner rasm</span>
                  <div className="rounded-xl border border-dashed border-[#bfd4ff] bg-[#f7faff] p-3">
                    {form.imageUrl ? (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.imageUrl} alt="" className="h-16 w-32 rounded-lg object-cover" />
                        <div className="min-w-0 text-[12px]">
                          <p className="truncate font-semibold">{form.imageUrl.split("/").pop()}</p>
                          {fileMeta ? <p className="text-slate-400">{fileMeta}</p> : null}
                          <span className="flex gap-3">
                            <button type="button" className="font-semibold text-primary" onClick={() => fileRef.current?.click()}>Almashtirish</button>
                            <button type="button" className="text-slate-500" onClick={() => setForm({ ...form, imageUrl: "" })}>O‘chirish</button>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-1 py-3 text-slate-500">
                        <ImagePlus className="size-6 text-primary" />
                        <span className="font-semibold">{uploading ? "Yuklanmoqda…" : "Rasm tanlash"}</span>
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                  </div>
                  <p className="mt-1 text-[11.5px] text-slate-400">Tavsiya: 1200×400 (keng banner). JPG/PNG/WEBP.</p>
                </div>
                <div>
                  <span className="mb-1 block font-semibold text-slate-600">Joylashuv</span>
                  <div className="grid grid-cols-2 gap-2">
                    {PLACEMENTS.map((p) => {
                      const on = form.placements.includes(p.id);
                      return (
                        <button key={p.id} type="button" onClick={() => setForm({ ...form, placements: on ? form.placements.filter((x) => x !== p.id) : [...form.placements, p.id] })}
                          className={cn("flex h-10 items-center gap-2 rounded-xl border px-3 font-semibold", on ? "border-primary bg-[#eef4ff] text-primary" : "border-[#e2e8f0] text-slate-600")}>
                          <p.icon className="size-4" /> {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label><span className="mb-1 block font-semibold text-slate-600">Boshlanish</span><input type="date" className={input} value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} /></label>
                  <label><span className="mb-1 block font-semibold text-slate-600">Tugash</span><input type="date" className={input} value={form.endsOn} min={form.startsOn} onChange={(e) => setForm({ ...form, endsOn: e.target.value })} /></label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label><span className="mb-1 block font-semibold text-slate-600">Narx modeli</span>
                    <select className={input} value={form.pricing} onChange={(e) => setForm({ ...form, pricing: e.target.value as Form["pricing"] })}>
                      <option value="monthly">Belgilangan (oylik)</option>
                      <option value="total">Butun muddat uchun</option>
                    </select></label>
                  <label><span className="mb-1 block font-semibold text-slate-600">Narx, so‘m</span>
                    <input inputMode="numeric" className={input} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d]/g, "") })} placeholder="4500000" /></label>
                </div>
                <label className="block"><span className="mb-1 block font-semibold text-slate-600">Havola (link)</span>
                  <span className="relative block"><Link2 className="absolute left-3 top-3 size-4 text-slate-400" />
                  <input className={cn(input, "pl-9")} value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://… yoki /marketplace/…" maxLength={500} /></span></label>
                <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-slate-500"><CalendarDays className="size-4" /> {days} kun · shartnoma qiymati</span>
                  <b>{fmtInt(total)} so‘m</b>
                </div>
                <div className="grid grid-cols-[1fr_1.6fr] gap-2">
                  <button type="button" className={cn(btn.outline, "h-10")} disabled={busy || uploading} onClick={() => save("draft")}>Qoralama</button>
                  <button type="button" className={cn(btn.primary, "h-10")} disabled={busy || uploading} onClick={() => save("active")}>
                    <Rocket className="size-4" /> {form.id ? "Saqlash va faollashtirish" : "Reklamani ishga tushirish"}
                  </button>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="font-heading text-[16px] font-bold">Reklamalar</p>
                    <p className="text-[12px] text-slate-400">Ko‘rish va bosishlar saytdagi haqiqiy hodisalardan hisoblanadi</p>
                  </div>
                  <Segmented value={tab} onChange={setTab} options={[{ id: "live", label: "Faol" }, { id: "all", label: "Barchasi" }, { id: "archived", label: "Arxiv" }]} />
                </div>
                {rows.length === 0 ? (
                  <Empty icon={<Megaphone className="size-5" />} title="Reklama yo‘q" hint="Chapdagi forma orqali birinchi bannerni yarating — u tanlangan sahifalarda ko‘rina boshlaydi." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-[13px]">
                      <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-4 py-2.5 text-left">Reklama</th>
                          <th className="px-3 py-2.5 text-right">Ko‘rishlar</th>
                          <th className="px-3 py-2.5 text-right">Bosishlar</th>
                          <th className="px-3 py-2.5 text-right">CTR</th>
                          <th className="px-3 py-2.5 text-right">Daromad</th>
                          <th className="px-3 py-2.5 text-left">Holat</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((a) => (
                          <tr key={a.id} className="border-t border-[#f1f5f9]">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={a.imageUrl} alt="" className="h-9 w-16 rounded-md object-cover" />
                                <div className="min-w-0">
                                  <div className="truncate font-semibold">{a.title || a.advertiser}</div>
                                  <div className="truncate text-[11.5px] text-slate-400">{a.placements.map((p) => PL_LABEL[p]).join(", ")} · {fmtDate(a.startsOn).slice(0, 5)}–{fmtDate(a.endsOn).slice(0, 5)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right">{fmtInt(a.views)}</td>
                            <td className="px-3 py-2.5 text-right">{fmtInt(a.clicks)}</td>
                            <td className="px-3 py-2.5 text-right font-semibold">{a.views ? `${((a.clicks / a.views) * 100).toFixed(2)}%` : "—"}</td>
                            <td className="px-3 py-2.5 text-right font-semibold text-[#15803d]">{moneyShort(a.revenue)}</td>
                            <td className="px-3 py-2.5"><Pill tone={STATUS[a.status][1]}>{STATUS[a.status][0]}</Pill></td>
                            <td className="px-4 py-2.5">
                              <div className="flex justify-end gap-1">
                                <button type="button" title="Tahrirlash" onClick={() => edit(a)} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Pencil className="size-4" /></button>
                                {a.status === "active" || a.status === "scheduled" ? (
                                  <button type="button" title="To‘xtatish" onClick={() => setStatus(a, "paused")} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Pause className="size-4" /></button>
                                ) : a.status !== "ended" ? (
                                  <button type="button" title="Faollashtirish" onClick={() => setStatus(a, "active")} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Play className="size-4" /></button>
                                ) : null}
                                {a.status !== "archived" ? (
                                  <button type="button" title="Arxivlash" onClick={() => setStatus(a, "archived")} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Archive className="size-4" /></button>
                                ) : null}
                                {confirmDel === a.id ? (
                                  <button type="button" onClick={() => del(a)} className="rounded-lg bg-[#dc2626] px-2 text-[12px] font-semibold text-white">O‘chirilsinmi?</button>
                                ) : (
                                  <button type="button" title="O‘chirish" onClick={() => setConfirmDel(a.id)} className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-[#fef2f2] hover:text-[#dc2626]"><Trash2 className="size-4" /></button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-heading text-[16px] font-bold">Kanal auksion</p>
                    <p className="text-[12px] text-slate-400">MRR {moneyShort(ch.data?.mrr ?? 0)} / oy · top stavkalar</p>
                  </div>
                  <Link href="/admin/kanallar" className="text-[12.5px] font-semibold text-primary">Batafsil →</Link>
                </div>
                {topBids.length === 0 ? <p className="text-[12.5px] text-slate-400">Hali stavka qo‘yilmagan.</p> : (
                  <ul className="divide-y divide-[#f1f5f9] text-[13px]">
                    {topBids.map((b, i) => (
                      <li key={b.id} className="flex items-center justify-between py-2">
                        <span><b>@{String(b.username).replace(/^@+/, "")}</b> <span className="text-slate-400">· {b.bidder ?? "—"}</span></span>
                        <span className="flex items-center gap-2"><Pill tone="blue">{i + 1}-o‘rin</Pill><b>{moneyShort(b.amount)}</b></span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
      {toast.node}
    </div>
  );
}
