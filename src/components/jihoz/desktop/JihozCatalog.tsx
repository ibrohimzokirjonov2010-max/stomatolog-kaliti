"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Check, Grid3x3, Heart, List, Scale, ShieldCheck, ShoppingCart, Wallet, Wrench, X } from "lucide-react";
import { RangeSlider } from "@/components/shop/desktop/parts";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, shopToggleFav, som, somPlain, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  JIZOZ_PRICE_MAX,
  catLabel,
  desktopJihoz,
  jihozBrands,
  jihozCats,
  jihozCities,
  jihozConds,
  jihozWarranties,
  type DesktopJihoz,
  type JihozCat,
  type JihozCond,
} from "@/data/desktop-jihozlar";
import "./jihoz.css";

const sorts = [
  { id: "pop", label: "Eng mashhur" },
  { id: "cheap", label: "Narxi: arzon → qimmat" },
  { id: "rich", label: "Narxi: qimmat → arzon" },
  { id: "new", label: "Yangi mahsulotlar" },
  { id: "rate", label: "Reyting" },
] as const;

type SortId = (typeof sorts)[number]["id"];

function condText(id: JihozCond) {
  return jihozConds.find((item) => item.id === id)?.label ?? id;
}

export function JihozCatalog() {
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [cat, setCat] = useState<"all" | JihozCat>("all");
  const [conds, setConds] = useState<JihozCond[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [moreBrands, setMoreBrands] = useState(false);
  const [price, setPrice] = useState<[number, number]>([0, JIZOZ_PRICE_MAX]);
  const [warranties, setWarranties] = useState<number[]>([]);
  const [leasing, setLeasing] = useState(false);
  const [install, setInstall] = useState(false);
  const [official, setOfficial] = useState(false);
  const [city, setCity] = useState("Barchasi");
  const [sort, setSort] = useState<SortId>("pop");
  const [list, setList] = useState(false);
  const [compare, setCompare] = useState<string[]>(["sirona-intego", "planmeca-promax"]);
  const [note, setNote] = useState("");
  const [sell, setSell] = useState(false);
  const [offer, setOffer] = useState<DesktopJihoz | null>(null);
  const [table, setTable] = useState(false);
  const [sellForm, setSellForm] = useState({ name: "", phone: "", text: "" });

  const priceOn = price[0] > 0 || price[1] < JIZOZ_PRICE_MAX;
  const shownBrands = moreBrands ? jihozBrands : jihozBrands.slice(0, 8);

  function countOf(pred: (item: DesktopJihoz) => boolean) {
    return desktopJihoz.filter(pred).length;
  }

  const items = useMemo(() => {
    let rows = desktopJihoz.filter((item) => {
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
    rows = [...rows].sort((a, b) => {
      if (sort === "cheap") return a.price - b.price;
      if (sort === "rich") return b.price - a.price;
      if (sort === "new") return b.year - a.year || b.popularity - a.popularity;
      if (sort === "rate") return b.rating - a.rating;
      return b.popularity - a.popularity;
    });
    return rows;
  }, [brands, cat, city, conds, install, leasing, official, price, priceOn, q, sort, warranties]);

  function toggle<T>(list: T[], value: T, set: (next: T[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
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
    shopAdd({ id: `jihoz-${item.slug}`, name: item.name, price: item.price, image: item.image, href: `/jihozlar/${item.slug}` });
    setNote(`${item.name} savatga qo‘shildi`);
  }

  function toggleCompare(slug: string) {
    setCompare((current) => {
      if (current.includes(slug)) return current.filter((id) => id !== slug);
      if (current.length >= 3) return current;
      return [...current, slug];
    });
  }

  const compared = compare.map((slug) => desktopJihoz.find((item) => item.slug === slug)).filter((item): item is DesktopJihoz => Boolean(item));

  return (
    <ShopShell searchPath="/jihozlar" cartCount={cartCount} placeholder="Stomatologik jihozlar, brend yoki model qidiring..." showCamera={false}>
      <div className="jz-page">
        <div className="jz-head">
          <div>
            <h1>Stomatologik jihozlar</h1>
            <p>Klinikangiz uchun zamonaviy va ishonchli uskunalar. Yangi va ishlatilgan, kafolat va servis bilan.</p>
          </div>
          <div className="jz-trust">
            <span><BadgeCheck className="i" /> Rasmiy distribyutor</span>
            <span><ShieldCheck className="i" /> Kafolat va servis</span>
            <span><Wallet className="i" /> Lizing / bo‘lib to‘lash</span>
            <span><Wrench className="i" /> O‘rnatish xizmati</span>
          </div>
        </div>

        <div className="jz-tabs">
          {jihozCats.map((item) => (
            <button key={item.id} type="button" className={cat === item.id ? "jz-tab on" : "jz-tab"} onClick={() => setCat(item.id)}>{item.label}</button>
          ))}
        </div>

        <div className="jz-cols">
          <aside className="jz-panel">
            <h3>Filtrlar <button type="button" onClick={reset}>Tozalash</button></h3>
            <h4>Holati</h4>
            {jihozConds.map((item) => (
              <button key={item.id} type="button" className={conds.includes(item.id) ? "jz-check on" : "jz-check"} onClick={() => toggle(conds, item.id, setConds)}>
                <i className="jz-boxi">{conds.includes(item.id) ? <Check className="i" /> : null}</i>
                {item.label}
                <em>{countOf((row) => row.condition === item.id)}</em>
              </button>
            ))}
            <h4>Brend</h4>
            {shownBrands.map((item) => (
              <button key={item.id} type="button" className={brands.includes(item.id) ? "jz-check on" : "jz-check"} onClick={() => toggle(brands, item.id, setBrands)}>
                <i className="jz-boxi">{brands.includes(item.id) ? <Check className="i" /> : null}</i>
                {item.label}
                <em>{countOf((row) => row.brandKey === item.id)}</em>
              </button>
            ))}
            <button type="button" className="jz-link" onClick={() => setMoreBrands((open) => !open)}>{moreBrands ? "Yig‘ish" : "Barchasini ko‘rsatish"}</button>
            <h4>Narx oralig‘i</h4>
            <RangeSlider min={0} max={JIZOZ_PRICE_MAX} step={1_000_000} value={price} onChange={setPrice} labels={["0 so‘m", "500 000 000"]} />
            <h4>Kafolat muddati</h4>
            {jihozWarranties.map((months) => (
              <button key={months} type="button" className={warranties.includes(months) ? "jz-check on" : "jz-check"} onClick={() => toggle(warranties, months, setWarranties)}>
                <i className="jz-boxi">{warranties.includes(months) ? <Check className="i" /> : null}</i>
                {months} oy
                <em>{countOf((row) => row.warranty === months)}</em>
              </button>
            ))}
            <button type="button" className={leasing ? "jz-switch on" : "jz-switch"} onClick={() => setLeasing((v) => !v)}>Lizing mavjud <i /></button>
            <button type="button" className={install ? "jz-switch on" : "jz-switch"} onClick={() => setInstall((v) => !v)}>O‘rnatish xizmati <i /></button>
            <button type="button" className={official ? "jz-switch on" : "jz-switch"} onClick={() => setOfficial((v) => !v)}>Rasmiy distribyutor <i /></button>
            <h4>Shahar tanlash</h4>
            <select className="jz-select" value={city} aria-label="Shahar" onChange={(event) => setCity(event.target.value)}>
              <option>Barchasi</option>
              {jihozCities.map((name) => <option key={name}>{name}</option>)}
            </select>
          </aside>

          <div>
            <div className="jz-tools">
              {sorts.map((item) => (
                <button key={item.id} type="button" className={sort === item.id ? "jz-sort on" : "jz-sort"} onClick={() => setSort(item.id)}>{item.label}</button>
              ))}
              <span className="jz-count">{items.length} ta mahsulot</span>
              <div className="jz-view">
                <button type="button" className={list ? "" : "on"} aria-label="Katak" onClick={() => setList(false)}><Grid3x3 className="i" /></button>
                <button type="button" className={list ? "on" : ""} aria-label="Ro‘yxat" onClick={() => setList(true)}><List className="i" /></button>
              </div>
            </div>
            <div className={list ? "jz-grid list" : "jz-grid"} style={{ marginTop: "calc(.45 * var(--u))" }}>
              {items.map((item) => (
                <article className="jz-card" key={item.slug}>
                  <div className="ph">
                    <span className={item.condition === "ishlatilgan" ? "jz-badge used" : item.condition === "korgazma" ? "jz-badge demo" : "jz-badge"}>{condText(item.condition)}</span>
                    <button type="button" className={compare.includes(item.slug) ? "jz-cmp on" : "jz-cmp"} aria-label="Solishtirishga qo‘shish" onClick={() => toggleCompare(item.slug)}><Scale className="i" /></button>
                    <button type="button" className={favs.includes(item.slug) ? "jz-heart on" : "jz-heart"} aria-label="Sevimli" onClick={() => shopToggleFav(item.slug)}><Heart className="i" /></button>
                    <img src={item.image} alt="" />
                  </div>
                  <div className="bd">
                    <span className="jz-brand">{item.brand}</span>
                    <h3><Link href={`/jihozlar/${item.slug}`}>{item.name}</Link></h3>
                    <p className="jz-meta">{catLabel(item.cat)}</p>
                    <p className="jz-meta">{item.year} yil</p>
                    <p className="jz-meta">Kafolat: {item.warranty} oy</p>
                    <p className="jz-spec">{item.spec}</p>
                    <strong className="jz-price">{som(item.price)}</strong>
                    <p className="jz-month">{item.months} oyga {somPlain(item.monthly)} so‘m/oy</p>
                    <div className="jz-acts">
                      <button type="button" className="jz-add" onClick={() => addCart(item)}><ShoppingCart className="i" /> Savatga</button>
                      <button type="button" className="jz-ghost" onClick={() => setOffer(item)}>Taklif so‘rash</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {note ? <p className="jz-note">{note}</p> : null}
          </div>

          <aside className="jz-rail">
            <button type="button" className="jz-sell" onClick={() => setSell(true)}>Jihoz sotish</button>
            <section className="jz-box">
              <h3>Jihozlarni solishtirish ({compared.length}) <button type="button" onClick={() => setCompare([])}>Barchasini tozalash</button></h3>
              {compared.map((item) => (
                <div className="jz-cmp-row" key={item.slug}>
                  <img src={item.image} alt="" />
                  <div>
                    <b>{item.name}</b>
                    <span>{catLabel(item.cat)}</span>
                    <span> · {som(item.price)}</span>
                  </div>
                  <button type="button" className="jz-x" aria-label={`${item.name} ni olib tashlash`} onClick={() => toggleCompare(item.slug)}><X className="i" /></button>
                </div>
              ))}
              <button type="button" className="jz-add" style={{ width: "100%", marginTop: "calc(.4 * var(--u))" }} disabled={compared.length < 2} onClick={() => setTable(true)}>Solishtirish</button>
            </section>
            <section className="jz-box jz-consult">
              <h3>Bepul konsultatsiya</h3>
              <div className="who">
                <img src="/img/jobs/doctor.jpg" alt="" />
                <p className="jz-spec">Jihoz tanlashda yordam beramiz. O‘rnatish maslahati, lizing va to‘lov variantlari, klinikangizga mos yechim.</p>
              </div>
              <button type="button" className="jz-add" style={{ width: "100%", marginTop: "calc(.4 * var(--u))" }} onClick={() => setNote("Muhandis tez orada bog‘lanadi.")}>Muhandis bilan bog‘lanish →</button>
            </section>
            <section className="jz-box">
              <h3>Nega StomaHub?</h3>
              {[
                ["Rasmiy distribyutorlar", "Original mahsulotlar"],
                ["Kafolat va servis", "Butun O‘zbekiston bo‘ylab"],
                ["Lizing / bo‘lib to‘lash", "Qulay to‘lov shartlari"],
                ["O‘rnatish va trening", "Mutaxassislar tomonidan"],
                ["Texnik qo‘llab-quvvatlash", "24/7 maslahat"],
              ].map(([title, text]) => (
                <div className="jz-why" key={title}><ShieldCheck className="i" /><div><b>{title}</b><span>{text}</span></div></div>
              ))}
            </section>
          </aside>
        </div>
      </div>

      {sell ? (
        <div className="jz-modal" onClick={() => setSell(false)}>
          <div className="jz-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Jihoz sotish</h3>
            <label>Ism<input value={sellForm.name} onChange={(event) => setSellForm({ ...sellForm, name: event.target.value })} /></label>
            <label>Telefon<input value={sellForm.phone} onChange={(event) => setSellForm({ ...sellForm, phone: event.target.value })} /></label>
            <label>Jihoz haqida<textarea rows={3} value={sellForm.text} onChange={(event) => setSellForm({ ...sellForm, text: event.target.value })} /></label>
            <div className="acts">
              <button type="button" className="jz-add" onClick={() => { setSell(false); setNote("Sotish so‘rovi qabul qilindi."); }}>Yuborish</button>
              <button type="button" className="jz-ghost" onClick={() => setSell(false)}>Bekor qilish</button>
            </div>
          </div>
        </div>
      ) : null}

      {offer ? (
        <div className="jz-modal" onClick={() => setOffer(null)}>
          <div className="jz-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Taklif so‘rash</h3>
            <p>{offer.name}</p>
            <label>Ism<input /></label>
            <label>Telefon<input /></label>
            <div className="acts">
              <button type="button" className="jz-add" onClick={() => { setNote(`${offer.name} uchun taklif so‘rovi yuborildi.`); setOffer(null); }}>Yuborish</button>
              <button type="button" className="jz-ghost" onClick={() => setOffer(null)}>Bekor qilish</button>
            </div>
          </div>
        </div>
      ) : null}

      {table ? (
        <div className="jz-modal" onClick={() => setTable(false)}>
          <div className="jz-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Solishtirish</h3>
            <table className="jz-table">
              <thead><tr><th>Jihoz</th>{compared.map((item) => <th key={item.slug}>{item.name}</th>)}</tr></thead>
              <tbody>
                <tr><td>Narx</td>{compared.map((item) => <td key={item.slug}>{som(item.price)}</td>)}</tr>
                <tr><td>Yil</td>{compared.map((item) => <td key={item.slug}>{item.year}</td>)}</tr>
                <tr><td>Kafolat</td>{compared.map((item) => <td key={item.slug}>{item.warranty} oy</td>)}</tr>
                <tr><td>Bo‘lib to‘lash</td>{compared.map((item) => <td key={item.slug}>{item.months} oyga {somPlain(item.monthly)}</td>)}</tr>
              </tbody>
            </table>
            <div className="acts"><button type="button" className="jz-ghost" onClick={() => setTable(false)}>Yopish</button></div>
          </div>
        </div>
      ) : null}
    </ShopShell>
  );
}
