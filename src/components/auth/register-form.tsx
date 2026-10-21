"use client";

import { nextPath } from "@/lib/utils";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { AuthCard, AuthField, AuthLink, AuthPrimaryButton, PasswordInput, PhoneInput, authInputClassName } from "@/components/auth/auth-card";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { SignupBonusPromo, markBonusSeen } from "@/components/bonus/bonus";
import { getBonusSnapshot, refreshBonus } from "@/lib/bonus";
import { formatMoney } from "@/lib/format";
import { ArrowRight, Check, FlaskConical, Gift, GraduationCap, Hospital, Store, Stethoscope, UserRound, type LucideIcon } from "lucide-react";

/** Saved as the profile specialty right after sign-up. */
const ROLES: { id: string; label: string; sub: string; icon: LucideIcon }[] = [
  { id: "Stomatolog", label: "Stomatolog", sub: "Amaliyotchi shifokor", icon: Stethoscope },
  { id: "Talaba", label: "Talaba", sub: "Tibbiyot talabasi", icon: GraduationCap },
  { id: "Klinika egasi", label: "Klinika egasi", sub: "Klinika rahbari", icon: Hospital },
  { id: "Tish texnigi", label: "Tish texnigi", sub: "Laboratoriya mutaxassisi", icon: FlaskConical },
  { id: "Sotuvchi", label: "Sotuvchi", sub: "Mahsulotlar sotuvchisi", icon: Store },
];

/** 0–4 from length, letter case, digits and symbols. */
function passwordScore(value: string) {
  if (value.length < 6) return 0;
  let score = 1;
  if (value.length >= 10) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(4, score);
}

const SCORE_LABEL = ["Juda qisqa", "Kuchsiz parol", "O‘rtacha parol", "Yaxshi parol", "Kuchli parol"];
const SCORE_COLOR = ["#e5484d", "#f97316", "#f59e0b", "#22a06b", "#16a34a"];

const CONSENT_ERROR = "Davom etish uchun Foydalanish shartlari va Maxfiylik siyosatiga rozilik bering.";

export function RegisterForm() {
  const router = useRouter();
  const { register, ready, profile, updateProfile } = useDoctorProfile();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState(ROLES[0].id);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const score = passwordScore(password);

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
    if (!firstName.trim() || !lastName.trim()) {
      setError("Ism va familiyani kiriting.");
      return;
    }
    if (password !== confirm) {
      setError("Parollar bir xil emas.");
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
    await updateProfile({ specialty: role });
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
      caption="Stomatologlar uchun platforma"
      footer={
        <>
          Hisobingiz bormi? <AuthLink href="/kirish">Kirish</AuthLink>
        </>
      }
    >
      <SignupBonusPromo />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <AuthField label="Ism" required>
            <span className="relative block">
              <UserRound className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#9aa5b8]" />
              <input type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ismingiz" className={authInputClassName("pl-10")} />
            </span>
          </AuthField>
          <AuthField label="Familiya" required>
            <span className="relative block">
              <UserRound className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#9aa5b8]" />
              <input type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Familiyangiz" className={authInputClassName("pl-10")} />
            </span>
          </AuthField>
        </div>
        <AuthField label="Telefon raqam" required>
          <PhoneInput value={phone} onChange={setPhone} />
        </AuthField>
        <div className="grid gap-3 sm:grid-cols-2">
          <AuthField label="Parol" required>
            <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kamida 6 belgi" title="Kamida 6 belgi" />
          </AuthField>
          <AuthField label="Parolni tasdiqlash" required>
            <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Qayta kiriting" />
          </AuthField>
        </div>
        {password ? (
          <div className="-mt-1 flex items-center gap-3" aria-live="polite">
            <span className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((step) => (
                <i key={step} className="h-1.5 flex-1 rounded-full" style={{ background: step <= score ? SCORE_COLOR[score] : "#e3e9f1" }} />
              ))}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: SCORE_COLOR[score] }}>{SCORE_LABEL[score]}</span>
          </div>
        ) : null}

        <fieldset>
          <legend className="mb-2 text-[13.5px] font-semibold text-[#1a1d26]">
            Rolingizni tanlang<span className="ml-0.5 text-[#e5484d]">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
            {ROLES.map(({ id, label, sub, icon: Icon }, index) => (
              <button
                key={id}
                type="button"
                aria-pressed={role === id}
                onClick={() => setRole(id)}
                className={`relative flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition ${index < 3 ? "sm:col-span-2" : "sm:col-span-3"} ${
                  role === id ? "border-[#0b8f8a] bg-[#f0faf9]" : "border-[#e3e9f1] bg-white hover:border-[#9edbd6]"
                }`}
              >
                {role === id ? (
                  <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-[#0b8f8a] text-white">
                    <Check className="size-3" />
                  </span>
                ) : null}
                <Icon className="size-6 text-[#0b8f8a]" />
                <span className="text-[12.5px] font-bold text-[#0f1e3d]">{label}</span>
                <span className="text-[10.5px] leading-tight text-[#6b7a90]">{sub}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-snug text-[#475569]" data-testid="consent-label">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => {
              setAccepted(e.target.checked);
              if (e.target.checked && error === CONSENT_ERROR) setError("");
            }}
            className="mt-0.5 size-[18px] shrink-0 accent-[#0b8f8a]"
            data-testid="consent-checkbox"
          />
          <span>
            <Link href="/shartlar" target="_blank" className="font-semibold text-[#0b8f8a] hover:underline">Foydalanish shartlari</Link> va{" "}
            <Link href="/maxfiylik" target="_blank" className="font-semibold text-[#0b8f8a] hover:underline">Maxfiylik siyosati</Link>ga roziman
          </span>
        </label>
        {error ? (
          <p role="alert" className="rounded-xl bg-[#fff1f0] px-3 py-2.5 text-[14px] font-medium text-[#d92d20]">
            {error}
          </p>
        ) : null}
        <AuthPrimaryButton disabled={busy || !ready}>
          {busy ? "Saqlanmoqda…" : "Davom etish"}
          {busy ? null : <ArrowRight className="size-5" />}
        </AuthPrimaryButton>
      </form>
      <SocialAuthButtons placement="after" verb="ro‘yxatdan o‘tish" locked={!accepted} onLockedClick={() => setError(CONSENT_ERROR)} />
    </AuthCard>
  );
}
