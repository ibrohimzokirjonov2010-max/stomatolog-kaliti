import { redirect } from "next/navigation";
import { assertPublicProduct } from "@/lib/server/public-product";

export default async function ProductAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await assertPublicProduct(id);
  redirect(`/marketplace/${id}`);
}
