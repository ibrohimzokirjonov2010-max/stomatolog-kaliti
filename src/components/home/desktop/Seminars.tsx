/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import Link from "next/link";
import { ArrowRight, MapPin, User } from "lucide-react";
import { seminars } from "@/lib/bosh-sahifa-data";

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
  return (
    <section className="sh-sem">
      <SectionHead title="Yaqin seminarlar" href="/seminarlar" extra />
      <div className="grid">
        {seminars.map((s) => (
          <article className="card" key={s.title}>
            <div className="ph"><img src={s.img} alt="" /><span className="date"><b>{s.d}</b>{s.m}</span></div>
            <div className="bd">
              <h5>{s.title}</h5><p>{s.sub}</p>
              <div className="meta"><span><MapPin className="i" />{s.city}</span><span><User className="i" />{s.doc}</span></div>
              <div className="ft"><strong>{s.price}</strong><Link className="btn-teal sm" href="/seminarlar">Batafsil</Link></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
