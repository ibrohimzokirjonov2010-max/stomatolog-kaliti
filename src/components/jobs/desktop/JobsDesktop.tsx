"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Bookmark, Briefcase, Check, FileText, MapPin, MessageCircle, Smile, Sparkles, Wallet } from "lucide-react";
import { RangeSlider } from "@/components/shop/desktop/parts";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  SALARY_MAX,
  SALARY_MIN,
  desktopJobs,
  expTag,
  jobCities,
  jobExps,
  jobSpecs,
  jobTips,
  jobTypes,
  popularClinics,
  seedResumes,
  typeLabel,
  type DesktopJob,
  type DesktopResume,
  type JobExp,
  type JobSpec,
  type JobType,
} from "@/data/desktop-jobs";
import "@/components/jihoz/desktop/jihoz.css";

type Tab = "jobs" | "resumes" | "saved";

const tipIcons = [FileText, MessageCircle, Wallet, Briefcase, Sparkles];
const clinicHues = ["#12a8b8", "#3b82f6", "#16a34a", "#1e293b", "#64748b", "#0ea5e9"];

function clinicHue(name: string) {
  let n = 0;
  for (const ch of name) n += ch.charCodeAt(0);
  return clinicHues[n % clinicHues.length];
}

export function JobsDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [tab, setTab] = useState<Tab>("jobs");
  const [cities, setCities] = useState<string[]>([]);
  const [specs, setSpecs] = useState<JobSpec[]>([]);
  const [types, setTypes] = useState<JobType[]>([]);
  const [exps, setExps] = useState<JobExp[]>([]);
  const [salary, setSalary] = useState<[number, number]>([SALARY_MIN, SALARY_MAX]);
  const [sort, setSort] = useState("fresh");
  const [saved, setSaved] = useState<string[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const [clinic, setClinic] = useState("");
  const [note, setNote] = useState("");
  const [tip, setTip] = useState("");
  const [resumeOpen, setResumeOpen] = useState(false);
  const [vacancyOpen, setVacancyOpen] = useState(false);
  const [resumes, setResumes] = useState<DesktopResume[]>(seedResumes);
  const [extra, setExtra] = useState<DesktopJob[]>([]);
  const [form, setForm] = useState({ name: "", spec: "", city: "", title: "", clinic: "", salary: "" });

  const salaryOn = salary[0] > SALARY_MIN || salary[1] < SALARY_MAX;
  const all = useMemo(() => [...extra, ...desktopJobs], [extra]);

  function count(pred: (job: DesktopJob) => boolean) {
    return all.filter(pred).length;
  }

  const items = useMemo(() => {
    let rows = all.filter((job) => {
      if (cities.length && !cities.includes(job.city)) return false;
      if (specs.length && !specs.includes(job.spec)) return false;
      if (types.length && !types.includes(job.type)) return false;
      if (exps.length && !exps.includes(job.exp)) return false;
      if (clinic && job.clinic !== clinic) return false;
      if (salaryOn && (job.salaryMax < salary[0] || job.salaryMin > salary[1])) return false;
      if (q && !`${job.title} ${job.clinic} ${job.city} ${job.district}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "high") return b.salaryMax - a.salaryMax;
      if (sort === "low") return a.salaryMin - b.salaryMin;
      return b.fresh - a.fresh;
    });
    return rows;
  }, [all, cities, clinic, exps, q, salary, salaryOn, sort, specs, types]);

  const savedJobs = all.filter((job) => saved.includes(job.id));

  function toggle<T>(list: T[], value: T, set: (next: T[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function reset() {
    setCities([]);
    setSpecs([]);
    setTypes([]);
    setExps([]);
    setSalary([SALARY_MIN, SALARY_MAX]);
    setClinic("");
  }

  return (
    <ShopShell searchPath="/ishlar" cartCount={cartCount} placeholder="Lavozim, klinika yoki shahar bo‘yicha qidiring..." showCamera={false}>
      <div className="jb-page">
        <div className="jz-crumbs"><Link href="/">Bosh sahifa</Link><span>›</span><b>Ishlar</b></div>
        <div className="jb-top">
          <div>
            <h1>Ishlar</h1>
            <p>Stomatologlar va klinika xodimlari uchun eng yaxshi imkoniyatlar</p>
          </div>
          <div className="jb-actions">
            <button type="button" className="ghost" onClick={() => setResumeOpen(true)}>Rezyume joylash</button>
            <button type="button" className="solid" onClick={() => setVacancyOpen(true)}>+ Vakansiya joylash</button>
          </div>
        </div>
        <div className="jb-tabs">
          <button type="button" className={tab === "jobs" ? "jb-tab on" : "jb-tab"} onClick={() => setTab("jobs")}>Vakansiyalar</button>
          <button type="button" className={tab === "resumes" ? "jb-tab on" : "jb-tab"} onClick={() => setTab("resumes")}>Rezyumelar</button>
          <button type="button" className={tab === "saved" ? "jb-tab on" : "jb-tab"} onClick={() => setTab("saved")}>Saqlanganlar</button>
        </div>

        <div className="jb-cols">
          <aside className="jb-panel">
            <h3>Filtrlar <button type="button" onClick={reset}>Barchasini tozalash</button></h3>
            <h4>Shahar</h4>
            {jobCities.map((item) => (
              <button key={item.id} type="button" className={cities.includes(item.id) ? "jb-check on" : "jb-check"} onClick={() => toggle(cities, item.id, setCities)}>
                <i className="jb-boxi">{cities.includes(item.id) ? <Check className="i" /> : null}</i>
                {item.label}<em>{count((job) => job.city === item.id)}</em>
              </button>
            ))}
            <h4>Mutaxassislik</h4>
            {jobSpecs.map((item) => (
              <button key={item.id} type="button" className={specs.includes(item.id) ? "jb-check on" : "jb-check"} onClick={() => toggle(specs, item.id, setSpecs)}>
                <i className="jb-boxi">{specs.includes(item.id) ? <Check className="i" /> : null}</i>
                {item.label}<em>{count((job) => job.spec === item.id)}</em>
              </button>
            ))}
            <h4>Maosh oralig‘i (so‘m)</h4>
            <RangeSlider min={SALARY_MIN} max={SALARY_MAX} step={1_000_000} value={salary} onChange={setSalary} labels={["3 000 000", "30 000 000"]} />
            <h4>Tajriba</h4>
            {jobExps.map((item) => (
              <button key={item.id} type="button" className={exps.includes(item.id) ? "jb-check on" : "jb-check"} onClick={() => toggle(exps, item.id, setExps)}>
                <i className="jb-boxi">{exps.includes(item.id) ? <Check className="i" /> : null}</i>
                {item.label}<em>{count((job) => job.exp === item.id)}</em>
              </button>
            ))}
            <h4>Ish turi</h4>
            {jobTypes.map((item) => (
              <button key={item.id} type="button" className={types.includes(item.id) ? "jb-check on" : "jb-check"} onClick={() => toggle(types, item.id, setTypes)}>
                <i className="jb-boxi">{types.includes(item.id) ? <Check className="i" /> : null}</i>
                {item.label}<em>{count((job) => job.type === item.id)}</em>
              </button>
            ))}
          </aside>

          <div>
            {tab === "jobs" || tab === "saved" ? (
              <>
                <div className="jz-tools">
                  <b>{tab === "saved" ? savedJobs.length : items.length} ta vakansiya</b>
                  <label className="jz-count" style={{ display: "flex", alignItems: "center", gap: "calc(.3 * var(--u))" }}>
                    Saralash:
                    <select className="jz-select" style={{ width: "auto" }} value={sort} aria-label="Saralash" onChange={(event) => setSort(event.target.value)}>
                      <option value="fresh">Eng yangi</option>
                      <option value="high">Maosh: yuqori</option>
                      <option value="low">Maosh: past</option>
                    </select>
                  </label>
                </div>
                <div className="jb-list" style={{ marginTop: "calc(.4 * var(--u))" }}>
                  {(tab === "saved" ? savedJobs : items).map((job) => (
                    <article className="jb-card" key={job.id}>
                      <div className="jb-photo">
                        <img className="photo" src={job.image} alt="" />
                        <span className="jb-logo" style={{ background: clinicHue(job.clinic) }} aria-hidden><Smile className="i" /></span>
                      </div>
                      <div>
                        <h3>{job.title}</h3>
                        <div className="jb-clinic-name">{job.clinic} {job.verified ? <BadgeCheck className="i" aria-label="Tasdiqlangan" /> : null}</div>
                        <div className="jb-loc"><MapPin className="i" /> {job.city}{job.district ? `, ${job.district}` : ""}</div>
                        <div className="jb-tags"><span>{typeLabel(job.type)}</span><span>{expTag(job.exp)}</span></div>
                        <p>{job.blurb}</p>
                      </div>
                      <div className="jb-side">
                        <strong>{som(job.salaryMin).replace(" so‘m", "")} – {som(job.salaryMax)}</strong>
                        <small>{job.posted}</small>
                        <div className="rowbtns">
                          <button type="button" className={saved.includes(job.id) ? "jb-save on" : "jb-save"} onClick={() => setSaved((list) => list.includes(job.id) ? list.filter((id) => id !== job.id) : [...list, job.id])}>
                            <Bookmark className="i" /> {saved.includes(job.id) ? "Saqlangan" : "Saqlash"}
                          </button>
                          <button type="button" className="jz-add" onClick={() => setApplied((list) => list.includes(job.id) ? list : [...list, job.id])}>
                            {applied.includes(job.id) ? "Topshirildi" : "Ariza topshirish →"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {tab === "saved" && savedJobs.length === 0 ? <div className="jb-card jb-empty">Hali saqlangan vakansiya yo‘q</div> : null}
                </div>
              </>
            ) : (
              <div className="jb-list">
                {resumes.map((item) => (
                  <article className="jb-card jb-resume" key={item.id}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.spec} · {item.city} · {item.exp}</p>
                    </div>
                    <strong className="jz-price">{item.salary}</strong>
                  </article>
                ))}
              </div>
            )}
            {note ? <p className="jb-note">{note}</p> : null}
          </div>

          <aside className="jb-rail">
            <section className="jb-box jb-promo">
              <img src="/img/jobs/doctor.jpg" alt="" />
              <h3>Rezyume yarating</h3>
              <p>Eng yaxshi klinikalar sizni topishi uchun professional rezyume joylang.</p>
              <button type="button" className="jb-outline" onClick={() => setResumeOpen(true)}>Rezyume joylash →</button>
            </section>
            <section className="jb-box">
              <h3>Mashhur klinikalar <button type="button" onClick={() => setClinic("")}>Barchasini ko‘rish</button></h3>
              {popularClinics.map((item) => (
                <button key={item.name} type="button" className="jb-clinic" onClick={() => { setClinic(item.name); setTab("jobs"); }}>
                  <span className="jb-logo" style={{ background: clinicHue(item.name) }} aria-hidden><Smile className="i" /></span>
                  <div><b>{item.name}</b><span>{item.city}</span><span>{item.openings} ta vakansiya</span></div>
                </button>
              ))}
            </section>
            <section className="jb-box">
              <h3>Foydali maslahatlar</h3>
              {jobTips.map((item, index) => {
                const Icon = tipIcons[index] ?? MapPin;
                return (
                  <button key={item.title} type="button" className="jb-tip" onClick={() => setTip(item.text)}><Icon className="i" /> {item.title}</button>
                );
              })}
              {tip ? <p className="jb-note">{tip}</p> : null}
            </section>
          </aside>
        </div>
      </div>

      {resumeOpen ? (
        <div className="jz-modal" onClick={() => setResumeOpen(false)}>
          <div className="jz-dialog jb-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Rezyume joylash</h3>
            <label>Ism<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Mutaxassislik<input value={form.spec} onChange={(event) => setForm({ ...form, spec: event.target.value })} /></label>
            <label>Shahar<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
            <div className="acts">
              <button type="button" className="jz-add" onClick={() => {
                if (!form.name.trim()) return;
                setResumes((list) => [{ id: `local-${list.length}`, name: form.name, spec: form.spec || "Stomatolog", city: form.city || "Toshkent", exp: "—", salary: "Kelishiladi" }, ...list]);
                setResumeOpen(false);
                setTab("resumes");
                setNote("Rezyume joylandi");
              }}>Joylash</button>
              <button type="button" className="jz-ghost" onClick={() => setResumeOpen(false)}>Bekor qilish</button>
            </div>
          </div>
        </div>
      ) : null}
      {vacancyOpen ? (
        <div className="jz-modal" onClick={() => setVacancyOpen(false)}>
          <div className="jz-dialog jb-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Vakansiya joylash</h3>
            <label>Lavozim<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label>Klinika<input value={form.clinic} onChange={(event) => setForm({ ...form, clinic: event.target.value })} /></label>
            <label>Maosh<input value={form.salary} onChange={(event) => setForm({ ...form, salary: event.target.value })} /></label>
            <div className="acts">
              <button type="button" className="jz-add" onClick={() => {
                if (!form.title.trim()) return;
                setExtra((list) => [{
                  id: `local-job-${list.length}`,
                  title: form.title,
                  clinic: form.clinic || "Klinikam",
                  city: "Toshkent",
                  district: "",
                  spec: "terapevt",
                  type: "toliq",
                  exp: "y1",
                  salaryMin: 8_000_000,
                  salaryMax: 12_000_000,
                  posted: "Hozir",
                  fresh: 200,
                  blurb: "Yangi e’lon.",
                  image: "/img/jobs/c1.jpg",
                  verified: false,
                }, ...list]);
                setVacancyOpen(false);
                setTab("jobs");
                setNote("Vakansiya joylandi");
              }}>Joylash</button>
              <button type="button" className="jz-ghost" onClick={() => setVacancyOpen(false)}>Bekor qilish</button>
            </div>
          </div>
        </div>
      ) : null}
    </ShopShell>
  );
}
