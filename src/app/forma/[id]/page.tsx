"use client";

import { useParams } from "next/navigation";
import { CatalogDetail } from "@/components/library/live-pages";

export default function FormaProductPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <CatalogDetail id={id} expect="forma" />;
}
