"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Bookmark,
  Briefcase,
  BriefcaseMedical,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  MapPin,
  GraduationCap,
  Plus,
  Search,
  SlidersHorizontal,
  Stethoscope,
  Upload,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useJobsWork } from "@/components/jobs-provider";
import { MobileSectionHeader, mobileHeaderActionCls } from "@/components/mobile-section-header";
import { CategoryBadge, JobPhoto, placeText, salaryText, timeAgo, useSavedJobs } from "@/components/ishlar-ui";
import { experienceFilters, jobCategoryOf, jobCities, jobTypeLabels, salaryFilters, type Job, type JobCategory, type JobType } from "@/data/jobs";
import { cn } from "@/lib/utils";

type Sort = "new" | "old" | "salary";
const sortLabels: Record<Sort, string> = { new: "Eng yangi", old: "Eng eski", salary: "Maosh yuqori" };

const segments: { id: JobCategory; label: string; icon: ReactNode }[] = [
  { id: "klinika", label: "Klinikalar", icon: <BriefcaseMedical className="size-[22px]" /> },
  { id: "texnik", label: "Texniklar", icon: <Wrench className="size-[22px]" /> },
  { id: "shifokor", label: "Shifokorlar", icon: <Stethoscope className="size-[22px]" /> },
];

const typeChips: { id: JobType | ""; label: string; icon?: string }[] = [
  { id: "", label: "Barchasi", icon: "barchasi" },
  { id: "full", label: "To‘liq stavka", icon: "toliq-stavka" },
  { id: "part", label: "Yarim stavka", icon: "yarim-stavka" },
  { id: "freelance", label: "Freelance", icon: "freelance" },
  { id: "amaliyot", label: "Amaliyot" },
];

export const mobileTypeText: Record<JobType, string> = { ...jobTypeLabels, full: "To‘liq stavka" };

/** Mobile Ishlar list (mock 1). Real vacancies only; counts come from the published catalog. */
export function IshlarMobileList({ onPost, onResume, hasResume }: { onPost: () => void; onResume: () => void; hasResume: boolean }) {
  const router = useRouter();
  const { catalog, myJobs, ready } = useJobsWork();
  const saved = useSavedJobs();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<JobCategory | "">("");
  const [type, setType] = useState<JobType | "">("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [salary, setSalary] = useState("");
  const [experience, setExperience] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [sheet, setSheet] = useState(false);

  const counts = useMemo(() => {
    const c: Record<JobCategory, number> = { klinika: 0, texnik: 0, shifokor: 0 };
    for (const j of catalog) c[jobCategoryOf(j)] += 1;
    return c;
  }, [catalog]);

  const cities = useMemo(() => Array.from(new Set([...jobCities, ...catalog.map((j) => j.city)])), [catalog]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minSalary = salary ? Number(salary) : 0;
    const minExp = experience === "" ? null : Number(experience);
    const list = catalog.filter((j) => {
      if (segment && jobCategoryOf(j) !== segment) return false;
      if (type && j.type !== type) return false;
      if (city && j.city !== city) return false;
      if (onlySaved && !saved.has(j.id)) return false;
      if (minSalary && Math.max(j.salaryMin || 0, j.salaryMax || 0) < minSalary) return false;
      if (minExp !== null && (minExp === 0 ? j.experienceYears !== 0 : j.experienceYears < minExp)) return false;
      if (!q) return true;
      return [j.title, j.clinic, j.city, j.district ?? "", j.description].join(" ").toLowerCase().includes(q);
    });
    const ts = (j: Job) => (j.createdAt ? new Date(j.createdAt).getTime() : -j.postedDaysAgo);
    if (sort === "new") list.sort((a, b) => ts(b) - ts(a));
    if (sort === "old") list.sort((a, b) => ts(a) - ts(b));
    if (sort === "salary") list.sort((a, b) => Math.max(b.salaryMin || 0, b.salaryMax || 0) - Math.max(a.salaryMin || 0, a.salaryMax || 0));
    return list;
  }, [catalog, city, experience, onlySaved, query, salary, saved, segment, sort, type]);

  const extraFilters = (salary ? 1 : 0) + (experience ? 1 : 0) + (onlySaved ? 1 : 0);
  const anyFilter = Boolean(segment || type || city || query || extraFilters);

  function clearAll() {
    setSegment("");
    setType("");
    setCity("");
    setQuery("");
    setSalary("");
    setExperience("");
    setOnlySaved(false);
  }

  return (
    <div data-testid="ishlar-mobile">
      <MobileSectionHeader
        title="Ishlar"
        subtitle="Stomatologiya sohasidagi vakansiyalar va ish e’lonlari"
        extra={
          <button type="button" onClick={onPost} aria-label="E’lon berish" data-testid="ishlar-post" className={mobileHeaderActionCls}>
            <Plus className="size-5" strokeWidth={2.4} />
          </button>
        }
      />

      <div className="relative mb-3.5">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[19px] -translate-y-1/2 text-[#6b7487]" />
        <input
          data-section-search
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          placeholder="Lavozim, klinika yoki shaharni qidiring..."
          className="h-[50px] w-full rounded-2xl border border-[#e6ebf3] bg-white pr-14 pl-11 text-[14.5px] text-[#1a1d26] shadow-[0_4px_14px_rgba(15,23,42,0.04)] outline-none placeholder:text-[#8b93a7] focus:border-[#0b7f7d]"
          data-testid="ishlar-search"
        />
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-xl bg-[#eef6f6] text-[#4b5568]"
          aria-label="Filtrlar"
          data-testid="ishlar-filter-btn"
        >
          <SlidersHorizontal className="size-[18px]" />
          {extraFilters ? <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[#0b7f7d] text-[9px] font-bold text-white">{extraFilters}</span> : null}
        </button>
      </div>

      {/* Segments */}
      <div className="-mx-4 mb-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="ishlar-segments">
        <div className="flex w-max gap-2">
          {[{ id: "" as const, label: "Barchasi", icon: <Briefcase className="size-[22px]" /> }, ...segments].map((s) => {
            const on = segment === s.id;
            return (
              <button
                key={s.id || "all"}
                type="button"
                onClick={() => setSegment(s.id)}
                aria-pressed={on}
                className={cn(
                  "flex h-[66px] w-[78px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border text-[#0b7f7d]",
                  on ? "border-[#0d8f8c] bg-[#e6f7f6]" : "border-[#e6ebf3] bg-white",
                )}
              >
                <span className="shrink-0">{s.icon}</span>
                <span className="text-center text-[10.5px] leading-tight font-medium text-[#0B1220]">
                  {s.label}
                  {s.id ? <span className="text-[#8b93a7]" data-testid={`ishlar-count-${s.id}`}> ({ready ? counts[s.id] : "…"})</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Employment type chips */}
      <div className="-mx-4 mb-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="ishlar-type-chips">
        <div className="flex w-max gap-2">
          {typeChips.map((c) => {
            const on = type === c.id;
            return (
              <button
                key={c.id || "all"}
                type="button"
                onClick={() => setType(c.id)}
                aria-pressed={on}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium",
                  c.icon || c.id === "amaliyot" ? "pl-3" : "",
                  on ? "bg-[#0b7f7d] font-semibold text-white shadow-[0_4px_12px_rgba(11,127,125,0.28)]" : "border border-[#e6ebf3] bg-white text-[#1a1d26]",
                )}
                data-chip={c.id || "all"}
              >
                {c.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/icons/ishlar/${c.icon}-64.png`}
                    srcSet={`/icons/ishlar/${c.icon}-64.png 1x, /icons/ishlar/${c.icon}-128.png 2x`}
                    alt=""
                    aria-hidden
                    width={19}
                    height={19}
                    className="size-[19px] shrink-0 object-contain"
                    style={on ? { filter: "brightness(0) invert(1)" } : undefined}
                  />
                ) : c.id === "amaliyot" ? (
                  <GraduationCap className={cn("size-[19px] shrink-0", on ? "text-white" : "text-[#0b7f7d]")} strokeWidth={2.1} aria-hidden />
                ) : null}
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* City + sort */}
      <div className="mb-3 flex items-center gap-2">
        <label className="relative inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#e6ebf3] bg-white pr-2.5 pl-3 text-[12.5px] font-medium text-[#1a1d26]">
          <MapPin className="size-3.5 text-[#0b7f7d]" />
          {city || "Barcha shaharlar"}
          <ChevronDown className="size-3.5 text-[#8b93a7]" />
          <select value={city} onChange={(e) => setCity(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Shahar" data-testid="ishlar-city">
            <option value="">Barcha shaharlar</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <span className="ml-1 text-[12px] text-[#8b93a7]" data-testid="ishlar-count">
          {visible.length} ta
        </span>
        <label className="relative ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#e6ebf3] bg-white pr-2.5 pl-3 text-[12.5px] font-medium text-[#1a1d26]">
          <ArrowUpDown className="size-3.5 text-[#4b5568]" />
          {sortLabels[sort]}
          <ChevronDown className="size-3.5 text-[#8b93a7]" />
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Saralash">
            {(Object.keys(sortLabels) as Sort[]).map((k) => (
              <option key={k} value={k}>
                {sortLabels[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* List */}
      {!ready ? (
        <ul className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-[132px] animate-pulse rounded-[20px] bg-white" />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <div className="rounded-[20px] bg-white px-5 py-10 text-center" data-testid="ishlar-empty">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e3f6f5] text-[#0b7f7d]">
            <Briefcase className="size-6" />
          </span>
          <p className="mt-3 text-[15px] font-semibold text-[#1a1d26]">{catalog.length === 0 ? "Hali vakansiya yo‘q" : "Mos vakansiya topilmadi"}</p>
          <p className="mt-1 text-[12.5px] text-[#8b93a7]">
            {catalog.length === 0 ? "Birinchi bo‘lib e’lon bering — admin tasdiqlagach hamma ko‘radi." : "Filtrlarni o‘zgartiring yoki tozalang."}
          </p>
          <button
            type="button"
            onClick={catalog.length === 0 ? onPost : clearAll}
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0b7f7d] px-5 text-[13.5px] font-semibold text-white"
          >
            {catalog.length === 0 ? "E’lon berish" : "Filtrlarni tozalash"}
          </button>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((job, i) => (
            <li key={job.id}>
              <JobCard job={job} priority={i < 2} saved={saved.has(job.id)} onSave={() => saved.toggle(job.id)} onOpen={() => router.push(`/ishlar/${job.id}`)} />
            </li>
          ))}
        </ul>
      )}
      {anyFilter && visible.length > 0 ? (
        <button type="button" onClick={clearAll} className="mt-3 w-full text-center text-[12.5px] font-semibold text-[#0b7f7d]">
          Filtrlarni tozalash
        </button>
      ) : null}

      {/* Existing flows */}
      <div className="mt-5 space-y-2.5">
        <button type="button" onClick={onResume} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#d3efed] bg-white text-[14px] font-semibold text-[#0b7f7d]">
          <Upload className="size-4" />
          {hasResume ? "Rezyumeni tahrirlash" : "Rezyume joylash"}
        </button>
        <NavRow href="/ishlar/vakansiyalarim" icon={<Briefcase className="size-[18px]" />} title="Mening vakansiyalarim" sub={myJobs.length ? `${myJobs.length} ta vakansiya · kelgan arizalar` : "Vakansiyalar va kelgan arizalar"} />
        <NavRow href="/ishlar/arizalarim" icon={<ClipboardList className="size-[18px]" />} title="Mening arizalarim" sub="Yuborilgan arizalarni kuzating" />
        <p className="pt-1 text-center text-[11px] text-[#8b93a7]">Vakansiyalar admin tasdig‘idan o‘tadi. Telefon raqamlar yopiq.</p>
      </div>
      <div className="h-14" />
      <button
        type="button"
        onClick={onPost}
        className="fixed inset-x-3 z-30 flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#0b7f7d] text-[15px] font-semibold text-white shadow-[0_8px_18px_rgba(11,127,125,0.3)]"
        style={{ bottom: "calc(4.6rem + env(safe-area-inset-bottom))" }}
        data-testid="ishlar-post-bottom"
      >
        <Plus className="size-5" /> E’lon joylash
      </button>

      {sheet ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filtrlar">
          <button type="button" className="absolute inset-0 bg-[#0B1220]/45" aria-label="Yopish" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[26px] bg-white p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#0B1220]">Filtrlar</h2>
              <button type="button" onClick={() => setSheet(false)} className="grid size-9 place-items-center rounded-full bg-[#f4f6fa]" aria-label="Yopish">
                <X className="size-4" />
              </button>
            </div>
            <SheetBlock label="Maosh" icon={<Wallet className="size-4" />}>
              {salaryFilters.map((s) => (
                <SheetChip key={s.value || "any"} on={salary === s.value} onClick={() => setSalary(s.value)} label={s.label} />
              ))}
            </SheetBlock>
            <SheetBlock label="Tajriba" icon={<Briefcase className="size-4" />}>
              {experienceFilters.map((s) => (
                <SheetChip key={s.value || "all"} on={experience === s.value} onClick={() => setExperience(s.value)} label={s.label} />
              ))}
            </SheetBlock>
            <SheetBlock label="Ish turi" icon={<Briefcase className="size-4" />}>
              <SheetChip on={!type} onClick={() => setType("")} label="Barchasi" />
              {(Object.keys(jobTypeLabels) as JobType[]).map((t) => (
                <SheetChip key={t} on={type === t} onClick={() => setType(t)} label={mobileTypeText[t]} />
              ))}
            </SheetBlock>
            <SheetBlock label="Saqlanganlar" icon={<Bookmark className="size-4" />}>
              <SheetChip on={!onlySaved} onClick={() => setOnlySaved(false)} label="Hammasi" />
              <SheetChip on={onlySaved} onClick={() => setOnlySaved(true)} label="Faqat saqlanganlar" />
            </SheetBlock>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSalary("");
                  setExperience("");
                  setOnlySaved(false);
                }}
                className="h-12 flex-1 rounded-2xl border border-[#dbe3f0] text-[14px] font-semibold text-[#1a1d26]"
              >
                Tozalash
              </button>
              <button type="button" onClick={() => setSheet(false)} className="h-12 flex-[2] rounded-2xl bg-[#0b7f7d] text-[14px] font-semibold text-white">
                Ko‘rsatish ({visible.length})
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function JobCard({ job, priority, saved, onSave, onOpen }: { job: Job; priority: boolean; saved: boolean; onSave: () => void; onOpen: () => void }) {
  return (
    <article className="relative flex gap-3 rounded-[14px] border border-[#e9f0f5] bg-white p-2" data-testid="job-card">
      <button type="button" onClick={onOpen} className="relative shrink-0" aria-label={`${job.title} — batafsil`}>
        <JobPhoto job={job} sizes="120px" priority={priority} className="h-[104px] w-[112px] rounded-[10px]" iconClass="size-8" />
        <CategoryBadge job={job} className="absolute top-1.5 left-1.5" />
      </button>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start gap-1.5">
          <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
            <h3 className="line-clamp-2 text-[14.5px] leading-snug font-bold text-[#0B1220]">{job.title}</h3>
          </button>
          <span className="shrink-0 rounded-full bg-[#f1f4f9] px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-[#6b7487]" data-testid="job-time">
            {timeAgo(job)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12.5px] font-medium text-[#0b7f7d]">{job.clinic}</p>
        <ul className="mt-1 space-y-0.5 text-[11.5px] text-[#4b5568]">
          <li className="flex items-center gap-1.5 truncate">
            <MapPin className="size-3 shrink-0 text-[#8b93a7]" />
            <span className="truncate">{placeText(job)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Briefcase className="size-3 shrink-0 text-[#8b93a7]" />
            {mobileTypeText[job.type]}
            {job.remote ? " · Masofaviy" : ""}
          </li>
          <li className="flex items-center gap-1.5">
            <Wallet className="size-3 shrink-0 text-[#8b93a7]" />
            <span className={cn(salaryText(job) === "Kelishiladi" ? "text-[#8b93a7]" : "font-semibold text-[#0B1220]")}>{salaryText(job)}</span>
          </li>
        </ul>
        <div className="mt-1 flex items-center justify-end gap-2">
          <button type="button" onClick={onSave} className="grid size-8 place-items-center rounded-full text-[#4b5568]" aria-label={saved ? "Saqlanganlardan olib tashlash" : "Saqlash"} aria-pressed={saved} data-testid="job-save">
            <Bookmark className={cn("size-[19px]", saved && "fill-[#0b7f7d] text-[#0b7f7d]")} />
          </button>
          <button type="button" onClick={onOpen} className="inline-flex h-8 items-center gap-1 rounded-[9px] bg-[#0b7f7d] px-3 text-[12px] font-semibold text-white" data-testid="job-open">
            Ariza topshirish
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function NavRow({ href, icon, title, sub }: { href: string; icon: ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-[#d3efed] bg-[#f2fbfa] px-3.5 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0b7f7d] text-white">{icon}</span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[14px] font-bold text-[#1a1d26]">{title}</span>
        <span className="mt-0.5 block text-[12px] text-[#8b93a7]">{sub}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-[#8b93a7]" />
    </Link>
  );
}

function SheetBlock({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#4b5568]">
        <span className="text-[#0b7f7d]">{icon}</span>
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SheetChip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cn("h-9 rounded-full px-3.5 text-[13px] font-medium", on ? "bg-[#0b7f7d] text-white" : "border border-[#e6ebf3] bg-white text-[#1a1d26]")}>
      {label}
    </button>
  );
}
