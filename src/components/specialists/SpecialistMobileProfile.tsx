"use client";
/* eslint-disable @next/next/no-img-element -- profile photos are user uploads */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, FileText, Heart, MapPin, Share2, Stethoscope, UserRound, Users } from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { fetchSpecialists, type PublicSpecialist } from "@/lib/specialists-public";
import "./specialist-mobile.css";

function initials(name: string) {
  return name.replace(/^dr\.?\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

/** Directions written in the specialty ("Stomatolog-implantolog, ortoped") as chips. */
function directions(specialty: string) {
  return Array.from(new Set(specialty.split(/[,;/]|\s+-\s+|-(?=[a-zʻ‘'])/i).map((part) => part.trim()).filter((part) => part.length > 2).map((part) => part[0].toUpperCase() + part.slice(1))));
}

export function SpecialistMobileProfile({ id }: { id: string }) {
  const [people, setPeople] = useState<PublicSpecialist[] | null>(null);
  const [copied, setCopied] = useState(false);
  const favorites = useFavorites();

  useEffect(() => {
    let stop = false;
    void fetchSpecialists().then((rows) => {
      if (!stop) setPeople(rows);
    });
    return () => {
      stop = true;
    };
  }, [id]);

  const person = people?.find((item) => item.id === id) ?? null;
  if (people === null) return <p className="sp-state">Yuklanmoqda…</p>;
  if (!person) {
    return (
      <div className="sp-state">
        <p>Mutaxassis topilmadi</p>
        <Link href="/mutaxassislar">Mutaxassislarga qaytish</Link>
      </div>
    );
  }

  const chips = directions(person.specialty);
  const others = people.filter((item) => item.id !== person.id && (item.specialty === person.specialty || (person.city && item.city === person.city))).slice(0, 4);
  const favId = `spec:${person.id}`;

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: person?.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <article className="sp" data-testid="spec-mobile-profile">
      <section className="sp-hero">
        <div className="sp-photo">{person.image ? <img src={person.image} alt={person.name} /> : <span>{initials(person.name)}</span>}</div>
        <div className="sp-hero-copy">
          <h1>{person.name}</h1>
          <p>{person.specialty || "Stomatolog"}</p>
          {person.city ? <p className="sp-place"><MapPin /> {person.city}</p> : null}
        </div>
        <button type="button" className={favorites.has(favId) ? "sp-fav on" : "sp-fav"} aria-label="Saqlash" aria-pressed={favorites.has(favId)} onClick={() => favorites.toggle(favId)}><Heart /></button>
      </section>

      <div className="sp-tiles">
        <div><i><Stethoscope /></i><span><b>{chips[0] ?? (person.specialty || "Stomatolog")}</b><small>Asosiy yo‘nalish</small></span></div>
        <div><i><Building2 /></i><span><b>{person.clinic || "Ko‘rsatilmagan"}</b><small>Klinika</small></span></div>
        <div><i><MapPin /></i><span><b>{person.city || "—"}</b><small>Shahar</small></span></div>
      </div>

      <div className="sp-actions">
        <button type="button" className="sp-share" onClick={() => void share()}><Share2 /> {copied ? "Havola nusxalandi" : "Ulashish"}</button>
        <Link href="/mutaxassislar" className="sp-all"><Users /> Barcha mutaxassislar</Link>
      </div>

      <section className="sp-card">
        <h2><i><FileText /></i> Mutaxassis haqida</h2>
        <p className="sp-text">{person.about || "Mutaxassis hali o‘zi haqida yozmagan."}</p>
        {chips.length > 1 ? <div className="sp-chips">{chips.map((chip) => <span key={chip}>{chip}</span>)}</div> : null}
      </section>

      {others.length ? (
        <section className="sp-card">
          <div className="sp-head">
            <h2><i><UserRound /></i> O‘xshash mutaxassislar</h2>
            <Link href="/mutaxassislar">Barchasini ko‘rish <ChevronRight /></Link>
          </div>
          <ul className="sp-list">
            {others.map((item) => (
              <li key={item.id}>
                <Link href={`/mutaxassislar/${item.id}`}>
                  <span className="sp-mini">{item.image ? <img src={item.image} alt="" /> : initials(item.name)}</span>
                  <span className="sp-mini-copy"><b>{item.name}</b><small>{[item.specialty, item.clinic, item.city].filter(Boolean).join(" · ")}</small></span>
                  <ChevronRight className="sp-chev" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
