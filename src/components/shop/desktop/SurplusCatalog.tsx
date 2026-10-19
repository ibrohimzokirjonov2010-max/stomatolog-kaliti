"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import {
  PRICE_MAX,
  marketChips,
  surplusBrandList,
  surplusCards,
  surplusCategoryCounts,
  surplusHref,
  surplusSeed,
  type ShopCategory,
} from "@/data/desktop-shop";
import { useSurplusWork } from "@/components/surplus-provider";
import { shopAdd, som, useShopCart } from "./shop-cart";
import { CartRail, CheckRow, Drop, RadioRow, RangeSlider, Stars } from "./parts";
import { ShopShell } from "./ShopShell";

type SortKey = "ommabop" | "arzon" | "qimmat" | "reyting" | "yangi";
type Avail = "ombor" | "buyurtma" | "yangi";

export function SurplusCatalog() {
  const params = useSearchParams();
  const { feed } = useSurplusWork();
  const localListings = feed.filter((item) => item.localDemo);
  const lines = useShopCart(surplusSeed);
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [cat, setCat] = useState<ShopCategory | "all">("all");
  const [brands, setBrands] = useState<string[]>([]);
  const [brandQ, setBrandQ] = useState("");
  const [more, setMore] = useState(false);
  const [price, setPrice] = useState<[number, number]>([0, PRICE_MAX]);
  const [avail, setAvail] = useState<Avail>("ombor");
  const [official, setOfficial] = useState(false);
  const [sort, setSort] = useState<SortKey>("ommabop");
  const [open, setOpen] = useState<string | null>(null);
  const [pulse, setPulse] = useState<string | null>(null);

  const brandRows = (more ? surplusBrandList : surplusBrandList.slice(0, 7)).filter((item) => item.label.toLowerCase().includes(brandQ.toLowerCase()));

  const items = useMemo(() => {
    const rows = surplusCards.filter((item) => {
      if (cat !== "all" && item.category !== cat) return false;
      if (brands.length && !brands.includes(item.brandKey)) return false;
      if (item.price < price[0] || item.price > price[1]) return false;
      if (avail === "ombor" && item.stock !== "ombor") return false;
      if (avail === "buyurtma" && item.stock !== "buyurtma") return false;
      if (avail === "yangi" && !item.isNew) return false;
      if (official && !item.official) return false;
      if (q && !`${item.name} ${item.brand}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "arzon") return a.price - b.price;
      if (sort === "qimmat") return b.price - a.price;
      if (sort === "reyting") return b.rating - a.rating;
      if (sort === "yangi") return Number(b.isNew) - Number(a.isNew) || b.popularity - a.popularity;
      return b.popularity - a.popularity;
    });
  }, [avail, brands, cat, official, price, q, sort]);

  function add(id: string) {
    const card = surplusCards.find((item) => item.id === id);
    if (!card) return;
    shopAdd({ id: card.id, name: card.name, price: card.price, image: card.image, href: surplusHref(card.id) });
    setPulse(id);
    window.setTimeout(() => setPulse(null), 280);
  }

  function toggle(name: string) {
    setOpen((current) => (current === name ? null : name));
  }

  return (
    <ShopShell searchPath="/ortiqcha-material" cartCount={lines.reduce((sum, line) => sum + line.qty, 0)}>
      <div data-testid="surplus-catalog">
        <div className="dk-tools" style={{ alignItems: "flex-end" }}>
          <div>
            <h1 className="dk-h1">Stomatologik mahsulotlar</h1>
            <p className="dk-sub" style={{ marginBottom: 0 }}>Sifatli materiallar, zamonaviy asboblar va ishonchli brendlar – StomaHub’da</p>
          </div>
          <Link href="/ortiqcha-material/yangi" className="dk-add" style={{ width: "auto", marginTop: 0, padding: "0 calc(.9 * var(--u))" }} data-testid="surplus-post-link">
            E’lon berish
          </Link>
        </div>
        <div className="dk-chips">
          {marketChips.map((chip) => (
            <button key={chip.id} type="button" className={cat === chip.id ? "dk-chip on" : "dk-chip"} onClick={() => setCat(chip.id)}>
              {chip.label}
            </button>
          ))}
        </div>
        <div className="dk-drops">
          <Drop label="Filtrlar" open={open === "f"} onToggle={() => toggle("f")}>
            <button type="button" className="dk-link" onClick={() => { setCat("all"); setBrands([]); setPrice([0, PRICE_MAX]); setAvail("ombor"); setOfficial(false); setOpen(null); }}>
              Tozalash
            </button>
          </Drop>
          <Drop label="Brend" open={open === "b"} onToggle={() => toggle("b")}>
            {surplusBrandList.map((brand) => (
              <CheckRow key={brand.key} label={brand.label} on={brands.includes(brand.key)} onClick={() => setBrands((current) => (current.includes(brand.key) ? current.filter((item) => item !== brand.key) : [...current, brand.key]))} />
            ))}
          </Drop>
          <Drop label="Narx oralig‘i (so‘m)" open={open === "p"} onToggle={() => toggle("p")}>
            <RangeSlider min={0} max={PRICE_MAX} value={price} onChange={setPrice} />
          </Drop>
          <Drop label="Mavjudligi" open={open === "a"} onToggle={() => toggle("a")}>
            <RadioRow label="Omborda bor" on={avail === "ombor"} onClick={() => setAvail("ombor")} />
            <RadioRow label="Buyurtma asosida" on={avail === "buyurtma"} onClick={() => setAvail("buyurtma")} />
            <RadioRow label="Faqat yangi" on={avail === "yangi"} onClick={() => setAvail("yangi")} />
          </Drop>
          <Drop label="Rasmiy distribyutor" open={open === "o"} onToggle={() => toggle("o")}>
            <CheckRow label="Faqat rasmiy" on={official} onClick={() => setOfficial((value) => !value)} />
          </Drop>
          <Drop label="Reyting" open={open === "r"} onToggle={() => toggle("r")}>
            <RadioRow label="Yuqori reyting" on={sort === "reyting"} onClick={() => setSort("reyting")} />
          </Drop>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "calc(.3 * var(--u))", fontSize: "calc(.66 * var(--u))" }}>
            Saralash:
            <Drop label={sortLabel(sort)} open={open === "s"} onToggle={() => toggle("s")}>
              {(
                [
                  ["ommabop", "Ommabop"],
                  ["arzon", "Arzon"],
                  ["qimmat", "Qimmat"],
                  ["reyting", "Reyting"],
                  ["yangi", "Yangi"],
                ] as const
              ).map(([key, label]) => (
                <button key={key} type="button" className="dk-check" onClick={() => { setSort(key); setOpen(null); }}>
                  {label}
                </button>
              ))}
            </Drop>
          </span>
        </div>
        <div className="dk-cols">
          <aside className="dk-panel">
            <h4>
              Kategoriya <SlidersHorizontal className="i" />
            </h4>
            {surplusCategoryCounts.map((item) => (
              <CheckRow
                key={item.id}
                label={item.label}
                count={item.count}
                on={cat === item.id}
                onClick={() => setCat(item.id)}
              />
            ))}
            <button type="button" className="dk-more" onClick={() => setMore((value) => !value)}>
              {more ? "Yig‘ish" : "Yana ko‘rsatish"}
            </button>
            <div className="dk-sec">
              <h4>Brend</h4>
              <label className="dk-search">
                <Search className="i" />
                <input value={brandQ} onChange={(event) => setBrandQ(event.target.value)} placeholder="Brend qidirish" aria-label="Brend qidirish" />
              </label>
              {brandRows.map((brand) => (
                <CheckRow
                  key={brand.key}
                  label={brand.label}
                  count={brand.count}
                  on={brands.includes(brand.key)}
                  onClick={() => setBrands((current) => (current.includes(brand.key) ? current.filter((item) => item !== brand.key) : [...current, brand.key]))}
                />
              ))}
            </div>
            <div className="dk-sec">
              <h4>Narx oralig‘i (so‘m)</h4>
              <RangeSlider min={0} max={PRICE_MAX} value={price} onChange={setPrice} />
            </div>
            <div className="dk-sec">
              <h4>Mavjudligi</h4>
              <RadioRow label="Omborda bor" count={986} on={avail === "ombor"} onClick={() => setAvail("ombor")} />
              <RadioRow label="Buyurtma asosida" on={avail === "buyurtma"} onClick={() => setAvail("buyurtma")} />
              <RadioRow label="Faqat yangi" on={avail === "yangi"} onClick={() => setAvail("yangi")} />
            </div>
            <div className="dk-sec">
              <h4>Rasmiy distribyutor</h4>
              <CheckRow label="Faqat rasmiy" count={427} on={official} onClick={() => setOfficial((value) => !value)} />
            </div>
          </aside>
          <div>
            {items.length === 0 ? (
              <div className="dk-empty">
                <b>Mos mahsulot topilmadi</b>
                <button type="button" onClick={() => { setCat("all"); setBrands([]); setAvail("ombor"); setOfficial(false); setPrice([0, PRICE_MAX]); }}>
                  Tozalash
                </button>
              </div>
            ) : (
              <div className="dk-grid">
                {localListings.map((listing) => (
                  <article className="dk-card" key={listing.id} data-testid="local-surplus-card">
                    <Link href={surplusHref(listing.id)} className="ph">
                      <img src={listing.image} alt="" />
                      <span className="dk-badge blue">Moderatsiyada</span>
                    </Link>
                    <h3>
                      <Link href={surplusHref(listing.id)}>{listing.name}</Link>
                    </h3>
                    <div className="brand">{listing.brand || "Ortiqcha material"}</div>
                    <div className="dk-stock">{listing.holatiLabel || "E’lon"}</div>
                    <div className="dk-price">
                      <strong>{som(listing.price)}</strong>
                      {listing.newPrice > listing.price ? <s>{som(listing.newPrice)}</s> : null}
                    </div>
                  </article>
                ))}
                {items.map((item) => (
                  <article className="dk-card" key={item.id}>
                    <Link href={surplusHref(item.id)} className="ph">
                      <img src={item.image} alt="" />
                      {item.discount ? <span className="dk-badge red">-{item.discount}%</span> : item.isNew ? <span className="dk-badge blue">Yangi</span> : null}
                    </Link>
                    <h3>
                      <Link href={surplusHref(item.id)}>{item.name}</Link>
                    </h3>
                    <div className="brand">{item.brand}</div>
                    <Stars value={item.rating} reviews={item.reviews} />
                    <div className="dk-stock">Omborda bor</div>
                    <div className="dk-price">
                      <strong>{som(item.price)}</strong>
                      {item.oldPrice ? <s>{som(item.oldPrice)}</s> : null}
                      <button type="button" className={pulse === item.id ? "dk-icon-add pulse" : "dk-icon-add"} aria-label="Savatga" onClick={() => add(item.id)} style={{ marginLeft: "auto" }}>
                        <ShoppingCart className="i" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
          <CartRail lines={lines} />
        </div>
      </div>
    </ShopShell>
  );
}

function sortLabel(sort: SortKey) {
  if (sort === "arzon") return "Arzon";
  if (sort === "qimmat") return "Qimmat";
  if (sort === "reyting") return "Reyting";
  if (sort === "yangi") return "Yangi";
  return "Ommabop";
}
