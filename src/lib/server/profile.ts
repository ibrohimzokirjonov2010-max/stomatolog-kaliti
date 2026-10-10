import "server-only";
import { rpc } from "@/lib/server/db";

export type DbProfile = {
  id: string;
  provider: "phone" | "google" | "telegram";
  fullName: string;
  phone: string;
  email?: string | null;
  telegramUsername?: string | null;
  clinic?: string | null;
  city?: string | null;
  specialty?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role: "doctor" | "admin";
  isAdmin?: boolean;
  adminRole?: "owner" | "admin" | "moderator" | "finance" | null;
  blocked?: boolean;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string | null;
  bonus?: BonusState;
};

export type BonusState = {
  balance: number;
  expiresAt: string | null;
  grantedAt: string | null;
  granted: number;
  expired: boolean;
  signupGranted?: boolean;
  signupEligible?: boolean;
  firstPurchaseGranted?: boolean;
  firstPurchasePending?: boolean;
  rules: {
    signup: number;
    firstPurchase: number;
    amount: number;
    minOrder: number;
    maxPerOrder: number;
    maxSharePercent: number;
    days: number;
    refundGraceDays: number;
  };
};

export async function upsertSocialProfile(input: {
  provider: "google" | "telegram";
  uid: string;
  fullName: string;
  email?: string;
  telegramUsername?: string;
  avatarUrl?: string;
}) {
  return rpc<DbProfile>("sh_upsert_social", {
    p_provider: input.provider,
    p_uid: input.uid,
    p_full_name: input.fullName,
    p_email: input.email ?? null,
    p_telegram_username: input.telegramUsername ?? null,
    p_avatar_url: input.avatarUrl ?? null,
  });
}

export async function getProfile(userId: string) {
  return rpc<DbProfile | null>("sh_get_profile", { p_user: userId });
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}
