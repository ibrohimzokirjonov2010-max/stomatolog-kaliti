"use client";

import type { RefObject } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { RegistrationSection } from "@/components/seminar-register";
import type { Seminar } from "@/data/seminars";
import type { SeminarRegistration } from "@/lib/seminar-registrations";

/**
 * Phone registration entry. The full two-step flow lives at /seminarlar/[id]/royxat.
 * Already registered / past / full states stay on the shared RegistrationSection.
 */
export function SeminarMobileRegistration({
  seminar: live,
  left,
  mine,
  upcoming,
  sectionRef,
}: {
  seminar: Seminar;
  left: number;
  mine: SeminarRegistration | undefined;
  upcoming: boolean;
  sectionRef: RefObject<HTMLElement | null>;
}) {
  const router = useRouter();

  if (mine || !upcoming || left <= 0) {
    return <RegistrationSection seminar={live} left={left} mine={mine} upcoming={upcoming} sectionRef={sectionRef} anchorId="royxat-m" className="rounded-[18px] !border-0 shadow-[0_2px_12px_rgba(15,23,42,0.05)] ring-1 ring-[#edf0f6]" />;
  }

  return (
    <section
      ref={sectionRef}
      id="royxat-m"
      data-testid="seminar-mobile-form"
      className="scroll-mt-16 rounded-[18px] bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] ring-1 ring-[#edf0f6]"
    >
      <h2 className="mb-2.5 text-[16px] font-bold text-[#0B1F4D]">Ro‘yxatdan o‘tish</h2>
      <p className="mb-3 text-[13px] text-[#8b93a7]">Ma’lumotlar va to‘lov keyingi sahifada.</p>
      <button
        type="button"
        data-testid="seminar-mobile-submit"
        onClick={() => router.push(`/seminarlar/${live.id}/royxat`)}
        className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] text-[14.5px] font-semibold text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)]"
      >
        Yozilishni tasdiqlash
        <ArrowRight className="size-4" />
      </button>
    </section>
  );
}
