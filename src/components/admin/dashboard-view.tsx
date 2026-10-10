"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Clock,
  FileCheck2,
  FileSpreadsheet,
  Flag,
  Lock,
  Package,
  Percent,
  Repeat,
  ShieldAlert,
  ShoppingBag,
  Store,
  UserPlus,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  Avatar,
  Card,
  Def,
  Delta,
  Donut,
  Empty,
  ErrorBox,
  Loading,
  PageHead,
  Segmented,
  Spark,
  btn,
  fmtDate,
  fmtInt,
  hashTone,
  moneyParts,
  moneyShort,
  shortDate,
  useAdminData,
} from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { MARKETPLACE_COMMISSION_PERCENT } from "@/lib/commission";

type Kpis = {
  commission: number; ads: number; channels: number; subs: number; refunds: number; gmv: number; net: number;
  orders: number; delivered: number; paidOrders: number; activeUsers: number; newUsers: number; newTelegram: number;
};
type Data = {
  from: string; to: string; days: number; current: Kpis; previous: Kpis; mrr: number;
  escrow: { amount: number; orders: number; disputes: number };
  series: { date: string; net: number; gmv: number }[];
  topStores: { id: string; name: string; city: string | null; slug: string; sales: number; gmv: number; commission: number; spark: number[] }[];
  attention: {
    pendingApplications: number; oldestPendingHours: number | null; openDisputes: number; disputedEscrow: number;
    reportedPosts: number; staleInTransit: number;
  };
};

type Period = "1" | "7" | "30" | "365";
const PERIOD_LABEL: Record<Period, string> = { "1": "Bugun", "7": "7 kun", "30": "30 kun", "365": "Yil" };

function Money({ v, big }: { v: number; big?: boolean }) {
  const p = moneyParts(v);
  return (
    <span className="whitespace-nowrap">
      <span className={cn("font-heading font-bold tracking-tight", big ? "text-[28px]" : "text-[19px] sm:text-[24px]")}>{p.value}</span>
      <span className="ml-1 text-[12px] font-medium opacity-70">{p.unit}</span>
    </span>
  );
}

function Kpi({
  title, def, icon: Icon, children, cur, prev, foot, spark, tone = "blue", hero,
}: {
  title: string; def: string; icon: typeof Wallet; children: React.ReactNode; cur: number; prev: number; foot?: string;
  spark?: number[]; tone?: "blue" | "violet" | "orange" | "green" | "sky"; hero?: boolean;
}) {
  const tones = {
    blue: ["bg-[#e8f1ff] text-primary", "#0066FF"],
    violet: ["bg-[#f3efff] text-[#6d28d9]", "#7c3aed"],
    orange: ["bg-[#fff7ed] text-[#ea580c]", "#f97316"],
    green: ["bg-[#ecfdf3] text-[#15803d]", "#16a34a"],
    sky: ["bg-[#e0f2fe] text-[#0369a1]", "#0284c7"],
  } as const;
  return (
    <Card className={cn("relative min-w-0 p-3 sm:p-4", hero && "col-span-2 sm:col-span-1", hero && "border-transparent bg-gradient-to-br from-[#0a6cff] to-[#0050d8] text-white shadow-[0_10px_30px_rgba(0,102,255,0.28)]")}>
      <div className="flex items-center gap-2">
        <span className={cn("flex size-7 shrink-0 sm:size-8 items-center justify-center rounded-lg", hero ? "bg-white/20 text-white" : tones[tone][0])}>
          <Icon className="size-4" />
        </span>
        <span className={cn("min-w-0 truncate text-[12px] font-semibold sm:text-[13px]", hero ? "text-white" : "text-slate-700")}>{title}</span>
        <Def text={def} className={cn("ml-auto", hero && "[&_button]:text-white/70")} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">{children}</div>
        {spark && spark.some((v) => v > 0) ? <span className="hidden sm:block"><Spark values={spark} color={hero ? "#ffffff" : tones[tone][1]} w={80} h={30} /></span> : null}
      </div>
      <div className={cn("mt-1.5 flex items-center gap-1.5 text-[11.5px]", hero ? "text-white/80" : "text-slate-400")}>
        <Delta cur={cur} prev={prev} />
        {foot ? <span className="truncate">{foot}</span> : null}
      </div>
    </Card>
  );
}

export function DashboardView() {
  const [period, setPeriod] = useState<Period>("30");
  const { data, error, loading, reload } = useAdminData<Data>(`/api/admin/dashboard?days=${period}`);

  if (error) return <ErrorBox text={error} onRetry={reload} />;

  const c = data?.current;
  const p = data?.previous;
  const series = data?.series ?? [];
  const recent = series.slice(-14);
  const sources = c
    ? [
        { label: "Marketplace komissiyasi", value: c.commission, color: "#0066FF" },
        { label: "Reklama", value: c.ads, color: "#60a5fa" },
        { label: "Kanal auksion", value: c.channels, color: "#f59e0b" },
        { label: "Obuna (sotuvchi)", value: c.subs, color: "#a78bfa" },
      ]
    : [];
  const sourceTotal = sources.reduce((a, s) => a + s.value, 0);
  const seriesTotal = series.reduce((a, s) => a + s.net, 0);
  const best = series.reduce<{ date: string; net: number } | null>((b, s) => (s.net > 0 && (!b || s.net > b.net) ? s : b), null);
  const monthly = (data?.days ?? 30) > 31;
  const avgCheck = c && c.paidOrders > 0 ? c.gmv / c.paidOrders : 0;
  const rate = c && c.gmv > 0 ? (c.commission / c.gmv) * 100 : 0;

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHead
        title="Umumiy ko‘rinish"
        subtitle={data ? `StomaHub platformasi bo‘yicha asosiy ko‘rsatkichlar · ${fmtDate(data.from)} – ${fmtDate(data.to)}` : "Yuklanmoqda…"}
        actions={
          <>
            <Segmented value={period} onChange={setPeriod} options={(Object.keys(PERIOD_LABEL) as Period[]).map((id) => ({ id, label: PERIOD_LABEL[id] }))} />
            <a href={`/api/admin/export?kind=summary&days=${period}`} className={btn.outline}>
              <FileSpreadsheet className="size-4" /> Hisobot (CSV)
            </a>
          </>
        }
      />

      {!data || !c || !p ? (
        <Loading />
      ) : (
        <div className={cn("space-y-4 transition-opacity", loading && "opacity-60")}>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
            <Kpi hero title="Sof foyda" icon={Wallet} cur={c.net} prev={p.net} foot="komissiya + xizmatlar"
              def="Platformaga qoladigan pul: yakunlangan buyurtmalar komissiyasi + reklama + kanal auksion + sotuvchi obunalari − qaytarishlar zarari. Sotuvchilarga o‘tadigan pul kirmaydi."
              spark={recent.map((s) => s.net)}>
              <Money v={c.net} big />
            </Kpi>
            <Kpi title="GMV (umumiy savdo)" icon={ShoppingBag} cur={c.gmv} prev={p.gmv} tone="blue" spark={recent.map((s) => s.gmv)}
              foot={avgCheck ? `o‘rt. chek ${moneyShort(avgCheck)}` : "to‘langan buyurtmalar"}
              def="Davrda to‘langan (escrowga tushgan) barcha buyurtmalar summasi, qaytarilganlar hisobga olinmaydi. Bu platforma daromadi emas.">
              <Money v={c.gmv} />
            </Kpi>
            <Kpi title="MRR" icon={Repeat} cur={0} prev={0} tone="violet" foot="takroriy oylik daromad"
              def="Har oy takrorlanadigan daromad: faol sotuvchi obunalari + faol reklama shartnomalarining oylik qiymati + joriy oyning avto-yangilanuvchi kanal stavkalari.">
              <Money v={data.mrr} />
            </Kpi>
            <Kpi title="Escrowda ushlab turilgan" icon={Lock} cur={0} prev={0} tone="orange"
              foot={`${fmtInt(data.escrow.orders)} buyurtma · ${fmtInt(data.escrow.disputes)} nizoli`}
              def="Xaridor to‘lagan, lekin hali sotuvchiga o‘tkazilmagan pul. Shifokor “Qabul qildim” bosganda yoki admin nizoni hal qilganda chiqadi.">
              <Money v={data.escrow.amount} />
            </Kpi>
            <Kpi title="Faol foydalanuvchilar" icon={Activity} cur={c.activeUsers} prev={p.activeUsers} tone="green"
              foot={`${PERIOD_LABEL[period].toLowerCase()} ichida kirganlar`}
              def="Tanlangan davrda kamida bir marta saytga kirgan (sessiyasi faol bo‘lgan) foydalanuvchilar soni.">
              <span className="font-heading text-[19px] font-bold sm:text-[24px]">{fmtInt(c.activeUsers)}</span>
            </Kpi>
            <Kpi title="Yangi ro‘yxatdan o‘tganlar" icon={UserPlus} cur={c.newUsers} prev={p.newUsers} tone="sky"
              foot={c.newUsers ? `Telegram ${Math.round((c.newTelegram / c.newUsers) * 100)}%` : undefined}
              def="Davrda yangi akkaunt ochganlar (telefon, Google yoki Telegram orqali).">
              <span className="font-heading text-[19px] font-bold sm:text-[24px]">{fmtInt(c.newUsers)}</span>
            </Kpi>
            <Kpi title="Buyurtmalar" icon={Package} cur={c.orders} prev={p.orders} tone="blue" foot={`${fmtInt(c.delivered)} yetkazildi`}
              def="Davrda berilgan barcha marketplace buyurtmalari (to‘lov usulidan qat’i nazar).">
              <span className="font-heading text-[19px] font-bold sm:text-[24px]">{fmtInt(c.orders)}</span>
            </Kpi>
            <Kpi title="Marketplace komissiyasi" icon={Percent} cur={c.commission} prev={p.commission} tone="green"
              foot={rate ? `samarali stavka ${rate.toFixed(1)}% GMV` : "sotuvchiga o‘tkazilganda hisoblanadi"}
              def={`Sotuvchiga pul o‘tkazilgan (yakunlangan) buyurtmalardan platforma ushlab qolgan komissiya. Har do‘konning stavkasi alohida (standart ${MARKETPLACE_COMMISSION_PERCENT}%).`}>
              <Money v={c.commission} />
            </Kpi>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-[16px] font-bold">Daromad dinamikasi</p>
                  <p className="text-[12.5px] text-slate-400">{monthly ? "Oylik sof foyda va GMV" : "Kunlik sof foyda va GMV · oxirgi 30 kun"}</p>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-primary" /> Sof foyda</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[#dbe7ff]" /> GMV</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-6">
                <div>
                  <div className="text-[11.5px] text-slate-400">Jami</div>
                  <div className="font-heading text-[18px] font-bold">{moneyShort(seriesTotal)}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-slate-400">{monthly ? "Oylik o‘rtacha" : "Kunlik o‘rtacha"}</div>
                  <div className="font-heading text-[18px] font-bold">{moneyShort(series.length ? seriesTotal / series.length : 0)}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-slate-400">Eng yaxshi {monthly ? "oy" : "kun"}{best ? ` · ${shortDate(best.date)}` : ""}</div>
                  <div className="font-heading text-[18px] font-bold">{best ? moneyShort(best.net) : "—"}</div>
                </div>
              </div>
              <div className="mt-3">
                <AreaChart
                  values={series.map((s) => s.net)}
                  bars={series.map((s) => s.gmv)}
                  labels={series.map((s) => (monthly ? s.date.slice(5, 7) + "." + s.date.slice(2, 4) : shortDate(s.date)))}
                  height={250}
                />
              </div>
              {seriesTotal === 0 ? <p className="mt-1 text-center text-[12px] text-slate-400">Hali daromad yo‘q — birinchi buyurtma, reklama yoki kanal stavkasidan keyin grafik to‘ladi.</p> : null}
            </Card>

            <Card className="p-5">
              <p className="font-heading text-[16px] font-bold">Daromad manbalari</p>
              <p className="text-[12.5px] text-slate-400">{PERIOD_LABEL[period]} · jami {moneyShort(sourceTotal)}</p>
              <div className="my-5 flex justify-center">
                <Donut parts={sources} size={180} stroke={26}>
                  <span className="font-heading text-[22px] font-bold">{moneyParts(sourceTotal).value}</span>
                  <span className="text-[11px] text-slate-400">{moneyParts(sourceTotal).unit}</span>
                </Donut>
              </div>
              <ul className="space-y-2.5 text-[13px]">
                {sources.map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 text-slate-600">{s.label}</span>
                    <span className="font-semibold">{moneyShort(s.value)}</span>
                    <span className="w-10 text-right text-slate-400">{sourceTotal ? Math.round((s.value / sourceTotal) * 100) : 0}%</span>
                  </li>
                ))}
              </ul>
              {c.refunds > 0 ? <p className="mt-3 text-[12px] text-[#b91c1c]">Qaytarishlar zarari: −{moneyShort(c.refunds)}</p> : null}
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between p-5 pb-3">
                <div>
                  <p className="font-heading text-[16px] font-bold">Top do‘konlar</p>
                  <p className="text-[12.5px] text-slate-400">GMV bo‘yicha · {PERIOD_LABEL[period]}</p>
                </div>
                <Link href="/admin/dokonlar" className="text-[12.5px] font-semibold text-primary">Barchasi →</Link>
              </div>
              {data.topStores.length === 0 ? (
                <Empty icon={<Store className="size-5" />} title="Bu davrda sotuv bo‘lmagan" hint="Sotuvchi do‘konlaridan to‘langan buyurtmalar shu yerda reyting bo‘lib chiqadi." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-2 text-left">#</th>
                        <th className="px-2 py-2 text-left">Do‘kon</th>
                        <th className="px-3 py-2 text-right">Sotuv</th>
                        <th className="px-3 py-2 text-right">GMV</th>
                        <th className="px-3 py-2 text-right">Komissiya</th>
                        <th className="px-4 py-2 text-right">Trend (14 kun)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topStores.map((s, i) => (
                        <tr key={s.id} className="border-t border-[#f1f5f9]">
                          <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={s.name} tone={hashTone(s.id)} className="size-8" />
                              <div>
                                <div className="font-semibold">{s.name}</div>
                                <div className="text-[11.5px] text-slate-400">{s.city || "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold">{fmtInt(s.sales)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">{moneyShort(s.gmv)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-[#15803d]">{moneyShort(s.commission)}</td>
                          <td className="px-4 py-2.5"><div className="flex justify-end"><Spark values={s.spark} /></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <p className="font-heading text-[16px] font-bold">Diqqat talab qiladi</p>
              <p className="mb-3 text-[12.5px] text-slate-400">Bugungi vazifalar</p>
              <Attention a={data.attention} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Attention({ a }: { a: Data["attention"] }) {
  const items = [
    a.pendingApplications > 0 && {
      icon: FileCheck2, tone: "bg-[#fff7ed] text-[#ea580c]", title: `${a.pendingApplications} ta yangi sotuvchi arizasi`,
      sub: a.oldestPendingHours != null ? `Eng eskisi ${a.oldestPendingHours >= 24 ? `${Math.floor(a.oldestPendingHours / 24)} kun` : `${a.oldestPendingHours} soat`} kutmoqda` : "",
      href: "/admin/arizalar", cta: "Ko‘rish",
    },
    a.openDisputes > 0 && {
      icon: ShieldAlert, tone: "bg-[#fef2f2] text-[#dc2626]", title: `${a.openDisputes} ta nizoli buyurtma`,
      sub: `Escrowda ${moneyShort(a.disputedEscrow)} muzlatilgan`, href: "/admin/buyurtmalar?filter=disputed", cta: "Hal qilish",
    },
    a.reportedPosts > 0 && {
      icon: Flag, tone: "bg-[#f3efff] text-[#6d28d9]", title: `${a.reportedPosts} ta shikoyat qilingan post`,
      sub: "Hamjamiyat moderatsiyasi", href: "/admin/kontent", cta: "Ochish",
    },
    a.staleInTransit > 0 && {
      icon: Clock, tone: "bg-[#e8f1ff] text-primary", title: `${a.staleInTransit} ta buyurtma 48 soatdan beri “Yo‘lda”`,
      sub: "Sotuvchi yoki xaridor bilan bog‘laning", href: "/admin/buyurtmalar?filter=escrow", cta: "Ko‘rish",
    },
  ].filter(Boolean) as { icon: typeof Flag; tone: string; title: string; sub: string; href: string; cta: string }[];

  if (!items.length) return <Empty title="Hammasi joyida ✨" hint="Kutilayotgan ariza, nizo yoki shikoyat yo‘q." />;
  return (
    <ul className="divide-y divide-[#f1f5f9]">
      {items.map((it) => (
        <li key={it.title} className="flex items-center gap-3 py-3">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", it.tone)}>
            <it.icon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold">{it.title}</span>
            {it.sub ? <span className="block text-[11.5px] text-slate-400">{it.sub}</span> : null}
          </span>
          <Link href={it.href} className="text-[12.5px] font-semibold text-primary">{it.cta}</Link>
        </li>
      ))}
    </ul>
  );
}
