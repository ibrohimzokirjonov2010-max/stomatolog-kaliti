"use client";

import { KitoblarDesktop } from "@/components/kitoblar-desktop";
import { KitoblarMobile } from "@/components/kitoblar-mobile";

export function KitoblarBrowse() {
  return (
    <div className="min-w-0">
      <div className="hidden lg:block">
        <KitoblarDesktop />
      </div>
      <div className="lg:hidden">
        <KitoblarMobile />
      </div>
    </div>
  );
}
