"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data loading effects kick off async fetches */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Check, X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import type { Candidate, Job } from "@/data/jobs";
import {
  candidateFromDb,
  isActiveApp,
  jobFromDb,
  type DbJob,
  type DbResume,
  type JobApplication,
  type JobAppStatus,
  type PublishJobInput,
  type ResumeInput,
  type ResumeOffer,
} from "@/lib/jobs-work";
import { api } from "@/lib/work-client";

export type ApplyInput = { jobId: string; name: string; phone: string; telegram: string; experienceYears: string; note: string };
export type ActionResult = { ok: true } | { ok: false; error: string; errors?: Record<string, string>; status?: number };

type Ctx = {
  ready: boolean;
  authed: boolean;
  /** Public (published) vacancies */
  catalog: Job[];
  /** My vacancies, any moderation state */
  myJobs: Job[];
  /** Public resumes (candidates) */
  resumes: Candidate[];
  /** Applications I sent / received for my vacancies */
  applications: JobApplication[];
  incoming: JobApplication[];
  /** My resume + offers employers sent me */
  resume: DbResume | null;
  offers: ResumeOffer[];
  getById: (id: string) => Job | undefined;
  hasApplied: (jobId: string) => boolean;
  apply: (input: ApplyInput) => Promise<ActionResult>;
  setAppStatus: (id: string, status: JobAppStatus) => Promise<ActionResult>;
  saveJob: (input: PublishJobInput, id?: string) => Promise<ActionResult>;
  setJob: (id: string, action: "close" | "open" | "delete") => Promise<ActionResult>;
  saveUserResume: (input: ResumeInput) => Promise<ActionResult>;
  removeResume: () => Promise<ActionResult>;
  sendOffer: (resumeId: string, input: { name: string; phone: string; message: string }) => Promise<ActionResult>;
  refresh: () => Promise<void>;
};

const JobsCtx = createContext<Ctx | null>(null);

export function JobsWorkProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, ready: profileReady } = useDoctorProfile();
  const active = pathname.startsWith("/ishlar") || pathname.startsWith("/elonlar");
  const userId = profile?.id ?? null;
  const [catalog, setCatalog] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Candidate[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [incoming, setIncoming] = useState<JobApplication[]>([]);
  const [resume, setResume] = useState<DbResume | null>(null);
  const [offers, setOffers] = useState<ResumeOffer[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ text: string; href?: string; hrefLabel?: string } | null>(null);

  const loadPublic = useCallback(async () => {
    const [j, r] = await Promise.all([api<{ jobs: DbJob[] }>("/api/work/jobs"), api<{ resumes: DbResume[] }>("/api/work/resumes")]);
    if (j.ok) setCatalog((j.data.jobs ?? []).map(jobFromDb));
    if (r.ok) setResumes((r.data.resumes ?? []).map(candidateFromDb));
    setReady(true);
  }, []);

  const loadPrivate = useCallback(async () => {
    const [m, a, r] = await Promise.all([
      api<{ jobs: DbJob[] }>("/api/work/jobs/mine"),
      api<{ outgoing: JobApplication[]; incoming: JobApplication[] }>("/api/work/jobs/applications"),
      api<{ resume: DbResume | null; offers: ResumeOffer[] }>("/api/work/resumes/mine"),
    ]);
    if (m.ok) setMyJobs((m.data.jobs ?? []).map(jobFromDb));
    if (a.ok) {
      setApplications(a.data.outgoing ?? []);
      setIncoming(a.data.incoming ?? []);
    }
    if (r.ok) {
      setResume(r.data.resume ?? null);
      setOffers(r.data.offers ?? []);
    }
  }, []);

  useEffect(() => {
    if (active) void loadPublic();
  }, [active, loadPublic, userId]);

  useEffect(() => {
    if (!active || !profileReady || !userId) return;
    void loadPrivate();
  }, [active, profileReady, userId, loadPrivate]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const refresh = useCallback(async () => {
    await Promise.all([loadPublic(), userId ? loadPrivate() : Promise.resolve()]);
  }, [loadPublic, loadPrivate, userId]);

  const fail = (res: { error: string; errors?: Record<string, string>; status: number }): ActionResult => ({ ok: false, error: res.error, errors: res.errors, status: res.status });

  const apply = useCallback(
    async (input: ApplyInput): Promise<ActionResult> => {
      const res = await api("/api/work/jobs/applications", { body: input });
      if (!res.ok) return fail(res);
      setToast({ text: "Ariza yuborildi. Ish beruvchi javob bersa, bildirishnoma olasiz.", href: "/ishlar/arizalarim", hrefLabel: "Mening arizalarim" });
      void loadPrivate();
      return { ok: true };
    },
    [loadPrivate],
  );

  const setAppStatus = useCallback(
    async (id: string, status: JobAppStatus): Promise<ActionResult> => {
      const res = await api(`/api/work/jobs/applications/${id}`, { body: { status } });
      if (!res.ok) return fail(res);
      await loadPrivate();
      return { ok: true };
    },
    [loadPrivate],
  );

  const saveJob = useCallback(
    async (input: PublishJobInput, id?: string): Promise<ActionResult> => {
      const res = await api("/api/work/jobs/mine", { body: { ...input, id } });
      if (!res.ok) return fail(res);
      setToast(
        id
          ? { text: "Vakansiya yangilandi." }
          : { text: "Vakansiya yuborildi. Admin tasdiqlagach hamma ko‘radi.", href: "/ishlar/vakansiyalarim", hrefLabel: "Mening vakansiyalarim" },
      );
      void refresh();
      return { ok: true };
    },
    [refresh],
  );

  const setJob = useCallback(
    async (id: string, action: "close" | "open" | "delete"): Promise<ActionResult> => {
      const res = await api(`/api/work/jobs/${id}`, { body: { action } });
      if (!res.ok) return fail(res);
      setToast({ text: action === "delete" ? "Vakansiya o‘chirildi." : action === "close" ? "Vakansiya yopildi." : "Vakansiya qayta ochildi." });
      void refresh();
      return { ok: true };
    },
    [refresh],
  );

  const saveUserResume = useCallback(
    async (input: ResumeInput): Promise<ActionResult> => {
      const res = await api("/api/work/resumes/mine", { body: input });
      if (!res.ok) return fail(res);
      setToast({ text: "Rezyume saqlandi." });
      void refresh();
      return { ok: true };
    },
    [refresh],
  );

  const removeResume = useCallback(async (): Promise<ActionResult> => {
    const res = await api("/api/work/resumes/mine", { method: "DELETE" });
    if (!res.ok) return fail(res);
    setToast({ text: "Rezyume o‘chirildi." });
    void refresh();
    return { ok: true };
  }, [refresh]);

  const sendOffer = useCallback(
    async (resumeId: string, input: { name: string; phone: string; message: string }): Promise<ActionResult> => {
      const res = await api(`/api/work/resumes/${resumeId}/offer`, { body: input });
      if (!res.ok) return fail(res);
      setToast({ text: "Taklif yuborildi. Nomzod javob bersa, bildirishnoma olasiz." });
      return { ok: true };
    },
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      ready: ready && profileReady,
      authed: Boolean(userId),
      catalog,
      myJobs: userId ? myJobs : [],
      resumes,
      applications: userId ? applications : [],
      incoming: userId ? incoming : [],
      resume: userId ? resume : null,
      offers: userId ? offers : [],
      getById: (id) => catalog.find((job) => job.id === id) ?? myJobs.find((job) => job.id === id),
      hasApplied: (jobId) => applications.some((a) => a.jobId === jobId && isActiveApp(a.status)),
      apply,
      setAppStatus,
      saveJob,
      setJob,
      saveUserResume,
      removeResume,
      sendOffer,
      refresh,
    }),
    [apply, applications, catalog, incoming, myJobs, offers, profileReady, ready, refresh, removeResume, resume, resumes, saveJob, saveUserResume, sendOffer, setAppStatus, setJob, userId],
  );

  return (
    <JobsCtx.Provider value={value}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-[min(100%-2rem,380px)]">
          <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-[#d7e4ff] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.16)] lg:mx-0">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a]">
                <Check className="size-4" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1a1d26]">{toast.text}</p>
                {toast.href ? (
                  <Link href={toast.href} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0066FF] hover:underline">
                    <Briefcase className="size-3.5" />
                    {toast.hrefLabel}
                  </Link>
                ) : null}
              </div>
              <button type="button" onClick={() => setToast(null)} className="text-[#8b93a7] hover:text-[#1a1d26]" aria-label="Yopish">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </JobsCtx.Provider>
  );
}

export function useJobsWork() {
  const ctx = useContext(JobsCtx);
  if (!ctx) throw new Error("useJobsWork must be used within JobsWorkProvider");
  return ctx;
}
