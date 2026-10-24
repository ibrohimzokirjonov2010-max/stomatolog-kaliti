"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readAttribution, type Attribution } from "@/lib/attribution";
import { ACCOUNTS_KEY, PROFILE_KEY, profileFromApi, type DoctorProfile } from "@/lib/doctor-profile";
import { trackLeadConversion } from "@/lib/track-lead";

export type RegisterInput = {
  fullName: string;
  phone: string;
  password: string;
  specialty?: string;
};

export type LoginInput = {
  phone: string;
  password: string;
};

export type ProfilePatch = {
  fullName?: string;
  phone?: string;
  specialty?: string;
  clinic?: string;
  city?: string;
  bio?: string;
  avatarUrl?: string;
  attribution?: Attribution;
};

export type AuthFailReason =
  | "invalid"
  | "exists"
  | "not_found"
  | "wrong_password"
  | "short_password"
  | "unauthorized"
  | "blocked"
  | "phone_locked"
  | "network";

export type AuthResult =
  | { ok: true; profile: DoctorProfile; leadCreated?: boolean }
  | { ok: false; reason: AuthFailReason; message?: string };

type Ctx = {
  ready: boolean;
  profile: DoctorProfile | null;
  register: (input: RegisterInput) => Promise<AuthResult>;
  login: (input: LoginInput) => Promise<AuthResult>;
  /** Called after a server route (Google/Telegram) has created the session. */
  acceptServerProfile: (raw: unknown) => AuthResult;
  logout: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<AuthResult>;
  refresh: () => Promise<void>;
};

const DoctorProfileCtx = createContext<Ctx | null>(null);

async function postJson(url: string, body: unknown, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; profile?: unknown; reason?: AuthFailReason; error?: string; leadCreated?: boolean }
    | null;
  return { response, data };
}

function toResult(
  response: Response,
  data: { ok?: boolean; profile?: unknown; reason?: AuthFailReason; error?: string; leadCreated?: boolean } | null,
): AuthResult {
  if (response.ok && data?.ok) {
    const profile = profileFromApi(data.profile);
    if (profile) return { ok: true, profile, leadCreated: Boolean(data.leadCreated) };
  }
  if (response.status === 401 && !data?.reason) return { ok: false, reason: "unauthorized", message: data?.error };
  return { ok: false, reason: data?.reason ?? "network", message: data?.error };
}

export function DoctorProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; profile?: unknown } | null;
      if (response.ok && data?.ok) setProfile(profileFromApi(data.profile));
    } catch {
      /* offline: keep current state */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    // Old MVP kept accounts in localStorage; session now lives in an httpOnly cookie.
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(ACCOUNTS_KEY);
    } catch {
      /* ignore */
    }
    void refresh();
  }, [refresh]);

  const register = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    try {
      const { response, data } = await postJson("/api/auth/register", { ...input, attribution: readAttribution() });
      const result = toResult(response, data);
      if (result.ok) {
        setProfile(result.profile);
        if (result.leadCreated) trackLeadConversion();
      }
      return result;
    } catch {
      return { ok: false, reason: "network" };
    }
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<AuthResult> => {
    try {
      const { response, data } = await postJson("/api/auth/login", { ...input, attribution: readAttribution() });
      const result = toResult(response, data);
      if (result.ok) setProfile(result.profile);
      return result;
    } catch {
      return { ok: false, reason: "network" };
    }
  }, []);

  const acceptServerProfile = useCallback((raw: unknown): AuthResult => {
    const next = profileFromApi(raw);
    if (!next) return { ok: false, reason: "invalid" };
    setProfile(next);
    return { ok: true, profile: next };
  }, []);

  const logout = useCallback(async () => {
    setProfile(null);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* cookie will expire */
    }
  }, []);

  const updateProfile = useCallback(async (patch: ProfilePatch): Promise<AuthResult> => {
    try {
      const { attribution, ...rest } = patch;
      const { response, data } = await postJson(
        "/api/profile",
        { ...rest, attribution: attribution ?? readAttribution() },
        "PATCH",
      );
      const result = toResult(response, data);
      if (result.ok) setProfile(result.profile);
      return result;
    } catch {
      return { ok: false, reason: "network" };
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({ ready, profile, register, login, acceptServerProfile, logout, updateProfile, refresh }),
    [ready, profile, register, login, acceptServerProfile, logout, updateProfile, refresh],
  );

  return <DoctorProfileCtx.Provider value={value}>{children}</DoctorProfileCtx.Provider>;
}

export function useDoctorProfile() {
  const ctx = useContext(DoctorProfileCtx);
  if (!ctx) throw new Error("useDoctorProfile must be used within DoctorProfileProvider");
  return ctx;
}
