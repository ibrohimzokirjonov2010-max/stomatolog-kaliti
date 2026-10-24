import "server-only";
import type { Attribution } from "@/lib/attribution";
import { rpc } from "@/lib/server/db";
import type { DbProfile } from "@/lib/server/profile";
import { signupRole } from "@/lib/signup-roles";

function utmFrom(value: unknown): Attribution {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  const clip = (key: keyof Attribution, max: number) => {
    const text = typeof raw[key] === "string" ? raw[key].trim().slice(0, max) : "";
    return text || undefined;
  };
  return {
    utm_source: clip("utm_source", 120),
    utm_medium: clip("utm_medium", 120),
    utm_campaign: clip("utm_campaign", 120),
    utm_term: clip("utm_term", 120),
    utm_content: clip("utm_content", 120),
    referrer: clip("referrer", 300),
    landing_path: clip("landing_path", 200),
  };
}

/**
 * One lead per user. Later calls fill blanks and refresh name, phone, email, and role.
 * A missing leads table must not block sign-in.
 */
export async function recordRegistrationLead(
  profile: DbProfile,
  input: { method?: "phone" | "google"; role?: string | null; attribution?: unknown },
): Promise<{ created: boolean; stored: boolean }> {
  if (profile.provider === "telegram") return { created: false, stored: false };
  const method = input.method ?? (profile.provider === "google" ? "google" : "phone");
  try {
    const res = await rpc<{ ok?: boolean; created?: boolean }>("sh_lead_upsert", {
      p_user: profile.id,
      p_data: {
        name: profile.fullName,
        phone: profile.phone,
        email: profile.email ?? null,
        role: signupRole(input.role ?? profile.specialty ?? ""),
        method,
        utm: utmFrom(input.attribution),
      },
    });
    return { created: Boolean(res.created), stored: Boolean(res.ok) };
  } catch (error) {
    console.error("[lead]", error instanceof Error ? error.message : "upsert failed");
    return { created: false, stored: false };
  }
}
