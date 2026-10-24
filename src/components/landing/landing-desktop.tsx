import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Globe,
  Home,
  LayoutDashboard,
  Mail,
  MapPin,
  Package,
  Phone,
  Play,
  Search,
  Settings,
  ShoppingBag,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { LandingFaq, LandingLang, LandingLogo, LandingSearch, LandingSocials, toothOutline } from "@/components/landing/landing-bits";
import { crmPoints, desktopNav, faqs, features, heroText, people, steps } from "@/components/landing/landing-content";

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

const phoneSeminars = [
  { title: "Implantologiya asoslari", kind: "Amaliy seminar", src: "/img/sem0.jpg" },
  { title: "Endodontiya: kanal davolash", kind: "Onlayn kurs", src: "/img/sem1.jpg" },
  { title: "Estetik restavratsiya", kind: "Master-klass", src: "/img/sem2.jpg" },
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
        <div key={tab.label} className={`text-center ${index === 0 ? "text-[#0F766E]" : "text-[#94a3b8]"}`}>
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
          <b className="text-[13px] text-[#16324f]">Stoma<span className="text-[#0F766E]">Hub</span></b>
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
          <div className="mt-2 rounded-xl bg-[#0F766E] px-2 py-2 text-[12px] font-bold leading-tight text-white">
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
          <b className="text-[13px] text-[#16324f]">Stoma<span className="text-[#0F766E]">Hub</span></b>
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
        <div className="mt-2 rounded-xl bg-[#0F766E] px-2.5 py-2 text-[12px] font-bold leading-snug text-white">
          Stomatologlar uchun yagona platforma
        </div>
        <p className="mt-2 text-[12px] font-bold text-[#16324f]">Ommabop kategoriyalar</p>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {phoneProducts.map((item) => (
            <div key={item.label} className="overflow-hidden rounded-lg bg-white shadow-sm">
              <img src={item.src} alt="" className="h-16 w-full object-cover" />
              <p className="truncate px-1 py-1 text-[12px] font-semibold text-[#16324f]">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] font-bold text-[#16324f]">Seminarlar</p>
        <div className="mt-1 min-h-0 flex-1 space-y-1 overflow-hidden">
          {phoneSeminars.map((item) => (
            <div key={item.title} className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm">
              <img src={item.src} alt="" className="h-10 w-12 shrink-0 rounded-md object-cover" />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[12px] font-semibold text-[#16324f]">{item.title}</span>
                <span className="block truncate text-[11px] text-[#64748b]">{item.kind}</span>
              </span>
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
              <b className="block text-[13px] text-[#0F766E]">{value}</b>
              <span className="block text-[12px] text-[#64748b]">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-hidden">
          {["Kurslarim", "Buyurtmalar", "Uchrashuvlar", "Sertifikatlar", "Sevimlilar", "Sozlamalar"].map((label) => (
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
          <p className="px-2 text-[13px] font-extrabold tracking-tight text-[#16324f]">Stoma<span className="text-[#0F766E]">Hub</span></p>
          <nav className="mt-3 space-y-1 text-[12px] font-semibold text-[#52637a]">
            {["Bosh sahifa", "Bemorlar", "Uchrashuvlar", "To‘lovlar", "Ombor", "Hisobotlar"].map((item, index) => (
              <p key={item} className={index === 0 ? "rounded-lg bg-[#F0FDFA] px-2 py-2 text-[#0F766E]" : "px-2 py-2"}>{item}</p>
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

const btnPrimary = "inline-flex items-center gap-2.5 rounded-xl bg-[#1d6cf2] font-bold text-white shadow-[0_10px_24px_rgba(29,108,242,0.28)] transition hover:bg-[#1557d0]";

const heroChips = [
  { icon: ToothIcon, text: "Barcha imkoniyatlar bir joyda" },
  { icon: Globe, text: "O‘zbekiston bozori uchun mos" },
  { icon: Users, text: "Stomatologlar hamjamiyati" },
];

const featureTones = ["bg-[#F0FDFA] text-[#1d6cf2]", "bg-[#e6f7f5] text-[#0F766E]"];

const boardNav = [
  { label: "Bosh sahifa", icon: Home },
  { label: "Bemorlar", icon: Users },
  { label: "Uchrashuvlar", icon: CalendarDays },
  { label: "Davolash rejasi", icon: ClipboardList },
  { label: "To‘lovlar", icon: Wallet },
  { label: "Ombor", icon: Package },
  { label: "Hisobotlar", icon: BarChart3 },
  { label: "Sozlamalar", icon: Settings },
];

const boardStats = [
  { label: "Bugungi uchrashuvlar", value: "4", icon: CalendarDays, tone: "bg-[#F0FDFA] text-[#1d6cf2]" },
  { label: "Bemorlar", value: "4", icon: Users, tone: "bg-[#e6f7f5] text-[#0F766E]" },
  { label: "Davolash rejalari", value: "3", icon: ClipboardList, tone: "bg-[#eef0ff] text-[#5b5bd6]" },
  { label: "Qarzdorlik", value: "1", icon: Wallet, tone: "bg-[#fff1e6] text-[#ea7a1c]" },
];

const boardPatients = [
  { time: "09:00", name: "Aliyeva Nigora", service: "Konsultatsiya", avatar: "/images/clinic/patient-karimova.png" },
  { time: "10:30", name: "Karimov Behzod", service: "Plomba", avatar: "/images/clinic/patient-torayev.png" },
  { time: "12:00", name: "Rasulova Madina", service: "Professional gigiyena", avatar: "/images/clinic/patient-3.png" },
  { time: "15:00", name: "To‘xtayev Sardor", service: "Implantatsiya", avatar: "/images/clinic/patient-4.png" },
];

/** Line path for the sample revenue chart in the CRM preview. */
const chartPoints = [42, 48, 46, 58, 54, 63, 60, 70, 68, 76, 72, 84];

const appChecklist = [
  "Marketplace va buyurtmalar",
  "Seminarlar va onlayn darslar",
  "Uchrashuvlar va kalendar",
  "Bemorlar kartasi",
  "To‘lovlar va bildirishnomalar",
  "Har doim yoningizda",
];

function ToothIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" aria-hidden="true">
      <path d={toothOutline} />
    </svg>
  );
}

/** Desktop CRM preview: a clinic dashboard filled with a sample day, labelled as a sample. */
function CrmBoard() {
  const max = Math.max(...chartPoints);
  const line = chartPoints.map((value, index) => `${(index / (chartPoints.length - 1)) * 100},${100 - (value / max) * 82}`).join(" ");
  return (
    <div className="rounded-[26px] border border-white/70 bg-white/60 p-3 shadow-[0_30px_70px_rgba(15,39,68,0.16)] backdrop-blur">
      <div className="overflow-hidden rounded-[18px] border border-[#e6edf6] bg-white">
        <div className="flex items-center justify-between border-b border-[#eef2f7] px-4 py-2.5">
          <span className="flex items-center gap-2">
            <ToothIcon className="size-6 text-[#1d6cf2]" />
            <b className="text-[14px] text-[#16324f]">Stoma<span className="text-[#1d6cf2]">Hub</span></b>
          </span>
          <span className="flex h-8 w-[38%] items-center gap-2 rounded-lg bg-[#f4f7fb] px-3 text-[12px] text-[#94a3b8]">
            <Search className="size-3.5" /> Qidiruv
          </span>
          <span className="flex items-center gap-3 text-[#94a3b8]">
            <span className="rounded-full bg-[#fff1e6] px-2 py-0.5 text-[11px] font-bold text-[#ea7a1c]">Namuna</span>
            <Bell className="size-4" />
            <img src="/images/avatar-azizbek.png" alt="" className="size-7 rounded-full object-cover" />
          </span>
        </div>
        <div className="grid grid-cols-[150px_minmax(0,1fr)]">
          <nav className="space-y-0.5 border-r border-[#eef2f7] p-2.5">
            {boardNav.map((item, index) => (
              <span key={item.label} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-semibold ${index === 0 ? "bg-[#1d6cf2] text-white" : "text-[#52637a]"}`}>
                <item.icon className="size-3.5" />
                {item.label}
              </span>
            ))}
          </nav>
          <div className="min-w-0 space-y-3 p-3.5">
            <p className="text-[15px] font-extrabold text-[#16324f]">Bosh sahifa</p>
            <div className="grid grid-cols-4 gap-2">
              {boardStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 rounded-xl border border-[#eef2f7] p-2">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${stat.tone}`}><stat.icon className="size-4" /></span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[10.5px] text-[#64748b]">{stat.label}</span>
                    <b className="text-[15px] text-[#16324f]">{stat.value}</b>
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_150px] gap-2">
              <div className="rounded-xl border border-[#eef2f7] p-2.5">
                <p className="mb-1.5 flex justify-between text-[12px] font-bold text-[#16324f]">
                  Bugungi uchrashuvlar
                  <span className="rounded-md bg-[#F0FDFA] px-1.5 text-[10.5px] text-[#1d6cf2]">Bugun</span>
                </p>
                {boardPatients.map((row) => (
                  <p key={row.time} className="grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)_12px] items-center gap-2 border-t border-[#f3f6fa] py-1.5 text-[11.5px]">
                    <span className="text-[#64748b]">{row.time}</span>
                    <span className="truncate font-semibold text-[#16324f]">{row.name}</span>
                    <span className="truncate text-[#64748b]">{row.service}</span>
                    <ChevronRight className="size-3 text-[#94a3b8]" />
                  </p>
                ))}
              </div>
              <div className="rounded-xl border border-[#eef2f7] p-2.5">
                <p className="mb-1.5 text-[12px] font-bold text-[#16324f]">Bemorlar</p>
                {boardPatients.map((row) => (
                  <p key={row.name} className="flex items-center gap-2 py-1 text-[11.5px] font-semibold text-[#16324f]">
                    <img src={row.avatar} alt="" className="size-6 shrink-0 rounded-full object-cover" />
                    <span className="truncate">{row.name}</span>
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[#eef2f7] p-2.5">
              <p className="flex justify-between text-[12px] font-bold text-[#16324f]">
                Daromad dinamikasi
                <span className="flex gap-1 text-[10.5px] font-semibold text-[#64748b]">
                  <span className="rounded-md bg-[#F0FDFA] px-1.5 text-[#1d6cf2]">Hafta</span>
                  <span className="px-1.5">Oy</span>
                  <span className="px-1.5">Yil</span>
                </span>
              </p>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 h-[92px] w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="crm-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#0F766E" stopOpacity="0.22" />
                    <stop offset="1" stopColor="#0F766E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[25, 50, 75].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#eef2f7" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />)}
                <polygon points={`0,100 ${line} 100,100`} fill="url(#crm-area)" />
                <polyline points={line} fill="none" stroke="#0F766E" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreBadge({ store }: { store: "apple" | "google" }) {
  const apple = store === "apple";
  return (
    <a href="#ilova" className="inline-flex h-[60px] items-center gap-3 rounded-xl bg-[#0b0f19] px-5 text-white transition hover:bg-[#1e2433]">
      {apple ? (
        <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden="true">
          <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
          <path fill="#00d7fe" d="M3.6 1.8 13.4 12 3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z" />
          <path fill="#ffce00" d="m16.7 15.3-3.3-3.3 3.3-3.3 3.8 2.2c1.1.6 1.1 1.6 0 2.2z" />
          <path fill="#ff3a44" d="M16.7 15.3 13.4 12 3.6 22.2c.4.2.9.2 1.5-.1z" />
          <path fill="#00f076" d="M16.7 8.7 5.1 1.9c-.6-.3-1.1-.3-1.5-.1L13.4 12z" />
        </svg>
      )}
      <span className="text-left leading-tight">
        <span className="block text-[12px] opacity-80">{apple ? "App Store’dan" : "Google Play’dan"}</span>
        <span className="block text-[16px] font-bold">yuklab oling</span>
      </span>
    </a>
  );
}

const footerCols = [
  { title: "Platforma", links: [["/marketplace", "Marketplace"], ["/talim", "Ta’lim"], ["/seminarlar", "Seminarlar"], ["/kitoblar", "Kitoblar"]] },
  { title: "Klinika uchun", links: [["/crm", "Klinika CRM"], ["/ustalar", "Ustalar laboratoriyalari"], ["/mutaxassislar", "Konsultatsiyalar"], ["/elonlar", "E’lonlar"]] },
  { title: "Yordam", links: [["#savollar", "Savol-javob"], ["/shartlar", "Foydalanish shartlari"], ["/maxfiylik", "Maxfiylik siyosati"], ["#aloqa", "Bog‘lanish"]] },
] as const;

export function LandingDesktop() {
  return (
    <div className="bg-[#f8fbfe] text-[#16324f]" data-testid="desktop-landing">
      <header data-section="header" data-landing-header className="sticky top-0 z-40 border-b border-[#e8eef6] bg-white/95 backdrop-blur">
        <div className={`${wrap} flex h-[80px] items-center gap-3`}>
          <Link href="/landing" aria-label="StomaHub" className="shrink-0">
            <LandingLogo size="lg" />
          </Link>
          <nav aria-label="Asosiy" className="flex min-w-0 flex-1 items-center justify-center gap-1">
            {desktopNav.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-lg px-2.5 py-2 text-[15px] font-semibold text-[#16324f] transition hover:bg-[#f4f7fb] hover:text-[#1d6cf2] xl:px-3">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2.5">
            <LandingSearch />
            <Link href="/kirish" className="inline-flex h-11 items-center rounded-xl border border-[#1d6cf2] px-6 text-[15px] font-bold text-[#1d6cf2] transition hover:bg-[#F0FDFA]">
              Kirish
            </Link>
            <Link href="/royxat" className={`${btnPrimary} h-11 px-5 text-[15px]`}>
              Ro‘yxatdan o‘tish
            </Link>
          </div>
        </div>
      </header>

      <section data-section="hero" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[70%]">
          <img src="/img/mobile/kl-clinic.jpg" alt="" className="h-full w-full object-cover opacity-60" />
          <img
            src="/img/landing/hero-dentist.jpg"
            alt=""
            className="absolute bottom-0 left-[16%] h-[96%] w-auto [mask-image:linear-gradient(90deg,transparent_0%,#000_22%,#000_80%,transparent_100%)]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#f8fbfe_0%,rgba(248,251,254,0.8)_14%,rgba(248,251,254,0.1)_34%,rgba(248,251,254,0)_60%)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f8fbfe] to-transparent" />
        </div>
        <div className={`${wrap} relative grid min-h-[600px] items-center gap-6 py-10 lg:grid-cols-[minmax(0,1fr)_330px]`}>
          <div className="max-w-[600px]">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#e8f3f2] px-3.5 py-1.5 text-[14px] font-semibold text-[#0f6f6b]">
              <ToothIcon className="size-4" />
              Stomatologlar uchun yagona platforma
            </p>
            <h1 className="mt-5 font-[family-name:var(--font-outfit)] text-[clamp(46px,4.4vw,66px)] font-bold leading-[1.05] tracking-tight text-[#0f2147]">
              Stomatologlar uchun
              <span className="block text-[#1d6cf2]">yagona platforma</span>
            </h1>
            <p className="mt-5 max-w-[470px] text-[17px] leading-relaxed text-[#52637a]">{heroText}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/royxat" className={`${btnPrimary} h-14 px-7 text-[16px]`}>
                Bepul ro‘yxatdan o‘tish
                <ArrowRight className="size-5" />
              </Link>
              <Link href="/marketplace" className="inline-flex h-14 items-center gap-3 rounded-xl bg-white pr-7 pl-4 text-[16px] font-bold text-[#16324f] shadow-[0_8px_22px_rgba(15,39,68,0.08)] ring-1 ring-[#e3eaf3] transition hover:text-[#1d6cf2]">
                <span className="grid size-8 place-items-center rounded-full bg-[#1d6cf2] text-white"><Play className="size-3.5 translate-x-px fill-current" /></span>
                Marketplace’ni ko‘rish
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
              {heroChips.map((chip) => (
                <li key={chip.text} className="flex max-w-[170px] items-center gap-2.5 text-[13.5px] leading-snug text-[#52637a]">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#0F766E] shadow-sm ring-1 ring-[#e3eef0]">
                    <chip.icon className="size-5" />
                  </span>
                  {chip.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative justify-self-end">
            <span className="absolute -right-7 top-[44%] z-10 grid size-[68px] place-items-center rounded-2xl bg-[#1d6cf2] text-white shadow-[0_14px_30px_rgba(29,108,242,0.35)]">
              <ToothIcon className="size-9" />
            </span>
            <HomePhone width="w-[300px]" height="h-[560px]" />
          </div>
        </div>
      </section>

      <section data-section="features" className={`${wrap} py-12`}>
        <h2 className={title}>Nimalar bor?</h2>
        <p className="mt-1.5 text-[16px] text-[#52637a]">Stomatologlar uchun kerakli barcha imkoniyatlar bir joyda</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((item, index) => (
            <Link key={item.href} href={item.href} className="flex min-h-[184px] flex-col items-start gap-4 rounded-[18px] border border-[#e8eef6] bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#99F6E4] hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
              <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${featureTones[(index + Math.floor(index / 4)) % 2]}`}>
                {item.href === "/ustalar" ? <ToothIcon className="size-7" /> : <item.icon className="size-7" strokeWidth={1.75} />}
              </span>
              <span className="min-w-0">
                <h3 className="font-[family-name:var(--font-outfit)] text-[18px] font-bold leading-tight text-[#0f2147]">{item.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-[14.5px] leading-snug text-[#64748b]">{item.text}</p>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section data-section="audiences" className={`${wrap} pb-12`}>
        <h2 className={title}>Kimlar uchun?</h2>
        <p className="mt-1.5 text-[16px] text-[#52637a]">StomaHub barcha stomatologiya sohasidagi mutaxassislar uchun</p>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {people.map((person) => (
            <Link key={person.title} href={person.href} className={`group overflow-hidden rounded-[20px] border bg-[linear-gradient(180deg,#eaf3fd_0%,#f5f9fe_100%)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)] ${person.selected ? "border-2 border-[#1d6cf2]" : "border-[#e3ecf7]"}`}>
              <span className="relative block h-[190px] overflow-hidden">
                {/* The source cards print a name along the bottom; render taller so the frame cuts it off. */}
                <img src={person.image} alt="" className="h-[236px] w-full object-cover object-top" />
              </span>
              <span className="flex items-center justify-between gap-2 bg-white/70 px-4 py-3.5">
                <span>
                  <b className="block text-[16px] text-[#0f2147]">{person.title}</b>
                  <span className="mt-0.5 block text-[13px] text-[#64748b]">{person.text}</span>
                </span>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#1d6cf2] ring-1 ring-[#e3eaf3] group-hover:bg-[#1d6cf2] group-hover:text-white">
                  <ChevronRight className="size-4" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section data-section="crm" className="relative overflow-hidden py-12">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[62%]">
          <img src="/img/mobile/kl-clinic.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#f8fbfe_0%,rgba(248,251,254,0.82)_30%,rgba(248,251,254,0.55)_100%)]" />
        </div>
        <div className={`${wrap} relative grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]`}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#e8f3f2] px-3.5 py-1.5 text-[13.5px] font-semibold text-[#0f6f6b]">
              <LayoutDashboard className="size-4" />
              Klinikangizni to‘liq nazorat qiling
            </p>
            <h2 className={`${title} mt-4`}>Klinika CRM</h2>
            <p className="mt-3 max-w-[470px] text-[16.5px] leading-relaxed text-[#52637a]">
              Bemorlar, uchrashuvlar, davolash rejalari, to‘lovlar va hisobotlar — barchasi bir joyda. Klinika jarayonlarini soddalashtiring va samaradorlikni oshiring.
            </p>
            <ul className="mt-6 space-y-3">
              {crmPoints.map((point) => (
                <li key={point} className="flex items-center gap-3 text-[16px] text-[#334155]">
                  <span className="grid size-6 place-items-center rounded-full bg-[#1d6cf2] text-white"><Check className="size-3.5" strokeWidth={3} /></span>
                  {point}
                </li>
              ))}
            </ul>
            <Link href="/crm" className={`${btnPrimary} mt-8 h-14 px-7 text-[16px]`}>
              CRM imkoniyatlarini ko‘rish <ArrowRight className="size-5" />
            </Link>
          </div>
          <CrmBoard />
        </div>
      </section>

      <section data-section="steps" className={`${wrap} py-12`}>
        <h2 className={title}>Qanday ishlaydi?</h2>
        <p className="mt-1.5 text-[16px] text-[#52637a]">StomaHub’da boshlash juda oson</p>
        <ol className="mt-6 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {steps.map((step, index) => (
            <li key={step.n} className="contents">
              <div className="flex items-center gap-5 rounded-[20px] border border-[#e8eef6] bg-white px-7 py-7 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                <span className="grid size-[60px] shrink-0 place-items-center rounded-full bg-[#F0FDFA]">
                  <span className="grid size-10 place-items-center rounded-full bg-[#1d6cf2] font-[family-name:var(--font-outfit)] text-[18px] font-bold text-white">{step.n}</span>
                </span>
                <span>
                  <h3 className="text-[18px] font-bold text-[#0f2147]">{step.title}</h3>
                  <p className="mt-1 text-[15px] leading-snug text-[#64748b]">{step.text}</p>
                </span>
              </div>
              {index < steps.length - 1 ? <ArrowRight className="mx-auto hidden size-6 self-center text-[#1d6cf2] lg:block" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>
      </section>

      <section data-section="app" id="ilova" className="relative overflow-hidden py-12">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(ellipse_at_45%_100%,#dcebff_0%,rgba(220,235,255,0.5)_40%,transparent_70%)]" />
        <div className={`${wrap} relative grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_auto_minmax(0,0.75fr)]`}>
          <div>
            <h2 className={title}>Har doim yoningizda</h2>
            <p className="mt-3 max-w-md text-[16.5px] leading-relaxed text-[#52637a]">
              StomaHub mobil ilovasi bilan barcha imkoniyatlar telefoningizda. Istalgan vaqtda, istalgan joyda.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <StoreBadge store="apple" />
              <StoreBadge store="google" />
            </div>
          </div>
          <div className="flex items-end justify-center">
            <HomePhone width="w-[240px]" height="h-[480px]" className="relative z-10 -rotate-3" />
            <ProfilePhone width="w-[220px]" height="h-[440px]" className="-ml-3 mb-6 rotate-3" />
          </div>
          <ul className="space-y-3.5 rounded-[22px] border border-[#e8eef6] bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            {appChecklist.map((point) => (
              <li key={point} className="flex items-center gap-3 text-[15.5px] text-[#334155]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#0F766E] text-white"><Check className="size-3.5" strokeWidth={3} /></span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-section="faq" id="savollar" className={`${wrap} py-12`}>
        <h2 className={title}>Ko‘p so‘raladigan savollar</h2>
        <div className="mt-6">
          <LandingFaq items={faqs.map((item) => ({ q: item.q, a: item.a }))} />
        </div>
      </section>

      <section data-section="cta" className={`${wrap} pb-10`}>
        <div className="flex flex-wrap items-center gap-8 rounded-[24px] bg-[linear-gradient(90deg,#e4f0ff_0%,#eef6ff_55%,#e4f0ff_100%)] px-10 py-9">
          <svg viewBox="0 0 32 32" className="size-[84px] shrink-0" fill="none" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true">
            <defs>
              <linearGradient id="cta-tooth" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#1d6cf2" />
                <stop offset="1" stopColor="#0F766E" />
              </linearGradient>
            </defs>
            <path d={toothOutline} stroke="url(#cta-tooth)" />
          </svg>
          <div className="min-w-[260px] flex-1">
            <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(26px,2.2vw,34px)] font-bold tracking-tight text-[#1d6cf2]">Stomatologlar hamjamiyatiga qo‘shiling</h2>
            <p className="mt-1.5 text-[16px] text-[#52637a]">Kasbiy o‘sish, yangi imkoniyatlar va ishonchli hamkorlar — barchasi StomaHub’da.</p>
          </div>
          <Link href="/royxat" className={`${btnPrimary} h-14 shrink-0 px-8 text-[16px]`}>
            Bepul ro‘yxatdan o‘tish
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      <footer data-section="footer" className="border-t border-[#e8eef6] bg-white">
        <div className={`${wrap} grid gap-8 py-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr_0.8fr]`}>
          <div>
            <LandingLogo />
            <div className="mt-5 flex gap-3">
              {(["telegram", "instagram", "youtube"] as const).map((name) => (
                <LandingSocials key={name} names={[name]} tone="brand" />
              ))}
            </div>
          </div>
          {footerCols.map((col) => (
            <div key={col.title}>
              <b className="text-[15px] text-[#0f2147]">{col.title}</b>
              <ul className="mt-3 space-y-2 text-[14.5px] text-[#64748b]">
                {col.links.map(([href, label]) => (
                  <li key={label}>
                    {href.startsWith("#") ? <a href={href} className="hover:text-[#1d6cf2]">{label}</a> : <Link href={href} className="hover:text-[#1d6cf2]">{label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div id="aloqa">
            <b className="text-[15px] text-[#0f2147]">Aloqa</b>
            <ul className="mt-3 space-y-2.5 text-[14.5px] text-[#64748b]">
              <li><a href="tel:+998901234567" className="flex items-center gap-2 hover:text-[#1d6cf2]"><Phone className="size-4 text-[#1d6cf2]" />+998 90 123 45 67</a></li>
              <li><a href="mailto:info@stomahub.uz" className="flex items-center gap-2 hover:text-[#1d6cf2]"><Mail className="size-4 text-[#1d6cf2]" />info@stomahub.uz</a></li>
              <li className="flex items-center gap-2"><MapPin className="size-4 text-[#1d6cf2]" />Toshkent, O‘zbekiston</li>
            </ul>
          </div>
          <div className="lg:border-l lg:border-[#eef2f7] lg:pl-6">
            <b className="text-[15px] text-[#0f2147]">To‘lov usullari</b>
            <div className="mt-4 space-y-3">
              <p className="flex items-center gap-1.5 text-[19px] font-black tracking-tight text-[#0f2147]">
                <span className="grid size-6 place-items-center rounded-full bg-[#1d6cf2] text-[13px] text-white">C</span>CLICK
              </p>
              <p className="text-[22px] font-extrabold tracking-tight text-[#0f2147]">
                Pay<span className="rounded-md bg-[#33cccc] px-1 text-white">me</span>
              </p>
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
