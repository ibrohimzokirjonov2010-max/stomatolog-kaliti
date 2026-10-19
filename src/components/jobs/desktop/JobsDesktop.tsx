"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookmarkCheck,
  CalendarDays,
  ChevronDown,
  FileText,
  Heart,
  Lightbulb,
  MapPin,
  MessageCircle,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { JobApplyForm } from "@/components/job-apply-form";
import { Modal, PostJobForm, ProfileView, ResumeForm } from "@/components/job-forms";
import { useJobsWork } from "@/components/jobs-provider";
import { RangeSlider } from "@/components/shop/desktop/parts";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import type { Candidate, Job } from "@/data/jobs";
import {
  SALARY_MAX,
  SALARY_MIN,
  expTag,
  jobCities,
  jobExps,
  jobSpecs,
  jobTips,
  jobTypes,
  popularClinics,
  typeLabel,
  type DesktopJob,
  type JobExp,
  type JobSpec,
  type JobType,
} from "@/data/desktop-jobs";
import "./jobs.css";

type Tab = "jobs" | "resumes" | "saved";
/** A vacancy row: a moderated vacancy from the database (`job`), or a design sample. */
type JobView = DesktopJob & { job?: Job; top?: boolean };

const SAVED_KEY = "sh-jobs-saved-v1";
const tipIcons = [FileText, MessageCircle, Wallet, TrendingUp, Sparkles];

function specOf(title: string): JobSpec {
  const t = title.toLowerCase();
  if (/ortodont/.test(t)) return "ortodont";
  if (/ortoped|protez/.test(t)) return "ortoped";
  if (/jarroh|implant/.test(t)) return "jarroh";
  if (/bolalar|pediatr/.test(t)) return "bolalar";
  if (/gigiyen/.test(t)) return "gigiyenist";
  if (/texnik|laborant/.test(t)) return "texnik";
  if (/assistent|hamshira/.test(t)) return "assistent";
  if (/admin|menejer|resepsion/.test(t)) return "admin";
  return "terapevt";
}

function ago(iso?: string) {
  if (!iso) return "yaqinda";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "bugun";
  if (days < 7) return `${days} kun oldin`;
  if (days < 30) return `${Math.floor(days / 7)} hafta oldin`;
  return `${Math.floor(days / 30)} oy oldin`;
}

function fromDb(job: Job): JobView {
  const type: JobType = job.remote ? "masofa" : job.type === "part" ? "yarim" : job.type === "shift" ? "smena" : job.type === "freelance" ? "masofa" : "toliq";
  const exp: JobExp = job.experienceYears >= 5 ? "y5" : job.experienceYears >= 3 ? "y3" : job.experienceYears >= 1 ? "y1" : "yoq";
  return {
    id: job.id,
    title: job.title,
    clinic: job.clinic,
    city: job.city,
    district: job.district ?? "",
    spec: specOf(job.title),
    type,
    exp,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax ?? job.salaryMin,
    posted: ago(job.createdAt),
    fresh: 1000 + (job.createdAt ? new Date(job.createdAt).getTime() / 1e10 : 0),
    blurb: job.description,
    image: job.photos?.[0] ?? job.logo ?? "",
    verified: true,
    job,
  };
}

function money(value: number) {
  return value.toLocaleString("ru-RU").replace(/,/g, " ").replace(/ /g, " ");
}

function salaryText(item: JobView) {
  if (!item.salaryMin && !item.salaryMax) return "Kelishiladi";
  if (item.salaryMax && item.salaryMax !== item.salaryMin) return `${money(item.salaryMin)} – ${money(item.salaryMax)} so‘m`;
  return `${money(item.salaryMin)} so‘m dan`;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function JobsDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const work = useJobsWork();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [tab, setTab] = useState<Tab>(() => (params.get("tab") === "rezyumelar" ? "resumes" : params.get("tab") === "saqlangan" ? "saved" : "jobs"));
  const [cities, setCities] = useState<string[]>(["Toshkent"]);
  const [specs, setSpecs] = useState<JobSpec[]>([]);
  const [types, setTypes] = useState<JobType[]>([]);
  const [exps, setExps] = useState<JobExp[]>([]);
  const [salary, setSalary] = useState<[number, number]>([SALARY_MIN, SALARY_MAX]);
  const [sort, setSort] = useState("fresh");
  const [clinic, setClinic] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [apply, setApply] = useState<JobView | null>(null);
  const [sample, setSample] = useState<JobView | null>(null);
  const [form, setForm] = useState<"" | "vacancy" | "resume">(() => (params.get("joylash") === "vakansiya" ? "vacancy" : params.get("joylash") === "rezyume" ? "resume" : ""));
  const [person, setPerson] = useState<Candidate | null>(null);
  const [tip, setTip] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the saved list once
      if (Array.isArray(raw)) setSaved(raw.filter((x): x is string => typeof x === "string"));
    } catch {
      /* private mode */
    }
  }, []);

  function toggleSaved(id: string) {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      try {
        window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }

  const all = useMemo<JobView[]>(() => work.catalog.filter((job) => !job.mine).map(fromDb), [work.catalog]);
  const salaryOn = salary[0] > SALARY_MIN || salary[1] < SALARY_MAX;

  const matches = (item: JobView, skip?: "city" | "spec" | "type" | "exp") => {
    const cityKey = jobCities.some((c) => c.id === item.city) ? item.city : "Boshqa";
    if (skip !== "city" && cities.length && !cities.includes(cityKey)) return false;
    if (skip !== "spec" && specs.length && !specs.includes(item.spec)) return false;
    if (skip !== "type" && types.length && !types.includes(item.type)) return false;
    if (skip !== "exp" && exps.length && !exps.includes(item.exp)) return false;
    if (salaryOn && ((item.salaryMax || item.salaryMin) < salary[0] || item.salaryMin > salary[1])) return false;
    if (clinic && item.clinic !== clinic) return false;
    if (q && !`${item.title} ${item.clinic} ${item.city} ${item.district} ${item.blurb}`.toLowerCase().includes(q)) return false;
    return true;
  };

  const items = useMemo(() => {
    const base = tab === "saved" ? all.filter((item) => saved.includes(item.id)) : all;
    const rows = base.filter((item) => matches(item));
    return [...rows].sort((a, b) => {
      if (sort === "pay") return (b.salaryMax || b.salaryMin) - (a.salaryMax || a.salaryMin);
      if (sort === "payLow") return a.salaryMin - b.salaryMin;
      return b.fresh - a.fresh;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- matches reads the same filter state listed here
  }, [all, cities, clinic, exps, q, salary, saved, sort, specs, tab, types]);

  const count = (key: "city" | "spec" | "type" | "exp", value: string) =>
    all.filter((item) => {
      const v = key === "city" ? (jobCities.some((c) => c.id === item.city) ? item.city : "Boshqa") : item[key];
      return v === value && matches(item, key);
    }).length;

  const clinics = useMemo(() => {
    const byName = new Map<string, number>();
    all.forEach((item) => byName.set(item.clinic, (byName.get(item.clinic) ?? 0) + 1));
    return popularClinics.map((row) => ({ ...row, openings: byName.get(row.name) ?? 0 }));
  }, [all]);

  function toggle<T>(current: T[], value: T, set: (next: T[]) => void) {
    set(current.includes(value) ? current.filter((x) => x !== value) : [...current, value]);
  }

  function reset() {
    setCities([]);
    setSpecs([]);
    setTypes([]);
    setExps([]);
    setSalary([SALARY_MIN, SALARY_MAX]);
    setClinic("");
  }

  function onApply(item: JobView) {
    if (item.job) setApply(item);
    else setSample(item);
  }

  const resumes = work.resumes.filter((item) => !item.mine);

  return (
    <ShopShell searchPath="/ishlar" cartCount={cartCount} placeholder="Lavozim, klinika yoki shahar bo‘yicha qidirish..." showCamera={false}>
      <div className="ij" data-testid="jobs-page">
        <div className="ij-main">
          <nav className="ij-crumbs" aria-label="Breadcrumb"><Link href="/">Bosh sahifa</Link> <span>›</span> <b>Ishlar</b></nav>
          <div className="ij-head">
            <div>
              <h1>Ishlar</h1>
              <p>Stomatologlar va klinika xodimlari uchun eng yaxshi imkoniyatlar</p>
            </div>
            <div className="ij-head-acts">
              <button type="button" className="ij-outline" onClick={() => setForm("resume")}>Rezyume joylash</button>
              <button type="button" className="ij-post" onClick={() => setForm("vacancy")}><Plus className="i" /> Vakansiya joylash</button>
            </div>
          </div>

          <div className="ij-tabs" role="tablist" aria-label="Bo‘lim">
            {([["jobs", "Vakansiyalar"], ["resumes", "Rezyumelar"], ["saved", "Saqlanganlar"]] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
                {label}{id === "saved" && saved.length ? ` (${saved.length})` : ""}
              </button>
            ))}
          </div>

          {tab === "resumes" ? (
            <section className="ij-resumes">
              <div className="ij-list-hd"><b>{resumes.length} ta rezyume</b></div>
              {resumes.length ? (
                <div className="ij-rgrid">
                  {resumes.map((item) => (
                    <article key={item.id} className="ij-rcard">
                      <span className="ava">{item.photo ? <img src={item.photo} alt="" /> : initials(item.name)}</span>
                      <div className="txt">
                        <b>{item.name}</b>
                        <span>{item.role}</span>
                        <small><MapPin className="i" /> {item.city} · {item.experienceYears} yil tajriba</small>
                        {item.salaryFrom ? <em>{money(item.salaryFrom)} so‘m dan</em> : null}
                      </div>
                      <button type="button" className="ij-apply" onClick={() => setPerson(item)}>Profil <ArrowRight className="i" /></button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="ij-empty">
                  <b>Hozircha e’lon qilingan rezyume yo‘q</b>
                  <p>Moderatsiyadan o‘tgan rezyumelar shu yerda chiqadi. O‘zingiznikini joylang — klinikalar sizni topadi.</p>
                  <button type="button" className="ij-apply" onClick={() => setForm("resume")}>Rezyume joylash <ArrowRight className="i" /></button>
                </div>
              )}
            </section>
          ) : (
            <div className="ij-cols">
              <aside className="ij-panel" aria-label="Filtrlar">
                <div className="ij-panel-hd"><h3>Filtrlar</h3><button type="button" onClick={reset}>Barchasini tozalash</button></div>
                <FilterGroup title="Shahar">
                  {jobCities.map((item) => <Check key={item.id} label={item.label} count={count("city", item.id)} on={cities.includes(item.id)} onClick={() => toggle(cities, item.id, setCities)} />)}
                </FilterGroup>
                <FilterGroup title="Mutaxassislik">
                  {jobSpecs.map((item) => <Check key={item.id} label={item.label} count={count("spec", item.id)} on={specs.includes(item.id)} onClick={() => toggle(specs, item.id, setSpecs)} />)}
                </FilterGroup>
                <FilterGroup title="Maosh oralig‘i (so‘m)">
                  <div className="ij-salary">
                    <MoneyInput label="Maosh: dan" value={salary[0]} onCommit={(v) => setSalary([Math.max(SALARY_MIN, Math.min(v, salary[1])), salary[1]])} />
                    <i>–</i>
                    <MoneyInput label="Maosh: gacha" value={salary[1]} onCommit={(v) => setSalary([salary[0], Math.min(SALARY_MAX, Math.max(v, salary[0]))])} />
                  </div>
                  <RangeSlider min={SALARY_MIN} max={SALARY_MAX} step={500_000} value={salary} onChange={setSalary} labels={["3M", "30M"]} />
                </FilterGroup>
                <FilterGroup title="Tajriba">
                  {jobExps.map((item) => <Check key={item.id} label={item.label} count={count("exp", item.id)} on={exps.includes(item.id)} onClick={() => toggle(exps, item.id, setExps)} />)}
                </FilterGroup>
                <FilterGroup title="Ish turi">
                  {jobTypes.map((item) => <Check key={item.id} label={item.label} count={count("type", item.id)} on={types.includes(item.id)} onClick={() => toggle(types, item.id, setTypes)} />)}
                </FilterGroup>
              </aside>

              <section className="ij-list">
                <div className="ij-list-hd">
                  <b>{items.length} ta vakansiya</b>
                  {clinic ? <button type="button" className="ij-chip" onClick={() => setClinic("")}>{clinic} <X className="i" /></button> : null}
                  <label className="ij-sort">
                    <span>Saralash:</span>
                    <select value={sort} aria-label="Saralash" onChange={(event) => setSort(event.target.value)}>
                      <option value="fresh">Eng yangi</option>
                      <option value="pay">Maosh: yuqoridan</option>
                      <option value="payLow">Maosh: pastdan</option>
                    </select>
                    <ChevronDown className="i" />
                  </label>
                </div>
                {items.length === 0 ? (
                  <div className="ij-empty">
                    <b>{tab === "saved" ? "Saqlangan vakansiya yo‘q" : work.catalog.length === 0 ? "Hozircha vakansiya yo‘q" : "Mos vakansiya topilmadi"}</b>
                    <p>{tab === "saved" ? "Vakansiyadagi “Saqlash” tugmasini bosing — u shu yerda turadi." : "Filtrlarni o‘zgartirib ko‘ring."}</p>
                    {tab === "saved" ? <button type="button" className="ij-apply" onClick={() => setTab("jobs")}>Vakansiyalar</button> : <button type="button" className="ij-apply" onClick={reset}>Filtrlarni tozalash</button>}
                  </div>
                ) : (
                  <div className="ij-cards">
                    {items.slice(0, 60).map((item) => (
                      <JobCard key={item.id} item={item} saved={saved.includes(item.id)} applied={item.job ? work.hasApplied(item.id) : false} onSave={() => toggleSaved(item.id)} onApply={() => onApply(item)} />
                    ))}
                    {items.length > 60 ? <p className="ij-more">Yana {items.length - 60} ta vakansiya — filtrlar bilan toraytiring.</p> : null}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        <aside className="ij-rail">
          <section className="ij-box ij-cv">
            <img src="/img/jobs/d-resume.jpg" alt="" />
            <div className="txt">
              <h3>Rezyume yarating</h3>
              <p>Eng yaxshi klinikalar sizni topishi uchun professional rezyume joylang.</p>
              <button type="button" className="ij-apply wide" onClick={() => setForm("resume")}>{work.resume ? "Rezyumeni tahrirlash" : "Rezyume joylash"} <ArrowRight className="i" /></button>
            </div>
          </section>

          <section className="ij-box">
            <div className="ij-box-hd"><h3>Mashhur klinikalar</h3><button type="button" onClick={() => { setClinic(""); setTab("jobs"); }}>Barchasini ko‘rish <ArrowRight className="i" /></button></div>
            <ul className="ij-clinics">
              {clinics.map((row) => (
                <li key={row.name}>
                  <button type="button" className={clinic === row.name ? "on" : ""} onClick={() => { setTab("jobs"); setClinic(clinic === row.name ? "" : row.name); }}>
                    <img src={row.image} alt="" />
                    <span><b>{row.name}</b><small>{row.city}</small></span>
                    <em>{row.openings} ta vakansiya</em>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="ij-box">
            <h3 className="ij-tips-hd"><Lightbulb className="i" /> Foydali maslahatlar</h3>
            <ul className="ij-tips">
              {jobTips.map((row, index) => {
                const Icon = tipIcons[index % tipIcons.length];
                return <li key={row.title}><button type="button" onClick={() => setTip(index)}><Icon className="i" /> {row.title}</button></li>;
              })}
            </ul>
          </section>
        </aside>

        {apply?.job ? (
          <Modal title={`Ariza: ${apply.title}`} onClose={() => setApply(null)}>
            <JobApplyForm job={apply.job} onCancel={() => setApply(null)} onSuccess={() => setApply(null)} />
          </Modal>
        ) : null}
        {form === "vacancy" ? <Modal title="Vakansiya joylash" onClose={() => setForm("")}><PostJobForm onDone={() => setForm("")} onCancel={() => setForm("")} /></Modal> : null}
        {form === "resume" ? <Modal title={work.resume ? "Rezyumeni tahrirlash" : "Rezyume joylash"} onClose={() => setForm("")}><ResumeForm initial={work.resume} onDone={() => setForm("")} onCancel={() => setForm("")} /></Modal> : null}
        {person ? <Modal title="Rezyume" onClose={() => setPerson(null)}><ProfileView person={person} onClose={() => setPerson(null)} /></Modal> : null}

        {sample ? (
          <Dialog title="Namuna vakansiya" onClose={() => setSample(null)}>
            <p className="lead"><b>{sample.title}</b> · {sample.clinic}</p>
            <p>Bu vakansiya sahifa dizaynini ko‘rsatish uchun qo‘yilgan namuna — unga ariza yuborilmaydi.</p>
            <p>Moderatsiyadan o‘tgan haqiqiy vakansiyalar ro‘yxat boshida chiqadi va ularga ariza to‘g‘ridan-to‘g‘ri ish beruvchiga boradi.</p>
            <div className="acts">
              <button type="button" className="ij-outline" onClick={() => { setSample(null); setForm("resume"); }}>Rezyume joylash</button>
              <button type="button" className="ij-apply" onClick={() => setSample(null)}>Tushunarli</button>
            </div>
          </Dialog>
        ) : null}
        {tip !== null ? (
          <Dialog title={jobTips[tip].title} onClose={() => setTip(null)}>
            <p>{jobTips[tip].text}</p>
            <div className="acts">
              {tip < jobTips.length - 1 ? <button type="button" className="ij-outline" onClick={() => setTip(tip + 1)}>Keyingi maslahat</button> : null}
              <button type="button" className="ij-apply" onClick={() => setTip(null)}>Yopish</button>
            </div>
          </Dialog>
        ) : null}
      </div>
    </ShopShell>
  );
}

function JobCard({ item, saved, applied, onSave, onApply }: { item: JobView; saved: boolean; applied: boolean; onSave: () => void; onApply: () => void }) {
  const href = item.job ? `/ishlar/${item.id}` : undefined;
  const title = href ? <Link href={href}>{item.title}</Link> : item.title;
  return (
    <article className="ij-card" data-testid="job-card" data-real={item.job ? "1" : undefined}>
      <div className="ph">
        {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span className="ph-ini">{initials(item.clinic)}</span>}
        {item.top ? <span className="top">Top</span> : null}
      </div>
      <div className="mid">
        <h3>{title}</h3>
        <p className="who"><b>{item.clinic}</b> {item.verified ? <BadgeCheck className="i badge" aria-label="Tasdiqlangan" /> : null} <MapPin className="i pin" /> <span>{item.city}{item.district ? `, ${item.district}` : ""}</span></p>
        <div className="tags"><span>{typeLabel(item.type)}</span><span>{expTag(item.exp)}</span></div>
        <p className="blurb">{item.blurb}</p>
      </div>
      <div className="side">
        <strong>{salaryText(item)}</strong>
        <small><CalendarDays className="i" /> {item.posted}</small>
        <div className="acts">
          <button type="button" className={saved ? "ij-save on" : "ij-save"} aria-pressed={saved} onClick={onSave}>{saved ? <BookmarkCheck className="i" /> : <Heart className="i" />} {saved ? "Saqlangan" : "Saqlash"}</button>
          <button type="button" className="ij-apply" disabled={applied} onClick={onApply}>{applied ? "Ariza yuborilgan" : "Ariza topshirish"} {applied ? null : <ArrowRight className="i" />}</button>
        </div>
      </div>
    </article>
  );
}

function MoneyInput({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const v = Number(draft.replace(/\D/g, ""));
    setDraft(null);
    if (v) onCommit(v);
  };
  return (
    <input
      aria-label={label}
      inputMode="numeric"
      value={draft ?? money(value)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => event.key === "Enter" && commit()}
    />
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return <section className="ij-group"><h4>{title}</h4>{children}</section>;
}

function Check({ label, count, on, onClick }: { label: string; count: number; on: boolean; onClick: () => void }) {
  return (
    <button type="button" className={on ? "ij-check on" : "ij-check"} aria-pressed={on} onClick={onClick}>
      <i className="cb" aria-hidden />
      <span>{label}</span>
      <em>{count}</em>
    </button>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="ij-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="ij-dialog">
        <div className="hd"><h3>{title}</h3><button type="button" aria-label="Yopish" onClick={onClose}><X className="i" /></button></div>
        {children}
      </div>
    </div>
  );
}

