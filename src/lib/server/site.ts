import "server-only";
import { rpc } from "@/lib/server/db";

export type SiteContact = { email: string | null; phone: string | null; telegram: string | null };

/** Public contact details that the admin entered in /admin/sozlamalar. Never invented: empty when not set (or when the DB is unreachable). */
export async function getSiteContact(): Promise<SiteContact> {
  try {
    const c = await rpc<Partial<SiteContact> | null>("sh_site_contact_get", {});
    return { email: c?.email ?? null, phone: c?.phone ?? null, telegram: c?.telegram ?? null };
  } catch {
    return { email: null, phone: null, telegram: null };
  }
}
