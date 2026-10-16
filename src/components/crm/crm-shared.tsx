"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  BadgePercent,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Home,
  Megaphone,
  MessagesSquare,
  MonitorPlay,
  Presentation,
  Settings,
  Stethoscope,
  UserRound,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { Gate } from "@/components/work-ui";
import type { State } from "@/components/clinic-dashboard";
import type { FieldErrors } from "@/lib/work-validate";
import { api } from "@/lib/work-client";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; match?: string };
const TOP: Item[] = [
  { href: "/klinika", label: "Bosh sahifa", icon: Home, match: "/klinika$" },
  { href: "/klinika/bemorlar", label: "Bemorlar CRM", icon: Users },
  { href: "/klinika/uchrashuvlar", label: "Uchrashuvlar", icon: CalendarDays },
  // Not built yet: these open the clinic dashboard for now.
  { href: "/klinika/davolash-rejalari", label: "Davolash rejalari", icon: ClipboardList },
  { href: "/klinika/tolovlar", label: "To‘lovlar", icon: Wallet },
  { href: "/klinika", label: "Xizmatlar", icon: Stethoscope, match: "^$" },
  { href: "/klinika/ombor", label: "Ombor", icon: Warehouse },
  { href: "/klinika", label: "Hisobotlar", icon: BarChart3, match: "^$" },
];
const ELON_BOTTOM: Item[] = [
  { href: "/seminarlar", label: "Seminarlar", icon: Presentation },
  { href: "/onlayn-darslar", label: "Onlayn darslar", icon: MonitorPlay },
  { href: "/mutaxassislar", label: "Konsultatsiyalar", icon: MessagesSquare },
  { href: "/ustalar", label: "Ustalar", icon: UserRound },
  { href: "/elonlar", label: "E’lonlar", icon: Megaphone },
  { href: "/kitoblar", label: "Kitoblar", icon: BookOpen },
  { href: "/aksiyalar", label: "Aksiyalar", icon: BadgePercent },
  { href: "/profil", label: "Sozlamalar", icon: Settings, match: "^$" },
];
const BOTTOM: Item[] = [
  { href: "/seminarlar", label: "Seminarlar", icon: Presentation },
  { href: "/onlayn-darslar", label: "Onlayn darslar", icon: MonitorPlay },
  { href: "/ustalar", label: "Ustalar", icon: UserRound },
  { href: "/kitoblar", label: "Kitoblar", icon: BookOpen },
  { href: "/aksiyalar", label: "Aksiyalar", icon: BadgePercent },
  { href: "/profil", label: "Sozlamalar", icon: Settings, match: "^$" },
];

export function CrmSideNav({ variant = "crm" }: { variant?: "crm" | "elon" }) {
  const pathname = usePathname() ?? "";
  const row = (it: Item, i: number) => {
    const on = it.match ? new RegExp(it.match).test(pathname) : pathname === it.href || pathname.startsWith(`${it.href}/`);
    const Icon = it.icon;
    return (
      <Link
        key={`${it.label}-${i}`}
        href={it.href}
        className={cn(
          "flex h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] transition-colors",
          on ? "bg-[#EAF2FF] font-semibold text-[#0066FF]" : "text-[#1f2a44] hover:bg-[#f4f7fc]",
        )}
      >
        <Icon className="size-[18px] shrink-0" strokeWidth={on ? 2 : 1.6} />
        {it.label}
      </Link>
    );
  };
  return (
    <aside className="sticky top-0 hidden w-[210px] shrink-0 flex-col rounded-2xl border border-[#eceff5] bg-white p-2.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] xl:flex">
      <nav className="space-y-0.5">{TOP.map(row)}</nav>
      <div className="mx-3 my-2.5 h-px bg-[#eceff5]" />
      <nav className="space-y-0.5">{(variant === "elon" ? ELON_BOTTOM : BOTTOM).map(row)}</nav>
    </aside>
  );
}

/** Same data source and write ops as the Mening klinikam dashboard (/api/work/clinic). */
export function useClinic() {
  const { profile, ready } = useDoctorProfile();
  const userId = profile?.id ?? null;
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await api<{ state: State }>("/api/work/clinic");
    if (res.ok) setState(res.data.state ?? null);
    else setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- signed-out: nothing to load
      setLoading(false);
      return;
    }
    void load();
  }, [ready, userId, load]);

  const op = useCallback(
    async (name: string, data: Record<string, unknown>, id?: string): Promise<{ ok: true } | { ok: false; error: string; errors?: FieldErrors }> => {
      setBusy(true);
      setError("");
      const res = await api<{ state: State }>("/api/work/clinic", { body: { op: name, id, data } });
      setBusy(false);
      if (!res.ok) return { ok: false, error: res.error, errors: res.errors };
      setState(res.data.state);
      return { ok: true };
    },
    [],
  );

  return { ready, signedIn: Boolean(userId), state, loading, error, setError, busy, op };
}

export function CrmFrame({ next, children }: { next: string; children: (s: ReturnType<typeof useClinic>) => ReactNode }) {
  const clinic = useClinic();
  let body: ReactNode;
  if (!clinic.ready || clinic.loading) body = <div className="h-[420px] animate-pulse rounded-2xl bg-white" />;
  else if (!clinic.signedIn)
    body = <Gate title="Kirish talab qilinadi" text="Klinika ma’lumotlari shaxsiy — faqat egasi ko‘radi. Davom etish uchun tizimga kiring." next={next} />;
  else body = children(clinic);
  return (
    <div className="flex items-start gap-4">
      <CrmSideNav />
      <div className="min-w-0 flex-1">{body}</div>
    </div>
  );
}

export function CrmTitle({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-start gap-3">
      <div className="min-w-0">
        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#0B1F4D] lg:text-[30px]">{title}</h1>
        <p className="mt-1 text-[13.5px] text-[#8b93a7] lg:text-[15px]">{subtitle}</p>
      </div>
      {actions ? <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export const fmtDate = (iso: string | null | undefined) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "—");
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
export const selectCls =
  "h-10 w-full appearance-none rounded-xl border border-[#e6eaf2] bg-white pr-8 pl-3.5 text-[12.5px] font-medium text-[#1f2a44] outline-none focus:border-[#0066FF]";
