import { Suspense } from "react";
import type { Metadata } from "next";
import { CommunityFeed } from "@/components/community-feed";

export const metadata: Metadata = {
  title: "Hamjamiyat",
  description: "Stomatologlar bilan case, savol-javob va tajriba almashish. Post, like va izohlar barcha shifokorlar uchun saqlanadi.",
};

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityFeed />
    </Suspense>
  );
}
