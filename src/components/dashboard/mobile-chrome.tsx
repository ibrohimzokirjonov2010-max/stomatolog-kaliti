"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Home,
  MapPin,
  Menu,
  MessageSquare,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { initialsFromName } from "@/lib/doctor-profile";
import { Sidebar } from "@/components/dashboard/sidebar";
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
    return () => {
      document.body.style.overflow = previous;
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

function formaMobilePath(path: string) {
  if (path === "/forma") return true;
  return /^\/forma\/[^/]+\/?$/.test(path) && !path.startsWith("/forma/buyurtmalarim");
}

function seminarMobilePath(path: string) {
  if (path === "/seminarlar") return true;
  const match = path.match(/^\/seminarlar\/([^/]+)\/?$/);
  if (!match) return false;
  return !["yozuvlarim", "tashkilotchi", "chiptalarim", "chipta"].includes(match[1]);
}

function marketMobilePath(path: string) {
  if (path === "/marketplace") return true;
  if (!path.startsWith("/marketplace/")) return false;
  if (path.startsWith("/marketplace/dokon")) return false;
  if (path.startsWith("/marketplace/sotuvchi")) return false;
  return true;
}

function shopPath(path: string) {
  return (
    marketplacePath(path) ||
    path === "/forma" ||
    (path.startsWith("/forma/") && !path.startsWith("/forma/buyurtmalarim"))
  );
}

const tabs = [
  {
    href: "/",
    label: "Bosh sahifa",
    icon: "/icons/bosh-sahifa-128.png",
    match: (path: string) => path === "/" || path.startsWith("/bosh-sahifa"),
  },
  {
    href: "/seminarlar",
    label: "Seminarlar",
    icon: "/icons/seminarlar-128.png",
    match: (path: string) =>
      path === "/seminarlar" || path.startsWith("/seminarlar/"),
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    icon: "/icons/marketplace-128.png",
    match: (path: string) => marketplacePath(path) || path === "/savat" || path === "/buyurtma",
  },
  {
    href: "/forma",
    label: "Forma",
    icon: "/icons/forma-128.png",
    match: (path: string) =>
      path === "/forma" ||
      (path.startsWith("/forma/") && !path.startsWith("/forma/buyurtmalarim")),
  },
  {
    href: "/profil",
    label: "Profil",
    icon: "/icons/profil-128.png",
    match: (path: string) => path === "/profil" || path.startsWith("/profil/"),
  },
] as const;

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
]);

export function MobileTopbar() {
  const soon = useSoonToast();
  const pathname = usePathname();
  const onKlinika = pathname === "/klinika" || pathname.startsWith("/klinika/");
  const { open, setOpen } = useMobileNav();
  const { count } = useCart();
  if (onKlinika) return null;
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
  // Ustalar list + usta profile draw their own headers (mock: logo + "Usta qo‘shish" / back · heart · share).
  if (
    pathname === "/ustalar" ||
    (/^\/ustalar\/[^/]+\/?$/.test(pathname) && !pathname.startsWith("/ustalar/mening") && !pathname.startsWith("/ustalar/sorovlarim"))
  )
    return null;
  // Vacancy detail draws its own hero header (back · heart · share).
  if (/^\/laboratoriya\/[^/]+\/?$/.test(pathname) && !pathname.startsWith("/laboratoriya/buyurtmalarim") && !pathname.startsWith("/laboratoriya/mening")) return null;
  if (/^\/ishlar\/[^/]+\/?$/.test(pathname) && !pathname.startsWith("/ishlar/arizalarim") && !pathname.startsWith("/ishlar/vakansiyalarim")) return null;
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
        {onBrandHeader ? (
          <button
            type="button"
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-1 py-1 text-left"
            aria-label="Menyu"
            onClick={() => setOpen(!open)}
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
          </button>
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
            <button
              type="button"
              className={cn(
                "grid size-11 place-items-center rounded-xl text-[#1a1d26]",
                onUstalar && "hidden",
              )}
              aria-label={open ? "Menyuni yopish" : "Menyu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
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

export function MobileDrawer() {
  const { open, setOpen } = useMobileNav();

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <button
        type="button"
        aria-label="Menyuni yopish"
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-[min(100%,232px)] bg-white shadow-2xl transition-transform duration-200",
          open
            ? "translate-x-0 pointer-events-auto"
            : "pointer-events-none -translate-x-full",
        )}
      >
        <Sidebar />
      </div>
    </div>
  );
}

const homeTabs = [
  { href: "/", label: "Bosh sahifa", icon: Home, match: (path: string) => path === "/" || path.startsWith("/bosh-sahifa") || path === "/talim" || path === "/kitoblar" || path === "/foydali-kanallar" },
  { href: "/seminarlar", label: "Seminarlar", icon: CalendarDays, match: (path: string) => path === "/seminarlar" || path.startsWith("/seminarlar/") },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, match: (path: string) => marketplacePath(path) || path === "/savat" || path === "/buyurtma" || surplusMobilePath(path) },
  { href: "/forma", label: "Forma", icon: Shirt, match: (path: string) => path === "/forma" || (path.startsWith("/forma/") && !path.startsWith("/forma/buyurtmalarim")) },
  { href: "/profil", label: "Profil", icon: User, match: (path: string) => path === "/profil" || path.startsWith("/profil/") || path === "/community" || path === "/mening-klinikam" },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();
  const onKlinika = pathname === "/klinika" || pathname.startsWith("/klinika/");
  if (onKlinika) return null;
  if (pathname === "/" || pathname === "/talim" || pathname === "/kitoblar" || pathname === "/foydali-kanallar" || pathname === "/community" || pathname === "/mening-klinikam" || formaMobilePath(pathname) || surplusMobilePath(pathname) || marketMobilePath(pathname) || seminarMobilePath(pathname)) {
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

  return (
    <nav aria-label="Mobil menyu" className="mh-tabs lg:hidden">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link key={tab.href} href={tab.href} className={active ? "on" : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tab.icon} alt="" width={24} height={24} />
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
  if (!path.startsWith("/marketplace/")) return false;
  if (path.startsWith("/marketplace/dokon")) return false;
  if (path.startsWith("/marketplace/sotuvchi")) return false;
  return true;
}

function showCartBar(path: string) {
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
