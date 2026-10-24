"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Eye, MapPin, Percent, ShoppingBag, ShoppingCart, Wallet } from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { orderSum } from "@/components/seller-overview-desktop";
import { goodsLines } from "@/lib/order-money";
import { DemoTag, Donut, DONUT_COLORS, LineChart, Panel, SelectBox, shortMoney } from "@/components/seller-desktop-ui";
import { categoryLabels, type ProductCategory } from "@/data/products";
import { formatMoney } from "@/lib/format";
import { sectionForCategory } from "@/lib/seller-work";
import type { Order } from "@/lib/orders";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");
const dm = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
const dmy = (d: Date) => `${dm(d)}.${d.getFullYear()}`;
const money = (n: number) => formatMoney(n, "UZS");
const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

type RangeId = "today" | "7" | "30" | "90" | "365";
type Mode = "hour" | "day" | "week" | "month";
const RANGES: { id: RangeId; label: string; days: number }[] = [
  { id: "today", label: "Bugun", days: 1 },
  { id: "7", label: "7 kun", days: 7 },
  { id: "30", label: "30 kun", days: 30 },
  { id: "90", label: "3 oy", days: 90 },
  { id: "365", label: "1 yil", days: 365 },
];
const CHANNELS = [
  { value: "all", label: "Barcha kanallar" },
  { value: "marketplace", label: "Marketplace" },
  { value: "forma", label: "Forma" },
  { value: "jihozlar", label: "Jihozlar" },
];
const SECTION_LABEL: Record<string, string> = { marketplace: "Marketplace", forma: "Forma", jihozlar: "Jihozlar" };

/* ───── geography ───── */
type Region = { id: string; label: string; col: number; row: number; span?: number };
const REGIONS: Region[] = [
  { id: "qoraqalpogiston", label: "Qoraqalpog‘iston", col: 0, row: 0, span: 2 },
  { id: "toshkent-sh", label: "Toshkent", col: 3, row: 0 },
  { id: "toshkent-v", label: "Toshkent v.", col: 4, row: 0 },
  { id: "namangan", label: "Namangan", col: 5, row: 0 },
  { id: "xorazm", label: "Xorazm", col: 0, row: 1 },
  { id: "navoiy", label: "Navoiy", col: 1, row: 1 },
  { id: "jizzax", label: "Jizzax", col: 2, row: 1 },
  { id: "sirdaryo", label: "Sirdaryo", col: 3, row: 1 },
  { id: "fargona", label: "Farg‘ona", col: 4, row: 1 },
  { id: "andijon", label: "Andijon", col: 5, row: 1 },
  { id: "buxoro", label: "Buxoro", col: 1, row: 2 },
  { id: "samarqand", label: "Samarqand", col: 2, row: 2 },
  { id: "qashqadaryo", label: "Qashqadaryo", col: 3, row: 2 },
  { id: "surxondaryo", label: "Surxondaryo", col: 4, row: 2 },
];
const REGION_KEYS: [string, RegExp][] = [
  ["qoraqalpogiston", /qoraqalpo|nukus|karakalpak/],
  ["xorazm", /xorazm|urganch|xiva/],
  ["navoiy", /navoiy|zarafshon/],
  ["buxoro", /buxoro|bukhara/],
  ["qashqadaryo", /qashqadaryo|qarshi/],
  ["surxondaryo", /surxondaryo|termiz/],
  ["samarqand", /samarqand/],
  ["jizzax", /jizzax/],
  ["sirdaryo", /sirdaryo|guliston/],
  ["namangan", /namangan/],
  ["andijon", /andijon/],
  ["fargona", /farg|qo.?qon|margilon/],
];
function regionOf(city: string): string {
  const c = city.toLowerCase().replace(/[‘’ʻʼ`´']/g, "").replace(/o'/g, "o");
  const c2 = c.replace(/\s+/g, " ");
  if (/toshkent|tashkent/.test(c2)) return /viloyat|v\.|oblast/.test(c2) ? "toshkent-v" : "toshkent-sh";
  for (const [id, re] of REGION_KEYS) if (re.test(c2.replace(/g/g, "g"))) return id;
  return "boshqa";
}

/* ───── helpers ───── */
type Line = { orderId: string; at: Date; qty: number; price: number; name: string; brand: string; image?: string; productId: string; category: ProductCategory; section: string };
type Sale = { order: Order; at: Date; sum: number; lines: Line[]; cust: string; region: string };

function linesOf(order: Order, shopId: string): Line[] {
  const src = goodsLines(order, shopId);
  const at = new Date(order.createdAt);
  return src.map((i) => ({
    orderId: order.id,
    at,
    qty: i.qty,
    price: i.price,
    name: i.name,
    brand: i.brand,
    image: i.image,
    productId: i.productId,
    category: (i.category ?? "materiallar") as ProductCategory,
    section: sectionForCategory((i.category ?? "materiallar") as ProductCategory),
  }));
}
const custKey = (o: Order) => {
  const digits = (o.phone ?? "").replace(/\D/g, "").slice(-9);
  return digits.length >= 7 ? digits : `n:${(o.name ?? "").trim().toLowerCase()}`;
};
const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

function Spark({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const w = 90;
  const h = 34;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - (v / max) * (h - 8)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-[90px]" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Kpi({
  icon,
  tone,
  title,
  value,
  note,
  spark,
  color,
  demo,
}: {
  icon: ReactNode;
  tone: string;
  title: string;
  value: string;
  note: ReactNode;
  spark?: number[];
  color: string;
  demo?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)]">
      <div className="flex items-center gap-2.5">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tone)}>{icon}</span>
        <p className="min-w-0 truncate text-[12.5px] font-medium text-[#6b7280]">{title}</p>
        {demo ? <DemoTag /> : null}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-[21px] leading-none font-extrabold tracking-tight text-[#111827]">{value}</p>
        {spark ? <Spark values={spark} color={color} /> : null}
      </div>
      <p className="mt-2.5 text-[11.5px] text-[#8b93a7]">{note}</p>
    </div>
  );
}

function Growth({ cur, prev }: { cur: number; prev: number }) {
  if (prev <= 0) return <>Oldingi davrda ma’lumot yo‘q</>;
  const g = Math.round(((cur - prev) / prev) * 100);
  return (
    <>
      <b className={g >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}>
        {g >= 0 ? "↑" : "↓"} {Math.abs(g) > 999 ? "999%+" : `${Math.abs(g)}%`}
      </b>{" "}
      oldingi davrga nisbatan
    </>
  );
}

export function SellerAnalyticsDesktop() {
  const { shopOrders, session } = useSellerWork();
  const shopId = session?.id ?? "";
  const [range, setRange] = useState<RangeId>("7");
  const [channel, setChannel] = useState("all");
  const [modeSel, setModeSel] = useState<"day" | "week" | "month">("day");
  const [prevRange, setPrevRange] = useState<RangeId>("7");
  if (prevRange !== range) {
    setPrevRange(range);
    setModeSel(range === "90" ? "week" : range === "365" ? "month" : "day");
  }

  const data = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = RANGES.find((r) => r.id === range)?.days ?? 7;
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const pStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() - days);

    // all (non-refunded) sales for this shop, channel-filtered
    const sales: Sale[] = [];
    const allCustCount = new Map<string, number>();
    for (const o of shopOrders) {
      if (o.paymentState === "refunded") continue;
      const at = new Date(o.createdAt);
      if (Number.isNaN(at.getTime())) continue;
      const key = custKey(o);
      allCustCount.set(key, (allCustCount.get(key) ?? 0) + 1);
      let lines = linesOf(o, shopId);
      if (channel !== "all") lines = lines.filter((l) => l.section === channel);
      if (!lines.length) continue;
      const sum = channel === "all" ? orderSum(o, shopId) : lines.reduce((a, l) => a + l.price * l.qty, 0);
      sales.push({ order: o, at, sum, lines, cust: key, region: regionOf(o.city ?? "") });
    }
    const inRange = sales.filter((s) => s.at >= start && s.at < end);
    const prevSales = sales.filter((s) => s.at >= pStart && s.at < start);

    const mode: Mode = range === "today" ? "hour" : modeSel;
    const buckets: { start: Date; label: string; tip: string }[] = [];
    if (mode === "hour") {
      for (let h = 0; h < 24; h += 1) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h);
        buckets.push({ start: d, label: `${pad(h)}:00`, tip: `${dmy(d)} ${pad(h)}:00` });
      }
    } else if (mode === "day") {
      for (let i = 0; i < days; i += 1) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        buckets.push({ start: d, label: dm(d), tip: dmy(d) });
      }
    } else if (mode === "week") {
      const dow = (start.getDay() + 6) % 7;
      let d = new Date(start.getFullYear(), start.getMonth(), start.getDate() - dow);
      while (d < end) {
        const e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6);
        buckets.push({ start: d, label: dm(d), tip: `${dm(d)} – ${dmy(e)}` });
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
      }
    } else {
      let d = new Date(start.getFullYear(), start.getMonth(), 1);
      while (d < end) {
        buckets.push({ start: d, label: MONTHS[d.getMonth()], tip: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      }
    }
    const totals = buckets.map(() => 0);
    const counts = buckets.map(() => 0);
    for (const s of inRange) {
      let idx = -1;
      for (let i = 0; i < buckets.length; i += 1) if (s.at >= buckets[i].start) idx = i;
      if (idx < 0) continue;
      totals[idx] += s.sum;
      counts[idx] += 1;
    }

    const total = inRange.reduce((a, s) => a + s.sum, 0);
    const prevTotal = prevSales.reduce((a, s) => a + s.sum, 0);

    // sources by section
    const sources = new Map<string, number>();
    for (const s of inRange) for (const l of s.lines) sources.set(l.section, (sources.get(l.section) ?? 0) + l.price * l.qty);
    const sourceParts = ["marketplace", "forma", "jihozlar"].map((k) => ({ key: k, label: SECTION_LABEL[k], value: sources.get(k) ?? 0 }));

    // top products
    const prod = new Map<string, { name: string; brand: string; image?: string; qty: number; revenue: number }>();
    for (const s of inRange)
      for (const l of s.lines) {
        const k = l.productId || l.name;
        const p = prod.get(k) ?? { name: l.name, brand: l.brand, image: l.image, qty: 0, revenue: 0 };
        p.qty += l.qty;
        p.revenue += l.price * l.qty;
        prod.set(k, p);
      }
    const top = [...prod.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 5);

    // categories
    const cats = new Map<string, number>();
    for (const s of inRange) for (const l of s.lines) cats.set(l.category, (cats.get(l.category) ?? 0) + l.price * l.qty);
    const catRows = [...cats.entries()]
      .map(([k, v]) => ({ key: k, label: categoryLabels[k as ProductCategory] ?? k, value: v }))
      .sort((a, b) => b.value - a.value);

    // geography by order count
    const geo = new Map<string, number>();
    for (const s of inRange) geo.set(s.region, (geo.get(s.region) ?? 0) + 1);

    // customers
    const custs = new Set(inRange.map((s) => s.cust));
    let returning = 0;
    for (const c of custs) if ((allCustCount.get(c) ?? 0) > 1) returning += 1;

    return { start, today, days, mode, buckets, totals, counts, total, prevTotal, count: inRange.length, prevCount: prevSales.length, sourceParts, top, catRows, geo, custTotal: custs.size, returning };
  }, [shopOrders, shopId, range, channel, modeSel]);

  const sourceTotal = data.sourceParts.reduce((a, p) => a + p.value, 0);
  const sourceDonut = data.sourceParts.map((p, i) => ({ label: p.label, value: p.value, color: DONUT_COLORS[i] }));
  const catTotal = data.catRows.reduce((a, c) => a + c.value, 0);
  const geoTotal = [...data.geo.values()].reduce((a, v) => a + v, 0);
  const geoList = [...data.geo.entries()]
    .map(([id, n]) => ({ id, n, label: id === "boshqa" ? "Boshqa" : (REGIONS.find((r) => r.id === id)?.label ?? id) }))
    .sort((a, b) => b.n - a.n);
  const geoTop = geoList.filter((g) => g.id !== "boshqa").slice(0, 4);
  const geoOther = geoTotal - geoTop.reduce((a, g) => a + g.n, 0);
  const geoMax = Math.max(...data.geo.values(), 1);
  const newCust = data.custTotal - data.returning;
  const rangeLabel = `${dmy(data.start)} – ${dmy(data.today)}`;
  const hasData = data.count > 0;

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#111827]">Analitika</h1>
          <p className="mt-1 text-[13.5px] text-[#6b7280]">Savdo statistikasi, mahsulotlar samaradorligi va mijozlar faolligini kuzating.</p>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-xl border border-[#e4e9f2] bg-white px-3.5 text-[13px] font-medium text-[#111827]">
          <CalendarDays className="size-4 text-[#8b93a7]" />
          {rangeLabel}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRange(r.id)}
            className={cn(
              "h-9 rounded-lg border px-4 text-[13px] font-semibold transition-colors",
              range === r.id ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-[#e4e9f2] bg-white text-[#4b5568] hover:border-[#CCFBF1] hover:text-[#0F766E]",
            )}
          >
            {r.label}
          </button>
        ))}
        <SelectBox label="Kanal" value={channel} onChange={setChannel} options={CHANNELS} className="ml-1 h-9 min-w-[150px]" />
      </div>

      <div className="grid grid-cols-5 gap-3">
        <Kpi
          icon={<Wallet className="size-[18px] text-[#0F766E]" />}
          tone="bg-[#F0FDFA]"
          title="Jami savdo"
          value={money(data.total)}
          note={<Growth cur={data.total} prev={data.prevTotal} />}
          spark={data.totals}
          color="#0F766E"
        />
        <Kpi
          icon={<ShoppingBag className="size-[18px] text-[#16a34a]" />}
          tone="bg-[#ecfdf3]"
          title="Buyurtmalar"
          value={String(data.count)}
          note={<Growth cur={data.count} prev={data.prevCount} />}
          spark={data.counts}
          color="#16a34a"
        />
        <Kpi icon={<Eye className="size-[18px] text-[#7c3aed]" />} tone="bg-[#f3e8ff]" title="Ko‘rishlar" value="—" note="Hisoblash tez orada" color="#7c3aed" demo />
        <Kpi icon={<ShoppingCart className="size-[18px] text-[#d97706]" />} tone="bg-[#fff4e5]" title="Savatchaga qo‘shish" value="—" note="Hisoblash tez orada" color="#d97706" demo />
        <Kpi icon={<Percent className="size-[18px] text-[#dc2626]" />} tone="bg-[#fef2f2]" title="Konversiya" value="—" note="Ko‘rishlar ulangach" color="#dc2626" demo />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4">
        <Panel
          title="Savdo dinamikasi"
          action={
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-3 text-[12px] text-[#4b5568]">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#0F766E]" />
                  Savdo (so‘m)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#7c3aed]" />
                  Buyurtmalar
                </span>
              </span>
              {range === "today" ? (
                <span className="rounded-lg border border-[#e4e9f2] px-2.5 py-2 text-[12.5px] font-medium text-[#111827]">Soatlik</span>
              ) : (
                <SelectBox
                  label="Guruhlash"
                  value={modeSel}
                  onChange={(v) => setModeSel(v as "day" | "week" | "month")}
                  options={[
                    { value: "day", label: "Kunlik" },
                    { value: "week", label: "Haftalik" },
                    { value: "month", label: "Oylik" },
                  ]}
                />
              )}
            </div>
          }
        >
          <div className="mt-4">
            <LineChart
              labels={data.buckets.map((b) => b.label)}
              tooltipLabels={data.buckets.map((b) => b.tip)}
              series={[
                { key: "sales", label: "Savdo", color: "#0F766E", values: data.totals, area: true, fmt: money },
                { key: "orders", label: "Buyurtmalar", color: "#7c3aed", values: data.counts, dashed: true, axis: "right", fmt: (n) => `${n} ta buyurtma` },
              ]}
              leftTick={shortMoney}
              rightTick={(n) => String(n)}
              height={230}
            />
          </div>
          {!hasData ? <p className="mt-2 text-center text-[12.5px] text-[#8b93a7]">Tanlangan davrda buyurtma yo‘q.</p> : null}
        </Panel>

        <Panel title="Savdo manbalari">
          <div className="mt-4 flex items-center gap-4">
            <Donut
              size={140}
              parts={sourceDonut}
              center={
                <div>
                  <p className="text-[17px] leading-none font-extrabold text-[#111827]">{sourceTotal ? shortMoney(sourceTotal) : "0"}</p>
                  <p className="mt-1 text-[10.5px] text-[#8b93a7]">so‘m</p>
                </div>
              }
            />
            <ul className="min-w-0 flex-1 space-y-2.5 text-[12.5px]">
              {data.sourceParts.map((p, i) => (
                <li key={p.key} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[#4b5568]">
                    <span className="size-2.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                    {p.label}
                  </span>
                  <b className="text-[#111827]">{pct(p.value, sourceTotal)}%</b>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-4">
        <Panel title="Eng ko‘p sotilgan mahsulotlar">
          {data.top.length ? (
            <table className="mt-3 w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-[#eef1f6] text-[11.5px] font-semibold text-[#8b93a7]">
                  <th className="w-8 py-2">#</th>
                  <th className="py-2">Mahsulot</th>
                  <th className="py-2 text-right">Sotilgan</th>
                  <th className="py-2 text-right">Daromad</th>
                </tr>
              </thead>
              <tbody>
                {data.top.map((p, i) => (
                  <tr key={`${p.name}-${i}`} className="border-b border-[#f4f6fa] last:border-0">
                    <td className="py-2.5 text-[#8b93a7]">{i + 1}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.image ? <img src={p.image} alt="" className="size-9 shrink-0 rounded-lg bg-[#f4f6fa] object-cover" /> : <span className="size-9 shrink-0 rounded-lg bg-[#f4f6fa]" />}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#111827]">{p.name}</p>
                          <p className="truncate text-[11.5px] text-[#8b93a7]">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-medium text-[#111827]">{p.qty} dona</td>
                    <td className="py-2.5 text-right font-bold whitespace-nowrap text-[#111827]">{money(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-4 rounded-xl bg-[#f7f9fc] px-4 py-8 text-center text-[13px] text-[#8b93a7]">Tanlangan davrda sotuv yo‘q.</p>
          )}
        </Panel>

        <Panel title="Kategoriya bo‘yicha savdo">
          {data.catRows.length ? (
            <ul className="mt-4 space-y-3.5">
              {data.catRows.map((c, i) => (
                <li key={c.key}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-medium text-[#4b5568]">{c.label}</span>
                    <span className="text-[#111827]">
                      <b>{pct(c.value, catTotal)}%</b> <span className="text-[#8b93a7]">· {money(c.value)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-[#eef1f6]">
                    <div className="h-2 rounded-full" style={{ width: `${Math.max(pct(c.value, catTotal), 2)}%`, background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl bg-[#f7f9fc] px-4 py-8 text-center text-[13px] text-[#8b93a7]">Ma’lumot yo‘q.</p>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-4">
        <Panel
          title={
            <span className="flex items-center gap-2">
              Mijozlar geografiyasi <span className="text-[11px] font-medium text-[#8b93a7]">(buyurtma shahri bo‘yicha)</span>
            </span>
          }
        >
          <div className="mt-4 flex items-start gap-5">
            <div className="grid flex-1 grid-cols-6 gap-1.5" aria-label="Viloyatlar sxematik xaritasi">
              {REGIONS.map((r) => {
                const n = data.geo.get(r.id) ?? 0;
                const a = n ? 0.22 + 0.78 * (n / geoMax) : 0;
                return (
                  <div
                    key={r.id}
                    title={`${r.label}: ${n} ta buyurtma`}
                    className={cn("flex h-[54px] items-end rounded-lg border p-1.5 text-[10px] leading-tight font-semibold", n ? "border-transparent" : "border-[#e8edf5] bg-[#f7f9fc] text-[#a3abbd]")}
                    style={{
                      gridColumn: `${r.col + 1} / span ${r.span ?? 1}`,
                      gridRow: r.row + 1,
                      ...(n ? { background: `rgba(0,102,255,${a.toFixed(2)})`, color: a > 0.55 ? "#fff" : "#111827" } : {}),
                    }}
                  >
                    {r.label}
                  </div>
                );
              })}
            </div>
            <ul className="w-[190px] shrink-0 space-y-2.5 text-[12.5px]">
              {geoTop.length ? (
                <>
                  {geoTop.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[#4b5568]">
                        <MapPin className="size-3.5 text-[#0F766E]" />
                        {g.label}
                      </span>
                      <b className="text-[#111827]">{pct(g.n, geoTotal)}%</b>
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[#4b5568]">
                      <MapPin className="size-3.5 text-[#8b93a7]" />
                      Boshqa
                    </span>
                    <b className="text-[#111827]">{pct(geoOther, geoTotal)}%</b>
                  </li>
                </>
              ) : (
                <li className="text-[#8b93a7]">Ma’lumot yo‘q.</li>
              )}
            </ul>
          </div>
        </Panel>

        <Panel title="Mijozlar soni">
          <div className="mt-4 flex items-center gap-5">
            <Donut
              size={130}
              parts={[
                { label: "Yangi", value: newCust, color: "#0F766E" },
                { label: "Doimiy", value: data.returning, color: "#7c3aed" },
              ]}
              center={
                <div>
                  <p className="text-[22px] leading-none font-extrabold text-[#111827]">{data.custTotal}</p>
                  <p className="mt-1 text-[10.5px] text-[#8b93a7]">mijoz</p>
                </div>
              }
            />
            <ul className="flex-1 space-y-3 text-[12.5px]">
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[#4b5568]">
                  <span className="size-2.5 rounded-full bg-[#0F766E]" />
                  Yangi mijozlar
                </span>
                <b className="text-[#111827]">{pct(newCust, data.custTotal)}%</b>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[#4b5568]">
                  <span className="size-2.5 rounded-full bg-[#7c3aed]" />
                  Doimiy mijozlar
                </span>
                <b className="text-[#111827]">{pct(data.returning, data.custTotal)}%</b>
              </li>
              <li className="text-[11px] leading-snug text-[#8b93a7]">Doimiy — telefon raqami bo‘yicha 2 va undan ko‘p buyurtma bergan mijoz.</li>
            </ul>
          </div>
        </Panel>
      </div>
    </div>
  );
}
