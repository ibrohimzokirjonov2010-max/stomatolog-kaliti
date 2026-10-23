"use client";
/* eslint-disable @next/next/no-img-element -- clinic photos are user uploads */

import { useState } from "react";
import Link from "next/link";
import { Briefcase, CheckCircle2, ChevronRight, Clock3, MapPin, Phone, XCircle } from "lucide-react";
import { useJobsWork } from "@/components/jobs-provider";
import { phoneHref } from "@/data/masters";
import { jobCategoryLabels, jobCategoryOf, jobTypeLabels } from "@/data/jobs";
import type { JobApplication, JobAppStatus } from "@/lib/jobs-work";
import { formatUzDate } from "@/lib/format";
import { timeAgoUz } from "@/lib/work-client";
import "./arizalarim-mobile.css";

type Filter = "all" | "review" | "accepted" | "rejected";

const FILTERS: { id: Filter; label: string; icon: typeof Clock3 }[] = [
  { id: "all", label: "Barchasi", icon: Briefcase },
  { id: "review", label: "Ko‘rib chiqilmoqda", icon: Clock3 },
  { id: "accepted", label: "Qabul qilingan", icon: CheckCircle2 },
  { id: "rejected", label: "Rad etilgan", icon: XCircle },
];

const STATUS: Record<JobAppStatus, { label: string; tone: "wait" | "ok" | "no" | "off"; icon: typeof Clock3 }> = {
  yuborildi: { label: "Yuborildi", tone: "wait", icon: Clock3 },
  korilmoqda: { label: "Ko‘rib chiqilmoqda", tone: "wait", icon: Clock3 },
  qabul: { label: "Qabul qilingan", tone: "ok", icon: CheckCircle2 },
  rad: { label: "Rad etilgan", tone: "no", icon: XCircle },
  bekor: { label: "Bekor qilingan", tone: "off", icon: XCircle },
};

function matches(status: JobAppStatus, filter: Filter) {
  if (filter === "review") return status === "yuborildi" || status === "korilmoqda";
  if (filter === "accepted") return status === "qabul";
  if (filter === "rejected") return status === "rad";
  return true;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

export function ArizalarimMobile() {
  const { applications, offers, catalog, setAppStatus, ready, authed } = useJobsWork();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [showOffers, setShowOffers] = useState(false);
  const items = [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter((item) => matches(item.status, filter));

  async function withdraw(item: JobApplication) {
    if (busy || !window.confirm("Arizani bekor qilasizmi?")) return;
    setBusy(item.id);
    setError("");
    const res = await setAppStatus(item.id, "bekor");
    setBusy("");
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="am lg:hidden" data-testid="mobile-arizalarim">
      <h1>Arizalarim</h1>
      <p className="am-lead">Ish takliflariga yuborgan arizalaringiz</p>

      <div className="am-chips" role="tablist">
        {FILTERS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={filter === item.id ? "on" : ""} onClick={() => setFilter(item.id)}>
              <Icon /> {item.label}
            </button>
          );
        })}
      </div>

      {offers.length > 0 ? (
        <button type="button" className="am-offers" aria-expanded={showOffers} onClick={() => setShowOffers((value) => !value)}>
          <Briefcase /> Sizga {offers.length} ta ish taklifi keldi <ChevronRight />
        </button>
      ) : null}
      {showOffers ? (
        <ul className="am-offer-list">
          {offers.map((offer) => (
            <li key={offer.id}>
              <b>{offer.name}</b> <span>· {timeAgoUz(offer.createdAt)}</span>
              {offer.message ? <p>“{offer.message}”</p> : null}
              <a href={phoneHref(offer.phone)}><Phone /> {offer.phone}</a>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p role="alert" className="am-error">{error}</p> : null}
      {ready && !authed ? (
        <p className="am-empty">Arizalar shaxsiy — ko‘rish uchun <Link href="/kirish?next=/ishlar/arizalarim">tizimga kiring</Link>.</p>
      ) : !ready ? (
        <p className="am-empty">Yuklanmoqda…</p>
      ) : items.length === 0 ? (
        <p className="am-empty">
          {applications.length === 0 ? <>Hali ariza yo‘q. <Link href="/ishlar">Vakansiyalarni ko‘ring</Link>.</> : "Bu bo‘limda ariza yo‘q."}
        </p>
      ) : (
        <ul className="am-list">
          {items.map((item) => {
            const job = catalog.find((row) => row.id === item.jobId);
            const image = job?.photos?.[0] || job?.logo || "";
            const place = [item.city, job?.district].filter(Boolean).join(", ");
            const tags = job ? [jobCategoryLabels[jobCategoryOf(job)], jobTypeLabels[job.type]].filter(Boolean) : [];
            const status = STATUS[item.status];
            const StatusIcon = status.icon;
            const expanded = open === item.id;
            const canWithdraw = item.status === "yuborildi" || item.status === "korilmoqda";
            const linked = item.jobStatus !== "closed";
            return (
              <li key={item.id} className="am-card" data-testid="application-row">
                <div className="am-main">
                  <div className="am-photo">
                    {image ? <img src={image} alt="" /> : <span>{initials(item.clinic)}</span>}
                  </div>
                  <div className="am-body">
                    <div className="am-top">
                      <b className="am-title">{item.jobTitle}</b>
                      {linked ? <Link href={`/ishlar/${item.jobId}`} className="am-go" aria-label="Vakansiya"><ChevronRight /></Link> : null}
                    </div>
                    <div className="am-status-row">
                      <span className={`am-status ${status.tone}`}><StatusIcon /> {status.label}</span>
                      <span className="am-date">{formatUzDate(item.createdAt.slice(0, 10)).long.replace(",", "")}</span>
                    </div>
                    <p className="am-clinic">{item.clinic}</p>
                    {place ? <p className="am-place"><MapPin /> {place}</p> : null}
                    <div className="am-foot">
                      <div className="am-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                      <button type="button" className="am-more" aria-expanded={expanded} onClick={() => setOpen(expanded ? "" : item.id)}>Batafsil</button>
                    </div>
                  </div>
                </div>
                {expanded ? (
                  <div className="am-detail">
                    <p>Yuborilgan: {timeAgoUz(item.createdAt)}{item.experienceYears ? ` · ${item.experienceYears} yil tajriba` : ""}</p>
                    {item.note ? <p className="am-note">“{item.note}”</p> : null}
                    {item.status === "qabul" && item.employerPhone ? (
                      <a href={phoneHref(item.employerPhone)} className="am-phone" data-testid="employer-phone"><Phone /> {item.employerPhone} — klinika bilan bog‘laning</a>
                    ) : item.status !== "qabul" ? (
                      <p>Klinika telefoni arizangiz qabul qilingandan keyin ochiladi.</p>
                    ) : null}
                    <div className="am-actions">
                      {linked ? <Link href={`/ishlar/${item.jobId}`}>Vakansiyani ko‘rish</Link> : <span>Vakansiya yopilgan</span>}
                      {canWithdraw ? (
                        <button type="button" disabled={busy === item.id} onClick={() => void withdraw(item)}>Arizani bekor qilish</button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
