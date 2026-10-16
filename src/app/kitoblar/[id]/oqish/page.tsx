"use client";

import { useParams } from "next/navigation";
import { BookReader } from "@/components/books/mobile/BookReader";
import { mobileBooks } from "@/data/mobile-books";
import { books } from "@/data/education";

export default function BookReadPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  const book = books.find((item) => item.id === id);
  const mobile = mobileBooks.find((item) => item.id === id);
  const title = book?.title ?? mobile?.title ?? "Stomatologiya klinik amaliyotda";
  const author = book?.author ?? mobile?.author ?? "Dr. Azizbek Rahimov";
  return <BookReader id={id || "klinik-amaliyot"} title={title} author={author} />;
}
