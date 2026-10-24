"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttendanceActions, PaymentBadge } from "@/components/seminar-status";
import { useSeminarRegs } from "@/components/seminar-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { isSeminarUpcoming, type Seminar } from "@/data/seminars";
import { SeminarDetailMobile } from "@/components/seminar-mobile-detail";
import { SeminarMobileRegistration } from "@/components/seminar-mobile-register";
import { SeminarDetailDesktop } from "@/components/seminar-desktop-detail";
import { cn } from "@/lib/utils";
import { seminarDate } from "@/data/seminars";

function SeminarRegisterDesktop({ seminar }: { seminar: Seminar }) {
  const { liveSeminar, seatsLeft, activeReg } = useSeminarRegs();
  const live = liveSeminar(seminar);
  const left = seatsLeft(seminar);
  const mine = activeReg(seminar.id);
  const upcoming = isSeminarUpcoming(live);
  const formRef = useRef<HTMLElement>(null);

  return (
    <SeminarDetailDesktop seminar={live} left={left} mine={mine} upcoming={upcoming} formRef={formRef}>
      <RegistrationSection seminar={live} left={left} mine={mine} upcoming={upcoming} sectionRef={formRef} anchorId="royxat" />
    </SeminarDetailDesktop>
  );
}

export function RegistrationSection({
  seminar: live,
  left,
  mine,
  upcoming,
  sectionRef,
  anchorId,
  className,
}: {
  seminar: Seminar;
  left: number;
  mine: ReturnType<ReturnType<typeof useSeminarRegs>["activeReg"]>;
  upcoming: boolean;
  sectionRef?: React.RefObject<HTMLElement | null>;
  anchorId: string;
  className?: string;
}) {
  const { register, auth, ready } = useSeminarRegs();
  const { profile } = useDoctorProfile();
  const date = seminarDate(live);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    telegram: "",
    clinic: "",
  });
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !profile) return;
    prefilled.current = true;
     
    setForm((f) => ({
      name: f.name || profile.fullName || "",
      phone: f.phone || profile.phone || "",
      telegram: f.telegram || profile.telegramUsername || "",
      clinic: f.clinic || profile.clinic || "",
    }));
  }, [profile]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await register({
      seminarId: live.id,
      name: form.name,
      phone: form.phone,
      telegram: form.telegram,
      clinic: form.clinic,
    });
    setBusy(false);
    if (!result.ok) {
      if (result.reason === "duplicate") setError("Allaqachon yozilgansiz.");
      else if (result.reason === "full") setError("Joy qolmadi.");
      else if (result.reason === "auth") setError("Yozilish uchun avval tizimga kiring.");
      else if (result.reason === "invalid") setError("Ism va telefon majburiy (kamida 9 raqam).");
      else setError(result.error || "Yozilib bo‘lmadi. Qayta urinib ko‘ring.");
    }
  }

  return (
      <section
      ref={sectionRef}
      id={anchorId}
      className={cn("scroll-mt-24 rounded-[16px] border border-[#eceff5] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5", className)}
    >
      {mine ? (
        <div>
          {mine.status === "confirmed" ? (
            <h2 className="mb-1.5 text-[16px] font-bold text-[#1a1d26]">Siz yozildingiz</h2>
          ) : (
            <h2 className="mb-1.5 text-[16px] font-bold text-[#1a1d26]">Yozuvingiz</h2>
          )}
          <p className="mb-1 text-[15px] font-semibold text-[#1a1d26]">{live.title}</p>
          <p className="mb-4 text-sm text-[#8b93a7]">
            {date.when}, {live.time}
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <PaymentBadge reg={mine} />
            <span className="text-[12px] font-semibold text-[#4b5568]">Chipta: {mine.ticketCode}</span>
          </div>
          <AttendanceActions registration={mine} />
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/seminarlar/yozuvlarim/${mine.id}`} className={cn(buttonVariants(), "h-11 !rounded-xl")}>
              Chiptani ochish
            </Link>
            <Link href="/seminarlar/yozuvlarim" className={cn(buttonVariants({ variant: "outline" }), "h-11 !rounded-xl")}>
              Mening yozuvlarim
            </Link>
          </div>
        </div>
      ) : !upcoming ? (
        <div className="py-2 text-center sm:text-left">
          <h2 className="text-[16px] font-bold text-[#1a1d26]">O&apos;tgan seminar</h2>
          <p className="mt-2 text-sm text-[#8b93a7]">
            Bu seminar o&apos;tib ketgan — yangi yozuv ochilmaydi. Boshqa yaqin seminarlarni
            ko&apos;ring.
          </p>
          <Link
            href="/seminarlar"
            className={cn(buttonVariants(), "mt-4 inline-flex h-11 !rounded-xl")}
          >
            Seminarlar ro&apos;yxati
          </Link>
        </div>
      ) : left <= 0 ? (
        <div>
          <h2 className="text-[16px] font-bold text-[#1a1d26]">Joy qolmadi</h2>
          <p className="mt-2 text-sm text-[#8b93a7]">
            Bu seminarda bo&apos;sh o&apos;rin qolmadi. Boshqa sanalarni ko&apos;ring.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <h2 className="text-[16px] font-bold text-[#1a1d26]">Ro&apos;yxatdan o&apos;tish</h2>
            <p className="mt-1 text-[13px] text-[#8b93a7]">
              {live.price > 0
                ? "Yozilgach shaxsiy chipta (kod + QR) beriladi. To‘lov hozircha namuna: chipta “to‘lov kutilmoqda” holatida bo‘ladi, onlayn to‘lov olinmaydi."
                : "Yozilgach shaxsiy chipta (kod + QR) beriladi."}
            </p>
          </div>
          {ready && !auth ? (
            <p className="rounded-xl bg-[#f5f8ff] px-3 py-2.5 text-[13px] text-[#4b5568]">
              Yozilish uchun{" "}
              <Link href={`/kirish?next=${encodeURIComponent(`/seminarlar/${live.id}`)}`} className="font-semibold text-[#0F766E] hover:underline lg:text-[#0F766E]">
                tizimga kiring
              </Link>{" "}
              yoki{" "}
              <Link href={`/royxat?next=${encodeURIComponent(`/seminarlar/${live.id}`)}`} className="font-semibold text-[#0F766E] hover:underline lg:text-[#0F766E]">
                ro‘yxatdan o‘ting
              </Link>
              . Chipta akkauntingizga bog‘lanadi.
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Ism">
              <Input
                className="mt-1 h-11"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Ism Familiya"
                required
              />
            </Field>
            <Field label="Telefon">
              <Input
                className="mt-1 h-11"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="+998 90 123 45 67"
                required
              />
            </Field>
            <Field label="Telegram (ixtiyoriy)">
              <Input
                className="mt-1 h-11"
                value={form.telegram}
                onChange={(event) => setForm({ ...form, telegram: event.target.value })}
                placeholder="@username"
              />
            </Field>
            <Field label="Klinika (ixtiyoriy)">
              <Input
                className="mt-1 h-11"
                value={form.clinic}
                onChange={(event) => setForm({ ...form, clinic: event.target.value })}
                placeholder="Klinika nomi"
              />
            </Field>
          </div>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
            <Button
              type="submit"
              className="h-12 flex-1 !rounded-xl bg-[#0F766E] text-[15px] hover:bg-[#115E59] lg:bg-[#0F766E] lg:hover:bg-[#0a7f7b]"
              disabled={busy}
            >
              {busy ? "Yuborilmoqda..." : "Yozilishni tasdiqlash"}
              {!busy ? <ArrowRight className="ml-1.5 size-4" /> : null}
            </Button>
            <p className="text-center text-[12px] font-semibold text-[#ef4444] sm:text-left">
              {live.seatsTbd ? "Joylar soni cheklangan" : `${left} ta o‘rin qoldi`}
            </p>
          </div>
        </form>
      )}
    </section>

  );
}

export function SeminarRegisterPage({ seminar }: { seminar: Seminar }) {
  const { liveSeminar, seatsLeft, activeReg } = useSeminarRegs();
  const live = liveSeminar(seminar);
  const left = seatsLeft(seminar);
  const mine = activeReg(seminar.id);
  const upcoming = isSeminarUpcoming(live);
  const formRef = useRef<HTMLElement>(null);
  const router = useRouter();

  return (
    <>
      <div className="lg:hidden">
        <SeminarDetailMobile
          seminar={live}
          left={left}
          mine={mine}
          upcoming={upcoming}
          formRef={formRef}
          onRegister={() => router.push(`/seminarlar/${live.id}/royxat`)}
        >
          <SeminarMobileRegistration seminar={live} left={left} mine={mine} upcoming={upcoming} sectionRef={formRef} />
        </SeminarDetailMobile>
      </div>
      <div className="hidden lg:block">
        <SeminarRegisterDesktop seminar={seminar} />
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="block">
      <span className="text-[#4b5568]">{label}</span>
      {children}
    </Label>
  );
}
