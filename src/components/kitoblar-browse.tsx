"use client";

import { KitoblarMobile } from "@/components/books/mobile/KitoblarMobile";
import { KitoblarDesktop } from "@/components/kitoblar-desktop";

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
