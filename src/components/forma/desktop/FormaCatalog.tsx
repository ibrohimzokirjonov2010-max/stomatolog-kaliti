"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Grid3x3, Heart, List, Shirt, ShoppingCart, Star, Upload } from "lucide-react";
import { RangeSlider } from "@/components/shop/desktop/parts";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, shopToggleFav, som, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  FORMA_PRICE_MAX,
  LOGO_PRICE,
  desktopForma,
  formaBrands,
  formaCats,
  formaGenders,
  formaMaterials,
  formaSizes,
  formaSwatches,
  sizeChart,
  wholesaleTiers,
  type DesktopForma,
  type FormaCat,
  type FormaGender,
  type FormaMaterial,
} from "@/data/desktop-forma";
import "./forma.css";

const sorts = [
  { id: "pop", label: "Eng mashhur" },
  { id: "cheap", label: "Narxi: arzon → qimmat" },
  { id: "rich", label: "Narxi: qimmat → arzon" },
  { id: "new", label: "Yangi mahsulotlar" },
  { id: "rate", label: "Reyting" },
] as const;

type SortId = (typeof sorts)[number]["id"];

function discountFor(qty: number) {
  if (qty >= 100) return 0.4;
  if (qty >= 50) return 0.3;
  if (qty >= 30) return 0.2;
  if (qty >= 10) return 0.1;
  return 0;
}

export function FormaCatalog() {
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [cat, setCat] = useState<"all" | FormaCat>("all");
  const [genders, setGenders] = useState<FormaGender[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [materials, setMaterials] = useState<FormaMaterial[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [moreBrands, setMoreBrands] = useState(false);
  const [price, setPrice] = useState<[number, number]>([0, FORMA_PRICE_MAX]);
  const [sort, setSort] = useState<SortId>("pop");
  const [list, setList] = useState(false);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<string | null>(null);
  const [place, setPlace] = useState<"chest" | "sleeve">("chest");
  const [note, setNote] = useState("");
  const [chart, setChart] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [bulkQty, setBulkQty] = useState(10);
  const [bulkSlug, setBulkSlug] = useState(desktopForma[0].slug);

  const shownBrands = moreBrands ? formaBrands : formaBrands.slice(0, 5);
  const priceOn = price[0] > 0 || price[1] < FORMA_PRICE_MAX;

  const items = useMemo(() => {
    let rows = desktopForma.filter((item) => {
      if (cat !== "all" && item.cat !== cat) return false;
      if (genders.length && !genders.includes(item.gender)) return false;
      if (sizes.length && !item.sizes.some((size) => sizes.includes(size))) return false;
      if (colors.length && !item.colors.some((color) => colors.includes(color.id))) return false;
      if (materials.length && !materials.includes(item.material)) return false;
      if (brands.length && !brands.includes(item.brandKey)) return false;
      if (priceOn && (item.price < price[0] || item.price > price[1])) return false;
      if (q && !`${item.name} ${item.brand} ${item.blurb}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "cheap") return a.price - b.price;
      if (sort === "rich") return b.price - a.price;
      if (sort === "rate") return b.rating - a.rating;
      if (sort === "new") return Number(b.isNew) - Number(a.isNew) || b.popularity - a.popularity;
      return b.popularity - a.popularity;
    });
    return rows;
  }, [brands, cat, colors, genders, materials, price, priceOn, q, sizes, sort]);

  const filtered = Boolean(q || cat !== "all" || genders.length || sizes.length || colors.length || materials.length || brands.length || priceOn);

  function toggle<T>(list: T[], value: T, set: (next: T[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function reset() {
    setCat("all");
    setGenders([]);
    setSizes([]);
    setColors([]);
    setMaterials([]);
    setBrands([]);
    setPrice([0, FORMA_PRICE_MAX]);
  }

  function add(item: DesktopForma, qty = 1) {
    const color = item.colors.find((entry) => entry.id === picked[item.slug]) ?? item.colors[0];
    shopAdd(
      {
        id: `forma-${item.slug}-${color?.id ?? "one"}`,
        name: color ? `${item.name} · ${color.label}` : item.name,
        price: item.price,
        image: item.image,
        href: `/forma/${item.slug}`,
      },
      qty,
    );
    setNote(`${item.name} savatga qo‘shildi`);
  }

  function orderLogo() {
    shopAdd({
      id: `forma-logo-${place}`,
      name: place === "chest" ? "Logo kashtasi · Ko‘krak" : "Logo kashtasi · Yeng",
      price: LOGO_PRICE,
      image: logo ?? "/img/forma/coat.jpg",
      href: "/forma",
    });
    setNote("Logo kashtasi buyurtmasi savatga qo‘shildi");
  }

  function orderBulk() {
    const item = desktopForma.find((entry) => entry.slug === bulkSlug) ?? desktopForma[0];
    const rate = discountFor(bulkQty);
    const unit = Math.round(item.price * (1 - rate));
    shopAdd(
      {
        id: `forma-bulk-${item.slug}`,
        name: `${item.name} · ulgurji ${bulkQty} dona`,
        price: unit * bulkQty,
        image: item.image,
        href: `/forma/${item.slug}`,
      },
      1,
    );
    setBulk(false);
    setNote(rate ? `Ulgurji buyurtma saqlandi · chegirma ${Math.round(rate * 100)}%` : "Ulgurji buyurtma savatga qo‘shildi");
  }

  return (
    <ShopShell searchPath="/forma" cartCount={cartCount} placeholder="Mahsulot, brend yoki kategoriya qidiring..." showCamera={false}>
      <div className="fm-page">
        <div className="fm-head">
          <div>
            <h1>Tibbiy forma</h1>
            <p>Stomatologlar va klinika xodimlari uchun sifatli, qulay va zamonaviy tibbiy kiyimlar.</p>
          </div>
          <button type="button" className="fm-wholesale" onClick={() => setBulk(true)}>
            <Shirt className="i" /> Klinika uchun ulgurji buyurtma
          </button>
        </div>

        <div className="fm-tabs">
          {formaCats.map((item) => (
            <button key={item.id} type="button" className={cat === item.id ? "fm-tab on" : "fm-tab"} onClick={() => setCat(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="fm-cols">
          <aside className="fm-panel">
            <h3>
              Filtrlar
              <button type="button" onClick={reset}>Tozalash</button>
            </h3>
            <h4>Jins</h4>
            {formaGenders.map((item) => (
              <button key={item.id} type="button" className={genders.includes(item.id) ? "fm-check on" : "fm-check"} onClick={() => toggle(genders, item.id, setGenders)}>
                <i className="fm-boxi">{genders.includes(item.id) ? <Check className="i" /> : null}</i>
                {item.label}
              </button>
            ))}
            <h4>O‘lcham</h4>
            <div className="fm-sizes">
              {formaSizes.map((size) => (
                <button key={size} type="button" className={sizes.includes(size) ? "fm-sz on" : "fm-sz"} onClick={() => toggle(sizes, size, setSizes)}>
                  {size}
                </button>
              ))}
            </div>
            <h4>Rang</h4>
            <div className="fm-dots">
              {formaSwatches.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={colors.includes(color.id) ? "fm-dot on" : "fm-dot"}
                  style={{ background: color.hex }}
                  aria-label={color.label}
                  onClick={() => toggle(colors, color.id, setColors)}
                />
              ))}
            </div>
            <h4>Mato</h4>
            {formaMaterials.map((item) => (
              <button key={item.id} type="button" className={materials.includes(item.id) ? "fm-check on" : "fm-check"} onClick={() => toggle(materials, item.id, setMaterials)}>
                <i className="fm-boxi">{materials.includes(item.id) ? <Check className="i" /> : null}</i>
                {item.label}
              </button>
            ))}
            <h4>Narx oralig‘i</h4>
            <RangeSlider min={0} max={FORMA_PRICE_MAX} value={price} onChange={setPrice} />
            <div className="fm-labs">
              <span>{som(price[0])}</span>
              <span>{som(price[1])}</span>
            </div>
            <h4>Brend</h4>
            {shownBrands.map((item) => (
              <button key={item.id} type="button" className={brands.includes(item.id) ? "fm-check on" : "fm-check"} onClick={() => toggle(brands, item.id, setBrands)}>
                <i className="fm-boxi">{brands.includes(item.id) ? <Check className="i" /> : null}</i>
                {item.label}
              </button>
            ))}
            <button type="button" className="fm-link" onClick={() => setMoreBrands((open) => !open)}>
              {moreBrands ? "Yig‘ish" : "Barchasini ko‘rsatish"}
            </button>
          </aside>

          <div>
            <div className="fm-tools">
              {sorts.map((item) => (
                <button key={item.id} type="button" className={sort === item.id ? "fm-sort on" : "fm-sort"} onClick={() => setSort(item.id)}>
                  {item.label}
                </button>
              ))}
              <span className="fm-count">{filtered ? items.length : desktopForma.length} ta mahsulot</span>
              <div className="fm-view">
                <button type="button" className={list ? "" : "on"} aria-label="Katak" onClick={() => setList(false)}>
                  <Grid3x3 className="i" />
                </button>
                <button type="button" className={list ? "on" : ""} aria-label="Ro‘yxat" onClick={() => setList(true)}>
                  <List className="i" />
                </button>
              </div>
            </div>
            {items.length === 0 ? (
              <div className="fm-empty">Bu filtrda mahsulot yo‘q.</div>
            ) : (
              <div className={list ? "fm-grid list" : "fm-grid"} style={{ marginTop: "calc(.5 * var(--u))" }}>
                {items.map((item) => {
                  const color = item.colors.find((entry) => entry.id === picked[item.slug]) ?? item.colors[0];
                  return (
                    <article className="fm-card" key={item.slug}>
                      <div className="ph">
                        <Link href={`/forma/${item.slug}`}>
                          <img src={item.image} alt="" />
                        </Link>
                        <button type="button" className={favs.includes(item.slug) ? "fm-heart on" : "fm-heart"} aria-label="Sevimli" onClick={() => shopToggleFav(item.slug)}>
                          <Heart className="i" />
                        </button>
                      </div>
                      <div className="bd">
                        <span className="fm-brand">{item.brand}</span>
                        <h3>
                          <Link href={`/forma/${item.slug}`}>{item.name}</Link>
                        </h3>
                        <p className="fm-blurb">{item.blurb}</p>
                        <div className="fm-rate">
                          <Star className="i" /> {item.rating.toFixed(1)} <span>({item.reviews})</span>
                        </div>
                        {item.colors.length ? (
                          <div className="fm-dots">
                            {item.colors.map((entry) => (
                              <button
                                key={entry.id}
                                type="button"
                                className={color?.id === entry.id ? "fm-dot on" : "fm-dot"}
                                style={{ background: entry.hex }}
                                aria-label={entry.label}
                                onClick={() => setPicked((prev) => ({ ...prev, [item.slug]: entry.id }))}
                              />
                            ))}
                          </div>
                        ) : null}
                        {item.sizes.length ? (
                          <div className="fm-sizes">
                            {item.sizes.slice(0, 6).map((size) => (
                              <span className="fm-sz" key={size}>{size}</span>
                            ))}
                          </div>
                        ) : null}
                        <div className="fm-price">
                          <strong>{som(item.price)}</strong>
                          {item.oldPrice ? <s>{som(item.oldPrice)}</s> : null}
                          {item.off ? <em className="fm-off">−{item.off}%</em> : null}
                        </div>
                        <button type="button" className="fm-add" onClick={() => add(item)}>
                          <ShoppingCart className="i" /> Savatga qo‘shish
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {note ? <p className="fm-note">{note}</p> : null}
          </div>

          <aside className="fm-rail">
            <section className="fm-box">
              <h3>Logo kashtasi xizmati</h3>
              <div className="fm-logo-ph">
                <img className="coat" src="/img/forma/coat.jpg" alt="" />
                <div className={place === "sleeve" ? "fm-logo-mark sleeve" : "fm-logo-mark"}>
                  {logo ? <img src={logo} alt="" /> : <ShirtMark />}
                </div>
              </div>
              <p className="fm-blurb" style={{ marginTop: "calc(.4 * var(--u))" }}>
                Klinika logoyingizni tibbiy formaga kashta qilib beramiz.
              </p>
              <label className="fm-upload">
                <Upload className="i" />
                <b>Logoni yuklash</b>
                Fayl tanlang (PNG, SVG)
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setLogo(String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <div className="fm-field">
                <span>Joylashuv</span>
                <div className="fm-switch">
                  <button type="button" className={place === "chest" ? "on" : ""} onClick={() => setPlace("chest")}>Ko‘krak qismi</button>
                  <button type="button" className={place === "sleeve" ? "on" : ""} onClick={() => setPlace("sleeve")}>Yeng qismi</button>
                </div>
              </div>
              <div className="fm-ship">
                <span>Narx</span>
                <b>{som(LOGO_PRICE)} / dona</b>
              </div>
              <button type="button" className="fm-add" onClick={orderLogo}>Buyurtma berish</button>
            </section>

            <section className="fm-box">
              <h3>Ulgurji buyurtma uchun chegirmalar</h3>
              {wholesaleTiers.map((tier) => (
                <div className="fm-tier" key={tier.qty}>
                  <span>{tier.qty}</span>
                  <b className={tier.off === "Maxsus narx" ? "special" : ""}>{tier.off}</b>
                </div>
              ))}
            </section>

            <section className="fm-box">
              <div className="fm-chart-card">
                <svg className="fm-shirt" viewBox="0 0 80 96" aria-hidden="true">
                  <path d="M28 10 h24 l14 12 v16 h-8 v48 H22 V38 h-8 V22 Z" fill="#e7f6f8" stroke="#1497a8" strokeWidth="2" />
                  <path d="M34 10 q6 8 12 0" fill="none" stroke="#1497a8" strokeWidth="2" />
                </svg>
                <div>
                  <h3 style={{ marginBottom: 0 }}>O‘lchamlar jadvali</h3>
                  <p>To‘g‘ri o‘lcham tanlash uchun jadvaldan foydalaning.</p>
                  <button type="button" className="fm-link" onClick={() => setChart(true)}>O‘lchamlar jadvalini ko‘rish →</button>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {chart ? (
        <div className="fm-modal" onClick={() => setChart(false)}>
          <div className="fm-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>O‘lchamlar jadvali (sm)</h3>
            <SizeTable />
            <div className="fm-actions">
              <button type="button" className="fm-ghost" onClick={() => setChart(false)}>Yopish</button>
            </div>
          </div>
        </div>
      ) : null}

      {bulk ? (
        <div className="fm-modal" onClick={() => setBulk(false)}>
          <div className="fm-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Klinika uchun ulgurji buyurtma</h3>
            <p>10 tadan boshlab chegirma qo‘llanadi. 100+ dona uchun maxsus narx menejer bilan kelishiladi.</p>
            <label>Mahsulot</label>
            <select value={bulkSlug} onChange={(event) => setBulkSlug(event.target.value)}>
              {desktopForma.map((item) => (
                <option key={item.slug} value={item.slug}>{item.brand} — {item.name}</option>
              ))}
            </select>
            <label>Dona</label>
            <input type="number" min={1} max={500} value={bulkQty} onChange={(event) => setBulkQty(Number(event.target.value) || 1)} />
            <p className="fm-note">
              {discountFor(bulkQty) ? `Chegirma ${Math.round(discountFor(bulkQty) * 100)}%` : bulkQty >= 100 ? "Maxsus narx" : "Chegirma 10 donadan boshlanadi"}
            </p>
            <div className="fm-actions">
              <button type="button" className="fm-add" onClick={orderBulk}><ShoppingCart className="i" /> Savatga qo‘shish</button>
              <button type="button" className="fm-ghost" onClick={() => setBulk(false)}>Bekor qilish</button>
            </div>
          </div>
        </div>
      ) : null}
    </ShopShell>
  );
}

function ShirtMark() {
  return (
    <>
      <Shirt className="i" />
      Smile Dental Clinic
    </>
  );
}

export function SizeTable({ active }: { active?: string }) {
  return (
    <table className="fm-table">
      <thead>
        <tr>
          <th>O‘lcham</th>
          <th>Ko‘krak (A)</th>
          <th>Bel (B)</th>
          <th>Bo‘y (C)</th>
        </tr>
      </thead>
      <tbody>
        {sizeChart.map((row) => (
          <tr key={row.size} className={active === row.size ? "on" : ""}>
            <td>{row.size}</td>
            <td>{row.chest}</td>
            <td>{row.waist}</td>
            <td>{row.height}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
