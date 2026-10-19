"use client";
/**
 * Homepage cart hooks — a thin wrapper over the ONE real cart
 * (`@/components/cart-provider` via `shop-cart`). It used to be a fake counter
 * starting at 3 that never added the product.
 */
import type { ReactNode } from "react";
import { shopAdd, useShopLineCount, type ShopLine } from "@/components/shop/desktop/shop-cart";

export type HomeCartItem = Omit<ShopLine, "qty" | "key">;

/** Kept so existing markup does not change; the real provider lives in the root layout. */
export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** "2 450 000 so‘m" → 2450000 */
export function parseSom(label: string) {
  return Number(label.replace(/\D/g, "")) || 0;
}

export function slugify(text: string) {
  return (
    "home-" +
    text
      .toLowerCase()
      .replace(/[‘’'`]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export const useCart = () => {
  const count = useShopLineCount();
  return { count, add: (item: HomeCartItem) => shopAdd(item) };
};
