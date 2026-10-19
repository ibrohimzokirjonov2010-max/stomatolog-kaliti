"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Footprints,
  HardHat,
  Heart,
  LayoutGrid,
  List,
  Shirt,
  ShoppingCart,
  Star,
  Stethoscope,
  Upload,
  X,
} from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, shopToggleFav, som, somPlain, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
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

const catIcons: Record<"all" | FormaCat, ReactNode> = {
  all: <Building2 className="i" />,
  scrub: <Shirt className="i" />,
  xalat: <CoatIcon />,
  qalpoq: <HardHat className="i" />,
  poyabzal: <Footprints className="i" />,
  fartuk: <ApronIcon />,
  aksessuar: <Stethoscope className="i" />,
};

const priceFrom = [0, 50_000, 100_000, 200_000, 300_000, 500_000];
const priceTo = [100_000, 200_000, 300_000, 400_000, 500_000, FORMA_PRICE_MAX];

/** Wholesale discount by quantity (matches the tiers in the rail). 100+ is negotiated, so the cart uses the 50+ rate. */
export function wholesaleRate(qty: number) {
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
  const [cat, setCat] = useState<"all" | FormaCat>(() => {
    const raw = params.get("cat");
    return formaCats.some((item) => item.id === raw) ? (raw as FormaCat) : "all";
  });
  const [genders, setGenders] = useState<FormaGender[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [materials, setMaterials] = useState<FormaMaterial[]>([]);
  const [brands, setBrands] = useState<string[]>(() => {
    const raw = params.get("brand");
    return raw && formaBrands.some((item) => item.id === raw) ? [raw] : [];
  });
  const [moreBrands, setMoreBrands] = useState(false);
  const [price, setPrice] = useState<[number, number]>([0, FORMA_PRICE_MAX]);
  const [sort, setSort] = useState<SortId>("pop");
  const [list, setList] = useState(false);
  const [logo, setLogo] = useState<{ name: string; url: string } | null>(null);
  const [place, setPlace] = useState<"chest" | "sleeve">("chest");
  const [note, setNote] = useState("");
  const [chart, setChart] = useState(false);
  const [bulk, setBulk] = useState(false);

  const shownBrands = moreBrands ? formaBrands : formaBrands.slice(0, 5);
  const priceOn = price[0] > 0 || price[1] < FORMA_PRICE_MAX;

  const items = useMemo(() => {
    const families = formaSwatches.filter((sw) => colors.includes(sw.id)).flatMap((sw) => sw.family);
    const rows = desktopForma.filter((item) => {
      if (cat !== "all" && item.cat !== cat) return false;
      if (genders.length && !genders.includes(item.gender) && !(item.gender === "uniseks" && genders.length < 3)) return false;
      if (sizes.length && !item.sizes.some((size) => sizes.includes(size === "XXL" ? "2XL" : size))) return false;
      if (families.length && !item.colors.some((color) => families.includes(color.id))) return false;
      if (materials.length && !materials.includes(item.material)) return false;
      if (brands.length && !brands.includes(item.brandKey)) return false;
      if (priceOn && (item.price < price[0] || item.price > price[1])) return false;
      if (q && !`${item.name} ${item.brand} ${item.blurb}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "cheap") return a.price - b.price;
      if (sort === "rich") return b.price - a.price;
      if (sort === "rate") return b.rating - a.rating || b.reviews - a.reviews;
      if (sort === "new") return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) || b.popularity - a.popularity;
      return b.popularity - a.popularity;
    });
  }, [brands, cat, colors, genders, materials, price, priceOn, q, sizes, sort]);

  function toggle<T>(current: T[], value: T, set: (next: T[]) => void) {
    set(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
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

  function add(item: DesktopForma) {
    const color = item.colors[0];
    shopAdd({
      id: `forma-${item.slug}-${color?.id ?? "one"}`,
      name: item.name,
      variant: color ? color.label : undefined,
      price: item.price,
      image: item.image,
      href: `/forma/${item.slug}`,
      seller: item.brand,
    });
    setNote(`${item.name} savatga qo‘shildi`);
  }

  function orderLogo() {
    if (!logo) {
      setNote("Avval klinika logotipini yuklang (PNG yoki SVG).");
      return;
    }
    shopAdd({
      id: `forma-logo-${place}`,
      name: "Logo kashtasi xizmati",
      variant: `${place === "chest" ? "Ko‘krak qismi" : "Yeng qismi"} · ${logo.name}`,
      price: LOGO_PRICE,
      image: "/img/forma/d-logo-kashta.jpg",
      href: "/forma",
      seller: "StomaHub Forma",
    });
    setNote("Logo kashtasi savatga qo‘shildi. Logotip fayli hozircha buyurtmaga biriktirilmaydi — uni buyurtma tasdiqlanganda sotuvchiga yuborasiz.");
  }

  return (
    <ShopShell searchPath="/forma" cartCount={cartCount} placeholder="Mahsulot, brend yoki kategoriya qidirish..." showCamera={false}>
      <div className="fx" data-testid="forma-catalog">
        <div className="fx-head">
          <div>
            <h1>Tibbiy forma</h1>
            <p>Stomatologlar va klinika xodimlari uchun sifatli, qulay va zamonaviy tibbiy kiyimlar.</p>
          </div>
          <button type="button" className="fx-bulk-btn" onClick={() => setBulk(true)}>
            <Building2 className="i" /> Klinika uchun ulgurji buyurtma <ArrowRight className="i" />
          </button>
        </div>

        <div className="fx-tabs" role="tablist" aria-label="Kategoriya">
          {formaCats.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={cat === item.id} className={cat === item.id ? "fx-tab on" : "fx-tab"} onClick={() => setCat(item.id)}>
              {catIcons[item.id]} {item.label}
            </button>
          ))}
        </div>

        <div className="fx-cols">
          <aside className="fx-panel" aria-label="Filtrlar">
            <div className="fx-panel-hd">
              <h3>Filtrlar</h3>
              <button type="button" onClick={reset}>Tozalash</button>
            </div>

            <section>
              <h4>Jins</h4>
              <div className="fx-inline">
                {formaGenders.map((item) => (
                  <Check key={item.id} on={genders.includes(item.id)} label={item.label} onClick={() => toggle(genders, item.id, setGenders)} />
                ))}
              </div>
            </section>

            <section>
              <h4>O‘lcham</h4>
              <div className="fx-sizes">
                {formaSizes.map((size) => (
                  <button key={size} type="button" aria-pressed={sizes.includes(size)} className={sizes.includes(size) ? "fx-sz on" : "fx-sz"} onClick={() => toggle(sizes, size, setSizes)}>
                    {size}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h4>Rang</h4>
              <div className="fx-swatches">
                {formaSwatches.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className={colors.includes(color.id) ? "fx-swatch on" : "fx-swatch"}
                    style={{ background: color.hex }}
                    aria-pressed={colors.includes(color.id)}
                    aria-label={color.label}
                    title={color.label}
                    onClick={() => toggle(colors, color.id, setColors)}
                  />
                ))}
              </div>
            </section>

            <section>
              <h4>Mato</h4>
              {formaMaterials.map((item) => (
                <Check key={item.id} on={materials.includes(item.id)} label={item.label} onClick={() => toggle(materials, item.id, setMaterials)} />
              ))}
            </section>

            <section>
              <h4>Narx oralig‘i</h4>
              <div className="fx-price">
                <select aria-label="Narx: dan" value={price[0]} onChange={(event) => setPrice([Number(event.target.value), Math.max(price[1], Number(event.target.value))])}>
                  {priceFrom.map((value) => <option key={value} value={value}>{somPlain(value)}</option>)}
                </select>
                <select aria-label="Narx: gacha" value={price[1]} onChange={(event) => setPrice([Math.min(price[0], Number(event.target.value)), Number(event.target.value)])}>
                  {priceTo.map((value) => <option key={value} value={value}>{somPlain(value)}</option>)}
                </select>
              </div>
            </section>

            <section>
              <h4>Brend</h4>
              {shownBrands.map((item) => (
                <Check key={item.id} on={brands.includes(item.id)} label={item.label} onClick={() => toggle(brands, item.id, setBrands)} />
              ))}
              <button type="button" className="fx-more" onClick={() => setMoreBrands((open) => !open)}>{moreBrands ? "Yig‘ish" : "Barchasini ko‘rsatish"}</button>
            </section>
          </aside>

          <div className="fx-list">
            <div className="fx-tools">
              <div className="fx-sorts">
                {sorts.map((item) => (
                  <button key={item.id} type="button" aria-pressed={sort === item.id} className={sort === item.id ? "on" : ""} onClick={() => setSort(item.id)}>{item.label}</button>
                ))}
              </div>
              <span className="fx-count">{items.length} ta mahsulot</span>
              <div className="fx-view">
                <button type="button" className={list ? "" : "on"} aria-label="Katak" aria-pressed={!list} onClick={() => setList(false)}><LayoutGrid className="i" /></button>
                <button type="button" className={list ? "on" : ""} aria-label="Ro‘yxat" aria-pressed={list} onClick={() => setList(true)}><List className="i" /></button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="fx-empty">
                <b>Mos mahsulot topilmadi</b>
                <p>Filtrlarni o‘zgartirib ko‘ring.</p>
                <button type="button" onClick={reset}>Filtrlarni tozalash</button>
              </div>
            ) : (
              <div className={list ? "fx-grid list" : "fx-grid"}>
                {items.map((item) => {
                  const fav = favs.includes(item.slug);
                  return (
                    <article className="fx-card" key={item.slug} data-testid="forma-card">
                      <div className="ph">
                        <Link href={`/forma/${item.slug}`} aria-label={item.name}><img src={item.image} alt="" loading="lazy" /></Link>
                        <button type="button" className={fav ? "fx-heart on" : "fx-heart"} aria-pressed={fav} aria-label={fav ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"} onClick={() => shopToggleFav(item.slug)}><Heart className="i" /></button>
                      </div>
                      <div className="bd">
                        <span className="fx-brand">{item.brand.charAt(0) + item.brand.slice(1).toLowerCase()}</span>
                        <h3><Link href={`/forma/${item.slug}`}>{item.name}</Link></h3>
                        <p className="fx-blurb">{item.blurb}</p>
                        <span className="fx-rate"><Star className="i" /> {item.rating.toFixed(1)} <em>({item.reviews})</em></span>
                        <span className="fx-dots" aria-label={`Ranglar: ${item.colors.map((color) => color.label).join(", ")}`}>
                          {item.colors.map((color) => <i key={color.id} style={{ background: color.hex }} title={color.label} />)}
                        </span>
                        {item.sizes.length ? (
                          <span className="fx-chips">{item.sizes.slice(0, 6).map((size) => <i key={size}>{size}</i>)}</span>
                        ) : <span className="fx-chips none">Yagona o‘lcham</span>}
                        <div className="fx-pricing">
                          <strong>{som(item.price)}</strong>
                          {item.off ? <em className="fx-off">−{item.off}%</em> : null}
                          {item.oldPrice ? <s>{som(item.oldPrice)}</s> : null}
                        </div>
                        <button type="button" className="fx-add" aria-label={`${item.name} — savatga qo‘shish`} onClick={() => add(item)}><ShoppingCart className="i" /> Savatga qo‘shish</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="fx-rail">
            <section className="fx-box fx-logo">
              <h3>Logo kashtasi xizmati</h3>
              <div className="fx-logo-ph">
                <img src="/img/forma/d-logo-kashta.jpg" alt="Tibbiy xalatga kashta qilingan logo namunasi" />
                {logo ? <span className={place === "sleeve" ? "mine sleeve" : "mine"}><img src={logo.url} alt="Yuklangan logo" /></span> : null}
              </div>
              <p>Klinika logoyingizni tibbiy formaga kashta qilib beramiz.</p>
              <h4>Logoni yuklash</h4>
              <label className="fx-file">
                <Upload className="i" />
                <span>{logo ? logo.name : "Fayl tanlang (PNG, SVG)"}</span>
                {logo ? (
                  <button type="button" className="x" aria-label="Logoni olib tashlash" onClick={(event) => { event.preventDefault(); setLogo(null); }}><X className="i" /></button>
                ) : null}
                <input
                  type="file"
                  accept="image/png,image/svg+xml"
                  aria-label="Logo fayli"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    if (!/^image\/(png|svg\+xml)$/.test(file.type)) {
                      setNote("Faqat PNG yoki SVG fayl yuklang.");
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      setNote("Fayl 5 MB dan katta bo‘lmasin.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => setLogo({ name: file.name, url: String(reader.result) });
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <h4>Joylashuv</h4>
              <div className="fx-place" role="radiogroup" aria-label="Joylashuv">
                <button type="button" role="radio" aria-checked={place === "chest"} className={place === "chest" ? "on" : ""} onClick={() => setPlace("chest")}>Ko‘krak qismi</button>
                <button type="button" role="radio" aria-checked={place === "sleeve"} className={place === "sleeve" ? "on" : ""} onClick={() => setPlace("sleeve")}>Yeng qismi</button>
              </div>
              <div className="fx-logo-price"><span>Narx</span><b>{somPlain(LOGO_PRICE)} so‘m / dona</b></div>
              <button type="button" className="fx-add big" onClick={orderLogo}>Buyurtma berish <ArrowRight className="i" /></button>
            </section>

            <section className="fx-box">
              <h3>Ulgurji buyurtma uchun chegirmalar</h3>
              <div className="fx-tiers">
                {wholesaleTiers.map((tier) => (
                  <div className="fx-tier" key={tier.qty}>
                    <span>{tier.qty}</span>
                    <b>{tier.off}</b>
                  </div>
                ))}
              </div>
            </section>

            <section className="fx-box">
              <h3>O‘lchamlar jadvali</h3>
              <div className="fx-chart-card">
                <ShirtSketch className="fx-shirt" />
                <div>
                  <p>To‘g‘ri o‘lcham tanlash uchun jadvaldan foydalaning.</p>
                  <button type="button" className="fx-ghost" onClick={() => setChart(true)}>O‘lchamlar jadvalini ko‘rish <ArrowRight className="i" /></button>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {chart ? (
          <Modal title="O‘lchamlar jadvali (sm)" onClose={() => setChart(false)}>
            <div className="fx-chart-modal">
              <SizeTable />
              <ShirtSketch className="fx-shirt big" labels />
            </div>
            <p className="fx-muted">A — ko‘krak aylanasi, B — bel aylanasi, C — bo‘y. O‘lchamni yengil kiyim ustidan oling; ikki o‘lcham orasida bo‘lsangiz, kattasini tanlang.</p>
          </Modal>
        ) : null}

        {bulk ? <BulkModal onClose={() => setBulk(false)} onDone={setNote} /> : null}

        {note ? <p className="fx-toast" role="status" onAnimationEnd={() => setNote("")}>{note}</p> : null}
      </div>
    </ShopShell>
  );
}

function BulkModal({ onClose, onDone }: { onClose: () => void; onDone: (text: string) => void }) {
  const [slug, setSlug] = useState(desktopForma[0].slug);
  const [qty, setQty] = useState(10);
  const item = desktopForma.find((entry) => entry.slug === slug) ?? desktopForma[0];
  const rate = wholesaleRate(qty);
  const unit = Math.round(item.price * (1 - rate));
  return (
    <Modal title="Klinika uchun ulgurji buyurtma" onClose={onClose}>
      <p className="fx-muted">10 donadan boshlab chegirma qo‘llanadi. 100+ dona uchun maxsus narxni menejer kelishadi.</p>
      <label className="fx-field">Mahsulot
        <select value={slug} onChange={(event) => setSlug(event.target.value)}>
          {desktopForma.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.brand} — {entry.name}</option>)}
        </select>
      </label>
      <label className="fx-field">Soni (dona)
        <input type="number" min={1} max={1000} value={qty} onChange={(event) => setQty(Math.max(1, Math.min(1000, Number(event.target.value) || 1)))} />
      </label>
      <div className="fx-bulk-sum">
        <span>Bir dona: <b>{som(unit)}</b>{rate ? <em> −{Math.round(rate * 100)}%</em> : null}</span>
        <span>Jami: <b>{som(unit * qty)}</b></span>
      </div>
      {qty >= 100 ? <p className="fx-hint">100+ dona: savatdagi narx 30% chegirma bilan hisoblanadi, yakuniy maxsus narxni menejer tasdiqlaydi.</p> : null}
      <div className="fx-acts">
        <button type="button" className="fx-ghost" onClick={onClose}>Bekor qilish</button>
        <button
          type="button"
          className="fx-add"
          onClick={() => {
            shopAdd({ id: `forma-bulk-${item.slug}`, name: `${item.name} · ulgurji`, variant: `${qty} dona${rate ? ` · −${Math.round(rate * 100)}%` : ""}`, price: unit * qty, image: item.image, href: `/forma/${item.slug}`, seller: item.brand });
            onDone(rate ? `Ulgurji buyurtma savatga qo‘shildi · chegirma ${Math.round(rate * 100)}%` : "Buyurtma savatga qo‘shildi");
            onClose();
          }}
        >
          <ShoppingCart className="i" /> Savatga qo‘shish
        </button>
      </div>
    </Modal>
  );
}

function Check({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className={on ? "fx-check on" : "fx-check"} aria-pressed={on} onClick={onClick}>
      <i className="cb" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fx-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.target === event.currentTarget && onClose()} onKeyDown={(event) => event.key === "Escape" && onClose()}>
      <div className={wide ? "fx-dialog wide" : "fx-dialog"}>
        <div className="fx-dialog-hd">
          <h3>{title}</h3>
          <button type="button" className="x" aria-label="Yopish" onClick={onClose}><X className="i" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SizeTable({ active }: { active?: string }) {
  return (
    <table className="fx-table">
      <thead>
        <tr><th>O‘lcham</th><th>Ko‘krak (A)</th><th>Bel (B)</th><th>Bo‘y (C)</th></tr>
      </thead>
      <tbody>
        {sizeChart.map((row) => (
          <tr key={row.size} className={active === row.size || (active === "2XL" && row.size === "XXL") ? "on" : undefined}>
            <td>{row.size}</td><td>{row.chest}</td><td>{row.waist}</td><td>{row.height}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Scrub-top outline used for the size guide (A chest, B waist, C length). */
export function ShirtSketch({ className, labels }: { className?: string; labels?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 140 130" aria-hidden="true">
      <path d="M48 10 L30 16 L8 40 L22 56 L34 46 L34 118 L106 118 L106 46 L118 56 L132 40 L110 16 L92 10 Q70 34 48 10 Z" fill="#f4f8fb" stroke="#1d3d6e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M48 10 Q70 30 92 10" fill="none" stroke="#1d3d6e" strokeWidth="2" />
      <path d="M58 70 h16 v14 h-16 z" fill="none" stroke="#1d3d6e" strokeWidth="1.4" />
      {labels ? (
        <g fill="none" stroke="#0aa3a3" strokeWidth="1.6">
          <path d="M36 52 H104" /><path d="M36 92 H104" /><path d="M124 12 V118" />
        </g>
      ) : null}
      {labels ? (
        <g fontSize="10" fontWeight="700" textAnchor="middle">
          <circle cx="70" cy="52" r="8" fill="#0aa3a3" /><text x="70" y="55.5" fill="#fff">A</text>
          <circle cx="70" cy="92" r="8" fill="#0aa3a3" /><text x="70" y="95.5" fill="#fff">B</text>
          <circle cx="124" cy="66" r="8" fill="#0aa3a3" /><text x="124" y="69.5" fill="#fff">C</text>
        </g>
      ) : null}
    </svg>
  );
}

function CoatIcon() {
  return (
    <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3 5 5 3 12l2 1v8h14v-8l2-1-2-7-4-2" />
      <path d="M9 3l3 5 3-5" />
      <path d="M12 8v13" />
    </svg>
  );
}

function ApronIcon() {
  return (
    <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v5M16 3v5" />
      <path d="M8 8h8l1 3 2 1-1 9H6l-1-9 2-1z" />
      <path d="M9 15h6" />
    </svg>
  );
}
