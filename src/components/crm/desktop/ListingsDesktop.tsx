"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Eye, Heart, MapPin, Plus, Search } from "lucide-react";
import { CrmFrame, CrmModal } from "@/components/crm/desktop/CrmFrame";
import { listingCities, listingTypes, getListing, type Listing, type ListingType } from "@/data/listings";
import { formatGroupedNumber } from "@/lib/format";
import { useStoredList } from "@/lib/stored-list";

const SAVED = "sk-elon-saved-v1";

export function ListingsDesktop() {
  const params = useSearchParams();
  const initial = (params.get("tur") as ListingType | null) ?? "";
  const [extra, setExtra] = useStoredList("sk-elonlar-v1", [] as Listing[]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<ListingType | "">(initial);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("yangi");
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", city: "Toshkent", type: "sotiladi" as ListingType, price: "", category: "Uskunalar" });

  useEffect(() => {
    setType(initial);
  }, [initial]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED);
      if (raw) setSaved(JSON.parse(raw) as string[]);
    } catch { /* ignore */ }
  }, []);

  const all = extra;
  const items = useMemo(() => {
    const next = all.filter((item) => {
      if (type && item.type !== type) return false;
      if (category && item.category !== category) return false;
      if (city && item.city !== city) return false;
      if (q.trim() && !`${item.title} ${item.city} ${item.category}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
    next.sort((a, b) => sort === "arzon" ? (a.price ?? 0) - (b.price ?? 0) : sort === "qimmat" ? (b.price ?? 0) - (a.price ?? 0) : b.date.localeCompare(a.date));
    return next;
  }, [all, category, city, q, sort, type]);

  function toggle(id: string) {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      window.localStorage.setItem(SAVED, JSON.stringify(next));
      return next;
    });
  }

  function publish() {
    if (!form.title.trim()) return;
    const price = form.price.trim() ? Number(form.price.replace(/\s/g, "")) : null;
    const labels: Record<ListingType, string> = { sotiladi: "Sotiladi", ijara: "Ijaraga", ish: "Ish o‘rni", xizmat: "Xizmatlar", hamkor: "Hamkorlik" };
    const next: Listing = {
      id: `el-user-${Date.now()}`,
      type: form.type,
      typeLabel: labels[form.type],
      title: form.title.trim(),
      city: form.city,
      date: "2026-10-22",
      dateLabel: "22.10.2026",
      price,
      priceLabel: price ? `${formatGroupedNumber(price)} so‘m` : "Kelishiladi",
      views: 1,
      likes: 0,
      image: "/img/jihoz/unit.jpg",
      category: form.category,
      description: "Foydalanuvchi joylagan e’lon.",
    };
    setExtra((prev) => [next, ...prev]);
    setOpen(false);
    setType("");
  }

  return (
    <CrmFrame active="listings" listings placeholder="E‘lonlar bo‘yicha qidiring..." headerQuery={q} onHeaderQuery={setQ}>
      <div data-testid="listings-desktop">
        <div className="crm-head">
          <div>
            <h1>E‘lonlar</h1>
            <p>Stomatologiya sohasidagi e’lonlar: sotiladi, ijaraga, ish o‘rni va boshqalar</p>
          </div>
          <button type="button" className="crm-btn blue" data-testid="listing-add" onClick={() => setOpen(true)}><Plus className="i" /> E‘lon joylashtirish</button>
        </div>
        <div className="el-tiles">
          {listingTypes.map((item) => (
            <button key={item.label} type="button" className={type === item.id ? "on" : undefined} data-testid={`listing-type-${item.id || "all"}`} onClick={() => setType(item.id)}>
              <b>{item.label}</b>
              <small>{item.id === "" ? all.length : all.filter((row) => row.type === item.id).length}</small>
            </button>
          ))}
        </div>
        <div className="crm-tools">
          <label className="crm-search"><Search className="i" /><input data-testid="listing-search" aria-label="E’lon qidirish" value={q} placeholder="Kalit so‘z bo‘yicha qidiring..." onChange={(event) => setQ(event.target.value)} /></label>
          <label className="crm-select"><select data-testid="listing-category" aria-label="Toifa" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Barcha toifalar</option>{["Uskunalar", "Ijara", "Ish", "Laboratoriya", "Asboblar"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="crm-select"><select data-testid="listing-city" aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}><option value="">Barcha shaharlar</option>{listingCities.map((item) => <option key={item.city}>{item.city}</option>)}</select></label>
          <label className="crm-select"><select data-testid="listing-sort" aria-label="Narx" value={sort} onChange={(event) => setSort(event.target.value)}><option value="yangi">Yangilari</option><option value="arzon">Arzonlari</option><option value="qimmat">Qimmatlari</option></select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
        </div>
        <div className="crm-split" style={{ gridTemplateColumns: "minmax(0,1fr) calc(14 * var(--u))" }}>
          {items.length === 0 ? <div className="crm-empty" data-testid="listing-empty">E’lon topilmadi</div> : (
            <div className="el-grid">
              {items.map((item) => (
                <article key={item.id} className="el-card" data-testid="listing-card">
                  <span className={`el-flag ${item.type}`}>{item.typeLabel}</span>
                  <button type="button" className={`el-heart${saved.includes(item.id) ? " on" : ""}`} aria-label="Saqlash" data-testid={`listing-heart-${item.id}`} onClick={() => toggle(item.id)}><Heart className="i" /></button>
                  <Link href={`/elonlar/${item.id}`}><img className="ph" src={item.image} alt="" /></Link>
                  <div className="pad">
                    <h3><Link href={`/elonlar/${item.id}`}>{item.title}</Link></h3>
                    <p className="crm-muted"><MapPin className="i" style={{ width: "1em" }} /> {item.city} · {item.dateLabel}</p>
                    <p className="el-price">{item.priceLabel}</p>
                    <p className="crm-muted"><Eye className="i" style={{ width: "1em" }} /> {item.views} · {item.likes + (saved.includes(item.id) ? 1 : 0)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
          <aside className="el-side">
            <div className="pl-box">
              <b>Ommabop shaharlar</b>
              {listingCities.map((item) => <button key={item.city} type="button" className="city" onClick={() => setCity(item.city)}><span>{item.city}</span><b>{all.filter((row) => row.city === item.city).length}</b></button>)}
            </div>
            <div className="pl-box" style={{ marginTop: "calc(.4 * var(--u))" }}>
              <b>So‘nggi e’lonlar</b>
              {all.slice(0, 4).map((item) => (
                <Link key={item.id} href={`/elonlar/${item.id}`} className="visit"><span><b>{item.title}</b><small className="crm-muted">{item.priceLabel}</small></span></Link>
              ))}
            </div>
          </aside>
        </div>
        {open ? (
          <CrmModal title="E’lon joylashtirish" onClose={() => setOpen(false)}>
            <label className="crm-field">Sarlavha<input data-testid="listing-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label className="crm-field">Turi<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ListingType })}>{listingTypes.filter((item) => item.id).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label className="crm-field">Shahar<select value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}>{listingCities.map((item) => <option key={item.city}>{item.city}</option>)}</select></label>
            <label className="crm-field">Narx (bo‘sh qolsa kelishiladi)<input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
            <div className="row"><button type="button" className="go" data-testid="listing-save" onClick={publish}>Joylash</button></div>
          </CrmModal>
        ) : null}
      </div>
    </CrmFrame>
  );
}

export function ListingDetailDesktop({ id }: { id: string }) {
  const [extra] = useStoredList("sk-elonlar-v1", [] as Listing[]);
  const item = getListing(id, extra);
  if (!item) {
    return (
      <CrmFrame active="listings" listings placeholder="E‘lonlar bo‘yicha qidiring...">
        <div className="crm-empty">E’lon topilmadi</div>
      </CrmFrame>
    );
  }
  return (
    <CrmFrame active="listings" listings placeholder="E‘lonlar bo‘yicha qidiring...">
      <div data-testid="listing-detail">
        <Link href="/elonlar" className="crm-btn">Orqaga</Link>
        <div className="crm-split" style={{ marginTop: "calc(.4 * var(--u))", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,.8fr)" }}>
          <div className="crm-card">
            <img src={item.image} alt="" style={{ width: "100%", height: "calc(16 * var(--u))", objectFit: "cover" }} />
            <div style={{ padding: "calc(.6 * var(--u))" }}>
              <span className={`el-flag ${item.type}`} style={{ position: "static" }}>{item.typeLabel}</span>
              <h1 style={{ fontSize: "calc(1.2 * var(--u))", margin: "calc(.3 * var(--u)) 0" }}>{item.title}</h1>
              <p className="el-price">{item.priceLabel}</p>
              <p className="crm-muted">{item.city} · {item.dateLabel} · {item.views} ko‘rish</p>
              <p>{item.description}</p>
            </div>
          </div>
          <aside className="pl-box">
            <b>Bog‘lanish</b>
            <p className="crm-muted">E’lon egasi bilan chat yoki telefon orqali.</p>
            <a className="crm-btn blue" href="tel:+998901234567">+998 90 123 45 67</a>
          </aside>
        </div>
      </div>
    </CrmFrame>
  );
}
