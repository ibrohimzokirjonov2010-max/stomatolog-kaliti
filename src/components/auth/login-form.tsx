"use client";

import { nextPath } from "@/lib/utils";

import { useEffect, useState, type FormEvent } from "react";
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

export function LoginForm() {
  const router = useRouter();
  const { login, ready, profile } = useDoctorProfile();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && profile) router.replace(nextPath());
  }, [ready, profile, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await login({ phone, password });
    setBusy(false);
    if (!result.ok) {
      if (result.reason === "not_found") setError("Bu telefon bilan akkaunt topilmadi.");
      else if (result.reason === "wrong_password") setError("Parol noto‘g‘ri.");
      else if (result.reason === "blocked") setError("Akkauntingiz bloklangan. Qo‘llab-quvvatlash xizmatiga murojaat qiling.");
      else if (result.reason === "network") setError(result.message ?? "Tarmoq xatosi. Qayta urinib ko‘ring.");
      else setError("Telefon va parolni kiriting.");
      return;
    }
    router.push(nextPath());
  }

  return (
    <AuthCard
      title="Kirish"
      subtitle="Hisobingizga kiring"
      footer={
        <>
          Akkauntingiz yo‘qmi? <AuthLink href="/royxat">Ro‘yxatdan o‘tish</AuthLink>
        </>
      }
    >
      <SocialAuthButtons />

      <form onSubmit={submit} className="space-y-4">
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
        <AuthField label="Parol">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parolingiz"
            className={authInputClassName()}
          />
        </AuthField>
        {error ? (
          <p className="rounded-xl bg-[#fff1f0] px-3 py-2.5 text-[14px] font-medium text-[#d92d20]">
            {error}
          </p>
        ) : null}
        <AuthPrimaryButton disabled={busy || !ready}>
          {busy ? "Kutilmoqda…" : "Kirish"}
        </AuthPrimaryButton>
      </form>
      <p className="text-center text-[13px] leading-relaxed text-[#8b93a7]" data-testid="login-consent">
        Kirish yoki Google orqali davom etish bilan siz{" "}
        <Link href="/shartlar" className="font-semibold text-[#0066FF] hover:underline">Foydalanish shartlari</Link> va{" "}
        <Link href="/maxfiylik" className="font-semibold text-[#0066FF] hover:underline">Maxfiylik siyosati</Link>ga rozilik bildirasiz.
      </p>
    </AuthCard>
  );
}
