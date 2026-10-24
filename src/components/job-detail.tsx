"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { JobApplyForm } from "@/components/job-apply-form";
import { JobDetailMobile } from "@/components/job-detail-mobile";
import { useJobsWork } from "@/components/jobs-provider";
import { JobDetailDesktop } from "@/components/jobs/desktop/JobDetailDesktop";
import { cn } from "@/lib/utils";

export function JobDetail({ id }: { id: string }) {
  const { getById, hasApplied, ready, resume } = useJobsWork();
  const job = getById(id);
  const [applyOpen, setApplyOpen] = useState(false);
  const [messageMode, setMessageMode] = useState(false);

  if (ready && !job) {
    return (
      <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1a1d26]">Vakansiya topilmadi</p>
        <p className="mt-1 text-sm text-[#8b93a7]">E’lon o‘chirilgan yoki havola eskirgan bo‘lishi mumkin.</p>
        <Link href="/ishlar" className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}>
          Ishlar
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-12 text-center text-sm text-[#8b93a7]">
        Yuklanmoqda…
      </div>
    );
  }

  const applied = hasApplied(job.id);

  return (
    <div>
      <div className="lg:hidden">
        <JobDetailMobile
          job={job}
          applied={applied}
          applySub={resume ? "Rezyume bilan" : "Bepul · tez javob"}
          onApply={() => {
            setMessageMode(false);
            setApplyOpen(true);
          }}
          onMessage={() => {
            setMessageMode(true);
            setApplyOpen(true);
          }}
        />
      </div>
      <div className="hidden lg:block">
        <JobDetailDesktop
          job={job}
          applied={applied}
          onApply={() => {
            setMessageMode(false);
            setApplyOpen(true);
          }}
        />
      </div>

      {applyOpen ? (
        <div className="fixed inset-0 z-[65] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-apply-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="job-apply-title" className="text-lg font-semibold">
                {messageMode ? "Klinikaga xabar" : `Ariza: ${job.title}`}
              </h2>
              <button type="button" onClick={() => setApplyOpen(false)} className="text-sm text-muted-foreground">
                Yopish
              </button>
            </div>
            <JobApplyForm job={job} focusNote={messageMode} onCancel={() => setApplyOpen(false)} onSuccess={() => setApplyOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
