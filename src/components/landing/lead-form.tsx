"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { LEAD_OFFER, LEAD_ROLES } from "@/components/landing/landing-content";
import { publicContact } from "@/config/public-contact";
import { trackLeadConversion } from "@/lib/track-lead";

function nationalDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  return digits.slice(0, 9);
}

function formatNational(digits: string) {
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean).join(" ");
}

export function LeadCapture({ variant }: { variant: "desktop" | "mobile" }) {
  const desktop = variant === "desktop";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const digits = nationalDigits(phone);
    if (name.trim().length < 2 || digits.length !== 9 || !role) {
      setError("Ism, telefon (+998) va lavozimni to‘ldiring.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: name.trim(), phone: digits, role, website, source: "home" }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; duplicate?: boolean; ignored?: boolean } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "So‘rovni saqlab bo‘lmadi.");
        return;
      }
      if (!json.duplicate && !json.ignored) trackLeadConversion();
      setSent(true);
    } catch {
      setError("So‘rovni saqlab bo‘lmadi.");
    } finally {
      setBusy(false);
    }
  }

  const field = desktop
    ? "h-12 w-full rounded-xl border border-[#e3eaf3] bg-[#f8fbfe] px-3 text-[15px] text-[#16324f] outline-none focus:border-[#1d6cf2]"
    : "h-12 w-full rounded-xl border border-[#e3eaf3] bg-[#f7f9fc] px-3 text-[15px] text-[#16324f] outline-none focus:border-[#0b7f7d]";
  const phoneField = desktop
    ? "h-12 min-w-0 flex-1 rounded-r-xl border border-[#e3eaf3] bg-[#f8fbfe] px-3 text-[15px] text-[#16324f] outline-none focus:border-[#1d6cf2]"
    : "h-12 min-w-0 flex-1 rounded-r-xl border border-[#e3eaf3] bg-[#f7f9fc] px-3 text-[15px] text-[#16324f] outline-none focus:border-[#0b7f7d]";

  return (
    <section
      id="demo"
      data-section="lead"
      className={desktop ? "mx-auto w-[min(1320px,calc(100%-64px))] scroll-mt-24 py-4" : "scroll-mt-20 px-4 pb-8"}
    >
      <div className={desktop
        ? "grid items-center gap-8 rounded-[24px] border border-[#e8eef6] bg-white p-8 shadow-[0_14px_34px_rgba(15,23,42,0.06)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]"
        : "rounded-[24px] border border-[#e8eef6] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)]"}
      >
        <div>
          <p className={desktop
            ? "text-[13px] font-bold uppercase tracking-wide text-[#1d6cf2]"
            : "text-[12px] font-bold uppercase tracking-wide text-[#0b7f7d]"}
          >
            Bepul taklif
          </p>
          <h2 className={desktop
            ? "mt-2 font-[family-name:var(--font-outfit)] text-[clamp(28px,2.4vw,36px)] font-bold leading-tight tracking-tight text-[#0f2147]"
            : "mt-2 font-[family-name:var(--font-outfit)] text-[24px] font-bold leading-tight text-[#16324f]"}
          >
            {LEAD_OFFER}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#52637a]">
            Ism, telefon va lavozimingizni qoldiring. CRM demo va yaqin seminarlar ro‘yxatini shu raqamga yuboramiz.
          </p>
          <a
            href={publicContact.telegramUrl}
            className={desktop
              ? "mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-[#229ED9] px-5 text-[15px] font-bold text-white"
              : "mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-[#229ED9] text-[15px] font-bold text-white"}
          >
            <Send className="size-4" />
            Telegram · {publicContact.telegramHandle}
          </a>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-[#f4fbfa] px-5 py-6" role="status" data-testid="lead-sent">
            <p className="text-[18px] font-bold text-[#0f2147]">Rahmat, {name.trim()}!</p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#52637a]">
              So‘rovingiz qabul qilindi. Demo va seminarlar taqvimini tez orada yuboramiz. Telegram orqali ham yozishingiz mumkin.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" data-testid="lead-form" noValidate>
            <div hidden aria-hidden="true">
              <label>
                Veb-sayt
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
              </label>
            </div>
            <label className="block text-[13px] font-semibold text-[#334155]">
              Ism
              <input
                className={`mt-1 ${field}`}
                name="name"
                autoComplete="name"
                value={name}
                placeholder="Ismingiz"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="block text-[13px] font-semibold text-[#334155]">
              Telefon
              <span className="mt-1 flex">
                <span className="inline-flex h-12 items-center rounded-l-xl border border-r-0 border-[#e3eaf3] bg-[#eef3f8] px-3 text-[15px] font-bold text-[#16324f]">+998</span>
                <input
                  className={phoneField}
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel-national"
                  aria-label="Telefon raqami, +998"
                  placeholder="90 000 00 00"
                  value={formatNational(nationalDigits(phone))}
                  onChange={(event) => setPhone(nationalDigits(event.target.value))}
                />
              </span>
            </label>
            <label className="block text-[13px] font-semibold text-[#334155]">
              Lavozim
              <select className={`mt-1 ${field}`} name="role" value={role} onChange={(event) => setRole(event.target.value)} aria-label="Lavozim">
                <option value="">Tanlang</option>
                {LEAD_ROLES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
            {error ? <p className="text-[13px] font-semibold text-[#b42318]" role="alert">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className={desktop
                ? "inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#1d6cf2] text-[15px] font-bold text-white disabled:opacity-60"
                : "flex h-12 w-full items-center justify-center rounded-full bg-[#0b7f7d] text-[15px] font-bold text-white disabled:opacity-60"}
            >
              {busy ? "Yuborilmoqda…" : "Yuborish"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
