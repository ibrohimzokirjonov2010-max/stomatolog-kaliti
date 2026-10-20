"use client";
/* eslint-disable @next/next/no-img-element -- profile photo is sized by the shell */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { fetchSpecialists, type PublicSpecialist } from "@/lib/specialists-public";
import { resolveStoredImage } from "@/lib/media-url";
import { SpecialistsFrame } from "./MutaxassislarDesktop";
import "@/components/ustalar/desktop/usta.css";
import "./mutaxassislar.css";

export function MutaxassisProfileDesktop({ id }: { id: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [person, setPerson] = useState<PublicSpecialist | null | undefined>(undefined);

  useEffect(() => {
    let stop = false;
    void fetchSpecialists().then((rows) => {
      if (stop) return;
      setPerson(rows.find((item) => item.id === id) ?? null);
    });
    return () => {
      stop = true;
    };
  }, [id]);

  if (person === undefined) {
    return (
      <SpecialistsFrame>
        <div className="mx-empty"><p>Yuklanmoqda...</p></div>
      </SpecialistsFrame>
    );
  }

  if (!person) {
    return (
      <SpecialistsFrame>
        <div className="mx-empty" data-testid="spec-missing">
          <p>Mutaxassis topilmadi</p>
          <Link href="/mutaxassislar">Mutaxassislar</Link>
        </div>
      </SpecialistsFrame>
    );
  }

  const photo = resolveStoredImage(person.image);
  return (
    <SpecialistsFrame headerQuery={query} onHeaderQuery={setQuery} onHeaderSubmit={(value) => router.push(value ? `/mutaxassislar?q=${encodeURIComponent(value)}` : "/mutaxassislar")}>
      <div className="ut-page" data-testid="spec-profile">
        <div className="ut-crumbs">
          <Link href="/mutaxassislar">Mutaxassislar</Link>
          <span>›</span>
          <b>{person.name}</b>
        </div>
        <div className="ut-top">
          {photo ? <img className="ut-hero" src={photo} alt="" /> : <div className="ut-hero mx-initials">{person.name.slice(0, 1)}</div>}
          <section>
            <h1>{person.name}</h1>
            <p className="ut-role">{person.specialty}</p>
            <div className="ut-stats">
              {person.city ? <span><MapPin className="i" /> {person.city}</span> : null}
              {person.clinic ? <span>{person.clinic}</span> : null}
              <span>{person.kind === "usta" ? "Usta" : "Shifokor"}</span>
            </div>
            {person.about ? <p className="ut-meta" style={{ marginTop: "calc(.4 * var(--u))" }}>{person.about}</p> : null}
            {person.kind === "usta" ? (
              <div className="ut-cta">
                <Link className="ut-order" href={person.href}>Usta profili</Link>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </SpecialistsFrame>
  );
}
