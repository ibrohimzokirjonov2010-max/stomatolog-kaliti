"use client";

import type { ReactNode } from "react";
import Topbar from "@/components/home/desktop/Topbar";
import Sidebar from "@/components/home/desktop/Sidebar";
import "./shop.css";

export function ShopShell({ searchPath, cartCount, children }: { searchPath: string; cartCount: number; children: ReactNode }) {
  return (
    <div className="sh">
      <Topbar variant="shop" searchPath={searchPath} cartCount={cartCount} />
      <div className="sh-body">
        <Sidebar />
        <main className="sh-main dk" id="shop-main">
          {children}
        </main>
      </div>
    </div>
  );
}
