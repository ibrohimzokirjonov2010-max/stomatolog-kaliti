export type DoctorRole = "doctor" | "admin";

export type AuthProvider = "phone" | "google" | "telegram";

export type DoctorProfile = {
  id: string;
  fullName: string;
  phone: string;
  role: DoctorRole;
  specialty?: string;
  clinic?: string;
  city?: string;
  avatarUrl?: string;
  bio?: string;
  provider?: AuthProvider;
  email?: string;
  telegramUsername?: string;
  googleSub?: string;
  telegramId?: string;
  /** True only for platform admins (checked again server-side on every admin request). */
  isAdmin?: boolean;
  adminRole?: "owner" | "admin" | "moderator" | "finance";
};

export type DoctorAccount = DoctorProfile & {
  /** Empty string for social accounts (no password). */
  password: string;
};

export const PROFILE_KEY = "sk-doctor-profile-v1";
export const ACCOUNTS_KEY = "sk-doctor-accounts-v1";

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export function formatPhoneDisplay(phone: string) {
  const d = normalizePhone(phone);
  if (d.length !== 9) return phone;
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

/** Simple non-crypto hash for MVP localStorage passwords / synthetic ids. */
export function hashPassword(password: string) {
  let h = 5381;
  for (let i = 0; i < password.length; i++) {
    h = (h * 33) ^ password.charCodeAt(i);
  }
  return `mvp:${(h >>> 0).toString(16)}:${password.length}`;
}

export function roleLabel(role: DoctorRole): string {
  return role === "admin" ? "Administrator" : "Stomatolog";
}

export function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function newDoctorId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadAccounts(): DoctorAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DoctorAccount[];
    return Array.isArray(parsed) ? parsed.map(normalizeAccount) : [];
  } catch {
    return [];
  }
}

function normalizeAccount(raw: DoctorAccount): DoctorAccount {
  return {
    id: raw.id,
    fullName: raw.fullName,
    phone: raw.phone ?? "",
    role: raw.role === "admin" ? "admin" : "doctor",
    specialty: raw.specialty,
    clinic: raw.clinic,
    city: raw.city,
    avatarUrl: raw.avatarUrl,
    provider: raw.provider ?? "phone",
    email: raw.email,
    telegramUsername: raw.telegramUsername,
    googleSub: raw.googleSub,
    telegramId: raw.telegramId,
    password: raw.password ?? "",
  };
}

export function saveAccounts(accounts: DoctorAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadProfile(): DoctorProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DoctorProfile;
    if (!parsed?.id || !parsed?.fullName) return null;
    return {
      id: parsed.id,
      fullName: parsed.fullName,
      phone: parsed.phone ?? "",
      role: parsed.role === "admin" ? "admin" : "doctor",
      specialty: parsed.specialty,
      clinic: parsed.clinic,
      city: parsed.city,
      avatarUrl: parsed.avatarUrl,
      provider: parsed.provider,
      email: parsed.email,
      telegramUsername: parsed.telegramUsername,
      googleSub: parsed.googleSub,
      telegramId: parsed.telegramId,
    };
  } catch {
    return null;
  }
}

export function saveProfile(profile: DoctorProfile | null) {
  if (profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(PROFILE_KEY);
  }
}

export function toPublicProfile(account: DoctorAccount): DoctorProfile {
  const { password: _pw, ...profile } = account;
  void _pw;
  return profile;
}

/** Normalize a profile returned by the StomaHub API (nulls → undefined). */
export function profileFromApi(raw: unknown): DoctorProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
  if (typeof r.id !== "string" || typeof r.fullName !== "string") return null;
  return {
    id: r.id,
    fullName: r.fullName,
    phone: typeof r.phone === "string" ? r.phone : "",
    role: r.role === "admin" ? "admin" : "doctor",
    specialty: str(r.specialty),
    clinic: str(r.clinic),
    city: str(r.city),
    avatarUrl: str(r.avatarUrl),
    bio: str(r.bio),
    provider: r.provider === "google" || r.provider === "telegram" ? r.provider : "phone",
    email: str(r.email),
    telegramUsername: str(r.telegramUsername),
    isAdmin: r.isAdmin === true,
    adminRole:
      r.adminRole === "owner" || r.adminRole === "admin" || r.adminRole === "moderator" || r.adminRole === "finance"
        ? r.adminRole
        : undefined,
  };
}
