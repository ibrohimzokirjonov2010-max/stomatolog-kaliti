"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ShoppingCart, X } from "lucide-react";
import { products, type Product } from "@/data/products";
import { apparelMetaLabel } from "@/data/forma";
import { productMaxQty } from "@/data/product-details";
import { surplusProducts } from "@/data/surplus";
import { CATALOG_EVENT, getDbCatalog } from "@/lib/seller-work";
import { useIsClient } from "@/lib/use-is-client";

export type CartLineMeta = {
  size?: string;
  color?: string;
  source?: string;
  expiryMonths?: number;
};

export type CartLine = { productId: string; qty: number } & CartLineMeta;

type ToastState = { name: string; qty: number } | null;

export function cartLineKey(productId: string, size?: string, color?: string) {
  return `${productId}::${size ?? ""}::${color ?? ""}`;
}

function sameLine(line: CartLine, productId: string, meta?: CartLineMeta) {
  return (
    line.productId === productId &&
    (line.size ?? "") === (meta?.size ?? "") &&
    (line.color ?? "") === (meta?.color ?? "")
  );
}

type CartItem = {
  product: Product;
  qty: number;
  lineTotal: number;
  max: number;
  size?: string;
  color?: string;
  source?: string;
  expiryMonths?: number;
  key: string;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  items: CartItem[];
  add: (productId: string, extra?: Product, qty?: number, meta?: CartLineMeta) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  isSelected: (key: string) => boolean;
  toggleSelected: (key: string) => void;
  setAllSelected: (on: boolean) => void;
  selectedItems: CartItem[];
  selectedCount: number;
  selectedSubtotal: number;
  clearSelected: () => void;
};

const STORAGE_KEY = "sk-cart-v1";
const UNSELECTED_KEY = "sk-cart-unselected-v1";

function readUnselected(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(UNSELECTED_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
}
const CartContext = createContext<CartContextValue | null>(null);

function lookup(id: string, extras: Product[]) {
  return (
    products.find((item) => item.id === id) ??
    surplusProducts.find((item) => item.id === id) ??
    getDbCatalog().find((item) => item.id === id) ??
    extras.find((item) => item.id === id)
  );
}

function clampQty(qty: number, max: number) {
  return Math.max(1, Math.min(max, Math.floor(qty) || 1));
}

function readStored(): { lines: CartLine[]; extras: Product[] } {
  if (typeof window === "undefined") return { lines: [], extras: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [], extras: [] };
    const parsed = JSON.parse(raw) as { lines?: CartLine[]; extras?: Product[] };
    return {
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
      extras: Array.isArray(parsed.extras) ? parsed.extras : [],
    };
  } catch {
    return { lines: [], extras: [] };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [extras, setExtras] = useState<Product[]>([]);
  const [unselected, setUnselected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [catalogTick, setCatalogTick] = useState(0);

  useEffect(() => {
    const onCatalog = () => setCatalogTick((n) => n + 1);
    window.addEventListener(CATALOG_EVENT, onCatalog);
    return () => window.removeEventListener(CATALOG_EVENT, onCatalog);
  }, []);

  if (isClient && !ready) {
    const stored = readStored();
    setLines(stored.lines);
    setExtras(stored.extras);
    setUnselected(readUnselected());
    setReady(true);
  }

  useEffect(() => {
    if (!ready) return;
    const payload = JSON.stringify({ lines, extras });
    if (window.localStorage.getItem(STORAGE_KEY) !== payload) {
      window.localStorage.setItem(STORAGE_KEY, payload);
      window.dispatchEvent(new Event("sk-cart-changed"));
    }
  }, [extras, lines, ready]);

  useEffect(() => {
    if (!ready) return;
    const reload = () => {
      const stored = readStored();
      setLines(stored.lines);
      setExtras(stored.extras);
    };
    window.addEventListener("sk-cart-changed", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("sk-cart-changed", reload);
      window.removeEventListener("storage", reload);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(UNSELECTED_KEY, JSON.stringify(unselected));
  }, [unselected, ready]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const value = useMemo<CartContextValue>(() => {
    void catalogTick;
    const items: CartItem[] = [];
    for (const line of lines) {
      const product = lookup(line.productId, extras);
      if (!product) continue;
      const max = productMaxQty(product);
      const qty = clampQty(line.qty, max);
      items.push({
        product,
        qty,
        max,
        lineTotal: product.price * qty,
        size: line.size,
        color: line.color,
        source: line.source,
        expiryMonths: line.expiryMonths,
        key: cartLineKey(line.productId, line.size, line.color),
      });
    }

    const selectedItems = items.filter((item) => !unselected.includes(item.key));

    return {
      lines,
      count: items.reduce((sum, item) => sum + item.qty, 0),
      subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
      items,
      add: (productId, extra, qty = 1, meta) => {
        const product = extra ?? lookup(productId, extras);
        if (extra) {
          setExtras((current) => [...current.filter((item) => item.id !== extra.id), extra]);
        }
        const max = product ? productMaxQty(product) : 99;
        const addQty = clampQty(qty, max);
        setLines((current) => {
          const existing = current.find((line) => sameLine(line, productId, meta));
          if (existing) {
            return current.map((line) =>
              sameLine(line, productId, meta) ? { ...line, qty: clampQty(line.qty + addQty, max) } : line,
            );
          }
          return [
            ...current,
            {
              productId,
              qty: addQty,
              size: meta?.size,
              color: meta?.color,
              source: meta?.source,
              expiryMonths: meta?.expiryMonths,
            },
          ];
        });
        const addedKey = cartLineKey(productId, meta?.size, meta?.color);
        setUnselected((current) => current.filter((k) => k !== addedKey));
        const detail = apparelMetaLabel(meta?.size, meta?.color);
        setToast({
          name: detail ? `${product?.name ?? "Mahsulot"} · ${detail}` : (product?.name ?? "Mahsulot"),
          qty: addQty,
        });
      },
      setQty: (key, qty) => {
        setLines((current) =>
          current.map((line) => {
            if (cartLineKey(line.productId, line.size, line.color) !== key) return line;
            const product = lookup(line.productId, extras);
            const max = product ? productMaxQty(product) : 99;
            return { ...line, qty: clampQty(qty, max) };
          }),
        );
      },
      remove: (key) => {
        setLines((current) =>
          current.filter((line) => cartLineKey(line.productId, line.size, line.color) !== key),
        );
      },
      clear: () => {
        setLines([]);
        setUnselected([]);
      },
      isSelected: (key) => !unselected.includes(key),
      toggleSelected: (key) =>
        setUnselected((current) =>
          current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
        ),
      setAllSelected: (on) => setUnselected(on ? [] : items.map((item) => item.key)),
      selectedItems,
      selectedCount: selectedItems.reduce((sum, item) => sum + item.qty, 0),
      selectedSubtotal: selectedItems.reduce((sum, item) => sum + item.lineTotal, 0),
      clearSelected: () => {
        const keep = new Set(unselected);
        setLines((current) =>
          current.filter((line) => keep.has(cartLineKey(line.productId, line.size, line.color))),
        );
        setUnselected([]);
      },
    };
  }, [catalogTick, extras, lines, unselected]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed right-4 bottom-24 z-[70] w-[min(100%-2rem,360px)] lg:bottom-4">
          <div className="pointer-events-auto rounded-2xl border border-[#d7e4ff] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.16)]">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a]">
                <Check className="size-4" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1a1d26]">Savatga qo‘shildi</p>
                <p className="mt-0.5 truncate text-[13px] text-[#6b7280]">
                  {toast.name} · {toast.qty} dona
                </p>
                <Link href="/savat" className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0F766E] hover:underline">
                  <ShoppingCart className="size-3.5" />
                  Savatni ochish
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-[#8b93a7] hover:text-[#1a1d26]"
                aria-label="Yopish"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
