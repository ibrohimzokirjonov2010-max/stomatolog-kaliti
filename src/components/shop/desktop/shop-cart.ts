"use client";

import { useSyncExternalStore } from "react";

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

type State = { seeded: boolean; lines: ShopLine[]; favs: string[] };

let state: State = { seeded: false, lines: [], favs: [] };
const listeners = new Set<() => void>();
const SERVER: State = { seeded: false, lines: [], favs: [] };

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function snapshot() {
  return state;
}

function setState(next: State) {
  state = next;
  emit();
}

/** First desktop shop page in the session seeds the shared cart. Later pages keep it. */
function seedIfNeeded(seed: ShopLine[]) {
  if (typeof window === "undefined" || state.seeded) return;
  state = { seeded: true, lines: seed.map((line) => ({ ...line })), favs: state.favs };
}

export function useShopCart(seed: ShopLine[]) {
  seedIfNeeded(seed);
  const snap = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  return snap.seeded ? snap.lines : seed;
}

/** Savat seeds the design cart only when nothing else has filled it yet. */
export function useShopLinesOrSeed(seed: ShopLine[]) {
  if (typeof window !== "undefined" && !state.seeded) {
    state = { seeded: true, lines: seed.map((line) => ({ ...line })), favs: state.favs };
  }
  const snap = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  return snap.seeded ? snap.lines : seed;
}

export function shopAdd(line: Omit<ShopLine, "qty">, qty = 1) {
  const lines = state.lines.map((item) => ({ ...item }));
  const found = lines.find((item) => item.id === line.id);
  if (found) found.qty += qty;
  else lines.push({ ...line, qty });
  setState({ ...state, seeded: true, lines });
}

export function shopSetQty(id: string, qty: number) {
  const lines = qty <= 0 ? state.lines.filter((item) => item.id !== id) : state.lines.map((item) => (item.id === id ? { ...item, qty } : item));
  setState({ ...state, seeded: true, lines });
}

export function shopRemove(id: string) {
  setState({ ...state, seeded: true, lines: state.lines.filter((item) => item.id !== id) });
}

export function shopClear() {
  setState({ ...state, seeded: true, lines: [] });
}

export function useShopLineCount() {
  const snap = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  return snap.lines.reduce((sum, line) => sum + line.qty, 0);
}

/** Read the shared cart without seeding it. */
export function useShopLines() {
  const snap = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  return snap.lines;
}

export function useShopFavs() {
  const snap = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  return snap.favs;
}

export function shopToggleFav(id: string) {
  const favs = state.favs.includes(id) ? state.favs.filter((item) => item !== id) : [...state.favs, id];
  setState({ ...state, favs });
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
