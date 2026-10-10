"use client";

import { AdBanner } from "@/components/ad-banner";
import { SeminarDesktop } from "@/components/seminar-desktop";
import { SeminarListMobile } from "@/components/seminar-mobile-list";

export function SeminarBrowse() {
  return (
    <div>
      <AdBanner placement="seminar" />
      {/* ── MOBILE ── */}
      <div className="lg:hidden">
        <SeminarListMobile />
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden lg:block">
        <SeminarDesktop />
      </div>
    </div>
  );
}
