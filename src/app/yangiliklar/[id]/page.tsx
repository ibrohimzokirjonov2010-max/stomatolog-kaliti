"use client";

import { useParams } from "next/navigation";
import { NewsPage } from "@/components/library/live-pages";

export default function YangilikPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <NewsPage id={id} />;
}
