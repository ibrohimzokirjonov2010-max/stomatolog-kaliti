"use client";

import { useParams } from "next/navigation";
import { BookPage } from "@/components/library/live-pages";

export default function KitobPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <BookPage id={id} />;
}
