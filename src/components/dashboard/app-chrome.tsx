"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import DesktopHomePage from "@/components/home/desktop/HomePage";
import { MarketCatalog } from "@/components/shop/desktop/MarketCatalog";
import { KategoriyalarDesktop } from "@/components/shop/desktop/KategoriyalarDesktop";
import { BrandsDesktop } from "@/components/shop/desktop/BrandsDesktop";
import { AksiyalarDesktop } from "@/components/shop/desktop/AksiyalarDesktop";
import { SurplusDesktopCatalog } from "@/components/shop/desktop/SurplusDesktopCatalog";
import { SurplusDesktopDetail } from "@/components/shop/desktop/SurplusDesktopDetail";
import { SeminarList } from "@/components/seminars/desktop/SeminarList";
import { TalimDesktop } from "@/components/hub/desktop/TalimDesktop";
import { KitoblarDesktop } from "@/components/hub/desktop/KitoblarDesktop";
import { KanallarDesktop } from "@/components/hub/desktop/KanallarDesktop";
import { CommunityDesktop } from "@/components/hub/desktop/CommunityDesktop";
import { KlinikaDesktop } from "@/components/hub/desktop/KlinikaDesktop";
import { FormaCatalog } from "@/components/forma/desktop/FormaCatalog";
import { JihozCatalog } from "@/components/jihoz/desktop/JihozCatalog";
import { JobsDesktop } from "@/components/jobs/desktop/JobsDesktop";
import { NewsDesktop } from "@/components/news/desktop/NewsDesktop";
import { MutaxassislarDesktop } from "@/components/specialists/desktop/MutaxassislarDesktop";
import { MutaxassisProfileDesktop } from "@/components/specialists/desktop/MutaxassisProfileDesktop";
import { UstaCatalog } from "@/components/ustalar/desktop/UstaCatalog";
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
import { BookProductDesktop } from "@/components/books/desktop/BookProductDesktop";
import { ReaderDesktop } from "@/components/books/desktop/ReaderDesktop";
import { ListingDetailDesktop, ListingsDesktop } from "@/components/crm/desktop/ListingsDesktop";
import { CatalogProductDesktop } from "@/components/shop/desktop/CatalogProductDesktop";
import { UstaProfileDesktop } from "@/components/ustalar/desktop/UstaProfileDesktop";
import { AddFormDesktop } from "@/components/add-forms/AddFormDesktop";
import { ElonForm } from "@/components/add-forms/ElonForm";
import { UstaForm } from "@/components/add-forms/UstaForm";
import { LabForm } from "@/components/add-forms/LabForm";
import { JobForm } from "@/components/add-forms/JobForm";
import { useDoctorProfile } from "@/components/doctor-profile-provider";

/** Routes that render without sidebar / topbar / mobile chrome. */
const BARE_PREFIXES = ["/landing", "/kirish", "/royxat", "/admin", "/maxfiylik", "/shartlar", "/hisobni-ochirish"];

function isBarePath(pathname: string | null) {
  if (!pathname) return false;
  return BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function needsAccount(pathname: string) {
  if (pathname === "/profil" || pathname === "/buyurtmalarim" || pathname.startsWith("/buyurtmalarim/")) return true;
  if (pathname === "/buyurtma" || pathname === "/checkout") return true;
  if (pathname.startsWith("/crm/")) return true;
  if (pathname === "/bildirishnomalar" || pathname === "/profil/manzillar" || pathname === "/seminarlar/mening") return true;
  return false;
}

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, profile } = useDoctorProfile();
  const gated = Boolean(pathname && needsAccount(pathname));
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

  useEffect(() => {
    if (!ready || profile || !pathname || !gated) return;
    router.replace(`/kirish?next=${encodeURIComponent(pathname)}`);
  }, [gated, pathname, profile, ready, router]);

  const shop = desktopShop(pathname) ?? desktopAdd(pathname) ?? desktopSeminar(pathname) ?? desktopHub(pathname) ?? desktopForma(pathname) ?? desktopJihoz(pathname) ?? desktopJobs(pathname) ?? desktopNews(pathname) ?? desktopSpec(pathname) ?? desktopUsta(pathname) ?? desktopCart(pathname) ?? desktopFlow(pathname) ?? desktopCrm(pathname);

  if (gated && ready && !profile) {
    return <div className="grid min-h-[50vh] place-items-center text-sm text-slate-500">Hisobga kirish kerak.</div>;
  }

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
  const product = pathname.match(/^\/(?:marketplace|product)\/([0-9a-f-]{36})$/i);
  if (product) return <CatalogProductDesktop id={product[1]} />;
  const surplus = pathname.match(/^\/ortiqcha-material\/([^/]+)$/);
  if (surplus && surplus[1] !== "elonlarim") return <SurplusDesktopDetail id={decodeURIComponent(surplus[1])} />;
  return null;
}

function desktopHub(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/talim") return <TalimDesktop />;
  if (pathname === "/kitoblar") return <KitoblarDesktop />;
  if (pathname === "/foydali-kanallar") return <KanallarDesktop />;
  if (pathname === "/community") return <CommunityDesktop />;
  if (pathname === "/mening-klinikam") return <KlinikaDesktop />;
  return null;
}

function desktopAdd(pathname: string | null): ReactNode | null {
  if (pathname === "/elonlar/yangi") return <AddFormDesktop searchPath="/elonlar" placeholder="E‘lonlar bo‘yicha qidiring..."><ElonForm /></AddFormDesktop>;
  if (pathname === "/ustalar/yangi") return <AddFormDesktop searchPath="/ustalar" placeholder="Usta yoki xizmat bo‘yicha qidiring..."><UstaForm /></AddFormDesktop>;
  if (pathname === "/laboratoriya/yangi") return <AddFormDesktop searchPath="/laboratoriya" placeholder="Laboratoriya bo‘yicha qidiring..."><LabForm /></AddFormDesktop>;
  if (pathname === "/ishlar/yangi") return <AddFormDesktop searchPath="/ishlar" placeholder="Lavozim, klinika yoki shahar bo‘yicha qidirish..."><JobForm /></AddFormDesktop>;
  return null;
}

function desktopForma(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/forma") return <FormaCatalog />;
  const item = pathname.match(/^\/forma\/([^/]+)$/);
  if (item && item[1] !== "buyurtmalarim") return <CatalogProductDesktop id={decodeURIComponent(item[1])} expect="forma" />;
  return null;
}

function desktopJihoz(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/jihozlar") return <JihozCatalog />;
  const item = pathname.match(/^\/jihozlar\/([^/]+)$/);
  if (item) return <CatalogProductDesktop id={decodeURIComponent(item[1])} expect="jihozlar" />;
  return null;
}

function desktopJobs(pathname: string | null): ReactNode | null {
  if (pathname === "/ishlar") return <JobsDesktop />;
  return null;
}

function desktopNews(pathname: string | null): ReactNode | null {
  if (pathname === "/yangiliklar") return <NewsDesktop />;
  return null;
}

function desktopSpec(pathname: string | null): ReactNode | null {
  if (pathname === "/mutaxassislar") return <MutaxassislarDesktop />;
  const profile = pathname?.match(/^\/mutaxassislar\/([^/]+)$/);
  if (profile) return <MutaxassisProfileDesktop id={decodeURIComponent(profile[1])} />;
  return null;
}

function desktopUsta(pathname: string | null): ReactNode | null {
  if (pathname === "/ustalar") return <UstaCatalog />;
  const usta = pathname?.match(/^\/ustalar\/([^/]+)$/);
  if (usta && !["mening", "sorovlarim", "yangi"].includes(usta[1])) return <UstaProfileDesktop slug={decodeURIComponent(usta[1])} />;
  return null;
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
  if (pathname === "/elonlar/yangi") return null;
  const listing = pathname.match(/^\/elonlar\/([^/]+)$/);
  if (listing) return <ListingDetailDesktop id={decodeURIComponent(listing[1])} />;
  return null;
}

function desktopFlow(pathname: string | null): ReactNode | null {
  if (!pathname) return null;
  if (pathname === "/buyurtma" || pathname === "/checkout") return <CheckoutDesktop />;
  const read = pathname.match(/^\/kitoblar\/([^/]+)\/oqish$/);
  if (read) return <ReaderDesktop id={decodeURIComponent(read[1])} />;
  const book = pathname.match(/^\/kitoblar\/([^/]+)$/);
  if (book) return <BookProductDesktop id={decodeURIComponent(book[1])} />;
  return null;
}

function desktopSeminar(pathname: string | null): ReactNode | null {
  if (pathname === "/seminarlar") return <SeminarList />;
  return null;
}
