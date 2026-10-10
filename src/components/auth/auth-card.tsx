"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="mb-6 flex w-full max-w-[440px] items-center justify-between">
        <Link
          href="/landing"
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-[14px] font-medium text-[#64748b] transition hover:bg-white hover:text-[#0f172a]"
        >
          <ArrowLeft className="size-4" />
          Orqaga
        </Link>
        <Logo compact />
      </div>

      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-[#e8eef4] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
        <div className="space-y-1 border-b border-[#f1f5f9] px-6 pb-5 pt-7 sm:px-8">
          <h1 className="font-[family-name:var(--font-outfit)] text-[26px] font-bold tracking-tight text-[#0f172a]">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-[15px] leading-relaxed text-[#64748b]">{subtitle}</p>
          ) : null}
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">{children}</div>
      </div>

      {footer ? (
        <div className="mt-6 text-center text-[15px] text-[#64748b]">{footer}</div>
      ) : null}
      <nav aria-label="Huquqiy havolalar" className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] text-[#8b93a7]">
        <Link href="/maxfiylik" className="hover:text-[#0066FF] hover:underline">Maxfiylik siyosati</Link>
        <Link href="/shartlar" className="hover:text-[#0066FF] hover:underline">Foydalanish shartlari</Link>
        <Link href="/hisobni-ochirish" className="hover:text-[#0066FF] hover:underline">Hisobni o‘chirish</Link>
      </nav>
    </div>
  );
}

export function AuthField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[14px] font-semibold text-[#1a1d26]">{label}</span>
        {hint ? <span className="text-[12px] text-[#8b93a7]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function authInputClassName(extra?: string) {
  return [
    "h-12 w-full rounded-xl border border-[#e8eef4] bg-[#f7f8fb] px-4 text-[16px] text-[#1a1d26]",
    "outline-none transition placeholder:text-[#8b93a7]",
    "focus:border-[#0066FF] focus:bg-white focus:ring-3 focus:ring-[#0066FF]/20",
    extra ?? "",
  ].join(" ");
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-[#0066FF] hover:underline">
      {children}
    </Link>
  );
}

export function AuthPrimaryButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex h-12 w-full items-center justify-center rounded-full bg-[#0066FF] text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(0,102,255,0.28)] transition hover:bg-[#0052cc] disabled:opacity-60"
    >
      {children}
    </button>
  );
}
