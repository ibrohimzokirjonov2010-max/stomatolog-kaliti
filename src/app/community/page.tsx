import { Suspense } from "react";
import type { Metadata } from "next";
import { CommunityMobile } from "@/components/community/mobile/CommunityMobile";
import { CommunityFeed } from "@/components/community-feed";

export const metadata: Metadata = {
  title: "Hamjamiyat",
  description: "Stomatologlar tajribasi, savollari va klinik holatlar.",
};

export default function CommunityPage() {
  return (
    <>
      <CommunityMobile />
      <div className="hidden lg:block">
        <Suspense>
          <CommunityFeed />
        </Suspense>
      </div>
    </>
  );
}
