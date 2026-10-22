"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { platformLinks } from "@/components/landing/landing-content";

function SocialGlyph({ name }: { name: "telegram" | "instagram" | "facebook" | "youtube" | "tiktok" }) {
  const paths: Record<typeof name, string> = {
    telegram: "M21 4 3 11.2l6.2 2.1L18.2 7.2l-7 7.2.2 4.2 2.6-3.2 5.2 3.8L21 4z",
    instagram: "M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm8 2H8a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zm-4 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm4.4-.9a1 1 0 1 1-1 1 1 1 0 0 1 1-1z",
    facebook: "M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z",
    youtube: "M22 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C18.2 5.4 12 5.4 12 5.4s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM10 15.5v-6l5.2 3-5.2 3z",
    tiktok: "M14 3h2.1c.2 1.6 1.2 3 2.7 3.8 1 .5 1.6.6 2.2.6V10c-1.5 0-2.9-.4-4.1-1.2v6.4c0 3.3-2.6 6-6 6s-6-2.6-6-6 2.6-6 6-6c.3 0 .7 0 1 .1v2.4c-.3-.1-.7-.2-1-.2-2 0-3.6 1.6-3.6 3.7S9 19.2 11 19.2s3.6-1.6 3.6-3.7V3z",
  };
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

const SOCIALS = {
  telegram: { href: "https://t.me/stomahubuz", label: "Telegram" },
  instagram: { href: "#aloqa", label: "Instagram" },
  facebook: { href: "#aloqa", label: "Facebook" },
  youtube: { href: "#aloqa", label: "YouTube" },
  tiktok: { href: "#aloqa", label: "TikTok" },
} as const;

export function LandingSocials({ names, tone = "muted" }: { names: (keyof typeof SOCIALS)[]; tone?: "muted" | "brand" }) {
  return (
    <div className="flex gap-2">
      {names.map((name) => (
        <a
          key={name}
          href={SOCIALS[name].href}
          aria-label={SOCIALS[name].label}
          className={tone === "brand" ? "grid size-10 place-items-center rounded-full bg-[#1d6cf2] text-white hover:bg-[#1557d0]" : "grid size-11 place-items-center rounded-full bg-[#f4f7fb] text-[#334155] hover:text-[#0066FF]"}
        >
          <SocialGlyph name={name} />
        </a>
      ))}
    </div>
  );
}

const toothPath = "M16 3.2c-2.9 0-5.2 2.1-5.2 4.8 0 1.2-.5 3.2-1.2 5.1C8.5 15.6 7.6 17.9 7.6 20c0 2.7 2 4.8 4.3 4.8 1.4 0 2.3-.9 4.1-.9s2.7.9 4.1.9c2.3 0 4.3-2.1 4.3-4.8 0-2.1-.9-4.4-2-7-.7-1.9-1.2-3.9-1.2-5.1 0-2.7-2.3-4.8-5.2-4.8z";

/** Outlined molar used by the brand mark. */
export const toothOutline = "M10 4.5c-3.1 0-5.5 2.5-5.5 5.9 0 2.4.8 4.2 1.5 6.2.7 1.9 1 4.2 1.4 6.9.3 2.1 1.2 3.7 2.5 3.7 1.5 0 2-1.7 2.4-3.9.4-2.1 1-4.5 3.7-4.5s3.3 2.4 3.7 4.5c.4 2.2.9 3.9 2.4 3.9 1.3 0 2.2-1.6 2.5-3.7.4-2.7.7-5 1.4-6.9.7-2 1.5-3.8 1.5-6.2 0-3.4-2.4-5.9-5.5-5.9-2.2 0-3.6 1.1-6 1.1s-3.8-1.1-6-1.1z";

export function LandingLogo({ tagline = true, size = "md" }: { tagline?: boolean; size?: "md" | "lg" }) {
  const large = size === "lg";
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className={`${large ? "size-12" : "size-10"} shrink-0 text-[#1d6cf2]`} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinejoin="round" aria-hidden="true">
        <path d={toothOutline} />
      </svg>
      <span className="leading-tight">
        <span className={`block font-extrabold tracking-tight text-[#1d6cf2] ${large ? "text-[24px]" : "text-[20px]"}`}>Stoma<span className="text-[#0b8f8a]">Hub</span></span>
        {tagline ? <span className="mt-0.5 block max-w-[168px] text-[12px] font-medium leading-snug text-[#64748b]">Stomatologlar uchun yagona platforma</span> : null}
      </span>
    </span>
  );
}

export function ToothBadge({ className = "size-16" }: { className?: string }) {
  return (
    <span className={`grid place-items-center rounded-[18px] bg-white shadow-[0_14px_32px_rgba(15,23,42,0.14)] ring-1 ring-[#e6eef8] ${className}`}>
      <svg viewBox="0 0 32 32" className="size-[55%] text-[#0066FF]" aria-hidden="true">
        <path fill="currentColor" d={toothPath} />
      </svg>
    </span>
  );
}

export function PayMarks() {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-lg bg-[#0066FF] px-3 text-[15px] font-black tracking-[0.16em] text-white">CLICK</span>
      <span className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-lg bg-[#00C2A8] px-3 text-[17px] font-extrabold tracking-tight text-white">Payme</span>
    </div>
  );
}

const LANGS = [
  { id: "uz", label: "O‘zbekcha" },
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
] as const;

export function LandingSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const query = q.trim();
    router.push(query ? `/marketplace?q=${encodeURIComponent(query)}` : "/marketplace");
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Qidiruv"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid size-11 place-items-center rounded-full text-[#334155] transition hover:bg-[#f4f7fb]"
      >
        <Search className="size-5" />
      </button>
      {open ? (
        <form onSubmit={submit} className="absolute right-0 top-12 z-30 flex w-72 items-center gap-2 rounded-2xl border border-[#e6ebf3] bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
          <input
            autoFocus
            value={q}
            onChange={(event) => setQ(event.target.value)}
            aria-label="Marketplace qidiruv"
            placeholder="Mahsulot yoki brend"
            className="h-10 min-w-0 flex-1 rounded-xl bg-[#f7f9fc] px-3 text-[14px] outline-none"
          />
          <button type="submit" className="h-10 rounded-xl bg-[#0066FF] px-3 text-[13px] font-bold text-white">
            Qidirish
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function LandingMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={open ? "Menyuni yopish" : "Menyu"}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid size-11 shrink-0 place-items-center rounded-xl text-[#16324f]"
      >
        <Menu className="size-5" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Menyuni yopish" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <nav aria-label="Bo‘limlar" className="absolute inset-y-0 right-0 flex w-[min(86vw,320px)] flex-col bg-white pt-[max(12px,env(safe-area-inset-top))] shadow-2xl">
            <div className="flex items-center justify-between px-4 pb-2">
              <b className="text-[16px]">Menyu</b>
              <button type="button" aria-label="Yopish" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-xl">
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
              {platformLinks.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 text-[15px] font-semibold text-[#16324f]">
                  {item.label}
                </Link>
              ))}
              <Link href="/kirish" onClick={() => setOpen(false)} className="mt-3 flex h-11 items-center justify-center rounded-full border border-[#0066FF] text-[15px] font-bold text-[#0066FF]">
                Kirish
              </Link>
              <Link href="/royxat" onClick={() => setOpen(false)} className="mt-2 flex h-11 items-center justify-center rounded-full bg-[#0066FF] text-[15px] font-bold text-white">
                Ro‘yxatdan o‘tish
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}

export function LandingFaq({ items, columns = 2 }: { items: { q: string; a: string }[]; columns?: 1 | 2 }) {
  const [open, setOpen] = useState<number | null>(null);
  if (columns === 1) {
    return (
      <div className="flex flex-col gap-3">
        {items.map((item, index) => {
          const on = open === index;
          return (
            <div key={item.q} className="rounded-2xl border border-[#e8eef6] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : index)} className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left">
                <span className="text-[14px] font-semibold text-[#16324f]">{item.q}</span>
                <ChevronDown className={`size-5 shrink-0 text-[#64748b] transition ${on ? "rotate-180" : ""}`} />
              </button>
              {on ? <p className="px-4 pb-4 text-[14px] leading-relaxed text-[#52637a]">{item.a}</p> : null}
            </div>
          );
        })}
      </div>
    );
  }
  const columnsItems = [items.filter((_, index) => index % 2 === 0), items.filter((_, index) => index % 2 === 1)];
  return (
    <div className="grid items-start gap-3 lg:grid-cols-2">
      {columnsItems.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-3">
          {column.map((item) => {
            const index = items.indexOf(item);
            const on = open === index;
            return (
              <div key={item.q} className="rounded-2xl border border-[#e8eef6] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
                <button
                  type="button"
                  aria-expanded={on}
                  onClick={() => setOpen(on ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[15px] font-semibold text-[#16324f]">{item.q}</span>
                  <ChevronDown className={`size-5 shrink-0 text-[#64748b] transition ${on ? "rotate-180" : ""}`} />
                </button>
                {on ? <p className="px-5 pb-4 text-[14px] leading-relaxed text-[#52637a]">{item.a}</p> : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function LandingLang() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<(typeof LANGS)[number]["id"]>("uz");
  const current = LANGS.find((item) => item.id === lang) ?? LANGS[0];
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e6ebf3] bg-white px-3 text-[13px] font-semibold text-[#16324f]"
      >
        <span aria-hidden="true" className="text-[15px]">🌐</span>
        {current.label}
        <ChevronDown className="size-4 text-[#64748b]" />
      </button>
      {open ? (
        <ul role="listbox" aria-label="Til" className="absolute bottom-12 right-0 z-30 min-w-40 overflow-hidden rounded-2xl border border-[#e6ebf3] bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
          {LANGS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={item.id === lang}
                onClick={() => {
                  setLang(item.id);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2.5 text-left text-[14px] hover:bg-[#f4f7fb] ${item.id === lang ? "font-bold text-[#0066FF]" : "text-[#16324f]"}`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
