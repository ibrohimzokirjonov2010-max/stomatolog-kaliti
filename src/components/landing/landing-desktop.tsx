import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { LandingFaq, LandingLang, LandingSearch, LandingSocials } from "@/components/landing/landing-bits";
import { appPoints, crmPoints, desktopNav, faqs, features, heroText, people, steps } from "@/components/landing/landing-content";
import { site } from "@/data/site";

const wrap = "mx-auto w-[min(1400px,calc(100%-clamp(32px,4vw,96px)))]";

const homeTiles = [
  { label: "Seminar", color: "#1497a8", bg: "#e7f6f4" },
  { label: "Market", color: "#0066ff", bg: "#e8f1ff" },
  { label: "Material", color: "#f59e0b", bg: "#fff1e6" },
  { label: "Forma", color: "#8b5cf6", bg: "#f3e8ff" },
  { label: "Ta’lim", color: "#f43f5e", bg: "#ffe8ee" },
  { label: "Kitob", color: "#3b82f6", bg: "#e8f1ff" },
  { label: "Usta", color: "#0d9488", bg: "#e7f6f4" },
  { label: "Lab", color: "#7c3aed", bg: "#f3e8ff" },
] as const;

function PhoneShell({ children, className = "", width = "w-[clamp(168px,14vw,220px)]", height = "h-[clamp(320px,28vw,420px)]" }: { children: ReactNode; className?: string; width?: string; height?: string }) {
  return (
    <div className={`${width} overflow-hidden rounded-[28px] border-[7px] border-[#0f172a] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] ${className}`}>
      <div className={`relative overflow-hidden rounded-[22px] bg-[#f4f7fb] ${height}`}>
        <span className="absolute left-1/2 top-1.5 z-10 h-3 w-12 -translate-x-1/2 rounded-full bg-[#0f172a]" />
        <div className="h-full overflow-hidden px-2 pt-5">{children}</div>
      </div>
    </div>
  );
}

export function HomePhone({ width, height, className = "" }: { width?: string; height?: string; className?: string }) {
  return (
    <PhoneShell width={width} height={height} className={className}>
      <div className="pb-2">
        <b className="text-[12px] tracking-wide text-[#16324f]">STOMA<span className="text-[#0066FF]">HUB</span></b>
        <p className="mt-1 text-[12px] font-extrabold leading-tight text-[#16324f]">Dr. Azizbek</p>
        <div className="mt-2 h-7 rounded-full bg-white px-2 text-[12px] leading-7 text-[#94a3b8] ring-1 ring-[#e6ebf3]">Qidiruv</div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {homeTiles.slice(0, 4).map((tile) => (
            <div key={tile.label} className="flex items-center gap-1 rounded-lg bg-white px-1.5 py-1 shadow-sm">
              <span className="grid size-5 shrink-0 place-items-center rounded-md text-[12px] font-bold" style={{ background: tile.bg, color: tile.color }}>
                {tile.label.slice(0, 1)}
              </span>
              <span className="truncate text-[12px] font-semibold text-[#334155]">{tile.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 overflow-hidden rounded-lg bg-white shadow-sm">
          <img src="/img/mobile/implant.jpg" alt="" className="h-12 w-full object-cover" />
          <p className="px-1.5 py-1 text-[12px] font-bold leading-tight text-[#16324f]">Seminar · Toshkent</p>
        </div>
      </div>
    </PhoneShell>
  );
}

export function ProfilePhone({ width, height, className = "mt-10" }: { width?: string; height?: string; className?: string }) {
  return (
    <PhoneShell width={width} height={height} className={className}>
      <div className="pb-2">
        <p className="text-center text-[12px] font-extrabold text-[#16324f]">Profil</p>
        <img src="/images/avatar-azizbek.png" alt="" className="mx-auto mt-1 size-10 rounded-full object-cover" />
        <p className="mt-1 text-center text-[12px] font-bold leading-tight text-[#16324f]">Dr. Azizbek</p>
        <div className="mt-2 space-y-1">
          {["Kurslarim", "Buyurtmalar", "Uchrashuvlar"].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-white px-1.5 py-1 text-[12px] font-semibold text-[#16324f] shadow-sm">
              <span className="truncate">{label}</span>
              <ChevronRight className="size-3 shrink-0 text-[#94a3b8]" />
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}

export function CrmMock({ compact = false }: { compact?: boolean }) {
  const bars = [42, 55, 48, 70, 62, 88, 74];
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#e6ebf3] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className={compact ? "grid grid-cols-[104px_minmax(0,1fr)]" : "grid grid-cols-[148px_minmax(0,1fr)]"}>
        <aside className="border-r border-[#eef2f7] bg-[#f8fafc] p-3">
          <p className="px-2 text-[12px] font-extrabold tracking-wide text-[#16324f]">STOMA<span className="text-[#0066FF]">HUB</span></p>
          <nav className="mt-3 space-y-1 text-[12px] font-semibold text-[#52637a]">
            {["Bosh sahifa", "Bemorlar", "Uchrashuvlar", "To‘lovlar", "Ombor", "Hisobotlar"].map((item, index) => (
              <p key={item} className={index === 0 ? "rounded-lg bg-[#e8f1ff] px-2 py-1.5 text-[#0066FF]" : "px-2 py-1.5"}>{item}</p>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 p-3">
          <p className="text-[13px] font-extrabold text-[#16324f]">Bosh sahifa</p>
          <div className={compact ? "mt-2 grid grid-cols-2 gap-2" : "mt-2 grid grid-cols-4 gap-2"}>
            {[
              ["Bemorlar", "128"],
              ["Bugungi qabul", "5"],
              ["Daromad", "4.2 mln"],
              ["Qarz", "850 ming"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#f7f9fc] px-2 py-2">
                <p className="text-[12px] text-[#64748b]">{label}</p>
                <p className="text-[13px] font-extrabold text-[#16324f]">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 overflow-hidden rounded-xl border border-[#eef2f7]">
            <div className="grid grid-cols-[64px_1fr_1fr] bg-[#f8fafc] px-2 py-1.5 text-[12px] font-bold text-[#64748b]">
              <span>Vaqt</span><span>Bemor</span><span>Xizmat</span>
            </div>
            {[
              ["09:00", "Malika Karimova", "Profilaktik ko‘rik"],
              ["10:30", "Jahongir Rahimov", "Plomba"],
              ["12:00", "Oysa Abdurahmonova", "Endodontiya"],
            ].map((row) => (
              <div key={row[0]} className="grid grid-cols-[64px_1fr_1fr] border-t border-[#f1f5f9] px-2 py-1.5 text-[12px] text-[#16324f]">
                {row.map((cell) => <span key={cell} className="truncate">{cell}</span>)}
              </div>
            ))}
          </div>
          <div className={compact ? "mt-2 grid gap-2" : "mt-2 grid grid-cols-[1fr_120px] gap-2"}>
            <div className="space-y-1.5">
              {[
                ["/img/phone14/pat-0.png", "Malika Karimova"],
                ["/img/phone14/pat-1.png", "Jahongir Rahimov"],
                ["/img/phone14/pat-2.png", "Oysa Abdurahmonova"],
              ].map(([src, name]) => (
                <div key={name} className="flex items-center gap-2 rounded-lg bg-[#f7f9fc] px-2 py-1">
                  <img src={src} alt="" className="size-6 rounded-full object-cover" />
                  <span className="truncate text-[12px] font-semibold text-[#16324f]">{name}</span>
                </div>
              ))}
            </div>
            <svg viewBox="0 0 120 72" className="h-full w-full" aria-hidden="true">
              <polyline fill="none" stroke="#0066FF" strokeWidth="2.5" points={bars.map((h, i) => `${8 + i * 16},${68 - h * 0.6}`).join(" ")} />
              {bars.map((h, i) => <circle key={i} cx={8 + i * 16} cy={68 - h * 0.6} r="2.4" fill="#00C2A8" />)}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingDesktop() {
  return (
    <div className="bg-[#f7f9fc] text-[#16324f]" data-testid="desktop-landing">
      <header data-section="header" className="sticky top-0 z-40 border-b border-[#e8eef6] bg-white/95 backdrop-blur">
        <div className={`${wrap} flex h-[72px] items-center gap-4`}>
          <Link href="/landing" aria-label={site.name} className="flex shrink-0 items-center gap-3">
            <Logo />
            <span className="hidden max-w-[150px] text-[12px] font-medium leading-snug text-[#64748b] xl:block">
              Stomatologlar uchun yagona platforma
            </span>
          </Link>
          <nav aria-label="Asosiy" className="flex min-w-0 flex-1 items-center justify-center gap-1">
            {desktopNav.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full px-2.5 py-2 text-[clamp(12px,0.9vw,14px)] font-semibold text-[#334155] transition hover:bg-[#f4f7fb] hover:text-[#0066FF]">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <LandingSearch />
            <Link href="/kirish" className="inline-flex h-11 items-center rounded-full border border-[#0066FF] px-4 text-[14px] font-bold text-[#0066FF] transition hover:bg-[#f3f8ff]">
              Kirish
            </Link>
            <Link href="/royxat" className="inline-flex h-11 items-center rounded-full bg-[#0066FF] px-4 text-[14px] font-bold text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)] transition hover:bg-[#0052cc]">
              Ro‘yxatdan o‘tish
            </Link>
          </div>
        </div>
      </header>

      <section data-section="hero" className={`${wrap} grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-16`}>
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-[#0066FF] shadow-sm ring-1 ring-[#e6ebf3]">
            <span className="size-1.5 rounded-full bg-[#00C2A8]" />
            Stomatologlar uchun yagona platforma
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-outfit)] text-[clamp(2.4rem,3.3vw,3.5rem)] font-bold leading-[1.12] tracking-tight text-[#0f2744]">
            Stomatologlar uchun
            <span className="block text-[#0066FF]">yagona platforma</span>
          </h1>
          <p className="mt-4 max-w-xl text-[clamp(15px,1.1vw,18px)] leading-relaxed text-[#52637a]">{heroText}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/royxat" className="inline-flex h-12 items-center rounded-full bg-[#0066FF] px-6 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(0,102,255,0.28)] transition hover:bg-[#0052cc]">
              Bepul ro‘yxatdan o‘tish
            </Link>
            <Link href="/marketplace" className="inline-flex h-12 items-center rounded-full border border-[#d7e2f0] bg-white px-6 text-[15px] font-bold text-[#16324f] transition hover:border-[#0066FF] hover:text-[#0066FF]">
              Marketplace’ni ko‘rish
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-semibold text-[#334155]">
            <li className="inline-flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-[#e8f1ff] text-[#0066FF]"><LayoutDashboard className="size-4" /></span>Barcha imkoniyatlar bir joyda</li>
            <li className="inline-flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-[#e6faf6] text-[#00A896]"><Building2 className="size-4" /></span>O‘zbekiston bozori uchun mos</li>
            <li className="inline-flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-[#fff4e5] text-[#d97706]"><Users className="size-4" /></span>Stomatologlar hamjamiyati</li>
          </ul>
        </div>
        <div className="relative min-h-[420px]">
          <img src="/img/landing/hero-dentist.jpg" alt="Stomatolog shifokor klinika fonida" className="h-[clamp(380px,36vw,520px)] w-full rounded-[28px] object-cover object-[center_20%]" />
          <div className="absolute -bottom-6 right-4 lg:right-0">
            <HomePhone />
          </div>
        </div>
      </section>

      <section data-section="features" className={`${wrap} py-16`}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(1.8rem,2.2vw,2.4rem)] font-bold tracking-tight">Nimalar bor?</h2>
          <p className="mt-2 text-[clamp(14px,1vw,16px)] text-[#52637a]">Stomatologlar uchun kerakli barcha imkoniyatlar bir joyda</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-[20px] border border-[#e8eef6] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
              <span className={`grid size-12 place-items-center rounded-2xl ${item.tone}`}>
                <item.icon className="size-6" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 font-[family-name:var(--font-outfit)] text-[17px] font-bold">{item.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-[#52637a]">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section data-section="audiences" className="bg-white py-16">
        <div className={wrap}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(1.8rem,2.2vw,2.4rem)] font-bold tracking-tight">Kimlar uchun?</h2>
            <p className="mt-2 text-[clamp(14px,1vw,16px)] text-[#52637a]">Platforma klinikadagi har bir rol uchun</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {people.map((person) => (
              <Link key={person.title} href={person.href} className={`group rounded-[22px] border bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 ${person.selected ? "border-[#0066FF] ring-2 ring-[#0066FF]/30" : "border-[#e8eef6]"}`}>
                <img src={person.image} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover object-top" />
                <div className="mt-3 flex items-start justify-between gap-2 px-1 pb-1">
                  <span>
                    <b className="block text-[15px]">{person.title}</b>
                    <span className="mt-0.5 block text-[13px] text-[#52637a]">{person.text}</span>
                  </span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f4f7fb] text-[#0066FF] group-hover:bg-[#0066FF] group-hover:text-white">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section data-section="crm" className={`${wrap} grid items-center gap-10 py-16 lg:grid-cols-2`}>
        <div>
          <p className="inline-flex rounded-full bg-[#e8f1ff] px-3 py-1 text-[12px] font-bold text-[#0066FF]">Klinika CRM</p>
          <h2 className="mt-4 font-[family-name:var(--font-outfit)] text-[clamp(1.8rem,2.2vw,2.4rem)] font-bold leading-tight tracking-tight">Klinikangizni to‘liq nazorat qiling</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#52637a]">
            Bemorlar, uchrashuvlar, davolash rejalari, to‘lovlar va hisobotlar — barchasi bir joyda. Klinika jarayonlarini soddalashtiring va samaradorlikni oshiring.
          </p>
          <ul className="mt-5 space-y-2.5">
            {crmPoints.map((point) => (
              <li key={point} className="flex items-center gap-3 text-[15px] font-medium">
                <span className="grid size-6 place-items-center rounded-full bg-[#e6faf6] text-[#00A896]"><Check className="size-3.5" /></span>
                {point}
              </li>
            ))}
          </ul>
          <Link href="/crm" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#0066FF] px-6 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(0,102,255,0.25)] transition hover:bg-[#0052cc]">
            CRM imkoniyatlarini ko‘rish <ArrowRight className="size-4" />
          </Link>
        </div>
        <CrmMock />
      </section>

      <section data-section="steps" className="bg-white py-16">
        <div className={wrap}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(1.8rem,2.2vw,2.4rem)] font-bold tracking-tight">Qanday ishlaydi?</h2>
            <p className="mt-2 text-[clamp(14px,1vw,16px)] text-[#52637a]">StomaHub’da boshlash juda oson</p>
          </div>
          <ol className="mt-10 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {steps.map((step, index) => (
              <li key={step.n} className="contents">
                <div className="rounded-[22px] border border-[#e8eef6] bg-[#f7f9fc] px-6 py-8 text-center">
                  <span className="inline-grid size-12 place-items-center rounded-full bg-[#0066FF] font-[family-name:var(--font-outfit)] text-lg font-bold text-white">{step.n}</span>
                  <h3 className="mt-4 text-[17px] font-bold">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#52637a]">{step.text}</p>
                </div>
                {index < steps.length - 1 ? <ChevronRight className="mx-auto hidden size-7 self-center text-[#94a3b8] lg:block" aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section data-section="app" id="ilova" className={`${wrap} grid items-center gap-8 py-16 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,0.8fr)]`}>
        <div>
          <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(1.8rem,2.2vw,2.4rem)] font-bold tracking-tight">Har doim yoningizda</h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#52637a]">
            StomaHub mobil ilovasi bilan barcha imkoniyatlar telefoningizda. Istalgan vaqtda, istalgan joyda.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0f172a] px-4 text-white">
              <span className="text-[18px] leading-none"></span>
              <span className="text-left leading-tight"><span className="block text-[12px] opacity-80">App Store’dan</span><span className="block text-[13px] font-bold">yuklab oling</span></span>
            </a>
            <a href="/" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0f172a] px-4 text-white">
              <span className="text-[16px] leading-none">▶</span>
              <span className="text-left leading-tight"><span className="block text-[12px] opacity-80">Google Play’dan</span><span className="block text-[13px] font-bold">yuklab oling</span></span>
            </a>
          </div>
        </div>
        <div className="flex items-end justify-center gap-4">
          <HomePhone />
          <ProfilePhone />
        </div>
        <ul className="space-y-3">
          {appPoints.map((point) => (
            <li key={point} className="flex items-center gap-3 rounded-2xl border border-[#e8eef6] bg-white px-4 py-3 text-[15px] font-semibold shadow-sm">
              <span className="grid size-7 place-items-center rounded-full bg-[#e6faf6] text-[#00A896]"><Check className="size-4" /></span>
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section data-section="faq" id="savollar" className="bg-white py-16">
        <div className={wrap}>
          <h2 className="text-center font-[family-name:var(--font-outfit)] text-[clamp(1.8rem,2.2vw,2.4rem)] font-bold tracking-tight">Ko‘p so‘raladigan savollar</h2>
          <div className="mt-8">
            <LandingFaq items={faqs.map((item) => ({ q: item.q, a: item.a }))} />
          </div>
        </div>
      </section>

      <section data-section="cta" className={`${wrap} py-8`}>
        <div className="rounded-[28px] bg-gradient-to-r from-[#0066FF] to-[#3d8bff] px-8 py-12 text-center text-white shadow-[0_16px_40px_rgba(0,102,255,0.25)]">
          <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(1.7rem,2.2vw,2.3rem)] font-bold tracking-tight">Stomatologlar hamjamiyatiga qo‘shiling</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[16px] text-white/90">Kasbiy o‘sish, yangi imkoniyatlar va ishonchli hamkorlar — barchasi StomaHub’da.</p>
          <Link href="/royxat" className="mt-6 inline-flex h-12 items-center rounded-full bg-white px-6 text-[15px] font-bold text-[#0066FF] transition hover:bg-[#f3f8ff]">
            Bepul ro‘yxatdan o‘tish
          </Link>
        </div>
      </section>

      <footer data-section="footer" className="mt-8 border-t border-[#e8eef6] bg-white">
        <div className={`${wrap} grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-6`}>
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-3 text-[13px] leading-relaxed text-[#52637a]">Stomatologlar uchun yagona platforma</p>
            <div className="mt-4">
              <LandingSocials names={["telegram", "instagram", "facebook", "youtube"]} />
            </div>
          </div>
          <div>
            <b className="text-[14px]">Platforma</b>
            <ul className="mt-3 space-y-2 text-[14px] text-[#52637a]">
              <li><Link href="/marketplace" className="hover:text-[#0066FF]">Marketplace</Link></li>
              <li><Link href="/talim" className="hover:text-[#0066FF]">Ta’lim</Link></li>
              <li><Link href="/seminarlar" className="hover:text-[#0066FF]">Seminarlar</Link></li>
              <li><Link href="/kitoblar" className="hover:text-[#0066FF]">Kitoblar</Link></li>
            </ul>
          </div>
          <div>
            <b className="text-[14px]">Klinika CRM</b>
            <ul className="mt-3 space-y-2 text-[14px] text-[#52637a]">
              <li><Link href="/crm" className="hover:text-[#0066FF]">Klinika CRM</Link></li>
              <li><Link href="/ustalar" className="hover:text-[#0066FF]">Ustalar laboratoriyalari</Link></li>
              <li><Link href="/mutaxassislar" className="hover:text-[#0066FF]">Konsultatsiyalar</Link></li>
              <li><Link href="/elonlar" className="hover:text-[#0066FF]">E’lonlar</Link></li>
            </ul>
          </div>
          <div>
            <b className="text-[14px]">Yordam</b>
            <ul className="mt-3 space-y-2 text-[14px] text-[#52637a]">
              <li><a href="#savollar" className="hover:text-[#0066FF]">Ko‘p so‘raladigan savollar</a></li>
              <li><a href="#aloqa" className="hover:text-[#0066FF]">Yordam markazi</a></li>
              <li><Link href="/maxfiylik" className="hover:text-[#0066FF]">Maxfiylik siyosati</Link></li>
              <li><Link href="/shartlar" className="hover:text-[#0066FF]">Foydalanish shartlari</Link></li>
            </ul>
          </div>
          <div id="aloqa">
            <b className="text-[14px]">Aloqa</b>
            <ul className="mt-3 space-y-2 text-[14px] text-[#52637a]">
              <li><a href="tel:+998901234567" className="hover:text-[#0066FF]">+998 90 123 45 67</a></li>
              <li><a href="mailto:info@stomahub.uz" className="hover:text-[#0066FF]">info@stomahub.uz</a></li>
              <li>Toshkent, O‘zbekiston</li>
            </ul>
          </div>
          <div>
            <b className="text-[14px]">To‘lov usullari</b>
            <div className="mt-3 flex flex-col gap-2">
              <span className="inline-flex h-9 w-24 items-center justify-center rounded-lg bg-[#0066FF] px-2"><img src="/img/phone14/logo-click.png" alt="Click" className="h-4 object-contain" /></span>
              <span className="inline-flex h-9 w-24 items-center justify-center rounded-lg bg-[#00C2A8] px-2"><img src="/img/phone14/logo-payme.png" alt="Payme" className="h-5 object-contain" /></span>
            </div>
          </div>
        </div>
        <div className="border-t border-[#eef2f7]">
          <div className={`${wrap} flex flex-wrap items-center justify-between gap-3 py-4 text-[13px] text-[#64748b]`}>
            <p>© 2026 StomaHub. Barcha huquqlar himoyalangan.</p>
            <LandingLang />
          </div>
        </div>
      </footer>
    </div>
  );
}
