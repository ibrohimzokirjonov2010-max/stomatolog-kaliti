"use client";
/* eslint-disable @next/next/no-img-element -- profile photos are user uploads */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Heart, LayoutGrid, MapPin, Search, Stethoscope } from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { fetchSpecialists, type PublicSpecialist } from "@/lib/specialists-public";
import "./mutaxassislar-mobile.css";

function initials(name: string) {
  return name.replace(/^dr\.?\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

/** First word of the specialty ("Stomatolog-implantolog, ortoped" → "Stomatolog-implantolog"). */
function mainSpecialty(specialty: string) {
  return specialty.split(/[,;]/)[0]?.trim() || "Stomatolog";
}

/** Phone /mutaxassislar (mock "mutaxassislar telefon"). Desktop renders MutaxassislarDesktop from AppChrome. */
export function MutaxassislarMobile() {
  const [people, setPeople] = useState<PublicSpecialist[] | null>(null);
  const [q, setQ] = useState("");
  const [chip, setChip] = useState("");
  const favorites = useFavorites();

  useEffect(() => {
    let stop = false;
    void fetchSpecialists().then((rows) => {
      if (!stop) setPeople(rows);
    });
    return () => {
      stop = true;
    };
  }, []);

  const chips = Array.from(new Set((people ?? []).map((person) => mainSpecialty(person.specialty)))).slice(0, 6);
  const needle = q.trim().toLowerCase();
  const shown = (people ?? []).filter(
    (person) =>
      (!chip || mainSpecialty(person.specialty) === chip) &&
      (!needle || `${person.name} ${person.specialty} ${person.city} ${person.clinic}`.toLowerCase().includes(needle)),
  );

  return (
    <div className="ms lg:hidden" data-testid="phone-mutaxassislar">
      <h1>Mutaxassislar</h1>
      <p className="ms-lead">Tajribali stomatologlar va soha mutaxassislari</p>
      <label className="ms-search"><Search /><input value={q} placeholder="Mutaxassis, mutaxassislik yoki shahar bo‘yicha qidirish..." aria-label="Qidirish" onChange={(event) => setQ(event.target.value)} /></label>
      {chips.length > 1 ? (
        <div className="ms-chips">
          <button type="button" className={!chip ? "on" : ""} onClick={() => setChip("")}><LayoutGrid /> Barchasi</button>
          {chips.map((item) => <button key={item} type="button" className={chip === item ? "on" : ""} onClick={() => setChip(item)}><Stethoscope /> {item}</button>)}
        </div>
      ) : null}
      {people === null ? (
        <p className="ms-empty" data-testid="spec-empty">Yuklanmoqda…</p>
      ) : shown.length === 0 ? (
        <p className="ms-empty" data-testid="spec-empty">{people.length === 0 ? "Hozircha mutaxassislar ro‘yxati yo‘q." : "Mos mutaxassis topilmadi."}</p>
      ) : (
        <ul className="ms-list">
          {shown.map((person) => {
            const href = person.href || `/mutaxassislar/${person.id}`;
            const favId = `spec:${person.id}`;
            const liked = favorites.has(favId);
            return (
              <li key={person.id} className="ms-card" data-testid="spec-card">
                <Link href={href} className="ms-photo">{person.image ? <img src={person.image} alt="" /> : <span>{initials(person.name)}</span>}</Link>
                <div className="ms-body">
                  <Link href={href} className="ms-name">{person.name}</Link>
                  <p className="ms-spec">{person.specialty}</p>
                  <p className="ms-meta">
                    {person.city ? <span><MapPin /> {person.city}</span> : null}
                    {person.clinic ? <span><Building2 /> {person.clinic}</span> : null}
                  </p>
                  {person.about ? <p className="ms-about">{person.about}</p> : null}
                  <Link href={href} className="ms-go">Profilni ko‘rish <ChevronRight /></Link>
                </div>
                <button type="button" className={liked ? "ms-like on" : "ms-like"} aria-label="Saqlash" aria-pressed={liked} onClick={() => favorites.toggle(favId)}><Heart /></button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
