"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  ShieldCheck,
  MonitorPlay,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
  } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { desktopItemActive, desktopNavGroups, navBottom, navTop, type NavItem } from "@/data/nav";
import { useNavTree } from "@/components/nav/use-nav-tree";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { initialsFromName } from "@/lib/doctor-profile";
import { NotificationBell } from "@/components/notification-bell";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSoonToast } from "@/components/soon-toast";
import "@/components/home/mobile-home.css";

const MobileNavContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [navPath, setNavPath] = useState(pathname);

  if (pathname !== navPath) {
    setNavPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const main = document.getElementById("main");
    const prevMain = main?.style.overflow ?? "";
    if (main) main.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      if (main) main.style.overflow = prevMain;
    };
  }, [open]);

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx)
    throw new Error("useMobileNav must be used within MobileNavProvider");
  return ctx;
}

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" />
    </svg>
  );
}

function marketplacePath(path: string) {
  return (
    path === "/marketplace" ||
    path.startsWith("/marketplace/") ||
    path.startsWith("/product/") ||
    path === "/jihozlar"
  );
}

function surplusMobilePath(path: string) {
  if (path === "/ortiqcha-material") return true;
  return /^\/ortiqcha-material\/[^/]+\/?$/.test(path) && !path.startsWith("/ortiqcha-material/elonlarim");
}


function jihozMobilePath(path: string) {
  return path === "/jihozlar" || /^\/jihozlar\/[^/]+\/?$/.test(path);
}





function shopPath(path: string) {
  return (
    marketplacePath(path) ||
    path === "/forma" ||
    (path.startsWith("/forma/") && !path.startsWith("/forma/buyurtmalarim"))
  );
}


function MobileProfileChip() {
  const { ready, profile } = useDoctorProfile();
  if (!ready) {
    return (
      <span
        className="ml-0.5 size-11 animate-pulse rounded-full bg-[#f3f4f8]"
        aria-hidden="true"
      />
    );
  }
  if (!profile) {
    return (
      <Link
        href="/kirish"
        className="ml-0.5 inline-flex h-9 items-center justify-center rounded-full bg-[#0066FF] px-3 text-[12px] font-bold text-white"
      >
        Kirish
      </Link>
    );
  }
  return (
    <Link
      href="/profil"
      className="ml-0.5 grid size-11 place-items-center"
      aria-label="Profil"
    >
      {profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatarUrl}
          alt=""
          width={32}
          height={32}
          className="size-8 rounded-full object-cover ring-2 ring-[#e8eef4]"
        />
      ) : (
        <span className="grid size-8 place-items-center rounded-full bg-[#e8f1ff] text-[11px] font-bold text-[#0066FF] ring-2 ring-[#e8eef4]">
          {initialsFromName(profile.fullName)}
        </span>
      )}
    </Link>
  );
}

function CartButton({ count, blue }: { count: number; blue?: boolean }) {
  return (
    <Link
      href="/savat"
      className="relative grid size-11 place-items-center rounded-xl text-[#1a1d26]"
      aria-label="Savat"
    >
      <ShoppingCart className="size-5" />
      {count > 0 ? (
        <span
          className={cn(
            "absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
            blue ? "bg-[#0066FF]" : "bg-destructive",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

/** Section roots that render the shared MobileSectionHeader instead of this top bar. */
const PHONE14 = new Set([
  "/kategoriyalar",
  "/marketplace/brendlar",
  "/marketplace/aksiyalar",
  "/talim",
  "/mutaxassislar",
  "/sertifikatlar",
  "/crm/bemorlar",
  "/crm/uchrashuvlar",
  "/crm/davolash-rejalari",
  "/crm/tolovlar",
  "/crm/ombor",
  "/crm/hisobotlar",
  "/ustalar",
  "/elonlar",
]);

function isPhone14(pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  if (PHONE14.has(path)) return true;
  return /^\/crm\/(bemorlar|uchrashuvlar|davolash-rejalari|tolovlar)\/[^/]+$/.test(path) || /^\/elonlar\/[^/]+$/.test(path);
}

const SECTION_ROOTS = new Set([
  "/",
  "/seminarlar",
  "/marketplace",
  "/jihozlar",
  "/forma",
  "/ustalar",
  "/ishlar",
  "/laboratoriya",
  "/community",
  "/ortiqcha-material",
  "/kitoblar",
  "/talim",
  "/foydali-kanallar",
  "/mening-klinikam",
  "/yangiliklar",
  "/savat",
  "/buyurtmalarim",
  "/profil",
  "/buyurtma",
]);

export function MobileTopbar() {
  const soon = useSoonToast();
  const pathname = usePathname();
  const onKlinika = pathname === "/klinika" || pathname.startsWith("/klinika/");
  const { count } = useCart();
  if (onKlinika || isPhone14(pathname)) return null;
  // Main section pages draw the unified MobileSectionHeader (title · search · cart · bell) themselves.
  if (SECTION_ROOTS.has(pathname.replace(/\/$/, "") || "/")) return null;
  // Seminar detail page draws its own hero header (back / bookmark / share).
  if (
    /^\/seminarlar\/[^/]+\/?$/.test(pathname) &&
    pathname !== "/seminarlar/yozuvlarim"
  )
    return null;
  // Uzum-style product pages (Marketplace + Forma) draw their own full-bleed hero (back / heart / share).
  if (isProductDetailPath(pathname)) return null;
  // Forma product page draws its own hero header (back / share / favorite).
  if (
    /^\/forma\/[^/]+\/?$/.test(pathname) &&
    !pathname.startsWith("/forma/buyurtmalarim")
  )
    return null;
  // Book detail page draws its own header (back / share / save).
  if (/^\/kitoblar\/[^/]+\/?$/.test(pathname)) return null;
  if (/\/oqish\/?$/.test(pathname) || /\/talim\/[^/]+\/video\/?$/.test(pathname) || /\/seminarlar\/[^/]+\/royxat\/?$/.test(pathname)) return null;
  // Ustalar list + usta profile draw their own headers (mock: logo + "Usta qo‘shish" / back · heart · share).
  if (
    pathname === "/ustalar" ||
    (/^\/ustalar\/[^/]+\/?$/.test(pathname) && !pathname.startsWith("/ustalar/mening") && !pathname.startsWith("/ustalar/sorovlarim"))
  )
    return null;
  // Vacancy detail draws its own hero header (back · heart · share).
  if (/^\/laboratoriya\/[^/]+\/?$/.test(pathname) && !pathname.startsWith("/laboratoriya/buyurtmalarim") && !pathname.startsWith("/laboratoriya/mening")) return null;
  if (/^\/ishlar\/[^/]+\/?$/.test(pathname) && !pathname.startsWith("/ishlar/arizalarim") && !pathname.startsWith("/ishlar/vakansiyalarim")) return null;
  if (/^\/jihozlar\/[^/]+\/?$/.test(pathname)) return null;
  if (/^\/yangiliklar\/[^/]+\/?$/.test(pathname)) return null;
  if (/^\/buyurtmalarim\/[^/]+\/?$/.test(pathname)) return null;
  const onListing = pathname === "/marketplace" || pathname === "/jihozlar";
  const onHome = pathname === "/" || pathname.startsWith("/bosh-sahifa");
  const onSeminarlar =
    pathname === "/seminarlar" ||
    pathname === "/seminarlar/yozuvlarim" ||
    pathname.startsWith("/seminarlar/yozuvlarim/");
  const onUstalar = pathname === "/ustalar" || pathname.startsWith("/ustalar/");
  const onUstaRequests = pathname.startsWith("/ustalar/sorovlarim");
  const onUstalarHome = pathname === "/ustalar";
  const onFormaHome = pathname === "/forma";
  const onCommunityHome = pathname === "/community";
  const onBrandHeader =
    onListing ||
    onHome ||
    onSeminarlar ||
    onUstalarHome ||
    onFormaHome ||
    onCommunityHome;
  const onMarketplace = marketplacePath(pathname);
  const onProduct =
    pathname.startsWith("/marketplace/") || pathname.startsWith("/product/");

  return (
    <header
      className={cn(
        "sticky top-0 z-30 lg:hidden",
        onSeminarlar ? "bg-[#F4F7FC]" : "border-b border-[#eceff5] bg-white",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center gap-0.5 px-2">
        <MobileMenuButton variant="top" />
        {onBrandHeader ? (
          <Link
            href="/"
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-1 py-1 text-left"
            aria-label="Bosh sahifa"
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-[10px]",
                onUstalarHome || onFormaHome || onCommunityHome
                  ? "bg-[#e8f1ff] text-[#0066FF]"
                  : "bg-[#0066FF] text-white",
              )}
            >
              <ToothIcon className="size-5" />
            </span>
            {onSeminarlar ? (
              <span className="min-w-0 leading-[1.1]">
                <span className="block truncate text-[16px] font-extrabold tracking-[0.04em] text-[#0066FF]">
                  STOMA<span className="text-[#0B1F4D]">HUB</span>
                </span>
                <span className="block truncate text-[10px] font-semibold tracking-[0.14em] text-[#8b93a7]">
                  STOMATOLOG KALITI
                </span>
              </span>
            ) : onUstalarHome || onFormaHome || onCommunityHome ? (
              <span className="min-w-0 leading-[1.05]">
                <span className="block truncate text-[15px] font-extrabold tracking-[0.08em] text-[#0066FF]">
                  STOMA<span className="text-[#8b93a7]">HUB</span>
                </span>
              </span>
            ) : onListing ? (
              <span className="min-w-0 truncate text-[13px] font-extrabold tracking-[0.06em]">
                <span className="text-[#0066FF]">STOMA</span>
                <span className="text-[#8b93a7]">HUB</span>
              </span>
            ) : (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[13px] font-extrabold tracking-[0.08em] text-[#0066FF]">
                  STOMAHUB
                </span>
                <span className="block text-[12px] text-[#8b93a7]">
                  Bosh sahifa
                </span>
              </span>
            )}
          </Link>
        ) : (
          <>
            {onMarketplace || onUstalar ? (
              <Link
                href={
                  onProduct ? "/marketplace" : onUstaRequests ? "/ustalar" : "/"
                }
                className="grid size-11 place-items-center rounded-xl text-[#1a1d26]"
                aria-label="Orqaga"
              >
                <ChevronLeft className="size-6" />
              </Link>
            ) : null}
            {onUstalar ? (
              <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold tracking-tight text-[#1a1d26]">
                {onUstaRequests ? "Mening so‘rovlarim" : "Ustalar"}
              </h1>
            ) : (
              <Link
                href="/"
                className="min-w-0 flex-1 text-[15px] font-extrabold tracking-[0.12em] text-[#0066FF]"
              >
                STOMAHUB
              </Link>
            )}
          </>
        )}

        {onFormaHome ? (
          <>
            <button
              type="button"
              onClick={() => soon.show("Shahar tanlash tez orada")}
              className="mr-0.5 inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-[#e8eef4] bg-[#f7f8fb] px-2.5 text-[12px] font-semibold text-[#1a1d26]"
              aria-label="Shahar"
            >
              <MapPin className="size-3.5 text-[#0066FF]" />
              Toshkent
              <ChevronDown className="size-3.5 text-[#8b93a7]" />
            </button>
            {soon.node}
          </>
        ) : null}

        {onCommunityHome ? (
          <div className="relative ml-auto flex items-center gap-0.5">
            <NotificationBell variant="mobile" />
            <button
              type="button"
              className="grid size-11 place-items-center rounded-xl text-[#1a1d26]"
              aria-label="Xabarlar"
            >
              <MessageSquare className="size-5" strokeWidth={1.8} />
            </button>
          </div>
        ) : onSeminarlar ? (
          <div className="ml-auto flex items-center gap-2 pr-1.5">
            <Link
              href="/seminarlar/yozuvlarim"
              data-testid="seminar-my-calendar"
              className="grid size-10 place-items-center rounded-xl border border-[#e3e8f1] bg-white text-[#0B1F4D] shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
              aria-label="Mening yozuvlarim"
            >
              <CalendarDays className="size-5" strokeWidth={1.8} />
            </Link>
            <NotificationBell
              variant="mobile"
              buttonClassName="!size-10 border border-[#e3e8f1] bg-white text-[#0B1F4D] shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
            />
          </div>
        ) : onUstalarHome ? (
          <Link
            href="/ustalar/sorovlarim"
            className="ml-auto inline-flex h-10 min-w-[72px] items-center justify-center rounded-full bg-[#0066FF] px-4 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(0,102,255,0.28)]"
          >
            So‘rov
          </Link>
        ) : onUstaRequests ? (
          <span
            className="ml-auto grid size-11 place-items-center text-[#0066FF]"
            aria-hidden="true"
          >
            <ShieldCheck className="size-5" />
          </span>
        ) : (
          <CartButton
            count={count}
            blue={onMarketplace || onHome || onFormaHome}
          />
        )}

        {onFormaHome ? (
          <MobileProfileChip />
        ) : onCommunityHome ||
          onSeminarlar ||
          onUstalarHome ||
          onUstaRequests ? null : onListing ? (
          <>
            <NotificationBell variant="mobile" />
            <MobileProfileChip />
          </>
        ) : (
          <NotificationBell variant="mobile" />
        )}
      </div>
    </header>
  );
}

const APP_VERSION = "0.1.0";

const GROUP_TONES: Record<string, { bg: string; color: string }> = {
  top: { bg: "#e8f1ff", color: "#0066ff" },
  dokon: { bg: "#e8f1ff", color: "#2563eb" },
  talim: { bg: "#ffe8ee", color: "#e11d48" },
  klinika: { bg: "#e7f6f4", color: "#0d9488" },
  xizmatlar: { bg: "#fff1e6", color: "#ea580c" },
};

function DrawerLink({ item, tone, active, sub = false }: { item: NavItem; tone: { bg: string; color: string }; active: boolean; sub?: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn("flex items-center gap-3 rounded-xl px-2", sub ? "py-1.5" : "py-2", active ? "bg-[#e8f1ff] text-[#0066FF]" : "text-[#1a1d26]")}
      >
        <span className={cn("grid shrink-0 place-items-center rounded-xl", sub ? "size-8" : "size-9")} style={{ background: tone.bg, color: tone.color }}>
          <Icon className={sub ? "size-[18px]" : "size-5"} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className={cn("min-w-0 flex-1 truncate font-semibold", sub ? "text-[14px]" : "text-[15px]")}>{item.label}</span>
        <ChevronRight className="size-4 shrink-0 text-[#8b93a7]" aria-hidden="true" />
      </Link>
    </li>
  );
}

function DrawerNav() {
  const { activeHref, isOpen, toggle } = useNavTree();
  return (
    <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2" aria-label="Bo‘limlar" data-testid="drawer-nav">
      <ul>
        <DrawerLink item={navTop} tone={GROUP_TONES.top} active={desktopItemActive(navTop, activeHref)} />
      </ul>
      {desktopNavGroups.map((group) => {
        const open = isOpen(group.id);
        const tone = GROUP_TONES[group.id] ?? GROUP_TONES.top;
        const links = [...group.items, ...(group.more ?? [])];
        return (
          <section key={group.id} className="border-t border-[#f1f3f8] pt-1" data-group={group.id}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggle(group.id)}
              className="flex w-full items-center gap-2 px-2 pt-2 pb-1.5 text-left text-[12px] font-bold tracking-[0.12em] text-[#8b93a7] uppercase"
            >
              <span className="min-w-0 flex-1 truncate">{group.title}</span>
              <ChevronDown className={cn("size-4 shrink-0 transition-transform", open ? "" : "-rotate-90")} aria-hidden="true" />
            </button>
            {open ? (
              <ul className="pb-1">
                {links.map((item) => (
                  <DrawerLink key={`${item.href}-${item.label}`} item={item} tone={tone} active={desktopItemActive(item, activeHref)} sub />
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
      <ul className="border-t border-[#f1f3f8] pt-1">
        <DrawerLink item={navBottom} tone={GROUP_TONES.top} active={activeHref === navBottom.href} />
      </ul>
    </nav>
  );
}

export function MobileMenuButton({ variant = "bar" }: { variant?: "bar" | "top" }) {
  const { open, setOpen } = useMobileNav();
  return (
    <button
      type="button"
      data-testid="mobile-menu-button"
      className={
        variant === "top"
          ? "grid size-11 shrink-0 place-items-center rounded-xl text-[#1a1d26]"
          : "mh-ic"
      }
      aria-label={open ? "Menyuni yopish" : "Menyu"}
      aria-expanded={open}
      aria-controls="mobile-app-menu"
      onClick={() => setOpen(!open)}
    >
      <Menu className={variant === "top" ? "size-5" : undefined} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

export function MobileDrawer() {
  const { open, setOpen } = useMobileNav();
  const { ready, profile, logout } = useDoctorProfile();
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef({ x: 0, y: 0 });
  const [present, setPresent] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setPresent(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setPresent(false), 300);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 40);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, setOpen]);

  function onTouchStart(event: TouchEvent) {
    const point = event.touches[0];
    touch.current = { x: point.clientX, y: point.clientY };
  }

  function onTouchEnd(event: TouchEvent) {
    const point = event.changedTouches[0];
    const dx = point.clientX - touch.current.x;
    const dy = point.clientY - touch.current.y;
    if (dx < -56 && Math.abs(dx) > Math.abs(dy)) setOpen(false);
  }

  if (!present) return null;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <button
        type="button"
        aria-label="Menyuni yopish"
        className={cn(
          "absolute inset-0 bg-black/50 motion-safe:transition-opacity motion-safe:duration-300",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={() => setOpen(false)}
      />
      <div
        id="mobile-app-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Ilova menyusi"
        data-testid="mobile-app-menu"
        className={cn(
          "absolute inset-y-0 left-0 flex w-[min(85vw,360px)] flex-col bg-white shadow-2xl motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out",
          visible ? "translate-x-0" : "-translate-x-full",
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="relative border-b border-[#eceff5] px-4 pt-[max(16px,env(safe-area-inset-top))] pb-4"
        >
          <button
            ref={closeRef}
            type="button"
            className="absolute top-[max(12px,env(safe-area-inset-top))] right-3 grid size-10 place-items-center rounded-xl text-[#1a1d26]"
            aria-label="Menyuni yopish"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" strokeWidth={2} />
          </button>
          {!ready ? (
            <div className="flex items-center gap-3 pr-12" aria-hidden="true">
              <span className="size-12 animate-pulse rounded-full bg-[#f3f4f8]" />
              <span className="h-4 w-32 animate-pulse rounded bg-[#f3f4f8]" />
            </div>
          ) : profile ? (
            <div className="flex items-center gap-3 pr-12">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- profile photo is a user upload
                <img src={profile.avatarUrl} alt="" className="size-12 rounded-full object-cover" />
              ) : (
                <span className="grid size-12 place-items-center rounded-full bg-[#e8f1ff] text-[15px] font-extrabold text-[#0066FF]">
                  {initialsFromName(profile.fullName)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[16px] font-extrabold text-[#1a1d26]">{profile.fullName}</p>
                <Link href="/profil" className="mt-0.5 inline-flex text-[13px] font-semibold text-[#0066FF]">
                  Profilni ko‘rish
                </Link>
              </div>
            </div>
          ) : (
            <div className="pr-12">
              <p className="text-[15px] font-extrabold text-[#1a1d26]">Hisobingizga kiring</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/kirish"
                  className="inline-flex h-9 items-center rounded-full bg-[#0066FF] px-4 text-[13px] font-bold text-white"
                >
                  Kirish
                </Link>
                <Link
                  href="/royxat"
                  className="inline-flex h-9 items-center rounded-full border border-[#d7e3f4] px-4 text-[13px] font-bold text-[#0066FF]"
                >
                  Ro‘yxatdan o‘tish
                </Link>
              </div>
            </div>
          )}
        </div>
        <DrawerNav />
        <div className="border-t border-[#eceff5] px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]">
          {profile ? (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-[15px] font-semibold text-[#e11d48]"
              onClick={() => {
                void logout();
                setOpen(false);
              }}
            >
              <span className="grid size-9 place-items-center rounded-xl bg-[#ffe8ee] text-[#e11d48]">
                <LogOut className="size-5" strokeWidth={2} aria-hidden="true" />
              </span>
              Chiqish
            </button>
          ) : null}
          <p className="py-2 text-center text-[12px] text-[#8b93a7]">StomaHub · v{APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}

const homeTabs = [
  { href: "/", label: "Bosh sahifa", icon: Home, match: (path: string) => path === "/" || path.startsWith("/bosh-sahifa") || path === "/kitoblar" || path === "/foydali-kanallar" },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, match: (path: string) => marketplacePath(path) || path === "/savat" || path === "/buyurtma" || path.startsWith("/buyurtma/") || /^\/buyurtmalarim\/[^/]+/.test(path) || surplusMobilePath(path) || jihozMobilePath(path) },
  { href: "/seminarlar", label: "Seminarlar", icon: CalendarDays, match: (path: string) => path === "/seminarlar" || path.startsWith("/seminarlar/") },
  { href: "/talim", label: "Onlayn darslar", icon: MonitorPlay, match: (path: string) => path === "/talim" || path.startsWith("/talim/") },
  { href: "/profil", label: "Profil", icon: User, match: (path: string) => path === "/profil" || path.startsWith("/profil/") || path === "/community" || path === "/mening-klinikam" || path === "/buyurtmalarim" },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();
  const onKlinika = pathname === "/klinika" || pathname.startsWith("/klinika/");
  if (onKlinika || isPhone14(pathname) || /\/oqish\/?$/.test(pathname) || /\/talim\/[^/]+\/video\/?$/.test(pathname) || /\/seminarlar\/[^/]+\/royxat\/?$/.test(pathname)) return null;
  return (
    <nav aria-label="Mobil menyu" className="mh-tabs lg:hidden">
      {homeTabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.match(pathname);
        return (
          <Link key={tab.href} href={tab.href} className={active ? "on" : undefined}>
            <Icon strokeWidth={active ? 2.4 : 1.8} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

function isProductDetailPath(path: string) {
  if (path.startsWith("/product/")) return true;
  if (/^\/ortiqcha-material\/[^/]+\/?$/.test(path) && !path.startsWith("/ortiqcha-material/elonlarim")) return true;
  if (/^\/forma\/[^/]+\/?$/.test(path) && !path.startsWith("/forma/buyurtmalarim")) return true;
  if (/^\/jihozlar\/[^/]+\/?$/.test(path)) return true;
  if (!path.startsWith("/marketplace/")) return false;
  if (path.startsWith("/marketplace/dokon")) return false;
  if (path.startsWith("/marketplace/sotuvchi")) return false;
  return true;
}

function showCartBar(path: string) {
  if (path === "/marketplace/brendlar" || path === "/marketplace/aksiyalar") return false;
  return (
    shopPath(path) &&
    !isProductDetailPath(path) &&
    path !== "/savat" &&
    !path.startsWith("/buyurtma") &&
    path !== "/cart" &&
    path !== "/checkout"
  );
}

export function MobileCartPad() {
  const pathname = usePathname();
  const { count } = useCart();
  if (count === 0 || !showCartBar(pathname)) return null;
  return <div className="h-14 lg:hidden" aria-hidden="true" />;
}

export function MobileCartBar() {
  const pathname = usePathname();
  const { count, subtotal } = useCart();
  if (count === 0 || !showCartBar(pathname)) return null;

  return (
    <div
      className="fixed inset-x-3 z-30 lg:hidden"
      style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}
    >
      <Link
        href="/savat"
        className="flex h-[52px] items-center gap-3 rounded-2xl border border-[#e8eef8] bg-white px-3 text-[#1a1d26] shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
      >
        <span className="relative grid size-10 place-items-center rounded-xl bg-[#e8f1ff] text-[#0066FF]">
          <ShoppingCart className="size-5" />
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#0066FF] text-[9px] font-bold text-white">
            {count}
          </span>
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[14px] font-bold">Savat</span>
          <span className="block text-[12px] text-[#8b93a7]">
            {count} ta mahsulot
          </span>
        </span>
        <span className="ml-auto text-right leading-tight">
          <span className="block text-[11px] text-[#8b93a7]">Jami:</span>
          <span className="block text-[14px] font-bold text-[#0066FF]">
            {formatMoney(subtotal, "UZS")}
          </span>
        </span>
      </Link>
    </div>
  );
}
