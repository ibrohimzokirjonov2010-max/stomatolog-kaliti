"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Building2, Phone, Send, User } from "lucide-react";
import { useSeminarRegs } from "@/components/seminar-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { RegistrationSection } from "@/components/seminar-register";
import type { Seminar } from "@/data/seminars";
import type { SeminarRegistration } from "@/lib/seminar-registrations";
import { cn } from "@/lib/utils";

function IconInput({
  icon,
  className,
  ...props
}: React.ComponentProps<"input"> & { icon: ReactNode }) {
  return (
    <label className={cn("relative block min-w-0", className)}>
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[#8b93a7]">{icon}</span>
      <input
        {...props}
        className="h-11 w-full min-w-0 rounded-xl border border-[#e3e8f1] bg-white pr-1 pl-8 text-[14px] text-[#1a1d26] outline-none placeholder:text-[12.5px] max-[409px]:placeholder:text-[11px] placeholder:text-[#9aa3b5] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15"
      />
    </label>
  );
}

/**
 * Phone registration block in the mock's compact layout (2×2 icon inputs + full-width button).
 * Submits through the same `register()` flow as desktop (DB row → SK- ticket + QR); other states
 * (already registered / past / full) reuse the shared RegistrationSection.
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
  const { register, auth, ready } = useSeminarRegs();
  const { profile } = useDoctorProfile();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", telegram: "", clinic: "" });
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

  if (mine || !upcoming || left <= 0) {
    return <RegistrationSection seminar={live} left={left} mine={mine} upcoming={upcoming} sectionRef={sectionRef} anchorId="royxat-m" className="rounded-[18px] !border-0 shadow-[0_2px_12px_rgba(15,23,42,0.05)] ring-1 ring-[#edf0f6]" />;
  }

  const loginHref = `/kirish?next=${encodeURIComponent(pathname || `/seminarlar/${live.id}`)}`;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (ready && !auth) {
      router.push(loginHref);
      return;
    }
    setBusy(true);
    const result = await register({ seminarId: live.id, ...form });
    setBusy(false);
    if (!result.ok) {
      if (result.reason === "auth") router.push(loginHref);
      else if (result.reason === "duplicate") setError("Allaqachon yozilgansiz.");
      else if (result.reason === "full") setError("Joy qolmadi.");
      else if (result.reason === "invalid") setError("Ism va telefon majburiy (kamida 9 raqam).");
      else setError(result.error || "Yozilib bo‘lmadi. Qayta urinib ko‘ring.");
    }
  }

  return (
    <section
      ref={sectionRef}
      id="royxat-m"
      data-testid="seminar-mobile-form"
      className="scroll-mt-16 rounded-[18px] bg-white p-3.5 max-[409px]:p-3 shadow-[0_2px_12px_rgba(15,23,42,0.05)] ring-1 ring-[#edf0f6]"
    >
      <form onSubmit={submit}>
        <h2 className="mb-2.5 text-[16px] font-bold text-[#0B1F4D]">Ro‘yxatdan o‘tish</h2>
        {ready && !auth ? (
          <p className="mb-2.5 rounded-lg bg-[#f5f8ff] px-3 py-2 text-[12px] text-[#4b5568]">Yozilish uchun tizimga kirasiz — chipta (kod + QR) akkauntingizga bog‘lanadi.</p>
        ) : null}
        {error ? <p className="mb-2 text-[13px] text-destructive">{error}</p> : null}
        <div className="grid grid-cols-2 gap-2">
          <IconInput icon={<User className="size-4" />} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ism Familiya" aria-label="Ism" required autoComplete="name" />
          <IconInput icon={<Phone className="size-4" />} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67" aria-label="Telefon" required inputMode="tel" autoComplete="tel" />
          <IconInput icon={<Send className="size-4" />} value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} placeholder="@username (ixtiyoriy)" aria-label="Telegram" />
          <IconInput icon={<Building2 className="size-4" />} value={form.clinic} onChange={(e) => setForm({ ...form, clinic: e.target.value })} placeholder="Klinika nomi (ixtiyoriy)" aria-label="Klinika" />
        </div>
        <button
          type="submit"
          disabled={busy}
          data-testid="seminar-mobile-submit"
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] text-[14.5px] font-semibold text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)] disabled:opacity-70"
        >
          {busy ? "Yuborilmoqda..." : "Yozilishni tasdiqlash"}
          {!busy ? <ArrowRight className="size-4" /> : null}
        </button>
        <p className="mt-2 text-center text-[11.5px] font-semibold text-[#ef4444]">{live.seatsTbd ? "Joylar soni cheklangan" : `${left} ta o‘rin qoldi`}</p>
        {live.price > 0 ? <p className="mt-1 text-center text-[10.5px] text-[#9aa3b5]">To‘lov hozircha namuna — chipta “to‘lov kutilmoqda” holatida beriladi.</p> : null}
      </form>
    </section>
  );
}
