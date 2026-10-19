"use client";
/* eslint-disable @next/next/no-img-element -- photos are sized by the design unit */

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpDown, Bookmark, Briefcase, BriefcaseBusiness, CalendarDays, ChevronDown, ChevronRight, ClipboardList, Coins, MapPin, Plus, Search, SlidersHorizontal, Upload } from "lucide-react";
import { useJobsWork } from "@/components/jobs-provider";
import { MobileBrandBar } from "@/components/mobile/MobileBrandBar";
import { placeText, timeAgo, useSavedJobs } from "@/components/ishlar-ui";
import { experienceFilters, jobCities, jobTypeLabels, salaryFilters, type Job, type JobType } from "@/data/jobs";
import { jobTiles, mobileJobSamples, type JobTile, type MobileJobSample } from "@/data/mobile-jobs";
import "@/components/mobile/mobile-ui.css";
import "@/components/ishlar/mobile/ishlar-mobile.css";

export const mobileTypeText: Record<JobType, string> = { ...jobTypeLabels, full: "To‘liq stavka" };

type Row = {
  id: string;
  job?: Job;
  sample?: MobileJobSample;
  title: string;
  clinic: string;
  place: string;
  city: string;
  type: JobType;
  typeTone: "green" | "blue";
  salaryMin: number;
  salaryMax: number;
  exp: string;
  ago: string;
  image: string | null;
  text: string;
  ts: number;
  rank: number;
};

const sum = (n: number) => n.toLocaleString("ru-RU").replace(/,/g, " ");
function salaryLine(row: Row) {
  if (row.salaryMin && row.salaryMax) return `${sum(row.salaryMin)} – ${sum(row.salaryMax)} so‘m`;
  if (row.salaryMin) return `${sum(row.salaryMin)} so‘mdan`;
  if (row.salaryMax) return `${sum(row.salaryMax)} so‘mgacha`;
  return "Maosh kelishiladi";
}

function fromJob(job: Job, index: number): Row {
  return {
    id: job.id,
    job,
    title: job.title,
    clinic: job.clinic,
    place: placeText(job),
    city: job.city,
    type: job.type,
    typeTone: job.type === "full" ? "green" : "blue",
    salaryMin: job.salaryMin || 0,
    salaryMax: job.salaryMax || 0,
    exp: job.experienceYears > 0 ? `${job.experienceYears}+ yil tajriba` : "Tajriba talab qilinmaydi",
    ago: timeAgo(job),
    image: job.photos?.[0] ?? null,
    text: [job.title, job.clinic, job.city, job.district ?? "", job.description].join(" ").toLowerCase(),
    ts: job.createdAt ? new Date(job.createdAt).getTime() : -job.postedDaysAgo,
    rank: index,
  };
}

const samples: Row[] = mobileJobSamples.map((s) => ({
  id: s.id,
  sample: s,
  title: s.title,
  clinic: s.clinic,
  place: s.place,
  city: s.city,
  type: s.type,
  typeTone: s.typeTone,
  salaryMin: s.salaryMin,
  salaryMax: s.salaryMax,
  exp: s.exp,
  ago: s.ago,
  image: s.image,
  text: `${s.title} ${s.clinic} ${s.place}`.toLowerCase(),
  ts: -1e15 - s.rank,
  rank: 1000 + s.rank,
}));

/** Mobile Ishlar (design 66db21d4): real vacancies first, design samples labelled "Namuna". */
export function IshlarMobileList({ onPost, onResume, onApply, hasResume }: { onPost: () => void; onResume: () => void; onApply: (job: Job) => void; hasResume: boolean }) {
  const { catalog, myJobs, ready, hasApplied } = useJobsWork();
  const saved = useSavedJobs();
  const [query, setQuery] = useState("");
  const [tile, setTile] = useState<"" | JobTile>("");
  const [city, setCity] = useState("Toshkent");
  const [type, setType] = useState<"" | JobType>("");
  const [salary, setSalary] = useState("");
  const [sort, setSort] = useState("");
  const [experience, setExperience] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [filters, setFilters] = useState(false);
  const [sample, setSample] = useState(false);

  const cities = useMemo(() => Array.from(new Set([...jobCities, ...catalog.map((j) => j.city)])), [catalog]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minSalary = Number(salary) || 0;
    const minExp = experience === "" ? null : Number(experience);
    const pattern = jobTiles.find((t) => t.id === tile)?.match;
    const rows = [...catalog.map(fromJob), ...samples].filter((row) => {
      if (pattern && !pattern.test(row.text)) return false;
      if (city !== "all" && row.city !== city) return false;
      if (type && row.type !== type) return false;
      if (minSalary && Math.max(row.salaryMin, row.salaryMax) < minSalary) return false;
      if (minExp !== null) {
        if (!row.job) return false;
        if (minExp === 0 ? row.job.experienceYears !== 0 : row.job.experienceYears < minExp) return false;
      }
      if (onlySaved && !(row.job && saved.has(row.id))) return false;
      return !q || row.text.includes(q);
    });
    const real = (r: Row) => Number(Boolean(r.job));
    if (sort === "salary") rows.sort((a, b) => real(b) - real(a) || Math.max(b.salaryMin, b.salaryMax) - Math.max(a.salaryMin, a.salaryMax));
    else if (sort === "old") rows.sort((a, b) => real(b) - real(a) || a.ts - b.ts);
    else rows.sort((a, b) => real(b) - real(a) || b.ts - a.ts || a.rank - b.rank);
    return rows;
  }, [catalog, city, experience, onlySaved, query, salary, saved, sort, tile, type]);

  const extra = (experience ? 1 : 0) + (onlySaved ? 1 : 0);

  return (
    <div className="im" data-testid="ishlar-mobile">
      <div className="im-body">
        <MobileBrandBar search />
        <div className="mb-head">
          <h1>Ishlar</h1>
          <p>Stomatologiya sohasidagi vakansiyalar va ish e’lonlari</p>
        </div>
        <div className="im-search">
          <Search />
          <input data-section-search value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Lavozim, klinika yoki shaharni qidiring..." aria-label="Qidiruv" data-testid="ishlar-search" />
          <button type="button" aria-label="Filtrlar" data-testid="ishlar-filter-btn" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
            {extra ? <em>{extra}</em> : null}
          </button>
        </div>
        <div className="im-tiles" data-testid="ishlar-segments">
          {jobTiles.map((t) => (
            <button key={t.id || "all"} type="button" className={tile === t.id ? "on" : undefined} aria-pressed={tile === t.id} data-chip={t.id || "all"} onClick={() => setTile(t.id)}>
              <img src={t.icon} alt="" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="im-drops">
          <label>
            <MapPin />
            <select aria-label="Shahar" data-testid="ishlar-city" value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="all">Barcha shaharlar</option>
            </select>
            <ChevronDown />
          </label>
          <label>
            <BriefcaseBusiness />
            <select aria-label="Bandlik turi" value={type} onChange={(e) => setType(e.target.value as "" | JobType)}>
              <option value="">Bandlik turi</option>
              {(Object.keys(jobTypeLabels) as JobType[]).map((t) => <option key={t} value={t}>{mobileTypeText[t]}</option>)}
            </select>
            <ChevronDown />
          </label>
          <label>
            <Coins />
            <select aria-label="Maosh" value={salary} onChange={(e) => setSalary(e.target.value)}>
              <option value="">Maosh</option>
              {salaryFilters.filter((s) => s.value).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown />
          </label>
          <label>
            <ArrowUpDown />
            <select aria-label="Saralash" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="">Saralash</option>
              <option value="new">Eng yangi</option>
              <option value="old">Eng eski</option>
              <option value="salary">Maosh yuqori</option>
            </select>
            <ChevronDown />
          </label>
        </div>
        <span className="im-count" data-testid="ishlar-count">{ready ? `${list.length} ta` : "…"}</span>
        {ready && list.length === 0 ? (
          <div className="im-empty" data-testid="ishlar-empty">
            <Briefcase />
            <p>Mos vakansiya topilmadi — filtrlarni o‘zgartiring.</p>
          </div>
        ) : null}
        <div className="im-list">
          {list.map((row) => (
            <JobCard
              key={row.id}
              row={row}
              saved={saved.has(row.id)}
              applied={row.job ? hasApplied(row.id) : false}
              onSave={() => (row.job ? saved.toggle(row.id) : setSample(true))}
              onApply={() => (row.job ? onApply(row.job) : setSample(true))}
              onSample={() => setSample(true)}
            />
          ))}
        </div>
        <div className="im-links">
          <button type="button" onClick={onResume} data-testid="ishlar-resume"><Upload /> {hasResume ? "Rezyumeni tahrirlash" : "Rezyume joylash"}</button>
          <NavRow href="/ishlar/vakansiyalarim" icon={<Briefcase />} title="Mening vakansiyalarim" sub={myJobs.length ? `${myJobs.length} ta vakansiya · kelgan arizalar` : "Vakansiyalar va kelgan arizalar"} />
          <NavRow href="/ishlar/arizalarim" icon={<ClipboardList />} title="Mening arizalarim" sub="Yuborilgan arizalarni kuzating" />
        </div>
        <div className="im-pad" />
      </div>
      <button type="button" className="im-post" data-testid="ishlar-post" onClick={onPost}>
        <Plus /> E’lon joylash <ArrowRight />
      </button>
      {sample ? (
        <div className="mb-sheet" role="dialog" aria-label="Namuna vakansiya" data-testid="ishlar-info-sample">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setSample(false)} />
          <div className="mb-panel">
            <h3>Namuna vakansiya</h3>
            <p>Bu kartochka bo‘lim qanday ko‘rinishini ko‘rsatish uchun qo‘yilgan — u haqiqiy vakansiya emas, unga ariza topshirib bo‘lmaydi.</p>
            <p>Admin tasdiqlagan vakansiyalar ro‘yxat boshida chiqadi. Xodim kerak bo‘lsa, e’lon joylang.</p>
            <div className="row">
              <button type="button" onClick={() => setSample(false)}>Yopish</button>
              <button type="button" className="go" onClick={() => { setSample(false); onPost(); }}>E’lon joylash</button>
            </div>
          </div>
        </div>
      ) : null}
      {filters ? (
        <div className="mb-sheet" role="dialog" aria-label="Filtrlar">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setFilters(false)} />
          <div className="mb-panel">
            <h3>Filtrlar</h3>
            <select aria-label="Tajriba" value={experience} onChange={(e) => setExperience(e.target.value)}>
              {experienceFilters.map((s) => <option key={s.value || "all"} value={s.value}>{s.label}</option>)}
            </select>
            <label className="im-check">
              <input type="checkbox" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} /> <Bookmark /> Faqat saqlanganlar
            </label>
            <div className="row">
              <button type="button" onClick={() => { setExperience(""); setOnlySaved(false); }}>Tozalash</button>
              <button type="button" className="go" onClick={() => setFilters(false)}>Ko‘rsatish ({list.length})</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function JobCard({ row, saved, applied, onSave, onApply, onSample }: { row: Row; saved: boolean; applied: boolean; onSave: () => void; onApply: () => void; onSample: () => void }) {
  const href = row.job ? `/ishlar/${row.id}` : null;
  const photo = (
    <>
      {row.image ? <img src={row.image} alt="" /> : <span className="im-ph-empty"><Briefcase /></span>}
      {row.job ? null : <span className="im-tag">Namuna</span>}
    </>
  );
  const body = (
    <>
      <h2>{row.title}</h2>
      <p className="im-clinic">{row.clinic}</p>
      <p className="im-place">
        {row.place ? <span><MapPin /> {row.place}</span> : null}
        <em className={row.typeTone}>{row.sample?.typeText ?? mobileTypeText[row.type]}</em>
      </p>
      <p className={row.salaryMin || row.salaryMax ? "im-salary" : "im-salary none"}>{salaryLine(row)}</p>
    </>
  );
  return (
    <article className="im-card" data-testid="job-card" data-real={row.job ? "1" : undefined}>
      {href ? <Link href={href} className="im-photo" aria-label={`${row.title} — batafsil`}>{photo}</Link> : <button type="button" className="im-photo" aria-label={`${row.title} — namuna`} onClick={onSample}>{photo}</button>}
      <div className="im-main">
        {href ? <Link href={href} className="im-copy" data-testid="job-open">{body}</Link> : <div className="im-copy">{body}</div>}
        <div className="im-foot">
          <span><BriefcaseBusiness /> {row.exp}</span>
          <span data-testid="job-time"><CalendarDays /> {row.ago}</span>
        </div>
        {applied && href ? (
          <Link href="/ishlar/arizalarim" className="im-apply done" data-testid="job-applied">Ariza yuborilgan <ChevronRight /></Link>
        ) : (
          <button type="button" className="im-apply" data-testid="job-apply" onClick={onApply}>Ariza topshirish <ArrowRight /></button>
        )}
      </div>
      <button type="button" className={saved ? "im-save on" : "im-save"} aria-label={saved ? "Saqlanganlardan olib tashlash" : "Saqlash"} aria-pressed={saved} data-testid="job-save" onClick={onSave}>
        <Bookmark fill={saved ? "currentColor" : "none"} />
      </button>
    </article>
  );
}

function NavRow({ href, icon, title, sub }: { href: string; icon: ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} className="im-nav">
      <i>{icon}</i>
      <span><b>{title}</b>{sub}</span>
      <ChevronRight />
    </Link>
  );
}
