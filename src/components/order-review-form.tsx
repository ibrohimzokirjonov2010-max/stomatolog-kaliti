"use client";

import { useEffect, useState } from "react";
import { MessageSquareReply, Star } from "lucide-react";
import type { OrderItem } from "@/lib/orders";
import { cn } from "@/lib/utils";

function Stars({ value, onChange, size = 22 }: { value: number; onChange: (n: number) => void; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} yulduz`}>
          <Star style={{ width: size, height: size }} className={cn(n <= value ? "fill-[#f5b100] text-[#f5b100]" : "text-[#cfd5e2]")} />
        </button>
      ))}
    </span>
  );
}

type Reviewed = { rating: number; body?: string; createdAt?: string; reply?: string; replyAt?: string };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fmt = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric" }) : "";
};

/** Buyer review form for a delivered order (real: POST /api/reviews). */
export function OrderReviewForm({ orderId, items }: { orderId: string; items: OrderItem[] }) {
  const [done, setDone] = useState<Record<string, Reviewed>>({});
  const [eligible, setEligible] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [quality, setQuality] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/reviews?order=${encodeURIComponent(orderId)}`, { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; eligible?: boolean; reviewed?: ({ productId: string } & Reviewed)[] }) => {
        if (!alive || !j.ok) return;
        setEligible(!!j.eligible);
        setDone(Object.fromEntries((j.reviewed ?? []).map((x) => [x.productId, x])));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [orderId]);

  // only products of real (DB) stores can be reviewed; bundled catalog items have no product row yet
  const reviewable = items.filter((i) => i.shopId && UUID_RE.test(i.productId));
  if (!eligible || reviewable.length === 0) return null;

  async function submit(productId: string) {
    if (!rating) {
      setErr("Bahoni tanlang (1–5).");
      return;
    }
    setBusy(true);
    setErr("");
    const cats: Record<string, number> = {};
    if (quality) cats.quality = quality;
    if (delivery) cats.delivery = delivery;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ orderId, productId, rating, cats, body }),
    }).catch(() => null);
    const j = (await res?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setBusy(false);
    if (!res || !j?.ok) {
      setErr(j?.error ?? "Sharhni saqlab bo‘lmadi.");
      return;
    }
    setDone((d) => ({ ...d, [productId]: { rating, body: body.trim() || undefined, createdAt: new Date().toISOString() } }));
    setOpen(null);
    setRating(0);
    setQuality(0);
    setDelivery(0);
    setBody("");
  }

  return (
    <section className="rounded-[20px] border border-[#eceff5] bg-white p-4 shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)] sm:p-5">
      <h2 className="text-[15px] font-semibold text-[#1a1d26]">Sharh qoldiring</h2>
      <ul className="mt-3 space-y-3">
        {reviewable.map((item) => (
          <li key={item.productId} className="rounded-xl border border-[#eceff5] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[13.5px] font-medium text-[#1a1d26]">{item.name}</p>
              {done[item.productId] ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-[#16a34a]">
                  <Star className="size-3.5 fill-[#f5b100] text-[#f5b100]" /> {done[item.productId].rating} · Sharh yuborildi
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(open === item.productId ? null : item.productId);
                    setErr("");
                  }}
                  className="shrink-0 rounded-lg border border-[#F0FDFA] px-3 py-1.5 text-[12.5px] font-semibold text-[#0F766E] hover:bg-[#f3f8ff]"
                >
                  Baholash
                </button>
              )}
            </div>
            {done[item.productId]?.body ? (
              <p className="mt-2 rounded-lg bg-[#f7f9fc] px-3 py-2 text-[12.5px] break-words whitespace-pre-line text-[#4b5568]">
                {done[item.productId].body}
              </p>
            ) : null}
            {done[item.productId]?.reply ? (
              <div className="mt-2 rounded-lg border-l-2 border-[#0F766E] bg-[#f3f8ff] px-3 py-2">
                <p className="flex items-center gap-1 text-[11.5px] font-semibold text-[#0F766E]">
                  <MessageSquareReply className="size-3.5" /> Sotuvchi javobi{done[item.productId].replyAt ? ` · ${fmt(done[item.productId].replyAt)}` : ""}
                </p>
                <p className="mt-1 text-[12.5px] break-words whitespace-pre-line text-[#1a1d26]">{done[item.productId].reply}</p>
              </div>
            ) : null}
            {open === item.productId && !done[item.productId] ? (
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between text-[12.5px] text-[#4b5568]">Umumiy baho <Stars value={rating} onChange={setRating} /></div>
                <div className="flex items-center justify-between text-[12.5px] text-[#4b5568]">Sifat <Stars value={quality} onChange={setQuality} size={18} /></div>
                <div className="flex items-center justify-between text-[12.5px] text-[#4b5568]">Yetkazib berish <Stars value={delivery} onChange={setDelivery} size={18} /></div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Fikringiz (ixtiyoriy)"
                  className="w-full rounded-xl border border-[#e2e8f0] p-3 text-[13px] outline-none focus:border-[#0F766E]"
                />
                {err ? <p className="text-[12px] text-[#dc2626]">{err}</p> : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submit(item.productId)}
                  className="h-10 w-full rounded-xl bg-[#0F766E] text-[13px] font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "Yuborilmoqda..." : "Sharhni yuborish"}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
