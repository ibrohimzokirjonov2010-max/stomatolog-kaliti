"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bookmark, Heart, MapPin, Phone, SlidersHorizontal, Star, Users } from "lucide-react";
import { PhoneFrame, SearchBox, Sheet } from "@/components/phone14/chrome";
import { phoneCourses } from "@/data/phone14";
import { fetchSpecialists, type PublicSpecialist } from "@/lib/specialists-public";
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
              <b className="price" style={{ color: "#0b7f7d" }}>{formatGroupedNumber(item.price)} so‘m</b>
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
  const [people, setPeople] = useState<PublicSpecialist[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stop = false;
    void fetchSpecialists().then((rows) => {
      if (stop) return;
      setPeople(rows);
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);
  return (
    <PhoneFrame testId="phone-mutaxassislar">
      <div>
        <h1>Mutaxassislar</h1>
        <p className="sub">{!ready ? "Yuklanmoqda..." : `${people.length} ta mutaxassis`}</p>
      </div>
      {!ready || people.length === 0 ? (
        <p className="p14-empty" data-testid="spec-empty">{!ready ? "Yuklanmoqda..." : "Hozircha mutaxassislar ro‘yxati yo‘q."}</p>
      ) : people.map((person) => (
        <Link key={person.id} href={person.href} className="p14-card" data-testid="spec-card">
          <h3>{person.name}</h3>
          <p>{person.specialty}{person.city ? ` · ${person.city}` : ""}{person.clinic ? ` · ${person.clinic}` : ""}</p>
        </Link>
      ))}
    </PhoneFrame>
  );
}
