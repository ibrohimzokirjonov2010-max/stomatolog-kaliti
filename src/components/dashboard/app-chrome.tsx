"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import DesktopHomePage from "@/components/home/desktop/HomePage";
import { MarketCatalog } from "@/components/shop/desktop/MarketCatalog";
import { BrandsDesktop } from "@/components/shop/desktop/BrandsDesktop";
import { AksiyalarDesktop } from "@/components/shop/desktop/AksiyalarDesktop";
import { MarketProduct } from "@/components/shop/desktop/MarketProduct";
import { SurplusCatalog } from "@/components/shop/desktop/SurplusCatalog";
import { SurplusDetail } from "@/components/shop/desktop/SurplusDetail";
import { isMarketId, isSurplusId } from "@/data/desktop-shop";
import { SeminarList } from "@/components/seminars/desktop/SeminarList";
import { SeminarDetail } from "@/components/seminars/desktop/SeminarDetail";
import { isDesktopSeminarId } from "@/data/desktop-seminars";
import { OnlaynDarslarDesktop } from "@/components/education/desktop/OnlaynDarslarDesktop";
import { KitoblarDesktop } from "@/components/hub/desktop/KitoblarDesktop";
import { KanallarDesktop } from "@/components/hub/desktop/KanallarDesktop";
import { CommunityDesktop } from "@/components/hub/desktop/CommunityDesktop";
import { KlinikaDesktop } from "@/components/hub/desktop/KlinikaDesktop";
import { FormaCatalog } from "@/components/forma/desktop/FormaCatalog";
import { FormaProduct } from "@/components/forma/desktop/FormaProduct";
import { getDesktopForma } from "@/data/desktop-forma";
import { JihozCatalog } from "@/components/jihoz/desktop/JihozCatalog";
import { JihozProduct } from "@/components/jihoz/desktop/JihozProduct";
import { getDesktopJihoz } from "@/data/desktop-jihozlar";
import { JobsDesktop } from "@/components/jobs/desktop/JobsDesktop";
import { NewsDesktop } from "@/components/news/desktop/NewsDesktop";
import { UstaCatalog } from "@/components/ustalar/desktop/UstaCatalog";
import { UstaProfileDesktop } from "@/components/ustalar/desktop/UstaProfileDesktop";
import { getDesktopUsta } from "@/data/desktop-ustalar";
import { SavatDesktop } from "@/components/savat/desktop/SavatDesktop";
import { OrdersDesktop } from "@/components/savat/desktop/OrdersDesktop";
import { ProfilDesktop } from "@/components/profil/desktop/ProfilDesktop";
import { useDoctorProfile } from "@/components/doctor-profile-provider";

/** Routes that render without sidebar / topbar / mobile chrome. */
const BARE_PREFIXES = ["/landing", "/kirish", "/royxat", "/admin", "/maxfiylik", "/shartlar", "/hisobni-ochirish"];

function isBarePath(pathname: string | null) {
  if (!pathname) return false;
  return BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, profile } = useDoctorProfile();
  /** Guests on `/` get landing without app chrome; avoid chrome flash while hydrating. */
  const guestHome = pathname === "/" && (!ready || !profile);
  const bare = isBarePath(pathname) || guestHome;
  /** Logged-in "/" is the desktop Bosh sahifa. Mobile keeps the existing shell. */
  const loggedInHome = pathname === "/" && ready && Boolean(profile);

  useEffect(() => {
    const body = document.body;
    if (bare) {
      body.classList.remove("overflow-hidden");
      body.classList.add("overflow-auto");
    } else {
      body.classList.remove("overflow-auto");
      body.classList.add("overflow-hidden");
    }
    return () => {
      body.classList.remove("overflow-auto");
      body.classList.add("overflow-hidden");
    };
  }, [bare]);

  const shop = desktopShop(pathname) ?? desktopSeminar(pathname) ?? desktopHub(pathname) ?? desktopForma(pathname) ?? desktopJihoz(pathname) ?? desktopJobs(pathname) ?? desktopNews(pathname) ?? desktopUsta(pathname) ?? desktopCart(pathname);

  if (loggedInHome) {
    return (
      <>
        <div className="home-desktop-scroll hidden lg:block">
          <DesktopHomePage />
        </div>
        <div className="lg:hidden">
          <DashboardShell>{children}</DashboardShell>
        </div>
      </>
    );
  }

  if (shop) {
    return (
      <>
        <div className="home-desktop-scroll hidden lg:block">
          <Suspense fallback={<div className="sh" aria-busy="true" />}>{shop}</Suspense>
        </div>
        <div className="lg:hidden">
          <DashboardShell>{children}</DashboardShell>
        </div>
      </>
    );
  }

  if (bare) {
    return (
      <div className="min-h-full bg-[#F4F7FC]">
        <main id="main">{children}</main>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}

function desktopShop(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/marketplace") return <MarketCatalog />;
  if (pathname === "/marketplace/brendlar") return <BrandsDesktop />;
  if (pathname === "/marketplace/aksiyalar") return <AksiyalarDesktop />;
  const brandPage = pathname.match(/^\/marketplace\/brendlar\/([^/]+)$/);
  if (brandPage) return <BrandsDesktop slug={decodeURIComponent(brandPage[1])} />;
  if (pathname === "/ortiqcha-material") return <SurplusCatalog />;
  const market = pathname.match(/^\/marketplace\/([^/]+)$/);
  if (market && market[1] !== "sotuvchi" && isMarketId(market[1])) return <MarketProduct id={market[1]} />;
  const surplus = pathname.match(/^\/ortiqcha-material\/([^/]+)$/);
  if (surplus && surplus[1] !== "elonlarim" && isSurplusId(surplus[1])) return <SurplusDetail id={surplus[1]} />;
  return null;
}

function desktopHub(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/talim") return <OnlaynDarslarDesktop />;
  if (pathname === "/kitoblar") return <KitoblarDesktop />;
  if (pathname === "/foydali-kanallar") return <KanallarDesktop />;
  if (pathname === "/community") return <CommunityDesktop />;
  if (pathname === "/mening-klinikam") return <KlinikaDesktop />;
  return null;
}

function desktopForma(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/forma") return <FormaCatalog />;
  const match = pathname.match(/^\/forma\/([^/]+)$/);
  if (!match || match[1] === "buyurtmalarim") return null;
  if (!getDesktopForma(match[1])) return null;
  return <FormaProduct slug={match[1]} />;
}

function desktopJihoz(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/jihozlar") return <JihozCatalog />;
  const match = pathname.match(/^\/jihozlar\/([^/]+)$/);
  if (!match) return null;
  if (!getDesktopJihoz(match[1])) return null;
  return <JihozProduct slug={match[1]} />;
}

function desktopJobs(pathname: string | null): ReactNode | null {
  if (pathname === "/ishlar") return <JobsDesktop />;
  return null;
}

function desktopNews(pathname: string | null): ReactNode | null {
  if (pathname === "/yangiliklar") return <NewsDesktop />;
  return null;
}

function desktopUsta(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/ustalar") return <UstaCatalog />;
  const match = pathname.match(/^\/ustalar\/([^/]+)$/);
  if (!match || match[1] === "mening" || match[1] === "sorovlarim") return null;
  if (!getDesktopUsta(match[1])) return null;
  return <UstaProfileDesktop slug={match[1]} />;
}

function desktopCart(pathname: string | null): ReactNode | null {
  if (pathname === "/savat") return <SavatDesktop />;
  if (pathname === "/buyurtmalarim") return <OrdersDesktop />;
  if (pathname === "/profil") return <ProfilDesktop />;
  return null;
}

function desktopSeminar(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/seminarlar") return <SeminarList />;
  const match = pathname.match(/^\/seminarlar\/([^/]+)$/);
  if (!match) return null;
  const id = match[1];
  if (id === "yozuvlarim" || id === "tashkilotchi" || id === "chiptalarim") return null;
  if (isDesktopSeminarId(id)) return <SeminarDetail id={id} />;
  return null;
}
