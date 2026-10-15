"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import DesktopHomePage from "@/components/home/desktop/HomePage";
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

  if (bare) {
    return (
      <div className="min-h-full bg-[#F4F7FC]">
        <main id="main">{children}</main>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
