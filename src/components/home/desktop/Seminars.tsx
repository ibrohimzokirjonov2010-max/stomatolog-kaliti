"use client";
/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, User } from "lucide-react";
import { useSeminarRegs } from "@/components/seminar-provider";
import { formatGroupedNumber } from "@/lib/format";
import { getSeminarSpeakers, isDateTbd, isSeminarUpcoming, seminarHref, seminars as catalog, specialtyLabels } from "@/data/seminars";

const MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

export function SectionHead({ title, link = "Barchasini ko‘rish", href, extra }: { title: string; link?: string; href: string; extra?: boolean }) {
  return (
    <div className="sh-head">
      <h3>{title}</h3>
      <Link href={href}>{link} <ArrowRight className="i" /></Link>
      {extra && <ArrowRight className="i ghost" />}
    </div>
  );
}

/** Nearest upcoming seminars from the shared catalog — same dates/prices as /seminarlar. */
export default function Seminars() {
  const { catalogVersion, liveSeminar } = useSeminarRegs();
  const items = useMemo(() => {
    void catalogVersion;
    return catalog
      .map(liveSeminar)
      .filter((s) => isSeminarUpcoming(s))
      .sort((a, b) => Number(isDateTbd(a)) - Number(isDateTbd(b)) || a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 4);
  }, [catalogVersion, liveSeminar]);

  return (
    <section className="sh-sem">
      <SectionHead title="Yaqin seminarlar" href="/seminarlar" extra />
      <div className="grid">
        {items.map((s) => {
          const tbd = isDateTbd(s);
          const [, m, d] = s.date.split("-").map(Number);
          const speaker = getSeminarSpeakers(s)[0]?.name ?? "Ma’ruzachi aniqlanmoqda";
          return (
            <article className="card" key={s.id}>
              <div className="ph">
                <img src={s.image} alt="" />
                <span className="date">
                  <b>{tbd ? "—" : String(d).padStart(2, "0")}</b>
                  {tbd ? "Sana" : MONTHS_SHORT[m - 1]}
                </span>
              </div>
              <div className="bd">
                <h5>{specialtyLabels[s.specialty].toUpperCase()}</h5>
                <p>{s.title}</p>
                <div className="meta">
                  <span><MapPin className="i" />{s.city === "Online" ? "Onlayn" : s.city}</span>
                  <span><User className="i" />{speaker}</span>
                </div>
                <div className="ft">
                  <strong>{s.price > 0 ? `${formatGroupedNumber(s.price)} so‘m` : "Bepul"}</strong>
                  <Link className="btn-teal sm" href={seminarHref(s.id)}>Batafsil</Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
