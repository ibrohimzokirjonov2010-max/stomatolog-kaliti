"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Hammer,
  MessageSquare,
  Package,
  Plus,
  ShoppingBag,
  ShieldAlert,
  Star,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { ShopAvatar } from "@/components/seller-ui";
import { cabinetHref, type CabinetTab } from "@/components/seller-cabinet-nav";
import { shopHref, type Shop } from "@/data/shops";
import { formatMoney } from "@/lib/format";
import { orderStatusLabel, statusBadgeClass, type Order } from "@/lib/orders";
import { topSoldProducts } from "@/lib/seller-work";
import { useReviewSummary } from "@/lib/use-seller-live";
import { cn } from "@/lib/utils";

/* ───────────── helpers ───────────── */

export function orderSum(order: Order, shopId: string) {
  const mine = order.items.filter((i) => i.shopId === shopId);
  const lines = mine.length ? mine : order.items;
  return lines.reduce((a, i) => a + i.price * i.qty, 0);
}

type Mode = "day" | "week" | "month" | "year";
const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
const pad = (n: number) => String(n).padStart(2, "0");

function buildSeries(orders: Order[], shopId: string, mode: Mode) {
  const now = new Date();
  const starts: Date[] = [];
  if (mode === "day") {
    for (let i = 6; i >= 0; i -= 1) starts.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
  } else if (mode === "week") {
    const dow = (now.getDay() + 6) % 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow);
    for (let i = 7; i >= 0; i -= 1) starts.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - i * 7));
  } else if (mode === "month") {
    for (let i = 11; i >= 0; i -= 1) starts.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  } else {
    for (let i = 2; i >= 0; i -= 1) starts.push(new Date(now.getFullYear() - i, 0, 1));
  }
  const pts = starts.map((d) => ({
    label:
      mode === "month" ? MONTHS[d.getMonth()] : mode === "year" ? String(d.getFullYear()) : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`,
    total: 0,
    count: 0,
  }));
  for (const o of orders) {
    const t = new Date(o.createdAt).getTime();
    if (!Number.isFinite(t)) continue;
    let idx = -1;
    for (let i = 0; i < starts.length; i += 1) if (t >= starts[i].getTime()) idx = i;
    if (idx < 0) continue;
    pts[idx].total += orderSum(o, shopId);
    pts[idx].count += 1;
  }
  return pts;
}

function Spark({ values, color = "#0066FF" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const w = 84;
  const h = 32;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - (v / max) * (h - 8)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-[84px]" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-[#eceff5] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[15.5px] font-bold text-[#0B1F4D]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Tag({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "blue" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
        tone === "blue" ? "bg-[#e8f1ff] text-[#0066FF]" : "bg-[#f1f4f9] text-[#8b93a7]",
      )}
    >
      {children}
    </span>
  );
}

/* ───────────── area chart ───────────── */

function SalesChart({ orders, shopId }: { orders: Order[]; shopId: string }) {
  const [mode, setMode] = useState<Mode>("day");
  const [hover, setHover] = useState<number | null>(null);
  const pts = useMemo(() => buildSeries(orders, shopId, mode), [orders, shopId, mode]);
  const max = Math.max(...pts.map((p) => p.total), 1);
  const niceMax = (() => {
    const pow = 10 ** Math.floor(Math.log10(max));
    return Math.ceil(max / pow) * pow;
  })();
  const W = 600;
  const H = 220;
  const x = (i: number) => ((i + 0.5) / pts.length) * W;
  const y = (v: number) => H - 10 - (v / niceMax) * (H - 24);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;
  const total = pts.reduce((a, p) => a + p.total, 0);
  const count = pts.reduce((a, p) => a + p.count, 0);
  const active = hover ?? pts.length - 1;
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(niceMax * f));
  const short = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)} mln` : n >= 1000 ? `${Math.round(n / 1000)} ming` : String(n));
  const modes: [Mode, string][] = [["day", "Kun"], ["week", "Hafta"], ["month", "Oy"], ["year", "Yil"]];

  return (
    <Panel
      title="Savdo dinamikasi"
      className="min-w-0"
      action={
        <div className="flex rounded-xl bg-[#f1f4f9] p-0.5">
          {modes.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                setHover(null);
              }}
              className={cn(
                "h-8 rounded-[10px] px-3.5 text-[12.5px] font-semibold transition",
                mode === id ? "bg-white text-[#0066FF] shadow-sm" : "text-[#6b7280] hover:text-[#1a1d26]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      }
    >
      <p className="mt-0.5 text-[12.5px] text-[#8b93a7]">
        Jami: <span className="font-semibold text-[#1a1d26]">{formatMoney(total, "UZS")}</span> · {count} ta buyurtma
      </p>
      <div className="mt-4 flex gap-3">
        <div className="flex h-[220px] w-[52px] shrink-0 flex-col justify-between pb-0.5 text-right text-[11px] text-[#a3abbd]">
          {ticks.map((t, i) => (
            <span key={i}>{short(t)}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-[220px]" onMouseLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
              <defs>
                <linearGradient id="sk-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0066FF" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#0066FF" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <line key={f} x1="0" x2={W} y1={y(niceMax * f)} y2={y(niceMax * f)} stroke="#eef1f6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
              <path d={area} fill="url(#sk-area)" />
              <path d={line} fill="none" stroke="#0066FF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="absolute inset-0 flex">
              {pts.map((p, i) => (
                <div key={i} className="relative flex-1" onMouseEnter={() => setHover(i)}>
                  {i === active ? (
                    <>
                      <span className="absolute inset-y-0 left-1/2 w-px bg-[#0066FF]/25" />
                      <span
                        className="absolute left-1/2 size-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-[#0066FF] bg-white"
                        style={{ bottom: `${((H - y(p.total)) / H) * 100}%` }}
                      />
                    </>
                  ) : null}
                </div>
              ))}
            </div>
            {pts[active] ? (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-[#0B1F4D] px-3 py-1.5 text-center text-white shadow-lg"
                style={{
                  left: `${Math.min(88, Math.max(12, ((active + 0.5) / pts.length) * 100))}%`,
                  bottom: `calc(${((H - y(pts[active].total)) / H) * 100}% + 14px)`,
                }}
              >
                <span className="block text-[10.5px] text-white/70">{pts[active].label}</span>
                <span className="block whitespace-nowrap text-[12.5px] font-bold">{formatMoney(pts[active].total, "UZS")}</span>
                <span className="block text-[10.5px] text-white/70">{pts[active].count} ta buyurtma</span>
              </div>
            ) : null}
          </div>
          <div className="mt-2 flex">
            {pts.map((p, i) => (
              <span key={i} className="flex-1 text-center text-[11px] text-[#8b93a7]">
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ───────────── main overview ───────────── */

export function SellerOverviewDesktop({ shop, onAdd }: { shop: Shop; onAdd: () => void }) {
  const { shopOrders, myProducts, stats } = useSellerWork();
  const shopId = shop.id;
  const orders = shopOrders;
  const rating = useReviewSummary();

  const week = useMemo(() => buildSeries(orders, shopId, "day"), [orders, shopId]);
  const today = week[week.length - 1];
  const newOrders = orders.filter((o) => o.status === "pending_accept").length;
  const lowStock = myProducts.filter((p) => p.active !== false && (p.stockQty ?? 0) > 0 && (p.stockQty ?? 0) <= 5).length;
  const outStock = myProducts.filter((p) => p.active !== false && (p.stockQty ?? 0) <= 0).length;
  const openDisputes = orders.filter((o) => o.dispute?.status === "open").length;
  const top = useMemo(() => topSoldProducts(orders, shopId, myProducts, 4), [orders, shopId, myProducts]);
  const recent = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 4),
    [orders],
  );

  const checks = [
    { label: "Do‘kon nomi", ok: Boolean(shop.name?.trim()) },
    { label: "Tavsif", ok: (shop.bio ?? "").trim().length >= 20 },
    { label: "Telefon", ok: Boolean(shop.phone?.trim()) },
    { label: "Manzil", ok: Boolean(shop.address?.trim()) },
    { label: "Logo", ok: Boolean(shop.logo) },
    { label: "Ijtimoiy tarmoq", ok: Boolean(shop.telegram || shop.instagram || shop.facebook || shop.website) },
    { label: "Tajriba (yil)", ok: shop.yearsInBusiness != null && Number(shop.yearsInBusiness) > 0 },
  ];
  const done = checks.filter((c) => c.ok).length;
  const pct = Math.round((done / checks.length) * 100);

  const attention: { icon: LucideIcon; tone: string; count: number; title: string; sub: string; tab?: CabinetTab; soon?: boolean }[] = [
    { icon: ShoppingBag, tone: newOrders ? "red" : "green", count: newOrders, title: "yangi buyurtma", sub: newOrders ? "Tasdiqlashingiz kerak" : "Yangi buyurtma yo‘q", tab: "orders" },
    { icon: AlertTriangle, tone: lowStock ? "orange" : "green", count: lowStock, title: "kam qolgan mahsulot", sub: lowStock ? "Omborni to‘ldiring" : "Zaxira yetarli", tab: "products" },
    { icon: Hammer, tone: "gray", count: 0, title: "moderatsiyadagi mahsulot", sub: "Moderatsiya hali yo‘q", soon: true },
    { icon: XCircle, tone: "gray", count: 0, title: "rad etilgan mahsulot", sub: "Rad etish hali yo‘q", soon: true },
  ];
  if (outStock) attention.push({ icon: Package, tone: "red", count: outStock, title: "tugagan mahsulot", sub: "Zaxirani yangilang", tab: "products" });
  if (openDisputes) attention.push({ icon: ShieldAlert, tone: "red", count: openDisputes, title: "ochiq nizo", sub: "Buyurtmalarni tekshiring", tab: "orders" });
  const toneCls: Record<string, string> = {
    red: "bg-[#fef2f2] text-[#ef4444]",
    orange: "bg-[#fff7ed] text-[#f97316]",
    green: "bg-[#ecfdf3] text-[#16a34a]",
    gray: "bg-[#f1f4f9] text-[#8b93a7]",
  };

  return (
    <div className="space-y-4">
      {/* profile card */}
      <section className="relative overflow-hidden rounded-2xl border border-[#eceff5] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-stretch">
          <div className="min-w-0 flex-1 p-6">
            <div className="flex items-start gap-4">
              <ShopAvatar shop={shop} className="size-[72px] text-[26px]" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[22px] font-extrabold tracking-tight text-[#0B1F4D]">{shop.name}</h1>
                  {shop.verified === "active" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#15803d]">
                      <BadgeCheck className="size-3.5" />
                      Tasdiqlangan
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-[13px] text-[#6b7280]">
                  {shop.city}
                  {shop.yearsInBusiness ? ` · ${shop.yearsInBusiness} yil tajriba` : ""}
                  {shop.telegram ? ` · ${shop.telegram}` : shop.instagram ? ` · ${shop.instagram}` : ""}
                </p>
                <p className="mt-1.5 line-clamp-2 max-w-[560px] text-[13.5px] leading-relaxed text-[#4b5568]">{shop.bio}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#fff7e6] text-[#f59e0b]">
                  <Star className="size-[18px]" />
                </span>
                <div>
                  <p className="text-[16px] font-bold leading-tight text-[#1a1d26]">{rating.avg != null ? rating.avg.toFixed(1) : "—"}</p>
                  <p className="text-[11.5px] text-[#8b93a7]">{rating.count ? `Reyting · ${rating.count} ta sharh` : "Reyting · hali sharh yo‘q"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#0066FF]">
                  <ShoppingBag className="size-[18px]" />
                </span>
                <div>
                  <p className="text-[16px] font-bold leading-tight text-[#1a1d26]">{orders.length}</p>
                  <p className="text-[11.5px] text-[#8b93a7]">Buyurtmalar</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#ecfdf3] text-[#16a34a]">
                  <CheckCircle2 className="size-[18px]" />
                </span>
                <div>
                  <p className="text-[16px] font-bold leading-tight text-[#1a1d26]">—</p>
                  <p className="text-[11.5px] text-[#8b93a7]">Ijobiy sharhlar · tez orada</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2.5">
                <Link
                  href={shopHref(shop.slug)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#e3e8f1] bg-white px-4 text-[13.5px] font-semibold text-[#1a1d26] hover:bg-[#f7f9fc]"
                >
                  <Eye className="size-4" />
                  Do‘konni ko‘rish
                </Link>
                <button
                  type="button"
                  onClick={onAdd}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0066FF] px-4 text-[13.5px] font-bold text-white shadow-[0_6px_14px_rgba(0,102,255,0.25)] hover:bg-[#0058dd]"
                >
                  <Plus className="size-4" />
                  Mahsulot qo‘shish
                </button>
              </div>
            </div>
          </div>
          <div className="relative hidden w-[300px] shrink-0 overflow-hidden bg-gradient-to-br from-[#0b4fd6] via-[#0066FF] to-[#4a98ff] xl:block">
            <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_80%_20%,#fff_0,transparent_45%)]" />
            <div className="relative z-10 p-6 text-white">
              <p className="text-[16px] font-extrabold leading-snug">Sifatli materiallar ishonchli stomatologlar uchun</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/clinic/tooth-key.png" alt="" className="absolute -right-3 -bottom-3 h-[150px] w-auto object-contain drop-shadow-xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/product-composite.png" alt="" className="absolute bottom-3 left-4 h-[72px] w-auto rounded-lg bg-white/90 object-contain p-1.5 shadow-md" />
          </div>
        </div>
      </section>

      {/* stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatBox icon={Wallet} tone="blue" label="Bugungi savdo" value={formatMoney(today?.total ?? 0, "UZS")} sub={`${today?.count ?? 0} ta buyurtmadan`}>
          <Spark values={week.map((d) => d.total)} />
        </StatBox>
        <StatBox icon={ShoppingBag} tone="green" label="Buyurtmalar" value={String(orders.length)} sub={newOrders ? `${newOrders} ta yangi` : "Yangi yo‘q"} subTone={newOrders ? "green" : "gray"}>
          <Spark values={week.map((d) => d.count)} color="#16a34a" />
        </StatBox>
        <StatBox icon={Package} tone="purple" label="Mahsulotlar" value={String(stats.products)} sub={`${stats.active} ta faol`} subTone="green" />
        <StatBox icon={Eye} tone="orange" label="Ko‘rishlar" value={String(stats.views)} sub="Do‘kon sahifasi">
          <Tag>Jami</Tag>
        </StatBox>
      </div>

      {/* chart + attention + profile completeness */}
      <div className="grid grid-cols-[minmax(0,1fr)_330px] gap-4 xl:grid-cols-[minmax(0,1fr)_320px_300px]">
        <div className="min-w-0 xl:col-span-1">
          <SalesChart orders={orders} shopId={shopId} />
        </div>
        <Panel title="E’tibor talab qiladi" className="min-w-0">
          <ul className="mt-3 space-y-2.5">
            {attention.map((a) => {
              const Row = (
                <>
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", toneCls[a.tone])}>
                    <a.icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#1a1d26]">
                      {a.count} ta {a.title}
                    </span>
                    <span className="block truncate text-[11.5px] text-[#8b93a7]">{a.sub}</span>
                  </span>
                  {a.soon ? <Tag>Tez orada</Tag> : <ArrowRight className="size-4 shrink-0 text-[#c0c7d6]" />}
                </>
              );
              return (
                <li key={a.title}>
                  {a.tab ? (
                    <Link href={cabinetHref(a.tab)} scroll={false} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-[#f7f9fc]">
                      {Row}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 p-1.5">{Row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Profil to‘liqligi" className="col-span-2 min-w-0 xl:col-span-1">
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#eef1f6]">
              <div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[15px] font-bold text-[#16a34a]">{pct}%</span>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 xl:grid-cols-1">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-[13px] text-[#1a1d26]">
                {c.ok ? (
                  <span className="flex size-[18px] items-center justify-center rounded-full bg-[#22c55e] text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="flex size-[18px] items-center justify-center rounded-full border-2 border-[#d6dbe6]" />
                )}
                <span className={c.ok ? "" : "text-[#8b93a7]"}>{c.label}</span>
              </li>
            ))}
          </ul>
          <Link
            href={cabinetHref("profile")}
            scroll={false}
            className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-[#0066FF] text-[13.5px] font-bold text-white hover:bg-[#0058dd]"
          >
            Profilni tahrirlash
          </Link>
        </Panel>
      </div>

      {/* bottom */}
      <div className="grid grid-cols-3 gap-4">
        <Panel
          title="Eng ko‘p sotilgan mahsulotlar"
          action={
            <Link href={cabinetHref("products")} scroll={false} className="text-[12.5px] font-semibold text-[#0066FF] hover:underline">
              Barchasi
            </Link>
          }
        >
          {top.length ? (
            <ul className="mt-3 space-y-3">
              {top.map((r) => (
                <li key={r.productId + r.name} className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f7f9fc]">
                    {r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt="" className="size-full object-contain p-1" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#1a1d26]">{r.name}</span>
                    <span className="block text-[11.5px] text-[#8b93a7]">{r.qty} dona sotilgan</span>
                  </span>
                  <span className="shrink-0 text-[12.5px] font-bold text-[#1a1d26]">{formatMoney(r.revenue, "UZS")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="Hali sotuv yo‘q" />
          )}
        </Panel>

        <Panel
          title="So‘nggi buyurtmalar"
          action={
            <Link href={cabinetHref("orders")} scroll={false} className="text-[12.5px] font-semibold text-[#0066FF] hover:underline">
              Barchasi
            </Link>
          }
        >
          {recent.length ? (
            <ul className="mt-3 space-y-3">
              {recent.map((o) => {
                const d = new Date(o.createdAt);
                return (
                  <li key={o.id} className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#0066FF]">
                      <ShoppingBag className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#1a1d26]">{o.id}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1", statusBadgeClass(o.status))}>
                          {orderStatusLabel[o.status]}
                        </span>
                      </span>
                      <span className="block text-[11.5px] text-[#8b93a7]">
                        {pad(d.getDate())}.{pad(d.getMonth() + 1)}.{d.getFullYear()}, {pad(d.getHours())}:{pad(d.getMinutes())}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12.5px] font-bold text-[#1a1d26]">{formatMoney(orderSum(o, shopId), "UZS")}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty text="Hali buyurtma yo‘q" />
          )}
        </Panel>

        <Panel title="Xabarlar" action={<Tag>Tez orada</Tag>}>
          <div className="mt-3 flex flex-col items-center justify-center rounded-xl bg-[#f7f9fc] px-4 py-8 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-white text-[#0066FF] shadow-sm">
              <MessageSquare className="size-5" />
            </span>
            <p className="mt-3 text-[13.5px] font-semibold text-[#1a1d26]">Xaridorlar bilan yozishma</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#8b93a7]">Xabarlar tizimi hali ishga tushmagan. Hozircha buyurtma sahifasidagi aloqa ma’lumotlaridan foydalaning.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#f7f9fc] px-4 py-10 text-[13px] text-[#8b93a7]">
      <Clock className="size-4" />
      {text}
    </div>
  );
}

function StatBox({
  icon: Icon,
  tone,
  label,
  value,
  sub,
  subTone = "gray",
  children,
}: {
  icon: LucideIcon;
  tone: "blue" | "green" | "purple" | "orange";
  label: string;
  value: string;
  sub: string;
  subTone?: "green" | "gray";
  children?: ReactNode;
}) {
  const t = {
    blue: "bg-[#e8f1ff] text-[#0066FF]",
    green: "bg-[#ecfdf3] text-[#16a34a]",
    purple: "bg-[#f3ecff] text-[#7c3aed]",
    orange: "bg-[#fff2e6] text-[#f97316]",
  }[tone];
  return (
    <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", t)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] text-[#6b7280]">{label}</p>
          <p className="truncate text-[21px] leading-tight font-extrabold tracking-tight text-[#0B1F4D]">{value}</p>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
            subTone === "green" ? "bg-[#ecfdf3] text-[#15803d]" : "bg-[#f1f4f9] text-[#6b7280]",
          )}
        >
          {sub}
        </span>
        {children}
      </div>
    </div>
  );
}

export function SoonPanel({ tab, label, icon: Icon }: { tab: CabinetTab; label: string; icon: LucideIcon }) {
  return (
    <section className="mx-auto mt-6 max-w-[520px] rounded-2xl border border-[#eceff5] bg-white px-8 py-14 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)]" data-tab={tab}>
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#0066FF]">
        <Icon className="size-8" />
      </span>
      <h1 className="mt-5 text-[22px] font-extrabold text-[#0B1F4D]">{label}</h1>
      <p className="mt-1 inline-block rounded-full bg-[#fff7e6] px-3 py-0.5 text-[12px] font-bold text-[#b45309]">Tez orada</p>
      <p className="mt-3 text-[13.5px] leading-relaxed text-[#6b7280]">Bu bo‘lim hozircha ishga tushmagan. Tayyor bo‘lganda shu yerda ko‘rinadi.</p>
      <Link href={cabinetHref("overview")} scroll={false} className="mt-6 inline-flex h-10 items-center rounded-xl bg-[#0066FF] px-5 text-[13.5px] font-bold text-white hover:bg-[#0058dd]">
        Umumiyga qaytish
      </Link>
    </section>
  );
}
