"use client";
/* eslint-disable @next/next/no-img-element -- seller uploads are remote; desktop shell sizes raw images with --u */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Droplet,
  Heart,
  Layers,
  LayoutGrid,
  List,
  MapPin,
  MoreHorizontal,
  Package,
  PencilLine,
  Pipette,
  Plus,
  Scissors,
  ShieldCheck,
  ShoppingCart,
  Syringe,
  Anchor,
  BadgeCheck,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { ContactForm, Modal, PostForm, sellerLine } from "@/components/surplus-forms";
import { useSurplusWork } from "@/components/surplus-provider";
import {
  listingDiscount,
  listingExpiry,
  listingToProduct,
  normalizeCategory,
  statusLabel,
  surplusBrandLabel,
  surplusCities,
  type PackageStatus,
  type SurplusCategory,
  type SurplusListing,
} from "@/data/surplus";
import { somPlain, som, useShopLines } from "./shop-cart";
import { RangeSlider } from "./parts";
import { ShopShell } from "./ShopShell";
import "./surplus-desktop.css";

type ChipId = "all" | "kompozit" | "bonding" | "sement" | "implantlar" | "instrument" | "anesteziya" | "boshqa";
type SortKey = "new" | "cheap" | "expensive" | "discount" | "expiry";
type ExpiryMin = 0 | 6 | 12 | 24;

const PRICE_MAX = 50_000_000;

const chips: { id: ChipId; label: string; Icon: typeof Syringe }[] = [
  { id: "all", label: "Barchasi", Icon: LayoutGrid },
  { id: "kompozit", label: "Kompozit", Icon: Syringe },
  { id: "bonding", label: "Bond", Icon: Droplet },
  { id: "sement", label: "Sement", Icon: Layers },
  { id: "implantlar", label: "Implant", Icon: Anchor },
  { id: "instrument", label: "Instrument", Icon: Scissors },
  { id: "anesteziya", label: "Anesteziya", Icon: Pipette },
  { id: "boshqa", label: "Boshqa", Icon: MoreHorizontal },
];

const MAIN_CATS: SurplusCategory[] = ["kompozit", "bonding", "sement", "implantlar", "instrument", "anesteziya"];

const sortLabels: Record<SortKey, string> = {
  new: "Eng yangi",
  cheap: "Arzonroq",
  expensive: "Qimmatroq",
  discount: "Katta chegirma",
  expiry: "Yaroqlilik uzoqroq",
};

const expiryOptions: { value: ExpiryMin; label: string }[] = [
  { value: 0, label: "Barchasi" },
  { value: 6, label: "6 oydan ko‘p" },
  { value: 12, label: "12 oydan ko‘p" },
  { value: 24, label: "24 oydan ko‘p" },
];

function chipOf(listing: SurplusListing): ChipId {
  const cat = normalizeCategory(listing.category);
  return (MAIN_CATS as string[]).includes(cat) ? (cat as ChipId) : "boshqa";
}

function initials(name: string) {
  return (
    name
      .replace(/^Dr\.?\s*/i, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "D"
  );
}

function created(listing: SurplusListing) {
  const t = listing.createdAt ? Date.parse(listing.createdAt) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

export function SurplusDesktopCatalog() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const { feed, ready } = useSurplusWork();
  const lines = useShopLines();
  const [chip, setChip] = useState<ChipId>("all");
  const [city, setCity] = useState("");
  const [pkg, setPkg] = useState<PackageStatus | "">("");
  const [price, setPrice] = useState<[number, number]>([0, PRICE_MAX]);
  const [expiryMin, setExpiryMin] = useState<ExpiryMin>(0);
  const [sort, setSort] = useState<SortKey>("new");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [modal, setModal] = useState<"post" | "contact" | "edit" | null>(() => (params.get("joylash") === "1" ? "post" : null));
  const [active, setActive] = useState<SurplusListing | null>(null);

  const cities = useMemo(() => [...new Set([...surplusCities, ...feed.map((item) => item.city).filter(Boolean)])], [feed]);

  const items = useMemo(() => {
    const rows = feed.filter((item) => {
      if (chip !== "all" && chipOf(item) !== chip) return false;
      if (city && item.city !== city) return false;
      if (pkg && item.status !== pkg) return false;
      if (item.price < price[0] || item.price > price[1]) return false;
      if (expiryMin && item.expiryMonths < expiryMin) return false;
      if (q && !`${item.name} ${item.brand} ${item.seller} ${item.city}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "cheap") return a.price - b.price;
      if (sort === "expensive") return b.price - a.price;
      if (sort === "discount") return listingDiscount(b) - listingDiscount(a);
      if (sort === "expiry") return b.expiryMonths - a.expiryMonths;
      return created(b) - created(a);
    });
  }, [chip, city, expiryMin, feed, pkg, price, q, sort]);

  const filtersOn = chip !== "all" || Boolean(city) || Boolean(pkg) || price[0] > 0 || price[1] < PRICE_MAX || expiryMin > 0 || Boolean(q);

  function resetAll() {
    setChip("all");
    setCity("");
    setPkg("");
    setPrice([0, PRICE_MAX]);
    setExpiryMin(0);
  }

  const setPriceAt = (index: 0 | 1, raw: string) => {
    const value = Math.min(Number(raw.replace(/\D/g, "")) || 0, PRICE_MAX);
    setPrice((current) => (index === 0 ? [Math.min(value, current[1]), current[1]] : [current[0], Math.max(value, current[0])]));
  };

  return (
    <ShopShell searchPath="/ortiqcha-material" cartCount={lines.reduce((sum, line) => sum + line.qty, 0)} placeholder="Ortiqcha materiallar ichidan qidiring...">
      <div className="ok" data-testid="surplus-desktop">
        <section className="ok-hero">
          <img className="ok-hero-bg" src="/img/hero.jpg" alt="" />
          <nav className="ok-crumbs" aria-label="Breadcrumb">
            <Link href="/">Bosh sahifa</Link>
            <ChevronRight className="i" />
            <b>Ortiqcha material</b>
          </nav>
          <h1 className="ok-h1">Ortiqcha material</h1>
          <div className="ok-hero-row">
            <p className="ok-sub">Stomatologlarning ortiqcha, ishlatilmagan materiallarini arzonroq narxda – bir-birimizga foydali bo‘laylik!</p>
            <ul className="ok-trust">
              <li>
                <ShieldCheck className="i" />
                <span>
                  <b>Tekshirilgan e’lonlar</b>
                  <small>Admin moderatsiyasidan o‘tadi</small>
                </span>
              </li>
              <li>
                <CalendarDays className="i" />
                <span>
                  <b>Yaroqlilik muddati ko‘rsatilgan</b>
                  <small>Har bir e’londa majburiy</small>
                </span>
              </li>
              <li>
                <Package className="i" />
                <span>
                  <b>Yopiq yoki ochilgan</b>
                  <small>Qadoq holati aniq yoziladi</small>
                </span>
              </li>
            </ul>
          </div>
          <button type="button" className="ok-post" data-testid="surplus-post" onClick={() => { setActive(null); setModal("post"); }}>
            <Plus className="i" /> E’lon berish
          </button>
        </section>

        <div className="ok-chips" role="tablist" aria-label="Kategoriya">
          {chips.map(({ id, label, Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={chip === id} className={chip === id ? "ok-chip on" : "ok-chip"} onClick={() => setChip(id)}>
              <Icon className="i" /> {label}
            </button>
          ))}
        </div>

        <div className="ok-filters">
          <label className="ok-field">
            <MapPin className="ic" />
            <span className="txt">
              <small>Shahar</small>
              <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Shahar">
                <option value="">Barchasi</option>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </span>
            <ChevronDown className="chev" />
          </label>
          <label className="ok-field">
            <Package className="ic" />
            <span className="txt">
              <small>Holati</small>
              <select value={pkg} onChange={(event) => setPkg(event.target.value as PackageStatus | "")} aria-label="Holati">
                <option value="">Barchasi</option>
                <option value="yopiq">Yopiq</option>
                <option value="ochilgan">Ochilgan</option>
              </select>
            </span>
            <ChevronDown className="chev" />
          </label>
          <div className="ok-field price">
            <span className="txt">
              <small>Narx oralig‘i (so‘m)</small>
              <span className="ok-price-row">
                <input inputMode="numeric" aria-label="Narx: dan (so‘m)" value={somPlain(price[0])} onChange={(event) => setPriceAt(0, event.target.value)} />
                <span className="ok-range">
                  <RangeSlider min={0} max={PRICE_MAX} step={50_000} value={price} onChange={setPrice} />
                </span>
                <input inputMode="numeric" aria-label="Narx: gacha (so‘m)" value={somPlain(price[1])} onChange={(event) => setPriceAt(1, event.target.value)} />
              </span>
            </span>
          </div>
          <label className="ok-field">
            <CalendarDays className="ic" />
            <span className="txt">
              <small>Yaroqlilik muddati</small>
              <select value={expiryMin} onChange={(event) => setExpiryMin(Number(event.target.value) as ExpiryMin)} aria-label="Yaroqlilik muddati">
                {expiryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </span>
            <ChevronDown className="chev" />
          </label>
          <label className="ok-field">
            <ArrowUpDown className="ic" />
            <span className="txt">
              <small>Saralash</small>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Saralash">
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {sortLabels[key]}
                  </option>
                ))}
              </select>
            </span>
            <ChevronDown className="chev" />
          </label>
          <div className="ok-view" role="group" aria-label="Ko‘rinish">
            <button type="button" className={view === "grid" ? "on" : ""} aria-pressed={view === "grid"} aria-label="Kataklar" onClick={() => setView("grid")}>
              <LayoutGrid className="i" />
            </button>
            <button type="button" className={view === "list" ? "on" : ""} aria-pressed={view === "list"} aria-label="Ro‘yxat" onClick={() => setView("list")}>
              <List className="i" />
            </button>
          </div>
        </div>

        {!ready ? (
          <div className="ok-grid" aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="ok-card skeleton" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="ok-empty" data-testid="surplus-empty">
            <Package className="big" />
            <b>{feed.length === 0 ? "Hozircha e’lonlar yo‘q" : "Mos e’lon topilmadi"}</b>
            <p>
              {feed.length === 0
                ? "Klinikangizda ortib qolgan material bormi? Birinchi bo‘lib e’lon bering — boshqa doktorlarga foydasi tegadi."
                : "Filtrlarni o‘zgartirib ko‘ring yoki o‘zingiz e’lon bering."}
            </p>
            <div className="acts">
              {filtersOn && feed.length > 0 ? (
                <button type="button" className="ghost" onClick={resetAll}>
                  Filtrlarni tozalash
                </button>
              ) : null}
              <button type="button" onClick={() => { setActive(null); setModal("post"); }}>
                <Plus className="i" /> E’lon berish
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="ok-count">{items.length} ta e’lon</p>
            <div className={view === "grid" ? "ok-grid" : "ok-list"}>
              {items.map((listing) => (
                <SurplusCard
                  key={listing.id}
                  listing={listing}
                  onEdit={() => {
                    setActive(listing);
                    setModal("edit");
                  }}
                />
              ))}
            </div>
          </>
        )}

        {modal === "post" ? (
          <Modal title="E’lon joylash" onClose={() => setModal(null)}>
            <PostForm onCancel={() => setModal(null)} onDone={() => setModal(null)} />
          </Modal>
        ) : null}
        {modal === "edit" && active?.mine ? (
          <Modal title="E’lonni tahrirlash" onClose={() => setModal(null)}>
            <PostForm listing={active} onCancel={() => setModal(null)} onDone={() => setModal(null)} />
          </Modal>
        ) : null}
        {modal === "contact" && active && !active.mine ? (
          <Modal title="Sotuvchi bilan bog‘lanish" onClose={() => setModal(null)}>
            <ContactForm listing={active} onClose={() => setModal(null)} />
          </Modal>
        ) : null}
      </div>
    </ShopShell>
  );
}

function SurplusCard({ listing, onEdit }: { listing: SurplusListing; onEdit: () => void }) {
  const cart = useCart();
  const favorites = useFavorites();
  const saved = favorites.has(listing.id);
  const inCart = cart.lines.some((line) => line.productId === listing.id);
  const discount = listingDiscount(listing);
  const opened = listing.status === "ochilgan";
  const href = `/ortiqcha-material/${listing.id}`;
  const hasOld = listing.newPrice > listing.price;

  return (
    <article className="ok-card" data-testid="surplus-card">
      <div className="ok-badges">
        {discount > 0 ? <span className="ok-badge sale">-{discount}%</span> : null}
        <span className={opened ? "ok-badge opened" : "ok-badge closed"}>{statusLabel[listing.status]}</span>
        {listing.mine ? <span className="ok-badge mine">Sizniki</span> : null}
      </div>
      <button type="button" className={saved ? "ok-fav on" : "ok-fav"} aria-pressed={saved} aria-label={saved ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"} onClick={() => favorites.toggle(listing.id)}>
        <Heart className="i" />
      </button>
      <Link href={href} className="ph" aria-label={listing.name}>
        {listing.hasPhoto ? (
          <img src={listing.image} alt="" loading="lazy" />
        ) : (
          <span className="ok-noimg">
            <Package className="i" />
            <small>Rasm qo‘shilmagan</small>
          </span>
        )}
      </Link>
      <div className="body">
        <h3>
          <Link href={href}>{listing.name}</Link>
        </h3>
        <div className="brand">{surplusBrandLabel(listing)}</div>
        <div className="meta">
          <span>
            <CalendarDays className="i" /> {listingExpiry(listing)}
          </span>
          <span>
            <MapPin className="i" /> {listing.city || "—"}
          </span>
        </div>
        <div className="seller">
          <span className="ava" aria-hidden>
            {initials(listing.seller)}
          </span>
          <span className="name">{sellerLine(listing)}</span>
          {listing.verified ? <BadgeCheck className="ok-verified" aria-label="Tekshirilgan sotuvchi" /> : null}
        </div>
        <div className="foot">
          <div className="price">
            {hasOld ? <s>{som(listing.newPrice)}</s> : null}
            <strong className={discount > 0 ? "sale" : undefined}>{som(listing.price)}</strong>
          </div>
          {listing.mine ? (
            <button type="button" className="ok-add" aria-label="E’lonni tahrirlash" onClick={onEdit}>
              <PencilLine className="i" />
            </button>
          ) : inCart ? (
            <Link href="/savat" className="ok-add in" aria-label="Savatda — savatni ochish">
              <ShoppingCart className="i" />
            </Link>
          ) : (
            <button
              type="button"
              className="ok-add"
              aria-label={`${listing.name} — savatga qo‘shish`}
              onClick={() => cart.add(listing.id, listingToProduct(listing), 1, { source: "ortiqcha", expiryMonths: listing.expiryMonths })}
            >
              <ShoppingCart className="i" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
