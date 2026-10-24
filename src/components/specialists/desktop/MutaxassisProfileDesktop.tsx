"use client";
/* eslint-disable @next/next/no-img-element -- profile photo is sized by the shell */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, ChevronRight, Heart, MapPin, MessagesSquare, Share2, Stethoscope, UserRound, Wrench } from "lucide-react";
import { fetchSpecialists, type PublicSpecialist } from "@/lib/specialists-public";
import { resolveStoredImage } from "@/lib/media-url";
import { useStoredList } from "@/lib/stored-list";
import { SpecialistsFrame } from "./MutaxassislarDesktop";
import "./mutaxassislar.css";
import "./mutaxassis-profile.css";

function initials(name: string) {
  return name.replace(/^Dr\.?\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Desktop /mutaxassislar/[id] (mock "mutaxassislar profili"). Shows only what the public profile carries. */
export function MutaxassisProfileDesktop({ id }: { id: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<PublicSpecialist[] | null>(null);
  const [saved, setSaved] = useStoredList<string>("sk-spec-saved-v1", []);
  const [note, setNote] = useState("");

  useEffect(() => {
    let stop = false;
    void fetchSpecialists().then((rows) => {
      if (!stop) setPeople(rows);
    });
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 2200);
    return () => window.clearTimeout(timer);
  }, [note]);

  const person = people?.find((item) => item.id === id) ?? null;
  const similar = useMemo(() => {
    if (!person || !people) return [];
    const rest = people.filter((item) => item.id !== person.id);
    return [...rest.filter((item) => item.specialty === person.specialty), ...rest.filter((item) => item.specialty !== person.specialty)].slice(0, 4);
  }, [people, person]);
  const sameClinic = useMemo(() => (person?.clinic && people ? people.filter((item) => item.id !== person.id && item.clinic === person.clinic) : []), [people, person]);

  if (people === null || !person) {
    return (
      <SpecialistsFrame showPromo={false}>
        <div className="mx-empty" data-testid={people === null ? undefined : "spec-missing"}>
          <p>{people === null ? "Yuklanmoqda..." : "Mutaxassis topilmadi"}</p>
          {people !== null ? <Link href="/mutaxassislar">Mutaxassislar</Link> : null}
        </div>
      </SpecialistsFrame>
    );
  }

  const photo = resolveStoredImage(person.image);
  const isSaved = saved.includes(person.id);
  const isUsta = person.kind === "usta";
  const directions = person.specialty.split(/[,;/]+/).map((item) => item.trim()).filter(Boolean);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: person?.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNote("Havola nusxalandi");
    } catch {
      /* cancelled */
    }
  }

  return (
    <SpecialistsFrame showPromo={false} headerQuery={query} onHeaderQuery={setQuery} onHeaderSubmit={(value) => router.push(value ? `/mutaxassislar?q=${encodeURIComponent(value)}` : "/mutaxassislar")}>
      <div className="mpf" data-testid="spec-profile">
        <nav className="mpf-crumbs">
          <Link href="/mutaxassislar"><ArrowLeft /> Mutaxassislar</Link>
          {directions[0] ? <><ChevronRight /><Link href={`/mutaxassislar?q=${encodeURIComponent(directions[0])}`}>{directions[0]}</Link></> : null}
          <ChevronRight />
          <b>{person.name}</b>
        </nav>

        <section className="mpf-hero">
          <div className="mpf-photo">
            {photo ? <img src={photo} alt="" /> : <span>{initials(person.name)}</span>}
            <em>{isUsta ? <Wrench /> : <Stethoscope />} {isUsta ? "Usta" : "Shifokor"}</em>
          </div>
          <div className="mpf-main">
            <div className="mpf-title">
              <h1>{person.name}</h1>
              <span className="acts">
                <button type="button" className={isSaved ? "on" : undefined} aria-pressed={isSaved} aria-label="Saqlash" onClick={() => setSaved(isSaved ? saved.filter((item) => item !== person.id) : [...saved, person.id])}>
                  <Heart fill={isSaved ? "currentColor" : "none"} />
                </button>
                <button type="button" aria-label="Ulashish" onClick={() => void share()}><Share2 /></button>
              </span>
            </div>
            <p className="role">{person.specialty || (isUsta ? "Usta" : "Stomatolog")}</p>
            <p className="meta">
              {person.city ? <span><MapPin /> {person.city}, O‘zbekiston</span> : null}
              {person.clinic ? <span><Building2 /> {person.clinic}</span> : null}
            </p>
            {directions.length ? <div className="tags">{directions.map((item) => <span key={item}>{item}</span>)}</div> : null}
            {person.about ? <blockquote>“{person.about.length > 240 ? `${person.about.slice(0, 240)}…` : person.about}”</blockquote> : null}
            <div className="cta">
              {isUsta ? (
                <Link href={person.href} className="go"><Wrench /> Usta profili va aloqa</Link>
              ) : (
                <Link href={`/community?q=${encodeURIComponent(person.name)}`} className="go"><MessagesSquare /> Community’da savol berish</Link>
              )}
              <Link href={`/mutaxassislar?q=${encodeURIComponent(person.city || person.specialty)}`} className="ghost">O‘xshash mutaxassislar</Link>
            </div>
          </div>
        </section>

        <div className="mpf-grid">
          <section className="mpf-card">
            <h2>Mutaxassis haqida</h2>
            <p className="copy">{person.about || "Mutaxassis hali o‘zi haqida batafsil yozmagan."}</p>
            <div className="mpf-facts">
              <div><i><UserRound /></i><span><b>{isUsta ? "Usta" : "Shifokor"}</b><small>Profil turi</small></span></div>
              {person.specialty ? <div><i><Stethoscope /></i><span><b>{directions[0] ?? person.specialty}</b><small>Mutaxassislik</small></span></div> : null}
              {person.city ? <div><i><MapPin /></i><span><b>{person.city}</b><small>Ishlash manzili</small></span></div> : null}
            </div>
          </section>

          <aside className="mpf-side">
            <section className="mpf-card">
              <h2>Klinika</h2>
              {person.clinic ? (
                <>
                  <p className="clinic"><i><Building2 /></i><span><b>{person.clinic}</b>{person.city ? <small><MapPin /> {person.city}</small> : null}</span></p>
                  {sameClinic.length ? <p className="muted">Shu klinikada yana {sameClinic.length} ta mutaxassis.</p> : null}
                  <Link className="link" href={`/mutaxassislar?q=${encodeURIComponent(person.clinic)}`}>Klinika mutaxassislari <ArrowRight /></Link>
                </>
              ) : (
                <p className="muted">Klinika ko‘rsatilmagan.</p>
              )}
            </section>
          </aside>
        </div>

        {similar.length ? (
          <section className="mpf-similar">
            <h2>Boshqa mutaxassislar <Link href="/mutaxassislar">Barchasini ko‘rish <ArrowRight /></Link></h2>
            <div>
              {similar.map((item) => {
                const src = resolveStoredImage(item.image);
                return (
                  <Link key={item.id} href={item.href} className="sim">
                    {src ? <img src={src} alt="" /> : <span className="ini">{initials(item.name)}</span>}
                    <span><b>{item.name}</b><small>{item.specialty || "Stomatolog"}</small>{item.city ? <small><MapPin /> {item.city}</small> : null}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
        {note ? <p className="mpf-toast" role="status">{note}</p> : null}
      </div>
    </SpecialistsFrame>
  );
}
