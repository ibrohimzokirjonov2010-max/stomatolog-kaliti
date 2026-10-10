"use client";

import { nextPath } from "@/lib/utils";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import {
  AuthCard,
  AuthField,
  AuthLink,
  AuthPrimaryButton,
  authInputClassName,
} from "@/components/auth/auth-card";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { SignupBonusPromo, markBonusSeen } from "@/components/bonus/bonus";
import { getBonusSnapshot, refreshBonus } from "@/lib/bonus";
import { formatMoney } from "@/lib/format";
import { Gift } from "lucide-react";

const CONSENT_ERROR = "Davom etish uchun Foydalanish shartlari va Maxfiylik siyosatiga rozilik bering.";

export function RegisterForm() {
  const router = useRouter();
  const { register, ready, profile } = useDoctorProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const registering = useRef(false);
  const [welcome, setWelcome] = useState<{ signup: number; first: number; pending?: string } | null>(null);

  useEffect(() => {
    if (ready && profile && !registering.current) router.replace(nextPath());
  }, [ready, profile, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!accepted) {
      setError(CONSENT_ERROR);
      return;
    }
    setBusy(true);
    registering.current = true;
    const result = await register({ fullName, phone, password });
    setBusy(false);
    if (!result.ok) {
      registering.current = false;
      if (result.reason === "exists") setError("Bu telefon allaqachon ro‘yxatdan o‘tgan.");
      else if (result.reason === "short_password")
        setError("Parol kamida 6 belgidan iborat bo‘lishi kerak.");
      else if (result.reason === "network") setError(result.message ?? "Tarmoq xatosi. Qayta urinib ko‘ring.");
      else setError("Ism va telefonni to‘ldiring.");
      return;
    }
    await refreshBonus();
    const info = getBonusSnapshot().info;
    const grant = info?.history.find((h) => h.kind === "grant" && h.type === "signup");
    if (grant && info) {
      markBonusSeen(result.profile.id, "signup");
      setWelcome({ signup: grant.amount, first: info.rules.firstPurchase });
      return;
    }
    if (info?.signupEligible) {
      // account exists, but the bonus waits for phone verification (or the daily IP/device limit)
      setWelcome({
        signup: info.rules.signup,
        first: info.rules.firstPurchase,
        pending:
          info.signupReason === "limit"
            ? "Bu qurilma yoki tarmoqdan bugungi bonus limiti tugagan. Keyinroq avtomatik beriladi."
            : info.verificationEnabled
              ? "Bonus telefon tasdiqlangach beriladi. Profilda telefon raqamingizni tasdiqlang."
              : "Bonus telefon tasdiqlangach beriladi. Telefon tasdiqlash hozircha yoqilmagan — yoqilgach bonus avtomatik beriladi.",
      });
      return;
    }
    registering.current = false;
    router.push(nextPath());
  }

  if (welcome?.pending) {
    return (
      <AuthCard title="Profilingiz ochildi" subtitle="Xush kelibsiz!">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#f3d9a4] bg-[#fffaf0] px-5 py-6 text-center" data-testid="signup-bonus-pending">
          <span className="grid size-14 place-items-center rounded-2xl bg-[#f59e0b] text-white shadow-[0_8px_20px_rgba(245,158,11,0.3)]">
            <Gift className="size-7" />
          </span>
          <p className="text-[17px] font-bold leading-snug text-[#7c4a03]">
            {formatMoney(welcome.signup, "UZS")} bonus —{" "}
            <span className="rounded-full bg-[#fff4e0] px-2.5 py-0.5 text-[13px] font-semibold text-[#b45309]">Kutilmoqda</span>
          </p>
          <p className="text-[14px] leading-relaxed text-[#8a5a14]">{welcome.pending}</p>
          <p className="text-[12.5px] leading-relaxed text-[#8a5a14]/80">
            Bonus faqat Marketplace’da ishlatiladi, naqdga yechilmaydi. Birinchi xariddan keyin yana {formatMoney(welcome.first, "UZS")} (bonus berilgan bo‘lsa).
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(nextPath())}
          className="flex h-12 w-full items-center justify-center rounded-full bg-[#0066FF] text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(0,102,255,0.28)] hover:bg-[#0052cc]"
        >
          Davom etish
        </button>
      </AuthCard>
    );
  }

  if (welcome) {
    return (
      <AuthCard title="Tabriklaymiz!" subtitle="Profilingiz ochildi">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#b7e4c7] bg-[#effaf3] px-5 py-6 text-center" data-testid="signup-bonus-success">
          <span className="grid size-14 place-items-center rounded-2xl bg-[#16a34a] text-white shadow-[0_8px_20px_rgba(22,163,74,0.3)]">
            <Gift className="size-7" />
          </span>
          <p className="text-[17px] font-bold leading-snug text-[#14532d]">
            Tabriklaymiz! {formatMoney(welcome.signup, "UZS")} bonus hisobingizga berildi
          </p>
          <p className="text-[14px] leading-relaxed text-[#2f6b46]">
            Birinchi xaridingiz yetkazilgach yana <b>{formatMoney(welcome.first, "UZS")}</b>. Bonus faqat Marketplace’da ishlatiladi, naqdga yechilmaydi.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(nextPath())}
          className="flex h-12 w-full items-center justify-center rounded-full bg-[#0066FF] text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(0,102,255,0.28)] hover:bg-[#0052cc]"
        >
          Marketplace’ga o‘tish
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Ro‘yxatdan o‘tish"
      subtitle="Bir daqiqada profilingizni oching"
      footer={
        <>
          Allaqachon akkauntingiz bormi? <AuthLink href="/kirish">Kirish</AuthLink>
        </>
      }
    >
      <SignupBonusPromo />
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e8eef4] bg-[#f7f8fb] px-3.5 py-3 text-[14px] leading-snug text-[#475569]" data-testid="consent-label">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => {
            setAccepted(e.target.checked);
            if (e.target.checked && error === CONSENT_ERROR) setError("");
          }}
          className="mt-0.5 size-5 shrink-0 accent-[#0066FF]"
          data-testid="consent-checkbox"
        />
        <span>
          Men{" "}
          <Link href="/shartlar" target="_blank" className="font-semibold text-[#0066FF] hover:underline">Foydalanish shartlari</Link> va{" "}
          <Link href="/maxfiylik" target="_blank" className="font-semibold text-[#0066FF] hover:underline">Maxfiylik siyosati</Link>ga roziman
        </span>
      </label>
      {error === CONSENT_ERROR ? (
        <p role="alert" className="-mt-2 rounded-xl bg-[#fff1f0] px-3 py-2.5 text-[14px] font-medium text-[#d92d20]">{CONSENT_ERROR}</p>
      ) : null}
      <SocialAuthButtons locked={!accepted} onLockedClick={() => setError(CONSENT_ERROR)} />

      <form onSubmit={submit} className="space-y-4">
        <AuthField label="To‘liq ism">
          <input
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dr. Aliyev Jasur"
            className={authInputClassName()}
          />
        </AuthField>
        <AuthField label="Telefon">
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className={authInputClassName()}
          />
        </AuthField>
        <AuthField label="Parol" hint="min. 6">
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Yangi parol"
            className={authInputClassName()}
          />
        </AuthField>
        {error && error !== CONSENT_ERROR ? (
          <p className="rounded-xl bg-[#fff1f0] px-3 py-2.5 text-[14px] font-medium text-[#d92d20]">
            {error}
          </p>
        ) : null}
        <AuthPrimaryButton disabled={busy || !ready}>
          {busy ? "Saqlanmoqda…" : "Ro‘yxatdan o‘tish"}
        </AuthPrimaryButton>
      </form>
    </AuthCard>
  );
}
