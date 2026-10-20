"use client";
/* eslint-disable @next/next/no-img-element -- specialist photos are fixed-size cards */

import { useEffect, useState, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, Stethoscope } from "lucide-react";
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
      promoImage="/img/design-pr13/promo/chair.png"
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

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return people;
    return people.filter((person) => `${person.name} ${person.specialty} ${person.city} ${person.clinic}`.toLowerCase().includes(query));
  }, [people, q]);

  return (
    <SpecialistsFrame headerQuery={q} onHeaderQuery={setQ}>
      <div data-testid="specs-desktop">
        <div className="mx-head">
          <div>
            <h1>Mutaxassislar</h1>
            <p>{!ready ? "Yuklanmoqda..." : `${shown.length} ta mutaxassis`}</p>
          </div>
        </div>
        {!ready || shown.length === 0 ? (
          <div className="mx-empty" data-testid="spec-empty">
            <p>{!ready ? "Yuklanmoqda..." : "Hozircha mutaxassislar ro‘yxati yo‘q."}</p>
          </div>
        ) : (
          <div className="mx-grid">
            {shown.map((person) => {
              const photo = resolveStoredImage(person.image);
              return (
                <article className="mx-card" key={person.id} data-testid="spec-card">
                  <div className="mx-ph">
                    {photo ? <img src={photo} alt="" /> : <span className="mx-initials">{initials(person.name)}</span>}
                  </div>
                  <h3>{person.name}</h3>
                  <p className="mx-role">{person.specialty}</p>
                  <div className="mx-meta">
                    {person.city ? <span><MapPin className="i" /> {person.city}</span> : null}
                    {person.clinic ? <span><Stethoscope className="i" /> {person.clinic}</span> : null}
                    <span>{person.kind === "usta" ? "Usta" : "Shifokor"}</span>
                  </div>
                  <div className="mx-actions">
                    <Link className="mx-profil" href={person.href} data-testid={`spec-profile-${person.id}`}>
                      Profil
                    </Link>
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

