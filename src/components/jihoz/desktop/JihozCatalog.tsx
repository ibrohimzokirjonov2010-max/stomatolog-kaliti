"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Headphones,
  Heart,
  LayoutGrid,
  List,
  Plus,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, shopToggleFav, som, somPlain, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  JIZOZ_PRICE_MAX,
  catLabel,
  jihozCats,
  jihozConds,
  jihozWarranties,
  type DesktopJihoz,
  type JihozCat,
  type JihozCond,
} from "@/data/desktop-jihozlar";
import { fetchSectionProducts, toDesktopJihoz } from "@/lib/live-content";
import "./jihoz.css";

const sorts = [
  { id: "pop", label: "Eng mashhur" },
  { id: "cheap", label: "Narxi: arzon → qimmat" },
  { id: "rich", label: "Narxi: qimmat → arzon" },
  { id: "new", label: "Yangi mahsulotlar" },
  { id: "rate", label: "Reyting" },
] as const;

type SortId = (typeof sorts)[number]["id"];

/** Card sub-line per category (as in the design). */
export const cardKind: Record<JihozCat, string> = {
  ustanovka: "Stomatologik ustanovka",
  rentgen: "Rentgen va CBCT",
  skaner: "Intraoral skaner",
  avtoklav: "Avtoklav",
  mikroskop: "Stomatologik mikroskop",
  kompressor: "Kompressor va aspirator",
  uchlik: "Uchlik",
  lampa: "Fotopolimer lampa",
};

/** Brand name as the brand writes it (text, not a logo image). */
export const brandMark: Record<string, string> = {
  sirona: "sirona",
  planmeca: "PLANMECA",
  shape: "3shape",
  zeiss: "ZEISS",
  kavo: "KaVo",
  melag: "MELAG",
  cattani: "CATTANI",
  ivoclar: "ivoclar",
  nsk: "NSK",
  wh: "W&H",
  fengdan: "FENGDAN",
  runyes: "RUNYES",
  anthos: "anthos",
  diplomat: "DIPLOMAT",
};

function condText(id: JihozCond) {
  return id === "korgazma" ? "Ko‘rgazmali" : jihozConds.find((item) => item.id === id)?.label ?? id;
}

export function JihozCatalog() {
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [cat, setCat] = useState<"all" | JihozCat>(() => {
    const raw = params.get("cat");
    return jihozCats.some((item) => item.id === raw) ? (raw as JihozCat) : "all";
  });
  const [conds, setConds] = useState<JihozCond[]>([]);
  const [brands, setBrands] = useState<string[]>(() => {
    const raw = params.get("brand");
    return raw ? [raw] : [];
  });
  const [moreBrands, setMoreBrands] = useState(false);
  const [price, setPrice] = useState<[number, number]>([0, JIZOZ_PRICE_MAX]);
  const [warranties, setWarranties] = useState<number[]>([]);
  const [leasing, setLeasing] = useState(false);
  const [install, setInstall] = useState(false);
  const [official, setOfficial] = useState(false);
  const [city, setCity] = useState("Barchasi");
  const [sort, setSort] = useState<SortId>("pop");
  const [list, setList] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [source, setSource] = useState<DesktopJihoz[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stop = false;
    void fetchSectionProducts("jihozlar").then((rows) => {
      if (stop) return;
      setSource(rows.map(toDesktopJihoz));
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);
  const [note, setNote] = useState("");
  const [offer, setOffer] = useState<DesktopJihoz | null>(null);
  const [consult, setConsult] = useState(false);
  const [table, setTable] = useState(false);

  const priceOn = price[0] > 0 || price[1] < JIZOZ_PRICE_MAX;
  const liveBrands = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of source) map.set(item.brandKey, item.brand);
    return [...map].map(([id, label]) => ({ id, label }));
  }, [source]);
  const shownBrands = moreBrands ? liveBrands : liveBrands.slice(0, 8);
  const cities = useMemo(() => [...new Set(source.map((item) => item.city).filter(Boolean))], [source]);
  const countOf = (pred: (item: DesktopJihoz) => boolean) => source.filter(pred).length;

  const items = useMemo(() => {
    const rows = source.filter((item) => {
      if (cat !== "all" && item.cat !== cat) return false;
      if (conds.length && !conds.includes(item.condition)) return false;
      if (brands.length && !brands.includes(item.brandKey)) return false;
      if (warranties.length && !warranties.includes(item.warranty)) return false;
      if (leasing && !item.leasing) return false;
      if (install && !item.install) return false;
      if (official && !item.official) return false;
      if (city !== "Barchasi" && item.city !== city) return false;
      if (priceOn && (item.price < price[0] || item.price > price[1])) return false;
      if (q && !`${item.name} ${item.brand} ${item.spec}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "cheap") return a.price - b.price;
      if (sort === "rich") return b.price - a.price;
      if (sort === "new") return b.year - a.year || b.popularity - a.popularity;
      if (sort === "rate") return b.rating - a.rating;
      return b.popularity - a.popularity;
    });
  }, [brands, cat, city, conds, install, leasing, official, price, priceOn, q, sort, source, warranties]);

  function toggle<T>(current: T[], value: T, set: (next: T[]) => void) {
    set(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function reset() {
    setCat("all");
    setConds([]);
    setBrands([]);
    setPrice([0, JIZOZ_PRICE_MAX]);
    setWarranties([]);
    setLeasing(false);
    setInstall(false);
    setOfficial(false);
    setCity("Barchasi");
  }

  function addCart(item: DesktopJihoz) {
    shopAdd({ id: `jihoz-${item.slug}`, name: item.name, variant: cardKind[item.cat], price: item.price, image: item.image, href: `/jihozlar/${item.slug}`, seller: item.brand, official: item.official });
  }

  function toggleCompare(slug: string) {
    setCompare((current) => {
      if (current.includes(slug)) return current.filter((id) => id !== slug);
      if (current.length >= 3) return current;
      return [...current, slug];
    });
  }

  const setPriceAt = (index: 0 | 1, raw: string) => {
    const value = Math.min(Number(raw.replace(/\D/g, "")) || 0, JIZOZ_PRICE_MAX);
    setPrice((current) => (index === 0 ? [Math.min(value, current[1]), current[1]] : [current[0], Math.max(value, current[0])]));
  };

  const compared = compare.map((slug) => source.find((item) => item.slug === slug)).filter((item): item is DesktopJihoz => Boolean(item));

  return (
    <ShopShell searchPath="/jihozlar" cartCount={cartCount} placeholder="Stomatologik jihozlar, brend yoki model qidirish..." showCamera={false}>
      <div className="jx" data-testid="jihoz-catalog">
        <div className="jx-main">
          <p className="jx-crumb">Bosh sahifa <span>/</span> Marketplace <span>/</span> Jihozlar</p>
          <section className="jx-hero">
            <div>
              <h1>Jihozlar</h1>
              <p>Stomatologik klinika uchun zamonaviy jihoz va uskunalar: samarali klinika endomotor, apeks-lokator, rentgen, avtoklav va boshqalar.</p>
            </div>
          </section>

          <div className="jx-tabs" role="tablist" aria-label="Kategoriya">
            {jihozCats.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={cat === item.id} className={cat === item.id ? "jx-tab on" : "jx-tab"} onClick={() => setCat(item.id)}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="jx-cols">
            <aside className="jx-panel" aria-label="Filtrlar">
              <div className="jx-panel-hd">
                <h3>Filtrlar</h3>
                <button type="button" onClick={reset}>Tozalash</button>
              </div>
              <h4>Holati</h4>
              {jihozConds.map((item) => (
                <Check key={item.id} on={conds.includes(item.id)} label={condText(item.id)} count={countOf((row) => row.condition === item.id)} onClick={() => toggle(conds, item.id, setConds)} />
              ))}
              <h4>Brend</h4>
              {shownBrands.map((item) => (
                <Check key={item.id} on={brands.includes(item.id)} label={item.label} count={countOf((row) => row.brandKey === item.id)} onClick={() => toggle(brands, item.id, setBrands)} />
              ))}
              <button type="button" className="jx-more" onClick={() => setMoreBrands((open) => !open)}>{moreBrands ? "Yig‘ish" : "Barchasini ko‘rsatish"}</button>
              <h4>Narx oralig‘i</h4>
              <div className="jx-price">
                <label>
                  <input inputMode="numeric" aria-label="Narx: dan (so‘m)" value={somPlain(price[0])} onChange={(event) => setPriceAt(0, event.target.value)} />
                  <span>so‘m</span>
                </label>
                <i>–</i>
                <label>
                  <input inputMode="numeric" aria-label="Narx: gacha (so‘m)" value={somPlain(price[1])} onChange={(event) => setPriceAt(1, event.target.value)} />
                </label>
              </div>
              <h4>Kafolat muddati</h4>
              {jihozWarranties.map((months) => (
                <Check key={months} on={warranties.includes(months)} label={`${months} oy`} count={countOf((row) => row.warranty === months)} onClick={() => toggle(warranties, months, setWarranties)} />
              ))}
              <div className="jx-switches">
                <Switch label="Lizing mavjud" on={leasing} onClick={() => setLeasing((v) => !v)} />
                <Switch label="O‘rnatish xizmati" on={install} onClick={() => setInstall((v) => !v)} />
                <Switch label="Rasmiy distribyutor" on={official} onClick={() => setOfficial((v) => !v)} />
              </div>
              <h4>Shahar tanlash</h4>
              <select className="jx-select" value={city} aria-label="Shahar" onChange={(event) => setCity(event.target.value)}>
                <option>Barchasi</option>
                {cities.map((name) => <option key={name}>{name}</option>)}
              </select>
            </aside>

            <div className="jx-list">
              <div className="jx-tools">
                <select className="jx-sort" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as SortId)}>
                  {sorts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                <span className="jx-count">{items.length} ta mahsulot</span>
                <div className="jx-view">
                  <button type="button" className={list ? "" : "on"} aria-label="Katak" aria-pressed={!list} onClick={() => setList(false)}><LayoutGrid className="i" /></button>
                  <button type="button" className={list ? "on" : ""} aria-label="Ro‘yxat" aria-pressed={list} onClick={() => setList(true)}><List className="i" /></button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="jx-empty">
                  <b>{!ready ? "Yuklanmoqda..." : source.length === 0 ? "Hozircha jihoz yo‘q" : "Mos jihoz topilmadi"}</b>
                  <p>{source.length === 0 ? "Tasdiqlangan do‘kon Jihozlar toifasida mahsulot qo‘shganda shu yerda chiqadi." : "Filtrlarni o‘zgartirib ko‘ring."}</p>
                  <button type="button" onClick={reset}>Filtrlarni tozalash</button>
                </div>
              ) : (
                <div className={list ? "jx-grid list" : "jx-grid"}>
                  {items.map((item) => {
                    const fav = favs.includes(item.slug);
                    const cmp = compare.includes(item.slug);
                    return (
                      <article className="jx-card" key={item.slug} data-testid="jihoz-card">
                        <div className="ph">
                          <span className={`jx-badge ${item.condition}`}>{condText(item.condition)}</span>
                          <button type="button" className={fav ? "jx-heart on" : "jx-heart"} aria-pressed={fav} aria-label={fav ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"} onClick={() => shopToggleFav(item.slug)}><Heart className="i" /></button>
                          <button type="button" className={cmp ? "jx-cmp on" : "jx-cmp"} aria-pressed={cmp} aria-label={cmp ? "Solishtirishdan olib tashlash" : "Solishtirishga qo‘shish"} title="Solishtirish" onClick={() => toggleCompare(item.slug)}><Scale className="i" /></button>
                          <Link href={`/jihozlar/${item.slug}`} aria-label={item.name}><img src={item.image} alt="" loading="lazy" /></Link>
                        </div>
                        <div className="bd">
                          <span className={`jx-mark ${item.brandKey}`}>{brandMark[item.brandKey] ?? item.brand}</span>
                          <h3><Link href={`/jihozlar/${item.slug}`}>{item.name}</Link></h3>
                          <p className="kind">{cardKind[item.cat]}</p>
                          <ul className="jx-dots">
                            <li>{item.year} yil</li>
                            <li>Kafolat: {item.warranty} oy</li>
                            <li>{item.spec}</li>
                          </ul>
                          <strong className="jx-sum">{som(item.price)}</strong>
                          {item.months > 0 ? <p className="jx-month"><CalendarClock className="i" /> {item.months} oyga {somPlain(item.monthly)} so‘m/oy</p> : null}
                          <div className="jx-acts">
                            <button type="button" className="jx-add" aria-label={`${item.name} — savatga qo‘shish`} onClick={() => addCart(item)}><ShoppingCart className="i" /> Savatga</button>
                            <button type="button" className="jx-ghost" onClick={() => setOffer(item)}>Taklif so‘rash</button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="jx-rail">
          <Link href="/marketplace/sotuvchi" className="jx-sell" data-testid="jihoz-sell">
            <Plus className="i" /> Jihoz sotish
          </Link>

          <section className="jx-box">
            <div className="jx-box-hd">
              <h3>Jihozlarni solishtirish ({compared.length})</h3>
              <button type="button" onClick={() => setCompare([])}>Barchasini tozalash</button>
            </div>
            {compared.length === 0 ? <p className="jx-muted">Kartochkadagi <Scale className="i" /> belgisini bosib, 3 tagacha jihozni solishtiring.</p> : null}
            {compared.map((item) => (
              <div className="jx-cmp-row" key={item.slug}>
                <img src={item.image} alt="" />
                <div>
                  <b>{item.name.replace(/^Dentsply /, "")}</b>
                  <span>{cardKind[item.cat]}</span>
                  <strong>{som(item.price)}</strong>
                </div>
                <button type="button" className="x" aria-label={`${item.name}ni olib tashlash`} onClick={() => toggleCompare(item.slug)}><X className="i" /></button>
              </div>
            ))}
            <button type="button" className="jx-wide" disabled={compared.length < 2} onClick={() => setTable(true)}>Solishtirish <ArrowRight className="i" /></button>
          </section>

          <section className="jx-box jx-consult">
            <div className="txt">
              <h3>Bepul konsultatsiya</h3>
              <p>Jihoz tanlashda yordam beramiz</p>
              <ul>
                <li><CheckCircle2 className="i" /> Mutaxassis maslahati</li>
                <li><CheckCircle2 className="i" /> Lizing va to‘lov variantlari</li>
                <li><CheckCircle2 className="i" /> Klinikangizga mos yechim</li>
              </ul>
            </div>
            <img src="/img/jihoz/d-consult.jpg" alt="" />
            <button type="button" className="jx-dark" onClick={() => setConsult(true)}>Muhandis bilan bog‘lanish <ArrowRight className="i" /></button>
          </section>

          <section className="jx-box">
            <h3 className="jx-why-title">Nega StomaHub?</h3>
            <ul className="jx-why">
              <li><span className="ic"><BadgeCheck className="i" /></span><span><b>Rasmiy distribyutorlar</b><small>Original mahsulotlar</small></span></li>
              <li><span className="ic"><ShieldCheck className="i" /></span><span><b>Kafolat va servis</b><small>Butun O‘zbekiston bo‘ylab</small></span></li>
              <li><span className="ic"><Wallet className="i" /></span><span><b>Lizing / bo‘lib to‘lash</b><small>Qulay to‘lov shartlari</small></span></li>
              <li><span className="ic"><Wrench className="i" /></span><span><b>O‘rnatish va trening</b><small>Mutaxassislar tomonidan</small></span></li>
              <li><span className="ic"><Headphones className="i" /></span><span><b>Texnik qo‘llab-quvvatlash</b><small>24/7 maslahat</small></span></li>
            </ul>
          </section>
        </aside>

        {offer || consult ? (
          <RequestModal
            title={offer ? "Taklif so‘rash" : "Muhandis bilan bog‘lanish"}
            subject={offer ? offer.name : "Jihoz tanlash bo‘yicha konsultatsiya"}
            onClose={() => {
              setOffer(null);
              setConsult(false);
            }}
            onSent={(text) => setNote(text)}
          />
        ) : null}

        {table ? (
          <div className="jx-modal" role="dialog" aria-modal="true" aria-label="Solishtirish" onMouseDown={(event) => event.target === event.currentTarget && setTable(false)}>
            <div className="jx-dialog wide">
              <h3>Jihozlarni solishtirish</h3>
              <table className="jx-table">
                <thead><tr><th />{compared.map((item) => <th key={item.slug}><img src={item.image} alt="" />{item.name}</th>)}</tr></thead>
                <tbody>
                  <tr><td>Narx</td>{compared.map((item) => <td key={item.slug}><b>{som(item.price)}</b></td>)}</tr>
                  <tr><td>Kategoriya</td>{compared.map((item) => <td key={item.slug}>{catLabel(item.cat)}</td>)}</tr>
                  <tr><td>Holati</td>{compared.map((item) => <td key={item.slug}>{condText(item.condition)}</td>)}</tr>
                  <tr><td>Yil</td>{compared.map((item) => <td key={item.slug}>{item.year}</td>)}</tr>
                  <tr><td>Kafolat</td>{compared.map((item) => <td key={item.slug}>{item.warranty} oy</td>)}</tr>
                  <tr><td>Bo‘lib to‘lash</td>{compared.map((item) => <td key={item.slug}>{item.months} oy × {somPlain(item.monthly)}</td>)}</tr>
                  <tr><td>O‘rnatish</td>{compared.map((item) => <td key={item.slug}>{item.install ? "Bor" : "Yo‘q"}</td>)}</tr>
                  <tr><td>Rasmiy distribyutor</td>{compared.map((item) => <td key={item.slug}>{item.official ? "Ha" : "Yo‘q"}</td>)}</tr>
                </tbody>
              </table>
              <div className="acts"><button type="button" className="jx-ghost" onClick={() => setTable(false)}>Yopish</button></div>
            </div>
          </div>
        ) : null}
        {note ? <p className="jx-toast" role="status" onAnimationEnd={() => setNote("")}>{note}</p> : null}
      </div>
    </ShopShell>
  );
}

function Check({ on, label, count, onClick }: { on: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button type="button" className={on ? "jx-check on" : "jx-check"} aria-pressed={on} onClick={onClick}>
      <i className="cb" aria-hidden />
      <span>{label}</span>
      <em>({count})</em>
    </button>
  );
}

function Switch({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={on ? "jx-switch on" : "jx-switch"} onClick={onClick}>
      <span>{label}</span>
      <i aria-hidden />
    </button>
  );
}

/**
 * Request form (offer / consultation). There is no equipment-sales backend yet, so the form says so
 * plainly instead of pretending the request reached a seller.
 */
export function RequestModal({ title, subject, onClose, onSent }: { title: string; subject: string; onClose: () => void; onSent: (text: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="jx-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form
        className="jx-dialog"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || phone.replace(/\D/g, "").length < 9) {
            setError("Ism va telefon raqamini to‘liq kiriting.");
            return;
          }
          onSent("Namuna: so‘rovlar hali sotuvchiga yuborilmaydi — bu funksiya tez orada ishga tushadi.");
          onClose();
        }}
      >
        <h3>{title}</h3>
        <p className="sub">{subject}</p>
        <label>Ism<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ism Familiya" /></label>
        <label>Telefon<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+998 90 123 45 67" inputMode="tel" /></label>
        <label>Izoh (ixtiyoriy)<textarea rows={3} value={text} onChange={(event) => setText(event.target.value)} /></label>
        {error ? <p className="err">{error}</p> : null}
        <p className="hint">Hozircha namuna rejimi: so‘rov sotuvchiga yuborilmaydi.</p>
        <div className="acts">
          <button type="submit" className="jx-add">Yuborish</button>
          <button type="button" className="jx-ghost" onClick={onClose}>Bekor qilish</button>
        </div>
      </form>
    </div>
  );
}
