"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

type Status = { configured: boolean; linked: boolean };

async function fetchStatus(): Promise<Status | null> {
  try {
    const j = (await fetch("/api/telegram/link", { cache: "no-store", credentials: "same-origin" }).then((r) => r.json())) as { ok?: boolean; configured?: boolean; linked?: boolean };
    return j.ok ? { configured: Boolean(j.configured), linked: Boolean(j.linked) } : null;
  } catch {
    return null;
  }
}

/** Profile → “Telegram xabarnomalar”: link/unlink the Telegram chat that receives order notifications. */
export function TelegramNotifyCard() {
  const [st, setSt] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    return fetchStatus().then((next) => {
      if (!next) return;
      setSt(next);
      if (next.linked) setWaiting(false);
    });
  }, []);

  useEffect(() => {
    let alive = true;
    void fetchStatus().then((next) => alive && next && setSt(next));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!waiting) return;
    const t = window.setInterval(() => void load(), 4000);
    const stop = window.setTimeout(() => setWaiting(false), 120000);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(stop);
    };
  }, [waiting, load]);

  async function connect() {
    setBusy(true);
    setErr("");
    try {
      const j = (await fetch("/api/telegram/link", { method: "POST", credentials: "same-origin" }).then((r) => r.json())) as { ok?: boolean; url?: string; error?: string };
      if (j.ok && j.url) {
        window.open(j.url, "_blank", "noopener,noreferrer");
        setWaiting(true);
      } else setErr(j.error || "Ulab bo‘lmadi.");
    } catch {
      setErr("Tarmoq xatosi.");
    }
    setBusy(false);
  }

  async function disconnect() {
    setBusy(true);
    setErr("");
    await fetch("/api/telegram/link", { method: "DELETE", credentials: "same-origin" }).catch(() => undefined);
    await load();
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#F0FDFA] px-3.5 py-3 ring-1 ring-[#CCFBF1]" data-testid="telegram-card">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#229ED9] shadow-sm">
        <Send className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-[#1a1d26]">Telegram xabarnomalar</span>
        <span className="block text-[12px] text-[#8b93a7]">
          {!st
            ? "Yuklanmoqda…"
            : !st.configured
              ? "Tez orada — Telegram bot hali sozlanmagan"
              : st.linked
                ? "Ulangan — buyurtma holatlari Telegramga ham keladi"
                : waiting
                  ? "Telegramda “Start” ni bosing, so‘ng shu yerga qayting…"
                  : "Buyurtma holatlarini Telegramda ham oling"}
        </span>
        {err ? <span className="block text-[12px] text-[#dc2626]">{err}</span> : null}
      </span>
      {st?.configured ? (
        st.linked ? (
          <span className="flex shrink-0 items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <button type="button" disabled={busy} onClick={() => void disconnect()} className="h-8 rounded-xl border border-[#e2e8f0] bg-white px-3 text-[12px] font-medium text-[#4b5568] disabled:opacity-60">
              Uzish
            </button>
          </span>
        ) : (
          <button type="button" disabled={busy} onClick={() => void connect()} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#0F766E] px-3.5 text-[12.5px] font-bold text-white disabled:opacity-60">
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Telegramni ulash
          </button>
        )
      ) : st ? (
        <span className="shrink-0 rounded-full bg-[#eef1f6] px-2.5 py-1 text-[11px] font-semibold text-[#8b93a7]">Tez orada</span>
      ) : null}
    </div>
  );
}
