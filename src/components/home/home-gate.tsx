"use client";

import { LandingPage } from "@/components/landing/landing-page";
import { HomeDashboard } from "@/components/home/dashboard";
import { useDoctorProfile } from "@/components/doctor-profile-provider";

/**
 * Guests see marketing landing at `/`.
 * Authenticated doctors see the app dashboard.
 * Until profile is read from localStorage, render a neutral shell (SSR/client match).
 */
export function HomeGate() {
  const { ready, profile } = useDoctorProfile();

  if (!ready) {
    return (
      <div className="min-h-[60vh] bg-[#F4F7FC]" aria-busy="true" aria-label="Yuklanmoqda">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200/80" />
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-slate-200/60" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200/50" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200/50" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <LandingPage />;
  }

  return <HomeDashboard />;
}
