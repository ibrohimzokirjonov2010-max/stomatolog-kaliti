"use client";

import { useParams } from "next/navigation";
import { BookReader } from "@/components/books/mobile/BookReader";

export default function BookReadPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <BookReader id={id} />;
}
