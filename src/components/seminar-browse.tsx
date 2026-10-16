"use client";

import { AdBanner } from "@/components/ad-banner";
import { SeminarDesktop } from "@/components/seminar-desktop";
import { SeminarMobileList } from "@/components/seminars/mobile/SeminarMobileList";

export function SeminarBrowse() {
  return (
    <div>
      <AdBanner placement="seminar" className="hidden lg:block" />
      <SeminarMobileList />

      {/* ── DESKTOP ── */}
      <div className="hidden lg:block">
        <SeminarDesktop />
      </div>
    </div>
  );
}
