"use client";

/**
 * Desktop shop helpers.
 *
 * The cart itself lives in ONE place: `CartProvider` (`@/components/cart-provider`,
 * persisted in localStorage under `sk-cart-v1`). These helpers are a thin adapter
 * over it, so marketplace, product pages, /savat and /buyurtma always show the
 * same lines and the same totals. Nothing is seeded with demo products any more.
 *
 * Favourites stay in a small in-memory store here.
 */

import { useMemo, useSyncExternalStore } from "react";
import { useCart, withCart, type CartItem } from "@/components/cart-provider";
import type { Product } from "@/data/products";

export type ShopLine = {
  id: string;
  name: string;
  price: number;
  image: string;
  href: string;
  qty: number;
  seller?: string;
  variant?: string;
  official?: boolean;
  /** Cart line key (product + size + colour). Present on lines read from the cart. */
  key?: string;
};

/** Extra display fields kept on products that are not in the static catalog. */
type ShopProduct = Product & { href?: string; variant?: string; official?: boolean; seller?: string };

function toProduct(line: Omit<ShopLine, "qty">): ShopProduct {
  return {
    id: line.id,
    name: line.name,
    brand: line.seller ?? "StomaHub Market",
    category: "materiallar",
    price: line.price,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "1–2 kun",
    image: line.image,
    shopName: line.seller,
    href: line.href,
    variant: line.variant,
    official: line.official,
    seller: line.seller,
  };
}

export function cartItemToShopLine(item: CartItem): ShopLine {
  const product = item.product as ShopProduct;
  const meta = [item.size, item.color].filter(Boolean).join(" · ");
  return {
    id: product.id,
    key: item.key,
    name: product.name,
    price: product.price,
    image: product.image,
    href: product.href ?? `/marketplace/${product.id}`,
    qty: item.qty,
    seller: product.seller ?? product.shopName ?? "StomaHub Market",
    variant: product.variant ?? (meta || undefined),
    official: product.official,
  };
}

/* ---------- cart (adapter over CartProvider) ---------- */

/** All cart lines. */
export function useShopLines(): ShopLine[] {
  const { items } = useCart();
  return useMemo(() => items.map(cartItemToShopLine), [items]);
}

/** @deprecated The seed is ignored: the real cart is returned. Kept for existing callers. */
export function useShopCart(seed?: ShopLine[]): ShopLine[] {
  void seed;
  return useShopLines();
}

/** @deprecated The seed is ignored: the real cart is returned. Kept for existing callers. */
export function useShopLinesOrSeed(seed?: ShopLine[]): ShopLine[] {
  void seed;
  return useShopLines();
}

export function useShopLineCount() {
  return useCart().count;
}

function findKey(items: CartItem[], idOrKey: string) {
  return items.find((item) => item.key === idOrKey)?.key ?? items.find((item) => item.product.id === idOrKey)?.key;
}

export function shopAdd(line: Omit<ShopLine, "qty"> & { qty?: number }, qty = 1) {
  const { qty: ignored, key: ignoredKey, ...rest } = line;
  void ignored;
  void ignoredKey;
  withCart((cart) => cart.add(rest.id, toProduct(rest), qty));
}

export function shopSetQty(idOrKey: string, qty: number) {
  withCart((cart) => {
    const key = findKey(cart.items, idOrKey);
    if (!key) return;
    if (qty <= 0) cart.remove(key);
    else cart.setQty(key, qty);
  });
}

export function shopRemove(idOrKey: string) {
  withCart((cart) => {
    const key = findKey(cart.items, idOrKey);
    if (key) cart.remove(key);
  });
}

export function shopClear() {
  withCart((cart) => cart.clear());
}

/* ---------- favourites (local store) ---------- */

let favs: string[] = [];
const listeners = new Set<() => void>();
const SERVER_FAVS: string[] = [];

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useShopFavs() {
  return useSyncExternalStore(subscribe, () => favs, () => SERVER_FAVS);
}

export function shopToggleFav(id: string) {
  favs = favs.includes(id) ? favs.filter((item) => item !== id) : [...favs, id];
  listeners.forEach((fn) => fn());
}

/* ---------- formatting ---------- */

export function som(amount: number) {
  return `${somPlain(amount)} so‘m`;
}

export function somPlain(amount: number) {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
