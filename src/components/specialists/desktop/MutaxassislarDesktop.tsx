"use client";
/* eslint-disable @next/next/no-img-element -- specialist photos are fixed-size cards */

import { useState, useMemo, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  BadgeCheck,
  BadgePercent,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock,
  GraduationCap,
  Heart,
  Home,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Search,
  Settings,
  Star,
  Stethoscope,
  Tag,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { MarketFrame, type FrameLink, type HeaderLink } from "@/components/shop/desktop/MarketFrame";
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

const sideMain: FrameLink[] = [
  { key: "home", label: "Bosh sahifa", href: "/", icon: Home },
  { key: "courses", label: "Onlayn darslar", href: "/talim", icon: GraduationCap },
  { key: "seminars", label: "Seminarlar", href: "/seminarlar", icon: CalendarDays },
  { key: "specs", label: "Mutaxassislar", href: "/mutaxassislar", icon: UserRound },
  { key: "clinics", label: "Klinikalar", href: "/mening-klinikam", icon: Building2 },
  { key: "books", label: "Kitoblar", href: "/kitoblar", icon: BookOpen },
  { key: "cats", label: "Kategoriyalar", href: "/kategoriyalar", icon: LayoutGrid },
  { key: "brands", label: "Brendlar", href: "/marketplace/brendlar", icon: Tag },
  { key: "sale", label: "Aksiyalar", href: "/marketplace/aksiyalar", icon: BadgePercent },
];

const sideSecond: FrameLink[] = [
  { key: "fav", label: "Sevimlilar", href: "/mutaxassislar", icon: Heart },
  { key: "requests", label: "Mening so‘rovlarim", href: "/ustalar/sorovlarim", icon: ClipboardList },
  { key: "messages", label: "Xabarlar", href: "/profil", icon: MessageCircle },
  { key: "settings", label: "Sozlamalar", href: "/profil", icon: Settings },
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
      sideMain={sideMain}
      sideSecond={sideSecond}
      sideLabel="Mutaxassislar"
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

export function MutaxassislarDesktop() {
  const params = useSearchParams();
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const [specialty, setSpecialty] = useState<Specialty | "">("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<SpecSort>("reyting");
  const [saved, setSaved] = useState<string[]>([]);
  const [chat, setChat] = useState<Specialist | null>(null);
  const items = useMemo(() => sortSpecialists(filterSpecialists(specialists, { q, specialty, city }), sort), [q, specialty, city, sort]);

  function reset() {
    setQ("");
    setSpecialty("");
    setCity("");
    setSort("reyting");
  }

  function toggleSave(id: string) {
    setSaved((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
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
            <div className="brd-badge">
              <span className="medal">
                <BadgeCheck className="i" />
              </span>
              <span>
                <b>500+ mutaxassis</b>
                <span>O‘zbekiston bo‘ylab</span>
              </span>
            </div>
            <div className="brd-badge">
              <span className="medal">
                <Star className="i" />
              </span>
              <span>
                <b>Tekshirilgan profillar</b>
                <span>Haqiqiy mutaxassislar</span>
              </span>
            </div>
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
              <option value="">Shahar</option>
              {specialistCities.map((item) => (
                <option key={item} value={item}>
                  {item}
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
          <button type="button" className={specialty === "" ? "on" : undefined} data-testid="spec-chip-all" onClick={() => setSpecialty("")}>
            Barchasi
          </button>
          {specialties.map((item) => (
            <button key={item.id} type="button" className={specialty === item.id ? "on" : undefined} data-testid={`spec-chip-${item.id}`} onClick={() => setSpecialty(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="mx-empty" data-testid="spec-empty">
            <p>Mutaxassis topilmadi</p>
            <button type="button" onClick={reset}>
              Tozalash
            </button>
          </div>
        ) : (
          <div className="mx-grid">
            {items.map((person) => (
              <SpecCard key={person.id} person={person} saved={saved.includes(person.id)} onSave={() => toggleSave(person.id)} onContact={() => setChat(person)} />
            ))}
          </div>
        )}
        {chat ? <SpecChat person={chat} onClose={() => setChat(null)} /> : null}
      </div>
    </SpecialistsFrame>
  );
}

export function SpecChat({ person, onClose }: { person: Specialist; onClose: () => void }) {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);

  function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSent((current) => [...current, text]);
    setDraft("");
  }

  return (
    <div className="mx-chat" role="dialog" aria-label={`${person.name} bilan chat`} data-testid="spec-chat">
      <header>
        <b>{person.name}</b>
        <button type="button" onClick={onClose} aria-label="Yopish">
          <X className="i" />
        </button>
      </header>
      <div className="log">
        <p>
          {person.specialtyLabel} · {person.city} · {person.clinic}
        </p>
        <div className="msg">Assalomu alaykum. Savolingizni yozing, tez orada javob beraman.</div>
        {sent.map((text, index) => (
          <div className="msg me" key={`${index}-${text}`}>
            {text}
          </div>
        ))}
      </div>
      <form onSubmit={send}>
        <input data-testid="spec-chat-input" aria-label="Xabar" value={draft} placeholder="Xabar yozing..." onChange={(event) => setDraft(event.target.value)} />
        <button type="submit">Yuborish</button>
      </form>
    </div>
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
        {person.online ? (
          <span className="mx-live">
            <em /> Online
          </span>
        ) : null}
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
          <Users className="i" /> {person.patientsLabel}
        </span>
        <span>
          <Clock className="i" /> {person.experience}
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
