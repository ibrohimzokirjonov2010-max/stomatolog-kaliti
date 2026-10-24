"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BarChart3, Eye, EyeOff, GraduationCap, ShoppingCart } from "lucide-react";
function AuthMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="#0F766E"
        strokeWidth="2.6"
        strokeLinejoin="round"
        d="M10 4.5c-3.1 0-5.5 2.5-5.5 5.9 0 2.4.8 4.2 1.5 6.2.7 1.9 1 4.2 1.4 6.9.3 2.1 1.2 3.7 2.5 3.7 1.5 0 2-1.7 2.4-3.9.4-2.1 1-4.5 3.7-4.5s3.3 2.4 3.7 4.5c.4 2.2.9 3.9 2.4 3.9 1.3 0 2.2-1.6 2.5-3.7.4-2.7.7-5 1.4-6.9.7-2 1.5-3.8 1.5-6.2 0-3.4-2.4-5.9-5.5-5.9-2.2 0-3.6 1.1-6 1.1s-3.8-1.1-6-1.1z"
      />
    </svg>
  );
}

const FEATURES = [
  { icon: ShoppingCart, title: "Marketplace", text: "Stomatologik mahsulotlar, uskunalar va materiallar" },
  { icon: GraduationCap, title: "Ta’lim va seminarlar", text: "Professional kurslar, seminarlar va ustalardan mahorat darslari" },
  { icon: BarChart3, title: "Klinika CRM", text: "Mening klinikam: bemorlar, uchrashuvlar, davolash rejalari, to‘lovlar va hisobotlar" },
];

/** Brand word used on the auth pages: tooth mark + "StomaHub" with a small caption. */
function AuthBrand({ caption, center }: { caption: string; center?: boolean }) {
  return (
    <span className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}>
      <AuthMark className="h-11 w-10" />
      <span className="leading-tight">
        <span className="block text-[30px] font-extrabold tracking-tight text-[#16324f]">
          Stoma<span className="text-[#0F766E]">Hub</span>
        </span>
        <span className="block text-[12.5px] text-[#5d6e86]">{caption}</span>
      </span>
    </span>
  );
}

/** Desktop: hero panel on the left, form card on the right. Phones keep the single centred card. */
export function AuthCard({
  title,
  subtitle,
  caption = "Stomatologlar uchun platforma",
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  /** Small line under the logo in the form card. */
  caption?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#f4f8fb] lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(480px,1fr)]">
      <aside className="relative hidden overflow-hidden rounded-r-[28px] bg-[#eef6f8] lg:sticky lg:top-0 lg:block lg:h-[100dvh]">
        <Image src="/img/landing/hero-dentist.jpg" alt="" fill priority sizes="60vw" className="-scale-x-100 object-cover object-left" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f8fbfd] from-30% via-[#f8fbfd]/75 via-50% to-transparent to-72%" />
        <div className="relative flex h-full flex-col justify-center gap-8 px-[6%] py-10">
          <Link href="/landing" aria-label="StomaHub bosh sahifa">
            <AuthBrand caption="Stomatologlar uchun platforma" />
          </Link>
          <div>
            <h2 className="max-w-[min(480px,42vw)] text-[clamp(32px,3vw,48px)] leading-[1.08] font-extrabold tracking-tight text-[#0f1e3d]">
              Stomatologlar uchun <span className="text-[#0F766E]">yagona platforma</span>
            </h2>
            <p className="mt-4 max-w-[420px] text-[clamp(14px,1.2vw,17px)] leading-relaxed text-[#4a5a72]">
              Do‘kon, ta’lim va klinika boshqaruvini bir joyda. Stomatologlar uchun zamonaviy ekosistema.
            </p>
          </div>
          <ul className="flex max-w-[440px] flex-col gap-4">
            {FEATURES.map(({ icon: Icon, title: name, text }) => (
              <li key={name} className="flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/80 text-[#0F766E] shadow-sm backdrop-blur">
                  <Icon className="size-6" />
                </span>
                <span>
                  <b className="block text-[16px] text-[#0f1e3d]">{name}</b>
                  <span className="mt-0.5 block text-[13.5px] leading-snug text-[#5d6e86]">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 pb-8 sm:py-12 lg:px-8 lg:py-8">
        {/* Phone hero (mockup): photo on the right, big brand, title and subtitle. */}
        <div className="relative -mx-4 w-[calc(100%+2rem)] overflow-hidden px-4 pt-3 pb-16 lg:hidden">
          <Image src="/img/landing/hero-dentist.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[75%_center] opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f4f8fb] from-35% via-[#f4f8fb]/85 via-60% to-[#f4f8fb]/20" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f4f8fb] to-transparent" />
          <Link
            href="/landing"
            className="relative inline-flex items-center gap-1.5 rounded-full px-1 py-1.5 text-[13px] font-medium text-[#64748b]"
          >
            <ArrowLeft className="size-4" />
            Orqaga
          </Link>
          <div className="relative mt-2 flex flex-col items-center text-center">
            <AuthMark className="h-16 w-14" />
            <span className="mt-1 text-[34px] leading-none font-extrabold tracking-tight text-[#0F766E]">StomaHub</span>
            <span className="mt-1 text-[12.5px] text-[#6a7c93]">{caption}</span>
            <h1 className="mt-5 text-[27px] leading-tight font-extrabold tracking-tight text-[#0f1e3d]">{title}</h1>
            {subtitle ? <p className="mt-1 max-w-[300px] text-[13px] leading-relaxed text-[#6a7c93]">{subtitle}</p> : null}
          </div>
        </div>

        <div className="relative -mt-10 w-full max-w-[500px] rounded-[22px] border border-[#e8eef4] bg-white px-5 py-6 shadow-[0_16px_48px_rgba(15,23,42,0.08)] sm:px-8 lg:mt-0 lg:px-6 lg:py-7">
          <div className="mb-6 hidden lg:block">
            <AuthBrand caption={caption} center />
          </div>
          <div className="mb-6 hidden text-center lg:block">
            <h1 className="text-[27px] font-extrabold tracking-tight text-[#0f1e3d]">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#64748b]">{subtitle}</p> : null}
          </div>
          <div className="space-y-5">{children}</div>
          {footer ? <div className="mt-6 text-center text-[14.5px] text-[#64748b]">{footer}</div> : null}
        </div>

        <nav aria-label="Huquqiy havolalar" className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] text-[#8b93a7]">
          <Link href="/maxfiylik" className="hover:text-[#0F766E] hover:underline">Maxfiylik siyosati</Link>
          <Link href="/shartlar" className="hover:text-[#0F766E] hover:underline">Foydalanish shartlari</Link>
          <Link href="/hisobni-ochirish" className="hover:text-[#0F766E] hover:underline">Hisobni o‘chirish</Link>
        </nav>
      </main>
    </div>
  );
}

export function AuthField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[13.5px] font-semibold text-[#1a1d26]">
          {label}
          {required ? <span className="ml-0.5 text-[#e5484d]">*</span> : null}
        </span>
        {hint ? <span className="text-[12px] text-[#8b93a7]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function authInputClassName(extra?: string) {
  return [
    "h-12 w-full rounded-xl border border-[#e3e9f1] bg-white px-4 text-[16px] text-[#1a1d26]",
    "outline-none transition placeholder:text-[#9aa5b8]",
    "focus:border-[#0F766E] focus:ring-3 focus:ring-[#0F766E]/15",
    extra ?? "",
  ].join(" ");
}

/** Phone input with a fixed +998 prefix; the value is the national 9 digits as typed. */
export function PhoneInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <span className="flex h-12 w-full items-center overflow-hidden rounded-xl border border-[#e3e9f1] bg-white transition focus-within:border-[#0F766E] focus-within:ring-3 focus-within:ring-[#0F766E]/15">
      <span className="flex h-full shrink-0 items-center gap-2 border-r border-[#eef2f7] px-3.5 text-[15px] font-semibold text-[#1a1d26]">
        <span aria-hidden className="flex h-3.5 w-5 flex-col overflow-hidden rounded-[2px] ring-1 ring-black/10">
          <i className="flex-1 bg-[#1eb4e6]" />
          <i className="h-px bg-[#ce1126]" />
          <i className="flex-1 bg-white" />
          <i className="h-px bg-[#ce1126]" />
          <i className="flex-1 bg-[#1eb53a]" />
        </span>
        +998
      </span>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        aria-label="Telefon raqam"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="90 123 45 67"
        className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-[16px] text-[#1a1d26] outline-none placeholder:text-[#9aa5b8]"
      />
    </span>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  return (
    <span className="relative block">
      <input {...props} type={shown ? "text" : "password"} className={authInputClassName("pr-12")} />
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        aria-label={shown ? "Parolni yashirish" : "Parolni ko‘rsatish"}
        className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#6b7a90] hover:bg-[#f1f5f9]"
      >
        {shown ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </span>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-[#0F766E] hover:underline">
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
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(15,118,110,0.25)] transition hover:bg-[#115E59] disabled:opacity-60"
    >
      {children}
    </button>
  );
}
