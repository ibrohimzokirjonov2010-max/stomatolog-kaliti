"use client";

import { useSyncExternalStore } from "react";
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
};

const STORAGE_KEY = "sk-cart-v1";
const LEGACY_KEY = "sk-shop-cart-v1";
const FAV_KEY = "sk-shop-favs-v1";
const EVENT = "sk-cart-changed";

type StoredLine = { productId: string; qty: number; size?: string; color?: string; source?: string; expiryMonths?: number };
type Stored = { lines: StoredLine[]; extras: Product[] };

type State = { lines: ShopLine[]; favs: string[] };

let state: State = { lines: [], favs: [] };
const listeners = new Set<() => void>();
const SERVER: State = { lines: [], favs: [] };
let booted = false;

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  boot();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function snapshot() {
  return state;
}

function readStored(): Stored {
  if (typeof window === "undefined") return { lines: [], extras: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [], extras: [] };
    const parsed = JSON.parse(raw) as { lines?: StoredLine[]; extras?: Product[] };
    return {
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
      extras: Array.isArray(parsed.extras) ? parsed.extras : [],
    };
  } catch {
    return { lines: [], extras: [] };
  }
}

function writeStored(stored: Stored) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  window.dispatchEvent(new Event(EVENT));
}

function toShop(stored: Stored): ShopLine[] {
  return stored.lines.flatMap((line) => {
    const product = stored.extras.find((item) => item.id === line.productId);
    if (!product) return [];
    const variant = [line.size, line.color].filter(Boolean).join(" · ");
    return [{
      id: line.productId,
      name: product.name,
      price: product.price,
      image: product.image,
      href: product.href || `/marketplace/${line.productId}`,
      qty: line.qty,
      seller: product.shopName || product.brand,
      variant: variant || undefined,
      official: true,
    }];
  });
}

function readFavs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAV_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function refresh() {
  state = { lines: toShop(readStored()), favs: readFavs() };
  emit();
}

/** Pull a previous desktop-only cart into the shared sk-cart-v1 store once. */
function migrateLegacy() {
  if (typeof window === "undefined") return;
  const current = readStored();
  if (current.lines.length) return;
  const raw = window.localStorage.getItem(LEGACY_KEY);
  if (!raw) return;
  try {
    const lines = JSON.parse(raw) as ShopLine[];
    if (!Array.isArray(lines) || !lines.length) return;
    const stored: Stored = { lines: [], extras: [] };
    for (const line of lines) {
      if (!line?.id || !line.name) continue;
      stored.lines.push({ productId: line.id, qty: Math.max(1, line.qty || 1) });
      stored.extras.push(productFrom(line));
    }
    writeStored(stored);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* leave the shared cart empty */
  }
}

function boot() {
  if (booted || typeof window === "undefined") return;
  booted = true;
  migrateLegacy();
  refresh();
  window.addEventListener(EVENT, refresh);
  window.addEventListener("storage", refresh);
}

function productFrom(line: Omit<ShopLine, "qty">): Product {
  return {
    id: line.id,
    name: line.name,
    brand: line.seller || "StomaHub",
    category: "materiallar",
    price: line.price,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "",
    image: line.image,
    shopName: line.seller,
    href: line.href,
  };
}

function update(mutator: (stored: Stored) => Stored) {
  boot();
  writeStored(mutator(readStored()));
  refresh();
}

/** Shared with the header badge. A seed argument is ignored so a page cannot invent a cart. */
export function useShopCart(_seed?: ShopLine[]) {
  const snap = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  return snap.lines;
}

export function useShopLinesOrSeed(_seed?: ShopLine[]) {
  return useShopCart();
}

export function shopAdd(line: Omit<ShopLine, "qty">, qty = 1) {
  update((stored) => {
    const extras = stored.extras.some((item) => item.id === line.id)
      ? stored.extras.map((item) => (item.id === line.id ? { ...item, ...productFrom(line) } : item))
      : [...stored.extras, productFrom(line)];
    const existing = stored.lines.find((item) => item.productId === line.id && !item.size && !item.color);
    const lines = existing
      ? stored.lines.map((item) => (item === existing ? { ...item, qty: item.qty + qty } : item))
      : [...stored.lines, { productId: line.id, qty }];
    return { lines, extras };
  });
}

export function shopSetQty(id: string, qty: number) {
  update((stored) => ({
    ...stored,
    lines: qty <= 0 ? stored.lines.filter((item) => item.productId !== id) : stored.lines.map((item) => (item.productId === id ? { ...item, qty } : item)),
  }));
}

export function shopRemove(id: string) {
  shopSetQty(id, 0);
}

export function shopClear() {
  update((stored) => ({ ...stored, lines: [] }));
}

export function useShopLineCount() {
  const snap = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  return snap.lines.reduce((sum, line) => sum + line.qty, 0);
}

export function useShopLines() {
  return useShopCart();
}

export function useShopFavs() {
  const snap = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  return snap.favs;
}

export function shopToggleFav(id: string) {
  boot();
  const favs = state.favs.includes(id) ? state.favs.filter((item) => item !== id) : [...state.favs, id];
  if (typeof window !== "undefined") window.localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  state = { ...state, favs };
  emit();
}

export function som(amount: number) {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} so‘m`;
}

export function somPlain(amount: number) {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
