import { CatalogDetail } from "@/components/library/live-pages";
import { assertPublicProduct } from "@/lib/server/public-product";

export default async function FormaProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await assertPublicProduct(id, "forma");
  return <CatalogDetail id={id} expect="forma" />;
}
