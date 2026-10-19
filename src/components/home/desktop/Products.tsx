"use client";
/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { products } from "@/lib/bosh-sahifa-data";
import { SectionHead } from "./Seminars";
import { useCart } from "./CartContext";
export default function Products() {
  const { add } = useCart();
  const [fav, setFav] = useState<Record<number, boolean>>({});
  const [added, setAdded] = useState<number | null>(null);
  return (
    <section className="sh-prod">
      <SectionHead title="Mashhur mahsulotlar" href="/marketplace" />
      <div className="grid">
        {products.map(([t, p], k) => (
          <article className="card" key={t}>
            <div className="ph"><img src={`/img/p${k}.jpg`} alt="" />
              <button className={"fav" + (fav[k] ? " on" : "")} aria-label="Sevimli" onClick={() => setFav({ ...fav, [k]: !fav[k] })}><Heart className="i" /></button>
            </div>
            <h6>{t}</h6>
            <div className="ft"><strong>{p}</strong>
              <button className={"btn-teal cart" + (added === k ? " pulse" : "")} aria-label="Savatga" onClick={() => { add(); setAdded(k); setTimeout(() => setAdded(null), 400); }}><ShoppingCart className="i" /></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
