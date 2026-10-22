"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Search, ShoppingCart, SlidersHorizontal, Star } from "lucide-react";
import { cartLineKey, useCart } from "@/components/cart-provider";
import { ToothIcon } from "@/components/catalog-pages/tooth-icon";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { useFavorites } from "@/components/favorites-provider";
import { NotificationBell } from "@/components/notification-bell";
import { colorLabel } from "@/data/forma";
import { categoryLabels, categoryTabs, type ProductCategory } from "@/data/products";
import { catalogHref, fetchCatalog, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { discountPercent, getDeliveryLabel } from "@/lib/delivery-label";
import { formatGroupedNumber, formatMoney } from "@/lib/format";
import "./catalog-mobile.css";

const PAGE = 20;
const SORTS = [
  ["popular", "Ommabop"],
  ["cheap", "Arzon"],
  ["expensive", "Qimmat"],
  ["new", "Yangi"],
  ["rating", "Reyting"],
] as const;

type SortId = (typeof SORTS)[number][0];
type Sheet = "sort" | "brand" | "price" | "cat" | "country" | "all" | null;

function attrText(attrs: Record<string, unknown>, key: string) {
  const value = attrs[key];
  return typeof value === "string" ? value.trim() : "";
}

function splitList(raw: string | null) {
  return (raw ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function cardMeta(item: CatalogCard) {
  const author = attrText(item.attrs, "author");
  if (author) {
    const year = item.attrs.year;
    const printed = typeof year === "number" || typeof year === "string" ? String(year).trim() : "";
    return [author, printed].filter(Boolean).join(" · ");
  }
  const shade = item.colors.length === 1 ? colorLabel(item.colors[0]) : "";
  return [item.brand, shade, attrText(item.attrs, "volume")].filter(Boolean).join(" · ");
}

function deliveryOf(item: CatalogCard) {
  return getDeliveryLabel({
    deliveryDays: item.deliveryDays,
    cutoffTime: item.cutoffTime,
    worksOnWeekends: item.worksOnWeekends,
  });
}

export function MarketMobileCatalog() {
  const router = useRouter();
  const params = useSearchParams();
  const cart = useCart();
  const qParam = params.get("q") ?? "";
  const sort = (SORTS.some((item) => item[0] === params.get("sort")) ? params.get("sort") : "popular") as SortId;
  const brands = splitList(params.get("brand"));
  const cat = params.get("cat") ?? "";
  const country = params.get("country") ?? "";
  const minParam = params.get("min") ?? "";
  const maxParam = params.get("max") ?? "";
  const inStock = params.get("in_stock") === "1";
  const [query, setQuery] = useState(qParam);
  const [rows, setRows] = useState<CatalogCard[]>([]);
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(true);
  const [tick, setTick] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [minDraft, setMinDraft] = useState(minParam);
  const [maxDraft, setMaxDraft] = useState(maxParam);
  const [page, setPage] = useState(1);
  const [note, setNote] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (query.trim() === qParam.trim()) return;
      replace({ q: query.trim() || null });
    }, 300);
    return () => window.clearTimeout(id);
  }, [qParam, query]);

  useEffect(() => {
    let stop = false;
    setReady(false);
    void fetchCatalog().then((res) => {
      if (stop) return;
      setRows(res.products);
      setOk(res.ok);
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, [tick]);

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(""), 2500);
    return () => window.clearTimeout(id);
  }, [note]);

  function replace(patch: Record<string, string | null>) {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const queryString = next.toString();
    router.replace(queryString ? `/marketplace?${queryString}` : "/marketplace", { scroll: false });
  }

  function matches(item: CatalogCard, skip?: "brand" | "cat" | "country" | "price" | "stock") {
    const q = qParam.trim().toLowerCase();
    if (q && !`${item.name} ${item.brand} ${item.sku}`.toLowerCase().includes(q)) return false;
    if (skip !== "brand" && brands.length && !brands.includes(item.brand)) return false;
    if (skip !== "cat" && cat && item.category !== cat) return false;
    if (skip !== "country" && country && attrText(item.attrs, "country") !== country) return false;
    if (skip !== "price") {
      const min = Number(minParam);
      const max = Number(maxParam);
      if (minParam && Number.isFinite(min) && item.price < min) return false;
      if (maxParam && Number.isFinite(max) && item.price > max) return false;
    }
    if (skip !== "stock" && inStock && !item.inStock) return false;
    return true;
  }

  const list = useMemo(() => {
    const items = rows.filter((item) => matches(item));
    items.sort((a, b) => {
      if (!inStock && a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      if (sort === "cheap") return a.price - b.price;
      if (sort === "expensive") return b.price - a.price;
      if (sort === "new") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "rating") return (b.reviewAvg ?? -1) - (a.reviewAvg ?? -1) || b.createdAt.localeCompare(a.createdAt);
      return b.orderCount - a.orderCount || b.createdAt.localeCompare(a.createdAt);
    });
    return items;
    // matches closes over the URL fields listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, cat, country, inStock, maxParam, minParam, qParam, rows, sort]);

  const brandOptions = useMemo(() => countNamed(rows.filter((item) => matches(item, "brand")), (item) => item.brand), [rows, brands, cat, country, inStock, maxParam, minParam, qParam]);
  const countryOptions = useMemo(() => countNamed(rows.filter((item) => matches(item, "country")), (item) => attrText(item.attrs, "country")), [rows, brands, cat, country, inStock, maxParam, minParam, qParam]);
  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of rows) {
      if (!matches(item, "cat") || !item.category) continue;
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return categoryTabs
      .map((tab) => ({ ...tab, count: counts.get(tab.id) ?? 0 }))
      .filter((tab) => tab.count > 0 || tab.id === cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, brands, cat, country, inStock, maxParam, minParam, qParam]);
  const priceBounds = useMemo(() => {
    const prices = rows.filter((item) => matches(item, "price")).map((item) => item.price);
    if (!prices.length) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, brands, cat, country, inStock, qParam]);

  const shown = list.slice(0, page * PAGE);
  const more = shown.length < list.length;
  const filtersOn = Boolean(qParam.trim() || sort !== "popular" || brands.length || cat || country || minParam || maxParam || inStock);
  const badge = Number(sort !== "popular") + Number(brands.length > 0) + Number(Boolean(cat)) + Number(Boolean(country)) + Number(Boolean(minParam || maxParam)) + Number(inStock);

  useEffect(() => {
    setPage(1);
  }, [qParam, sort, brands.join(","), cat, country, minParam, maxParam, inStock]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !more) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setPage((current) => current + 1);
    }, { rootMargin: "240px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [more, shown.length]);

  function openPrice(next: Sheet) {
    setMinDraft(minParam);
    setMaxDraft(maxParam);
    setSheet(next);
  }

  function applyPrice() {
    replace({ min: minDraft.trim() || null, max: maxDraft.trim() || null });
    setSheet(null);
  }

  function clearAll() {
    setQuery("");
    router.replace("/marketplace", { scroll: false });
    setSheet(null);
  }

  const sortLabel = SORTS.find((item) => item[0] === sort)?.[1] ?? "Ommabop";

  return (
    <div className="mc lg:hidden" data-testid="mobile-market">
      <header className="mc-bar">
        <MobileMenuButton variant="top" />
        <Link href="/" className="mc-logo">STOMAHUB</Link>
        <Link href="/savat" className="mc-cart" aria-label="Savat">
          <ShoppingCart />
          {cart.items.length > 0 ? <span className="mc-badge">{cart.items.length > 99 ? "99+" : cart.items.length}</span> : null}
        </Link>
        <NotificationBell variant="mobile" />
      </header>
      <div className="mc-body">
        <div className="mc-searchrow">
          <form className="mc-search" onSubmit={(event) => event.preventDefault()}>
            <Search />
            <input
              data-market-search
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Mahsulot qidirish"
              aria-label="Qidiruv"
              enterKeyHint="search"
            />
            {query ? (
              <button type="button" className="mc-x" aria-label="Qidiruvni tozalash" onClick={() => setQuery("")}>×</button>
            ) : null}
          </form>
          <button type="button" className="mc-filter" aria-label="Filtrlar" onClick={() => openPrice("all")}>
            <SlidersHorizontal />
            {badge > 0 ? <i>{badge}</i> : null}
          </button>
        </div>
        <div className="mc-chips" aria-label="Filtrlar">
          <button type="button" className={sort !== "popular" ? "mc-chip on" : "mc-chip"} onClick={() => setSheet("sort")}>{sort === "popular" ? "Ommabop" : `Ommabop: ${sortLabel}`}</button>
          <button type="button" className={brands.length ? "mc-chip on" : "mc-chip"} onClick={() => setSheet("brand")}>{brands.length === 1 ? `Brend: ${brands[0]}` : brands.length > 1 ? `Brend: ${brands.length}` : "Brend"}</button>
          <button type="button" className={minParam || maxParam ? "mc-chip on" : "mc-chip"} onClick={() => openPrice("price")}>{priceChip(minParam, maxParam)}</button>
          <button type="button" className={cat ? "mc-chip on" : "mc-chip"} onClick={() => setSheet("cat")}>{cat ? `Kategoriya: ${categoryLabels[cat as ProductCategory] || cat}` : "Kategoriya"}</button>
          <button type="button" className={country ? "mc-chip on" : "mc-chip"} onClick={() => setSheet("country")}>{country ? `Davlat: ${country}` : "Davlat"}</button>
          <button type="button" className={inStock ? "mc-chip on" : "mc-chip"} onClick={() => replace({ in_stock: inStock ? null : "1" })}>Mavjud</button>
          {filtersOn ? <button type="button" className="mc-clear" onClick={clearAll}>Tozalash</button> : null}
        </div>
        {ready && ok && list.length > 0 ? <p className="mc-count" data-testid="mc-count">{list.length} ta mahsulot</p> : null}
        {!ready ? <SkeletonGrid count={6} /> : null}
        {ready && !ok ? (
          <div className="mc-error">
            <p>Yuklab bo‘lmadi</p>
            <button type="button" onClick={() => setTick((value) => value + 1)}>Qayta urinish</button>
          </div>
        ) : null}
        {ready && ok && list.length === 0 ? (
          <div className="mc-empty">
            <p>Hech narsa topilmadi</p>
            {qParam.trim() ? <p>{qParam.trim()}</p> : null}
            {filtersOn ? <button type="button" onClick={clearAll}>Tozalash</button> : null}
          </div>
        ) : null}
        {ready && ok && list.length > 0 ? (
          <div className="mc-grid">
            {shown.map((item) => (
              <MarketCard key={item.id} item={item} onNote={setNote} />
            ))}
            {more ? <SkeletonGrid count={2} bare /> : null}
          </div>
        ) : null}
        {more ? <div ref={sentinel} /> : null}
      </div>
      {note ? <p className="mc-note" role="status">{note}</p> : null}
      {sheet ? (
        <div className="mc-sheet" role="dialog" aria-modal="true" aria-label="Filtrlar">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setSheet(null)} />
          <div className="mc-panel">
            <h3>Filtrlar</h3>
            {sheet === "sort" || sheet === "all" ? (
              <section>
                <h4>Ommabop</h4>
                {SORTS.map(([id, label]) => (
                  <button key={id} type="button" className={sort === id ? "mc-opt on" : "mc-opt"} onClick={() => { replace({ sort: id === "popular" ? null : id }); if (sheet === "sort") setSheet(null); }}>{label}</button>
                ))}
              </section>
            ) : null}
            {sheet === "brand" || sheet === "all" ? (
              <section>
                <h4>Brend</h4>
                {brandOptions.length ? brandOptions.map((item) => (
                  <button key={item.name} type="button" className={brands.includes(item.name) ? "mc-opt on" : "mc-opt"} onClick={() => {
                    const next = brands.includes(item.name) ? brands.filter((name) => name !== item.name) : [...brands, item.name];
                    replace({ brand: next.join(",") || null });
                  }}>{item.name}<span>{item.count}</span></button>
                )) : <p className="mc-meta">Brend yo‘q</p>}
              </section>
            ) : null}
            {sheet === "price" || sheet === "all" ? (
              <section>
                <h4>Narx{priceBounds ? ` · ${formatGroupedNumber(priceBounds.min)} – ${formatGroupedNumber(priceBounds.max)}` : ""}</h4>
                <div className="mc-price-row">
                  <input aria-label="Eng kam narx" inputMode="numeric" placeholder="Dan" value={minDraft} min={priceBounds?.min} max={priceBounds?.max} onChange={(event) => setMinDraft(event.target.value.replace(/[^\d]/g, ""))} />
                  <input aria-label="Eng ko‘p narx" inputMode="numeric" placeholder="Gacha" value={maxDraft} min={priceBounds?.min} max={priceBounds?.max} onChange={(event) => setMaxDraft(event.target.value.replace(/[^\d]/g, ""))} />
                </div>
              </section>
            ) : null}
            {sheet === "cat" || sheet === "all" ? (
              <section>
                <h4>Kategoriya</h4>
                {categoryOptions.length ? categoryOptions.map((item) => (
                  <button key={item.id} type="button" className={cat === item.id ? "mc-opt on" : "mc-opt"} onClick={() => { replace({ cat: cat === item.id ? null : item.id }); if (sheet === "cat") setSheet(null); }}>{item.label}<span>{item.count}</span></button>
                )) : <p className="mc-meta">Kategoriya yo‘q</p>}
              </section>
            ) : null}
            {sheet === "country" || sheet === "all" ? (
              <section>
                <h4>Davlat</h4>
                {countryOptions.length ? countryOptions.map((item) => (
                  <button key={item.name} type="button" className={country === item.name ? "mc-opt on" : "mc-opt"} onClick={() => { replace({ country: country === item.name ? null : item.name }); if (sheet === "country") setSheet(null); }}>{item.name}<span>{item.count}</span></button>
                )) : <p className="mc-meta">Hozircha davlat yo‘q</p>}
              </section>
            ) : null}
            {sheet === "all" ? (
              <button type="button" className={inStock ? "mc-opt on" : "mc-opt"} onClick={() => replace({ in_stock: inStock ? null : "1" })}>Mavjud</button>
            ) : null}
            {sheet === "price" || sheet === "all" ? <button type="button" className="mc-apply" onClick={applyPrice}>Ko‘rsatish</button> : null}
            {filtersOn ? <button type="button" className="mc-clear" onClick={clearAll}>Tozalash</button> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function countNamed(items: CatalogCard[], pick: (item: CatalogCard) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const name = pick(item);
    if (!name) continue;
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function priceChip(min: string, max: string) {
  const lo = Number(min);
  const hi = Number(max);
  const hasMin = Boolean(min) && Number.isFinite(lo);
  const hasMax = Boolean(max) && Number.isFinite(hi);
  if (hasMin && hasMax) return `Narx: ${formatGroupedNumber(lo)}–${formatGroupedNumber(hi)}`;
  if (hasMin) return `Narx: ${formatGroupedNumber(lo)}+`;
  if (hasMax) return `Narx: ≤${formatGroupedNumber(hi)}`;
  return "Narx";
}

function SkeletonGrid({ count, bare }: { count: number; bare?: boolean }) {
  const cards = Array.from({ length: count }, (_, index) => (
    <div className="mc-skel" key={index} aria-hidden="true">
      <i className="ph" />
      <i className="ln short" />
      <i className="ln" />
    </div>
  ));
  if (bare) return <>{cards}</>;
  return <div className="mc-grid" aria-hidden="true">{cards}</div>;
}

function MarketCard({ item, onNote }: { item: CatalogCard; onNote: (value: string) => void }) {
  const cart = useCart();
  const favorites = useFavorites();
  const { ready, profile } = useDoctorProfile();
  const router = useRouter();
  const [broken, setBroken] = useState(false);
  const [picking, setPicking] = useState(false);
  const href = catalogHref(item.category, item.id);
  const pct = discountPercent(item.price, item.oldPrice);
  const meta = cardMeta(item);
  const src = item.image || item.images[0] || "";
  const needsPick = item.colors.length > 1 || item.sizes.length > 1;
  const lines = cart.items.filter((line) => line.product.id === item.id);
  const single = !needsPick || lines.length === 1 ? lines[0] : undefined;
  const saved = favorites.has(item.id);
  const when = deliveryOf(item);

  function save(event: React.MouseEvent) {
    event.preventDefault();
    if (!ready) return;
    if (!profile) {
      router.push(`/kirish?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
      return;
    }
    favorites.toggle(item.id);
  }

  function addDirect() {
    const size = item.sizes.length === 1 ? item.sizes[0] : undefined;
    const color = item.colors.length === 1 ? item.colors[0] : undefined;
    cart.add(item.id, productFromCatalog(item), 1, { size, color });
  }

  return (
    <article className="mc-card" data-testid="mc-card">
      <div className={item.inStock ? "mc-ph" : "mc-ph dim"}>
        <Link href={href} className="mc-photo" aria-label={item.name}>
          {src && !broken ? <img src={src} alt="" onError={() => setBroken(true)} /> : <ToothIcon className="mc-tooth" />}
        </Link>
        {pct > 0 ? <span className="mc-off">-{pct}%</span> : null}
        {!item.inStock ? <span className="mc-sold">Tugagan</span> : null}
        <button type="button" className={saved ? "mc-heart on" : "mc-heart"} aria-label="Sevimlilar" aria-pressed={saved} onClick={save}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <Link href={href} className="mc-info">
        <p className="mc-price">{formatMoney(item.price, "UZS")}</p>
        {pct > 0 && item.oldPrice ? <p className="mc-was"><s>{formatMoney(item.oldPrice, "UZS")}</s><em>-{pct}%</em></p> : null}
        <h3>{item.name}</h3>
        {meta ? <p className="mc-meta">{meta}</p> : null}
        {item.reviews > 0 ? (
          <p className="mc-rate"><Star /> {item.reviewAvg != null ? item.reviewAvg.toFixed(1) : item.rating.toFixed(1)} ({item.reviews})</p>
        ) : null}
      </Link>
      {!item.inStock ? (
        <button type="button" className="mc-add" disabled>Tugagan</button>
      ) : single ? (
        <div className="mc-step">
          <button type="button" aria-label="Kamaytirish" onClick={() => (single.qty <= 1 ? cart.remove(single.key) : cart.setQty(single.key, single.qty - 1))}>−</button>
          <span>{single.qty}</span>
          <button type="button" aria-label="Oshirish" aria-disabled={single.qty >= item.stockQty} onClick={() => {
            if (single.qty >= item.stockQty) onNote(`Omborda faqat ${item.stockQty} dona`);
            else cart.setQty(single.key, single.qty + 1);
          }}>+</button>
        </div>
      ) : (
        <button type="button" className="mc-add" onClick={() => (needsPick ? setPicking(true) : addDirect())}>
          <ShoppingCart /> {when || "Savatga"}
        </button>
      )}
      {picking ? <VariantSheet item={item} onClose={() => setPicking(false)} onNote={onNote} /> : null}
    </article>
  );
}

function VariantSheet({ item, onClose, onNote }: { item: CatalogCard; onClose: () => void; onNote: (value: string) => void }) {
  const cart = useCart();
  const [size, setSize] = useState(item.sizes.length === 1 ? item.sizes[0] : "");
  const [color, setColor] = useState(item.colors.length === 1 ? item.colors[0] : "");
  const [bad, setBad] = useState<"" | "size" | "color">("");
  const sizeValue = item.sizes.length === 1 ? item.sizes[0] : size;
  const colorValue = item.colors.length === 1 ? item.colors[0] : color;
  const ready = (item.sizes.length < 2 || Boolean(sizeValue)) && (item.colors.length < 2 || Boolean(colorValue));
  const line = ready ? cart.items.find((entry) => entry.key === cartLineKey(item.id, sizeValue || undefined, colorValue || undefined)) : undefined;

  function add() {
    if (item.sizes.length > 1 && !sizeValue) { setBad("size"); return; }
    if (item.colors.length > 1 && !colorValue) { setBad("color"); return; }
    cart.add(item.id, productFromCatalog(item), 1, { size: sizeValue || undefined, color: colorValue || undefined });
    onClose();
  }

  return (
    <div className="mc-sheet" role="dialog" aria-modal="true" aria-label="Variant">
      <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={onClose} />
      <div className={bad ? "mc-panel bad" : "mc-panel"}>
        <h3>{item.name}</h3>
        {item.sizes.length > 1 ? (
          <section>
            <h4>O‘lcham</h4>
            <div className="mc-choice">
              {item.sizes.map((value) => (
                <button key={value} type="button" className={sizeValue === value ? "on" : undefined} onClick={() => { setSize(value); if (bad === "size") setBad(""); }}>{value}</button>
              ))}
            </div>
          </section>
        ) : null}
        {item.colors.length > 1 ? (
          <section>
            <h4>Rang</h4>
            <div className="mc-choice">
              {item.colors.map((value) => (
                <button key={value} type="button" className={colorValue === value ? "on" : undefined} onClick={() => { setColor(value); if (bad === "color") setBad(""); }}>{colorLabel(value)}</button>
              ))}
            </div>
          </section>
        ) : null}
        {bad ? <p className="err">{bad === "size" ? "O‘lchamni tanlang" : "Rangni tanlang"}</p> : null}
        {line ? (
          <div className="mc-step">
            <button type="button" aria-label="Kamaytirish" onClick={() => (line.qty <= 1 ? cart.remove(line.key) : cart.setQty(line.key, line.qty - 1))}>−</button>
            <span>{line.qty}</span>
            <button type="button" aria-label="Oshirish" onClick={() => {
              if (line.qty >= item.stockQty) onNote(`Omborda faqat ${item.stockQty} dona`);
              else cart.setQty(line.key, line.qty + 1);
            }}>+</button>
          </div>
        ) : (
          <button type="button" className="mc-apply" onClick={add}>Savatga</button>
        )}
      </div>
    </div>
  );
}
