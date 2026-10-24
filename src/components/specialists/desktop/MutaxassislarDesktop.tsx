"use client";
/* eslint-disable @next/next/no-img-element -- specialist photos are fixed-size cards */

import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useStoredList } from "@/lib/stored-list";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, BadgeCheck, Building2, ChevronDown, Heart, LayoutGrid, List, MapPin, MessageCircle, Search, ShieldCheck, Stethoscope, UserCheck } from "lucide-react";
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
  showPromo = true,
}: {
  children: ReactNode;
  headerQuery?: string;
  onHeaderQuery?: (value: string) => void;
  onHeaderSubmit?: (value: string) => void;
  onPromo?: () => void;
  showPromo?: boolean;
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
      showPromo={showPromo}
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
  const [cityQ, setCityQ] = useState("");
  const [cityPick, setCityPick] = useState<string[]>([]);
  const [specPick, setSpecPick] = useState<string[]>([]);
  const [kind, setKind] = useState<"" | "doctor" | "usta">("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

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
      if (cityPick.length && !cityPick.includes(person.city)) return false;
      if (specPick.length && !specPick.includes(person.specialty)) return false;
      if (kind && person.kind !== kind) return false;
      if (onlySaved && !saved.includes(person.id)) return false;
      return !query || `${person.name} ${person.specialty} ${person.city} ${person.clinic}`.toLowerCase().includes(query);
    });
    return [...list].sort((a, b) => (sort === "city" ? a.city.localeCompare(b.city, "uz") : sort === "kind" ? a.kind.localeCompare(b.kind) : 0) || a.name.localeCompare(b.name, "uz"));
  }, [city, cityPick, kind, onlySaved, people, q, saved, sort, specPick, specialty]);

  const countBy = (key: "city" | "specialty", value: string) => people.filter((person) => person[key] === value).length;
  const toggle = (list: string[], value: string, set: (next: string[]) => void) => set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  function reset() {
    setQ("");
    setCity("");
    setSpecialty("");
    setCityPick([]);
    setSpecPick([]);
    setKind("");
    setOnlySaved(false);
  }

  return (
    <SpecialistsFrame headerQuery={q} onHeaderQuery={setQ} onPromo={reset} showPromo={false}>
      <div data-testid="specs-desktop" className="mxv">
        <div className="mxv-top">
          <div>
            <h1>Mutaxassislar</h1>
            <p>Tajribali stomatolog mutaxassislar bilan bog‘laning</p>
            <ul className="mxv-perks">
              <li><i><ShieldCheck /></i><span><b>Haqiqiy profillar</b><small>Ro‘yxatdan o‘tgan shifokor va ustalar</small></span></li>
              <li><i><Search /></i><span><b>Qulay qidiruv</b><small>Mutaxassislik va shaharga ko‘ra</small></span></li>
              <li><i><UserCheck /></i><span><b>To‘g‘ridan-to‘g‘ri aloqa</b><small>{ready ? `${people.length} ta mutaxassis, ${cities.length} ta shahar` : "…"}</small></span></li>
            </ul>
          </div>
          <div className="mxv-banner">
            <img src="/img/marketing/specialists-banner.jpg" alt="" />
            <b>Sog‘lom tabassum — <em>professional mutaxassislar</em> bilan</b>
          </div>
        </div>

        <div className="mx-tools">
          <label className="mx-search"><Search className="i" /><input data-testid="spec-search" aria-label="Mutaxassis qidirish" value={q} placeholder="Mutaxassis, klinika yoki mutaxassislik bo‘yicha qidiring..." onChange={(event) => setQ(event.target.value)} /></label>
          <label className="mx-select"><MapPin className="i" /><select data-testid="spec-city" aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}><option value="">Shahar: Barchasi</option>{cities.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="i" /></label>
          <label className="mx-select"><Stethoscope className="i" /><select data-testid="spec-specialty" aria-label="Mutaxassislik" value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="">Mutaxassislik</option>{specialties.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="i" /></label>
          <label className="mx-select"><ArrowUpDown className="i" /><select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as "name" | "city" | "kind")}><option value="name">Ism bo‘yicha (A-Z)</option><option value="city">Shahar bo‘yicha</option><option value="kind">Turi bo‘yicha</option></select><ChevronDown className="i" /></label>
        </div>
        {specialties.length ? (
          <div className="mx-chips">
            <button type="button" className={specialty === "" ? "on" : undefined} onClick={() => setSpecialty("")}>Barchasi</button>
            {specialties.slice(0, 9).map((item) => (
              <button key={item} type="button" className={specialty === item ? "on" : undefined} onClick={() => setSpecialty(item)}>{item}</button>
            ))}
          </div>
        ) : null}

        <div className="mxv-body">
          <aside className="mxv-filters" aria-label="Filtrlar">
            <header><b>Filtrlar</b><button type="button" onClick={reset}>Barchasini tozalash</button></header>
            <section>
              <h3>Shahar</h3>
              {cities.length > 6 ? <label className="mxv-find"><Search /><input value={cityQ} onChange={(event) => setCityQ(event.target.value)} placeholder="Shaharni qidiring..." /></label> : null}
              {cities.filter((item) => item.toLowerCase().includes(cityQ.trim().toLowerCase())).map((item) => (
                <Check key={item} on={cityPick.includes(item)} label={item} count={countBy("city", item)} onClick={() => toggle(cityPick, item, setCityPick)} />
              ))}
              {cities.length === 0 ? <p className="mxv-muted">—</p> : null}
            </section>
            <section>
              <h3>Mutaxassislik</h3>
              {specialties.map((item) => (
                <Check key={item} on={specPick.includes(item)} label={item} count={countBy("specialty", item)} onClick={() => toggle(specPick, item, setSpecPick)} />
              ))}
            </section>
            <section>
              <h3>Turi</h3>
              <Check on={kind === ""} label="Barchasi" count={people.length} onClick={() => setKind("")} />
              <Check on={kind === "doctor"} label="Shifokorlar" count={people.filter((person) => person.kind === "doctor").length} onClick={() => setKind("doctor")} />
              <Check on={kind === "usta"} label="Ustalar" count={people.filter((person) => person.kind === "usta").length} onClick={() => setKind("usta")} />
            </section>
            <section className="mxv-switch">
              <span>Faqat saqlanganlar</span>
              <button type="button" role="switch" aria-checked={onlySaved} className={onlySaved ? "on" : undefined} onClick={() => setOnlySaved(!onlySaved)}><i /></button>
            </section>
          </aside>

          <div>
            <div className="mxv-bar">
              <b>{ready ? `${shown.length} ta mutaxassis topildi` : "Yuklanmoqda…"}</b>
              <div>
                <button type="button" aria-label="Katak" aria-pressed={view === "grid"} className={view === "grid" ? "on" : undefined} onClick={() => setView("grid")}><LayoutGrid /></button>
                <button type="button" aria-label="Ro‘yxat" aria-pressed={view === "list"} className={view === "list" ? "on" : undefined} onClick={() => setView("list")}><List /></button>
              </div>
            </div>
            {!ready || shown.length === 0 ? (
              <div className="mx-empty" data-testid="spec-empty">
                <p>{!ready ? "Yuklanmoqda..." : people.length === 0 ? "Hozircha mutaxassislar ro‘yxati yo‘q." : "Bu filtrda mutaxassis topilmadi."}</p>
                {ready && people.length ? <button type="button" onClick={reset}>Filtrlarni tozalash</button> : null}
              </div>
            ) : (
              <div className={view === "grid" ? "mxv-grid" : "mxv-grid list"}>
                {shown.map((person) => {
                  const photo = resolveStoredImage(person.image);
                  const on = saved.includes(person.id);
                  return (
                    <article className="mxv-card" key={person.id} data-testid="spec-card">
                      <div className="ph">
                        {photo ? <img src={photo} alt="" /> : <span className="mx-initials">{initials(person.name)}</span>}
                        <em><BadgeCheck /> {person.kind === "usta" ? "Usta" : "Shifokor"}</em>
                        <button type="button" className={on ? "heart on" : "heart"} aria-label="Saqlash" aria-pressed={on} onClick={() => setSaved(on ? saved.filter((id) => id !== person.id) : [...saved, person.id])}><Heart fill={on ? "currentColor" : "none"} /></button>
                      </div>
                      <div className="bd">
                        <h3>{person.name}</h3>
                        <p className="role">{person.specialty || (person.kind === "usta" ? "Usta" : "Stomatolog")}</p>
                        <p className="meta">
                          {person.city ? <span><MapPin /> {person.city}</span> : null}
                          {person.clinic ? <span><Building2 /> {person.clinic}</span> : null}
                        </p>
                        {person.about ? <p className="about">{person.about}</p> : null}
                        <div className="acts">
                          <Link className="go" href={person.href} data-testid={`spec-profile-${person.id}`}>Profilga o‘tish</Link>
                          <Link className="ask" href={`${person.href}#aloqa`}><MessageCircle /> Bog‘lanish</Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </SpecialistsFrame>
  );
}

function Check({ on, label, count, onClick }: { on: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button type="button" className={on ? "mxv-check on" : "mxv-check"} aria-pressed={on} onClick={onClick}>
      <i />
      <span>{label}</span>
      <small>{count}</small>
    </button>
  );
}
