import "server-only";
import { notFound } from "next/navigation";
import { rpc } from "@/lib/server/db";
import { UUID_RE } from "@/lib/server/user";

/**
 * Real HTTP 404 for an id that is not a product.
 * A database outage does not 404: the client can still render a catalog response.
 */
export async function assertPublicProduct(id: string, expect?: string) {
  if (!UUID_RE.test(id)) notFound();
  let product: Record<string, unknown> | null;
  try {
    product = await rpc<Record<string, unknown> | null>("sh_product_public", { p_id: id });
  } catch {
    return;
  }
  if (!product) notFound();
  if (expect && product.category !== expect) notFound();
}
