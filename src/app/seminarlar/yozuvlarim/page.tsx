"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, QrCode, Ticket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AttendanceActions, PaymentBadge, SeminarStatusBadge } from "@/components/seminar-status";
import { useSeminarRegs } from "@/components/seminar-provider";
import { getSeminar, seminarHref } from "@/data/seminars";
import { cn } from "@/lib/utils";
import type { SeminarRegistration } from "@/lib/seminar-registrations";
import { seminarDate } from "@/data/seminars";
import { SeminarlarimMobile } from "@/components/seminars/mobile/SeminarlarimMobile";

function rank(item: SeminarRegistration) {
  if (item.status === "pending") return 0;
  if (item.status === "confirmed") return 1;
  if (item.status === "attended") return 2;
  return 3;
}

export default function MySeminarRegistrationsPage() {
  const { registrations, ready, auth } = useSeminarRegs();
  const [organizer, setOrganizer] = useState(false);
  const items = [...registrations].sort((a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt));

  useEffect(() => {
    if (!auth) return;
    fetch("/api/seminars/organizer", { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json())
      .then((j: { items?: unknown[] }) => setOrganizer((j.items?.length ?? 0) > 0))
      .catch(() => undefined);
  }, [auth]);

  return (
    <>
      <SeminarlarimMobile />
      <div className="hidden lg:block">
      <header className="mb-4">
        <p className="text-[13px] text-[#8b93a7]">
          <Link href="/seminarlar" className="text-[#0066FF] hover:underline">
            Seminarlar
          </Link>
          <span className="mx-1">/</span>
          <span>Mening yozuvlarim</span>
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#1a1d26]">Mening yozuvlarim</h1>
        <p className="mt-1 text-sm text-[#8b93a7]">
          Akkauntingizga bog‘langan yozuvlar va shaxsiy chiptalar. Kutilayotganlar uchun kelishingizni tasdiqlang.
        </p>
        {organizer ? (
          <Link
            href="/seminarlar/yozuvlarim/tashkilotchi"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#e8f1ff] px-3.5 text-[13px] font-semibold text-[#0066FF]"
          >
            <Ticket className="size-4" />
            Tashkilotchi kabineti
          </Link>
        ) : null}
      </header>

      {ready && !auth ? (
        <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-16 text-center">
          <p className="text-[16px] font-semibold text-[#1a1d26]">Chiptalarni ko‘rish uchun tizimga kiring</p>
          <p className="mt-1 text-sm text-[#8b93a7]">Chiptalar faqat o‘z egasiga ko‘rinadi.</p>
          <Link href="/kirish?next=/seminarlar/yozuvlarim" className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}>
            Kirish
          </Link>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-16 text-center">
          <p className="text-[16px] font-semibold text-[#1a1d26]">Hali yozuv yo‘q</p>
          <p className="mt-1 text-sm text-[#8b93a7]">Seminar tanlab ro‘yxatdan o‘ting.</p>
          <Link href="/seminarlar" className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}>
            Seminarlar
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const seminar = getSeminar(item.seminarId);
            const date = seminar ? seminarDate(seminar) : null;
            return (
              <li key={item.id} className="rounded-[14px] border border-[#eceff5] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[14px] font-semibold text-[#1a1d26]">{seminar?.title ?? item.seminarTitle ?? item.seminarId}</p>
                  <SeminarStatusBadge status={item.status} />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#8b93a7]">
                  <CalendarDays className="size-3.5" />
                  {date ? `${date.when}, ${seminar?.time}` : item.createdAt.slice(0, 10)}
                </p>
                <p className="mt-1 text-[12px] text-[#8b93a7]">
                  {item.name} · +998 {item.phone}
                  {item.clinic ? ` · ${item.clinic}` : ""}
                </p>
                {item.status !== "cancelled" ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <PaymentBadge reg={item} />
                    <span className="text-[12px] font-semibold text-[#4b5568]">Chipta: {item.ticketCode}</span>
                  </div>
                ) : null}
                {item.status === "pending" ? (
                  <div className="mt-3 border-t border-[#f1f3f8] pt-3">
                    <AttendanceActions registration={item} compact />
                  </div>
                ) : item.status === "cancelled" ? (
                  <p className="mt-2 text-[12.5px] text-[#8b93a7]">Joy bo‘shatildi. Xuddi shu seminarga qayta yozilishingiz mumkin.</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-4">
                  {item.status !== "cancelled" ? (
                    <Link href={`/seminarlar/yozuvlarim/${item.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0066FF]">
                      <QrCode className="size-4" />
                      Chiptani ochish
                    </Link>
                  ) : null}
                  {seminar ? (
                    <Link href={seminarHref(seminar.id)} className="text-[13px] font-semibold text-[#0066FF]">
                      Batafsil
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      </div>
    </>
  );
}
