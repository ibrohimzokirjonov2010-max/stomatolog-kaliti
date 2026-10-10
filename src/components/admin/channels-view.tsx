"use client";

import { Eye, EyeOff, Send, XCircle } from "lucide-react";
import { Card, Empty, ErrorBox, Loading, PageHead, Pill, adminPost, fmtDate, fmtInt, moneyParts, moneyShort, useAdminData, useToast } from "@/components/admin/ui";

type Data = {
  channels: { id: string; username: string; name: string; category: string | null; hidden: boolean; createdAt: string; owner: string | null; topBid: number | null }[];
  bids: { id: number; key: string; username: string; amount: number; autoRenew: boolean; status: string; createdAt: string; bidder: string | null }[];
  monthly: { month: string; amount: number }[];
  mrr: number;
};

const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

export function ChannelsView() {
  const { data, error, loading, reload } = useAdminData<Data>("/api/admin/channels");
  const toast = useToast();

  async function act(action: string, target: string, ok: string) {
    const res = await adminPost("/api/admin/channels", { action, target });
    if (!res.ok) return toast.show(res.error, "err");
    toast.show(ok);
    void reload();
  }

  const maxM = Math.max(1, ...(data?.monthly ?? []).map((m) => m.amount));
  const activeBids = (data?.bids ?? []).filter((b) => b.status === "active");
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHead title="Kanal auksion" subtitle="“Foydali kanallar” bo‘limida yuqori o‘rin uchun oylik stavkalar va foydalanuvchilar qo‘shgan kanallar" />
      {error ? <ErrorBox text={error} onRetry={reload} /> : !data ? <Loading /> : (
        <div className="space-y-4" style={{ opacity: loading ? 0.7 : 1 }}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4"><div className="text-[12px] text-slate-500">MRR (avto-yangilanuvchi stavkalar)</div><span className="font-heading text-[22px] font-bold">{moneyParts(data.mrr).value}</span> <span className="text-[12px] text-slate-400">{moneyParts(data.mrr).unit}</span></Card>
            <Card className="p-4"><div className="text-[12px] text-slate-500">Faol stavkalar</div><span className="font-heading text-[22px] font-bold">{fmtInt(activeBids.length)}</span></Card>
            <Card className="p-4"><div className="text-[12px] text-slate-500">Foydalanuvchi kanallari</div><span className="font-heading text-[22px] font-bold">{fmtInt(data.channels.length)}</span></Card>
          </div>
          <Card className="p-5">
            <p className="mb-3 font-heading text-[16px] font-bold">Oylik auksion daromadi</p>
            {data.monthly.length === 0 ? <p className="text-[12.5px] text-slate-400">Hali daromad yo‘q.</p> : (
              <div className="flex h-40 items-end gap-3">
                {data.monthly.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[11px] font-semibold">{moneyShort(m.amount)}</span>
                    <div className="w-full max-w-[56px] rounded-t-lg bg-gradient-to-t from-[#f97316] to-[#fdba74]" style={{ height: `${Math.max(4, (m.amount / maxM) * 110)}px` }} />
                    <span className="text-[11px] text-slate-400">{MONTHS[Number(m.month.slice(5, 7)) - 1]}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <p className="p-4 pb-2 font-heading text-[16px] font-bold">Stavkalar</p>
              {data.bids.length === 0 ? <Empty icon={<Send className="size-5" />} title="Stavkalar yo‘q" /> : (
                <ul className="divide-y divide-[#f1f5f9] text-[13px]">
                  {data.bids.map((b) => (
                    <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">@{String(b.username).replace(/^@+/, "")} · {moneyShort(b.amount)}</span>
                        <span className="text-[11.5px] text-slate-400">{b.bidder ?? "—"} · {fmtDate(b.createdAt, true)}{b.autoRenew ? " · avto-yangilanadi" : ""}</span>
                      </span>
                      {b.status === "active" ? (
                        <button type="button" onClick={() => act("cancel_bid", String(b.id), "Stavka bekor qilindi")} className="flex items-center gap-1 text-[12px] font-semibold text-[#dc2626]"><XCircle className="size-4" /> Bekor</button>
                      ) : <Pill tone="gray">Bekor qilingan</Pill>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="overflow-hidden">
              <p className="p-4 pb-2 font-heading text-[16px] font-bold">Qo‘shilgan kanallar</p>
              {data.channels.length === 0 ? <Empty icon={<Send className="size-5" />} title="Foydalanuvchilar hali kanal qo‘shmagan" /> : (
                <ul className="divide-y divide-[#f1f5f9] text-[13px]">
                  {data.channels.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="min-w-0 flex-1">
                        <a href={`https://t.me/${String(c.username).replace(/^@+/, "")}`} target="_blank" rel="noreferrer" className="block font-semibold hover:text-primary">{c.name} <span className="font-normal text-slate-400">@{String(c.username).replace(/^@+/, "")}</span></a>
                        <span className="text-[11.5px] text-slate-400">{[c.category, c.owner, fmtDate(c.createdAt), c.topBid ? `top stavka ${moneyShort(c.topBid)}` : null].filter(Boolean).join(" · ")}</span>
                      </span>
                      {c.hidden ? (
                        <button type="button" onClick={() => act("show_channel", c.id, "Kanal ko‘rsatildi")} className="flex items-center gap-1 text-[12px] font-semibold text-primary"><Eye className="size-4" /> Ko‘rsatish</button>
                      ) : (
                        <button type="button" onClick={() => act("hide_channel", c.id, "Kanal yashirildi")} className="flex items-center gap-1 text-[12px] font-semibold text-[#dc2626]"><EyeOff className="size-4" /> Yashirish</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
      {toast.node}
    </div>
  );
}
