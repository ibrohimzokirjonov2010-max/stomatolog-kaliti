"use client";
/* eslint-disable @next/next/no-img-element -- profile photo is sized by the shell */

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, MapPin, Phone, Star } from "lucide-react";
import { getSpecialist } from "@/data/desktop-specialists";
import { SpecChat, SpecialistsFrame } from "./MutaxassislarDesktop";
import "@/components/ustalar/desktop/usta.css";
import "./mutaxassislar.css";

export function MutaxassisProfileDesktop({ id }: { id: string }) {
  const person = getSpecialist(id);
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [chat, setChat] = useState(params.get("aloqa") === "1");

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

  return (
    <SpecialistsFrame headerQuery={query} onHeaderQuery={setQuery} onHeaderSubmit={(value) => router.push(value ? `/mutaxassislar?q=${encodeURIComponent(value)}` : "/mutaxassislar")}>
      <div className="ut-page" data-testid="spec-profile">
        <div className="ut-crumbs">
          <Link href="/mutaxassislar">Mutaxassislar</Link>
          <span>›</span>
          <b>{person.name}</b>
        </div>
        <div className="ut-top">
          <img className="ut-hero" src={person.image} alt="" />
          <section>
            <h1>
              {person.name}{" "}
              <span className="ut-verified">
                <BadgeCheck className="i" /> Tasdiqlangan
              </span>
            </h1>
            <p className="ut-role">{person.specialtyLabel}</p>
            <div className="ut-stats">
              <span>
                <MapPin className="i" /> {person.city}
              </span>
              <span>{person.experience}</span>
              <span>{person.patientsLabel}</span>
              <span>{person.clinic}</span>
            </div>
            <p className="ut-meta">
              <Star className="i" style={{ color: "#f5b400", fill: "#f5b400" }} /> <b>{person.rating.toFixed(1)}</b> ({person.reviews} ta sharh)
            </p>
            <div className="ut-cta">
              <button type="button" className="ut-order" data-testid="spec-profile-contact" onClick={() => setChat(true)}>
                Bog‘lanish
              </button>
              <button type="button" className="ut-call" onClick={() => setNote(`Qo‘ng‘iroq: ${person.phone}`)}>
                <Phone className="i" /> Qo‘ng‘iroq qilish
              </button>
            </div>
            {note ? (
              <p className="ut-note" data-testid="spec-profile-note">
                {note}
              </p>
            ) : null}
            <h3 style={{ fontSize: "calc(.68 * var(--u))", margin: "calc(.35 * var(--u)) 0 calc(.2 * var(--u))" }}>Mutaxassislik</h3>
            <div className="ut-skills">
              {person.skills.map((skill) => (
                <span className="ut-skill" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
            <p className="ut-meta" style={{ marginTop: "calc(.4 * var(--u))" }}>
              {person.about}
            </p>
          </section>
          <aside className="ut-rail">
            <section className="ut-box">
              <h3>Klinika</h3>
              <b>{person.clinic}</b>
              <p className="ut-meta">{person.city}</p>
              <p className="ut-meta">Qabul: Dushanba – Shanba</p>
              <b>{person.hours}</b>
            </section>
            <section className="ut-box">
              <h3>Aloqa</h3>
              <p>{person.phone}</p>
              <p className="ut-meta">{person.online ? "Hozir onlayn" : "Qabul bo‘yicha yozing"}</p>
            </section>
          </aside>
        </div>
        <div className="ut-reviews">
          <section>
            <h3 style={{ fontSize: "calc(.78 * var(--u))", marginTop: 0 }}>Sharhlar ({person.reviews})</h3>
            <div className="ut-revgrid">
              {person.reviewList.map((item) => (
                <article className="ut-rev" key={item.name}>
                  <b>{item.name}</b>
                  <span>{item.date}</span>
                  <div>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</div>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="ut-box">
            <h3>
              <Star className="i" style={{ color: "#22a06b" }} /> Reyting
            </h3>
            <b style={{ fontSize: "calc(1.2 * var(--u))" }}>{person.rating.toFixed(1)} / 5</b>
            <p className="ut-meta">{person.reviews} ta sharh asosida</p>
          </section>
        </div>
        {chat ? <SpecChat person={person} onClose={() => setChat(false)} /> : null}
      </div>
    </SpecialistsFrame>
  );
}
