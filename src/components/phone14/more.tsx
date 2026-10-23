"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Briefcase, Building2, CalendarDays, ChevronDown, Heart, LayoutGrid, MapPin, Package, Plus, SlidersHorizontal, Star, Wrench } from "lucide-react";
import { Modal, OrderForm } from "@/components/lab-browse";
import { PhoneFrame, SearchBox, Sheet } from "@/components/phone14/chrome";
import { findPhoneAd, phoneAds, phoneLabs } from "@/data/phone14";
import { getListing, type Listing } from "@/data/listings";

const ADS_KEY = "sk-phone14-ads";

export function PhoneLabs() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("Toshkent");
  const [chip, setChip] = useState("Barchasi");
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const chips = [
    ["Barchasi", "18"],
    ["Zirkon", "18"],
    ["E-max", "12"],
    ["Metallokeramika", "10"],
    ["Shtift va qalpoq", "8"],
  ];
  const items = phoneLabs.filter((lab) => {
    if (city && lab.city !== city) return false;
    if (chip !== "Barchasi" && !lab.tags.some((tag) => tag.toLowerCase().includes(chip.toLowerCase().slice(0, 4))) && lab.chip !== chip) return false;
    const blob = `${lab.name} ${lab.district} ${lab.tags.join(" ")}`.toLowerCase();
    return !q.trim() || blob.includes(q.trim().toLowerCase());
  });
  const active = phoneLabs.find((lab) => lab.id === order);
  return (
    <PhoneFrame testId="phone-ustalar">
      <div className="p14-head">
        <div>
          <h1>Ustalar laboratoriyalari</h1>
          <p className="sub">Tish texniklari va laboratoriyalar</p>
        </div>
        <button type="button" className="p14-filter" onClick={() => setCity(city === "Toshkent" ? "Samarqand" : "Toshkent")}>{city} <ChevronDown size={14} /></button>
      </div>
      <div className="p14-head">
        <SearchBox value={q} onChange={setQ} label="Laboratoriya qidirish" placeholder="Laboratoriya, xizmat yoki tuman..." />
        <button type="button" className="p14-filter" onClick={() => setOpen(true)}><SlidersHorizontal /> Filtr</button>
      </div>
      <div className="p14-row">
        {chips.map(([label, count]) => (
          <button key={label} type="button" className={chip === label ? "p14-chip on" : "p14-chip"} onClick={() => setChip(label)}>{label} ({count})</button>
        ))}
      </div>
      <div className="list">
        {items.length === 0 ? <p className="p14-empty">Laboratoriya topilmadi</p> : items.map((lab) => (
          <article key={lab.id} className="p14-card">
            <Link href={`/laboratoriya/${lab.id}`}><img src={lab.photo ?? ""} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 12 }} /></Link>
            <div className="p14-head">
              <Link href={`/laboratoriya/${lab.id}`}><b>{lab.name} <BadgeCheck size={14} color="#0b7f7d" /></b></Link>
              <button type="button" aria-label="Menyu" onClick={() => setMenu(menu === lab.id ? null : lab.id)}>···</button>
            </div>
            <p className="spec"><MapPin size={12} /> {lab.district}</p>
            <p><Star size={14} color="#f5b400" fill="#f5b400" /> {lab.rating} ({lab.reviews})</p>
            <p className="tags">{lab.tags.map((tag) => <i key={tag}>{tag}</i>)}</p>
            <p className="spec">Tayyorlash muddati {lab.daysLabel}</p>
            <div className="p14-head">
              <span>Boshlang‘ich narx <b style={{ color: "#0b7f7d" }}>{lab.priceLabel} so‘m</b></span>
              <button type="button" className="buy" style={{ padding: "0 14px" }} onClick={() => setOrder(lab.id)}>Buyurtma</button>
            </div>
            {menu === lab.id ? <p className="spec">{lab.city}</p> : null}
          </article>
        ))}
      </div>
      {open ? (
        <Sheet title="Filtr" onClose={() => setOpen(false)}>
          <label>Shahar
            <select aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>
              <option>Toshkent</option>
              <option>Samarqand</option>
            </select>
          </label>
          <button type="button" className="p14-go" onClick={() => setOpen(false)}>Qo‘llash</button>
        </Sheet>
      ) : null}
      {active ? (
        <Modal title="Yangi buyurtma" onClose={() => setOrder(null)}>
          <OrderForm labs={phoneLabs} preselectLabId={active.id} onCancel={() => setOrder(null)} onSaved={() => setOrder(null)} />
        </Modal>
      ) : null}
    </PhoneFrame>
  );
}

export function PhoneAds() {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState<"all" | "sotiladi" | "ijara" | "ish">("all");
  const [chip, setChip] = useState("Barchasi");
  const [city, setCity] = useState("");
  const [open, setOpen] = useState(false);
  const [add, setAdd] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [extra, setExtra] = useState<Listing[]>([]);
  const [form, setForm] = useState({ title: "", description: "", city: "Toshkent", price: "", type: "sotiladi" as Listing["type"], category: "Uskunalar" });
  useEffect(() => {
    try { setExtra(JSON.parse(window.localStorage.getItem(ADS_KEY) || "[]") as Listing[]); } catch { /* ignore */ }
  }, []);
  const items = useMemo(() => [...extra, ...phoneAds].filter((item) => {
    if (seg !== "all" && item.type !== seg) return false;
    if (chip !== "Barchasi" && item.category !== chip) return false;
    if (city && item.city !== city) return false;
    const blob = `${item.title} ${item.description} ${item.category} ${item.city}`.toLowerCase();
    return !q.trim() || blob.includes(q.trim().toLowerCase());
  }), [chip, city, extra, q, seg]);
  function publish() {
    if (!form.title.trim()) return;
    const next: Listing = {
      id: `ad-${Date.now()}`,
      type: form.type,
      typeLabel: form.type === "ijara" ? "Ijaraga" : form.type === "ish" ? "Ish o‘rni" : "Sotiladi",
      title: form.title.trim(),
      city: form.city,
      date: "2024-10-17",
      dateLabel: "17 okt 2024",
      price: Number(form.price) || null,
      priceLabel: form.price ? `${form.price} so‘m` : "Kelishiladi",
      views: 0,
      likes: 0,
      image: "/img/phone14/ad-0.png",
      category: form.category,
      description: form.description.trim() || "Yangi e’lon",
    };
    const stored = [next, ...extra];
    setExtra(stored);
    window.localStorage.setItem(ADS_KEY, JSON.stringify(stored));
    setSeg(form.type === "ijara" || form.type === "ish" ? form.type : "sotiladi");
    setAdd(false);
  }
  return (
    <PhoneFrame testId="phone-elonlar" tab="market">
      <div className="p14-head">
        <div>
          <h1>E’lonlar</h1>
          <p className="sub">Stomatologiya sohasidagi e’lonlar</p>
        </div>
        <button type="button" className="p14-chip on" onClick={() => setAdd(true)}><Plus size={14} /> E’lon joylash</button>
      </div>
      <div className="tool-row">
        <SearchBox value={q} onChange={setQ} label="E’lon qidirish" placeholder="Kalit so‘z, kategoriya yoki shahar bo‘yicha qidirish..." />
        <button type="button" className="p14-filter" onClick={() => setOpen(true)}><SlidersHorizontal /> Filtr</button>
      </div>
      <div className="seg">
        {([["sotiladi", "Sotiladi (128)"], ["ijara", "Ijaraga (36)"], ["ish", "Ish o‘rni (24)"]] as const).map(([key, label]) => (
          <button key={key} type="button" className={seg === key ? "on" : undefined} onClick={() => setSeg(seg === key ? "all" : key)}>{label}</button>
        ))}
      </div>
      <div className="p14-row">
        {([
          ["Barchasi", LayoutGrid],
          ["Uskunalar", Wrench],
          ["Materiallar", Package],
          ["Klinika", Building2],
          ["Ish o‘rni", Briefcase],
        ] as const).map(([item, Icon]) => (
          <button key={item} type="button" className={chip === item ? "p14-chip on" : "p14-chip"} onClick={() => setChip(item)}><Icon size={14} />{item}</button>
        ))}
      </div>
      <div className="list">
        {items.length === 0 ? <p className="p14-empty">E’lon topilmadi</p> : items.map((item) => (
          <Link key={item.id} href={`/elonlar/${item.id}`} className="ad-card">
            <span className="ad-photo">
              <img src={item.image} alt="" />
              <span className={`pill ${item.type === "sotiladi" ? "green" : item.type === "ijara" ? "purple" : "violet"}`}>{item.typeLabel}</span>
            </span>
            <span className="ad-copy">
              <span className="ad-title">
                <b>{item.title}</b>
                <button type="button" className={saved.includes(item.id) ? "icon-btn on" : "icon-btn"} aria-label="Sevimli" onClick={(event) => { event.preventDefault(); setSaved((prev) => prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]); }}><Heart size={16} fill={saved.includes(item.id) ? "currentColor" : "none"} /></button>
              </span>
              <span className="spec">{item.description}</span>
              <b className="ad-price">{item.priceLabel}</b>
              <span className="meta-line"><span><MapPin size={12} /> {item.city}</span><span><CalendarDays size={12} /> {item.dateLabel}</span></span>
            </span>
          </Link>
        ))}
      </div>
      {open ? (
        <Sheet title="Filtr" onClose={() => setOpen(false)}>
          <label>Shahar
            <select aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">Barchasi</option>
              <option>Toshkent</option>
              <option>Samarqand</option>
            </select>
          </label>
          <button type="button" className="p14-go" onClick={() => setOpen(false)}>Qo‘llash</button>
        </Sheet>
      ) : null}
      {add ? (
        <Sheet title="E’lon joylash" onClose={() => setAdd(false)}>
          <label>Sarlavha<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>Tavsif<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label>Turi
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Listing["type"] })}>
              <option value="sotiladi">Sotiladi</option>
              <option value="ijara">Ijaraga</option>
              <option value="ish">Ish o‘rni</option>
            </select>
          </label>
          <label>Kategoriya
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option>Uskunalar</option>
              <option>Materiallar</option>
              <option>Klinika</option>
              <option>Ish o‘rni</option>
            </select>
          </label>
          <label>Shahar<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
          <label>Narx<input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
          <button type="button" className="p14-go" onClick={publish}>Joylash</button>
        </Sheet>
      ) : null}
    </PhoneFrame>
  );
}

export function PhoneAdDetail({ id }: { id: string }) {
  const [extra, setExtra] = useState<Listing[]>([]);
  useEffect(() => {
    try { setExtra(JSON.parse(window.localStorage.getItem(ADS_KEY) || "[]") as Listing[]); } catch { /* ignore */ }
  }, []);
  const item = findPhoneAd(id, extra) ?? getListing(id, extra);
  if (!item) {
    return (
      <PhoneFrame testId="phone-elon" tab="profil">
        <p>E’lon topilmadi</p>
        <Link href="/elonlar">E’lonlar</Link>
      </PhoneFrame>
    );
  }
  return (
    <PhoneFrame testId="phone-elon" tab="profil">
      <Link href="/elonlar">← E’lonlar</Link>
      <img src={item.image} alt="" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 16 }} />
      <span className={`pill ${item.type === "sotiladi" ? "green" : item.type === "ijara" ? "purple" : "violet"}`}>{item.typeLabel}</span>
      <h1>{item.title}</h1>
      <p>{item.description}</p>
      <b style={{ color: "#0b7f7d" }}>{item.priceLabel}</b>
      <p className="spec">{item.city} · {item.dateLabel} · {item.category}</p>
    </PhoneFrame>
  );
}
