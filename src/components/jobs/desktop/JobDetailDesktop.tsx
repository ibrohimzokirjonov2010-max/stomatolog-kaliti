"use client";
/* eslint-disable @next/next/no-img-element -- employer photos are uploads */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  BadgeCheck,
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  FileText,
  Link2,
  MapPin,
  Send,
  Share2,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { RevealPhone, ReportButton } from "@/components/forms/RevealPhone";
import { useSavedJobs } from "@/components/ishlar-ui";
import { experienceLabel, jobBenefits, jobTypeLabels, postedLabel, type Job } from "@/data/jobs";
import { instagramHref, instagramValue, sourceUrlValue } from "@/lib/add-forms";
import { formatSalaryRange } from "@/lib/format";
import "./job-detail-desktop.css";

const TABS = [
  ["asosiy", "Asosiy ma’lumotlar"],
  ["klinika", "Klinika haqida"],
  ["talablar", "Talablar"],
  ["imtiyozlar", "Imtiyozlar"],
  ["manzil", "Manzil"],
] as const;
type Tab = (typeof TABS)[number][0];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Desktop /ishlar/[id] (mock "vakansiyani ko'rish"). Contact rules are unchanged: phone stays behind RevealPhone. */
export function JobDetailDesktop({ job, applied, onApply }: { job: Job; applied: boolean; onApply: () => void }) {
  const saved = useSavedJobs();
  const [tab, setTab] = useState<Tab>("asosiy");
  const [note, setNote] = useState("");
  const source = sourceUrlValue(job.sourceUrl ?? "");
  const insta = instagramHref(job.instagram ?? "");
  const host = source ? source.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "";
  const place = [job.city, job.district].filter(Boolean).join(", ");
  const isSaved = saved.has(job.id);
  const salary = job.salaryNegotiable && !job.salaryMin ? "Kelishiladi" : formatSalaryRange(job.salaryMin, job.salaryMax);
  const benefits = useMemo(() => jobBenefits.filter((item) => job.benefits?.includes(item.id)), [job.benefits]);
  const photos = (job.photos ?? []).filter(Boolean);

  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 2200);
    return () => window.clearTimeout(timer);
  }, [note]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: job.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNote("Havola nusxalandi");
    } catch {
      /* cancelled */
    }
  }

  function go(next: Tab) {
    setTab(next);
    document.getElementById(`job-${next}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const facts: [React.ReactNode, string, string][] = [
    [<Wallet key="s" />, "Maosh", salary],
    [<Briefcase key="t" />, "Ish turi", jobTypeLabels[job.type]],
    [<BadgeCheck key="e" />, "Tajriba", experienceLabel(job.experienceYears)],
    [<MapPin key="p" />, "Joylashuv", place || "—"],
    ...(job.workHours || job.workDays ? [[<Clock key="h" />, "Ish vaqti", [job.workDays, job.workHours].filter(Boolean).join(", ")] as [React.ReactNode, string, string]] : []),
    ...(host ? [[<Link2 key="m" />, "E’lon manbasi", host] as [React.ReactNode, string, string]] : []),
    [<CalendarDays key="d" />, "Joylashtirilgan", postedLabel(job.postedDaysAgo)],
  ];

  return (
    <div className="jdd" data-testid="job-detail-desktop">
      <article className="jdd-card">
        <div className="jdd-bar">
          <Link href="/ishlar"><ArrowLeft /> Barcha vakansiyalar</Link>
          <span>
            <button type="button" onClick={() => void share()}><Share2 /> Ulashish</button>
            <button type="button" className={isSaved ? "on" : undefined} aria-pressed={isSaved} onClick={() => saved.toggle(job.id)}><Bookmark fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "Saqlangan" : "Saqlash"}</button>
          </span>
        </div>

        <header className="jdd-head">
          <span className="jdd-logo">{job.logo ? <img src={job.logo} alt="" /> : initials(job.clinic)}</span>
          <div className="jdd-title">
            <h1>{job.title} {job.verified ? <BadgeCheck className="ok" aria-label="Tasdiqlangan" /> : null}</h1>
            <p className="clinic">{job.clinic}{host ? ` (${host.split(".")[0].toUpperCase()} e’loni)` : ""}</p>
            <p className="meta">
              {place ? <span><MapPin /> {place}</span> : null}
              <span><Briefcase /> {jobTypeLabels[job.type]}</span>
              <span><BadgeCheck /> {experienceLabel(job.experienceYears)}</span>
              <span><CalendarDays /> {postedLabel(job.postedDaysAgo)}</span>
            </p>
            <strong>{salary}</strong>
          </div>
          <div className="jdd-cta">
            <span className="type">{jobTypeLabels[job.type]}</span>
            {job.mine ? (
              <Link href={`/ishlar/yangi?id=${job.id}`} className="go">Tahrirlash</Link>
            ) : applied ? (
              <Link href="/ishlar/arizalarim" className="done"><Check /> Ariza yuborildi</Link>
            ) : job.acceptApplications === false ? null : (
              <button type="button" className="go" onClick={onApply}><Send /> Ariza yuborish</button>
            )}
            {!job.mine ? (
              <span className="phone">{job.phone ? <a href={`tel:${job.phone.replace(/\s/g, "")}`}>{job.phone}</a> : <RevealPhone kind="job" id={job.id} />}</span>
            ) : null}
          </div>
        </header>

        <nav className="jdd-tabs" aria-label="Bo‘limlar">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? "on" : undefined} onClick={() => go(id)}>{label}</button>
          ))}
        </nav>

        <div className="jdd-body">
          <div className="jdd-main">
            <section id="job-asosiy" className="jdd-sec">
              <h2><i><FileText /></i> Tavsif</h2>
              <p className="copy">{job.description || "Tavsif yozilmagan."}</p>
              {job.duties?.length ? (
                <div className="jdd-quote">
                  <b>Vazifalar:</b>
                  <ul>{job.duties.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              ) : null}
            </section>

            {job.requirements?.length ? (
              <section id="job-talablar" className="jdd-sec">
                <h2><i><Check /></i> Talablar</h2>
                <ul className="jdd-checks">{job.requirements.map((item) => <li key={item}><Check /> {item}</li>)}</ul>
              </section>
            ) : <span id="job-talablar" />}

            {benefits.length || job.benefitNote ? (
              <section id="job-imtiyozlar" className="jdd-sec">
                <h2><i><BadgeCheck /></i> Imtiyozlar</h2>
                <div className="jdd-perks">{benefits.map((item) => <p key={item.id}><b>{item.title}</b><small>{item.sub}</small></p>)}</div>
                {job.benefitNote ? <p className="copy">{job.benefitNote}</p> : null}
              </section>
            ) : <span id="job-imtiyozlar" />}

            {source || insta || photos.length ? (
              <section className="jdd-sec">
                <h2><i><Link2 /></i> Qo‘shimcha ma’lumot</h2>
                {source ? <p className="link">Manba: <a href={source} target="_blank" rel="noopener nofollow" data-testid="job-source">{source} <ExternalLink /></a></p> : null}
                {insta ? <p className="link"><AtSign /> <a href={insta} target="_blank" rel="noopener nofollow" data-testid="job-instagram">{instagramValue(job.instagram ?? "")}</a></p> : null}
                {photos.length ? (
                  <div className="jdd-photos">{photos.slice(0, 3).map((src, index) => <img key={`${index}-${src}`} src={src} alt={`${job.clinic}, rasm ${index + 1}`} />)}</div>
                ) : null}
              </section>
            ) : null}
          </div>

          <aside className="jdd-side">
            <section className="jdd-box">
              <h3><i><Users /></i> Asosiy ma’lumotlar</h3>
              <dl>{facts.map(([icon, label, value]) => <div key={label}><dt>{icon} {label}</dt><dd>{value}</dd></div>)}</dl>
            </section>
            <section id="job-klinika" className="jdd-box">
              <h3><i><Building2 /></i> Klinika haqida</h3>
              <p className="org"><span className="jdd-logo sm">{job.logo ? <img src={job.logo} alt="" /> : initials(job.clinic)}</span><span><b>{job.clinic}</b><small>{job.city}</small></span></p>
              {job.employerAbout ? <p className="copy">{job.employerAbout}</p> : null}
              {job.staffCount || job.foundedYear ? (
                <p className="mini">{job.staffCount ? <span>{job.staffCount} xodim</span> : null}{job.foundedYear ? <span>{job.foundedYear}-yildan</span> : null}</p>
              ) : null}
              <Link className="all" href={`/ishlar?q=${encodeURIComponent(job.clinic)}`}>Barcha vakansiyalarni ko‘rish <ArrowRight /></Link>
            </section>
            <section id="job-manzil" className="jdd-box">
              <h3><i><MapPin /></i> Manzil</h3>
              <p className="copy">{job.address || place || "Manzil ko‘rsatilmagan."}</p>
              {job.address || place ? (
                <a className="all" href={`https://www.google.com/maps/search/${encodeURIComponent([job.address, job.city].filter(Boolean).join(", "))}`} target="_blank" rel="noreferrer">Xaritada ochish <ArrowRight /></a>
              ) : null}
            </section>
            {!job.mine ? <p className="jdd-report"><ReportButton kind="job" id={job.id} /></p> : null}
          </aside>
        </div>

        <section className="jdd-safe">
          <i><ShieldCheck /></i>
          <span><b>Xavfsizlik bo‘yicha eslatma</b><small>Ariza yuborishdan oldin ish beruvchi ma’lumotlarini tekshirib chiqing. Shaxsiy ma’lumotlaringizni faqat ishonchli manbalarga yuboring.</small></span>
        </section>
      </article>
      {note ? <p className="jdd-toast" role="status">{note}</p> : null}
    </div>
  );
}
