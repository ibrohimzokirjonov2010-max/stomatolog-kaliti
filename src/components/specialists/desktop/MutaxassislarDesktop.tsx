"use client";
/* eslint-disable @next/next/no-img-element -- specialist photos are fixed-size cards */

import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useStoredList } from "@/lib/stored-list";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, Award, Building2, ChevronDown, Heart, MapPin, Search, Stethoscope } from "lucide-react";
import { MarketFrame, type HeaderLink } from "@/components/shop/desktop/MarketFrame";
import { fetchSpecialists, type PublicSpecialist } from "@/lib/specialists-public";
import { resolveStoredImage } from "@/lib/media-url";
import "./mutaxassislar.css";

const headerLinks: HeaderLink[] = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/seminarlar", label: "Seminarlar" },
  { href: "/ustalar", label: "Ustalar", key: "ustalar" },
  { href: "/forma", label: "Forma" },
  { href: "/kitoblar", label: "Kitoblar" },
];



export function SpecialistsFrame({
  children,
  headerQuery,
  onHeaderQuery,
  onHeaderSubmit,
  onPromo,
}: {
  children: ReactNode;
  headerQuery?: string;
  onHeaderQuery?: (value: string) => void;
  onHeaderSubmit?: (value: string) => void;
  onPromo?: () => void;
}) {
  return (
    <MarketFrame
      active="specs"
      headerLinks={headerLinks}
      headerActive="ustalar"
      searchPlaceholder="Mutaxassis, klinika yoki mutaxassislik bo‘yicha qidiring..."
      headerQuery={headerQuery}
      onHeaderQuery={onHeaderQuery}
      onHeaderSubmit={onHeaderSubmit}
      promoTitle="Professional mutaxassislarni toping!"
      promoText="Tajribali stomatologlar bilan bog‘laning"
      promoCta="Mutaxassis qidirish"
      promoHref="/mutaxassislar"
      promoImage="/img/design-pr13/categories/uskunalar.png"
      promoIcon={<Stethoscope className="mx-cap i" />}
      promoClass="mx-promo"
      onPromo={onPromo}
    >
      {children}
    </MarketFrame>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function MutaxassislarDesktop() {
  const params = useSearchParams();
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const [people, setPeople] = useState<PublicSpecialist[]>([]);
  const [ready, setReady] = useState(false);
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [sort, setSort] = useState<"name" | "city" | "kind">("name");
  const [saved, setSaved] = useStoredList<string>("sk-spec-saved-v1", []);

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

  const cities = useMemo(() => [...new Set(people.map((person) => person.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "uz")), [people]);
  const specialties = useMemo(() => {
    const counts = new Map<string, number>();
    for (const person of people) if (person.specialty) counts.set(person.specialty, (counts.get(person.specialty) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [people]);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = people.filter((person) => {
      if (city && person.city !== city) return false;
      if (specialty && person.specialty !== specialty) return false;
      return !query || `${person.name} ${person.specialty} ${person.city} ${person.clinic}`.toLowerCase().includes(query);
    });
    return [...list].sort((a, b) => (sort === "city" ? a.city.localeCompare(b.city, "uz") : sort === "kind" ? a.kind.localeCompare(b.kind) : 0) || a.name.localeCompare(b.name, "uz"));
  }, [city, people, q, sort, specialty]);

  function reset() {
    setQ("");
    setCity("");
    setSpecialty("");
  }

  return (
    <SpecialistsFrame headerQuery={q} onHeaderQuery={setQ} onPromo={reset}>
      <div data-testid="specs-desktop">
        <div className="mx-head">
          <div>
            <h1>Mutaxassislar</h1>
            <p>Tajribali stomatolog mutaxassislar bilan bog‘laning</p>
          </div>
          <div className="mx-badges">
            <div className="brd-badge"><span className="medal"><Award className="i" /></span><span><b>{ready ? `${people.length} ta shifokor` : "…"}</b><span>O‘zbekiston bo‘ylab</span></span></div>
            <div className="brd-badge"><span className="medal"><MapPin className="i" /></span><span><b>{ready ? `${cities.length} ta shahar` : "…"}</b><span>Shifokorlar joylashuvi</span></span></div>
          </div>
        </div>
        <div className="mx-tools">
          <label className="mx-search"><Search className="i" /><input data-testid="spec-search" aria-label="Mutaxassis qidirish" value={q} placeholder="Mutaxassis yoki mutaxassislik bo‘yicha qidiring..." onChange={(event) => setQ(event.target.value)} /></label>
          <label className="mx-select"><MapPin className="i" /><select data-testid="spec-city" aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}><option value="">Shahar: Barchasi</option>{cities.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="i" /></label>
          <label className="mx-select"><Stethoscope className="i" /><select data-testid="spec-specialty" aria-label="Mutaxassislik" value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="">Mutaxassislik</option>{specialties.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="i" /></label>
          <label className="mx-select"><ArrowUpDown className="i" /><select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as "name" | "city" | "kind")}><option value="name">Ism bo‘yicha</option><option value="city">Shahar bo‘yicha</option></select><ChevronDown className="i" /></label>
        </div>
        {specialties.length ? (
          <div className="mx-chips">
            <button type="button" className={specialty === "" ? "on" : undefined} onClick={() => setSpecialty("")}>Barchasi</button>
            {specialties.slice(0, 9).map((item) => (
              <button key={item} type="button" className={specialty === item ? "on" : undefined} onClick={() => setSpecialty(item)}>{item}</button>
            ))}
          </div>
        ) : null}
        {!ready || shown.length === 0 ? (
          <div className="mx-empty" data-testid="spec-empty">
            <p>{!ready ? "Yuklanmoqda..." : people.length === 0 ? "Hozircha mutaxassislar ro‘yxati yo‘q." : "Bu filtrda mutaxassis topilmadi."}</p>
            {ready && people.length ? <button type="button" onClick={reset}>Filtrlarni tozalash</button> : null}
          </div>
        ) : (
          <div className="mx-grid">
            {shown.map((person) => {
              const photo = resolveStoredImage(person.image);
              const on = saved.includes(person.id);
              return (
                <article className="mx-card" key={person.id} data-testid="spec-card">
                  <div className="mx-ph">
                    {photo ? <img src={photo} alt="" /> : <span className="mx-initials">{initials(person.name)}</span>}
                    <button type="button" className={on ? "mx-heart on" : "mx-heart"} aria-label="Saqlash" aria-pressed={on} onClick={() => setSaved(on ? saved.filter((id) => id !== person.id) : [...saved, person.id])}><Heart className="i" /></button>
                  </div>
                  <h3>{person.name}</h3>
                  <p className="mx-role">{person.specialty || "Stomatolog"}</p>
                  <div className="mx-meta">
                    {person.city ? <span><MapPin className="i" /> {person.city}</span> : null}
                    {person.clinic ? <span><Building2 className="i" /> {person.clinic}</span> : null}
                  </div>
                  <div className="mx-actions">
                    <Link className="mx-profil" href={person.href} data-testid={`spec-profile-${person.id}`}>Profil</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </SpecialistsFrame>
  );
}
