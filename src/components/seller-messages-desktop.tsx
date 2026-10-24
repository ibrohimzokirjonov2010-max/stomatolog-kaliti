"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Ban,
  Check,
  CheckCheck,
  FolderArchive,
  MessageCircle,
  MessageSquare,
  Package,
  Paperclip,
  Percent,
  Phone,
  Search,
  Send,
  ShoppingBag,
  Smile,
  Video,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { Panel, SoonTag } from "@/components/seller-desktop-ui";
import { cabinetHref } from "@/components/seller-cabinet-nav";
import { formatMoney } from "@/lib/format";
import { orderStatusLabel, statusBadgeClass, type OrderStatus } from "@/lib/orders";
import { pingSellerLive } from "@/lib/use-seller-live";
import { cn } from "@/lib/utils";

type Buyer = {
  id: string;
  name: string;
  registeredAt?: string;
  orders: number;
  phone?: string;
  city?: string;
  telegram?: string;
  recent?: { id: string; createdAt: string; status: OrderStatus; total: number }[];
};
type Conv = {
  id: string;
  topic: "order" | "product" | "general";
  orderId?: string;
  productId?: string;
  archived: boolean;
  lastMessage?: string;
  lastMessageAt: string;
  sellerUnread: number;
  product?: { id: string; name: string; price: number; image?: string };
  order?: { id: string; createdAt: string; status: OrderStatus; payment: string; total: number; qty: number; name?: string; image?: string };
  buyer: Buyer;
};
type Msg = { id: number; from: "buyer" | "seller"; body: string; createdAt: string; readAt?: string };
type Tab = "all" | "new" | "order" | "product" | "archive";

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dmy = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

function listTime(iso: string) {
  const d = new Date(iso);
  const diff = (startOfDay(new Date()) - startOfDay(d)) / 86400000;
  if (diff <= 0) return hhmm(d);
  if (diff === 1) return "Kecha";
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}
function dayLabel(iso: string) {
  const d = new Date(iso);
  const diff = (startOfDay(new Date()) - startOfDay(d)) / 86400000;
  if (diff <= 0) return "Bugun";
  if (diff === 1) return "Kecha";
  return dmy(d);
}
const money = (n: number) => formatMoney(n, "UZS");
const PAY: Record<string, string> = { click: "Click", payme: "Payme", naqd: "Naqd" };
const EMOJIS = ["👍", "🙏", "😊", "✅", "📦", "🚚", "💊", "🦷"];

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${hue} 55% 52%)` }}
    >
      {name.trim().slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}

async function jfetch<T>(url: string, init?: RequestInit): Promise<(T & { ok: boolean; error?: string }) | null> {
  try {
    const res = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
    return (await res.json()) as T & { ok: boolean; error?: string };
  } catch {
    return null;
  }
}

export function SellerMessagesDesktop() {
  const { myProducts } = useSellerWork();
  const params = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [convs, setConvs] = useState<Conv[] | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState(urlQ);
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    setQ(urlQ);
  }
  const [selId, setSelId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [prodOpen, setProdOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const d = await jfetch<{ conversations: Conv[] }>("/api/conversations?role=seller");
    if (d?.ok) {
      setConvs(d.conversations);
      setErr("");
    } else if (d) setErr(d.error ?? "Yuklab bo‘lmadi.");
  }, []);

  useEffect(() => {
    const first = window.setTimeout(() => void loadList(), 0);
    const t = window.setInterval(() => void loadList(), 15000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [loadList]);

  const loadMsgs = useCallback(async (id: string) => {
    const d = await jfetch<{ messages: Msg[] }>(`/api/conversations/${id}`);
    if (d?.ok) {
      setMsgs(d.messages);
      pingSellerLive();
    }
  }, []);

  useEffect(() => {
    if (!selId) return;
    const first = window.setTimeout(() => void loadMsgs(selId), 0);
    const t = window.setInterval(() => void loadMsgs(selId), 8000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [selId, loadMsgs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length, selId]);

  const all = useMemo(() => convs ?? [], [convs]);
  const counts = useMemo(
    () => ({
      all: all.filter((c) => !c.archived).length,
      new: all.filter((c) => !c.archived && c.sellerUnread > 0).length,
      order: all.filter((c) => !c.archived && c.topic === "order").length,
      product: all.filter((c) => !c.archived && c.topic === "product").length,
      archive: all.filter((c) => c.archived).length,
    }),
    [all],
  );
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((c) => {
      if (tab === "archive" ? !c.archived : c.archived) return false;
      if (tab === "new" && c.sellerUnread === 0) return false;
      if (tab === "order" && c.topic !== "order") return false;
      if (tab === "product" && c.topic !== "product") return false;
      if (!needle) return true;
      return [c.buyer.name, c.orderId, c.lastMessage, c.product?.name, c.order?.name, c.buyer.phone].some((v) => v?.toLowerCase().includes(needle));
    });
  }, [all, tab, q]);

  const sel = shown.find((c) => c.id === selId) ?? shown[0] ?? null;
  const activeId = sel?.id ?? null;
  if (activeId && activeId !== selId) setSelId(activeId);

  async function send() {
    const text = draft.trim();
    if (!text || !sel || sending) return;
    setSending(true);
    const d = await jfetch(`/api/conversations/${sel.id}`, { method: "POST", body: JSON.stringify({ body: text }) });
    setSending(false);
    if (d?.ok) {
      setDraft("");
      await Promise.all([loadMsgs(sel.id), loadList()]);
    } else setErr(d?.error ?? "Yuborib bo‘lmadi.");
  }

  async function archive(c: Conv, archived: boolean) {
    setMenuOpen(false);
    const d = await jfetch(`/api/conversations/${c.id}`, { method: "PATCH", body: JSON.stringify({ archived }) });
    if (d?.ok) {
      setSelId(null);
      await loadList();
      pingSellerLive();
    }
  }

  const tabs: { id: Tab; label: string; n: number; icon: LucideIcon; dot?: boolean }[] = [
    { id: "all", label: "Barchasi", n: counts.all, icon: MessageSquare },
    { id: "new", label: "Yangi", n: counts.new, icon: MessageCircle, dot: true },
    { id: "order", label: "Buyurtmalar", n: counts.order, icon: ShoppingBag },
    { id: "product", label: "Mahsulotlar", n: counts.product, icon: Package },
    { id: "archive", label: "Arxiv", n: counts.archive, icon: Archive },
  ];

  const phoneDigits = sel?.buyer.phone?.replace(/\D/g, "") ?? "";
  const regDate = sel?.buyer.registeredAt ? new Date(sel.buyer.registeredAt) : null;
  const lastBuyerMsg = [...msgs].reverse().find((m) => m.from === "buyer");

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#0B1F4D]">Xabarlar</h1>
          <p className="mt-1 text-[13.5px] text-[#6b7280]">Xaridorlar bilan muloqot qiling, savollarga javob bering va buyurtmalarni muhokama qiling.</p>
        </div>
        <button
          type="button"
          onClick={() => setTab("archive")}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e4e9f2] bg-white px-4 text-[13.5px] font-semibold text-[#4b5568] hover:border-[#99F6E4] hover:text-[#0F766E]"
        >
          <FolderArchive className="size-4" />
          Arxivlangan
        </button>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-[13.5px] font-semibold transition-colors",
                tab === t.id
                  ? "border-[#0F766E] bg-[#0F766E] text-white shadow-[0_4px_12px_rgba(15,118,110,0.25)]"
                  : "border-[#e4e9f2] bg-white text-[#4b5568] hover:border-[#99F6E4] hover:text-[#0F766E]",
              )}
            >
              {t.dot && t.n > 0 ? <span className="size-2 rounded-full bg-[#ef4444]" /> : <Icon className="size-4" />}
              {t.label} <span className={cn("text-[12px]", tab === t.id ? "text-white/80" : "text-[#8b93a7]")}>({t.n})</span>
            </button>
          );
        })}
      </div>

      {err ? <p className="rounded-xl bg-[#fef2f2] px-3 py-2 text-[13px] text-[#b91c1c]">{err}</p> : null}

      {convs && all.length === 0 ? (
        <Panel className="grid place-items-center py-20 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-[#F0FDFA]">
            <MessageSquare className="size-8 text-[#0F766E]" />
          </span>
          <p className="mt-4 text-[17px] font-bold text-[#0B1F4D]">Hali xabarlar yo‘q</p>
          <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-[#6b7280]">
            Xaridorlar mahsulot yoki buyurtma sahifasidan “Sotuvchiga yozish” tugmasi orqali sizga yozganda, muloqotlar shu yerda ko‘rinadi.
          </p>
        </Panel>
      ) : (
        <div className="grid h-[calc(100vh-300px)] min-h-[520px] grid-cols-[300px_minmax(0,1fr)_300px] gap-4 xl:grid-cols-[330px_minmax(0,1fr)_320px]">
          {/* list */}
          <section className="flex min-h-0 flex-col rounded-2xl border border-[#eceff5] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#a3abbd]" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Muloqotlarni qidirish..."
                  className="h-10 w-full rounded-xl border border-[#e4e9f2] bg-[#f7f9fc] pr-3 pl-9 text-[13px] outline-none focus:border-[#0F766E] focus:bg-white"
                />
              </div>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {convs == null ? <li className="p-5 text-center text-[13px] text-[#8b93a7]">Yuklanmoqda…</li> : null}
              {convs && shown.length === 0 ? (
                <li className="p-6 text-center text-[13px] text-[#8b93a7]">{q ? "Hech narsa topilmadi." : tab === "archive" ? "Arxiv bo‘sh." : "Bu bo‘limda muloqot yo‘q."}</li>
              ) : null}
              {shown.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelId(c.id)}
                    className={cn(
                      "flex w-full gap-3 border-l-[3px] px-3.5 py-3 text-left transition-colors hover:bg-[#f7faff]",
                      sel?.id === c.id ? "border-[#0F766E] bg-[#f0f6ff]" : "border-transparent",
                    )}
                  >
                    <Avatar name={c.buyer.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13.5px] font-bold text-[#0B1F4D]">{c.buyer.name}</p>
                        <span className="shrink-0 text-[11px] text-[#8b93a7]">{listTime(c.lastMessageAt)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className={cn("truncate text-[12.5px]", c.sellerUnread ? "font-semibold text-[#0B1F4D]" : "text-[#6b7280]")}>{c.lastMessage ?? "—"}</p>
                        {c.sellerUnread > 0 ? (
                          <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[#0F766E] text-[10.5px] font-bold text-white">{c.sellerUnread}</span>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {c.orderId ? (
                          <span className="rounded-md bg-[#F0FDFA] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#0F766E]">{c.orderId}</span>
                        ) : null}
                        <span className="rounded-md bg-[#f1f4f9] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#6b7280]">
                          {c.topic === "product" ? "Mahsulot savoli" : c.topic === "order" ? "Buyurtma" : "Savol"}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* chat */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#eceff5] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            {sel ? (
              <>
                <div className="flex items-center gap-3 border-b border-[#eef1f6] px-4 py-3">
                  <Avatar name={sel.buyer.name} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold text-[#0B1F4D]">{sel.buyer.name}</p>
                    <p className="text-[12px] text-[#8b93a7]">
                      {lastBuyerMsg ? `Oxirgi xabar ${dayLabel(lastBuyerMsg.createdAt) === "Bugun" ? "" : dayLabel(lastBuyerMsg.createdAt) + ", "}${hhmm(new Date(lastBuyerMsg.createdAt))}` : "Xaridor"}
                    </p>
                  </div>
                  {sel.buyer.phone ? (
                    <a href={`tel:${sel.buyer.phone.replace(/\s/g, "")}`} className="grid size-9 place-items-center rounded-lg border border-[#e4e9f2] text-[#4b5568] hover:border-[#99F6E4] hover:text-[#0F766E]" aria-label="Qo‘ng‘iroq">
                      <Phone className="size-4" />
                    </a>
                  ) : (
                    <span className="grid size-9 place-items-center rounded-lg border border-[#eef1f6] text-[#c3cad9]" title="Telefon raqami yo‘q">
                      <Phone className="size-4" />
                    </span>
                  )}
                  <span className="grid size-9 cursor-not-allowed place-items-center rounded-lg border border-[#eef1f6] text-[#c3cad9]" title="Video qo‘ng‘iroq — tez orada">
                    <Video className="size-4" />
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpen((v) => !v)}
                      className="grid size-9 place-items-center rounded-lg border border-[#e4e9f2] text-[#4b5568] hover:border-[#99F6E4]"
                      aria-label="Amallar"
                    >
                      <span className="text-[18px] leading-none">⋯</span>
                    </button>
                    {menuOpen ? (
                      <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-[#e4e9f2] bg-white p-1 shadow-lg">
                        <button type="button" onClick={() => archive(sel, !sel.archived)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-[#0B1F4D] hover:bg-[#f4f7fc]">
                          {sel.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                          {sel.archived ? "Arxivdan chiqarish" : "Arxivlash"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {sel.product ? (
                  <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-[#eceff5] bg-[#fafbfd] p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {sel.product.image ? <img src={sel.product.image} alt="" className="size-11 shrink-0 rounded-lg bg-white object-contain" /> : <span className="size-11 shrink-0 rounded-lg bg-[#f1f4f9]" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-[#0B1F4D]">{sel.product.name}</p>
                      <p className="text-[12px] text-[#6b7280]">{money(sel.product.price)}</p>
                    </div>
                    <Link href={`/marketplace/${sel.product.id}`} className="inline-flex h-9 items-center rounded-lg bg-[#0F766E] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[#0055d4]">
                      Mahsulotni ko‘rish
                    </Link>
                  </div>
                ) : sel.order ? (
                  <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-[#eceff5] bg-[#fafbfd] p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {sel.order.image ? <img src={sel.order.image} alt="" className="size-11 shrink-0 rounded-lg bg-white object-contain" /> : <span className="size-11 shrink-0 rounded-lg bg-[#f1f4f9]" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-[#0B1F4D]">Buyurtma {sel.order.id}</p>
                      <p className="truncate text-[12px] text-[#6b7280]">{sel.order.name} · {money(sel.order.total)}</p>
                    </div>
                    <Link href={`${cabinetHref("orders")}&q=${sel.order.id}`} className="inline-flex h-9 items-center rounded-lg bg-[#0F766E] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[#0055d4]">
                      Buyurtmani ko‘rish
                    </Link>
                  </div>
                ) : null}

                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
                  {msgs.map((m, i) => {
                    const newDay = i === 0 || dayLabel(m.createdAt) !== dayLabel(msgs[i - 1].createdAt);
                    const mine = m.from === "seller";
                    return (
                      <div key={m.id}>
                        {newDay ? (
                          <div className="my-2 flex justify-center">
                            <span className="rounded-full bg-[#f1f4f9] px-3 py-1 text-[11.5px] font-medium text-[#6b7280]">{dayLabel(m.createdAt)}</span>
                          </div>
                        ) : null}
                        <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[72%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed", mine ? "rounded-br-md bg-[#CCFBF1] text-[#0B1F4D]" : "rounded-bl-md bg-[#f1f4f9] text-[#1a1d26]")}>
                            <p className="break-words whitespace-pre-wrap">{m.body}</p>
                            <p className={cn("mt-0.5 flex items-center gap-1 text-[10.5px] text-[#8b93a7]", mine && "justify-end")}>
                              {hhmm(new Date(m.createdAt))}
                              {mine ? m.readAt ? <CheckCheck className="size-3.5 text-[#0F766E]" /> : <Check className="size-3.5" /> : null}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>

                <div className="relative border-t border-[#eef1f6] p-3">
                  {emojiOpen ? (
                    <div className="absolute bottom-[68px] left-14 z-20 flex gap-1 rounded-xl border border-[#e4e9f2] bg-white p-1.5 shadow-lg">
                      {EMOJIS.map((e) => (
                        <button key={e} type="button" className="grid size-8 place-items-center rounded-lg text-[18px] hover:bg-[#f4f7fc]" onClick={() => { setDraft((d) => d + e); setEmojiOpen(false); }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-end gap-2">
                    <span className="grid size-10 shrink-0 cursor-not-allowed place-items-center rounded-xl text-[#c3cad9]" title="Fayl biriktirish — tez orada">
                      <Paperclip className="size-5" />
                    </span>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      rows={1}
                      maxLength={2000}
                      placeholder="Xabar yozing..."
                      className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-[#e4e9f2] bg-[#f7f9fc] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#0F766E] focus:bg-white"
                    />
                    <button type="button" onClick={() => setEmojiOpen((v) => !v)} className="grid size-10 shrink-0 place-items-center rounded-xl text-[#6b7280] hover:bg-[#f4f7fc]" aria-label="Emoji">
                      <Smile className="size-5" />
                    </button>
                    <button
                      type="button"
                      disabled={!draft.trim() || sending}
                      onClick={() => void send()}
                      className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-white hover:bg-[#0055d4] disabled:bg-[#b9d2ff]"
                      aria-label="Yuborish"
                    >
                      <Send className="size-[18px]" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center text-center">
                <div>
                  <MessageSquare className="mx-auto size-10 text-[#c3cad9]" />
                  <p className="mt-3 text-[14px] font-semibold text-[#0B1F4D]">Muloqotni tanlang</p>
                  <p className="mt-1 text-[12.5px] text-[#8b93a7]">Chapdagi ro‘yxatdan xaridorni tanlang.</p>
                </div>
              </div>
            )}
          </section>

          {/* right */}
          <aside className="min-h-0 space-y-3 overflow-y-auto">
            {sel ? (
              <>
                <Panel title="Mijoz haqida" className="!p-4">
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar name={sel.buyer.name} size={52} />
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-bold text-[#0B1F4D]">{sel.buyer.name}</p>
                      {sel.buyer.orders >= 2 ? (
                        <span className="mt-1 inline-block rounded-full bg-[#ecfdf3] px-2 py-0.5 text-[10.5px] font-semibold text-[#15803d]">Doimiy mijoz</span>
                      ) : sel.buyer.orders === 0 ? (
                        <span className="mt-1 inline-block rounded-full bg-[#f1f4f9] px-2 py-0.5 text-[10.5px] font-semibold text-[#8b93a7]">Hali buyurtma bermagan</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {sel.buyer.phone ? (
                      <a href={`tel:${sel.buyer.phone.replace(/\s/g, "")}`} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#e4e9f2] text-[12px] font-semibold text-[#4b5568] hover:border-[#99F6E4] hover:text-[#0F766E]"><Phone className="size-3.5" />Telefon</a>
                    ) : (
                      <span className="flex h-9 cursor-not-allowed items-center justify-center gap-1 rounded-lg border border-[#eef1f6] text-[12px] font-semibold text-[#c3cad9]"><Phone className="size-3.5" />Telefon</span>
                    )}
                    {sel.buyer.telegram ? (
                      <a href={`https://t.me/${sel.buyer.telegram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="flex h-9 items-center justify-center rounded-lg border border-[#e4e9f2] text-[12px] font-semibold text-[#4b5568] hover:border-[#99F6E4] hover:text-[#0F766E]">Telegram</a>
                    ) : (
                      <span className="flex h-9 cursor-not-allowed items-center justify-center rounded-lg border border-[#eef1f6] text-[12px] font-semibold text-[#c3cad9]" title="Telegram ma’lumoti yo‘q">Telegram</span>
                    )}
                    {phoneDigits.length >= 9 ? (
                      <a href={`https://wa.me/${phoneDigits.length === 9 ? "998" + phoneDigits : phoneDigits}`} target="_blank" rel="noreferrer" className="flex h-9 items-center justify-center rounded-lg border border-[#e4e9f2] text-[12px] font-semibold text-[#4b5568] hover:border-[#99F6E4] hover:text-[#0F766E]">WhatsApp</a>
                    ) : (
                      <span className="flex h-9 cursor-not-allowed items-center justify-center rounded-lg border border-[#eef1f6] text-[12px] font-semibold text-[#c3cad9]">WhatsApp</span>
                    )}
                  </div>
                  <dl className="mt-3 space-y-1.5 text-[12.5px]">
                    <div className="flex justify-between gap-2"><dt className="text-[#8b93a7]">Telefon</dt><dd className="font-semibold text-[#0B1F4D]">{sel.buyer.phone ?? "—"}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-[#8b93a7]">Shahar</dt><dd className="font-semibold text-[#0B1F4D]">{sel.buyer.city ?? "—"}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-[#8b93a7]">Ro‘yxatdan o‘tgan</dt><dd className="font-semibold text-[#0B1F4D]">{regDate ? `${regDate.getFullYear()}-yil ${regDate.getDate()}-${MONTHS[regDate.getMonth()]}` : "—"}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-[#8b93a7]">Jami buyurtma</dt><dd className="font-semibold text-[#0B1F4D]">{sel.buyer.orders} ta</dd></div>
                  </dl>
                </Panel>

                <Panel title="Joriy buyurtma" className="!p-4">
                  {sel.order ? (
                    <div className="mt-3 rounded-xl border border-[#eceff5] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-bold text-[#0F766E]">{sel.order.id}</p>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1", statusBadgeClass(sel.order.status))}>{orderStatusLabel[sel.order.status]}</span>
                      </div>
                      <p className="mt-1 text-[11.5px] text-[#8b93a7]">{dmy(new Date(sel.order.createdAt))} · {PAY[sel.order.payment] ?? sel.order.payment}</p>
                      <div className="mt-2 flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {sel.order.image ? <img src={sel.order.image} alt="" className="size-10 rounded-lg bg-[#f4f6fa] object-contain" /> : <span className="size-10 rounded-lg bg-[#f4f6fa]" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-semibold text-[#0B1F4D]">{sel.order.name}</p>
                          <p className="text-[11.5px] text-[#8b93a7]">{sel.order.qty} dona</p>
                        </div>
                        <b className="text-[12.5px] text-[#0B1F4D]">{money(sel.order.total)}</b>
                      </div>
                      <Link href={`${cabinetHref("orders")}&q=${sel.order.id}`} className="mt-2.5 block text-center text-[12.5px] font-semibold text-[#0F766E] hover:underline">Buyurtmani ko‘rish</Link>
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl bg-[#f7f9fc] px-3 py-4 text-center text-[12.5px] text-[#8b93a7]">Bu muloqot buyurtmaga bog‘lanmagan.</p>
                  )}
                </Panel>

                <Panel title="Oxirgi buyurtmalar" className="!p-4">
                  {sel.buyer.recent?.length ? (
                    <ul className="mt-3 space-y-2.5">
                      {sel.buyer.recent.map((o) => (
                        <li key={o.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                          <div>
                            <p className="font-semibold text-[#0B1F4D]">{o.id}</p>
                            <p className="text-[11px] text-[#8b93a7]">{dmy(new Date(o.createdAt))}</p>
                          </div>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1", statusBadgeClass(o.status))}>{orderStatusLabel[o.status]}</span>
                          <b className="text-[#0B1F4D]">{money(o.total)}</b>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[12.5px] text-[#8b93a7]">Bu mijozning buyurtmalari yo‘q.</p>
                  )}
                </Panel>

                <Panel title="Tez harakatlar" className="!p-4">
                  <div className="relative mt-3 grid grid-cols-4 gap-2">
                    <button type="button" onClick={() => setProdOpen((v) => !v)} className="flex flex-col items-center gap-1 rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] px-1 py-2.5 text-center text-[10.5px] font-semibold text-[#0F766E] hover:bg-[#F0FDFA]">
                      <Link2 className="size-[18px]" />
                      Mahsulot ulash
                    </button>
                    {([["Buyurtma yaratish", ShoppingBag, "#0F766E"], ["Chegirma berish", Percent, "#dc2626"], ["Mijozni bloklash", Ban, "#dc2626"]] as const).map(([label, Icon, color]) => (
                      <span key={label} className="flex cursor-not-allowed flex-col items-center gap-1 rounded-xl border border-[#eef1f6] bg-[#fafbfd] px-1 py-2.5 text-center text-[10.5px] font-semibold text-[#a3abbd]" title="Tez orada">
                        <Icon className="size-[18px]" style={{ color: `${color}66` }} />
                        {label}
                      </span>
                    ))}
                    {prodOpen ? (
                      <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#e4e9f2] bg-white p-1 shadow-lg">
                        {myProducts.length === 0 ? <p className="p-3 text-[12px] text-[#8b93a7]">Mahsulotlaringiz yo‘q.</p> : null}
                        {myProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="block w-full truncate rounded-lg px-2.5 py-2 text-left text-[12.5px] hover:bg-[#f4f7fc]"
                            onClick={() => {
                              setDraft((d) => `${d}${d ? "\n" : ""}${p.name} — ${money(p.price)}\n${window.location.origin}/marketplace/${p.id}`);
                              setProdOpen(false);
                            }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#8b93a7]"><SoonTag /> Qolgan harakatlar keyin qo‘shiladi.</p>
                </Panel>
              </>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}
