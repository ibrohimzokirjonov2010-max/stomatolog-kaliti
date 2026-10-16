"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Handshake,
  Heart,
  Home,
  LayoutGrid,
  MapPin,
  Megaphone,
  Plus,
  Search,
  ShoppingBag,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useJobsWork } from "@/components/jobs-provider";
import { useSurplusWork } from "@/components/surplus-provider";
import { useUstaWork } from "@/components/usta-provider";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CrmTitle, selectCls } from "./crm-shared";

type Kind = "sotiladi" | "ijara" | "ish" | "xizmat" | "hamkorlik";
type Ad = {
  id: string;
  kind: Kind;
  title: string;
  city: string;
  /** ISO date, when known */
  date?: string;
  /** null → "Kelishiladi" */
  price: number | null;
  perMonth?: boolean;
  image?: string;
  href: string;
};

const KINDS: { id: "" | Kind; label: string; icon: LucideIcon }[] = [
  { id: "", label: "Barcha e’lonlar", icon: LayoutGrid },
  { id: "sotiladi", label: "Sotiladi", icon: ShoppingBag },
  { id: "ijara", label: "Ijaraga", icon: Home },
  { id: "ish", label: "Ish o‘rni", icon: BriefcaseBusiness },
  { id: "xizmat", label: "Xizmatlar", icon: Wrench },
  { id: "hamkorlik", label: "Hamkorlik", icon: Handshake },
];
const BADGE: Record<Kind, { label: string; cls: string }> = {
  sotiladi: { label: "Sotiladi", cls: "bg-[#22b07d]" },
  ijara: { label: "Ijaraga", cls: "bg-[#2f6bff]" },
  ish: { label: "Ish o‘rni", cls: "bg-[#ff7a2f]" },
  xizmat: { label: "Xizmatlar", cls: "bg-[#7c5cff]" },
  hamkorlik: { label: "Hamkorlik", cls: "bg-[#0ea5b7]" },
};
const POST_HREF: Record<Kind | "", string> = {
  "": "/ortiqcha-material/elonlarim",
  sotiladi: "/ortiqcha-material/elonlarim",
  ijara: "/ortiqcha-material/elonlarim",
  ish: "/ishlar/vakansiyalarim",
  xizmat: "/ustalar/mening",
  hamkorlik: "/ortiqcha-material/elonlarim",
};

const fmt = (iso?: string) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "");

/**
 * One feed over the existing real sources: surplus listings (Sotiladi), vacancies (Ish o‘rni)
 * and masters (Xizmatlar). Ijaraga / Hamkorlik have no data source yet, so they show 0.
 */
export function ElonlarPage() {
  const { feed } = useSurplusWork();
  const { catalog: jobs } = useJobsWork();
  const { masters } = useUstaWork();
  const [kind, setKind] = useState<"" | Kind>("");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [liked, setLiked] = useState<string[]>([]);

  const ads = useMemo<Ad[]>(() => {
    const a: Ad[] = [
      ...feed.map((s) => ({
        id: `s-${s.id}`,
        kind: "sotiladi" as const,
        title: s.name,
        city: s.city,
        date: s.createdAt,
        price: s.price || null,
        image: s.image,
        href: `/ortiqcha-material/${s.id}`,
      })),
      ...jobs
        .filter((j) => j.status !== "yopiq")
        .map((j) => ({
          id: `j-${j.id}`,
          kind: "ish" as const,
          title: j.title,
          city: j.city,
          date: j.createdAt,
          price: j.salaryMin || null,
          perMonth: true,
          image: j.photos?.[0],
          href: `/ishlar/${j.id}`,
        })),
      ...masters.map((m) => ({
        id: `m-${m.id}`,
        kind: "xizmat" as const,
        title: m.title || m.name,
        city: m.city,
        date: m.createdAt,
        price: null,
        image: m.works?.[0] ?? m.photo ?? undefined,
        href: `/ustalar/${m.id}`,
      })),
    ];
    return a.sort((x, y) => (y.date ?? "").localeCompare(x.date ?? ""));
  }, [feed, jobs, masters]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { "": ads.length };
    for (const a of ads) c[a.kind] = (c[a.kind] ?? 0) + 1;
    return c;
  }, [ads]);
  const cityCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of ads) if (a.city) m.set(a.city, (m.get(a.city) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [ads]);

  const visible = ads.filter((a) => {
    if (kind && a.kind !== kind) return false;
    if (city && a.city !== city) return false;
    if (q.trim() && !a.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
    if (price === "free" && a.price != null) return false;
    if (price === "lt1" && !(a.price != null && a.price < 1_000_000)) return false;
    if (price === "1-10" && !(a.price != null && a.price >= 1_000_000 && a.price <= 10_000_000)) return false;
    if (price === "gt10" && !(a.price != null && a.price > 10_000_000)) return false;
    return true;
  });

  return (
    <div>
      <div className="min-w-0">
        <CrmTitle
          title="E’lonlar"
          subtitle="Stomatologiya sohasidagi e’lonlar: sotiladi, ijaraga, ish o‘rni va boshqalar"
          actions={
            <Link href={POST_HREF[kind]} className="hidden h-11 items-center gap-2 rounded-xl bg-[#0066FF] px-6 text-[13.5px] font-semibold text-white hover:bg-[#0057d9] lg:flex">
              <Plus className="size-4" /> E’lon joylashtirish
            </Link>
          }
        />
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-6 lg:px-0">
              {KINDS.map((k) => {
                const Icon = k.icon;
                const on = kind === k.id;
                return (
                  <button
                    key={k.id || "all"}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-xl border bg-white px-3.5 py-2 transition-colors lg:flex-col lg:gap-1 lg:py-3",
                      on ? "border-[#0066FF] bg-[#f3f8ff] shadow-[0_2px_10px_rgba(0,102,255,0.12)]" : "border-[#eceff5] hover:border-[#0066FF]/40",
                    )}
                  >
                    <Icon className={cn("size-5 lg:size-6", on ? "text-[#0066FF]" : "text-[#4a5470]")} strokeWidth={1.6} />
                    <span className={cn("text-[12.5px] font-semibold whitespace-nowrap", on ? "text-[#0066FF]" : "text-[#1f2a44]")}>{k.label}</span>
                    <span className="text-[12px] font-bold text-[#0B1F4D]">{counts[k.id] ?? 0}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <label className="relative min-w-0 flex-1 max-lg:basis-full">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#0066FF]" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kalit so‘z bo‘yicha qidirish..." className="h-10 w-full rounded-xl border border-[#e6eaf2] bg-white pr-3 pl-10 text-[12.5px] outline-none focus:border-[#0066FF]" />
              </label>
              <label className="relative hidden w-[150px] lg:block">
                <select value={kind} onChange={(e) => setKind(e.target.value as "" | Kind)} className={selectCls}>
                  <option value="">Barcha toifalar</option>
                  {KINDS.slice(1).map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </label>
              <label className="relative flex-1 lg:w-[150px] lg:flex-none">
                <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
                  <option value="">Barcha shaharlar</option>
                  {cityCounts.map(([c]) => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </label>
              <label className="relative flex-1 lg:w-[150px] lg:flex-none">
                <select value={price} onChange={(e) => setPrice(e.target.value)} className={selectCls}>
                  <option value="">Narx (so‘m)</option>
                  <option value="lt1">1 mln gacha</option>
                  <option value="1-10">1 – 10 mln</option>
                  <option value="gt10">10 mln dan yuqori</option>
                  <option value="free">Kelishiladi</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </label>
            </div>

            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d9e0ec] bg-white px-6 py-14 text-center">
                <Megaphone className="mx-auto size-10 text-[#0066FF]" strokeWidth={1.5} />
                <p className="mt-3 text-[15px] font-semibold text-[#0B1F4D]">Bu toifada hozircha e’lon yo‘q</p>
                <Link href={POST_HREF[kind]} className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0066FF] px-4 text-[13px] font-semibold text-white">
                  <Plus className="size-4" /> E’lon joylashtirish
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {visible.map((a) => (
                  <article key={a.id} className="relative flex overflow-hidden rounded-2xl border border-[#eceff5] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] max-sm:gap-3 max-sm:p-2.5 sm:flex-col sm:p-2">
                    <Link href={a.href} className="relative block shrink-0 overflow-hidden rounded-xl bg-[#f4f6fa] max-sm:h-[104px] max-sm:w-[40%] sm:aspect-[4/3]">
                      {a.image ? <Image src={a.image} alt="" fill sizes="(min-width:1280px) 20vw, 50vw" className="object-cover" /> : <div className="grid h-full place-items-center"><Megaphone className="size-7 text-[#c3cad8]" /></div>}
                      <span className={cn("absolute top-2 left-2 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white", BADGE[a.kind].cls)}>{BADGE[a.kind].label}</span>
                    </Link>
                    <button
                      type="button"
                      aria-label="Saqlash"
                      onClick={() => setLiked(liked.includes(a.id) ? liked.filter((x) => x !== a.id) : [...liked, a.id])}
                      className="absolute top-4 right-4 grid size-7 place-items-center rounded-full bg-white shadow-sm"
                    >
                      <Heart className={cn("size-4", liked.includes(a.id) ? "fill-[#FF3B3B] text-[#FF3B3B]" : "text-[#1f2a44]")} />
                    </button>
                    <div className="flex min-w-0 flex-1 flex-col sm:px-1 sm:pt-2.5 sm:pb-1">
                      <Link href={a.href} className="line-clamp-2 text-[13.5px] leading-snug font-bold text-[#0B1F4D] hover:text-[#0066FF]">{a.title}</Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#6b7590]">
                        {a.city ? <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {a.city}</span> : null}
                        {a.date ? <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {fmt(a.date)}</span> : null}
                      </div>
                      <div className="mt-auto pt-2 text-[15px] font-extrabold text-[#0066FF]">
                        {a.price == null ? "Kelishiladi" : `${formatMoney(a.price, "UZS")}${a.perMonth ? " / oy" : ""}`}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="sticky top-0 hidden w-[230px] shrink-0 space-y-3 xl:block">
            <div className="rounded-2xl border border-[#eceff5] bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <h3 className="mb-2 text-[14px] font-bold text-[#0B1F4D]">Ommabop shaharlar</h3>
              {cityCounts.length === 0 ? (
                <p className="py-3 text-center text-[12px] text-[#8b93a7]">Ma’lumot yo‘q</p>
              ) : (
                <ul>
                  {cityCounts.slice(0, 6).map(([c, n]) => (
                    <li key={c}>
                      <button type="button" onClick={() => setCity(city === c ? "" : c)} className={cn("flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-[12.5px]", city === c ? "bg-[#f3f8ff] text-[#0066FF]" : "text-[#1f2a44]")}>
                        <MapPin className="size-3.5 text-[#6b7590]" /> {c}
                        <span className="ml-auto text-[#6b7590]">{n}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border border-[#eceff5] bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <h3 className="mb-2 text-[14px] font-bold text-[#0B1F4D]">So‘nggi e’lonlar</h3>
              <ul className="space-y-2.5">
                {ads.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <Link href={a.href} className="flex items-center gap-2.5">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-[#f4f6fa]">
                        {a.image ? <Image src={a.image} alt="" fill sizes="48px" className="object-cover" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-semibold text-[#0B1F4D]">{a.title}</span>
                        <span className="block text-[11.5px] font-bold text-[#d93b3b]">{a.price == null ? "Kelishiladi" : formatMoney(a.price, "UZS")}</span>
                        <span className="block text-[10.5px] text-[#8b93a7]">{a.city}{a.date ? ` • ${fmt(a.date)}` : ""}</span>
                      </span>
                      <ChevronRight className="ml-auto size-4 shrink-0 text-[#9aa3b2]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
      <Link href={POST_HREF[kind]} aria-label="E’lon joylashtirish" className="fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-[0_8px_24px_rgba(0,102,255,0.4)] lg:hidden">
        <Plus className="size-6" />
      </Link>
    </div>
  );
}
