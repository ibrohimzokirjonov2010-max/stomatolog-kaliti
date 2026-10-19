"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import DesktopHomePage from "@/components/home/desktop/HomePage";
import { MarketCatalog } from "@/components/shop/desktop/MarketCatalog";
import { KategoriyalarDesktop } from "@/components/shop/desktop/KategoriyalarDesktop";
import { BrandsDesktop } from "@/components/shop/desktop/BrandsDesktop";
import { AksiyalarDesktop } from "@/components/shop/desktop/AksiyalarDesktop";
import { MarketProduct } from "@/components/shop/desktop/MarketProduct";
import { SurplusDesktopCatalog } from "@/components/shop/desktop/SurplusDesktopCatalog";
import { SurplusDesktopDetail } from "@/components/shop/desktop/SurplusDesktopDetail";
import { isMarketId } from "@/data/desktop-shop";
import { SeminarsDesktop } from "@/components/seminars/desktop/SeminarsDesktop";
import { SeminarPageDesktop } from "@/components/seminars/desktop/SeminarPageDesktop";
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
import { NewsArticleDesktop } from "@/components/news/desktop/NewsArticleDesktop";
import { getDesktopArticle } from "@/data/desktop-news";
import { MutaxassislarDesktop } from "@/components/specialists/desktop/MutaxassislarDesktop";
import { MutaxassisProfileDesktop } from "@/components/specialists/desktop/MutaxassisProfileDesktop";
import { getSpecialist } from "@/data/desktop-specialists";
import { UstaCatalog } from "@/components/ustalar/desktop/UstaCatalog";
import { UstaProfileDesktop } from "@/components/ustalar/desktop/UstaProfileDesktop";
import { getDesktopUsta } from "@/data/desktop-ustalar";
import { SavatDesktop } from "@/components/savat/desktop/SavatDesktop";
import { OrdersDesktop } from "@/components/savat/desktop/OrdersDesktop";
import { ProfilDesktop } from "@/components/profil/desktop/ProfilDesktop";
import { CertificatesDesktop } from "@/components/crm/desktop/CertificatesDesktop";
import { PatientsDesktop } from "@/components/crm/desktop/PatientsDesktop";
import { AppointmentsDesktop } from "@/components/crm/desktop/AppointmentsDesktop";
import { PlansDesktop } from "@/components/crm/desktop/PlansDesktop";
import { PaymentsDesktop } from "@/components/crm/desktop/PaymentsDesktop";
import { StockDesktop } from "@/components/crm/desktop/StockDesktop";
import { CrmStubDesktop } from "@/components/crm/desktop/CrmStubDesktop";
import { PatientProfileDesktop } from "@/components/crm/desktop/PatientProfileDesktop";
import { ReportsDesktop } from "@/components/crm/desktop/ReportsDesktop";
import { CheckoutDesktop } from "@/components/checkout/desktop/CheckoutDesktop";
import { TrackDesktop } from "@/components/orders/desktop/TrackDesktop";
import { BookProductDesktop } from "@/components/books/desktop/BookProductDesktop";
import { ReaderDesktop } from "@/components/books/desktop/ReaderDesktop";
import { ListingDetailDesktop, ListingsDesktop } from "@/components/crm/desktop/ListingsDesktop";
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

  const shop = desktopShop(pathname) ?? desktopSeminar(pathname) ?? desktopHub(pathname) ?? desktopForma(pathname) ?? desktopJihoz(pathname) ?? desktopJobs(pathname) ?? desktopNews(pathname) ?? desktopSpec(pathname) ?? desktopUsta(pathname) ?? desktopCart(pathname) ?? desktopFlow(pathname) ?? desktopCrm(pathname);

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
  if (pathname === "/kategoriyalar") return <KategoriyalarDesktop />;
  if (pathname === "/marketplace") return <MarketCatalog />;
  if (pathname === "/marketplace/brendlar") return <BrandsDesktop />;
  if (pathname === "/marketplace/aksiyalar") return <AksiyalarDesktop />;
  const brandPage = pathname.match(/^\/marketplace\/brendlar\/([^/]+)$/);
  if (brandPage) return <BrandsDesktop slug={decodeURIComponent(brandPage[1])} />;
  if (pathname === "/ortiqcha-material") return <SurplusDesktopCatalog />;
  const market = pathname.match(/^\/marketplace\/([^/]+)$/);
  if (market && market[1] !== "sotuvchi" && isMarketId(market[1])) return <MarketProduct id={market[1]} />;
  const surplus = pathname.match(/^\/ortiqcha-material\/([^/]+)$/);
  // Real listings (DB): every /ortiqcha-material/:id except own sub-pages.
  if (surplus && surplus[1] !== "elonlarim") return <SurplusDesktopDetail id={decodeURIComponent(surplus[1])} />;
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
  const match = pathname?.match(/^\/yangiliklar\/([^/]+)$/);
  if (match && getDesktopArticle(decodeURIComponent(match[1]))) return <NewsArticleDesktop id={decodeURIComponent(match[1])} />;
  return null;
}

function desktopSpec(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/mutaxassislar") return <MutaxassislarDesktop />;
  const match = pathname.match(/^\/mutaxassislar\/([^/]+)$/);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  if (!getSpecialist(id)) return null;
  return <MutaxassisProfileDesktop id={id} />;
}

function desktopUsta(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/ustalar") return <UstaCatalog />;
  const match = pathname.match(/^\/ustalar\/([^/]+)$/);
  if (!match || match[1] === "mening" || match[1] === "sorovlarim") return null;
  const slug = decodeURIComponent(match[1]);
  // Design samples by slug; database masters by UUID (loaded client-side from the moderated catalog).
  if (!getDesktopUsta(slug) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) return null;
  return <UstaProfileDesktop slug={slug} />;
}

function desktopCart(pathname: string | null): ReactNode | null {
  if (pathname === "/savat") return <SavatDesktop />;
  if (pathname === "/buyurtmalarim") return <OrdersDesktop />;
  if (pathname === "/profil") return <ProfilDesktop />;
  return null;
}

function desktopCrm(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/sertifikatlar") return <CertificatesDesktop />;
  if (pathname === "/crm/bemorlar" || pathname === "/crm/bemorlar/yangi") return <PatientsDesktop />;
  const patient = pathname.match(/^\/crm\/bemorlar\/([^/]+)$/);
  if (patient) return <PatientProfileDesktop id={decodeURIComponent(patient[1])} />;
  if (pathname === "/crm/uchrashuvlar" || pathname === "/crm/uchrashuvlar/yangi") return <AppointmentsDesktop />;
  if (pathname === "/crm/davolash-rejalari" || pathname === "/crm/davolash-rejalari/yangi") return <PlansDesktop />;
  if (pathname === "/crm/tolovlar" || pathname === "/crm/tolovlar/yangi") return <PaymentsDesktop />;
  if (pathname === "/crm/ombor") return <StockDesktop />;
  if (pathname === "/crm/xizmatlar") return <CrmStubDesktop active="services" title="Xizmatlar" text="Klinika xizmatlari narxlari shu bo‘limda yuritiladi." />;
  if (pathname === "/crm/hisobotlar") return <ReportsDesktop />;
  if (pathname === "/elonlar") return <ListingsDesktop />;
  const listing = pathname.match(/^\/elonlar\/([^/]+)$/);
  if (listing) return <ListingDetailDesktop id={decodeURIComponent(listing[1])} />;
  return null;
}

function desktopFlow(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/buyurtma" || pathname === "/checkout") return <CheckoutDesktop />;
  const track = pathname.match(/^\/buyurtmalarim\/([^/]+)$/);
  if (track) return <TrackDesktop id={decodeURIComponent(track[1])} />;
  const read = pathname.match(/^\/kitoblar\/([^/]+)\/oqish$/);
  if (read) return <ReaderDesktop id={decodeURIComponent(read[1])} />;
  const book = pathname.match(/^\/kitoblar\/([^/]+)$/);
  if (book) return <BookProductDesktop id={decodeURIComponent(book[1])} />;
  return null;
}

function desktopSeminar(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/seminarlar") return <SeminarsDesktop />;
  const match = pathname.match(/^\/seminarlar\/([^/]+)$/);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  if (id === "yozuvlarim" || id === "tashkilotchi" || id === "chiptalarim") return null;
  // One source of truth: the shared catalog (real + demo seed + organizer seminars from the DB).
  return <SeminarPageDesktop id={id} />;
}
