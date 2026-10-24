"use client";
/* eslint-disable @next/next/no-img-element -- catalog photos stay contain inside the card */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Droplets,
  Heart,
  LayoutGrid,
  Pencil,
  Scissors,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { MP_GROUPS, isKnownGroup, marketGroupId } from "@/lib/mp-groups";
import { som } from "@/components/shop/desktop/shop-cart";
import "./marketplace-phone.css";

type StockFilter = "all" | "ombor" | "buyurtma" | "tez";
type SortKey = "ommabop" | "arzon" | "qimmat" | "yangi" | "reyting";

const ICONS: Record<string, LucideIcon> = {
  all: LayoutGrid,
  kompozitlar: Droplets,
  bondlar: Droplets,
  endodontiya: Pencil,
  implantlar: Box,
  uchliklar: Wrench,
  asboblar: Scissors,
  uskunalar: Stethoscope,
  gigiyena: Sparkles,
  materiallar: Droplets,
};

function isNew(item: CatalogCard) {
  if (item.attrs.isNew === true) return true;
  const time = Date.parse(item.createdAt);
  return Number.isFinite(time) && time > Date.now() - 14 * 86_400_000;
}

function specOf(item: CatalogCard) {
  const type = typeof item.attrs.type === "string" ? item.attrs.type.trim() : "";
  const volume = typeof item.attrs.volume === "string" ? item.attrs.volume.trim() : "";
  const parts = [type, volume].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return item.subcategory.trim();
}

function stockKind(item: CatalogCard): StockFilter {
  const status = typeof item.attrs.stockStatus === "string" ? item.attrs.stockStatus : "";
  if (status === "tez" || item.attrs.comingSoon === true) return "tez";
  if (status === "buyurtma") return "buyurtma";
  if (item.inStock && item.stockQty > 0) return "ombor";
  return "buyurtma";
}

function groupFromQuery(value: string) {
  return marketGroupId({ name: "", brand: "", category: value, subcategory: value });
}

export function MarketMobileCatalog() {
  const params = useSearchParams();
  const router = useRouter();
  const { add } = useCart();
  const favorites = useFavorites();
  const qParam = (params.get("q") ?? "").trim();
  const catParam = (params.get("category") || params.get("cat") || "").trim().toLowerCase();
  const [query, setQuery] = useState(qParam);
  const [group, setGroup] = useState(() => (catParam && isKnownGroup(catParam) ? groupFromQuery(catParam) : "all"));
  const [rows, setRows] = useState<CatalogCard[]>([]);
  const [ready, setReady] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandQ, setBrandQ] = useState("");
  const [stock, setStock] = useState<StockFilter>("all");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("ommabop");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    let stop = false;
    void fetchCatalogProducts().then((items) => {
      if (stop) return;
      setRows(items);
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    if (!catParam) setGroup("all");
    else if (isKnownGroup(catParam)) setGroup(groupFromQuery(catParam));
  }, [catParam]);

  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of rows) {
      const id = marketGroupId(item);
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  const chips = useMemo(() => {
    const list = [{ id: "all", label: "Barchasi" }];
    for (const item of MP_GROUPS) {
      if ((groupCounts.get(item.id) ?? 0) > 0) list.push(item);
    }
    return list;
  }, [groupCounts]);

  const q = (query || qParam).trim().toLowerCase();
  const min = Number(minPrice.replace(/\s/g, ""));
  const max = Number(maxPrice.replace(/\s/g, ""));

  function matches(item: CatalogCard, skip?: "brand") {
    if (group !== "all" && marketGroupId(item) !== group) return false;
    if (skip !== "brand" && brands.length && !brands.includes(item.brandKey)) return false;
    if (Number.isFinite(min) && min > 0 && item.price < min) return false;
    if (Number.isFinite(max) && max > 0 && item.price > max) return false;
    if (stock !== "all" && stockKind(item) !== stock) return false;
    if (officialOnly && item.attrs.official !== true) return false;
    if (q && !`${item.name} ${item.brand} ${item.subcategory}`.toLowerCase().includes(q)) return false;
    return true;
  }

  const items = useMemo(() => {
    const list = rows.filter((item) => matches(item));
    list.sort((a, b) => {
      if (sort === "arzon") return a.price - b.price;
      if (sort === "qimmat") return b.price - a.price;
      if (sort === "yangi") return Number(isNew(b)) - Number(isNew(a));
      if (sort === "reyting") return (b.reviews > 0 ? b.rating : 0) - (a.reviews > 0 ? a.rating : 0);
      return b.reviews - a.reviews || a.name.localeCompare(b.name, "uz");
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, group, maxPrice, minPrice, officialOnly, q, rows, sort, stock]);

  const brandRows = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    for (const item of rows) {
      if (!matches(item, "brand") || !item.brand || item.brand === "Brend") continue;
      const prev = map.get(item.brandKey);
      if (prev) prev.count += 1;
      else map.set(item.brandKey, { key: item.brandKey, label: item.brand, count: 1 });
    }
    return [...map.values()].filter((row) => row.count > 0 && row.label.toLowerCase().includes(brandQ.toLowerCase()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandQ, brands, group, maxPrice, minPrice, officialOnly, q, rows, stock]);

  const officialCount = rows.filter((item) => item.attrs.official === true).length;

  function selectGroup(id: string) {
    setGroup(id);
    const usp = new URLSearchParams(params.toString());
    usp.delete("category");
    if (id === "all") usp.delete("cat");
    else usp.set("cat", id);
    router.replace(`/marketplace${usp.toString() ? `?${usp}` : ""}`, { scroll: false });
  }

  function clearFilters() {
    setBrands([]);
    setStock("all");
    setOfficialOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setBrandQ("");
    selectGroup("all");
  }

  return (
    <div className="mpx-phone lg:hidden" data-testid="mobile-market">
      <h1>Stomatologik mahsulotlar</h1>
      <p className="sub">Sifatli materiallar, zamonaviy asboblar va ishonchli brendlar</p>
      <form className="tools" onSubmit={(event) => event.preventDefault()} style={{ marginBottom: 10 }}>
        <Search style={{ width: 16, height: 16, color: "#64748b" }} />
        <input
          data-market-search
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Mahsulot, brend yoki kategoriya"
          aria-label="Qidirish"
          style={{ flex: 1, height: 40, border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 10px", font: "inherit", fontSize: 14, background: "#fff" }}
        />
      </form>
      <div className="chips">
        {chips.map((chip) => {
          const Icon = ICONS[chip.id] ?? Box;
          const on = group === chip.id || (chip.id === "all" && group === "all");
          return (
            <button key={chip.id} type="button" className={on ? "on" : undefined} data-testid={`market-chip-${chip.id}`} onClick={() => selectGroup(chip.id)}>
              <Icon />
              {chip.label}
            </button>
          );
        })}
      </div>
      <div className="tools">
        <button type="button" className="go" onClick={() => setSheet(true)}>
          <SlidersHorizontal style={{ width: 16, height: 16 }} /> Filtrlar
        </button>
        <select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as SortKey)} style={{ marginLeft: "auto" }}>
          <option value="ommabop">Ommabop</option>
          <option value="arzon">Arzon</option>
          <option value="qimmat">Qimmat</option>
          <option value="yangi">Yangi</option>
          <option value="reyting">Reyting</option>
        </select>
      </div>
      {!ready ? <p className="note">Yuklanmoqda...</p> : null}
      {ready && items.length === 0 ? <p className="note">Bu filtrda mahsulot yo‘q.</p> : null}
      <div className="grid">
        {items.map((item) => {
          const spec = specOf(item);
          const saved = favorites.has(item.id);
          const inStock = item.inStock && item.stockQty > 0;
          const fresh = isNew(item) && !item.discount;
          return (
            <article className="card" key={item.id}>
              <div className="ph">
                <Link href={`/marketplace/${item.id}`} aria-label={item.name}>
                  {item.image ? <img src={item.image} alt="" /> : null}
                </Link>
                {item.discount ? <span className="badge sale">-{item.discount}%</span> : fresh ? <span className="badge new">Yangi</span> : null}
                <button type="button" className={saved ? "heart on" : "heart"} aria-label="Sevimlilarga" aria-pressed={saved} onClick={() => favorites.toggle(item.id)}>
                  <Heart fill={saved ? "currentColor" : "none"} />
                </button>
              </div>
              <h3><Link href={`/marketplace/${item.id}`}>{item.name}</Link></h3>
              {spec ? <p className="spec">{spec}</p> : null}
              {item.brand && item.brand !== "Brend" ? <p className="brand">{item.brand}</p> : null}
              {item.reviews > 0 ? (
                <p className="rate"><Star /> <b>{item.rating.toFixed(1)}</b> ({item.reviews})</p>
              ) : null}
              <p className="stock" style={inStock ? undefined : { color: "#64748b" }}>
                {inStock ? "● Omborda bor" : stockKind(item) === "tez" ? "Tez orada" : "Tugagan"}
              </p>
              <div className="row">
                <div>
                  {item.oldPrice ? <s>{som(item.oldPrice)}</s> : null}
                  <strong className={item.discount ? "sale" : undefined}>{som(item.price)}</strong>
                </div>
                <button type="button" className="add" aria-label={`${item.name} savatga`} disabled={!inStock} onClick={() => add(item.id, productFromCatalog(item))}>
                  <ShoppingCart />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {sheet ? (
        <div className="sheet" role="dialog" aria-label="Filtrlar" onClick={() => setSheet(false)}>
          <div className="panel" onClick={(event) => event.stopPropagation()}>
            <h3>Filtrlar</h3>
            <label>Kategoriya</label>
            <select value={group} onChange={(event) => selectGroup(event.target.value)}>
              <option value="all">Barchasi</option>
              {chips.filter((chip) => chip.id !== "all" && (groupCounts.get(chip.id) ?? 0) > 0).map((chip) => (
                <option key={chip.id} value={chip.id}>{chip.label} ({groupCounts.get(chip.id)})</option>
              ))}
            </select>
            <label>Brend</label>
            <input value={brandQ} onChange={(event) => setBrandQ(event.target.value)} placeholder="Brend qidirish" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, maxHeight: 140, overflow: "auto" }}>
              {brandRows.map((row) => (
                <label key={row.key} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, fontWeight: 600, color: "#111827" }}>
                  <input
                    type="checkbox"
                    checked={brands.includes(row.key)}
                    onChange={() => setBrands((current) => (current.includes(row.key) ? current.filter((key) => key !== row.key) : [...current, row.key]))}
                  />
                  {row.label} ({row.count})
                </label>
              ))}
            </div>
            <label>Narx oralig‘i (so‘m)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input inputMode="numeric" placeholder="Dan" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} />
              <input inputMode="numeric" placeholder="Gacha" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
            </div>
            <label>Mavjudligi</label>
            <select value={stock} onChange={(event) => setStock(event.target.value as StockFilter)}>
              <option value="all">Hammasi</option>
              <option value="ombor">Omborda bor</option>
              <option value="buyurtma">Buyurtma asosida</option>
              <option value="tez">Tez orada</option>
            </select>
            {officialCount > 0 ? (
              <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, color: "#111827" }}>
                <input type="checkbox" checked={officialOnly} onChange={(event) => setOfficialOnly(event.target.checked)} />
                Rasmiy distribyutor ({officialCount})
              </label>
            ) : null}
            <div className="actions">
              <button type="button" className="ghost" onClick={clearFilters}>Tozalash</button>
              <button type="button" className="go" onClick={() => setSheet(false)}>Ko‘rsatish</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.8 6.6 19.8l1-6.1L3.2 9.4l6.1-.9L12 3z" />
    </svg>
  );
}
