import { CatalogDetail } from "@/components/library/live-pages";
import { assertPublicProduct } from "@/lib/server/public-product";

export default async function JihozProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await assertPublicProduct(slug, "jihozlar");
  return <CatalogDetail id={slug} expect="jihozlar" />;
}