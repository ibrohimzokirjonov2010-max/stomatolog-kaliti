"use client";
/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, ShoppingCart, ArrowRight, Star, ShieldCheck, Truck, CreditCard, Smile } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { fetchCatalog, productFromCatalog, type CatalogCard, type CatalogShop } from "@/lib/catalog-client";
import { formatMoney } from "@/lib/format";

const reasons: [LucideIcon, string, string][] = [
  [ShieldCheck, "Tasdiqlangan sotuvchilar", "Ishonchli hamkorlar"],
  [Truck, "Tez yetkazib berish", "Barcha hududlarga"],
  [Smile, "Stomatologlar uchun", "Maxsus tanlangan assortiment"],
  [CreditCard, "Qulay to‘lov usullari", "Click, Payme, Uzum va boshqalar"],
];

export default function RightRail() {
  const { add } = useCart();
  const router = useRouter();
  const [offer, setOffer] = useState<CatalogCard | null>(null);
  const [shops, setShops] = useState<Array<CatalogShop & { count: number }> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stop = false;
    void fetchCatalog().then(({ products, shops: live }) => {
      if (stop) return;
      const discounted = products.find((item) => (item.discount ?? 0) > 0 && item.oldPrice);
      setOffer(discounted ?? products[0] ?? null);
      const counts = new Map<string, number>();
      for (const item of products) {
        if (item.shopId) counts.set(item.shopId, (counts.get(item.shopId) ?? 0) + 1);
      }
      setShops(live.slice(0, 3).map((shop) => ({ ...shop, count: counts.get(shop.id) ?? 0 })));
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);

  return (
    <aside className="sh-rail">
      <section className="box offer">
        <div className="hd">
          <h3>Maxsus takliflar</h3>
          <Link href="/marketplace/aksiyalar" aria-label="Barcha aksiyalar">
            <ChevronRight className="i chev" />
          </Link>
        </div>
        {!ready ? (
          <p className="sh-empty">Yuklanmoqda...</p>
        ) : !offer ? (
          <p className="sh-empty">Hozircha taklif yo‘q</p>
        ) : (
          <div className="in">
            {offer.image ? <img src={offer.image} alt="" /> : <span />}
            <div>
              <h4>
                <Link href={`/marketplace/${offer.id}`}>{offer.name}</Link>
              </h4>
              {offer.discount ? <span className="pct">-{offer.discount}%</span> : null}
              {offer.oldPrice ? <s>{formatMoney(offer.oldPrice, "UZS")}</s> : null}
              <strong>{formatMoney(offer.price, "UZS")}</strong>
              <button type="button" className="btn-teal cart" aria-label="Savatga" onClick={() => add(offer.id, productFromCatalog(offer))}>
                <ShoppingCart className="i" />
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="box sellers">
        <div className="hd">
          <h3>Top sotuvchilar</h3>
          <Link href="/marketplace">
            Barchasi <ArrowRight className="i" />
          </Link>
        </div>
        {!ready ? (
          <p className="sh-empty">Yuklanmoqda...</p>
        ) : !shops || shops.length === 0 ? (
          <p className="sh-empty">Hozircha do‘kon yo‘q</p>
        ) : (
          shops.map((shop) => (
            <div className="row" key={shop.id}>
              {shop.logo ? <img src={shop.logo} alt="" /> : <span className="nm">{shop.name.slice(0, 1)}</span>}
              <div className="nm">
                <b>{shop.name}</b>
                <small>
                  {shop.count} mahsulot{shop.city ? ` · ${shop.city}` : ""}
                </small>
              </div>
              <button type="button" onClick={() => router.push(`/marketplace/dokon/${shop.slug}`)}>
                Do‘konga kirish
              </button>
            </div>
          ))
        )}
      </section>
      <section className="box why">
        <h3>Nega StomaHub?</h3>
        <div className="g">
          {reasons.map(([Icon, title, text]) => (
            <div className="f" key={title}>
              <span className="ic">
                <Icon className="i" />
              </span>
              <div>
                <b>{title}</b>
                <small>{text}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
