"use client";
/* eslint-disable @next/next/no-img-element -- catalog photos are sized by the fluid unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ChevronRight,
  FlaskConical,
  Heart,
  LayoutGrid,
  List,
  Monitor,
  Package,
  Scissors,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { MobileBrandBar } from "@/components/mobile/MobileBrandBar";
import { useSellerWork } from "@/components/seller-provider";
import type { Product } from "@/data/products";
import {
  mobileMarketCatalog,
  mobileMarketChips,
  mobileMarketProduct,
  type MobileMarketChip,
  type MobileMarketItem,
} from "@/data/mobile-market";
import { formatMoney } from "@/lib/format";
import "./market-mobile.css";

const icons = {
  materiallar: Package,
  implantlar: Package,
  asboblar: Scissors,
  jihozlar: Monitor,
  laboratoriya: FlaskConical,
} as const;

type SortId = "shown" | "dear" | "rating";

export function MarketMobileCatalog() {
  const params = useSearchParams();
  const { add } = useCart();
  const { catalog } = useSellerWork();
  const favorites = useFavorites();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [chip, setChip] = useState<MobileMarketChip>("materiallar");
  const [sort, setSort] = useState<SortId>("shown");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState(false);
  const [brand, setBrand] = useState("");
  /** Real seller (DB) products first, then the platform catalog. */
  const all = useMemo<CardItem[]>(() => [...catalog.filter((item) => item.listedBySeller && item.active !== false && item.category !== "forma").map(fromProduct), ...mobileMarketCatalog], [catalog]);
  const brands = [...new Set(all.map((item) => item.brand).filter(Boolean))];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = all.filter((item) => {
      if (item.chip !== chip) return false;
      if (brand && item.brand !== brand) return false;
      if (!q) return true;
      return `${item.brand} ${item.name} ${item.spec}`.toLowerCase().includes(q);
    });
    if (sort === "dear") return [...items].sort((a, b) => b.price - a.price);
    if (sort === "rating") return [...items].sort((a, b) => b.rating - a.rating);
    return items;
  }, [all, brand, chip, query, sort]);

  const shown = list.length;
  const badge = brand ? 1 : 0;

  return (
    <div className="mk lg:hidden" data-testid="mobile-market">
      <div className="mk-body">
        <MobileBrandBar search />
        <form className="mk-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input
            data-market-search
            data-section-search
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Stomatologga nima kerak?"
            aria-label="Qidiruv"
          />
        </form>

        <Link href="/bonuslarim" className="mk-banner">
          <img src="/img/mobile/gift.jpg" alt="" />
          <div>
            <b>
              <em>10 000 so‘m bonus</em> oling!
            </b>
            <span>Ilovada ro‘yxatdan o‘ting va birinchi xaridingizda foydalaning.</span>
          </div>
          <ChevronRight className="go" />
        </Link>

        <div className="mk-chips" aria-label="Kategoriyalar">
          {mobileMarketChips.map((item) => {
            const Icon = icons[item.id];
            return (
              <button key={item.id} type="button" className={chip === item.id ? "on" : undefined} onClick={() => setChip(item.id)}>
                <Icon />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mk-tools">
          <button type="button" className="mk-filter" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
            Filtrlar
            {badge ? <i>{badge}</i> : null}
          </button>
          <p className="mk-count" data-testid="mk-count">
            {shown} ta natija
          </p>
          <label className="mk-sort">
            <ArrowUpDown />
            <select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as SortId)}>
              <option value="shown">Arzonroq</option>
              <option value="dear">Qimmatroq</option>
              <option value="rating">Reyting</option>
            </select>
          </label>
          <div className="mk-view">
            <button type="button" className={view === "grid" ? "on" : undefined} aria-label="Grid ko‘rinish" onClick={() => setView("grid")}>
              <LayoutGrid />
            </button>
            <button type="button" className={view === "list" ? "on" : undefined} aria-label="Ro‘yxat ko‘rinish" onClick={() => setView("list")}>
              <List />
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="mk-note">Mos mahsulot topilmadi</p>
        ) : (
          <div className={view === "list" ? "mk-grid list" : "mk-grid"}>
            {list.map((item) => (
              <MarketCard
                key={item.id}
                item={item}
                saved={favorites.has(item.id)}
                onSave={() => favorites.toggle(item.id)}
                onAdd={() => add(item.id, item.product ?? mobileMarketProduct(item))}
              />
            ))}
          </div>
        )}
      </div>

      {filters ? (
        <div className="mk-sheet" role="dialog" aria-label="Filtrlar">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setFilters(false)} />
          <form
            className="mk-panel"
            onSubmit={(event) => {
              event.preventDefault();
              setFilters(false);
            }}
          >
            <h3>Filtrlar</h3>
            <select aria-label="Brend" value={brand} onChange={(event) => setBrand(event.target.value)}>
              <option value="">Barcha brendlar</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <div className="row">
              <button
                type="button"
                className="go"
                style={{ background: "#eef2f6", color: "#24344d" }}
                onClick={() => {
                  setBrand("");
                  setFilters(false);
                }}
              >
                Tozalash
              </button>
              <button type="submit" className="go">
                Ko‘rish
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

type CardItem = MobileMarketItem & { product?: Product };

function chipOf(category: Product["category"]): MobileMarketChip {
  return category === "implantlar" || category === "asboblar" || category === "jihozlar" || category === "laboratoriya" ? category : "materiallar";
}

/** A seller's real product shown with the design card. */
function fromProduct(p: Product): CardItem {
  const old = p.oldPrice && p.oldPrice > p.price ? p.oldPrice : p.price;
  return {
    id: p.id,
    brand: p.brand,
    name: p.name,
    spec: p.shopName ?? p.subcategory ?? "",
    chip: chipOf(p.category),
    rating: p.rating,
    reviews: p.reviews,
    price: p.price,
    oldPrice: old,
    discount: old > p.price ? Math.round((1 - p.price / old) * 100) : 0,
    image: p.image,
    gallery: [p.image, ...(p.images ?? [])],
    official: false,
    shares: 0,
    delivery: p.delivery,
    variants: [],
    description: p.description ?? "",
    features: [],
    seller: p.shopName ?? "",
    sellerTag: "",
    sellerRole: "",
    sellerRating: 0,
    sellerReviews: 0,
    sellerCity: "",
    product: p,
  };
}

function MarketCard({
  item,
  saved,
  onSave,
  onAdd,
}: {
  item: CardItem;
  saved: boolean;
  onSave: () => void;
  onAdd: () => void;
}) {
  return (
    <article className="mk-card" data-testid="mk-card" data-real={item.product ? "1" : undefined}>
      <div className="mk-ph">
        <Link href={`/marketplace/${item.id}`} aria-label={item.name}>
          <img src={item.image} alt="" />
        </Link>
        {item.discount > 0 ? <span className="mk-off">-{item.discount}%</span> : null}
        <button type="button" className={saved ? "mk-heart on" : "mk-heart"} aria-label="Sevimlilar" aria-pressed={saved} onClick={onSave}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <Link href={`/marketplace/${item.id}`}>
        <p className="brand">{item.brand}</p>
        <h3>{item.name}</h3>
        <p className="spec">{item.spec}</p>
        {item.reviews > 0 ? (
          <p className="mk-rate">
            <Star /> {item.rating} <span>({item.reviews} ta baho)</span>
          </p>
        ) : null}
        <div className="mk-price">
          <div>
            <b>{formatMoney(item.price, "UZS")}</b>
            {item.oldPrice > item.price ? <s>{formatMoney(item.oldPrice, "UZS")}</s> : null}
          </div>
          {item.product && item.product.inStock === false ? <span className="mk-live out">Tugagan</span> : <span className="mk-live">Sotuvda</span>}
        </div>
      </Link>
      <button type="button" className="mk-add" onClick={onAdd}>
        <ShoppingCart /> Savatga
      </button>
    </article>
  );
}
