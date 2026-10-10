import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FlaskConical,
  MonitorPlay,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { site } from "@/data/site";

const features = [
  {
    icon: ShoppingBag,
    title: "Marketplace",
    text: "Material va jihozlarni bir joydan toping.",
    tone: "bg-[#e8f1ff] text-[#0066FF]",
  },
  {
    icon: MonitorPlay,
    title: "Seminarlar",
    text: "Yangi bilim — tez va qulay yoziling.",
    tone: "bg-[#e6faf6] text-[#00C2A8]",
  },
  {
    icon: FlaskConical,
    title: "Laboratoriya",
    text: "Buyurtmani yuboring, holatini kuzating.",
    tone: "bg-[#fff4e5] text-[#f59e0b]",
  },
  {
    icon: Users,
    title: "Community",
    text: "Hamkasblar bilan tajriba almashing.",
    tone: "bg-[#f3e8ff] text-[#9333ea]",
  },
  {
    icon: BriefcaseBusiness,
    title: "Ishlar",
    text: "Vakansiya yoki mutaxassis toping.",
    tone: "bg-[#ffe8ee] text-[#e11d48]",
  },
  {
    icon: Building2,
    title: "Klinika",
    text: "Klinika va marketingni bir joyda.",
    tone: "bg-[#e6f7fb] text-[#0891b2]",
  },
] as const;

const steps = [
  { n: "1", title: "Ro‘yxatdan o‘ting", text: "Google, Telegram yoki telefon bilan." },
  { n: "2", title: "Keraklisini tanlang", text: "Marketplace, seminar, lab va boshqalar." },
  { n: "3", title: "Ishni boshlang", text: "Buyurtma, yozilish yoki e’lon — bir bosishda." },
] as const;

const audiences = [
  "Klinikada ishlaydigan stomatologlar",
  "O‘z klinikasini boshqaruvchilar",
  "Yangi mutaxassislar va rezidentlar",
] as const;

const testimonials = [
  {
    quote: "Material izlash ancha osonlashdi. Hammasini bir joydan ko‘raman.",
    name: "Dr. Malika Karimova",
    role: "Terapevt stomatolog, Toshkent",
  },
  {
    quote: "Seminarlarga yozilish oddiy. Vaqtim tejala boshladi.",
    name: "Dr. Jasur Aliyev",
    role: "Ortoped, Samarqand",
  },
  {
    quote: "Laboratoriya buyurtmalarini telefon orqali emas, shu yerda kuzataman.",
    name: "Dr. Dilnoza Rahimova",
    role: "Klinika rahbari, Toshkent",
  },
] as const;

const stats = [
  { value: "1 platforma", label: "barcha ishlar uchun" },
  { value: "Tez kirish", label: "Google yoki Telegram" },
  { value: "Bepul start", label: "hoziroq boshlash mumkin" },
] as const;

export function LandingPage() {
  return (
    <div className="bg-[#F4F7FC] text-[#0f172a]">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[#e8eef4]/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6">
          <Link href="/landing" aria-label={site.name}>
            <Logo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/kirish"
              className="rounded-full px-4 py-2.5 text-[15px] font-semibold text-[#475569] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]"
            >
              Kirish
            </Link>
            <Link
              href="/royxat"
              className="rounded-full bg-[#0066FF] px-5 py-2.5 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(0,102,255,0.28)] transition hover:bg-[#0052cc]"
            >
              Ro‘yxatdan o‘tish
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-[#0066FF] shadow-sm ring-1 ring-[#e8eef4]">
            <span className="size-1.5 rounded-full bg-[#00C2A8]" />
            Stomatologlar uchun
          </p>
          <h1 className="font-[family-name:var(--font-outfit)] text-[2.15rem] font-bold leading-[1.15] tracking-tight sm:text-[3rem]">
            Sizning ishingiz —{" "}
            <span className="text-[#0066FF]">bir joyda</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-[#475569] sm:text-[18px]">
            {site.name} — material, seminar, laboratoriya va hamkasblar.
            Oddiy. Tushunarli. Stomatologlar uchun.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/royxat"
              className="inline-flex h-14 min-h-14 w-full max-w-xs items-center justify-center rounded-full bg-[#0066FF] px-8 text-[17px] font-bold text-white shadow-[0_10px_28px_rgba(0,102,255,0.3)] transition hover:bg-[#0052cc] sm:w-auto"
            >
              Ro‘yxatdan o‘tish
            </Link>
            <Link
              href="/kirish"
              className="inline-flex h-14 min-h-14 w-full max-w-xs items-center justify-center rounded-full bg-white px-8 text-[16px] font-semibold text-[#334155] ring-1 ring-[#e2e8f0] transition hover:bg-[#f8fafc] sm:w-auto"
            >
              Kirish
            </Link>
          </div>
          <p className="mt-6 text-[14px] text-[#64748b]">
            Bepul boshlash · Telefon shart emas · 1 daqiqada ochiladi
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#e8eef4] bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-[#e8eef4] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((s) => (
            <div key={s.value} className="px-6 py-8 text-center sm:py-10">
              <p className="font-[family-name:var(--font-outfit)] text-[1.35rem] font-bold text-[#0f172a] sm:text-[1.5rem]">
                {s.value}
              </p>
              <p className="mt-1 text-[15px] text-[#64748b]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-outfit)] text-[1.75rem] font-bold tracking-tight sm:text-[2rem]">
            Nima bor?
          </h2>
          <p className="mt-3 text-[16px] text-[#64748b]">
            Kundalik ishingiz uchun kerakli bo‘limlar
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[#e8eef4] bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
            >
              <span className={`grid size-12 place-items-center rounded-2xl ${f.tone}`}>
                <f.icon className="size-6" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 font-[family-name:var(--font-outfit)] text-[18px] font-bold">
                {f.title}
              </h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[#64748b]">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-[family-name:var(--font-outfit)] text-[1.75rem] font-bold tracking-tight sm:text-[2rem]">
              Qanday ishlaydi?
            </h2>
            <p className="mt-3 text-[16px] text-[#64748b]">Uch oddiy qadam</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl bg-[#F4F7FC] p-6 text-center sm:p-8">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#0066FF] font-[family-name:var(--font-outfit)] text-lg font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-outfit)] text-[18px] font-bold">
                  {s.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#0047b3] px-6 py-10 text-white sm:px-12 sm:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-[family-name:var(--font-outfit)] text-[1.75rem] font-bold tracking-tight sm:text-[2rem]">
                Kimlar uchun?
              </h2>
              <p className="mt-3 text-[16px] text-white/85">
                {site.tagline}. Har kuni klinikada ishlaydiganlar uchun.
              </p>
            </div>
            <ul className="space-y-3">
              {audiences.map((a) => (
                <li
                  key={a}
                  className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3.5 text-[15px] font-medium backdrop-blur"
                >
                  <CheckCircle2 className="size-5 shrink-0 text-[#00C2A8]" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Showcase strip */}
      <section className="pb-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#e8eef4] bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)] sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-outfit)] text-[1.35rem] font-bold sm:text-[1.5rem]">
                  Hammasi bitta ekranda
                </h2>
                <p className="mt-2 max-w-md text-[15px] text-[#64748b]">
                  Marketplace, seminarlar, laboratoriya va community — kerakligini tanlang.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Marketplace", "Seminar", "Lab", "Ishlar", "Community"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[#F4F7FC] px-4 py-2 text-[13px] font-semibold text-[#334155] ring-1 ring-[#e8eef4]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-outfit)] text-[1.75rem] font-bold tracking-tight sm:text-[2rem]">
            Shifokorlar nima deydi
          </h2>
          <p className="mt-3 text-[15px] text-[#64748b]">Mahsulot haqidagi fikrlar</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <blockquote
              key={t.name}
              className="flex flex-col rounded-2xl border border-[#e8eef4] bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
            >
              <p className="flex-1 text-[15px] leading-relaxed text-[#334155]">“{t.quote}”</p>
              <footer className="mt-5 border-t border-[#f1f5f9] pt-4">
                <p className="font-semibold text-[#0f172a]">{t.name}</p>
                <p className="mt-0.5 text-[13px] text-[#64748b]">{t.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="rounded-2xl border border-[#00C2A8]/25 bg-[#e6faf6] px-6 py-10 text-center sm:px-10">
          <p className="font-[family-name:var(--font-outfit)] text-[1.5rem] font-bold text-[#0f172a] sm:text-[1.75rem]">
            Bepul boshlang
          </p>
          <p className="mx-auto mt-2 max-w-md text-[16px] text-[#475569]">
            Kartasiz. Majburiyatsiz. Profilingizni ochib, darhol foydalaning.
          </p>
          <Link
            href="/royxat"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#00C2A8] px-8 text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(0,194,168,0.3)] transition hover:bg-[#00a890]"
          >
            Hoziroq ochish
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl bg-[#0f172a] px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <h2 className="font-[family-name:var(--font-outfit)] text-[1.75rem] font-bold tracking-tight sm:text-[2.15rem]">
            Bugun profilingizni oching
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[16px] text-white/70">
            {site.description}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/royxat"
              className="inline-flex h-14 min-h-14 w-full max-w-xs items-center justify-center rounded-full bg-[#0066FF] px-8 text-[17px] font-bold text-white transition hover:bg-[#3385ff] sm:w-auto"
            >
              Ro‘yxatdan o‘tish
            </Link>
            <Link
              href="/kirish"
              className="inline-flex h-14 min-h-14 w-full max-w-xs items-center justify-center rounded-full bg-white/10 px-8 text-[16px] font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15 sm:w-auto"
            >
              Kirish
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e8eef4] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="text-center sm:text-left">
            <Logo />
            <p className="mt-2 text-[13px] text-[#64748b]">{site.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-[15px] font-semibold">
            <Link href="/kirish" className="text-[#475569] hover:text-[#0066FF]">
              Kirish
            </Link>
            <Link href="/royxat" className="text-[#0066FF] hover:underline">
              Ro‘yxatdan o‘tish
            </Link>
          </div>
        </div>
        <nav aria-label="Huquqiy havolalar" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-[#f1f5f9] px-4 py-3 text-[13px] text-[#64748b]">
          <Link href="/maxfiylik" className="hover:text-[#0066FF] hover:underline">Maxfiylik siyosati</Link>
          <Link href="/shartlar" className="hover:text-[#0066FF] hover:underline">Foydalanish shartlari</Link>
          <Link href="/hisobni-ochirish" className="hover:text-[#0066FF] hover:underline">Hisobni o‘chirish</Link>
        </nav>
        <div className="border-t border-[#f1f5f9] py-4 text-center text-[12px] text-[#94a3b8]">
          © {2026} {site.name}
        </div>
      </footer>
    </div>
  );
}
