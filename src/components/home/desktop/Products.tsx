"use client";
/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { formatMoney } from "@/lib/format";
import { SectionHead } from "./Seminars";

export default function Products() {
  const { add } = useCart();
  const favorites = useFavorites();
  const [rows, setRows] = useState<CatalogCard[] | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    void fetchCatalogProducts().then((items) => {
      if (!stop) setRows(items.slice(0, 6));
    });
    return () => {
      stop = true;
    };
  }, []);

  return (
    <section className="sh-prod">
      <SectionHead title="Mashhur mahsulotlar" href="/marketplace" />
      {rows === null ? (
        <p className="sh-empty">Yuklanmoqda...</p>
      ) : rows.length === 0 ? (
        <p className="sh-empty">Hozircha mahsulot yo‘q</p>
      ) : (
        <div className="grid">
          {rows.map((item) => (
            <article className="card" key={item.id}>
              <div className="ph">
                <Link href={`/marketplace/${item.id}`}>{item.image ? <img src={item.image} alt="" /> : null}</Link>
                <button type="button" className={"fav" + (favorites.has(item.id) ? " on" : "")} aria-label="Sevimli" onClick={() => favorites.toggle(item.id)}>
                  <Heart className="i" />
                </button>
              </div>
              <h6>
                <Link href={`/marketplace/${item.id}`}>{item.name}</Link>
              </h6>
              <div className="ft">
                <strong>{formatMoney(item.price, "UZS")}</strong>
                <button
                  type="button"
                  className={"btn-teal cart" + (added === item.id ? " pulse" : "")}
                  aria-label="Savatga"
                  onClick={() => {
                    add(item.id, productFromCatalog(item));
                    setAdded(item.id);
                    window.setTimeout(() => setAdded(null), 400);
                  }}
                >
                  <ShoppingCart className="i" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
