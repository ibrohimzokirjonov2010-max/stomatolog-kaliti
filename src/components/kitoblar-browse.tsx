"use client";

import { Suspense } from "react";
import { KitoblarMobile } from "@/components/books/mobile/KitoblarMobile";
import { KitoblarDesktop } from "@/components/hub/desktop/KitoblarDesktop";

export function KitoblarBrowse() {
  return (
    <div className="min-w-0">
      <div className="hidden lg:block">
        <Suspense fallback={null}>
          <KitoblarDesktop />
        </Suspense>
      </div>
      <div className="lg:hidden">
        <KitoblarMobile />
      </div>
    </div>
  );
}
