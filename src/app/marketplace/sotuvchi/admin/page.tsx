import { redirect } from "next/navigation";

/** The old password-protected demo admin was removed; reviews now live in the real admin panel (404 for non-admins). */
export default function SellerAdminPage() {
  redirect("/admin/arizalar");
}
