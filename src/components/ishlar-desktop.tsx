"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Globe,
  Heart,
  Home,
  MapPin,
  Plus,
  Send,
  Sparkles,
  Star,
  Upload,
  UserCheck,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import {
  clinicBrands,
  experienceFilters,
  experienceLabel,
  jobCities,
  jobTitles,
  jobHref,
  jobTypeLabels,
  postedLabel,
  salaryFilters,
  type Candidate,
  type ClinicBrand,
  type Job,
  type JobType,
  type JobCategory,
  jobCategoryOf,
  jobCategoryLabels,
} from "@/data/jobs";
import { IshlarMobileHero } from "@/components/ishlar-mobile-hero";
import { formatMoney, formatSalaryRange } from "@/lib/format";
import type { JobApplication } from "@/lib/jobs-work";
import { ClinicInitials } from "@/components/clinic-initials";
import { cn } from "@/lib/utils";

type SortKey = "new" | "salaryDesc" | "salaryAsc" | "experience";
type Pill = "all" | "stomatolog" | "assistent" | "ortodont" | "implantolog" | "hamshira" | "admin" | "masofaviy";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "new", label: "Eng yangi" },
  { key: "salaryDesc", label: "Maosh: yuqoridan" },
  { key: "salaryAsc", label: "Maosh: pastdan" },
  { key: "experience", label: "Tajriba: ko‘pdan" },
];

const pills: { key: Pill; label: string }[] = [
  { key: "all", label: "Barcha" },
  { key: "stomatolog", label: "Stomatolog" },
  { key: "assistent", label: "Stomatolog assistent" },
  { key: "ortodont", label: "Ortodont" },
  { key: "implantolog", label: "Implantolog" },
  { key: "hamshira", label: "Hamshira" },
  { key: "admin", label: "Administrator" },
  { key: "masofaviy", label: "Masofaviy" },
];

function isRemote(job: Job) {
  return Boolean(job.remote) || job.tags.some((t) => t.toLowerCase().includes("masofaviy"));
}

function matchesPill(job: Job, pill: Pill) {
  const t = job.title.toLowerCase();
  switch (pill) {
    case "all":
      return true;
    case "assistent":
      return t.includes("assistent");
    case "ortodont":
      return t.includes("ortodont");
    case "implantolog":
      return t.includes("implantolog") && !t.includes("assistent");
    case "hamshira":
      return t.includes("hamshira");
    case "admin":
      return t.includes("administrator") || t.includes("admin");
    case "masofaviy":
      return isRemote(job);
    default:
      return (
        t.includes("stomatolog") && !t.includes("assistent") && !t.includes("administrator")
      );
  }
}

function hashOf(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function dateLabel(days: number) {
  return days <= 0 ? "Bugun" : postedLabel(days);
}

function ClinicLogo({ brand, name, size = 56 }: { brand?: ClinicBrand; name: string; size?: number }) {
  if (!brand) return <ClinicInitials name={name} style={{ width: size, height: size }} />;
  const meta = clinicBrands[brand];
  return (
    <span
      className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[#e3e9f5]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className={size > 60 ? "size-7" : "size-5"} fill={meta.color}>
        <path d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" />
      </svg>
      <span className="mt-0.5 max-w-[90%] truncate text-center text-[7.5px] font-bold tracking-wide" style={{ color: meta.color }}>
        {meta.short.split(" ")[0]}
      </span>
    </span>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative block min-w-0 flex-1 rounded-lg border border-[#e6eaf2] bg-white px-3 py-1.5 hover:border-[#CCFBF1]">
      <span className="block text-[11px] text-[#8b93a7]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full cursor-pointer appearance-none bg-transparent pr-5 text-[13.5px] font-semibold text-[#1a1d26] outline-none"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 bottom-2.5 size-4 text-[#8b93a7]" />
    </label>
  );
}

function Stat({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: number; label: string; tone: "blue" | "green" | "orange" }) {
  const toneCls = {
    blue: "bg-[#eaf2ff] text-[#0F766E]",
    green: "bg-[#e6f7ee] text-[#16a34a]",
    orange: "bg-[#fff1e0] text-[#f08a1c]",
  }[tone];
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#eceff5] bg-white px-3 py-2 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", toneCls)}>
        <Icon className="size-4" />
      </span>
      <div className="leading-tight">
        <p className="text-[18px] font-extrabold text-[#111827]">{value}</p>
        <p className="mt-0.5 text-[12px] text-[#8b93a7]">{label}</p>
      </div>
    </div>
  );
}

function Tags({ job, light }: { job: Job; light?: boolean }) {
  const items = [jobTypeLabels[job.type], experienceLabel(job.experienceYears), ...(isRemote(job) ? [] : []), ...job.tags].slice(0, 4);
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((tag) => (
        <span
          key={tag}
          className={cn(
            "rounded-full px-2 py-[3px] text-[11px] font-medium",
            light ? "bg-white text-[#4b5568]" : "bg-[#eef3fb] text-[#4b5568]",
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function Actions({ job, applied, onApply, compact }: { job: Job; applied: boolean; onApply: () => void; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={jobHref(job.id)}
        className={cn(
          "inline-flex items-center justify-center rounded-xl border border-[#F0FDFA] bg-white font-semibold text-[#0F766E] hover:bg-[#f2f7ff]",
          compact ? "h-8 px-3 text-[12.5px]" : "h-10 px-5 text-[14px]",
        )}
      >
        Batafsil
      </Link>
      {applied ? (
        <span className={cn("inline-flex items-center gap-1 font-semibold text-emerald-700", compact ? "text-[13px]" : "text-[14px]")}>
          <CheckCircle2 className="size-4" />
          Ariza yuborildi
        </span>
      ) : (
        <button
          type="button"
          onClick={onApply}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] font-semibold text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.25)] hover:bg-[#115E59]",
            compact ? "h-8 px-3 text-[12.5px]" : "h-10 px-5 text-[14px]",
          )}
        >
          Ariza yuborish
          <Send className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function IshlarDesktop({
  catalog,
  people,
  hasApplied,
  q,
  onPost,
  onResume,
  onApply,
  onProfile,
}: {
  catalog: Job[];
  people: Candidate[];
  hasApplied: (jobId: string) => boolean;
  q: string;
  onPost: () => void;
  onResume: () => void;
  onApply: (job: Job) => void;
  onProfile: (person: Candidate) => void;
}) {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [salary, setSalary] = useState("");
  const [experience, setExperience] = useState("");
  const [pill, setPill] = useState<Pill>("all");
  const [segment, setSegment] = useState<JobCategory | "">("");
  const [sort, setSort] = useState<SortKey>("new");
  const [selectedId, setSelectedId] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [allPeople, setAllPeople] = useState(false);

  const stats = useMemo(
    () => ({
      active: catalog.length,
      orgs: new Set(catalog.map((j) => j.clinic)).size,
      fresh: catalog.filter((j) => j.postedDaysAgo <= 2).length,
      remote: catalog.filter(isRemote).length,
    }),
    [catalog],
  );

  const visible = useMemo(() => {
    const minSalary = salary ? Number(salary) : 0;
    const minExp = experience === "" ? null : Number(experience);
    const rows = catalog.filter((job) => {
      if (q && !`${job.title} ${job.clinic} ${job.city}`.toLowerCase().includes(q)) return false;
      if (title && job.title !== title) return false;
      if (city && job.city !== city) return false;
      if (type && job.type !== type) return false;
      if (minSalary && job.salaryMin < minSalary) return false;
      if (minExp !== null && (minExp === 0 ? job.experienceYears !== 0 : job.experienceYears < minExp)) return false;
      if (segment && jobCategoryOf(job) !== segment) return false;
      return matchesPill(job, pill);
    });
    const sorted = [...rows];
    if (sort === "salaryDesc") sorted.sort((a, b) => (b.salaryMax ?? b.salaryMin) - (a.salaryMax ?? a.salaryMin));
    else if (sort === "salaryAsc") sorted.sort((a, b) => a.salaryMin - b.salaryMin);
    else if (sort === "experience") sorted.sort((a, b) => b.experienceYears - a.experienceYears);
    else sorted.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    return sorted;
  }, [catalog, city, experience, pill, q, salary, segment, sort, title, type]);

  const featured = visible.find((j) => j.id === selectedId) ?? visible.find((j) => j.featured) ?? visible[0];
  const rest = visible.filter((j) => j.id !== featured?.id);
  const shownPeople = allPeople ? people : people.slice(0, 3);
  const filtersOn = Boolean(title || city || type || salary || experience || segment || pill !== "all");

  function clear() {
    setTitle("");
    setCity("");
    setType("");
    setSalary("");
    setExperience("");
    setPill("all");
    setSegment("");
  }
  function toggleSaved(id: string) {
    setSaved((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  }

  return (
    <div className="space-y-3">
      <nav className="flex items-center gap-1 text-[12.5px] text-[#8b93a7]">
        <Link href="/" className="hover:text-[#0F766E]">Bosh sahifa</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-[#4b5568]">Ishlar</span>
      </nav>

      {/* Same promo slider as on phones (shared PromoSlider). */}
      <IshlarMobileHero
        onSegment={(c) => {
          setSegment(c);
          document.getElementById("vakansiyalar")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onPost={onPost}
      />

      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] leading-tight font-extrabold tracking-tight text-[#111827]">Ishlar</h1>
          <p className="mt-0.5 flex items-center gap-3 text-[13px] text-[#6b7280]">
            Stomatologlar va klinika xodimlari uchun vakansiyalar
            <Link href="/ishlar/arizalarim" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0F766E] hover:underline">
              <ClipboardList className="size-3.5" />
              Mening arizalarim
            </Link>
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/ishlar/vakansiyalarim"
            className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[14px] font-semibold text-[#111827] hover:bg-[#f2f7ff]"
          >
            Mening vakansiyalarim
          </Link>
          <button
            type="button"
            onClick={onPost}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#0F766E] bg-white px-5 text-[14px] font-semibold text-[#0F766E] hover:bg-[#f2f7ff]"
          >
            <Plus className="size-4" />
            Vakansiya joylash
          </button>
          <button
            type="button"
            onClick={onResume}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.28)] hover:bg-[#115E59]"
          >
            <Upload className="size-4" />
            Rezyume joylash
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-3">
        <div className="grid grid-cols-4 gap-3 self-stretch">
          <Stat icon={Briefcase} value={stats.active} label="faol vakansiya" tone="blue" />
          <Stat icon={Building2} value={stats.orgs} label="tashkilot" tone="blue" />
          <Stat icon={Sparkles} value={stats.fresh} label="yangi vakansiya" tone="green" />
          <Stat icon={Globe} value={stats.remote} label="masofaviy ish" tone="orange" />
        </div>
        <section className="relative flex h-[64px] items-center overflow-hidden rounded-xl bg-linear-to-r from-[#F0FDFA] to-[#eef6ff] pl-5">
          <div className="relative z-10 max-w-[210px]">
            <p className="text-[14px] leading-tight font-extrabold text-[#111827]">Orzuyingizdagi jamoani toping</p>
            <a
              href="#vakansiyalar"
              className="mt-1 inline-flex h-6 items-center gap-1 rounded-md bg-[#0F766E] px-2.5 text-[11px] font-semibold text-white"
            >
              Ko‘rish <ArrowRight className="size-3.5" />
            </a>
          </div>
          <Image
            src="/images/forma-banner-doctor.png"
            alt=""
            width={200}
            height={130}
            className="absolute top-0 right-0 h-full w-[130px] object-cover object-top"
          />
          <div className="absolute inset-y-0 right-[130px] w-16 bg-linear-to-r from-[#eef6ff]/0 to-transparent" />
        </section>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-2">
        <Select label="Lavozim" value={title} onChange={setTitle}>
          <option value="">Barcha lavozimlar</option>
          {jobTitles.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Select label="Shahar" value={city} onChange={setCity}>
          <option value="">Barcha shaharlar</option>
          {jobCities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select label="Ish turi" value={type} onChange={setType}>
          <option value="">Barchasi</option>
          {(Object.keys(jobTypeLabels) as JobType[]).map((id) => (
            <option key={id} value={id}>{jobTypeLabels[id]}</option>
          ))}
        </Select>
        <Select label="Maosh (so‘m)" value={salary} onChange={setSalary}>
          {salaryFilters.map((s) => (
            <option key={s.value || "any"} value={s.value}>{s.label}</option>
          ))}
        </Select>
        <Select label="Tajriba" value={experience} onChange={setExperience}>
          {experienceFilters.map((s) => (
            <option key={s.value || "all"} value={s.value}>{s.label}</option>
          ))}
        </Select>
        <button
          type="button"
          onClick={clear}
          disabled={!filtersOn}
          className="mb-2 shrink-0 px-2 text-[13px] font-semibold text-[#0F766E] hover:underline disabled:text-[#b4bccb] disabled:no-underline"
        >
          Filtrlarni tozalash
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {pills.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPill(p.key)}
              className={cn(
                "h-8 rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors",
                pill === p.key
                  ? "border-[#0F766E] bg-[#0F766E] text-white"
                  : "border-[#e6eaf2] bg-white text-[#2b3447] hover:border-[#0F766E]/50",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#e6eaf2] bg-white pr-8 pl-3 text-[13px] text-[#8b93a7]">
          Saralash:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="cursor-pointer appearance-none bg-transparent font-semibold text-[#1a1d26] outline-none"
          >
            {sortOptions.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-[#8b93a7]" />
        </label>
      </div>

      {q ? <p className="text-[13px] text-[#6b7280]">Qidiruv: “{q}” — {visible.length} ta natija</p> : null}

      {segment ? (
        <div className="flex items-center gap-2 text-[13px] text-[#4b5568]" data-testid="ishlar-desktop-segment">
          Bo‘lim:
          <button
            type="button"
            onClick={() => setSegment("")}
            className="inline-flex items-center gap-1 rounded-full bg-[#0F766E] px-3 py-1 text-[12.5px] font-semibold text-white"
          >
            {jobCategoryLabels[segment]} ×
          </button>
        </div>
      ) : null}

      <div id="vakansiyalar" className="scroll-mt-20 grid grid-cols-[minmax(0,1fr)_270px] items-start gap-3">
        <div className="min-w-0 space-y-3">
          {featured ? (
            <section>
              <h2 className="mb-2 text-[14px] font-bold text-[#111827]">Tanlangan vakansiya</h2>
              <article className="relative overflow-hidden rounded-xl border border-[#F0FDFA] bg-linear-to-r from-[#eaf2ff] to-[#f5f9ff] p-3 shadow-[0_2px_10px_rgba(15, 118, 110, 0.07)]">
                <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                  <div className="flex gap-3">
                    <ClinicLogo brand={featured.brand} name={featured.clinic} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="flex items-center gap-1 text-[16px] leading-tight font-extrabold tracking-tight text-[#111827]">
                          <Link href={jobHref(featured.id)} className="hover:text-[#0F766E]">{featured.title}</Link>
                          {featured.verified ? <BadgeCheck className="size-4 fill-[#0F766E] text-white" /> : null}
                        </h3>
                        {featured.featured ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#fff1e0] px-1.5 py-[3px] text-[9.5px] leading-none font-bold tracking-wide text-[#f08a1c]">
                            <Star className="size-2.5 fill-current" />
                            TOP VAKANSIYA
                          </span>
                        ) : null}
                        <span className="ml-auto text-[16px] font-extrabold text-[#0F766E]">{formatSalaryRange(featured.salaryMin, featured.salaryMax)}</span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#4b5568]">
                        {featured.clinic}
                        <span className="text-[#c5cad6]">•</span>
                        <MapPin className="size-3 text-[#0F766E]" />
                        {featured.city}
                        <span className="text-[#c5cad6]">•</span>
                        <span className="truncate">{[jobTypeLabels[featured.type], experienceLabel(featured.experienceYears), ...featured.tags].slice(0, 3).join(" · ")}</span>
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-[#4b5568]">{featured.description}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-[11.5px] text-[#6b7280]">
                          <span className="inline-flex items-center gap-1"><Clock className="size-3" />{dateLabel(featured.postedDaysAgo)}</span>
                        </div>
                        <Actions job={featured} applied={hasApplied(featured.id)} onApply={() => onApply(featured)} compact />
                      </div>
                    </div>
                  </div>
                  <div className="relative min-h-[96px] overflow-hidden rounded-lg">
                    <Image src="/images/hero-dentist.png" alt="Klinika xonasi" fill sizes="120px" className="object-cover" />
                  </div>
                </div>
              </article>
            </section>
          ) : null}

          <section>
            <h2 className="mb-2 text-[14px] font-bold text-[#111827]">Barcha vakansiyalar ({visible.length})</h2>
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-[#eceff5] bg-white px-6 py-16 text-center">
                <p className="font-semibold text-[#1a1d26]">{catalog.length === 0 ? "Hali e’lon yo‘q" : "Vakansiya topilmadi"}</p>
                <p className="mt-1 text-sm text-[#8b93a7]">{catalog.length === 0 ? "Birinchi bo‘lib vakansiya joylang. E’lonlar admin tasdiqlagach ko‘rinadi." : "Filtrlarni o‘zgartiring yoki tozalang."}</p>
                <button type="button" onClick={catalog.length === 0 ? onPost : clear} className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0F766E] px-5 text-sm font-semibold text-white">
                  {catalog.length === 0 ? "Vakansiya joylash" : "Filtrlarni tozalash"}
                </button>
              </div>
            ) : rest.length === 0 ? (
              <p className="rounded-2xl border border-[#eceff5] bg-white px-6 py-8 text-center text-sm text-[#8b93a7]">
                Boshqa vakansiya yo‘q — tanlangan e’lon yuqorida.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {rest.map((job) => (
                  <article
                    key={job.id}
                    className="flex cursor-pointer flex-col rounded-xl border border-[#eceff5] bg-white p-3 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(17, 24, 39, 0.09)]"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a,button")) return;
                      setSelectedId(job.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <div className="flex gap-2.5">
                      <ClinicLogo brand={job.brand} name={job.clinic} size={40} />
                      <div className="min-w-0 flex-1">
                        <h3 className="flex items-center gap-1 text-[14px] leading-tight font-bold text-[#111827]">
                          <Link href={jobHref(job.id)} className="truncate hover:text-[#0F766E]">{job.title}</Link>
                          {job.verified ? <BadgeCheck className="size-3.5 shrink-0 fill-[#0F766E] text-white" /> : null}
                          {job.postedLocal ? (
                            <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[10px] font-semibold text-emerald-700">Faol</span>
                          ) : null}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[#6b7280]">
                          {job.clinic}
                          <span className="text-[#c5cad6]">•</span>
                          <MapPin className="size-3 shrink-0" />
                          {job.city}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-start gap-1">
                        <p className="pt-0.5 text-[14px] font-extrabold whitespace-nowrap text-[#0F766E]">{formatSalaryRange(job.salaryMin, job.salaryMax)}</p>
                        <button
                          type="button"
                          onClick={() => toggleSaved(job.id)}
                          aria-label="Saqlash"
                          aria-pressed={saved.includes(job.id)}
                          className="grid size-7 shrink-0 place-items-center rounded-full text-[#8b93a7] hover:bg-[#f4f6fa] hover:text-[#f43f5e]"
                        >
                          <Heart className={cn("size-4", saved.includes(job.id) && "fill-[#f43f5e] text-[#f43f5e]")} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2"><Tags job={job} /></div>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-2.5 text-[11px] text-[#8b93a7]">
                        <span className="inline-flex items-center gap-1"><Clock className="size-3" />{dateLabel(job.postedDaysAgo)}</span>
                      </div>
                      <Actions job={job} applied={hasApplied(job.id)} onApply={() => onApply(job)} compact />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="sticky top-0 space-y-3">
          <section className="rounded-xl border border-[#eceff5] bg-white p-3 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-[#111827]">Talabgorlar</h2>
              <button type="button" onClick={() => setAllPeople((v) => !v)} className="text-[13px] font-semibold text-[#0F766E] hover:underline">
                {allPeople ? "Yopish" : "Barchasini ko‘rish"}
              </button>
            </div>
            {shownPeople.length === 0 ? <p className="py-4 text-center text-[12.5px] text-[#8b93a7]">Hali rezyume yo‘q</p> : null}
            <ul className="space-y-2">
              {shownPeople.map((person) => (
                <li key={person.id} className="flex gap-2.5 border-b border-[#eceff5] pb-2 last:border-0 last:pb-0">
                  {person.photo ? (
                    <Image src={person.photo} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover object-top" />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-sm font-semibold text-[#0F766E]">
                      {person.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-[13px] font-bold text-[#111827]">
                      <span className="truncate">{person.mine ? "Mening rezyumem" : person.name}</span>
                      {person.verified ? <BadgeCheck className="size-4 shrink-0 fill-[#0F766E] text-white" /> : null}
                    </p>
                    <p className="text-[12px] text-[#6b7280]">{person.mine ? `${person.name} · ${person.role}` : person.role}</p>
                    <p className="text-[11.5px] text-[#8b93a7]">{experienceLabel(person.experienceYears, false)} • {person.city}</p>
                    {person.salaryFrom ? <p className="text-[12px] font-semibold text-[#1a1d26]">{formatMoney(person.salaryFrom, "UZS")}dan</p> : null}
                    <button type="button" onClick={() => onProfile(person)} className="text-[12px] font-semibold text-[#0F766E] hover:underline">
                      Profil ko‘rish
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl bg-linear-to-b from-[#0F766E] to-[#115E59] p-3.5 text-white shadow-[0_8px_24px_rgba(15, 118, 110, 0.28)]">
            <h2 className="text-[14px] font-bold">Ish qidiruvchilar uchun</h2>
            <ul className="mt-2 space-y-1.5 text-[12px]">
              {[
                { icon: FileText, text: "Rezyume joylash — bepul" },
                { icon: UserCheck, text: "Ish beruvchilardan to‘g‘ridan-to‘g‘ri takliflar" },
                { icon: Home, text: "Profilingizni rivojlantiring" },
                { icon: Sparkles, text: "Karyera o‘sishi imkoniyatlari" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5">
                  <Icon className="size-4 shrink-0 text-white/90" />
                  {text}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onResume}
              className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-white text-[13px] font-semibold text-[#0F766E] hover:bg-[#f2f7ff]"
            >
              Rezyume joylash
              <ArrowRight className="size-4" />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
