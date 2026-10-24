"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { cn } from "@/lib/utils";

type Msg = { id: string; mine?: boolean; fromRole?: string; sender?: string; body: string; createdAt: string };
type Conv = { id: string; productId?: string | null; orderId?: string | null; storeId?: string | null };

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Buyer → seller chat (real, stored in `conversations` / `messages`). */
export function ContactSeller({
  storeId,
  shopName,
  productId,
  orderId,
  label = "Sotuvchiga yozish",
  className,
  next,
}: {
  storeId: string;
  shopName?: string;
  productId?: string;
  orderId?: string;
  label?: string;
  className?: string;
  next?: string;
}) {
  const { profile } = useDoctorProfile();
  const [open, setOpen] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadMsgs = useCallback(async (id: string) => {
    const r = await fetch(`/api/conversations/${id}`, { credentials: "same-origin", cache: "no-store" }).then((x) => x.json()).catch(() => null);
    if (r?.ok) setMsgs(r.messages as Msg[]);
  }, []);

  useEffect(() => {
    if (!open || !profile) return;
    let alive = true;
    const qs = new URLSearchParams({ role: "buyer", store: storeId });
    if (productId) qs.set("product", productId);
    if (orderId) qs.set("order", orderId);
    fetch(`/api/conversations?${qs}`, { credentials: "same-origin", cache: "no-store" })
      .then((x) => x.json())
      .then((r: { ok?: boolean; conversations?: Conv[] }) => {
        if (!alive || !r.ok) return;
        const hit = (r.conversations ?? []).find((c) => (c.productId ?? "") === (productId ?? "") && (c.orderId ?? "") === (orderId ?? ""));
        if (hit) {
          setConvId(hit.id);
          void loadMsgs(hit.id);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [open, profile, storeId, productId, orderId, loadMsgs]);

  useEffect(() => {
    if (!open || !convId) return;
    const t = window.setInterval(() => void loadMsgs(convId), 15000);
    return () => window.clearInterval(t);
  }, [open, convId, loadMsgs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length, open]);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = convId
        ? await fetch(`/api/conversations/${convId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ body }),
          })
        : await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ storeId, productId, orderId, body }),
          });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; id?: string; error?: string } | null;
      if (!res.ok || !j?.ok) {
        setErr(j?.error ?? "Xabarni yuborib bo‘lmadi.");
      } else {
        setText("");
        const id = convId ?? j.id ?? null;
        if (id) {
          setConvId(id);
          await loadMsgs(id);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  const nextHref = next ?? (typeof window !== "undefined" ? window.location.pathname : "/");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[#F0FDFA] bg-white text-[12.5px] font-semibold text-[#0F766E] hover:bg-[#f3f8ff]",
          className,
        )}
      >
        <MessageCircle className="size-3.5" />
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#eceff5] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-[#111827]">{shopName ?? "Sotuvchi"}</p>
                <p className="text-[11.5px] text-[#8b93a7]">{orderId ? `Buyurtma ${orderId}` : productId ? "Mahsulot bo‘yicha savol" : "Savol"}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Yopish" className="rounded-full p-1.5 text-[#6b7389] hover:bg-[#f3f5f9]">
                <X className="size-4" />
              </button>
            </div>
            {!profile ? (
              <div className="p-5 text-center">
                <p className="text-[13px] text-[#4b5568]">Sotuvchiga yozish uchun akkauntingizga kiring.</p>
                <Link href={`/kirish?next=${encodeURIComponent(nextHref)}`} className="mt-3 inline-flex h-10 items-center rounded-xl bg-[#0F766E] px-5 text-[13px] font-semibold text-white">
                  Kirish
                </Link>
              </div>
            ) : (
              <>
                <div className="min-h-[160px] flex-1 space-y-2 overflow-y-auto bg-[#f7f9fc] p-3">
                  {msgs.length === 0 ? (
                    <p className="py-8 text-center text-[12.5px] text-[#8b93a7]">Hali xabar yo‘q. Savolingizni yozing — sotuvchi javob beradi.</p>
                  ) : (
                    msgs.map((m) => (
                      <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-[13px]", m.mine ? "bg-[#0F766E] text-white" : "bg-white text-[#1a1d26] ring-1 ring-[#eceff5]")}>
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={cn("mt-0.5 text-[10.5px]", m.mine ? "text-white/70" : "text-[#a3abbd]")}>{fmt(m.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={endRef} />
                </div>
                {err ? <p className="px-4 pt-2 text-[12px] text-[#dc2626]">{err}</p> : null}
                <form
                  className="flex items-center gap-2 border-t border-[#eceff5] p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send();
                  }}
                >
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={2000}
                    placeholder="Xabar yozing..."
                    className="h-10 min-w-0 flex-1 rounded-xl border border-[#e2e8f0] px-3 text-[13px] outline-none focus:border-[#0F766E]"
                  />
                  <button type="submit" disabled={busy || !text.trim()} className="inline-flex size-10 items-center justify-center rounded-xl bg-[#0F766E] text-white disabled:opacity-50" aria-label="Yuborish">
                    <Send className="size-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
