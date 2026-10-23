"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Banknote,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Gift,
  Heart,
  ListChecks,
  MapPin,
  MessageCircle,
  Play,
  Send,
  Share2,
  X,
} from "lucide-react";
import { EmployerLogo, JobPhoto, mapHref, placeText, salaryText, timeAgo, useSavedJobs } from "@/components/ishlar-ui";
import { mobileTypeText } from "@/components/ishlar-mobile-list";
import { experienceLabel, jobBenefits, type Job } from "@/data/jobs";
import { instagramHref, instagramValue, sourceUrlValue } from "@/lib/add-forms";
import "./job-detail-mobile.css";

/** Phone vacancy detail (mock "vakansiya tafsilotlari"). Missing data shows a neutral state. */
export function JobDetailMobile({ job, applied, applySub, onApply, onMessage }: { job: Job; applied: boolean; applySub: string; onApply: () => void; onMessage: () => void }) {
  const saved = useSavedJobs();
  const photos = job.photos ?? [];
  const [idx, setIdx] = useState(0);
  const [video, setVideo] = useState(false);
  const [copied, setCopied] = useState(false);
  const current = photos[Math.min(idx, Math.max(0, photos.length - 1))];
  const schedule = [job.workDays, job.workHours].filter(Boolean).join(", ");
  const reqs = [experienceLabel(job.experienceYears), ...(job.requirements ?? [])];
  const duties = job.duties ?? [];
  const benefits = (job.benefits ?? []).map((id) => jobBenefits.find((b) => b.id === id)).filter((b): b is (typeof jobBenefits)[number] => Boolean(b));
  const salary = salaryText(job);
  const negotiable = salary === "Kelishiladi" || job.salaryNegotiable;

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: job.title, text: `${job.title} — ${job.clinic}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="jd" data-testid="job-detail-mobile">
      <div className="jd-banner">
        <JobPhoto job={job} src={current} sizes="100vw" priority className="jd-banner-img" iconClass="size-12" />
        <div className="jd-tools">
          <button type="button" onClick={() => saved.toggle(job.id)} aria-label="Saqlash" aria-pressed={saved.has(job.id)} className={saved.has(job.id) ? "on" : ""}><Heart /></button>
          <button type="button" onClick={() => void share()} aria-label="Ulashish"><Share2 /></button>
        </div>
        {photos.length > 1 || job.video ? (
          <div className="jd-dots">
            {photos.map((src, i) => (
              <button key={src} type="button" className={i === idx ? "on" : ""} aria-label={`Rasm ${i + 1}`} onClick={() => setIdx(i)} />
            ))}
            {job.video ? <button type="button" className="jd-play" aria-label="Video" onClick={() => setVideo(true)} data-testid="job-video-tile"><Play /></button> : null}
          </div>
        ) : null}
        {copied ? <span className="jd-toast">Havola nusxalandi</span> : null}
      </div>

      <section className="jd-employer">
        <EmployerLogo job={job} size={44} className="jd-logo" />
        <div className="jd-emp-copy">
          <b>{job.clinic}{job.verified ? <Check className="jd-check" strokeWidth={3.5} /> : null}</b>
          <span><MapPin /> {placeText(job)}</span>
        </div>
        <a href={mapHref(job)} target="_blank" rel="noreferrer" className="jd-map" data-testid="job-map">Xaritada <ChevronRight /></a>
      </section>

      <section className="jd-card">
        <div className="jd-title-row">
          <h1>{job.title}</h1>
          <span className="jd-type">{mobileTypeText[job.type]}</span>
        </div>
        {job.employerAbout ? <p className="jd-lead">{job.employerAbout}</p> : null}
        <div className="jd-salary">
          <i><Banknote /></i>
          <span>
            <b className={salary === "Kelishiladi" ? "muted" : ""}>{salary}</b>
            <small>{negotiable && salary !== "Kelishiladi" ? "Kelishuv asosida" : timeAgo(job)}</small>
          </span>
        </div>

        <div className="jd-facts">
          <div><i><Briefcase /></i><span><small>Ish turi</small><b>{job.remote ? "Masofaviy" : mobileTypeText[job.type]}</b></span></div>
          <div><i><Clock /></i><span><small>Ish grafigi</small><b>{schedule || "Aniqlanmoqda"}</b></span></div>
          <div><i><MapPin /></i><span><small>Manzil</small><b>{placeText(job)}</b></span></div>
        </div>

        <Block icon={<FileText />} title="Talablar" testId="job-requirements">
          <ul>{reqs.map((r) => <Item key={r} text={r} />)}</ul>
        </Block>

        <Block icon={<ListChecks />} title="Vazifalar">
          {duties.length ? <ul>{duties.map((d) => <Item key={d} text={d} />)}</ul> : <p className="jd-muted">Vazifalar ko‘rsatilmagan.</p>}
        </Block>

        <Block icon={<Gift />} title="Biz taklif qilamiz" testId="job-benefits">
          {benefits.length || job.benefitNote ? (
            <ul>
              {benefits.map((b) => <Item key={b.id} text={`${b.title} — ${b.sub}`} />)}
              {job.benefitNote ? <Item text={job.benefitNote} /> : null}
            </ul>
          ) : (
            <p className="jd-muted">Ish beruvchi afzalliklarni hali ko‘rsatmagan.</p>
          )}
        </Block>

        {job.description ? (
          <Block icon={<FileText />} title="Tavsif">
            <p className="jd-text">{job.description}</p>
            {sourceUrlValue(job.sourceUrl ?? "") ? <a href={sourceUrlValue(job.sourceUrl ?? "")} target="_blank" rel="noopener nofollow" className="jd-link" data-testid="job-source-mobile">{sourceUrlValue(job.sourceUrl ?? "")}</a> : null}
            {instagramHref(job.instagram ?? "") ? <a href={instagramHref(job.instagram ?? "")} target="_blank" rel="noopener nofollow" className="jd-link" data-testid="job-instagram-mobile">{instagramValue(job.instagram ?? "")}</a> : null}
          </Block>
        ) : null}
      </section>

      <div className="jd-actions" data-testid="job-action-bar">
        {!job.mine ? <button type="button" className="jd-chat" onClick={onMessage} data-testid="job-message"><MessageCircle /> Klinika bilan chat</button> : null}
        {job.mine ? (
          <Link href="/ishlar/vakansiyalarim" className="jd-apply">Mening vakansiyalarim</Link>
        ) : applied ? (
          <Link href="/ishlar/arizalarim" className="jd-apply done" data-testid="job-applied"><Check /> Ariza yuborilgan</Link>
        ) : (
          <button type="button" className="jd-apply" onClick={onApply} data-testid="job-apply" title={applySub}><Send /> Ariza yuborish</button>
        )}
      </div>

      {video && job.video ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black" role="dialog" aria-modal="true" aria-label="Video">
          <button type="button" onClick={() => setVideo(false)} className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white/15 text-white" aria-label="Yopish"><X className="size-5" /></button>
          <video src={job.video} controls autoPlay playsInline className="max-h-full w-full" />
        </div>
      ) : null}
    </div>
  );
}

function Block({ icon, title, children, testId }: { icon: ReactNode; title: string; children: ReactNode; testId?: string }) {
  return (
    <section className="jd-block" data-testid={testId}>
      <h2><i>{icon}</i> {title}</h2>
      {children}
    </section>
  );
}

function Item({ text }: { text: string }) {
  return (
    <li><span><Check strokeWidth={3.5} /></span>{text}</li>
  );
}
