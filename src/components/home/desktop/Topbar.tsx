"use client";
/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, MapPin, Heart, ShoppingCart, Bell } from "lucide-react";
import { useCart } from "./CartContext";

export default function Topbar() {
  const { count } = useCart();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  }

  return (
    <header className="sh-top">
      <Link className="sh-logo" href="/">
        <img src="/img/logo.jpg" alt="" />
        <span>Stoma<b>Hub</b></span>
      </Link>
      <form className="sh-search" onSubmit={onSearch}>
        <div className="sh-search-box">
          <Search className="i" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Mahsulot, brend yoki kategoriya qidiring..."
            aria-label="Qidiruv"
          />
          <Link className="sh-cats" href="/marketplace">
            Barcha kategoriyalar <ChevronDown className="i" />
          </Link>
        </div>
        <button className="sh-search-btn" aria-label="Qidirish">
          <Search className="i" />
        </button>
      </form>
      <div className="sh-actions">
        <button className="sh-loc" type="button">
          <MapPin className="i" />
          Toshkent
          <ChevronDown className="i s" />
        </button>
        <span className="sh-div" />
        <button className="sh-ic" type="button" aria-label="Sevimlilar">
          <Heart className="i" />
        </button>
        <Link className="sh-ic" href="/savat" aria-label="Savat">
          <ShoppingCart className="i" />
          <em className="badge">{count}</em>
        </Link>
        <button className="sh-ic" type="button" aria-label="Bildirishnomalar">
          <Bell className="i" />
          <em className="dot" />
        </button>
        <span className="sh-div" />
        <Link className="sh-user" href="/profil">
          <img src="/img/avatar.jpg" alt="" />
          <span>
            <b>Dr. Shahobiddin</b>
            <small>Stomatolog</small>
          </span>
          <ChevronDown className="i s" />
        </Link>
      </div>
    </header>
  );
}
