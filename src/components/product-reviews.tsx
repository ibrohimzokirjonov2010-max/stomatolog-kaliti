"use client";

import { useEffect, useState } from "react";
import { MessageSquareReply, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type PublicReview = {
  id: number | string;
  rating: number;
  body?: string;
  buyerName: string;
  createdAt: string;
  reply?: string;
  replyAt?: string;
};
export type ProductReviewsData = { count: number; avg: number | null; reviews: PublicReview[]; loading: boolean };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY: ProductReviewsData = { count: 0, avg: null, reviews: [], loading: false };

/** Real reviews of a product from the `reviews` table (public). Bundled catalog items (non-UUID ids) have none yet. */
export function useProductReviews(productId: string): ProductReviewsData {
  const isDb = UUID_RE.test(productId);
  const [state, setState] = useState<{ id: string; data: Omit<ProductReviewsData, "loading"> } | null>(null);

  useEffect(() => {
    if (!isDb) return;
    let alive = true;
    fetch(`/api/reviews?product=${encodeURIComponent(productId)}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<{ ok?: boolean; count?: number; avg?: number | null; reviews?: PublicReview[] }>)
      .then((j) => {
        if (alive && j.ok) setState({ id: productId, data: { count: Number(j.count ?? 0), avg: j.avg == null ? null : Number(j.avg), reviews: j.reviews ?? [] } });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [productId, isDb]);

  if (!isDb) return EMPTY;
  if (!state || state.id !== productId) return { ...EMPTY, loading: true };
  return { ...state.data, loading: false };
}

export function fmtReviewDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric" });
}

export function StarRow({ value, className }: { value: number; className?: string }) {
  return (
    <span className="flex gap-0.5 text-[#f5b400]">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("size-3.5", className, i < Math.round(value) ? "fill-current" : "fill-none text-[#d7dbe7]")} />
      ))}
    </span>
  );
}

/** Reviews tab body: real reviews (rating, text, short buyer name, date, seller reply) or «Hali sharh yo‘q». */
export function ProductReviewsList({ data, columns = 3 }: { data: ProductReviewsData; columns?: 1 | 2 | 3 }) {
  if (data.loading) return <p className="py-6 text-center text-[13px] text-[#8b93a7]">Yuklanmoqda…</p>;
  if (data.reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#dfe5ef] bg-[#fafbfd] px-4 py-10 text-center">
        <Star className="mx-auto size-6 text-[#c5ccda]" />
        <p className="mt-2 text-[14px] font-semibold text-[#1a1d26]">Hali sharh yo‘q</p>
        <p className="mt-0.5 text-[12.5px] text-[#8b93a7]">Buyurtma yetkazilgach, xaridorlar shu yerda baho va sharh qoldiradi.</p>
      </div>
    );
  }
  return (
    <div>
      {data.avg != null ? (
        <p className="mb-3 flex items-center gap-2 text-[13px] text-[#4b5568]">
          <span className="text-[20px] font-extrabold text-[#111827]">{data.avg.toFixed(1)}</span>
          <StarRow value={data.avg} />
          <span>{data.count} ta sharh</span>
        </p>
      ) : null}
      <div className={cn("grid gap-3", columns === 3 ? "grid-cols-3" : columns === 2 ? "grid-cols-2" : "grid-cols-1")}>
        {data.reviews.map((r) => (
          <article key={r.id} className="rounded-xl border border-[#eceff5] bg-[#fafbfd] p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate font-semibold text-[#1a1d26]">{r.buyerName}</p>
              <p className="shrink-0 text-[11px] text-[#8b93a7]">{fmtReviewDate(r.createdAt)}</p>
            </div>
            <div className="mt-2"><StarRow value={r.rating} /></div>
            {r.body ? <p className="mt-2 text-[13px] break-words whitespace-pre-line">{r.body}</p> : null}
            {r.reply ? (
              <div className="mt-3 rounded-lg border-l-2 border-[#0F766E] bg-white px-3 py-2">
                <p className="flex items-center gap-1 text-[11.5px] font-semibold text-[#0F766E]">
                  <MessageSquareReply className="size-3.5" /> Sotuvchi javobi{r.replyAt ? ` · ${fmtReviewDate(r.replyAt)}` : ""}
                </p>
                <p className="mt-1 text-[12.5px] break-words whitespace-pre-line text-[#4b5568]">{r.reply}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
