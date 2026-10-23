"use client";
/* eslint-disable @next/next/no-img-element -- vacancy photos are user uploads */

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  MoreVertical,
  PauseCircle,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { Modal, PostJobForm } from "@/components/job-forms";
import { useJobsWork } from "@/components/jobs-provider";
import { IncomingRow } from "@/components/jobs-mine";
import { jobCategoryLabels, jobCategoryOf, jobTypeLabels, type Job } from "@/data/jobs";
import "./arizalarim-mobile.css";
import "./vakansiyalarim-mobile.css";

type Filter = "all" | "published" | "pending" | "closed" | "rejected";

const FILTERS: { id: Filter; label: string; icon: typeof Clock3 | null }[] = [
  { id: "all", label: "Barchasi", icon: Briefcase },
  { id: "published", label: "Faol", icon: null },
  { id: "pending", label: "Moderatsiyada", icon: Clock3 },
  { id: "closed", label: "Yopilgan", icon: PauseCircle },
  { id: "rejected", label: "Rad etilgan", icon: XCircle },
];

const STATUS: Record<string, { label: string; tone: string; icon: typeof Clock3 | null }> = {
  published: { label: "Faol", tone: "live", icon: null },
  pending: { label: "Moderatsiyada", tone: "wait", icon: Clock3 },
  draft: { label: "Qoralama", tone: "off", icon: Clock3 },
  closed: { label: "Yopilgan", tone: "off", icon: PauseCircle },
  rejected: { label: "Rad etilgan", tone: "no", icon: XCircle },
  hidden: { label: "Yashirilgan", tone: "no", icon: XCircle },
};

function group(status: string): Filter {
  if (status === "published") return "published";
  if (status === "closed") return "closed";
  if (status === "rejected" || status === "hidden") return "rejected";
  return "pending";
}

export function VakansiyalarimMobile() {
  const { myJobs, incoming, setJob, setAppStatus, ready, authed } = useJobsWork();
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [menu, setMenu] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Job | null>(null);
  const jobs = myJobs.filter((job) => filter === "all" || group(job.modStatus ?? "pending") === filter);

  async function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    if (busy) return;
    setBusy(id);
    setError("");
    const res = await fn();
    setBusy("");
    if (!res.ok) setError(res.error ?? "Amalni bajarib bo‘lmadi.");
  }

  function remove(job: Job) {
    setMenu("");
    if (window.confirm("Vakansiya va unga kelgan arizalar o‘chiriladi. Davom etasizmi?")) void run(job.id, () => setJob(job.id, "delete"));
  }

  const forJob = applicants ? incoming.filter((item) => item.jobId === applicants.id) : [];

  return (
    <div className="am vm lg:hidden" data-testid="mobile-vakansiyalarim">
      <header className="vm-head">
        <div>
          <h1>Vakansiyalarim</h1>
          <p className="am-lead">E’lon qilgan vakansiyalaringizni boshqaring</p>
        </div>
        <button type="button" className="vm-new" onClick={() => setCreating(true)}><Plus /> Yangi vakansiya</button>
      </header>

      <div className="am-chips" role="tablist">
        {FILTERS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={filter === item.id ? "on" : ""} onClick={() => setFilter(item.id)}>
              {Icon ? <Icon /> : <i className="vm-dot" />} {item.label}
            </button>
          );
        })}
      </div>

      {error ? <p role="alert" className="am-error">{error}</p> : null}
      {ready && !authed ? (
        <p className="am-empty">Vakansiyalaringizni ko‘rish uchun <Link href="/kirish?next=/ishlar/vakansiyalarim">tizimga kiring</Link>.</p>
      ) : !ready ? (
        <p className="am-empty">Yuklanmoqda…</p>
      ) : jobs.length === 0 ? (
        <p className="am-empty">{myJobs.length === 0 ? "Hali vakansiya yo‘q. Admin tasdiqlagach hamma ko‘radi." : "Bu bo‘limda vakansiya yo‘q."}</p>
      ) : (
        <ul className="am-list">
          {jobs.map((job) => {
            const mod = job.modStatus ?? "pending";
            const status = STATUS[mod] ?? STATUS.pending;
            const StatusIcon = status.icon;
            const image = job.photos?.[0] || job.logo || "";
            const place = [job.city, job.district].filter(Boolean).join(", ");
            const tags = [jobCategoryLabels[jobCategoryOf(job)], jobTypeLabels[job.type]].filter(Boolean);
            const count = job.appCount ?? 0;
            const disabled = busy === job.id;
            return (
              <li key={job.id} className="am-card vm-card" data-testid="my-job-row">
                <div className="am-main">
                  <div className="am-photo vm-photo">
                    {image ? <img src={image} alt="" /> : <span>{job.clinic.slice(0, 2).toUpperCase() || "?"}</span>}
                  </div>
                  <div className="am-body">
                    <div className="am-top">
                      <Link href={`/ishlar/${job.id}`} className="am-title">{job.title}</Link>
                      <span className={`am-status vm-status ${status.tone}`}>{StatusIcon ? <StatusIcon /> : <i className="vm-dot" />} {status.label}</span>
                      <span className="vm-menu-wrap">
                        <button type="button" className="vm-more" aria-label="Yana" aria-expanded={menu === job.id} onClick={() => setMenu(menu === job.id ? "" : job.id)}><MoreVertical /></button>
                        {menu === job.id ? (
                          <span className="vm-menu">
                            <Link href={`/ishlar/${job.id}`} onClick={() => setMenu("")}>Vakansiyani ko‘rish</Link>
                            <button type="button" onClick={() => remove(job)}>O‘chirish</button>
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <p className="am-clinic">{job.clinic}</p>
                    {place ? <p className="am-place"><MapPin /> {place}</p> : null}
                    <div className="vm-row">
                      <div className="am-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                      <button type="button" className="vm-count" onClick={() => setApplicants(job)}>
                        <Users /> {count} ta ariza{job.newCount ? <em>+{job.newCount}</em> : null} <ChevronRight />
                      </button>
                    </div>
                    {mod === "rejected" && job.rejectReason ? <p className="vm-reason">Sabab: {job.rejectReason}</p> : null}
                    <div className="vm-actions">
                      <button type="button" className="vm-act teal" onClick={() => setApplicants(job)}><Users /> Arizalarni ko‘rish</button>
                      <button type="button" className="vm-act" disabled={disabled} onClick={() => setEditing(job)}><Pencil /> Tahrirlash</button>
                      {mod === "closed" ? (
                        <button type="button" className="vm-act teal" disabled={disabled} onClick={() => void run(job.id, () => setJob(job.id, "open"))}><RotateCw /> Qayta ochish</button>
                      ) : mod === "rejected" || mod === "hidden" ? (
                        <button type="button" className="vm-act red" disabled={disabled} onClick={() => remove(job)}><Trash2 /> O‘chirish</button>
                      ) : (
                        <button type="button" className="vm-act red" disabled={disabled} onClick={() => void run(job.id, () => setJob(job.id, "close"))}><PauseCircle /> Yopish</button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {applicants ? (
        <Modal title={`${applicants.title} — arizalar`} onClose={() => setApplicants(null)}>
          {forJob.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#8b93a7]"><CheckCircle2 className="mx-auto mb-2 size-6 text-[#0d8f8c]" />Hali ariza yo‘q.</p>
          ) : (
            <ul className="space-y-2.5">
              {forJob.map((item) => (
                <IncomingRow key={item.id} item={item} busy={busy === item.id} onSet={(next) => void run(item.id, () => setAppStatus(item.id, next))} />
              ))}
            </ul>
          )}
        </Modal>
      ) : null}
      {creating ? (
        <Modal title="Vakansiya qo‘shish" onClose={() => setCreating(false)}>
          <PostJobForm onCancel={() => setCreating(false)} onDone={() => setCreating(false)} />
        </Modal>
      ) : null}
      {editing ? (
        <Modal title="Vakansiyani tahrirlash" onClose={() => setEditing(null)}>
          <PostJobForm job={editing} onCancel={() => setEditing(null)} onDone={() => setEditing(null)} />
        </Modal>
      ) : null}
    </div>
  );
}
