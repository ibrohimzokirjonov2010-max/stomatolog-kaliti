"use client";
/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Camera, ChevronDown, Heart, MapPin, Search, ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";
import { useShopFavs } from "@/components/shop/desktop/shop-cart";

const cities = ["Toshkent", "Samarqand", "Buxoro", "Farg‘ona", "Andijon"];

export default function Topbar({
  variant = "home",
  searchPath = "/marketplace",
  cartCount,
}: {
  variant?: "home" | "shop";
  searchPath?: string;
  cartCount?: number;
}) {
  const { count } = useCart();
  const favs = useShopFavs();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Toshkent");
  const [cityOpen, setCityOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const shown = variant === "shop" ? (cartCount ?? 0) : count;

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    const path = variant === "shop" ? searchPath : "/marketplace";
    router.push(q ? `${path}?q=${encodeURIComponent(q)}` : path);
  }

  return (
    <header className="sh-top">
      <Link className="sh-logo" href="/">
        <img src="/img/logo.jpg" alt="" />
        <span>Stoma<b>Hub</b></span>
      </Link>
      <form className={variant === "shop" ? "sh-search shop" : "sh-search"} onSubmit={onSearch}>
        <div className="sh-search-box">
          <Search className="i" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={variant === "shop" ? "Material, brend yoki kategoriya bo‘yicha qidiring..." : "Mahsulot, brend yoki kategoriya qidiring..."}
            aria-label="Qidiruv"
          />
          {shot ? <img className="cam-prev" src={shot} alt="" /> : null}
          {variant === "home" ? (
            <Link className="sh-cats" href="/marketplace">
              Barcha kategoriyalar <ChevronDown className="i" />
            </Link>
          ) : null}
        </div>
        {variant === "home" ? (
          <button className="sh-search-btn" aria-label="Qidirish">
            <Search className="i" />
          </button>
        ) : (
          <>
            <button className="sh-cam" type="button" onClick={() => fileRef.current?.click()}>
              <Camera className="i" /> Rasm orqali qidirish
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              aria-label="Rasm yuklash"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setShot(url);
              }}
            />
          </>
        )}
      </form>
      <div className="sh-actions">
        <div style={{ position: "relative" }}>
          <button className="sh-loc" type="button" onClick={() => variant === "shop" && setCityOpen((value) => !value)}>
            <MapPin className="i" />
            {city}
            <ChevronDown className="i s" />
          </button>
          {cityOpen ? (
            <div className="dk-pop" style={{ right: 0, left: "auto", top: "calc(1.8 * var(--u))" }}>
              {cities.map((item) => (
                <button key={item} type="button" className="dk-check" onClick={() => { setCity(item); setCityOpen(false); }}>
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <span className="sh-div" />
        <button className="sh-ic" type="button" aria-label="Sevimlilar" onClick={() => variant === "shop" && setFavOpen((value) => !value)}>
          <Heart className="i" />
          {variant === "shop" && favs.length > 0 ? <em className="badge">{favs.length}</em> : null}
        </button>
        {favOpen ? (
          <div className="dk-pop" style={{ position: "absolute", right: "calc(8 * var(--u))", top: "calc(3 * var(--u))", zIndex: 30 }}>
            {favs.length === 0 ? <p>Hali sevimlilar yo‘q</p> : favs.map((id) => <div key={id}>{id}</div>)}
          </div>
        ) : null}
        <Link className="sh-ic" href={variant === "shop" ? searchPath : "/savat"} aria-label="Savat">
          <ShoppingCart className="i" />
          <em className="badge">{shown}</em>
        </Link>
        <button className="sh-ic" type="button" aria-label="Bildirishnomalar">
          <Bell className="i" />
          <em className="dot" />
        </button>
        <span className="sh-div" />
        <Link className="sh-user" href="/profil">
          <img src={variant === "shop" ? "/img/shop/avatar.jpg" : "/img/avatar.jpg"} alt="" />
          <span>
            <b>{variant === "shop" ? "Dr. Ibrohim" : "Dr. Shahobiddin"}</b>
            <small>Stomatolog</small>
          </span>
          <ChevronDown className="i s" />
        </Link>
      </div>
    </header>
  );
}
