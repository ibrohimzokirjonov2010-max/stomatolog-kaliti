"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Building2,
  CalendarDays,
  ChevronRight,
  Layers,
  Crown,
  Cross,
  MapPin,
  Plus,
  Scissors,
  Search,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { SeminarStatusBadge } from "@/components/seminar-status";
import { MobileSectionHeader, mobileHeaderActionCls } from "@/components/mobile-section-header";
import { useSeminarRegs } from "@/components/seminar-provider";
import {
  compareListed,
  featuredSeminar,
  isSeminarUpcoming,
  seminarSeatsShort,
  seminarCities,
  seminarHref,
  seminars,
  type Seminar,
  type SeminarCity,
} from "@/data/seminars";
import { formatMoney } from "@/lib/format";
import {
  discountPercent,
  inCategory,
  isCourse,
  isMasterClass,
  leadSpeaker,
  type SeminarCategory,
  type SeminarTag,
} from "@/lib/seminar-mobile";
import { toggleSavedSeminar, useSavedSeminars } from "@/lib/seminar-saved";
import { cn } from "@/lib/utils";
import { seminarDate } from "@/data/seminars";

/** Filter keys shared by the pill tabs and the category tiles (one source of truth). */
type CatKey = "" | SeminarCategory | "restavratsiya";
type Format = "all" | "online" | "offline";
type Kind = "all" | "master" | "course" | "kongress";

const toneClass: Record<SeminarTag["tone"], string> = {
  blue: "bg-[#e8f1ff] text-[#0066FF]",
  green: "bg-[#e3f8ec] text-[#0f9d58]",
  violet: "bg-[#f0e9ff] text-[#7c3aed]",
  orange: "bg-[#fff1e0] text-[#e8730c]",
};

export function ToothOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4.2c-2.1 0-3.8 1.3-3.8 3.1 0 1-.3 2.3-.8 3.6-.6 1.5-1.2 3-1.2 4.4 0 1.9 1.4 3.2 3 3.2 1 0 1.6-.5 2.8-.5s1.8.5 2.8.5c1.6 0 3-1.3 3-3.2 0-1.4-.6-2.9-1.2-4.4-.5-1.3-.8-2.6-.8-3.6 0-1.8-1.7-3.1-3.8-3.1z" />
    </svg>
  );
}

/** Real (owner-supplied) seminars show their venue; demo/organizer cards keep the city. */
export function cardPlace(s: Seminar) {
  if (s.city === "Online") return "Online";
  return !s.demo && !s.remote && s.venue ? s.venue : s.city;
}

const restavrRe = /restavr|kompozit|vinir|veneer/;

function matchesCat(s: Seminar, c: CatKey) {
  if (!c) return true;
  if (c === "restavratsiya") return s.specialty === "estetika" || restavrRe.test(`${s.title} ${s.description ?? ""}`.toLowerCase());
  return inCategory(s, c);
}

/** Owner-supplied brand icons (public/icons/seminar/*.png); tiles without one fall back to a blue line icon of matching size. */
const categoryTiles: { key: CatKey; label: string; img?: string; Icon: (p: { className?: string }) => ReactNode }[] = [
  { key: "", label: "Barchasi", img: "barchasi", Icon: ToothOutline },
  { key: "implantologiya", label: "Implantologiya", img: "implantologiya", Icon: Zap },
  { key: "endodontiya", label: "Endodontiya", img: "endodontiya", Icon: Cross },
  { key: "ortodontiya", label: "Ortodontiya", img: "ortodontiya", Icon: Smile },
  { key: "estetika", label: "Estetik stomatologiya", img: "estetik-stomatologiya", Icon: Sparkles },
  { key: "jarrohlik", label: "Jarrohlik", img: "jarrohlik", Icon: Scissors },
  { key: "restavratsiya", label: "Restavratsiya", Icon: Layers },
];

/** Card badges in the mock's wording — derived only from real catalog fields. */
export function cardTags(s: Seminar): SeminarTag[] {
  const tags: SeminarTag[] = [s.city === "Online" ? { label: "Onlayn", tone: "green" } : { label: "Oflayn", tone: "blue" }];
  if (s.badge) tags.push({ label: s.badge, tone: "violet" });
  else if (s.specialty === "kongress") tags.push({ label: "Kongress", tone: "orange" });
  else if (isMasterClass(s)) tags.push({ label: "Master-klass", tone: "violet" });
  else if (isCourse(s)) tags.push({ label: "Kurs", tone: "violet" });
  return tags;
}

export function TagPill({ tag, className }: { tag: SeminarTag; className?: string }) {
  return (
    <span className={cn("rounded-md px-1.5 py-[3px] text-[10.5px] leading-none font-bold", toneClass[tag.tone], className)}>
      {tag.label}
    </span>
  );
}

export function BookmarkButton({ id, className, onDark }: { id: string; className?: string; onDark?: boolean }) {
  const saved = useSavedSeminars().includes(id);
  return (
    <button
      type="button"
      aria-label={saved ? "Saqlanganlardan olib tashlash" : "Saqlash"}
      aria-pressed={saved}
      data-testid="seminar-bookmark"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSavedSeminar(id);
      }}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full",
        onDark ? "bg-white text-[#0B1F4D] shadow-sm" : "text-[#8b93a7]",
        className,
      )}
    >
      <Bookmark className={cn("size-[18px]", saved && "fill-[#0066FF] text-[#0066FF]")} />
    </button>
  );
}

/** Seminar cover with a neutral fallback (organizer seminars may have no image). */
export function SeminarCover({ src, sizes, className, gray }: { src?: string; sizes: string; className?: string; gray?: boolean }) {
  if (!src)
    return (
      <span className={cn("absolute inset-0 grid place-items-center bg-gradient-to-br from-[#e8f1ff] to-[#cfe0ff] text-[#0066FF]", className)}>
        <ToothOutline className="size-8" />
      </span>
    );
  return <Image src={src} alt="" fill sizes={sizes} className={cn("object-cover", gray && "grayscale", className)} />;
}

export function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h2 className="text-[16px] font-bold tracking-tight text-[#0B1F4D]">{title}</h2>
      {action}
    </div>
  );
}

/** Hero carousel card — blue gradient, speaker photo on the right. */
function HeroSlide({ seminar, top }: { seminar: Seminar; top: boolean }) {
  const { liveSeminar, seatsLeft, activeReg } = useSeminarRegs();
  const live = liveSeminar(seminar);
  const left = seatsLeft(seminar);
  const mine = activeReg(seminar.id);
  const sp = leadSpeaker(live);
  const photo = sp?.photo ?? live.heroImage ?? live.speakerAvatar;
  const date = seminarDate(live);
  return (
    <Link
      href={seminarHref(live.id)}
      data-testid="seminar-hero"
      className="relative block h-[200px] w-full shrink-0 snap-center overflow-hidden rounded-[20px] bg-gradient-to-br from-[#2f7bff] via-[#0a5cf0] to-[#0a3fb8] text-white shadow-[0_10px_26px_rgba(0,102,255,0.26)]"
    >
      <span className="pointer-events-none absolute -top-16 -left-10 size-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
      {photo ? (
        <div
          className="absolute inset-y-0 right-0 w-[44%]"
          style={{ WebkitMaskImage: "linear-gradient(to right, transparent, #000 30%)", maskImage: "linear-gradient(to right, transparent, #000 30%)" }}
        >
          <Image src={photo} alt="" fill sizes="190px" className="object-cover object-top" />
        </div>
      ) : null}
      <div className="relative z-10 flex h-full max-w-[64%] flex-col p-4 pb-4">
        <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-md bg-white/20 px-2 py-[5px] text-[9.5px] leading-none font-bold tracking-[0.06em] ring-1 ring-white/25">
          <Crown className="size-3" />
          {top ? "TOP SEMINAR" : "YAQIN SEMINAR"}
        </span>
        <h3 className="mt-2 line-clamp-2 shrink-0 text-[17.5px] leading-[1.22] font-bold">{live.title}</h3>
        <ul className="mt-1.5 shrink-0 space-y-[3px] text-[11.5px] text-white/90">
          <li className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" />
            {date.long}
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{cardPlace(live)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0" />
            {seminarSeatsShort(live)}
          </li>
        </ul>
        <span className="mt-auto inline-flex h-9 w-fit shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-[12.5px] font-bold text-[#0B1F4D] shadow-sm">
          {mine ? "Yozuvingiz" : left <= 0 ? "Batafsil" : "Ro‘yxatdan o‘tish"}
          <ArrowRight className="size-3.5" />
        </span>
      </div>
      {sp ? (
        <div className="absolute right-3 bottom-4 z-10 max-w-[42%] rounded-xl bg-[#0B1F4D]/45 px-2.5 py-1.5 text-right backdrop-blur-md">
          <p className="truncate text-[11px] leading-tight font-semibold">{sp.name}</p>
          <p className="truncate text-[10px] leading-tight text-white/80">{sp.role.split(",")[0]}</p>
        </div>
      ) : live.organizer ? (
        <div className="absolute right-3 bottom-4 z-10 max-w-[42%] rounded-xl bg-[#0B1F4D]/45 px-2.5 py-1.5 text-right backdrop-blur-md" data-testid="seminar-hero-organizer">
          <p className="truncate text-[11px] leading-tight font-semibold">{live.organizer}</p>
          <p className="truncate text-[10px] leading-tight text-white/80">Tashkilotchi</p>
        </div>
      ) : null}
    </Link>
  );
}

function HeroCarousel({ items }: { items: Seminar[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const topId = featuredSeminar().id;
  return (
    <section className="mb-4">
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((s) => (
          <HeroSlide key={s.id} seminar={s} top={s.id === topId} />
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        {items.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`${i + 1}-slayd`}
            onClick={() => ref.current?.scrollTo({ left: i * (ref.current?.clientWidth ?? 0), behavior: "smooth" })}
            className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-5 bg-[#0066FF]" : "w-1.5 bg-[#cdd5e4]")}
          />
        ))}
      </div>
    </section>
  );
}

function ListCard({ seminar }: { seminar: Seminar }) {
  const { liveSeminar, seatsLeft, activeReg } = useSeminarRegs();
  const live = liveSeminar(seminar);
  const left = seatsLeft(seminar);
  const mine = activeReg(seminar.id);
  const upcoming = isSeminarUpcoming(live);
  const sp = leadSpeaker(live);
  const date = seminarDate(live);
  const pct = discountPercent(live);
  const href = seminarHref(live.id);
  return (
    <article
      id={live.id}
      data-testid="seminar-card"
      className={cn("rounded-[18px] bg-white p-3 shadow-[0_2px_12px_rgba(15,23,42,0.05)] ring-1 ring-[#edf0f6]", !upcoming && "opacity-75")}
    >
      <div className="flex gap-3">
        <Link href={href} className="relative h-[92px] w-[112px] shrink-0 overflow-hidden rounded-[12px] bg-[#eef2f8]" aria-label={live.title}>
          <SeminarCover src={live.image} sizes="112px" gray={!upcoming} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex flex-wrap gap-1">
              {cardTags(live).map((t) => (
                <TagPill key={t.label} tag={t} />
              ))}
              {!upcoming ? <span className="rounded-md bg-[#eef0f4] px-1.5 py-[3px] text-[10.5px] leading-none font-bold text-[#6b7280]">O‘tgan</span> : null}
            </div>
            <BookmarkButton id={live.id} className="-mt-1.5 -mr-1.5" />
          </div>
          <Link href={href} className="mt-1 line-clamp-2 block text-[13.5px] leading-[1.28] font-bold text-[#0B1F4D]">
            {live.title}
          </Link>
          {sp ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              {sp.photo ? (
                <Image src={sp.photo} alt="" width={20} height={20} className="size-5 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[8.5px] font-bold text-[#0066FF]">{initials(sp.name)}</span>
              )}
              <p className="min-w-0 truncate text-[11px] leading-tight">
                <span className="font-semibold text-[#1a1d26]">{sp.name}</span>
                {sp.role ? <span className="text-[#8b93a7]"> · {sp.role.split(",")[0]}</span> : null}
              </p>
            </div>
          ) : null}
          {live.organizer ? (
            <div className="mt-1.5 flex items-center gap-1.5" data-testid="seminar-card-organizer">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[#0066FF]">
                <Building2 className="size-3" />
              </span>
              <p className="min-w-0 truncate text-[11px] leading-tight">
                <span className="font-semibold text-[#1a1d26]">{live.organizer}</span>
                <span className="text-[#8b93a7]"> · Tashkilotchi</span>
              </p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] whitespace-nowrap text-[#6b7280]">
            <span className="inline-flex shrink-0 items-center gap-1">
              <CalendarDays className="size-3.5 text-[#8b93a7]" />
              {live.dateTbd ? "Sana aniqlanmoqda" : `${date.dayNum} ${date.monthShort}, ${live.time}`}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0 text-[#8b93a7]" />
              <span>{cardPlace(live)}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Users className="size-3.5 text-[#8b93a7]" />
              {seminarSeatsShort(live, "ta")}
            </span>
          </div>
          {pct > 0 && live.oldPrice ? (
            <p className="mt-1.5 flex items-center gap-1.5">
              <span className="rounded-md bg-[#ff3b30] px-1.5 py-[3px] text-[10px] leading-none font-bold text-white">-{pct}%</span>
              <span className="text-[11px] text-[#9aa3b5] line-through">{formatMoney(live.oldPrice, "UZS")}</span>
            </p>
          ) : null}
          <p className={cn("text-[16px] leading-tight font-extrabold text-[#0B1F4D]", pct > 0 && live.oldPrice ? "mt-0.5" : "mt-1.5")}>
            {live.price > 0 ? formatMoney(live.price, "UZS") : "Bepul"}
          </p>
        </div>
        {!upcoming ? (
          <Link href={href} className="inline-flex h-[38px] shrink-0 items-center rounded-xl bg-[#f1f3f7] px-4 text-[12.5px] font-semibold text-[#4b5568]">
            Batafsil
          </Link>
        ) : mine ? (
          <Link href={href} className="inline-flex h-[38px] shrink-0 items-center gap-1.5 rounded-xl bg-[#f5f9ff] px-3 text-[12.5px] font-semibold text-[#0066FF]">
            <SeminarStatusBadge status={mine.status} />
          </Link>
        ) : left <= 0 ? (
          <span className="inline-flex h-[38px] shrink-0 items-center rounded-xl bg-[#f1f3f7] px-4 text-[12.5px] font-semibold text-[#8b93a7]">Joy qolmadi</span>
        ) : (
          <Link
            href={href}
            data-testid="seminar-card-register"
            className="inline-flex h-[38px] shrink-0 items-center gap-1 rounded-xl bg-[#0066FF] px-3 text-[12px] font-semibold text-white shadow-[0_6px_14px_rgba(0,102,255,0.28)]"
          >
            Ro‘yxatdan o‘tish
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}

function Choice<T extends string>({ value, options, onChange }: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={cn(
            "h-9 rounded-full border px-3.5 text-[13px] font-semibold",
            value === o.key ? "border-[#0066FF] bg-[#0066FF] text-white" : "border-[#e3e8f1] bg-white text-[#1a1d26]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SeminarListMobile() {
  const { catalogVersion } = useSeminarRegs();
  const [cat, setCat] = useState<CatKey>("");
  const [format, setFormat] = useState<Format>("all");
  const [kind, setKind] = useState<Kind>("all");
  const [city, setCity] = useState<SeminarCity | "all">("all");
  const [q, setQ] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const listRef = useRef<HTMLElement>(null);
  const extraFilters = (format !== "all" ? 1 : 0) + (kind !== "all" ? 1 : 0) + (city !== "all" ? 1 : 0);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...seminars].sort(compareListed).filter((s) => {
      if (!matchesCat(s, cat)) return false;
      if (format === "online" && s.city !== "Online") return false;
      if (format === "offline" && s.city === "Online") return false;
      if (kind === "master" && !isMasterClass(s)) return false;
      if (kind === "course" && !isCourse(s)) return false;
      if (kind === "kongress" && s.specialty !== "kongress") return false;
      if (city !== "all" && s.city !== city) return false;
      if (needle) {
        const hay = [s.title, s.speaker, s.city, s.venue, s.organizer ?? "", ...(s.speakers ?? []).map((x) => x.name)].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, format, kind, city, q, catalogVersion]);

  const upcoming = visible.filter((s) => isSeminarUpcoming(s));
  const past = visible.filter((s) => !isSeminarUpcoming(s)).reverse();
  const heroItems = useMemo(() => {
    const top = upcoming.find((s) => s.featured);
    const rest = upcoming.filter((s) => s !== top);
    return [...(top ? [top] : []), ...rest].slice(0, 4);
  }, [upcoming]);

  function resetAll() {
    setCat("");
    setFormat("all");
    setKind("all");
    setCity("all");
    setQ("");
  }

  return (
    <div data-testid="seminar-list-mobile">
      <MobileSectionHeader
        title="Seminarlar"
        extra={
          <Link href="/seminarlar/yozuvlarim" data-testid="seminar-my-calendar" aria-label="Mening yozuvlarim" className={mobileHeaderActionCls}>
            <CalendarDays className="size-5" strokeWidth={1.8} />
          </Link>
        }
      />
      {/* Compact top row: search field + filter button (no title/subtitle, no pill tabs) */}
      <div className="mb-3 flex items-center gap-2" data-testid="seminar-top-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#8b93a7]" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-section-search
            placeholder="Seminar, ma’ruzachi yoki shahar..."
            aria-label="Seminar qidirish"
            data-testid="seminar-search"
            className="h-11 w-full rounded-xl border border-[#e6eaf2] bg-white pr-10 pl-10 text-[14px] text-[#1a1d26] shadow-[0_2px_10px_rgba(15,23,42,0.05)] outline-none placeholder:text-[#8b93a7] focus:ring-2 focus:ring-[#0066FF]/20 [&::-webkit-search-cancel-button]:hidden"
          />
          {q ? (
            <button type="button" aria-label="Tozalash" onClick={() => setQ("")} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center text-[#8b93a7]">
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Filtrlar"
          data-testid="seminar-filter-toggle"
          onClick={() => setFilterOpen(true)}
          className="relative grid size-11 shrink-0 place-items-center rounded-xl border border-[#e6eaf2] bg-white text-[#0B1F4D] shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
        >
          <SlidersHorizontal className="size-5" />
          {extraFilters > 0 ? (
            <span className="absolute -top-1 -right-1 grid size-[18px] place-items-center rounded-full bg-[#0066FF] text-[10px] font-bold text-white ring-2 ring-[#F4F7FC]">
              {extraFilters}
            </span>
          ) : null}
        </button>
      </div>

      {heroItems.length > 0 ? <HeroCarousel key={heroItems.map((s) => s.id).join()} items={heroItems} /> : null}

      <section className="mb-4">
        <SectionHead
          title="Kategoriyalar"
          action={
            <button
              type="button"
              onClick={() => {
                resetAll();
                listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#0066FF]"
            >
              Barchasini ko‘rish <ArrowRight className="size-3.5" />
            </button>
          }
        />
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="seminar-categories">
          {categoryTiles.map(({ key, label, img, Icon }) => {
            const active = cat === key;
            return (
              <button key={key || "all"} type="button" onClick={() => setCat(key)} className="flex w-[66px] shrink-0 flex-col items-center gap-1.5" aria-pressed={active}>
                <span
                  className={cn(
                    "grid size-[54px] place-items-center rounded-[15px]",
                    active ? "bg-[#e8f1ff] text-[#0066FF] ring-[1.5px] ring-[#0066FF]" : "bg-white text-[#4b5568] shadow-[0_2px_8px_rgba(15,23,42,0.06)] ring-1 ring-[#edf0f6]",
                  )}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/icons/seminar/${img}-128.png`} alt="" width={30} height={30} className="size-[30px] object-contain" />
                  ) : (
                    <Icon className="size-[27px] text-[#0066FF] [stroke-width:1.6]" />
                  )}
                </span>
                <span className={cn("text-center text-[10.5px] leading-[1.2]", active ? "font-semibold text-[#0066FF]" : "font-medium text-[#4b5568]")}>{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section ref={listRef} className="mb-5 scroll-mt-20">
        <SectionHead
          title="Yaqinlashib kelayotgan seminarlar"
          action={<span className="rounded-full bg-[#e8f1ff] px-2.5 py-0.5 text-[12px] font-semibold text-[#0066FF]" data-testid="seminar-count">{upcoming.length}</span>}
        />
        {upcoming.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-10 text-center text-[13px] text-[#8b93a7] ring-1 ring-[#edf0f6]">
            {seminars.length === 0 && !q && extraFilters === 0 ? "Hozircha seminar yo‘q." : "Bu filtrlar bo‘yicha yaqin seminar yo‘q."}
            <button type="button" onClick={resetAll} className="mt-2 block w-full font-semibold text-[#0066FF]">
              Filtrlarni tozalash
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => (
              <ListCard key={s.id} seminar={s} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <section className="mb-5">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            aria-expanded={showPast}
            className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-[#edf0f6]"
          >
            <span className="text-[14px] font-bold text-[#0B1F4D]">O‘tgan seminarlar ({past.length})</span>
            <ChevronRight className={cn("size-4 text-[#8b93a7] transition-transform", showPast && "rotate-90")} />
          </button>
          {showPast ? (
            <div className="mt-3 space-y-3">
              {past.map((s) => (
                <ListCard key={s.id} seminar={s} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <Link href="/seminarlar/yozuvlarim" className="mb-1.5 flex items-center gap-2.5 rounded-xl border border-[#dbe7ff] bg-[#f5f8ff] px-3 py-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#0066FF] text-white">
          <Bookmark className="size-4" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[13px] font-bold text-[#1a1d26]">Mening yozuvlarim</span>
          <span className="mt-0.5 block text-[11px] text-[#8b93a7]">Yozilgan seminarlaringiz</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-[#8b93a7]" />
      </Link>
      <Link href="/seminarlar/yozuvlarim/tashkilotchi" className="mb-1.5 flex items-center gap-2.5 rounded-xl border border-[#dbe7ff] bg-white px-3 py-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e8f1ff] text-[#0066FF]">
          <Plus className="size-4" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[13px] font-bold text-[#1a1d26]">Seminar qo‘shish</span>
          <span className="mt-0.5 block text-[11px] text-[#8b93a7]">Tashkilotchi kabineti</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-[#8b93a7]" />
      </Link>
      {filterOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-label="Filtrlar" data-testid="seminar-filter-sheet">
          <button type="button" aria-label="Yopish" className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[24px] bg-white px-4 pt-3 shadow-2xl" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
            <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-[#dde3ee]" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-[#0B1F4D]">Filtrlar</h2>
              <button type="button" aria-label="Yopish" onClick={() => setFilterOpen(false)} className="grid size-9 place-items-center rounded-full bg-[#f1f3f7] text-[#4b5568]">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[13px] font-semibold text-[#4b5568]">Format</p>
                <Choice<Format>
                  value={format}
                  onChange={setFormat}
                  options={[
                    { key: "all", label: "Barchasi" },
                    { key: "offline", label: "Oflayn" },
                    { key: "online", label: "Onlayn" },
                  ]}
                />
              </div>
              <div>
                <p className="mb-2 text-[13px] font-semibold text-[#4b5568]">Turi</p>
                <Choice<Kind>
                  value={kind}
                  onChange={setKind}
                  options={[
                    { key: "all", label: "Barchasi" },
                    { key: "master", label: "Master-klass" },
                    { key: "course", label: "Kurslar" },
                    { key: "kongress", label: "Kongress" },
                  ]}
                />
              </div>
              <div>
                <p className="mb-2 text-[13px] font-semibold text-[#4b5568]">Shahar</p>
                <Choice<SeminarCity | "all">
                  value={city}
                  onChange={setCity}
                  options={[{ key: "all", label: "Barchasi" }, ...seminarCities.map((c) => ({ key: c, label: c === "Online" ? "Onlayn" : c }))]}
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormat("all");
                  setKind("all");
                  setCity("all");
                }}
                className="h-12 flex-1 rounded-xl bg-[#f1f3f7] text-[14px] font-semibold text-[#4b5568]"
              >
                Tozalash
              </button>
              <button type="button" data-testid="seminar-filter-apply" onClick={() => setFilterOpen(false)} className="h-12 flex-[2] rounded-xl bg-[#0066FF] text-[14px] font-semibold text-white">
                {upcoming.length} ta seminarni ko‘rsatish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
