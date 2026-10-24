"use client";
/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Static banners. The home design is not a carousel. */
export default function Hero() {
  return (
    <div className="sh-hero-row">
      <section className="sh-hero">
        <div className="slide on">
          <img src="/img/hero.jpg" alt="" />
          <div className="txt">
            <h1>Sifatli stomatologik mahsulotlar endi yanada yaqinroq</h1>
            <p>Stomatologlar uchun eng yaxshi brendlar, tez yetkazib berish, ishonchli sotuvchilar.</p>
            <Link className="btn-teal" href="/marketplace">Xarid qilish <ArrowRight className="i" /></Link>
          </div>
        </div>
      </section>
      <section className="sh-implant">
        <div className="slide on">
          <img src="/img/implant.jpg" alt="" />
          <div className="txt">
            <h2>Implant yechimlari</h2>
            <p>Dunyoga mashhur brendlar endi StomaHub’da</p>
            <Link href="/marketplace?cat=implantlar">Katalogni ko‘rish <ArrowRight className="i" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
