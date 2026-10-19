"use client";
/* eslint-disable @next/next/no-img-element -- lab photos are sized by the design unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpDown, Bookmark, CalendarDays, ChevronDown, ChevronRight, CheckCircle2, Clock, FileText, FlaskConical, MapPin, Phone, Plus, Search, SlidersHorizontal, Star, Tag } from "lucide-react";
import { useLabWork } from "@/components/lab-provider";
import { MobileBrandBar } from "@/components/mobile/MobileBrandBar";
import { Modal, OrderForm } from "@/components/lab-browse";
import { labCover, labPlace, useSavedLabs } from "@/components/lab-ui";
import { labCities, labMaterialFilters, type Lab, type LabMaterial } from "@/data/labs";
import { labTiles, mobileLabSamples, type LabTile } from "@/data/mobile-labs";
import { site } from "@/data/site";
import { formatMoney } from "@/lib/format";
import "@/components/mobile/mobile-ui.css";
import "./lab-mobile.css";

type Row = {
  id: string;
  name: string;
  lab?: Lab;
  cover: string | null;
  thumbs: string[];
  prices: { title: string; price: number | null }[];
  rating: number;
  reviews: number;
  place: string;
  city: string;
  daysMin: number | null;
  daysMax: number | null;
  priceFrom: number | null;
  verified: boolean;
  top?: boolean;
  tiles: LabTile[];
  materials: LabMaterial[];
  rank: number;
  createdAt: number;
};

function fromLab(lab: Lab, index: number): Row {
  const items = lab.priceItems ?? [];
  const mins = items.map((i) => i.daysMin ?? i.daysMax).filter((x): x is number => x != null);
  const maxs = items.map((i) => i.daysMax ?? i.daysMin).filter((x): x is number => x != null);
  const tiles = new Set<LabTile>();
  for (const s of lab.services) if (s === "crown" || s === "veneer" || s === "implant" || s === "removable") tiles.add(s);
  if (lab.services.includes("bridge") || lab.services.includes("cadcam")) tiles.add("crown");
  if (items.some((i) => i.cat === "aligner")) tiles.add("aligner");
  const thumbs = (lab.portfolio?.length ? lab.portfolio : (lab.photos ?? []).slice(1)).filter(Boolean);
  return {
    id: lab.id,
    name: lab.name,
    lab,
    cover: labCover(lab),
    thumbs: thumbs.slice(0, 3),
    prices: items.slice(0, 3).map((i) => ({ title: i.title, price: i.price })),
    rating: 0,
    reviews: 0,
    place: labPlace(lab),
    city: lab.city,
    daysMin: mins.length ? Math.min(...mins) : lab.days,
    daysMax: maxs.length ? Math.max(...maxs) : lab.days,
    priceFrom: lab.priceFrom ?? (items.map((i) => i.price).filter((x): x is number => x != null).sort((a, b) => a - b)[0] ?? null),
    verified: Boolean(lab.verified),
    tiles: [...tiles],
    materials: lab.materials,
    rank: index,
    createdAt: lab.createdAt ? new Date(lab.createdAt).getTime() : 0,
  };
}

const samples: Row[] = mobileLabSamples.map((s) => ({
  id: s.id,
  name: s.name,
  cover: s.cover,
  thumbs: s.thumbs,
  prices: s.prices,
  rating: s.rating,
  reviews: s.reviews,
  place: s.place,
  city: s.city,
  daysMin: s.daysMin,
  daysMax: s.daysMax,
  priceFrom: Math.min(...s.prices.map((p) => p.price)),
  verified: false,
  top: s.top,
  tiles: s.tiles,
  materials: [],
  rank: 1000 + s.rank,
  createdAt: 0,
}));

function daysLabel(row: Row) {
  if (row.daysMin == null && row.daysMax == null) return null;
  if (row.daysMin != null && row.daysMax != null && row.daysMin !== row.daysMax) return `${row.daysMin}–${row.daysMax} kun`;
  return `${row.daysMin ?? row.daysMax} kun`;
}

/** Mobile Laboratoriya (design 97eca249): real labs first, design samples labelled "Namuna". */
export function LabMobileDesign() {
  const { labs, labsReady, orders } = useLabWork();
  const saved = useSavedLabs();
  const [query, setQuery] = useState("");
  const [tile, setTile] = useState<"" | LabTile>("");
  const [city, setCity] = useState("Toshkent");
  const [days, setDays] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [material, setMaterial] = useState<"" | LabMaterial>("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [filters, setFilters] = useState(false);
  const [order, setOrder] = useState<{ labId: string } | null>(null);
  const [sample, setSample] = useState(false);
  const activeOrders = orders.filter((o) => o.status !== "bekor").length;
  const orderable = labs.filter((l) => !l.mine);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cap = Number(maxPrice);
    const maxDays = Number(days);
    const all = [...labs.map(fromLab), ...samples];
    const rows = all.filter((row) => {
      if (tile && !row.tiles.includes(tile)) return false;
      if (city !== "all" && row.city !== city) return false;
      if (maxDays > 0 && !(row.daysMax != null && row.daysMax <= maxDays)) return false;
      if (cap > 0 && !(row.priceFrom != null && row.priceFrom <= cap)) return false;
      if (material && !row.materials.includes(material)) return false;
      if (onlySaved && !(row.lab && saved.has(row.id))) return false;
      if (!q) return true;
      return `${row.name} ${row.place} ${row.prices.map((p) => p.title).join(" ")}`.toLowerCase().includes(q);
    });
    const real = (r: Row) => Number(Boolean(r.lab));
    if (sort === "tez") rows.sort((a, b) => (a.daysMax ?? 999) - (b.daysMax ?? 999));
    else if (sort === "arzon") rows.sort((a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity));
    else if (sort === "yangi") rows.sort((a, b) => real(b) - real(a) || b.createdAt - a.createdAt);
    else rows.sort((a, b) => real(b) - real(a) || a.rank - b.rank);
    return rows;
  }, [city, days, labs, material, maxPrice, onlySaved, query, saved, sort, tile]);

  const extra = (material ? 1 : 0) + (onlySaved ? 1 : 0);

  function openOrder(row?: Row) {
    if (row && !row.lab) return setSample(true);
    setOrder({ labId: row?.id ?? "" });
  }

  return (
    <div className="lm lg:hidden" data-testid="lab-mobile">
      <div className="lm-body">
        <MobileBrandBar search />
        <div className="mb-head">
          <h1>Laboratoriya</h1>
          <p>Dental lab hamkorlari · crown, veneer, implant va protez</p>
        </div>
        {activeOrders ? (
          <Link href="/laboratoriya/buyurtmalarim" className="lm-orders" data-testid="lab-my-orders">
            <FileText /> Mening lab buyurtmalarim ({activeOrders}) <ChevronRight />
          </Link>
        ) : null}
        <div className="lm-search">
          <Search />
          <input data-section-search value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Lab, xizmat, shahar yoki nomini qidiring..." aria-label="Qidiruv" data-testid="lab-search" />
          <button type="button" aria-label="Filtrlar" data-testid="lab-filter-btn" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
            {extra ? <em>{extra}</em> : null}
          </button>
        </div>
        <div className="lm-tiles" data-testid="lab-chips">
          {labTiles.map((t) => (
            <button key={t.id || "all"} type="button" className={tile === t.id ? "on" : undefined} aria-pressed={tile === t.id} data-chip={t.id || "all"} onClick={() => setTile(t.id)}>
              <img src={t.image} alt="" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="lm-drops">
          <label>
            <MapPin />
            <select aria-label="Shahar" value={city} onChange={(e) => setCity(e.target.value)}>
              {labCities.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="all">Barchasi</option>
            </select>
            <ChevronDown />
          </label>
          <label>
            <CalendarDays />
            <select aria-label="Muddat" value={days} onChange={(e) => setDays(e.target.value)}>
              <option value="">Muddat</option>
              <option value="3">3 kungacha</option>
              <option value="5">5 kungacha</option>
              <option value="7">7 kungacha</option>
            </select>
            <ChevronDown />
          </label>
          <label>
            <Tag />
            <select aria-label="Narx" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
              <option value="">Narx</option>
              <option value="400000">400 minggacha</option>
              <option value="600000">600 minggacha</option>
              <option value="1000000">1 mln gacha</option>
            </select>
            <ChevronDown />
          </label>
          <label>
            <ArrowUpDown />
            <select aria-label="Saralash" data-testid="lab-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="">Saralash</option>
              <option value="yangi">Eng yangi</option>
              <option value="tez">Eng tez</option>
              <option value="arzon">Arzonroq</option>
            </select>
            <ChevronDown />
          </label>
        </div>
        <span className="lm-count" data-testid="lab-count">{labsReady ? `${list.length} ta laboratoriya` : "…"}</span>
        {list.length === 0 ? (
          <div className="lm-empty">
            <FlaskConical />
            <p>Laboratoriya topilmadi — filtrlarni o‘zgartiring.</p>
          </div>
        ) : null}
        <div className="lm-list" data-testid="lab-m-list">
          {list.map((row) => (
            <LabCard key={row.id} row={row} saved={saved.has(row.id)} onSave={() => saved.toggle(row.id)} onOrder={() => openOrder(row)} onSample={() => setSample(true)} />
          ))}
        </div>
        <Link href="/laboratoriya/mening" className="lm-own">Laboratoriyangiz bormi? Profilingizni joylang <ChevronRight /></Link>
        <div className="lm-pad" />
      </div>
      {orderable.length ? (
        <button type="button" className="lm-find" data-testid="lab-find" onClick={() => openOrder()}>
          <Plus /> Laboratoriya topish yoki buyurtma berish <ArrowRight />
        </button>
      ) : (
        <a className="lm-find" data-testid="lab-find" href={`${site.telegram}?text=${encodeURIComponent("Laboratoriya kerak: ")}`} target="_blank" rel="noreferrer">
          <Plus /> Laboratoriya topish yoki buyurtma berish <ArrowRight />
        </a>
      )}
      {order ? (
        <Modal title="Lab buyurtma" onClose={() => setOrder(null)}>
          <OrderForm labs={labs} preselectLabId={order.labId} onSaved={() => setOrder(null)} onCancel={() => setOrder(null)} />
        </Modal>
      ) : null}
      {sample ? (
        <div className="mb-sheet" role="dialog" aria-label="Namuna laboratoriya" data-testid="lab-info-sample">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setSample(false)} />
          <div className="mb-panel">
            <h3>Namuna laboratoriya</h3>
            <p>Bu kartochka bo‘lim qanday ko‘rinishini ko‘rsatish uchun qo‘yilgan — u haqiqiy laboratoriya emas, unga buyurtma berib yoki bog‘lanib bo‘lmaydi.</p>
            <p>Tekshirilgan laboratoriyalar ro‘yxat boshida chiqadi. Laboratoriyangiz bo‘lsa, profilingizni joylang.</p>
            <div className="row">
              <button type="button" onClick={() => setSample(false)}>Yopish</button>
              <Link className="go" href="/laboratoriya/mening">Lab qo‘shish</Link>
            </div>
          </div>
        </div>
      ) : null}
      {filters ? (
        <div className="mb-sheet" role="dialog" aria-label="Filtrlar" data-testid="lab-filter-sheet">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setFilters(false)} />
          <div className="mb-panel">
            <h3>Filtrlar</h3>
            <select aria-label="Material" value={material} onChange={(e) => setMaterial(e.target.value as "" | LabMaterial)}>
              <option value="">Material: barchasi</option>
              {labMaterialFilters.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <label className="lm-check">
              <input type="checkbox" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} /> <Bookmark /> Faqat saqlanganlar
            </label>
            <div className="row">
              <button type="button" onClick={() => { setMaterial(""); setOnlySaved(false); }}>Tozalash</button>
              <button type="button" className="go" onClick={() => setFilters(false)}>Ko‘rsatish ({list.length})</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LabCard({ row, saved, onSave, onOrder, onSample }: { row: Row; saved: boolean; onSave: () => void; onOrder: () => void; onSample: () => void }) {
  const href = row.lab ? `/laboratoriya/${row.id}` : null;
  const days = daysLabel(row);
  const Photo = (
    <>
      {row.cover ? <img src={row.cover} alt="" /> : <span className="lm-ph-empty"><FlaskConical /></span>}
      {row.lab ? null : <span className="lm-tag sample">Namuna</span>}
    </>
  );
  const Head = (
    <>
      <div className="lm-top">
        <h2>{row.name}</h2>
        {row.verified ? <span className="lm-ok"><CheckCircle2 /> Tekshirilgan</span> : null}
      </div>
      {row.reviews > 0 ? (
        <p className="lm-rate"><Star /> <b>{row.rating.toFixed(1)}</b> <span>({row.reviews} ta baho)</span></p>
      ) : (
        <p className="lm-rate none">Hali baho yo‘q</p>
      )}
      <p className="lm-meta">
        {row.place ? <span><MapPin /> {row.place}</span> : null}
        {days ? <span><Clock /> {days}</span> : null}
      </p>
    </>
  );
  return (
    <article className="lm-card" data-testid="lab-card" data-real={row.lab ? "1" : undefined}>
      {href ? <Link href={href} className="lm-photo" aria-label={row.name}>{Photo}</Link> : <button type="button" className="lm-photo" aria-label={row.name} onClick={onSample}>{Photo}</button>}
      <div className="lm-main">
        {href ? <Link href={href} className="lm-copy">{Head}</Link> : <div className="lm-copy">{Head}</div>}
        {row.thumbs.length ? (
          <div className="lm-thumbs" data-testid="lab-card-thumbs">
            {row.thumbs.map((src, i) => <img key={`${src}-${i}`} src={src} alt="" />)}
            {href ? <Link href={href} aria-label="Profilni ko‘rish" data-testid="lab-open"><ChevronRight /></Link> : <button type="button" aria-label="Batafsil" onClick={onSample}><ChevronRight /></button>}
          </div>
        ) : href ? (
          <Link href={href} className="lm-noport" data-testid="lab-open">Portfolio hali yo‘q · Profilni ko‘rish <ChevronRight /></Link>
        ) : null}
        {row.prices.length ? (
          <div className="lm-prices">
            {row.prices.map((p) => (
              <span key={p.title}>
                <small>{p.title}</small>
                <b>{p.price != null ? formatMoney(p.price, "UZS") : "Kelishiladi"}</b>
              </span>
            ))}
          </div>
        ) : null}
        <div className="lm-acts">
          {href ? (
            <Link href={href} className="lm-call" data-testid="lab-contact"><Phone /> Bog‘lanish</Link>
          ) : (
            <button type="button" className="lm-call" data-testid="lab-contact" onClick={onSample}><Phone /> Bog‘lanish</button>
          )}
          <button type="button" className="lm-order" data-testid="lab-order" onClick={onOrder}><FileText /> Buyurtma berish</button>
        </div>
      </div>
      {row.lab ? (
        <button type="button" className={saved ? "lm-save on" : "lm-save"} aria-label="Saqlash" aria-pressed={saved} data-testid="lab-bookmark" onClick={onSave}>
          <Bookmark fill={saved ? "currentColor" : "none"} />
        </button>
      ) : null}
    </article>
  );
}
