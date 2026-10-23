"use client";

import { useParams } from "next/navigation";
import { NewsPage } from "@/components/library/live-pages";
import { YangilikMobile } from "@/components/news/mobile/YangilikMobile";

export default function YangilikPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return (
    <>
      <YangilikMobile id={id} />
      <div className="hidden lg:block">
        <NewsPage id={id} />
      </div>
    </>
  );
}
