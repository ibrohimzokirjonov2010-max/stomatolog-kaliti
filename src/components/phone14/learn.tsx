"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bookmark, Heart, MapPin, Phone, SlidersHorizontal, Star, Users } from "lucide-react";
import { PhoneFrame, SearchBox, Sheet } from "@/components/phone14/chrome";
import { phoneCourses, phoneSpecialists } from "@/data/phone14";
import { formatGroupedNumber } from "@/lib/format";

export function PhoneCourses() {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("Barchasi");
  const [saved, setSaved] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [open, setOpen] = useState(false);
  const topics = ["Barchasi", "Implantologiya", "Endodontiya", "Ortodontiya", "Estetika", "Parodontologiya"];
  const items = useMemo(() => phoneCourses.filter((item) => {
    if (topic !== "Barchasi" && item.topic !== topic) return false;
    if (level && item.level !== level) return false;
    const blob = `${item.title} ${item.teacher} ${item.topic} ${item.text}`.toLowerCase();
    return !q.trim() || blob.includes(q.trim().toLowerCase());
  }), [level, q, topic]);
  return (
    <PhoneFrame testId="phone-darslar">
      <div>
        <h1>Onlayn darslar</h1>
        <p className="sub">Bilimingizni oshiring va amaliy ko‘nikmalarni rivojlantiring</p>
      </div>
      <SearchBox value={q} onChange={setQ} label="Kurs qidirish" placeholder="Kurs, ma’ruzachi yoki mavzu bo‘yicha qidirish..." />
      <div className="p14-row">
        {topics.map((item) => (
          <button key={item} type="button" className={topic === item ? "p14-chip on" : "p14-chip"} onClick={() => setTopic(item)}>{item}</button>
        ))}
        <button type="button" className="p14-filter" onClick={() => setOpen(true)}><SlidersHorizontal /> Filtr</button>
      </div>
      <div className="list">
        {items.length === 0 ? <p className="p14-empty">Kurs topilmadi</p> : items.map((item) => (
          <article key={item.id} className="p14-card course">
            <div className="ph">
              <img src={item.image} alt="" />
              <em>{item.topic}</em>
              <b className="dur">{item.time}</b>
              <button type="button" className={saved.includes(item.id) ? "icon-btn on" : "icon-btn"} style={{ position: "absolute", right: 8, bottom: 8 }} aria-label="Saqlash" aria-pressed={saved.includes(item.id)} onClick={() => setSaved((prev) => prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id])}>
                <Bookmark fill={saved.includes(item.id) ? "currentColor" : "none"} />
              </button>
            </div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <div className="who">
              <img src={item.avatar} alt="" />
              <span><b>{item.teacher}</b><small>{item.role}</small></span>
            </div>
            <p className="meta-line"><span>{item.lessons}</span><span>{item.time}</span><span>{item.level}</span></p>
            <div className="p14-head">
              <b className="price" style={{ color: "#0066ff" }}>{formatGroupedNumber(item.price)} so‘m</b>
              <Link href={`/talim/${item.id}/video`} className="buy" style={{ display: "inline-flex", alignItems: "center", padding: "0 14px" }}>{item.cta}</Link>
            </div>
          </article>
        ))}
      </div>
      {open ? (
        <Sheet title="Filtr" onClose={() => setOpen(false)}>
          <label>Daraja
            <select aria-label="Daraja" value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="">Barchasi</option>
              <option>Boshlang‘ich</option>
              <option>O‘rta</option>
              <option>Barcha darajalar</option>
            </select>
          </label>
          <button type="button" className="p14-go" onClick={() => setOpen(false)}>Qo‘llash</button>
        </Sheet>
      ) : null}
    </PhoneFrame>
  );
}

export function PhoneSpecialists() {
  const [q, setQ] = useState("");
  const [chip, setChip] = useState("Barchasi");
  const [city, setCity] = useState("");
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [chat, setChat] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const chips = ["Barchasi", "Stomatolog", "Implantolog", "Ortodont", "Endodontist"];
  const items = phoneSpecialists.filter((item) => {
    if (chip === "Implantolog" && !item.specialtyLabel.toLowerCase().includes("implant")) return false;
    if (chip === "Ortodont" && item.specialty !== "ortodont") return false;
    if (chip === "Endodontist" && item.specialty !== "endodontist") return false;
    if (chip === "Stomatolog" && item.specialty === "endodontist") return false;
    if (city && item.city !== city) return false;
    const blob = `${item.name} ${item.specialtyLabel} ${item.city} ${item.skills.join(" ")}`.toLowerCase();
    return !q.trim() || blob.includes(q.trim().toLowerCase());
  });
  const person = phoneSpecialists.find((item) => item.id === chat);
  return (
    <PhoneFrame testId="phone-mutaxassislar">
      <div>
        <h1>Mutaxassislar</h1>
        <p className="sub">Tajribali stomatologlar va soha mutaxassislari</p>
      </div>
      <SearchBox value={q} onChange={setQ} label="Mutaxassis qidirish" placeholder="Mutaxassis, mutaxassislik yoki shahar bo‘yicha qidirish..." />
      <div className="p14-row">
        {chips.map((item) => (
          <button key={item} type="button" className={chip === item ? "p14-chip on" : "p14-chip"} onClick={() => setChip(item)}>{item}</button>
        ))}
        <button type="button" className="p14-filter" onClick={() => setOpen(true)}><SlidersHorizontal /> Filtr</button>
      </div>
      <div className="list">
        {items.length === 0 ? <p className="p14-empty">Mutaxassis topilmadi</p> : items.map((item) => (
          <article key={item.id} className="p14-card spec-card">
            <Link href={`/mutaxassislar/${item.id}`} className="ava">
              <img src={item.image} alt="" />
              <i className={item.online ? "dot" : "dot off"} />
            </Link>
            <div>
              <div className="p14-head">
                <Link href={`/mutaxassislar/${item.id}`}><b>{item.name} <BadgeCheck size={14} color="#0066ff" /></b></Link>
                <button type="button" className={saved.includes(item.id) ? "icon-btn on" : "icon-btn"} aria-label="Sevimli" aria-pressed={saved.includes(item.id)} onClick={() => setSaved((prev) => prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id])}><Heart fill={saved.includes(item.id) ? "currentColor" : "none"} /></button>
              </div>
              <p className="spec">{item.specialtyLabel}</p>
              <p><Star size={14} color="#f5b400" fill="#f5b400" /> {item.rating} ({item.reviews} sharh)</p>
              <p className="meta-line"><span><MapPin size={12} /> {item.city}</span><span>{item.experience}</span><span><Users size={12} /> {item.patientsLabel}</span></p>
              <p className="spec">Xalqaro sertifikatlar</p>
              <p className="tags">{item.skills.map((tag) => <i key={tag}>{tag}</i>)}</p>
              <div className="pair">
                <button type="button" className="ghost" onClick={() => { setChat(item.id); setSent([]); }}>Xabar yozish</button>
                <a className="solid" style={{ display: "grid", placeItems: "center" }} href={`tel:${item.phone}`}>Bog‘lanish</a>
              </div>
            </div>
          </article>
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
      {person ? (
        <Sheet title={person.name} onClose={() => setChat(null)}>
          <p className="sub">{person.specialtyLabel} · {person.city}</p>
          <div className="list" style={{ margin: "8px 0" }}>
            <div className="p14-card">Assalomu alaykum. Savolingizni yozing.</div>
            {sent.map((text) => <div key={text} className="p14-card" style={{ background: "#e8f1ff" }}>{text}</div>)}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); if (!draft.trim()) return; setSent((prev) => [...prev, draft.trim()]); setDraft(""); }}>
            <input aria-label="Xabar" value={draft} placeholder="Xabar yozing..." onChange={(event) => setDraft(event.target.value)} />
            <button className="p14-go" type="submit">Yuborish</button>
          </form>
          <a href={`tel:${person.phone}`} className="ghost" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}><Phone size={14} /> {person.phone}</a>
        </Sheet>
      ) : null}
    </PhoneFrame>
  );
}
