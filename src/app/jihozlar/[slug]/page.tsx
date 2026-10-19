"use client";

import { useParams } from "next/navigation";
import { CatalogDetail } from "@/components/library/live-pages";

export default function JihozProductPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  return <CatalogDetail id={slug} expect="jihozlar" />;
}
