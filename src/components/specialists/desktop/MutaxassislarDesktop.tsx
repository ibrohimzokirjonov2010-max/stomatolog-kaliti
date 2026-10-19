"use client";
/* eslint-disable @next/next/no-img-element -- specialist photos are fixed-size cards */

import { useState, useMemo, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  BadgeCheck,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Search,
  Star,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { MarketFrame, type HeaderLink } from "@/components/shop/desktop/MarketFrame";
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

export function MutaxassislarDesktop() {
  const params = useSearchParams();
  const [q, setQ] = useState(() => params.get("q") ?? "");

  return (
    <SpecialistsFrame headerQuery={q} onHeaderQuery={setQ}>
      <div data-testid="specs-desktop">
        <div className="mx-head">
          <div>
            <h1>Mutaxassislar</h1>
            <p>Ro‘yxat hali ochilmagan</p>
          </div>
        </div>
        <div className="mx-empty" data-testid="spec-empty">
          <p>Hozircha mutaxassislar ro‘yxati yo‘q.</p>
        </div>
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
