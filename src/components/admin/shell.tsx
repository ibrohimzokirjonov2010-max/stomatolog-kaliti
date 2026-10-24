"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Wallet,
  ExternalLink,
  FileCheck2,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ListChecks,
  Package,
  Settings,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  Store,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { initials } from "@/components/admin/ui";

export type ShellAdmin = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  adminRole: "owner" | "admin" | "moderator" | "finance";
  badges: { applications: number; disputes: number; reports: number; payouts: number };
};

const AdminCtx = createContext<ShellAdmin | null>(null);
export function useAdminMe() {
  return useContext(AdminCtx);
}

export const ROLE_LABEL: Record<ShellAdmin["adminRole"], string> = {
  owner: "CEO · Super admin",
  admin: "Admin",
  moderator: "Moderator",
  finance: "Moliya",
};

type NavDef = { href: string; label: string; icon: typeof Users; badge?: keyof ShellAdmin["badges"]; crumb: string };

export const ADMIN_NAV: NavDef[] = [
  { href: "/admin", label: "Umumiy", icon: LayoutDashboard, crumb: "Umumiy" },
  { href: "/admin/foydalanuvchilar", label: "Foydalanuvchilar", icon: Users, crumb: "Foydalanuvchilar" },
  { href: "/admin/lidlar", label: "Lidlar", icon: UserRound, crumb: "Lidlar" },
  { href: "/admin/dokonlar", label: "Do‘konlar", icon: Store, crumb: "Do‘konlar" },
  { href: "/admin/arizalar", label: "Sotuvchi arizalari", icon: FileCheck2, badge: "applications", crumb: "Sotuvchi arizalari" },
  { href: "/admin/buyurtmalar", label: "Buyurtmalar & Escrow", icon: ShieldCheck, badge: "disputes", crumb: "Buyurtmalar & Escrow" },
  { href: "/admin/tolovlar", label: "To‘lov so‘rovlari", icon: Wallet, badge: "payouts", crumb: "To‘lov so‘rovlari" },
  { href: "/admin/reklama", label: "Reklama", icon: Megaphone, crumb: "Reklama" },
  { href: "/admin/kanallar", label: "Kanal auksion", icon: Send, crumb: "Kanal auksion" },
  { href: "/admin/kontent", label: "Kontent", icon: MessageSquareText, badge: "reports", crumb: "Kontent" },
  { href: "/admin/seminarlar", label: "Seminarlar", icon: GraduationCap, crumb: "Seminarlar" },
  { href: "/admin/kutubxona", label: "Kutubxona", icon: BookOpen, crumb: "Kutubxona" },
  { href: "/admin/moderatsiya", label: "Moderatsiya", icon: ListChecks, crumb: "Moderatsiya" },
  { href: "/admin/mahsulotlar", label: "Mahsulotlar", icon: Package, crumb: "Mahsulotlar" },
  { href: "/admin/sozlamalar", label: "Sozlamalar", icon: Settings, crumb: "Sozlamalar" },
];

const BOTTOM_NAV: NavDef[] = [
  { href: "/admin/audit", label: "Audit jurnali", icon: History, crumb: "Audit jurnali" },
  { href: "/admin/hisobot", label: "Hisobot (CSV)", icon: FileSpreadsheet, crumb: "Hisobot" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname, badges, onClick }: { item: NavDef; pathname: string; badges: ShellAdmin["badges"]; onClick?: () => void }) {
  const on = isActive(pathname, item.href);
  const Icon = item.icon;
  const count = item.badge ? badges[item.badge] : 0;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-[12px] px-3 py-2 text-[13.5px] font-medium transition-colors",
        on ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={on ? 2 : 1.7} />
      <span className="truncate">{item.label}</span>
      {count > 0 ? (
        <span className={cn("ml-auto rounded-full px-1.5 py-0.5 text-[10.5px] font-bold", on ? "bg-white/20 text-white" : "bg-[#fff1f0] text-[#e5484d]")}>
          {count}
        </span>
      ) : null}
    </Link>
  );
}

async function logout(router: ReturnType<typeof useRouter>) {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => null);
  router.replace("/");
  router.refresh();
}

function SidebarBody({ admin, pathname, onNavigate }: { admin: ShellAdmin; pathname: string; onNavigate?: () => void }) {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/admin" onClick={onNavigate}>
          <Logo />
        </Link>
        <span className="rounded-md bg-[#0f172a] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">ADMIN</span>
      </div>
      <div className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Boshqaruv</div>
      <nav aria-label="Admin menyu" className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {ADMIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} badges={admin.badges} onClick={onNavigate} />
        ))}
      </nav>
      <div className="space-y-0.5 border-t border-[#eef2f7] px-3 py-2">
        {BOTTOM_NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} badges={admin.badges} onClick={onNavigate} />
        ))}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#eef4ff] px-3 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[13px] font-bold text-white">
            {initials(admin.fullName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-[#0f172a]">{admin.fullName}</span>
            <span className="block text-[11.5px] text-slate-500">{ROLE_LABEL[admin.adminRole]}</span>
          </span>
          <button type="button" onClick={() => void logout(router)} className="text-slate-400 hover:text-slate-700" aria-label="Chiqish" title="Chiqish">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BellMenu({ badges, compact }: { badges: ShellAdmin["badges"]; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const total = badges.applications + badges.disputes + badges.reports + (badges.payouts ?? 0);
  const items = [
    { href: "/admin/arizalar", label: "Yangi sotuvchi arizalari", n: badges.applications },
    { href: "/admin/buyurtmalar?filter=disputed", label: "Ochiq nizolar", n: badges.disputes },
    { href: "/admin/tolovlar?filter=pending", label: "Kutilayotgan to‘lov so‘rovlari", n: badges.payouts ?? 0 },
    { href: "/admin/kontent", label: "Shikoyat qilingan postlar", n: badges.reports },
  ];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex size-9 items-center justify-center border border-[#e2e8f0] bg-white text-slate-500 hover:bg-slate-50",
          compact ? "rounded-xl" : "rounded-full",
        )}
        aria-label="Bildirishnomalar"
      >
        <Bell className="size-[17px]" />
        {total > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-[#e5484d] px-1 text-[9.5px] font-bold text-white">
            {total}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-72 overflow-hidden rounded-2xl border border-[#eceff5] bg-white py-1 shadow-xl">
            {total === 0 ? (
              <p className="px-4 py-3 text-[13px] text-slate-500">Hozircha diqqat talab qiladigan narsa yo‘q.</p>
            ) : (
              items
                .filter((i) => i.n > 0)
                .map((i) => (
                  <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className="flex items-center justify-between px-4 py-2.5 text-[13px] hover:bg-slate-50">
                    <span className="text-slate-700">{i.label}</span>
                    <span className="rounded-full bg-[#fff1f0] px-1.5 text-[11px] font-bold text-[#e5484d]">{i.n}</span>
                  </Link>
                ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      className="ml-6 hidden h-9 w-[380px] items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3.5 text-[13px] text-slate-400 xl:flex"
      onSubmit={(e) => {
        e.preventDefault();
        const v = q.trim();
        if (!v) return;
        if (/^#?sk-/i.test(v)) router.push(`/admin/buyurtmalar?q=${encodeURIComponent(v.replace(/^#/, ""))}`);
        else router.push(`/admin/foydalanuvchilar?q=${encodeURIComponent(v)}`);
      }}
    >
      <Search className="size-[15px]" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Foydalanuvchi, telefon, buyurtma ID…"
        className="min-w-0 flex-1 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
      />
      <kbd className="rounded border border-[#e2e8f0] bg-white px-1.5 text-[10.5px]">↵</kbd>
    </form>
  );
}

export function AdminShell({ admin, children }: { admin: ShellAdmin; children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const [drawer, setDrawer] = useState(false);
  const current = [...ADMIN_NAV, ...BOTTOM_NAV].find((i) => isActive(pathname, i.href)) ?? ADMIN_NAV[0];

  useEffect(() => {
    document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.add("overflow-hidden");
  }, []);

  const mobileTabs: (NavDef & { key: string })[] = [
    { ...ADMIN_NAV[0], label: "Umumiy", key: "d" },
    { ...ADMIN_NAV[1], label: "Userlar", key: "u" },
    { ...ADMIN_NAV[3], label: "Arizalar", key: "a" },
    { ...ADMIN_NAV[4], label: "Escrow", key: "o" },
  ];

  return (
    <AdminCtx.Provider value={admin}>
    <div className="flex h-screen bg-[#F4F7FC] font-sans text-[#0f172a]">
      <aside className="hidden w-[252px] shrink-0 border-r border-[#e2e8f0] bg-white lg:block">
        <SidebarBody admin={admin} pathname={pathname} />
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Yopish" className="absolute inset-0 bg-[#0f172a]/40" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[272px] bg-white shadow-2xl">
            <button type="button" onClick={() => setDrawer(false)} className="absolute right-3 top-4 z-10 flex size-8 items-center justify-center rounded-lg text-slate-500" aria-label="Yopish">
              <X className="size-4" />
            </button>
            <SidebarBody admin={admin} pathname={pathname} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* desktop topbar */}
        <header className="hidden h-[60px] shrink-0 items-center gap-4 border-b border-[#e2e8f0] bg-white/90 px-6 backdrop-blur lg:flex">
          <div className="text-[13px] text-slate-400">
            Admin <span className="mx-1">/</span> <span className="font-semibold text-[#0f172a]">{current.crumb}</span>
          </div>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <BellMenu badges={admin.badges} />
            <Link href="/" className="flex h-9 items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">
              <ExternalLink className="size-3.5" />
              Saytni ochish
            </Link>
          </div>
        </header>

        {/* mobile topbar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-[#e2e8f0] bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setDrawer(true)} className="flex size-9 items-center justify-center rounded-xl border border-[#e2e8f0] text-slate-600" aria-label="Menyu">
            <Menu className="size-[18px]" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Admin</div>
            <div className="-mt-0.5 truncate font-heading text-[16px] font-bold">{current.href === "/admin" ? "Umumiy ko‘rinish" : current.crumb}</div>
          </div>
          <BellMenu badges={admin.badges} compact />
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-[12px] font-bold text-white">{initials(admin.fullName)}</span>
        </header>

        <main id="admin-main" className="min-h-0 flex-1 overflow-y-auto p-3 pb-24 lg:p-6 lg:pb-10">
          {children}
        </main>

        {/* mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#e2e8f0] bg-white px-1 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1.5 lg:hidden">
          {mobileTabs.map((t) => {
            const on = isActive(pathname, t.href);
            const Icon = t.icon;
            const dot = t.badge ? admin.badges[t.badge] > 0 : false;
            return (
              <Link key={t.key} href={t.href} className={cn("relative flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-semibold", on ? "text-primary" : "text-slate-400")}>
                <Icon className="size-5" />
                {t.label}
                {dot ? <span className="absolute right-4 top-0 size-2 rounded-full bg-[#e5484d]" /> : null}
              </Link>
            );
          })}
          <button type="button" onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-semibold text-slate-400">
            <Menu className="size-5" />
            Yana
          </button>
        </nav>
      </div>
    </div>
    </AdminCtx.Provider>
  );
}
