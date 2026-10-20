"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Send, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { channelCategories, channelCategoryLabel, type ChannelCategory } from "@/data/channels";
import "../../books/mobile/books-mobile.css";

type Row = { id: string; username: string; name: string; category: ChannelCategory };

export function KanallarMobile() {
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<"all" | ChannelCategory>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [note, setNote] = useState("");

  function load() {
    void fetch("/api/channels", { credentials: "same-origin", cache: "no-store" })
      .then((res) => res.json())
      .then((json: { ok?: boolean; channels?: { id: string; username: string; name: string; category: ChannelCategory }[] }) => {
        if (!json.ok) return;
        setRows(
          (json.channels ?? []).map((item) => ({
            id: item.id,
            username: item.username,
            name: item.name,
            category: item.category,
          })),
        );
      })
      .finally(() => setReady(true));
  }

  useEffect(() => {
    load();
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    return rows.filter((item) => {
      if (topic !== "all" && item.category !== topic) return false;
      if (!q) return true;
      return `${item.username} ${item.name}`.toLowerCase().replace("@", "").includes(q);
    });
  }, [query, rows, topic]);

  return (
    <div className="fk lg:hidden" data-testid="mobile-kanallar">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-channel-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {count > 0 ? <span className="mh-badge">{count > 9 ? "9+" : count}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>
      <div className="fk-body">
        <h1 className="fk-title">Foydali kanallar</h1>
        <p className="fk-sub">Stomatologlar uchun kanallar</p>
        <form className="fk-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input data-channel-search data-section-search value={query} onChange={(event) => setQuery(event.target.value)} placeholder="@username yoki kanal nomi" aria-label="Qidiruv" />
        </form>
        <div className="fk-cats" aria-label="Mavzular">
          <button type="button" className={topic === "all" ? "on" : undefined} onClick={() => setTopic("all")}>Barchasi</button>
          {channelCategories.map((item) => (
            <button key={item.id} type="button" className={topic === item.id ? "on" : undefined} onClick={() => setTopic(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {note ? <p className="fk-note">{note}</p> : null}
        {!ready ? <p className="fk-note">Yuklanmoqda...</p> : null}
        {ready && list.length === 0 ? (
          <p className="fk-note" data-testid="channels-mobile-empty">{rows.length === 0 ? "Hozircha kanal yo‘q" : "Mos kanal topilmadi"}</p>
        ) : null}
        {list.map((item) => (
          <article key={item.id} className="fk-row">
            <div className="fk-ava" aria-hidden>
              <i className="telegram"><Send /></i>
            </div>
            <div>
              <h3>{item.name}</h3>
              <span className="topic">{item.username}</span>
              <p>{channelCategoryLabel[item.category] ?? "Umumiy"}</p>
            </div>
          </article>
        ))}
        <div className="fk-pad" />
      </div>
      <button type="button" className="fk-add" onClick={() => setAddOpen(true)}>
        <Plus /> Kanal qo‘shish
      </button>
      {addOpen ? (
        <div className="fk-sheet" role="dialog" aria-label="Kanal qo‘shish">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setAddOpen(false)} />
          <form
            className="fk-box"
            onSubmit={(event) => {
              event.preventDefault();
              const username = handle.trim().replace(/^@/, "");
              const title = name.trim();
              if (username.length < 3 || !title) {
                setNote("Kanal nomi va username kerak");
                return;
              }
              void fetch("/api/channels", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: title, username, category: topic === "all" ? "umumiy" : topic }),
              }).then(async (res) => {
                const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
                if (!json?.ok) {
                  setNote("Kanalni saqlab bo‘lmadi");
                  return;
                }
                setName("");
                setHandle("");
                setAddOpen(false);
                setNote("Kanal qo‘shildi");
                load();
              });
            }}
          >
            <h3>Kanal qo‘shish</h3>
            <input aria-label="Nomi" value={name} onChange={(event) => setName(event.target.value)} placeholder="Kanal nomi" />
            <input aria-label="Username" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@username" />
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => setAddOpen(false)}>Yopish</button>
              <button type="submit" className="go">Qo‘shish</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
