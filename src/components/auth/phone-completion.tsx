"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, UserRound } from "lucide-react";
import { AuthCard, AuthField, AuthPrimaryButton, PhoneInput, authInputClassName } from "@/components/auth/auth-card";
import { SignupRolePicker } from "@/components/auth/signup-role-picker";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { afterAuthPath, hasFullPhone } from "@/lib/auth-next";
import { normalizePhone } from "@/lib/doctor-profile";
import { signupRole } from "@/lib/signup-roles";
import { trackLeadConversion } from "@/lib/track-lead";

const PLACEHOLDER_NAME = "Google foydalanuvchi";

export function PhoneCompletion() {
  const router = useRouter();
  const { ready, profile, updateProfile } = useDoctorProfile();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [seededFor, setSeededFor] = useState("");

  if (profile && seededFor !== profile.id && !hasFullPhone(profile.phone)) {
    setSeededFor(profile.id);
    setName(profile.fullName === PLACEHOLDER_NAME ? "" : profile.fullName);
    setRole(signupRole(profile.specialty));
  }

  useEffect(() => {
    if (!ready) return;
    if (!profile) {
      router.replace("/kirish");
      return;
    }
    if (hasFullPhone(profile.phone)) router.replace(afterAuthPath(profile.phone));
  }, [ready, profile, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Ism va familiyani kiriting.");
      return;
    }
    if (normalizePhone(phone).length !== 9) {
      setError("Telefon raqamni to‘liq kiriting (+998).");
      return;
    }
    if (!signupRole(role)) {
      setError("Rolingizni tanlang.");
      return;
    }
    setBusy(true);
    const result = await updateProfile({ fullName: name.trim(), phone, specialty: role });
    setBusy(false);
    if (!result.ok) {
      if (result.reason === "exists") setError("Bu telefon allaqachon ro‘yxatdan o‘tgan.");
      else if (result.reason === "phone_locked") setError(result.message ?? "Tasdiqlangan raqamni o‘zgartirib bo‘lmaydi.");
      else setError(result.message ?? "Saqlab bo‘lmadi. Qayta urinib ko‘ring.");
      return;
    }
    if (result.leadCreated) trackLeadConversion();
    router.push(afterAuthPath(result.profile.phone));
  }

  if (!ready || !profile || hasFullPhone(profile.phone)) {
    return <div className="grid min-h-[40vh] place-items-center text-sm text-slate-500">Yuklanmoqda…</div>;
  }

  return (
    <AuthCard title="Telefon raqamingiz" subtitle="Ilovaga kirishdan oldin ism, telefon va rol kerak." caption="Stomatologlar uchun platforma">
      <form onSubmit={submit} className="space-y-4" noValidate data-testid="phone-completion">
        <AuthField label="Ism va familiya" required>
          <span className="relative block">
            <UserRound className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#9aa5b8]" />
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ism Familiya"
              className={authInputClassName("pl-10")}
            />
          </span>
        </AuthField>
        <AuthField label="Telefon raqam" required>
          <PhoneInput value={phone} onChange={setPhone} />
        </AuthField>
        <SignupRolePicker value={role} onChange={setRole} />
        {error ? (
          <p role="alert" className="rounded-xl bg-[#fff1f0] px-3 py-2.5 text-[14px] font-medium text-[#d92d20]">
            {error}
          </p>
        ) : null}
        <AuthPrimaryButton disabled={busy}>
          {busy ? "Saqlanmoqda…" : "Davom etish"}
          {busy ? null : <ArrowRight className="size-5" />}
        </AuthPrimaryButton>
      </form>
    </AuthCard>
  );
}
