import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/shell";
import { requireAdminPage } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Real gate: verifies the signed session cookie and re-checks is_admin / blocked in the DB; everyone else gets 404. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();
  return (
    <AdminShell
      admin={{
        id: admin.id,
        fullName: admin.fullName,
        avatarUrl: admin.avatarUrl,
        adminRole: admin.adminRole,
        badges: admin.badges,
      }}
    >
      {children}
    </AdminShell>
  );
}
