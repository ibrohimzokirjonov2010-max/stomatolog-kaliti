import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Home,
  Play,
  LayoutDashboard,
  Search,
  ShoppingBag,
  User,
  Users,
} from "lucide-react";
import { LandingFaq, LandingLang, LandingLogo, LandingSearch, LandingSocials, PayMarks, ToothBadge } from "@/components/landing/landing-bits";
import { appPoints, crmPoints, desktopNav, faqs, features, heroText, people, steps } from "@/components/landing/landing-content";

const wrap = "mx-auto w-[min(1320px,calc(100%-64px))]";
const title = "text-left font-[family-name:var(--font-outfit)] text-[clamp(32px,2.8vw,40px)] font-bold tracking-tight text-[#0f2744]";

const phoneCats = [
  { label: "Seminar", src: "/img/phone14/cat-seminar.png" },
  { label: "Market", src: "/img/phone14/cat-uskunalar.png" },
  { label: "Material", src: "/img/phone14/cat-materiallar.png" },
  { label: "Forma", src: "/img/phone14/cat-forma.png" },
] as const;

const phoneProducts = [
  { label: "Filtek", src: "/img/shop/m-filtek.jpg" },
  { label: "ProTaper", src: "/img/shop/m-protaper.jpg" },
  { label: "Implant", src: "/img/shop/m-timax.jpg" },
] as const;

const phoneTabs = [
  { label: "Bosh", icon: Home },
  { label: "Market", icon: ShoppingBag },
  { label: "CRM", icon: LayoutDashboard },
  { label: "Profil", icon: User },
] as const;

function PhoneShell({ children, className = "", width = "w-[300px]", height = "h-[540px]" }: { children: ReactNode; className?: string; width?: string; height?: string }) {
  return (
    <div className={`${width} overflow-hidden rounded-[28px] border-[6px] border-[#0f172a] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] ${className}`}>
      <div className={`relative flex flex-col overflow-hidden rounded-[22px] bg-[#f4f7fb] ${height}`}>
        <span className="absolute left-1/2 top-1.5 z-10 h-3 w-14 -translate-x-1/2 rounded-full bg-[#0f172a]" />
        <div className="flex h-full min-h-0 flex-col px-2 pt-5">{children}</div>
      </div>
    </div>
  );
}

function PhoneTabs() {
  return (
    <div className="mt-auto grid grid-cols-4 border-t border-[#e6ebf3] bg-white px-0.5 py-1.5">
      {phoneTabs.map((tab, index) => (
        <div key={tab.label} className={`text-center ${index === 0 ? "text-[#0066FF]" : "text-[#94a3b8]"}`}>
          <tab.icon className="mx-auto size-4" />
          <span className="mt-0.5 block text-[12px] font-semibold leading-none">{tab.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HomePhone({ width, height, className = "", variant = "full" }: { width?: string; height?: string; className?: string; variant?: "full" | "compact" }) {
  if (variant === "compact") {
    return (
      <PhoneShell width={width} height={height} className={className}>
        <div className="flex h-full flex-col">
          <b className="text-[13px] text-[#16324f]">Stoma<span className="text-[#0066FF]">Hub</span></b>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {phoneCats.map((cat) => (
              <div key={cat.label} className="text-center">
                <span className="mx-auto grid size-8 place-items-center overflow-hidden rounded-lg bg-white shadow-sm">
                  <img src={cat.src} alt="" className="size-7 object-contain" />
                </span>
                <span className="mt-1 block truncate text-[12px] font-semibold text-[#334155]">{cat.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-xl bg-[#0066FF] px-2 py-2 text-[12px] font-bold leading-tight text-white">
            Stomatologlar uchun yagona platforma
          </div>
        </div>
      </PhoneShell>
    );
  }
  return (
    <PhoneShell width={width} height={height} className={className}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between">
          <b className="text-[13px] text-[#16324f]">Stoma<span className="text-[#0066FF]">Hub</span></b>
          <img src="/images/avatar-azizbek.png" alt="" className="size-6 rounded-full object-cover" />
        </div>
        <div className="mt-2 flex h-8 items-center gap-1 rounded-full bg-white px-2 text-[12px] text-[#94a3b8] ring-1 ring-[#e6ebf3]">
          <Search className="size-3.5 shrink-0" />
          Qidiruv
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {phoneCats.map((cat) => (
            <div key={cat.label} className="rounded-xl bg-white px-0.5 py-1.5 text-center shadow-sm">
              <span className="mx-auto grid size-8 place-items-center overflow-hidden rounded-lg bg-[#f4f7fb]">
                <img src={cat.src} alt="" className="size-7 object-contain" />
              </span>
              <span className="mt-1 block truncate text-[12px] font-semibold text-[#334155]">{cat.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-xl bg-[#0066FF] px-2.5 py-2 text-[12px] font-bold leading-snug text-white">
          Stomatologlar uchun yagona platforma
        </div>
        <p className="mt-2 text-[12px] font-bold text-[#16324f]">Ommabop kategoriyalar</p>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {phoneProducts.map((item) => (
            <div key={item.label} className="overflow-hidden rounded-lg bg-white shadow-sm">
              <img src={item.src} alt="" className="h-12 w-full object-cover" />
              <p className="truncate px-1 py-1 text-[12px] font-semibold text-[#16324f]">{item.label}</p>
            </div>
          ))}
        </div>
        <PhoneTabs />
      </div>
    </PhoneShell>
  );
}

export function ProfilePhone({ width, height, className = "" }: { width?: string; height?: string; className?: string }) {
  return (
    <PhoneShell width={width} height={height} className={className}>
      <div className="flex h-full min-h-0 flex-col">
        <p className="text-center text-[12px] font-extrabold text-[#16324f]">Profil</p>
        <img src="/images/avatar-azizbek.png" alt="" className="mx-auto mt-2 size-12 rounded-full object-cover" />
        <p className="mt-1 text-center text-[13px] font-bold leading-tight text-[#16324f]">Dr. Azizbek</p>
        <p className="text-center text-[12px] text-[#64748b]">Stomatolog</p>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {[["12", "Kurs"], ["4", "Buyurtma"]].map(([value, label]) => (
            <div key={label} className="rounded-lg bg-white py-1 text-center shadow-sm">
              <b className="block text-[13px] text-[#0066FF]">{value}</b>
              <span className="block text-[12px] text-[#64748b]">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-1">
          {["Kurslarim", "Buyurtmalar", "Uchrashuvlar", "Sozlamalar"].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-white px-1.5 py-1.5 text-[12px] font-semibold text-[#16324f] shadow-sm">
              <span className="truncate">{label}</span>
              <ChevronRight className="size-3 shrink-0 text-[#94a3b8]" />
            </div>
          ))}
        </div>
        <PhoneTabs />
      </div>
    </PhoneShell>
  );
}

export function CrmMock({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#e6ebf3] bg-white shadow-[0_22px_50px_rgba(15,23,42,0.1)]">
      <div className={compact ? "grid grid-cols-[104px_minmax(0,1fr)]" : "grid grid-cols-[168px_minmax(0,1fr)]"}>
        <aside className="border-r border-[#eef2f7] bg-[#f8fafc] p-3">
          <p className="px-2 text-[13px] font-extrabold tracking-tight text-[#16324f]">Stoma<span className="text-[#0066FF]">Hub</span></p>
          <nav className="mt-3 space-y-1 text-[12px] font-semibold text-[#52637a]">
            {["Bosh sahifa", "Bemorlar", "Uchrashuvlar", "To‘lovlar", "Ombor", "Hisobotlar"].map((item, index) => (
              <p key={item} className={index === 0 ? "rounded-lg bg-[#e8f1ff] px-2 py-2 text-[#0066FF]" : "px-2 py-2"}>{item}</p>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 p-3.5">
          <p className="text-[15px] font-extrabold text-[#16324f]">Bosh sahifa</p>
          <div className={compact ? "mt-2.5 grid grid-cols-2 gap-2" : "mt-2.5 grid grid-cols-3 gap-2"}>
            {(compact
              ? [["Bemorlar", "0"], ["Qabul", "0"], ["Daromad", "0"], ["Qarz", "0"]]
              : [["Bemorlar", "0"], ["Bugungi qabul", "0"], ["Daromad", "0"]]
            ).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#f4f8ff] px-2.5 py-2.5">
                <p className="text-[12px] text-[#64748b]">{label}</p>
                <p className="text-[16px] font-extrabold leading-tight text-[#16324f]">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 overflow-hidden rounded-xl border border-[#eef2f7]">
            <div className="grid grid-cols-[58px_1fr_1fr] bg-[#f8fafc] px-2.5 py-2 text-[12px] font-bold text-[#64748b]">
              <span>Vaqt</span><span>Bemor</span><span>Xizmat</span>
            </div>
            <p className="border-t border-[#f1f5f9] px-2.5 py-3 text-[12px] text-[#64748b]">Hozircha uchrashuv yo‘q</p>
          </div>
          <div className={compact ? "mt-2.5 grid gap-2" : "mt-2.5 grid grid-cols-[minmax(0,1fr)_148px] gap-2"}>
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-[#64748b]">Bemorlar</p>
              <p className="rounded-lg bg-[#f7f9fc] px-2 py-3 text-[12px] text-[#64748b]">Hozircha bemor yo‘q</p>
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-[#64748b]">Tahlil</p>
              <p className="flex h-[96px] items-center rounded-xl bg-[#f7f9fc] px-2 text-[12px] text-[#64748b]">Hozircha tahlil yo‘q</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingDesktop() {
  return (
    <div className="bg-[#f7f9fc] text-[#16324f]" data-testid="desktop-landing">
      <header data-section="header" data-landing-header className="sticky top-0 z-40 border-b border-[#e8eef6] bg-white/95 backdrop-blur">
        <div className={`${wrap} flex h-[84px] items-center gap-3`}>
          <Link href="/landing" aria-label="StomaHub" className="shrink-0">
            <LandingLogo size="lg" />
          </Link>
          <nav aria-label="Asosiy" className="flex min-w-0 flex-1 items-center justify-center gap-0.5">
            {desktopNav.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full px-2 py-2 text-[14px] font-semibold text-[#334155] transition hover:bg-[#f4f7fb] hover:text-[#0066FF] xl:px-2.5 xl:text-[15px]">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <LandingSearch />
            <Link href="/kirish" className="inline-flex h-12 items-center rounded-full border border-[#0066FF] px-4 text-[14px] font-bold text-[#0066FF] transition hover:bg-[#f3f8ff] xl:px-5 xl:text-[15px]">
              Kirish
            </Link>
            <Link href="/royxat" className="inline-flex h-12 items-center rounded-full bg-[#0066FF] px-4 text-[14px] font-bold text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)] transition hover:bg-[#0052cc] xl:px-5 xl:text-[15px]">
              Ro‘yxatdan o‘tish
            </Link>
          </div>
        </div>
      </header>

      <section data-section="hero" className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[58%] overflow-hidden">
          <img src="/img/landing/hero-dentist.jpg" alt="" className="h-full w-full object-cover object-[28%_16%]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#f7f9fc_0%,rgba(247,249,252,0.72)_16%,rgba(247,249,252,0.08)_42%,rgba(247,249,252,0)_68%)]" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#f7f9fc] to-transparent" />
        </div>
        <div className={`${wrap} relative grid items-center gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px]`}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[14px] font-semibold text-[#0066FF] shadow-sm ring-1 ring-[#e6ebf3]">
              <span className="size-1.5 rounded-full bg-[#00C2A8]" />
              Stomatologlar uchun yagona platforma
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-outfit)] text-[clamp(48px,4.7vw,72px)] font-bold leading-[1.05] tracking-tight text-[#0f2744]">
              Stomatologlar uchun
              <span className="block text-[#0066FF]">yagona platforma</span>
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#52637a]">{heroText}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/royxat" className="inline-flex h-14 items-center gap-2.5 rounded-xl bg-[#0066FF] px-7 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(0,102,255,0.28)] transition hover:bg-[#0052cc]">
                Bepul ro‘yxatdan o‘tish
                <ArrowRight className="size-5" />
              </Link>
              <Link href="/marketplace" className="inline-flex h-14 items-center gap-3 rounded-xl border border-[#d7e2f0] bg-white pr-7 pl-4 text-[16px] font-bold text-[#16324f] transition hover:border-[#0066FF] hover:text-[#0066FF]">
                <span className="grid size-8 place-items-center rounded-full bg-[#0066FF] text-white"><Play className="size-3.5 translate-x-px fill-current" /></span>
                Marketplace’ni ko‘rish
              </Link>
            </div>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-[15px] font-semibold text-[#334155]">
              <li className="inline-flex items-center gap-2"><span className="grid size-10 place-items-center rounded-full bg-[#e8f1ff] text-[#0066FF]"><LayoutDashboard className="size-5" /></span>Barcha imkoniyatlar bir joyda</li>
              <li className="inline-flex items-center gap-2"><span className="grid size-10 place-items-center rounded-full bg-[#e6faf6] text-[#00A896]"><Building2 className="size-5" /></span>O‘zbekiston bozori uchun mos</li>
              <li className="inline-flex items-center gap-2"><span className="grid size-10 place-items-center rounded-full bg-[#fff4e5] text-[#d97706]"><Users className="size-5" /></span>Stomatologlar hamjamiyati</li>
            </ul>
          </div>
          <div className="relative justify-self-end pb-2">
            <ToothBadge className="absolute -left-8 top-10 size-[72px]" />
            <HomePhone width="w-[300px]" height="h-[540px]" />
          </div>
        </div>
      </section>

      <section data-section="features" className={`${wrap} py-12`}>
        <h2 className={title}>Nimalar bor?</h2>
        <p className="mt-2 max-w-xl text-[16px] text-[#52637a]">Stomatologlar uchun kerakli barcha imkoniyatlar bir joyda</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((item) => (
            <Link key={item.href} href={item.href} className="flex min-h-[176px] flex-col items-start gap-4 rounded-[18px] border border-[#e8eef6] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#cfe0ff] hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#eaf6f5] text-[#0b8f8a]">
                <item.icon className="size-7" strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <h3 className="font-[family-name:var(--font-outfit)] text-[17px] font-bold leading-tight">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-[#52637a]">{item.text}</p>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section data-section="audiences" className="bg-white py-12">
        <div className={wrap}>
          <h2 className={title}>Kimlar uchun?</h2>
          <p className="mt-2 text-[16px] text-[#52637a]">Platforma klinikadagi har bir rol uchun</p>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {people.map((person) => (
              <Link key={person.title} href={person.href} className={`group rounded-[22px] border p-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 ${person.selected ? "border-[#0066FF] bg-[#e8f1ff]" : "border-[#e8eef6] bg-white"}`}>
                <span className="relative block h-[180px] overflow-hidden rounded-2xl bg-[#dbe7f5]">
                  <img src={person.image} alt="" className="absolute inset-x-0 top-0 h-[155%] w-full object-cover object-top" />
                </span>
                <span className="mt-3 flex items-start justify-between gap-2 px-1 pb-1">
                  <span>
                    <b className="block text-[16px]">{person.title}</b>
                    <span className="mt-0.5 block text-[14px] leading-snug text-[#52637a]">{person.text}</span>
                  </span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#0066FF] ring-1 ring-[#e6ebf3] group-hover:bg-[#0066FF] group-hover:text-white">
                    <ArrowRight className="size-4" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section data-section="crm" className="relative overflow-hidden py-12">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[48%]">
          <img src="/img/landing/hero-dentist.jpg" alt="" className="h-full w-full object-cover object-[72%_center]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#f7f9fc_0%,rgba(247,249,252,0.78)_24%,rgba(247,249,252,0.28)_78%)]" />
        </div>
        <div className={`${wrap} relative grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]`}>
          <div>
            <h2 className={title}>Klinika CRM</h2>
            <p className="mt-4 inline-flex rounded-full bg-[#e8f1ff] px-3.5 py-1.5 text-[13px] font-bold text-[#0066FF]">Klinika CRM</p>
            <p className="mt-4 font-[family-name:var(--font-outfit)] text-[26px] font-bold leading-tight">Klinikangizni to‘liq nazorat qiling</p>
            <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-[#52637a]">
              Bemorlar, uchrashuvlar, davolash rejalari, to‘lovlar va hisobotlar — barchasi bir joyda. Klinika jarayonlarini soddalashtiring va samaradorlikni oshiring.
            </p>
            <ul className="mt-6 space-y-3">
              {crmPoints.map((point) => (
                <li key={point} className="flex items-center gap-3 text-[16px] font-medium">
                  <span className="grid size-7 place-items-center rounded-full bg-[#e6faf6] text-[#00A896]"><Check className="size-4" /></span>
                  {point}
                </li>
              ))}
            </ul>
            <Link href="/crm" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#0066FF] px-6 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(0,102,255,0.25)] transition hover:bg-[#0052cc]">
              CRM imkoniyatlarini ko‘rish <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="w-full max-w-[640px] justify-self-end">
            <CrmMock />
          </div>
        </div>
      </section>

      <section data-section="steps" className="bg-white py-12">
        <div className={wrap}>
          <h2 className={title}>Qanday ishlaydi?</h2>
          <p className="mt-2 text-[16px] text-[#52637a]">StomaHub’da boshlash juda oson</p>
          <ol className="mt-6 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {steps.map((step, index) => (
              <li key={step.n} className="contents">
                <div className="rounded-[24px] border border-[#e8eef6] bg-[#f7f9fc] px-6 py-6 text-center">
                  <span className="inline-grid size-14 place-items-center rounded-full bg-[#0066FF] font-[family-name:var(--font-outfit)] text-[20px] font-bold text-white">{step.n}</span>
                  <h3 className="mt-5 text-[18px] font-bold">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#52637a]">{step.text}</p>
                </div>
                {index < steps.length - 1 ? <ChevronRight className="mx-auto hidden size-8 self-center text-[#94a3b8] lg:block" aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section data-section="app" id="ilova" className="py-12">
        <div className={`${wrap} grid items-center gap-6 lg:grid-cols-[minmax(0,0.85fr)_auto_minmax(0,0.8fr)]`}>
          <div>
            <h2 className={title}>Har doim yoningizda</h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[#52637a]">
              StomaHub mobil ilovasi bilan barcha imkoniyatlar telefoningizda. Istalgan vaqtda, istalgan joyda.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/" className="inline-flex h-14 items-center gap-2 rounded-xl bg-[#0f172a] px-4 text-white">
                <span className="text-[20px] leading-none"></span>
                <span className="text-left leading-tight"><span className="block text-[12px] opacity-80">App Store’dan</span><span className="block text-[15px] font-bold">yuklab oling</span></span>
              </a>
              <a href="/" className="inline-flex h-14 items-center gap-2 rounded-xl bg-[#0f172a] px-4 text-white">
                <span className="text-[16px] leading-none">▶</span>
                <span className="text-left leading-tight"><span className="block text-[12px] opacity-80">Google Play’dan</span><span className="block text-[15px] font-bold">yuklab oling</span></span>
              </a>
            </div>
          </div>
          <div className="rounded-[32px] bg-[#e7f0ff] px-5 py-6">
            <div className="flex items-end justify-center gap-4">
              <HomePhone width="w-[230px]" height="h-[460px]" />
              <ProfilePhone width="w-[210px]" height="h-[420px]" className="mb-4" />
            </div>
          </div>
          <ul className="space-y-3">
            {appPoints.map((point) => (
              <li key={point} className="flex items-center gap-3 rounded-2xl border border-[#e8eef6] bg-white px-4 py-3.5 text-[16px] font-semibold shadow-sm">
                <span className="grid size-8 place-items-center rounded-full bg-[#e6faf6] text-[#00A896]"><Check className="size-4" /></span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-section="faq" id="savollar" className="bg-white py-12">
        <div className={wrap}>
          <h2 className={title}>Ko‘p so‘raladigan savollar</h2>
          <div className="mt-6">
            <LandingFaq items={faqs.map((item) => ({ q: item.q, a: item.a }))} />
          </div>
        </div>
      </section>

      <section data-section="cta" className={`${wrap} py-6`}>
        <div className="flex flex-wrap items-center gap-6 rounded-[28px] border border-[#d6e6ff] bg-gradient-to-r from-[#e9f2ff] via-[#f2f8ff] to-[#e9f2ff] px-8 py-8 shadow-[0_16px_40px_rgba(0,102,255,0.08)] lg:px-10">
          <ToothBadge className="size-20 shrink-0" />
          <div className="min-w-[260px] flex-1">
            <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(26px,2.2vw,36px)] font-bold tracking-tight text-[#0f2744]">Stomatologlar hamjamiyatiga qo‘shiling</h2>
            <p className="mt-2 max-w-2xl text-[16px] text-[#52637a]">Kasbiy o‘sish, yangi imkoniyatlar va ishonchli hamkorlar — barchasi StomaHub’da.</p>
          </div>
          <Link href="/royxat" className="inline-flex h-14 shrink-0 items-center gap-2.5 rounded-xl bg-[#0066FF] px-7 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(0,102,255,0.28)] transition hover:bg-[#0052cc]">
            Bepul ro‘yxatdan o‘tish
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      <footer data-section="footer" className="mt-6 border-t border-[#e8eef6] bg-white">
        <div className={`${wrap} grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-6`}>
          <div className="lg:col-span-1">
            <LandingLogo />
            <div className="mt-4">
              <LandingSocials names={["telegram", "instagram", "facebook", "youtube"]} />
            </div>
          </div>
          <div>
            <b className="text-[15px]">Platforma</b>
            <ul className="mt-3 space-y-2 text-[15px] text-[#52637a]">
              <li><Link href="/marketplace" className="hover:text-[#0066FF]">Marketplace</Link></li>
              <li><Link href="/talim" className="hover:text-[#0066FF]">Ta’lim</Link></li>
              <li><Link href="/seminarlar" className="hover:text-[#0066FF]">Seminarlar</Link></li>
              <li><Link href="/kitoblar" className="hover:text-[#0066FF]">Kitoblar</Link></li>
            </ul>
          </div>
          <div>
            <b className="text-[15px]">Klinika CRM</b>
            <ul className="mt-3 space-y-2 text-[15px] text-[#52637a]">
              <li><Link href="/crm" className="hover:text-[#0066FF]">Klinika CRM</Link></li>
              <li><Link href="/ustalar" className="hover:text-[#0066FF]">Ustalar laboratoriyalari</Link></li>
              <li><Link href="/mutaxassislar" className="hover:text-[#0066FF]">Konsultatsiyalar</Link></li>
              <li><Link href="/elonlar" className="hover:text-[#0066FF]">E’lonlar</Link></li>
            </ul>
          </div>
          <div>
            <b className="text-[15px]">Yordam</b>
            <ul className="mt-3 space-y-2 text-[15px] text-[#52637a]">
              <li><a href="#savollar" className="hover:text-[#0066FF]">Ko‘p so‘raladigan savollar</a></li>
              <li><a href="#aloqa" className="hover:text-[#0066FF]">Yordam markazi</a></li>
              <li><Link href="/maxfiylik" className="hover:text-[#0066FF]">Maxfiylik siyosati</Link></li>
              <li><Link href="/shartlar" className="hover:text-[#0066FF]">Foydalanish shartlari</Link></li>
            </ul>
          </div>
          <div id="aloqa">
            <b className="text-[15px]">Aloqa</b>
            <ul className="mt-3 space-y-2 text-[15px] text-[#52637a]">
              <li><a href="tel:+998901234567" className="hover:text-[#0066FF]">+998 90 123 45 67</a></li>
              <li><a href="mailto:info@stomahub.uz" className="hover:text-[#0066FF]">info@stomahub.uz</a></li>
              <li>Toshkent, O‘zbekiston</li>
            </ul>
          </div>
          <div>
            <b className="text-[15px]">To‘lov usullari</b>
            <div className="mt-3">
              <PayMarks />
            </div>
          </div>
        </div>
        <div className="border-t border-[#eef2f7]">
          <div className={`${wrap} flex flex-wrap items-center justify-between gap-3 py-4 text-[14px] text-[#64748b]`}>
            <p>© 2026 StomaHub. Barcha huquqlar himoyalangan.</p>
            <LandingLang />
          </div>
        </div>
      </footer>
    </div>
  );
}
