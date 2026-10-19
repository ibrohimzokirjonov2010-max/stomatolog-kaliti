"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Eye,
  Filter,
  Handshake,
  Heart,
  House,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  ShoppingBag,
  Wrench,
  X,
} from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { getListing, seedListings, type Listing, type ListingType } from "@/data/listings";
import { serviceLabels, type Master } from "@/data/masters";
import { placeholderImage, surplusCategoryLabel } from "@/data/surplus";
import { site } from "@/data/site";
import type { DbJob } from "@/lib/jobs-work";
import type { DbSurplus } from "@/lib/surplus-work";
import { api } from "@/lib/work-client";
import "./listings.css";

const SAVED = "sk-elon-saved-v1";

/** One card on the board: a real record from another section, or a design sample. */
export type Ad = {
  id: string;
  type: ListingType;
  title: string;
  city: string;
  date: string;
  price: number | null;
  priceLabel: string;
  image: string | null;
  category: string;
  href: string;
  real: boolean;
  views?: number;
  likes?: number;
  source?: string;
};

const TYPES: { id: ListingType | ""; label: string; icon: ReactNode }[] = [
  { id: "", label: "Barcha e’lonlar", icon: <LayoutGrid className="i" /> },
  { id: "sotiladi", label: "Sotiladi", icon: <ShoppingBag className="i" /> },
  { id: "ijara", label: "Ijaraga", icon: <House className="i" /> },
  { id: "ish", label: "Ish o‘rni", icon: <BriefcaseBusiness className="i" /> },
  { id: "xizmat", label: "Xizmatlar", icon: <Wrench className="i" /> },
  { id: "hamkor", label: "Hamkorlik", icon: <Handshake className="i" /> },
];

const FLAG: Record<ListingType, string> = { sotiladi: "Sotiladi", ijara: "Ijaraga", ish: "Ish o‘rni", xizmat: "Xizmatlar", hamkor: "Hamkorlik" };

const PRICES = [
  { id: "", label: "Narx (so‘m)" },
  { id: "deal", label: "Kelishiladi" },
  { id: "lt1", label: "1 mln gacha" },
  { id: "1-10", label: "1 – 10 mln" },
  { id: "10-30", label: "10 – 30 mln" },
  { id: "gt30", label: "30 mln dan yuqori" },
];

function fits(price: number | null, range: string) {
  if (!range) return true;
  if (range === "deal") return price === null;
  if (price === null) return false;
  if (range === "lt1") return price < 1_000_000;
  if (range === "1-10") return price >= 1_000_000 && price <= 10_000_000;
  if (range === "10-30") return price > 10_000_000 && price <= 30_000_000;
  return price > 30_000_000;
}

function sum(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU").replace(/ |,/g, " ")} so‘m`;
}

function mln(value: number) {
  const m = value / 1_000_000;
  return Number.isInteger(m) ? String(m) : m.toFixed(1).replace(".", ",");
}

export function dateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function fromSample(item: Listing): Ad {
  return { id: item.id, type: item.type, title: item.title, city: item.city, date: item.date, price: item.price, priceLabel: item.priceLabel, image: item.image, category: item.category, href: `/elonlar/${item.id}`, real: false, views: item.views, likes: item.likes };
}

function fromSurplus(d: DbSurplus): Ad {
  return {
    id: `s-${d.id}`,
    type: "sotiladi",
    title: d.name,
    city: d.city,
    date: d.createdAt,
    price: d.price,
    priceLabel: sum(d.price),
    image: d.images?.[0] ?? d.image ?? placeholderImage(d.category),
    category: "Materiallar",
    href: `/ortiqcha-material/${d.id}`,
    real: true,
    source: surplusCategoryLabel(d.category) || "Ortiqcha material",
  };
}

function fromJob(d: DbJob): Ad {
  const lo = d.salaryMin ?? null;
  const hi = d.salaryMax ?? null;
  const priceLabel = lo && hi ? `${mln(lo)} – ${mln(hi)} mln so‘m` : lo ? `${mln(lo)} mln so‘m dan` : hi ? `${mln(hi)} mln so‘m gacha` : "Kelishiladi";
  return {
    id: `j-${d.id}`,
    type: "ish",
    title: d.title,
    city: d.city,
    date: d.createdAt,
    price: lo ?? hi,
    priceLabel,
    image: d.photos?.[0] ?? null,
    category: "Ish",
    href: `/ishlar/${d.id}`,
    real: true,
    source: d.clinic,
  };
}

function fromMaster(m: Master): Ad {
  return {
    id: `m-${m.id}`,
    type: "xizmat",
    title: m.title || m.name,
    city: m.city,
    date: m.createdAt ?? "",
    price: null,
    priceLabel: "Kelishiladi",
    image: m.works?.[0] ?? m.photo ?? null,
    category: "Usta xizmati",
    href: `/ustalar/${m.id}`,
    real: true,
    source: m.services.map((s) => serviceLabels[s]).filter(Boolean).slice(0, 2).join(", ") || m.name,
  };
}

/** Real records from the surplus, jobs and masters backends (moderated feeds only). */
function useRealAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    void Promise.all([
      api<{ listings: DbSurplus[] }>("/api/work/surplus"),
      api<{ jobs: DbJob[] }>("/api/work/jobs"),
      api<{ masters: Master[] }>("/api/work/masters"),
    ]).then(([s, j, m]) => {
      if (!live) return;
      const next: Ad[] = [];
      if (s.ok) next.push(...(s.data.listings ?? []).filter((d) => d.status === "published").map(fromSurplus));
      if (j.ok) next.push(...(j.data.jobs ?? []).filter((d) => d.status === "published").map(fromJob));
      if (m.ok) next.push(...(m.data.masters ?? []).map(fromMaster));
      next.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setAds(next);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);
  return { ads, ready };
}

function useSaved() {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED);
      if (raw) setSaved(JSON.parse(raw) as string[]);
    } catch {
      /* storage unavailable */
    }
  }, []);
  function toggle(id: string) {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        window.localStorage.setItem(SAVED, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }
  return { saved, toggle };
}

export function ListingsDesktop() {
  const params = useSearchParams();
  const cartCount = useShopLineCount();
  const { ads: real } = useRealAds();
  const { saved, toggle } = useSaved();
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const [type, setType] = useState<ListingType | "">(() => (params.get("tur") as ListingType | null) ?? "");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState("yangi");
  const [onlySaved, setOnlySaved] = useState(false);
  const [onlyReal, setOnlyReal] = useState(false);
  const [filters, setFilters] = useState(false);
  const [allCities, setAllCities] = useState(false);
  const [post, setPost] = useState(params.get("joylash") === "1");

  useEffect(() => {
    const next = params.get("q");
    if (next !== null) setQ(next);
  }, [params]);

  const all = useMemo(() => [...real, ...seedListings.map(fromSample)], [real]);
  const categories = useMemo(() => [...new Set(all.map((item) => item.category))], [all]);
  const cityCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of all) if (item.city) map.set(item.city, (map.get(item.city) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [all]);

  const base = useMemo(
    () =>
      all.filter((item) => {
        if (category && item.category !== category) return false;
        if (city && item.city !== city) return false;
        if (!fits(item.price, price)) return false;
        if (onlySaved && !saved.includes(item.id)) return false;
        if (onlyReal && !item.real) return false;
        const needle = q.trim().toLowerCase();
        if (needle && !`${item.title} ${item.city} ${item.category} ${item.source ?? ""}`.toLowerCase().includes(needle)) return false;
        return true;
      }),
    [all, category, city, onlyReal, onlySaved, price, q, saved],
  );
  const items = useMemo(() => {
    const next = base.filter((item) => !type || item.type === type);
    if (sort === "arzon") next.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    else if (sort === "qimmat") next.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    else next.sort((a, b) => Number(b.real) - Number(a.real) || (b.date || "").localeCompare(a.date || ""));
    return next;
  }, [base, sort, type]);
  const count = (id: ListingType | "") => base.filter((item) => !id || item.type === id).length;
  const extraFilters = Number(onlySaved) + Number(onlyReal) + Number(sort !== "yangi");
  const dirty = Boolean(q || type || category || city || price || extraFilters);

  function reset() {
    setQ("");
    setType("");
    setCategory("");
    setCity("");
    setPrice("");
    setSort("yangi");
    setOnlySaved(false);
    setOnlyReal(false);
  }

  return (
    <ShopShell searchPath="/elonlar" cartCount={cartCount} placeholder="E’lonlar bo‘yicha qidirish..." showCamera={false}>
      <div className="el2" data-testid="listings-desktop">
        <div className="el2-head">
          <div>
            <h1>E’lonlar</h1>
            <p>Stomatologiya sohasidagi e’lonlar: sotiladi, ijaraga, ish o‘rni va boshqalar</p>
          </div>
          <button type="button" className="el2-add" data-testid="listing-add" onClick={() => setPost(true)}>
            <Plus className="i" /> E’lon joylashtirish
          </button>
        </div>

        <div className="el2-layout">
          <div className="el2-main">
            <div className="el2-tiles">
              {TYPES.map((item) => (
                <button key={item.label} type="button" className={`t-${item.id || "all"}${type === item.id ? " on" : ""}`} aria-pressed={type === item.id} data-testid={`listing-type-${item.id || "all"}`} onClick={() => setType(item.id)}>
                  {item.icon}
                  <span>{item.label}</span>
                  <b>{count(item.id)}</b>
                </button>
              ))}
            </div>

            <div className="el2-tools">
              <label className="el2-search">
                <Search className="i" />
                <input data-testid="listing-search" aria-label="E’lon qidirish" value={q} placeholder="Kalit so‘z bo‘yicha qidirish..." onChange={(event) => setQ(event.target.value)} />
                {q ? <button type="button" aria-label="Tozalash" onClick={() => setQ("")}><X className="i" /></button> : null}
              </label>
              <Select testId="listing-category" label="Toifa" value={category} onChange={setCategory} options={[{ id: "", label: "Barcha toifalar" }, ...categories.map((c) => ({ id: c, label: c }))]} />
              <Select testId="listing-city" label="Shahar" value={city} onChange={setCity} options={[{ id: "", label: "Barcha shaharlar" }, ...cityCounts.map(([c]) => ({ id: c, label: c }))]} />
              <Select testId="listing-price" label="Narx" value={price} onChange={setPrice} options={PRICES} />
              <div className="el2-fwrap">
                <button type="button" className={`el2-fbtn${filters || extraFilters ? " on" : ""}`} data-testid="listing-filters" aria-expanded={filters} onClick={() => setFilters((v) => !v)}>
                  <Filter className="i" /> Filtrlar{extraFilters ? <em>{extraFilters}</em> : null}
                </button>
                {filters ? (
                  <div className="el2-pop" data-testid="listing-filter-pop">
                    <b>Saralash</b>
                    {[
                      ["yangi", "Avval yangilari"],
                      ["arzon", "Avval arzonlari"],
                      ["qimmat", "Avval qimmatlari"],
                    ].map(([id, label]) => (
                      <label key={id} className="opt">
                        <input type="radio" name="el2-sort" checked={sort === id} onChange={() => setSort(id)} /> {label}
                      </label>
                    ))}
                    <b>Ko‘rsatish</b>
                    <label className="opt"><input type="checkbox" data-testid="listing-only-saved" checked={onlySaved} onChange={(event) => setOnlySaved(event.target.checked)} /> Faqat saqlanganlar ({saved.length})</label>
                    <label className="opt"><input type="checkbox" data-testid="listing-only-real" checked={onlyReal} onChange={(event) => setOnlyReal(event.target.checked)} /> Faqat tasdiqlangan e’lonlar</label>
                    <div className="act">
                      <button type="button" onClick={reset} disabled={!dirty}>Tozalash</button>
                      <button type="button" className="go" onClick={() => setFilters(false)}>Tayyor</button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {items.length === 0 ? (
              <div className="el2-empty" data-testid="listing-empty">
                <b>E’lon topilmadi</b>
                <p>Filtrlarni o‘zgartirib ko‘ring yoki birinchi bo‘lib e’lon joylashtiring.</p>
                <div>
                  {dirty ? <button type="button" onClick={reset}>Filtrlarni tozalash</button> : null}
                  <button type="button" className="go" onClick={() => setPost(true)}>E’lon joylashtirish</button>
                </div>
              </div>
            ) : (
              <div className="el2-grid">
                {items.map((item) => (
                  <AdCard key={item.id} item={item} saved={saved.includes(item.id)} onSave={() => toggle(item.id)} />
                ))}
              </div>
            )}
          </div>

          <aside className="el2-rail">
            <section className="el2-box" data-testid="listing-cities">
              <h3>Ommabop shaharlar</h3>
              <div className="cities">
                {(allCities ? cityCounts : cityCounts.slice(0, 6)).map(([name, n]) => (
                  <button key={name} type="button" className={city === name ? "on" : undefined} aria-pressed={city === name} onClick={() => setCity(city === name ? "" : name)}>
                    <MapPin className="i" />
                    <span>{name}</span>
                    <b>{n}</b>
                  </button>
                ))}
              </div>
              <button type="button" className="more" data-testid="listing-all-cities" onClick={() => { setCity(""); setAllCities((v) => (city ? true : !v)); }}>
                {allCities && !city && cityCounts.length > 6 ? "Kamroq ko‘rsatish" : "Barcha shaharlar"} <ArrowRight className="i" />
              </button>
            </section>
            <section className="el2-box" data-testid="listing-latest">
              <div className="hd">
                <h3>So‘nggi e’lonlar</h3>
                <button type="button" onClick={reset}>Barchasi <ArrowRight className="i" /></button>
              </div>
              {all.slice(0, 4).map((item) => (
                <Link key={item.id} href={item.href} className="latest">
                  <Thumb item={item} />
                  <span>
                    <b>{item.title}</b>
                    <em>{item.priceLabel}</em>
                    <small>
                      <MapPin className="i" /> {item.city}
                      {item.date ? ` • ${dateLabel(item.date)}` : ""}
                    </small>
                  </span>
                </Link>
              ))}
            </section>
          </aside>
        </div>

        {post ? <PostDialog onClose={() => setPost(false)} /> : null}
      </div>
    </ShopShell>
  );
}

function Select({ value, onChange, options, label, testId }: { value: string; onChange: (value: string) => void; options: { id: string; label: string }[]; label: string; testId: string }) {
  return (
    <label className="el2-select">
      <select data-testid={testId} aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="i" />
    </label>
  );
}

function Thumb({ item }: { item: Ad }) {
  if (item.image) return <img src={item.image} alt="" />;
  return <i className={`ph t-${item.type}`}>{TYPES.find((t) => t.id === item.type)?.icon}</i>;
}

function AdCard({ item, saved, onSave }: { item: Ad; saved: boolean; onSave: () => void }) {
  return (
    <article className="el2-card" data-testid="listing-card" data-real={item.real ? "1" : undefined}>
      <div className="ph">
        <Link href={item.href} tabIndex={-1} aria-hidden="true">
          {item.image ? <img src={item.image} alt="" /> : <i className={`none t-${item.type}`}>{TYPES.find((t) => t.id === item.type)?.icon}</i>}
        </Link>
        <span className={`flag ${item.type}`}>{FLAG[item.type]}</span>
        <button type="button" className={`heart${saved ? " on" : ""}`} aria-label={saved ? "Saqlanganlardan olish" : "Saqlash"} aria-pressed={saved} data-testid={`listing-heart-${item.id}`} onClick={onSave}>
          <Heart className="i" />
        </button>
      </div>
      <h3><Link href={item.href}>{item.title}</Link></h3>
      <div className="meta">
        <span><MapPin className="i" /> {item.city || "—"}</span>
        {item.date ? <span><CalendarDays className="i" /> {dateLabel(item.date)}</span> : null}
      </div>
      <p className="price">{item.priceLabel}</p>
      <div className="foot">
        {item.real ? (
          <span className="src" title={item.source}>{item.source}</span>
        ) : (
          <>
            <span><Eye className="i" /> {item.views ?? 0}</span>
            <span><Heart className="i" /> {(item.likes ?? 0) + (saved ? 1 : 0)}</span>
          </>
        )}
      </div>
    </article>
  );
}

const POST_ROUTES: { type: ListingType; title: string; text: string; href?: string; mine?: string; mineLabel?: string }[] = [
  { type: "sotiladi", title: "Material yoki instrument sotish", text: "Ortiqcha material bo‘limida joylanadi, moderatsiyadan so‘ng shu yerda ko‘rinadi.", href: "/ortiqcha-material?joylash=1", mine: "/ortiqcha-material/elonlarim", mineLabel: "Mening e’lonlarim" },
  { type: "ish", title: "Vakansiya joylash", text: "Ishlar bo‘limida joylanadi, nomzodlar ariza yuboradi.", href: "/ishlar?joylash=vakansiya", mine: "/ishlar/vakansiyalarim", mineLabel: "Mening vakansiyalarim" },
  { type: "xizmat", title: "Usta xizmatini taklif qilish", text: "Ustalar bo‘limida profil ochasiz, shifokorlar so‘rov yuboradi.", href: "/ustalar/mening", mine: "/ustalar/mening", mineLabel: "Usta profilim" },
  { type: "ijara", title: "Ijara yoki jihoz sotish", text: "Bu turdagi e’lonlar hozircha sayt orqali qabul qilinmaydi. Ma’lumotni Telegram orqali yuboring — joylashga yordam beramiz." },
  { type: "hamkor", title: "Hamkorlik taklifi", text: "Hamkorlik takliflari hozircha Telegram orqali qabul qilinadi." },
];

function PostDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="E’lon joylashtirish" onClose={onClose}>
      <p className="lead">E’lon turini tanlang — har bir tur o‘z bo‘limida joylanadi va moderatsiyadan o‘tgach shu sahifada chiqadi.</p>
      <div className="el2-routes" data-testid="listing-post-routes">
        {POST_ROUTES.map((r) => (
          <div key={r.type} className="route">
            <i className={`t-${r.type}`}>{TYPES.find((t) => t.id === r.type)?.icon}</i>
            <span>
              <b>{r.title}</b>
              <small>{r.text}</small>
            </span>
            {r.href ? (
              <span className="btns">
                <Link className="go" href={r.href} data-testid={`listing-post-${r.type}`}>Joylash</Link>
                {r.mine ? <Link href={r.mine}>{r.mineLabel}</Link> : null}
              </span>
            ) : (
              <span className="btns">
                <a className="go" href={site.telegram} target="_blank" rel="noreferrer" data-testid={`listing-post-${r.type}`}>Telegram</a>
              </span>
            )}
          </div>
        ))}
      </div>
    </Dialog>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="el2-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="el2-dialog">
        <div className="hd">
          <h3>{title}</h3>
          <button type="button" aria-label="Yopish" onClick={onClose}><X className="i" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ListingDetailDesktop({ id }: { id: string }) {
  const cartCount = useShopLineCount();
  const { saved, toggle } = useSaved();
  const [post, setPost] = useState(false);
  const item = getListing(id);
  const similar = item ? seedListings.filter((row) => row.id !== item.id).sort((a, b) => Number(b.type === item.type) - Number(a.type === item.type)).slice(0, 4) : [];

  return (
    <ShopShell searchPath="/elonlar" cartCount={cartCount} placeholder="E’lonlar bo‘yicha qidirish..." showCamera={false}>
      <div className="el2" data-testid="listing-detail">
        <nav className="el2-crumbs" aria-label="Breadcrumb">
          <Link href="/">Bosh sahifa</Link> <span>›</span> <Link href="/elonlar">E’lonlar</Link> <span>›</span> <b>{item?.title ?? "Topilmadi"}</b>
        </nav>
        {!item ? (
          <div className="el2-empty" data-testid="listing-missing">
            <b>E’lon topilmadi</b>
            <p>E’lon o‘chirilgan yoki manzil noto‘g‘ri.</p>
            <div><Link className="go" href="/elonlar">E’lonlarga qaytish</Link></div>
          </div>
        ) : (
          <>
            <div className="el2-detail">
              <div className="el2-box media">
                <img src={item.image} alt="" />
                <span className={`flag ${item.type}`}>{FLAG[item.type]}</span>
              </div>
              <div className="el2-box info">
                <h1>{item.title}</h1>
                <p className="price">{item.priceLabel}</p>
                <div className="meta">
                  <span><MapPin className="i" /> {item.city}</span>
                  <span><CalendarDays className="i" /> {item.dateLabel}</span>
                  <span><Eye className="i" /> {item.views}</span>
                </div>
                <h4>Tavsif</h4>
                <p className="desc">{item.description}</p>
                <div className="note" data-testid="listing-sample-note">
                  <b>Namuna e’lon</b>
                  Bu e’lon bo‘lim qanday ko‘rinishini ko‘rsatish uchun qo‘yilgan, uning egasi va kontakti yo‘q. Haqiqiy e’lonlar egasi bilan to‘g‘ridan-to‘g‘ri bog‘lanish imkonini beradi.
                </div>
                <div className="btns">
                  <button type="button" className={`save${saved.includes(item.id) ? " on" : ""}`} data-testid="listing-detail-save" aria-pressed={saved.includes(item.id)} onClick={() => toggle(item.id)}>
                    <Heart className="i" /> {saved.includes(item.id) ? "Saqlangan" : "Saqlash"}
                  </button>
                  <button type="button" className="go" data-testid="listing-detail-post" onClick={() => setPost(true)}>
                    <Plus className="i" /> O‘z e’loningizni joylang
                  </button>
                </div>
                <Link href="/elonlar" className="back"><ArrowLeft className="i" /> Barcha e’lonlar</Link>
              </div>
            </div>
            {similar.length ? (
              <>
                <h2 className="el2-h2">O‘xshash e’lonlar</h2>
                <div className="el2-grid">
                  {similar.map((row) => (
                    <AdCard key={row.id} item={fromSample(row)} saved={saved.includes(row.id)} onSave={() => toggle(row.id)} />
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
        {post ? <PostDialog onClose={() => setPost(false)} /> : null}
      </div>
    </ShopShell>
  );
}
