"use client";
/* eslint-disable @next/next/no-img-element -- specialist photos are fixed-size cards */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  BadgeCheck,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  FileText,
  MessageCircle,
  Search,
  Star,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Modal, ProfileView } from "@/components/job-forms";
import { useJobsWork } from "@/components/jobs-provider";
import { MarketFrame, type HeaderLink } from "@/components/shop/desktop/MarketFrame";
import type { Candidate } from "@/data/jobs";
import {
  filterSpecialists,
  sortSpecialists,
  specialistCities,
  specialists,
  specialties,
  type Specialist,
  type Specialty,
  type SpecSort,
} from "@/data/desktop-specialists";
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
      promoImage="/img/design-pr13/promo/chair.png"
      promoIcon={<Stethoscope className="mx-cap i" />}
      promoClass="mx-promo"
      onPromo={onPromo}
    >
      {children}
    </MarketFrame>
  );
}

const SAVED = "sh-specs-saved-v1";

function specialtyOf(role: string): Specialty | "" {
  const r = role.toLowerCase();
  if (r.includes("implant")) return "implantolog";
  if (r.includes("ortodont")) return "ortodont";
  if (r.includes("terapevt")) return "terapevt";
  if (r.includes("ortoped")) return "ortoped";
  if (r.includes("jarroh") || r.includes("xirurg")) return "jarroh";
  if (r.includes("endodont")) return "endodontist";
  if (r.includes("parodont")) return "parodontolog";
  if (r.includes("bolalar") || r.includes("pediatr")) return "bolalar";
  if (r.includes("gigiyen")) return "gigiyenist";
  return "";
}

function initials(name: string) {
  return name.replace(/^dr\.?\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function MutaxassislarDesktop() {
  const params = useSearchParams();
  const { resumes } = useJobsWork();
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const [specialty, setSpecialty] = useState<Specialty | "">("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<SpecSort>("reyting");
  const [saved, setSaved] = useState<string[]>([]);
  const [contact, setContact] = useState<Specialist | null>(null);
  const [person, setPerson] = useState<Candidate | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED);
      if (raw) setSaved(JSON.parse(raw) as string[]);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const real = useMemo(() => resumes.filter((item) => !item.demo), [resumes]);
  const cities = useMemo(() => [...new Set([...specialistCities, ...real.map((item) => item.city).filter(Boolean)])], [real]);
  const realItems = useMemo(() => {
    const query = q.trim().toLowerCase();
    const rows = real.filter((item) => {
      if (specialty && specialtyOf(item.role) !== specialty) return false;
      if (city && item.city !== city) return false;
      if (query && !`${item.name} ${item.role} ${item.city} ${item.about}`.toLowerCase().includes(query)) return false;
      return true;
    });
    return sort === "tajriba" ? [...rows].sort((a, b) => b.experienceYears - a.experienceYears) : rows;
  }, [city, q, real, sort, specialty]);
  const items = useMemo(() => sortSpecialists(filterSpecialists(specialists, { q, specialty, city }), sort), [q, specialty, city, sort]);
  const total = realItems.length + items.length;

  function reset() {
    setQ("");
    setSpecialty("");
    setCity("");
    setSort("reyting");
  }

  function toggleSave(id: string) {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try {
        window.localStorage.setItem(SAVED, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
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
            <div className="brd-badge" data-testid="spec-count">
              <span className="medal">
                <BadgeCheck className="i" />
              </span>
              <span>
                <b>{real.length} ta mutaxassis</b>
                <span>Rezyume joylaganlar</span>
              </span>
            </div>
            <Link className="brd-badge" href="/ishlar?joylash=rezyume" data-testid="spec-join">
              <span className="medal">
                <Star className="i" />
              </span>
              <span>
                <b>Profil qo‘shing</b>
                <span>Rezyumengizni joylang</span>
              </span>
            </Link>
          </div>
        </div>
        <div className="mx-tools">
          <label className="mx-search">
            <Search className="i" />
            <input data-testid="spec-search" aria-label="Mutaxassis qidirish" value={q} placeholder="Mutaxassis yoki mutaxassislik bo‘yicha qidiring..." onChange={(event) => setQ(event.target.value)} />
          </label>
          <label className="mx-select">
            <MapPin className="i" />
            <select data-testid="spec-city" aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">Shahar: Barchasi</option>
              {cities.map((item) => (
                <option key={item} value={item}>
                  Shahar: {item}
                </option>
              ))}
            </select>
            <ChevronRight className="i" style={{ transform: "rotate(90deg)" }} />
          </label>
          <label className="mx-select">
            <Stethoscope className="i" />
            <select data-testid="spec-specialty" aria-label="Mutaxassislik" value={specialty} onChange={(event) => setSpecialty(event.target.value as Specialty | "")}>
              <option value="">Mutaxassislik</option>
              {specialties.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronRight className="i" style={{ transform: "rotate(90deg)" }} />
          </label>
          <label className="mx-select">
            <ArrowUpDown className="i" />
            <select data-testid="spec-sort" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as SpecSort)}>
              <option value="reyting">Reyting bo‘yicha</option>
              <option value="yuqori">Yuqori reyting</option>
              <option value="tajriba">Tajriba bo‘yicha</option>
              <option value="bemor">Bemorlar bo‘yicha</option>
            </select>
            <ChevronRight className="i" style={{ transform: "rotate(90deg)" }} />
          </label>
        </div>
        <div className="mx-chips" role="tablist" aria-label="Mutaxassislik">
          <button type="button" role="tab" aria-selected={specialty === ""} className={specialty === "" ? "on" : undefined} data-testid="spec-chip-all" onClick={() => setSpecialty("")}>
            Barchasi
          </button>
          {specialties.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={specialty === item.id} className={specialty === item.id ? "on" : undefined} data-testid={`spec-chip-${item.id}`} onClick={() => setSpecialty(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {total === 0 ? (
          <div className="mx-empty" data-testid="spec-empty">
            <p>Mutaxassis topilmadi</p>
            <button type="button" onClick={reset}>
              Tozalash
            </button>
          </div>
        ) : (
          <div className="mx-grid">
            {realItems.map((item) => (
              <RealCard key={item.id} person={item} saved={saved.includes(`r-${item.id}`)} onSave={() => toggleSave(`r-${item.id}`)} onOpen={() => setPerson(item)} />
            ))}
            {items.map((item) => (
              <SpecCard key={item.id} person={item} saved={saved.includes(item.id)} onSave={() => toggleSave(item.id)} onContact={() => setContact(item)} />
            ))}
          </div>
        )}
        {contact ? <SpecContact person={contact} onClose={() => setContact(null)} /> : null}
        {person ? (
          <Modal title="Mutaxassis rezyumesi" onClose={() => setPerson(null)}>
            <ProfileView person={person} onClose={() => setPerson(null)} />
          </Modal>
        ) : null}
      </div>
    </SpecialistsFrame>
  );
}

/** Design profiles have no account behind them — say so instead of faking a chat or a phone call. */
export function SpecContact({ person, onClose }: { person: Specialist; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="mx-modal" role="dialog" aria-modal="true" aria-label="Namuna profil" data-testid="spec-chat" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="mx-dialog">
        <header>
          <b>Namuna profil</b>
          <button type="button" onClick={onClose} aria-label="Yopish">
            <X className="i" />
          </button>
        </header>
        <p>
          <b>{person.name}</b> — bo‘lim qanday ko‘rinishini ko‘rsatish uchun qo‘yilgan namuna profil. Uning hisobi va telefon raqami yo‘q, shuning uchun xabar yuborib bo‘lmaydi.
        </p>
        <p>Haqiqiy mutaxassislar — rezyume joylagan shifokorlar — ro‘yxat boshida chiqadi va ularga to‘g‘ridan-to‘g‘ri taklif yuborishingiz mumkin.</p>
        <div className="act">
          <Link href="/ishlar?tab=rezyumelar">Rezyumelar</Link>
          <Link className="go" href="/ishlar?joylash=rezyume">
            Rezyume joylash
          </Link>
        </div>
      </div>
    </div>
  );
}

function RealCard({ person, saved, onSave, onOpen }: { person: Candidate; saved: boolean; onSave: () => void; onOpen: () => void }) {
  return (
    <article className="mx-card" data-testid="spec-card" data-real="1">
      <button type="button" className={saved ? "mx-heart on" : "mx-heart"} data-testid="spec-heart" aria-label="Sevimlilar" aria-pressed={saved} onClick={onSave}>
        <Heart className="i" />
      </button>
      <div className="mx-ph mx-ini">
        {person.photo ? <img src={person.photo} alt="" /> : <b>{initials(person.name)}</b>}
        <span className="mx-live">
          <FileText className="i" /> Rezyume
        </span>
      </div>
      <h3>{person.name}</h3>
      <p className="mx-role">{person.role}</p>
      <p className="mx-rate">
        <BadgeCheck className="star i" style={{ color: "#0b63f6", fill: "none" }} />
        <span>{person.verified ? "Tasdiqlangan rezyume" : "Rezyume joylangan"}</span>
      </p>
      <div className="mx-meta">
        <span>
          <MapPin className="i" /> {person.city || "—"}
        </span>
        <span>
          <Clock className="i" /> {person.experienceYears ? `${person.experienceYears} yil tajriba` : "Tajriba yo‘q"}
        </span>
      </div>
      <div className="mx-actions">
        <button type="button" className="mx-profil" data-testid={`spec-profile-r-${person.id}`} onClick={onOpen}>
          Profil
        </button>
        <button type="button" className="mx-contact" data-testid={`spec-contact-r-${person.id}`} onClick={onOpen}>
          <MessageCircle className="i" /> Bog‘lanish
        </button>
      </div>
    </article>
  );
}

function SpecCard({ person, saved, onSave, onContact }: { person: Specialist; saved: boolean; onSave: () => void; onContact: () => void }) {
  return (
    <article className="mx-card" data-testid="spec-card">
      <button type="button" className={saved ? "mx-heart on" : "mx-heart"} data-testid="spec-heart" aria-label="Sevimlilar" aria-pressed={saved} onClick={onSave}>
        <Heart className="i" />
      </button>
      <div className="mx-ph">
        <img src={person.image} alt="" />
        <span className="mx-live sample">Namuna</span>
      </div>
      <h3>{person.name}</h3>
      <p className="mx-role">{person.specialtyLabel}</p>
      <p className="mx-rate">
        <Star className="star i" />
        <b>{person.rating}</b>
        <span>({person.reviews} ta sharh)</span>
      </p>
      <div className="mx-meta">
        <span>
          <MapPin className="i" /> {person.city}
        </span>
        <span>
          <Clock className="i" /> {person.experience}
        </span>
        <span>
          <Users className="i" /> {person.patientsLabel}
        </span>
      </div>
      <div className="mx-actions">
        <Link className="mx-profil" href={`/mutaxassislar/${person.id}`} data-testid={`spec-profile-${person.id}`}>
          Profil
        </Link>
        <button type="button" className="mx-contact" data-testid={`spec-contact-${person.id}`} onClick={onContact}>
          <MessageCircle className="i" /> Bog‘lanish
        </button>
      </div>
    </article>
  );
}
