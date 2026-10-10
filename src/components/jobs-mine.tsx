"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, ClipboardList, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, PostJobForm } from "@/components/job-forms";
import { useJobsWork } from "@/components/jobs-provider";
import { EmptyState, Gate, ModBanner, StatusPill, TabBar } from "@/components/work-ui";
import { jobTypeLabels, type Job } from "@/data/jobs";
import { phoneHref } from "@/data/masters";
import { formatSalaryRange } from "@/lib/format";
import { appStatusCopy, JOB_MOD_LABEL, type JobApplication } from "@/lib/jobs-work";
import { timeAgoUz } from "@/lib/work-client";
import { cn } from "@/lib/utils";

type Tab = "vakansiyalar" | "arizalar";

export function JobsMinePage() {
  const { myJobs, incoming, setJob, setAppStatus, ready, authed } = useJobsWork();
  const params = useSearchParams();
  const router = useRouter();
  const tab: Tab = params.get("tab") === "arizalar" ? "arizalar" : "vakansiyalar";
  const [editing, setEditing] = useState<Job | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const newCount = incoming.filter((a) => a.status === "yuborildi").length;

  async function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    if (busyId) return;
    setBusyId(id);
    setError("");
    const res = await fn();
    setBusyId(null);
    if (!res.ok) setError(res.error ?? "Amalni bajarib bo‘lmadi.");
  }

  return (
    <div>
      <header className="mb-4">
        <p className="text-[13px] text-[#8b93a7]">
          <Link href="/ishlar" className="text-[#0066FF] hover:underline">Ishlar</Link>
          <span className="mx-1">/</span>
          <span>Mening vakansiyalarim</span>
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#0B1F4D] lg:text-[#1a1d26]">Mening vakansiyalarim</h1>
            <p className="mt-1 text-sm text-[#8b93a7]">Vakansiyalaringiz va nomzodlardan kelgan arizalar. Nomzod telefoni arizada ko‘rinadi.</p>
          </div>
          <Button className="h-11 !rounded-xl px-4" onClick={() => setCreating(true)}>Vakansiya qo‘shish</Button>
        </div>
        <div className="mt-3">
          <TabBar
            value={tab}
            onChange={(v) => router.replace(v === "arizalar" ? "/ishlar/vakansiyalarim?tab=arizalar" : "/ishlar/vakansiyalarim", { scroll: false })}
            tabs={[
              ["vakansiyalar", `Vakansiyalarim${myJobs.length ? ` (${myJobs.length})` : ""}`],
              ["arizalar", `Arizalar${newCount ? ` (${newCount})` : ""}`],
            ] as const}
          />
        </div>
      </header>

      {ready && !authed ? (
        <Gate title="Kirish talab qilinadi" text="Vakansiya joylash va arizalarni ko‘rish uchun tizimga kiring." next="/ishlar/vakansiyalarim" />
      ) : !ready ? (
        <p className="py-16 text-center text-sm text-[#8b93a7]">Yuklanmoqda…</p>
      ) : (
        <>
          {error ? <p role="alert" className="mb-3 rounded-xl bg-[#fef2f2] px-3.5 py-2.5 text-[13px] font-medium text-[#b91c1c]">{error}</p> : null}
          {tab === "vakansiyalar" ? (
            myJobs.length === 0 ? (
              <EmptyState title="Hali e’lon yo‘q" text="Birinchi vakansiyangizni qo‘shing. Admin tasdiqlagach hamma ko‘radi." icon={<Briefcase className="size-6" />} />
            ) : (
              <ul className="space-y-2.5">
                {myJobs.map((job) => {
                  const mod = JOB_MOD_LABEL[job.modStatus ?? "pending"];
                  const busy = busyId === job.id;
                  const closed = job.modStatus === "closed";
                  return (
                    <li key={job.id} className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)] lg:rounded-[14px] lg:shadow-none" data-testid="my-job-row">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/ishlar/${job.id}`} className="text-[15px] font-semibold text-[#1a1d26] hover:text-[#0066FF]">{job.title}</Link>
                          <p className="mt-0.5 text-[13px] text-[#4b5568]">{job.clinic}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#8b93a7]"><MapPin className="size-3" />{job.city} · {jobTypeLabels[job.type]} · {formatSalaryRange(job.salaryMin, job.salaryMax)}</p>
                        </div>
                        {mod ? <StatusPill label={mod.label} cls={mod.cls} /> : null}
                      </div>
                      {job.modStatus === "rejected" || job.modStatus === "hidden" || job.modStatus === "pending" ? (
                        <div className="mt-3"><ModBanner status={job.modStatus} reason={job.rejectReason} /></div>
                      ) : null}
                      <p className="mt-2 text-[12px] text-[#8b93a7]">
                        {job.appCount ?? 0} ta ariza{job.newCount ? ` · ${job.newCount} ta yangi` : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(job.appCount ?? 0) > 0 ? (
                          <Button type="button" variant="outline" className="h-11 !rounded-xl text-[13px] lg:h-9" onClick={() => router.replace("/ishlar/vakansiyalarim?tab=arizalar", { scroll: false })}>
                            Arizalar
                          </Button>
                        ) : null}
                        <Button type="button" variant="outline" disabled={busy} className="h-11 !rounded-xl text-[13px] lg:h-9" onClick={() => setEditing(job)}>Tahrirlash</Button>
                        {job.modStatus === "hidden" ? null : (
                          <Button type="button" variant="outline" disabled={busy} className="h-11 !rounded-xl text-[13px] lg:h-9" onClick={() => run(job.id, () => setJob(job.id, closed ? "open" : "close"))}>
                            {closed ? "Qayta ochish" : "Yopish"}
                          </Button>
                        )}
                        <Button type="button" variant="outline" disabled={busy} className="h-11 !rounded-xl text-[13px] text-destructive lg:h-9" onClick={() => { if (window.confirm("Vakansiya va unga kelgan arizalar o‘chiriladi. Davom etasizmi?")) void run(job.id, () => setJob(job.id, "delete")); }}>
                          O‘chirish
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          ) : incoming.length === 0 ? (
            <EmptyState title="Hali ariza yo‘q" text="Vakansiyangiz e’lon qilingach, nomzodlar ariza yuboradi — bu yerda ko‘rasiz." icon={<ClipboardList className="size-6" />} />
          ) : (
            <ul className="space-y-2.5">
              {incoming.map((item) => (
                <IncomingRow key={item.id} item={item} busy={busyId === item.id} onSet={(s) => run(item.id, () => setAppStatus(item.id, s))} />
              ))}
            </ul>
          )}
        </>
      )}

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

function IncomingRow({ item, busy, onSet }: { item: JobApplication; busy: boolean; onSet: (s: "korilmoqda" | "qabul" | "rad") => void }) {
  const badge = appStatusCopy[item.status];
  const open = item.status === "yuborildi" || item.status === "korilmoqda";
  return (
    <li className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)] lg:rounded-[14px] lg:shadow-none" data-testid="incoming-app-row">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold text-[#1a1d26]">{item.name}</p>
          <p className="mt-0.5 text-[13px] text-[#4b5568]">{item.jobTitle} · {item.experienceYears} yil tajriba · {timeAgoUz(item.createdAt)}</p>
        </div>
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", badge.className)}>{badge.label}</span>
      </div>
      {item.note ? <p className="mt-2 text-[13px] leading-relaxed text-[#4b5568]">“{item.note}”</p> : null}
      {item.phone ? (
        <a href={phoneHref(item.phone)} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0066FF]">
          <Phone className="size-3.5" />
          {item.phone}
        </a>
      ) : null}
      {item.telegram ? <p className="mt-1 text-[12px] text-[#8b93a7]">Telegram: {item.telegram}</p> : null}
      {open ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.status === "yuborildi" ? (
            <Button type="button" variant="outline" disabled={busy} className="h-11 !rounded-xl text-[13px] lg:h-9" onClick={() => onSet("korilmoqda")}>Ko‘rilmoqda</Button>
          ) : null}
          <Button type="button" disabled={busy} className="h-11 !rounded-xl text-[13px] lg:h-9" onClick={() => onSet("qabul")}>Qabul qilish</Button>
          <Button type="button" variant="outline" disabled={busy} className="h-11 !rounded-xl text-[13px] lg:h-9" onClick={() => onSet("rad")}>Rad etish</Button>
        </div>
      ) : null}
    </li>
  );
}
