"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJobsWork } from "@/components/jobs-provider";
import { EmptyState, Gate, TabBar } from "@/components/work-ui";
import { phoneHref } from "@/data/masters";
import { appStatusCopy, type JobApplication } from "@/lib/jobs-work";
import { timeAgoUz } from "@/lib/work-client";
import { cn } from "@/lib/utils";

function rank(item: JobApplication) {
  return ["yuborildi", "korilmoqda", "qabul", "rad", "bekor"].indexOf(item.status);
}

type Tab = "yuborgan" | "takliflar";

export function JobApplicationsPage() {
  const { applications, offers, setAppStatus, ready, authed } = useJobsWork();
  const params = useSearchParams();
  const router = useRouter();
  const tab: Tab = params.get("tab") === "takliflar" ? "takliflar" : "yuborgan";
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const items = [...applications].sort((a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt));

  async function withdraw(id: string) {
    if (busyId) return;
    setBusyId(id);
    setError("");
    const res = await setAppStatus(id, "bekor");
    setBusyId(null);
    if (!res.ok) setError(res.error);
  }

  return (
    <div>
      <header className="mb-4">
        <p className="text-[13px] text-[#8b93a7]">
          <Link href="/ishlar" className="text-[#0F766E] hover:underline">Ishlar</Link>
          <span className="mx-1">/</span>
          <span>Mening arizalarim</span>
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#0B1F4D] lg:text-[#1a1d26]">Mening arizalarim</h1>
        <p className="mt-1 text-[13px] text-[#8b93a7] lg:text-sm">Klinika telefon raqami arizangiz qabul qilingandan keyin ochiladi. Faol arizani bekor qilishingiz mumkin.</p>
        <div className="mt-3">
          <TabBar
            value={tab}
            onChange={(v) => router.replace(v === "takliflar" ? "/ishlar/arizalarim?tab=takliflar" : "/ishlar/arizalarim", { scroll: false })}
            tabs={[
              ["yuborgan", `Yuborganlarim${items.length ? ` (${items.length})` : ""}`],
              ["takliflar", `Takliflar${offers.length ? ` (${offers.length})` : ""}`],
            ] as const}
          />
        </div>
      </header>

      {ready && !authed ? (
        <Gate title="Kirish talab qilinadi" text="Arizalar shaxsiy — ko‘rish uchun tizimga kiring." next="/ishlar/arizalarim" />
      ) : !ready ? (
        <p className="py-16 text-center text-sm text-[#8b93a7]">Yuklanmoqda…</p>
      ) : (
        <>
          {error ? <p role="alert" className="mb-3 rounded-xl bg-[#fef2f2] px-3.5 py-2.5 text-[13px] font-medium text-[#b91c1c]">{error}</p> : null}
          {tab === "yuborgan" ? (
            items.length === 0 ? (
              <EmptyState title="Hali ariza yo‘q" text="Vakansiya tanlab ariza yuboring." href="/ishlar" cta="Ishlar" icon={<ClipboardList className="size-6" />} />
            ) : (
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <ApplicationRow key={item.id} item={item} busy={busyId === item.id} onWithdraw={() => withdraw(item.id)} />
                ))}
              </ul>
            )
          ) : offers.length === 0 ? (
            <EmptyState title="Hali taklif yo‘q" text="Rezyumeingizni joylang — ish beruvchilar sizga to‘g‘ridan-to‘g‘ri taklif yuborishi mumkin." icon={<ClipboardList className="size-6" />} />
          ) : (
            <ul className="space-y-2.5">
              {offers.map((o) => (
                <li key={o.id} className="rounded-2xl border border-[#eceff5] bg-white p-4" data-testid="offer-row">
                  <p className="text-[14px] font-semibold text-[#1a1d26]">{o.name} <span className="font-normal text-[#8b93a7]">· {timeAgoUz(o.createdAt)}</span></p>
                  {o.message ? <p className="mt-1 text-[13px] leading-relaxed text-[#4b5568]">“{o.message}”</p> : null}
                  <a href={phoneHref(o.phone)} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0F766E]">
                    <Phone className="size-3.5" />
                    {o.phone}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function ApplicationRow({ item, busy, onWithdraw }: { item: JobApplication; busy: boolean; onWithdraw: () => void }) {
  const badge = appStatusCopy[item.status];
  const canWithdraw = item.status === "yuborildi" || item.status === "korilmoqda";
  return (
    <li className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)] lg:rounded-[14px] lg:shadow-none" data-testid="application-row">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold text-[#1a1d26]">{item.jobTitle}</p>
          <p className="mt-0.5 text-[13px] text-[#4b5568]">{item.clinic} · {item.city} · {timeAgoUz(item.createdAt)}</p>
        </div>
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", badge.className)}>{badge.label}</span>
      </div>
      {item.note ? <p className="mt-2 text-[13px] leading-relaxed text-[#4b5568]">{item.note}</p> : null}
      {item.status === "qabul" && item.employerPhone ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#f0fdf4] px-3 py-2.5" data-testid="employer-phone">
          <Phone className="size-4 text-[#15803d]" />
          <a href={phoneHref(item.employerPhone)} className="text-[14px] font-bold text-[#15803d]">{item.employerPhone}</a>
          <span className="text-[12px] text-[#4b5568]">klinika bilan bog‘laning</span>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canWithdraw ? (
          <Button type="button" variant="outline" disabled={busy} className="h-11 !rounded-xl text-[13px] lg:h-9" onClick={onWithdraw}>
            Arizani bekor qilish
          </Button>
        ) : null}
        {item.jobStatus !== "closed" ? (
          <Link href={`/ishlar/${item.jobId}`} className="text-[13px] font-semibold text-[#0F766E]">Vakansiya</Link>
        ) : null}
      </div>
    </li>
  );
}
