import Link from "next/link";
import { ArrowDown, Check, ChevronRight, Globe, LayoutDashboard, Mail, MapPin, Phone, Send, ShieldCheck, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { LandingFaq, LandingLang, LandingMenu, LandingSocials } from "@/components/landing/landing-bits";
import { appPoints, contacts, crmPoints, faqs, features, helpLinks, heroText, heroTitle, people, platformLinks, steps } from "@/components/landing/landing-content";
import { CrmMock, HomePhone, ProfilePhone } from "@/components/landing/landing-desktop";
import { NotificationBell } from "@/components/notification-bell";

const highlights = [
  { title: "Barcha imkoniyatlar bir joyda", icon: LayoutDashboard, tone: "bg-[#e8f1ff] text-[#0066FF]" },
  { title: "O‘zbekiston uchun mos", icon: Globe, tone: "bg-[#e6faf6] text-[#00A896]" },
  { title: "Stomatologlar hamjamiyati", icon: Users, tone: "bg-[#fff4e5] text-[#d97706]" },
  { title: "Ishonchli va qulay platforma", icon: ShieldCheck, tone: "bg-[#eef2ff] text-[#4f46e5]" },
] as const;

const contactIcon = {
  Email: Mail,
  Telegram: Send,
  Telefon: Phone,
  Manzil: MapPin,
} as const;

function StoreBadges() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <a href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0f172a] px-3 text-white">
        <span className="text-[18px] leading-none" aria-hidden="true"></span>
        <span className="text-left leading-tight"><span className="block text-[12px] opacity-80">App Store’dan</span><span className="block text-[13px] font-bold">yuklab oling</span></span>
      </a>
      <a href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0f172a] px-3 text-white">
        <span className="text-[16px] leading-none" aria-hidden="true">▶</span>
        <span className="text-left leading-tight"><span className="block text-[12px] opacity-80">Google Play’dan</span><span className="block text-[13px] font-bold">yuklab oling</span></span>
      </a>
    </div>
  );
}

export function LandingMobile() {
  return (
    <div className="overflow-x-clip bg-[#f7f9fc] pb-[calc(96px+env(safe-area-inset-bottom))] text-[#16324f]" data-testid="mobile-landing">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-white/95 px-3 backdrop-blur">
        <Link href="/landing" aria-label="StomaHub" className="min-w-0">
          <Logo />
        </Link>
        <div className="flex items-center">
          <NotificationBell variant="mobile" />
          <LandingMenu />
        </div>
      </header>

      <section className="px-4 pt-5">
        <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0066FF] ring-1 ring-[#e6ebf3]">
          <span className="size-1.5 rounded-full bg-[#00C2A8]" />
          Stomatologlar uchun yagona platforma
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-outfit)] text-[clamp(28px,8vw,34px)] font-bold leading-[1.15] tracking-tight">{heroTitle}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#52637a]">{heroText}</p>
        <div className="relative mt-5 overflow-hidden rounded-[24px]">
          <img src="/img/landing/hero-dentist.jpg" alt="Stomatolog shifokor klinika fonida" className="h-[320px] w-full object-cover object-[center_18%]" />
          <div className="absolute bottom-3 right-3">
            <HomePhone width="w-[150px]" height="h-[248px]" />
          </div>
        </div>
        <Link href="/royxat" className="mt-4 flex h-12 items-center justify-center rounded-full bg-[#0066FF] text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(0,102,255,0.28)]">
          Bepul ro‘yxatdan o‘tish
        </Link>
        <Link href="/marketplace" className="mt-3 flex h-12 items-center justify-center rounded-full border border-[#d7e2f0] bg-white text-[15px] font-bold text-[#16324f]">
          Marketplace’ni ko‘rish
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 px-4 py-6">
        {highlights.map((item) => (
          <div key={item.title} className="flex min-h-[88px] items-start gap-2 rounded-2xl border border-[#e8eef6] bg-white p-3">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.tone}`}>
              <item.icon className="size-5" />
            </span>
            <span className="pt-1 text-[13px] font-semibold leading-snug">{item.title}</span>
          </div>
        ))}
      </section>

      <section className="px-4 pb-8">
        <h2 className="text-center font-[family-name:var(--font-outfit)] text-[24px] font-bold">Nimalar bor?</h2>
        <p className="mx-auto mt-2 max-w-xs text-center text-[14px] leading-relaxed text-[#52637a]">Stomatologlar uchun kerakli barcha imkoniyatlar bir joyda</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {features.map((item) => (
            <Link key={item.href} href={item.href} className="min-h-[148px] rounded-2xl border border-[#e8eef6] bg-white p-3 shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
              <span className={`grid size-11 place-items-center rounded-xl ${item.tone}`}>
                <item.icon className="size-5" />
              </span>
              <b className="mt-3 block text-[14px] leading-tight">{item.title}</b>
              <span className="mt-1 block text-[12px] leading-snug text-[#52637a]">{item.text}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-8">
        <h2 className="text-center font-[family-name:var(--font-outfit)] text-[24px] font-bold">Kimlar uchun?</h2>
        <p className="mx-auto mt-2 max-w-sm text-center text-[14px] leading-relaxed text-[#52637a]">StomaHub barcha stomatologiya sohasidagi mutaxassislar uchun</p>
        <div className="mt-4 flex flex-col gap-3">
          {people.map((person) => (
            <Link key={person.title} href={person.href} className={`flex min-h-11 items-center gap-3 rounded-2xl border bg-white p-2 ${person.selected ? "border-[#0066FF] ring-2 ring-[#0066FF]/25" : "border-[#e8eef6]"}`}>
              <img src={person.image} alt="" className="size-14 shrink-0 rounded-xl object-cover object-top" />
              <span className="min-w-0 flex-1">
                <b className="block text-[15px]">{person.title}</b>
                <span className="block text-[13px] text-[#52637a]">{person.text}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-[#94a3b8]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 py-8">
        <p className="inline-flex rounded-full bg-[#e8f1ff] px-3 py-1 text-[12px] font-bold text-[#0066FF]">Klinika CRM</p>
        <h2 className="mt-3 font-[family-name:var(--font-outfit)] text-[24px] font-bold leading-tight">Klinikangizni to‘liq nazorat qiling</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#52637a]">Bemorlar, uchrashuvlar, davolash rejalari, to‘lovlar va hisobotlar — barchasi bir joyda.</p>
        <ul className="mt-4 space-y-2">
          {crmPoints.map((point) => (
            <li key={point} className="flex min-h-11 items-center gap-3 text-[14px] font-medium">
              <span className="grid size-7 place-items-center rounded-full bg-[#e6faf6] text-[#00A896]"><Check className="size-4" /></span>
              {point}
            </li>
          ))}
        </ul>
        <Link href="/crm" className="mt-4 flex h-12 items-center justify-center rounded-full bg-[#0066FF] text-[15px] font-bold text-white">
          CRM imkoniyatlarini ko‘rish
        </Link>
        <div className="mt-5">
          <CrmMock compact />
        </div>
      </section>

      <section className="bg-white px-4 py-8">
        <h2 className="text-center font-[family-name:var(--font-outfit)] text-[24px] font-bold">Qanday ishlaydi?</h2>
        <p className="mt-2 text-center text-[14px] text-[#52637a]">StomaHub’da boshlash juda oson</p>
        <ol className="mt-5 flex flex-col items-stretch gap-2">
          {steps.map((step, index) => (
            <li key={step.n} className="flex flex-col items-center">
              <div className="w-full rounded-2xl border border-[#e8eef6] bg-[#f7f9fc] px-4 py-5 text-center">
                <span className="inline-grid size-11 place-items-center rounded-full bg-[#0066FF] text-[16px] font-bold text-white">{step.n}</span>
                <h3 className="mt-3 text-[16px] font-bold">{step.title}</h3>
                <p className="mt-1 text-[14px] text-[#52637a]">{step.text}</p>
              </div>
              {index < steps.length - 1 ? <ArrowDown className="my-1 size-5 text-[#94a3b8]" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>
      </section>

      <section id="ilova" className="px-4 py-8">
        <h2 className="font-[family-name:var(--font-outfit)] text-[24px] font-bold">Har doim yoningizda</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#52637a]">StomaHub mobil ilovasi bilan barcha imkoniyatlar telefoningizda. Istalgan vaqtda, istalgan joyda.</p>
        <div className="mt-5 flex items-end justify-center gap-3">
          <HomePhone width="w-[148px]" height="h-[250px]" />
          <ProfilePhone width="w-[148px]" height="h-[250px]" className="mt-6" />
        </div>
        <ul className="mt-5 space-y-2">
          {appPoints.map((point) => (
            <li key={point} className="flex min-h-11 items-center gap-3 rounded-2xl border border-[#e8eef6] bg-white px-3 text-[14px] font-semibold">
              <span className="grid size-7 place-items-center rounded-full bg-[#e6faf6] text-[#00A896]"><Check className="size-4" /></span>
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <StoreBadges />
        </div>
      </section>

      <section id="savollar" className="bg-white px-4 py-8">
        <h2 className="text-center font-[family-name:var(--font-outfit)] text-[24px] font-bold">Ko‘p so‘raladigan savollar</h2>
        <div className="mt-4">
          <LandingFaq items={faqs.map((item) => ({ q: item.q, a: item.a }))} columns={1} />
        </div>
      </section>

      <section className="px-4 py-6">
        <div className="relative overflow-hidden rounded-[24px] px-5 py-8 text-white">
          <img src="/img/landing/hero-dentist.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[#0066FF]/75" />
          <div className="relative">
            <h2 className="font-[family-name:var(--font-outfit)] text-[24px] font-bold leading-tight">Stomatologlar hamjamiyatiga qo‘shiling</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-white/95">Birgalikda o‘sish, yangi imkoniyatlar va ishonchli hamkorlar.</p>
            <Link href="/royxat" className="mt-4 flex h-12 items-center justify-center rounded-full bg-white text-[15px] font-bold text-[#0066FF]">
              Bepul ro‘yxatdan o‘tish
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8">
        <h2 className="font-[family-name:var(--font-outfit)] text-[22px] font-bold">StomaHub hamjamiyati</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#52637a]">Stomatologlar, talabalar va mutaxassislar birga o‘smoqda.</p>
        <div className="mt-4 flex items-center">
          {people.map((person) => (
            <img key={person.title} src={person.image} alt="" className="-ml-2 size-11 rounded-full object-cover ring-2 ring-white first:ml-0" />
          ))}
        </div>
        <Link href="/community" className="mt-4 flex min-h-11 items-center justify-between rounded-2xl bg-white px-4 text-[14px] font-semibold ring-1 ring-[#e8eef6]">
          Hamjamiyatni ochish
          <ChevronRight className="size-5 text-[#0066FF]" />
        </Link>
      </section>

      <section id="aloqa" className="bg-white px-4 py-8">
        <h2 className="font-[family-name:var(--font-outfit)] text-[22px] font-bold">Biz bilan bog‘laning</h2>
        <p className="mt-2 text-[14px] text-[#52637a]">Savol, taklif yoki hamkorlik uchun biz bilan bog‘laning.</p>
        <div className="mt-4 flex flex-col gap-2">
          {contacts.map((item) => {
            const Icon = contactIcon[item.label];
            return (
              <a key={item.label} href={item.href} className="flex min-h-11 items-center gap-3 rounded-2xl border border-[#e8eef6] px-3 py-2">
                <span className="grid size-11 place-items-center rounded-xl bg-[#e8f1ff] text-[#0066FF]"><Icon className="size-5" /></span>
                <span>
                  <span className="block text-[12px] text-[#64748b]">{item.label}</span>
                  <span className="block text-[14px] font-semibold">{item.value}</span>
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-[#e8eef6] bg-white px-4 py-8">
        <Logo />
        <p className="mt-3 text-[14px] font-semibold">Stomatologlar uchun yagona platforma</p>
        <p className="mt-1 text-[13px] leading-relaxed text-[#52637a]">Stomatologiya sohasini rivojlantirish uchun zamonaviy raqamli ekosistema.</p>
        <div className="mt-4">
          <LandingSocials names={["telegram", "instagram", "youtube", "tiktok"]} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <b className="text-[14px]">Platforma</b>
            <ul className="mt-2 space-y-1">
              {platformLinks.map((item) => (
                <li key={item.href}><Link href={item.href} className="inline-flex min-h-11 items-center text-[14px] text-[#52637a]">{item.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <b className="text-[14px]">Yordam</b>
            <ul className="mt-2 space-y-1">
              {helpLinks.map((item) => (
                <li key={item.href}>
                  {item.href.startsWith("#") ? (
                    <a href={item.href} className="inline-flex min-h-11 items-center text-[14px] text-[#52637a]">{item.label}</a>
                  ) : (
                    <Link href={item.href} className="inline-flex min-h-11 items-center text-[14px] text-[#52637a]">{item.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <b className="mt-4 block text-[14px]">To‘lov usullari</b>
        <div className="mt-2 flex gap-2">
          <span className="inline-flex h-11 w-24 items-center justify-center rounded-lg bg-[#0066FF]"><img src="/img/phone14/logo-click.png" alt="Click" className="h-4 object-contain" /></span>
          <span className="inline-flex h-11 w-24 items-center justify-center rounded-lg bg-[#00C2A8]"><img src="/img/phone14/logo-payme.png" alt="Payme" className="h-5 object-contain" /></span>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f7] pt-4">
          <p className="text-[12px] text-[#64748b]">© 2026 StomaHub. Barcha huquqlar himoyalangan.</p>
          <LandingLang />
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8eef6] bg-white px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        <Link href="/royxat" className="flex h-12 items-center justify-center rounded-full bg-[#0066FF] text-[15px] font-bold text-white">
          Bepul ro‘yxatdan o‘tish
        </Link>
      </div>
    </div>
  );
}
