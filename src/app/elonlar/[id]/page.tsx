import { ElonTafsilotMobile } from "@/components/listings/mobile/ElonTafsilotMobile";

type Params = { id: string };

/** Phone view; desktop renders ListingDetailDesktop from AppChrome. */
export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  return <ElonTafsilotMobile id={decodeURIComponent(id)} />;
}
