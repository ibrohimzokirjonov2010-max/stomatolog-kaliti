import { ListingDetailDesktop } from "@/components/crm/desktop/ListingsDesktop";

type Params = { id: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  return <ListingDetailDesktop id={decodeURIComponent(id)} />;
}
