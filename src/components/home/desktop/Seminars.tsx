"use client";
/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import Link from "next/link";
import { ArrowRight, MapPin, User } from "lucide-react";
import { useSeminarRegs } from "@/components/seminar-provider";
import { seminarHref, seminars, seminarDayMonth } from "@/data/seminars";

export function SectionHead({ title, link = "Barchasini ko‘rish", href, extra }: { title: string; link?: string; href: string; extra?: boolean }) {
  return (
    <div className="sh-head">
      <h3>{title}</h3>
      <Link href={href}>{link} <ArrowRight className="i" /></Link>
      {extra && <ArrowRight className="i ghost" />}
    </div>
  );
}

export default function Seminars() {
  useSeminarRegs();
  const rows = seminars.filter((item) => item.date).slice(0, 3);
  return (
    <section className="sh-sem">
      <SectionHead title="Yaqin seminarlar" href="/seminarlar" extra />
      {rows.length === 0 ? (
        <p className="sh-empty">Hozircha seminar yo‘q</p>
      ) : (
        <div className="grid">
          {rows.map((s) => (
            <article className="card" key={s.id}>
              <div className="ph">{s.image ? <img src={s.image} alt="" /> : null}<span className="date"><b>{seminarDayMonth(s.date)}</b></span></div>
              <div className="bd">
                <h5>{s.title}</h5><p>{s.venue}</p>
                <div className="meta"><span><MapPin className="i" />{s.city}</span><span><User className="i" />{s.speaker}</span></div>
                <div className="ft"><strong>{s.price ? `${s.price.toLocaleString("ru-RU")} so‘m` : "Bepul"}</strong><Link className="btn-teal sm" href={seminarHref(s.id)}>Batafsil</Link></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
