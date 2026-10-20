"use client";

import type { ReactNode } from "react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";

export function AddFormDesktop({ searchPath, placeholder, children }: { searchPath: string; placeholder: string; children: ReactNode }) {
  const cartCount = useShopLineCount();
  return (
    <ShopShell searchPath={searchPath} cartCount={cartCount} placeholder={placeholder} showCamera={false}>
      {children}
    </ShopShell>
  );
}
