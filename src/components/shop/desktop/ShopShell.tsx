"use client";

import type { ReactNode } from "react";
import Topbar from "@/components/home/desktop/Topbar";
import Sidebar from "@/components/home/desktop/Sidebar";
import "./shop.css";

export function ShopShell({
  searchPath,
  cartCount,
  placeholder,
  showCamera = true,
  children,
}: {
  searchPath: string;
  cartCount: number;
  placeholder?: string;
  showCamera?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="sh dh">
      <Topbar variant="shop" searchPath={searchPath} cartCount={cartCount} placeholder={placeholder} showCamera={showCamera} />
      <div className="sh-body">
        <Sidebar />
        <main className="sh-main dk" id="shop-main">
          {children}
        </main>
      </div>
    </div>
  );
}
