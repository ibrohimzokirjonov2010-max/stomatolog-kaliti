import type { Metadata } from "next";
import { ChannelsProvider } from "@/components/channels-provider";
import { KanallarBrowse } from "@/components/kanallar-browse";

export const metadata: Metadata = {
  title: "Foydali kanallar",
  description: "Telegram kanallar — o‘rin auksion orqali reyting.",
};

export default function KanallarPage() {
  return (
    <ChannelsProvider>
      <KanallarBrowse />
    </ChannelsProvider>
  );
}
