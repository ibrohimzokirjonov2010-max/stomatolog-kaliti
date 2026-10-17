"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShNavTree, useProfilActive } from "@/components/nav/sh-nav-tree";
import {
  Bell,
  ChevronDown,
  HelpCircle,
  MapPin,
  MessageCircle,
  Search,
  ShoppingCart,
  UserRound,
  } from "lucide-react";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import "./clinic-shell.css";

const cities = ["Toshkent", "Samarqand", "Buxoro", "Farg‘ona", "Andijon", "Namangan"];

export function ClinicShell({ accent = "teal", children }: { accent?: "teal" | "blue"; children: ReactNode }) {
  const profilActive = useProfilActive();
  const router = useRouter();
  const cart = useShopLineCount();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Toshkent");
  const [cityOpen, setCityOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [help, setHelp] = useState(false);
  const [bell, setBell] = useState(false);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  }

  return (
    <div className={accent === "blue" ? "sh shell-blue" : "sh shell-teal"} data-testid="clinic-shell" data-accent={accent}>
      <header className="sh-top">
        <Link className="sh-logo" href="/">
          <img src="/img/logo.jpg" alt="" />
          <span>Stoma<b>Hub</b></span>
        </Link>
        <form className="sh-search shop" onSubmit={onSearch}>
          <div className="sh-search-box">
            <Search className="i" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Qidirish..." aria-label="Qidiruv" />
          </div>
        </form>
        <div className="sh-actions">
          <div style={{ position: "relative" }}>
            <button className="sh-loc" type="button" data-testid="shell-city" onClick={() => setCityOpen((value) => !value)}>
              <MapPin className="i" />
              {city}
              <ChevronDown className="i s" />
            </button>
            {cityOpen ? (
              <div className="cl-pop" data-testid="shell-cities">
                {cities.map((item) => (
                  <button key={item} type="button" onClick={() => { setCity(item); setCityOpen(false); }}>{item}</button>
                ))}
              </div>
            ) : null}
          </div>
          <span className="sh-div" />
          <div style={{ position: "relative" }}>
            <button className="sh-ic" type="button" aria-label="Chat" data-testid="shell-chat" onClick={() => { setChatOpen((value) => !value); setBell(false); }}>
              <MessageCircle className="i" />
            </button>
            {chatOpen ? (
              <div className="cl-pop" role="dialog" aria-label="Chat" data-testid="shell-chat-box">
                <b>Chat</b>
                {sent ? <p data-testid="shell-chat-sent">Xabar yuborildi</p> : (
                  <>
                    <textarea aria-label="Xabar" value={note} placeholder="Xabar yozing" onChange={(event) => setNote(event.target.value)} />
                    <button type="button" className="cl-send" onClick={() => { if (note.trim()) setSent(true); }}>Yuborish</button>
                  </>
                )}
              </div>
            ) : null}
          </div>
          <Link className="sh-ic" href="/savat" aria-label="Savat">
            <ShoppingCart className="i" />
            <em className="badge">{cart || 3}</em>
          </Link>
          <div style={{ position: "relative" }}>
            <button className="sh-ic" type="button" aria-label="Bildirishnomalar" data-testid="shell-bell" onClick={() => { setBell((value) => !value); setChatOpen(false); }}>
              <Bell className="i" />
              <em className="dot" />
            </button>
            {bell ? (
              <div className="cl-pop" data-testid="shell-bell-box">
                <b>Bildirishnomalar</b>
                <p>Yangi qabul so‘rovi: Aliyeva Mohira</p>
                <p>Buyurtma SK-10077 yetkazildi</p>
              </div>
            ) : null}
          </div>
          <span className="sh-div" />
          <Link className="sh-user" href="/profil">
            <img src="/img/shop/avatar.jpg" alt="" />
            <span>
              <b>Dr. Ibrohim</b>
              <small>Stomatolog</small>
            </span>
            <ChevronDown className="i s" />
          </Link>
        </div>
      </header>
      <div className="sh-body">
        <aside className="sh-side">
          <ShNavTree />
          <div className="cl-foot">
            <Link className={profilActive ? "sh-nav active" : "sh-nav"} href="/profil">
              <UserRound className="i" />
              <span>Profil</span>
            </Link>
            <button type="button" className="sh-nav" data-testid="shell-help" onClick={() => setHelp((value) => !value)}>
              <HelpCircle className="i" />
              <span>Yordam</span>
            </button>
            {help ? <p className="crm-muted" data-testid="shell-help-text" style={{ padding: "0 calc(.4 * var(--u)) calc(.3 * var(--u))" }}>Qo‘llab-quvvatlash: +998 71 200 00 00</p> : null}
          </div>
        </aside>
        <main className="sh-main dk">{children}</main>
      </div>
    </div>
  );
}
