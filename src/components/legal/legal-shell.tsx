import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Phone, Send } from "lucide-react";
import { Logo } from "@/components/logo";
import type { SiteContact } from "@/lib/server/site";

export const LEGAL_UPDATED = "2026-yil 3-oktyabr";
export const OPERATOR = "Ibrohim Zokirjonov (Toshkent, O‘zbekiston)";
export const SITE_URL = "https://stomatolog-kaliti-lake.vercel.app";

const LINKS = [
  { href: "/maxfiylik", label: "Maxfiylik siyosati" },
  { href: "/shartlar", label: "Foydalanish shartlari" },
  { href: "/hisobni-ochirish", label: "Hisobni o‘chirish" },
] as const;

export function LegalShell({
  title,
  intro,
  current,
  toc,
  children,
}: {
  title: string;
  intro?: string;
  current: (typeof LINKS)[number]["href"];
  toc?: { id: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#F4F7FC]">
      <header className="border-b border-[#e8eef4] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/landing" aria-label="Bosh sahifa">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2 text-[14px] font-semibold">
            <Link href="/kirish" className="rounded-full px-3 py-2 text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0F766E]">
              Kirish
            </Link>
            <Link href="/royxat" className="rounded-full bg-[#0F766E] px-4 py-2 text-white hover:bg-[#115E59]">
              Ro‘yxatdan o‘tish
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <Link href="/landing" className="mb-4 inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-[14px] font-medium text-[#64748b] hover:text-[#111827]">
          <ArrowLeft className="size-4" />
          Bosh sahifa
        </Link>

        <div className="mb-5 flex flex-wrap gap-2" role="navigation" aria-label="Huquqiy sahifalar">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.href === current ? "page" : undefined}
              className={
                l.href === current
                  ? "rounded-full bg-[#0F766E] px-4 py-2 text-[13.5px] font-semibold text-white"
                  : "rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-[13.5px] font-semibold text-[#475569] hover:border-[#CCFBF1] hover:text-[#0F766E]"
              }
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {toc?.length ? (
            <aside className="hidden lg:block">
              <nav className="sticky top-6 rounded-2xl border border-[#e8eef4] bg-white p-4 text-[13.5px]" aria-label="Mundarija">
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#8b93a7]">Mundarija</p>
                <ol className="space-y-1.5">
                  {toc.map((t, i) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="block rounded-lg px-2 py-1 text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0F766E]">
                        {i + 1}. {t.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          ) : null}

          <article className="min-w-0 rounded-2xl border border-[#e8eef4] bg-white px-5 py-6 shadow-[0_8px_30px_rgba(17, 24, 39, 0.05)] sm:px-8 sm:py-8">
            <h1 className="font-[family-name:var(--font-outfit)] text-[28px] font-bold leading-tight tracking-tight text-[#111827] sm:text-[34px]">{title}</h1>
            <p className="mt-2 text-[13.5px] text-[#8b93a7]">Oxirgi yangilanish: {LEGAL_UPDATED}</p>
            {intro ? <p className="mt-4 text-[15.5px] leading-relaxed text-[#475569]">{intro}</p> : null}
            <div className="mt-6 space-y-7">{children}</div>
          </article>
        </div>
      </div>

      <footer className="border-t border-[#e8eef4] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-[13.5px] sm:flex-row sm:px-6">
          <p className="text-[#64748b]">© 2026 StomaHub · {OPERATOR}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-semibold">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-[#475569] hover:text-[#0F766E]">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Section({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="font-[family-name:var(--font-outfit)] text-[20px] font-bold text-[#111827]">
        {n}. {title}
      </h2>
      <div className="mt-2.5 space-y-3 text-[15px] leading-relaxed text-[#475569]">{children}</div>
    </section>
  );
}

export function Ul({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-[#0F766E]">{children}</ul>;
}

/** Shows only contact details the admin actually entered; otherwise points to the in-app request form. */
export function ContactBlock({ contact, scope = "savol" }: { contact: SiteContact; scope?: string }) {
  const has = contact.email || contact.phone || contact.telegram;
  return (
    <div className="rounded-xl border border-[#F0FDFA] bg-[#f5f8ff] p-4 text-[14.5px]" data-testid="legal-contact">
      <p className="font-semibold text-[#111827]">Operator: {OPERATOR}</p>
      {has ? (
        <ul className="mt-2 space-y-1.5">
          {contact.email ? (
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-[#0F766E]" />
              <a className="font-semibold text-[#0F766E] hover:underline" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </li>
          ) : null}
          {contact.phone ? (
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-[#0F766E]" />
              <a className="font-semibold text-[#0F766E] hover:underline" href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                {contact.phone}
              </a>
            </li>
          ) : null}
          {contact.telegram ? (
            <li className="flex items-center gap-2">
              <Send className="size-4 text-[#0F766E]" />
              <a className="font-semibold text-[#0F766E] hover:underline" href={`https://t.me/${contact.telegram.replace(/^@/, "")}`} rel="noreferrer">
                {contact.telegram}
              </a>
            </li>
          ) : null}
        </ul>
      ) : null}
      <p className="mt-2 flex items-start gap-2 text-[#475569]">
        <MessageSquare className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />
        <span>
          {has ? "Yoki " : "Hozircha ochiq email yoki telefon ko‘rsatilmagan. "}
          <Link className="font-semibold text-[#0F766E] hover:underline" href={`/hisobni-ochirish?turi=${scope}`}>
            ilova ichidagi so‘rov formasi
          </Link>{" "}
          orqali yozing — administrator ko‘rib chiqadi{has ? "" : " va siz kiritgan kontakt orqali javob beradi"}.
        </span>
      </p>
    </div>
  );
}
