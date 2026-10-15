"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, MapPin, Phone, Send, ShieldCheck, Star, Upload } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  desktopUstalar,
  repairTypes,
  ustaBrandFilters,
  ustaCities,
  ustaServices,
  type DesktopUsta,
  type UstaService,
} from "@/data/desktop-ustalar";
import "./usta.css";

export function UstaCatalog() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [service, setService] = useState<"all" | UstaService>("all");
  const [city, setCity] = useState("Toshkent");
  const [spec, setSpec] = useState("Barchasi");
  const [brand, setBrand] = useState("Barchasi");
  const [years, setYears] = useState("Barchasi");
  const [status, setStatus] = useState("Barchasi");
  const [sort, setSort] = useState("pop");
  const [note, setNote] = useState("");
  const [call, setCall] = useState<DesktopUsta | null>(null);
  const [order, setOrder] = useState<DesktopUsta | null>(null);
  const [emergency, setEmergency] = useState(false);
  const [join, setJoin] = useState(false);
  const [mapAll, setMapAll] = useState(false);
  const [fileName, setFileName] = useState("");
  const [form, setForm] = useState({ type: repairTypes[0], model: "", text: "", city: "Toshkent", area: "", when: "Bugun", slot: "14:00–16:00" });

  const items = useMemo(() => {
    let rows = desktopUstalar.filter((item) => {
      if (service !== "all" && !item.services.includes(service)) return false;
      if (city !== "Barchasi" && item.city !== city) return false;
      if (spec !== "Barchasi" && !item.services.includes(spec as UstaService) && !item.tags.some((tag) => tag.toLowerCase().includes(spec.toLowerCase()))) return false;
      if (brand !== "Barchasi" && !item.brands.includes(brand)) return false;
      if (years === "5+" && item.years < 5) return false;
      if (years === "8+" && item.years < 8) return false;
      if (status !== "Barchasi" && item.status !== status) return false;
      if (q && !`${item.name} ${item.role} ${item.tags.join(" ")} ${item.brands.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "rate") return b.rating - a.rating;
      if (sort === "years") return b.years - a.years;
      if (sort === "fast") return a.response.localeCompare(b.response);
      return b.popularity - a.popularity;
    });
    return rows;
  }, [brand, city, q, service, sort, spec, status, years]);

  function submitRepair() {
    setNote(`So‘rov yuborildi${order ? ` · ${order.name}` : ""}. Usta tez orada bog‘lanadi.`);
    setOrder(null);
  }

  return (
    <ShopShell searchPath="/ustalar" cartCount={cartCount} placeholder="Usta, brend yoki xizmat turini qidiring..." showCamera={false}>
      <div className="ut-page">
        <div className="ut-head">
          <div>
            <h1>Ustalar va servis</h1>
            <p>Stomatologik uskunalar uchun professional ta’mirlash, o‘rnatish va texnik xizmat.</p>
          </div>
          <div className="ut-actions">
            <button type="button" className="ut-alert" onClick={() => setEmergency(true)}><Phone className="i" /><span>Shoshilinch chaqiruv<small>24/7 tezkor xizmat</small></span></button>
            <button type="button" className="ut-reg" onClick={() => setJoin(true)}>Usta sifatida ro‘yxatdan o‘tish</button>
          </div>
        </div>
        <div className="ut-tabs">
          {ustaServices.map((item) => (
            <button key={item.id} type="button" className={service === item.id ? "ut-tab on" : "ut-tab"} onClick={() => setService(item.id)}>{item.label}</button>
          ))}
        </div>
        <div className="ut-filters">
          <select aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>
            <option>Barchasi</option>
            {ustaCities.map((name) => <option key={name}>{name}</option>)}
          </select>
          <select aria-label="Mutaxassislik" value={spec} onChange={(event) => setSpec(event.target.value)}>
            <option>Barchasi</option>
            {ustaServices.filter((item) => item.id !== "all").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <select aria-label="Brend tajribasi" value={brand} onChange={(event) => setBrand(event.target.value)}>
            <option>Barchasi</option>
            {ustaBrandFilters.map((name) => <option key={name}>{name}</option>)}
          </select>
          <select aria-label="Tajriba" value={years} onChange={(event) => setYears(event.target.value)}>
            <option>Barchasi</option>
            <option value="5+">5+ yil</option>
            <option value="8+">8+ yil</option>
          </select>
          <select aria-label="Holat" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>Barchasi</option>
            <option value="online">Onlayn</option>
            <option value="soon">Tez javob</option>
            <option value="offline">Offlayn</option>
          </select>
          <select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="pop">Eng mashhur</option>
            <option value="rate">Reyting</option>
            <option value="years">Tajriba</option>
            <option value="fast">Javob tezligi</option>
          </select>
          <span className="ut-count">{items.length} ta usta topildi</span>
        </div>
        <div className="ut-cols">
          <div className="ut-list">
            {items.map((item) => (
              <article className="ut-card" key={item.slug}>
                <Link href={`/ustalar/${item.slug}`} className="ut-photo">
                  <img src={item.image} alt="" />
                  <span className={`ut-status ${item.status}`}>{item.statusLabel}</span>
                </Link>
                <div>
                  <h3><Link href={`/ustalar/${item.slug}`}>{item.name}</Link> <BadgeCheck className="i" style={{ color: "#1497a8" }} /></h3>
                  <p className="ut-role">{item.role}</p>
                  <div className="ut-tags">{item.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <p className="ut-meta"><MapPin className="i" /> {item.city}, {item.district}</p>
                  <div className="ut-stats">
                    <span>{item.years} yil tajriba</span>
                    <span>{item.jobs}+ bajarilgan ish</span>
                    <span><Star className="i" style={{ color: "#f5b400", fill: "#f5b400" }} /> {item.rating.toFixed(1)} ({item.reviews} sharh)</span>
                  </div>
                </div>
                <div className="ut-prices">
                  <b>Xizmat narxlari</b>
                  {item.prices.map((price) => (
                    <div key={price.name}><span>{price.name}</span><b>{price.price}</b></div>
                  ))}
                </div>
                <div className="ut-side">
                  <span>Kafolat: {item.warranty}</span>
                  <span>Javob vaqti: {item.response}</span>
                  <span>Ish vaqti: {item.hours}</span>
                  <div className="btns">
                    <button type="button" className="ut-call" onClick={() => setCall(item)}><Phone className="i" /> Qo‘ng‘iroq</button>
                    <button type="button" className="ut-tg" onClick={() => setNote(`${item.name} · Telegram: @${item.telegram}`)}><Send className="i" /> Telegram</button>
                  </div>
                  <button type="button" className="ut-order" onClick={() => setOrder(item)}>Buyurtma berish</button>
                </div>
              </article>
            ))}
            {note ? <p className="ut-note">{note}</p> : null}
          </div>
          <aside className="ut-rail">
            <form className="ut-box" onSubmit={(event) => { event.preventDefault(); submitRepair(); }}>
              <h3>Ta’mir so‘rovi</h3>
              <p className="ut-role">Usta va batafsil ma’lumot qoldiring, biz sizga mos ustani topamiz.</p>
              <label className="ut-field">Jihoz turi
                <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{repairTypes.map((item) => <option key={item}>{item}</option>)}</select>
              </label>
              <label className="ut-field">Brend va model
                <input value={form.model} placeholder="Masalan, Sirona Intego" onChange={(event) => setForm({ ...form, model: event.target.value })} />
              </label>
              <label className="ut-field">Muammo tavsifi
                <textarea value={form.text} placeholder="Muammoni qisqacha yozing" onChange={(event) => setForm({ ...form, text: event.target.value })} />
              </label>
              <label className="ut-upload">
                <Upload className="i" /> Rasm yoki video yuklash
                <small style={{ display: "block" }}>{fileName || "JPG, PNG, MP4 · 10 MB gacha"}</small>
                <input hidden type="file" accept="image/*,video/mp4" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
              </label>
              <div className="ut-split">
                <label className="ut-field">Manzil
                  <select value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}>{ustaCities.map((item) => <option key={item}>{item}</option>)}</select>
                </label>
                <label className="ut-field">Tuman
                  <input value={form.area} placeholder="Tuman" onChange={(event) => setForm({ ...form, area: event.target.value })} />
                </label>
              </div>
              <div className="ut-split">
                <label className="ut-field">Qulay vaqt
                  <select value={form.when} onChange={(event) => setForm({ ...form, when: event.target.value })}><option>Bugun</option><option>Ertaga</option><option>Shu hafta</option></select>
                </label>
                <label className="ut-field">Soat
                  <select value={form.slot} onChange={(event) => setForm({ ...form, slot: event.target.value })}><option>09:00–12:00</option><option>14:00–16:00</option><option>16:00–19:00</option></select>
                </label>
              </div>
              <button type="submit" className="ut-order" style={{ width: "100%", marginTop: "calc(.4 * var(--u))" }}>So‘rov yuborish</button>
            </form>
            <section className="ut-box">
              <h3>Ustalar xaritada</h3>
              <div className="ut-map" aria-hidden="true">
                <span className="ut-pin" style={{ left: "18%", top: "30%" }}>{items[0]?.name.split(" ")[0]} · {items[0]?.rating.toFixed(1)}</span>
                <span className="ut-pin" style={{ left: "55%", top: "48%" }}>Toshkent</span>
                {mapAll ? items.slice(1, 4).map((item, index) => (
                  <span className="ut-pin" key={item.slug} style={{ left: `${20 + index * 22}%`, top: `${60 - index * 8}%` }}>{item.name.split(" ")[0]}</span>
                )) : null}
              </div>
              <p className="ut-meta"><MapPin className="i" /> {items[0]?.city ?? "Toshkent"}</p>
              <button type="button" className="ut-call" onClick={() => setMapAll(true)}>Barcha ustalarni xaritada ko‘rish →</button>
            </section>
            <section className="ut-box">
              <h3>Nega StomaHub ustalari?</h3>
              {[
                ["Tasdiqlangan mutaxassislar", "Hujjat va tajriba tekshiriladi"],
                ["Kafolatli xizmat", "Bajarilgan ishga kafolat"],
                ["Tezkor javob", "Onlayn ustalar bir necha daqiqada"],
                ["Shaffof narxlar", "Xizmat narxi oldindan ko‘rinadi"],
              ].map(([title, text]) => (
                <div className="ut-why" key={title}><ShieldCheck className="i" style={{ color: "#1497a8" }} /><div><b>{title}</b><span>{text}</span></div></div>
              ))}
            </section>
          </aside>
        </div>
      </div>
      {call ? (
        <div className="ut-modal" onClick={() => setCall(null)}>
          <div className="ut-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Qo‘ng‘iroq</h3>
            <p>{call.name}</p>
            <p><a href={`tel:${call.phone.replace(/\s/g, "")}`}>{call.phone}</a></p>
            <button type="button" className="ut-order" onClick={() => { setNote(`${call.name} ga qo‘ng‘iroq: ${call.phone}`); setCall(null); }}>Bog‘landim</button>
          </div>
        </div>
      ) : null}
      {order ? (
        <div className="ut-modal" onClick={() => setOrder(null)}>
          <div className="ut-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Buyurtma · {order.name}</h3>
            <p className="ut-role">{order.role}. Kafolat {order.warranty}.</p>
            <button type="button" className="ut-order" onClick={submitRepair}>Tasdiqlash</button>
          </div>
        </div>
      ) : null}
      {emergency ? (
        <div className="ut-modal" onClick={() => setEmergency(false)}>
          <div className="ut-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Shoshilinch chaqiruv</h3>
            <p>24/7 navbatchi usta bog‘lanadi.</p>
            <button type="button" className="ut-order" onClick={() => { setEmergency(false); setNote("Shoshilinch chaqiruv qabul qilindi."); }}>Chaqirish</button>
          </div>
        </div>
      ) : null}
      {join ? (
        <div className="ut-modal" onClick={() => setJoin(false)}>
          <div className="ut-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Usta sifatida ro‘yxatdan o‘tish</h3>
            <label className="ut-field">Ism<input /></label>
            <label className="ut-field">Mutaxassislik<input /></label>
            <label className="ut-field">Telefon<input /></label>
            <button type="button" className="ut-order" style={{ marginTop: "calc(.4 * var(--u))" }} onClick={() => { setJoin(false); setNote("Ariza qabul qilindi. Moderator ko‘rib chiqadi."); }}>Yuborish</button>
          </div>
        </div>
      ) : null}
    </ShopShell>
  );
}
