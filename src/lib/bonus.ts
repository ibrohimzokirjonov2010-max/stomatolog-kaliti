"use client";

/** Promo numbers shown to visitors who are not signed in (signed-in users get the live values from the server rules). */
export const BONUS_SIGNUP_UZS = 10_000;
export const BONUS_FIRST_PURCHASE_UZS = 30_000;

export type BonusHistoryItem = {
  kind: "grant" | "spend" | "refund" | "expire";
  type?: "signup" | "first_purchase" | null;
  amount: number;
  orderId?: string | null;
  note?: string | null;
  createdAt: string;
  expiresAt?: string | null;
};

export type BonusInfo = {
  balance: number;
  expiresAt: string | null;
  granted: number;
  signupGranted: boolean;
  signupEligible: boolean;
  /** Why the signup bonus is still "Kutilmoqda": phone not verified yet, or the daily IP/device limit. */
  signupReason: "phone" | "limit" | null;
  /** False until the Telegram Gateway is connected: phone verification is not available yet. */
  verificationEnabled: boolean;
  firstPurchaseGranted: boolean;
  firstPurchasePending: boolean;
  rules: { signup: number; firstPurchase: number; maxSharePercent: number; days: number };
  history: BonusHistoryItem[];
};

export type BonusQuote = {
  balance: number;
  total: number;
  eligible: number;
  usable: number;
  payable: number;
  maxSharePercent: number;
};

type Store = { loaded: boolean; info: BonusInfo | null };
let store: Store = { loaded: false, info: null };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function subscribeBonus(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const getBonusSnapshot = () => store;

function normalize(raw: Record<string, unknown>): BonusInfo {
  const rules = (raw.rules ?? {}) as Record<string, unknown>;
  return {
    balance: Number(raw.balance) || 0,
    expiresAt: typeof raw.expiresAt === "string" ? raw.expiresAt : null,
    granted: Number(raw.granted) || 0,
    signupGranted: raw.signupGranted === true,
    signupEligible: raw.signupEligible === true,
    signupReason: raw.signupReason === "phone" || raw.signupReason === "limit" ? raw.signupReason : null,
    verificationEnabled: raw.verificationEnabled === true,
    firstPurchaseGranted: raw.firstPurchaseGranted === true,
    firstPurchasePending: raw.firstPurchasePending === true,
    rules: {
      signup: Number(rules.signup) || BONUS_SIGNUP_UZS,
      firstPurchase: Number(rules.firstPurchase) || BONUS_FIRST_PURCHASE_UZS,
      maxSharePercent: Number(rules.maxSharePercent) || 50,
      days: Number(rules.days) || 365,
    },
    history: Array.isArray(raw.history) ? (raw.history as BonusHistoryItem[]) : [],
  };
}

export async function refreshBonus(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/bonus", { credentials: "same-origin", cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as { ok?: boolean; bonus?: Record<string, unknown> };
        store = { loaded: true, info: json.ok && json.bonus ? normalize(json.bonus) : null };
      } else {
        store = { loaded: true, info: null };
      }
    } catch {
      store = { loaded: true, info: store.info };
    }
    emit();
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function clearBonus() {
  store = { loaded: false, info: null };
  emit();
}

export async function fetchBonusQuote(items: { productId: string; qty: number }[]): Promise<BonusQuote | null> {
  try {
    const res = await fetch("/api/bonus/quote", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const json = (await res.json()) as { ok?: boolean; quote?: BonusQuote };
    return json.ok && json.quote ? json.quote : null;
  } catch {
    return null;
  }
}

const CHOICE_KEY = "sk-use-bonus";
export function readBonusChoice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(CHOICE_KEY) === "1";
  } catch {
    return false;
  }
}
const choiceListeners = new Set<() => void>();
export function subscribeBonusChoice(listener: () => void) {
  choiceListeners.add(listener);
  return () => choiceListeners.delete(listener);
}
export function writeBonusChoice(on: boolean) {
  try {
    window.sessionStorage.setItem(CHOICE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  choiceListeners.forEach((l) => l());
}
