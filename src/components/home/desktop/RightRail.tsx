"use client";
/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { AlarmClock, ChevronRight, Crown, ShoppingCart, ArrowRight, Star, ShieldCheck, Truck, CreditCard, Smile } from "lucide-react";
import { sellers } from "@/lib/bosh-sahifa-data";
import { useCart } from "./CartContext";
function Countdown({ secs }: { secs: number }) {
  const [s, setS] = useState(secs);
  useEffect(() => { const t = setInterval(() => setS((x) => (x > 0 ? x - 1 : secs)), 1000); return () => clearInterval(t); }, [secs]);
  const f = (n: number) => String(n).padStart(2, "0");
  return <span className="timer"><AlarmClock className="i" />{f(Math.floor(s / 3600))}:{f(Math.floor((s % 3600) / 60))}:{f(s % 60)}</span>;
}
const reasons: [LucideIcon, string, string][] = [
  [ShieldCheck, "Tasdiqlangan sotuvchilar", "Ishonchli hamkorlar"],
  [Truck, "Tez yetkazib berish", "Barcha hududlarga"],
  [Smile, "Stomatologlar uchun", "Maxsus tanlangan assortiment"],
  [CreditCard, "Qulay to‘lov usullari", "Click, Payme, Uzum va boshqalar"],
];

export default function RightRail() {
  const { add } = useCart();
  const router = useRouter();
  return (
    <aside className="sh-rail">
      <Link className="sh-pro" href="/marketing">
        <span className="crown">
          <Crown className="i" />
        </span>
        <b>StomaHub Pro</b>
        <small>Klinikangiz uchun yana ko‘proq imkoniyatlar</small>
        <span className="go">
          Batafsil <ChevronRight className="i" />
        </span>
      </Link>
      <section className="box offer">
        <div className="hd"><h3>Maxsus takliflar</h3><Countdown secs={2 * 3600 + 18 * 60 + 45} /><ChevronRight className="i chev" /></div>
        <div className="in">
          <img src="/img/endo.jpg" alt="" />
          <div><h4>Endomotor Pro-X</h4><span className="pct">-25%</span><s>28 500 000 so‘m</s><strong>21 250 000 so‘m</strong>
            <button className="btn-teal cart" aria-label="Savatga" onClick={() => add({ id: "home-endomotor-pro-x", name: "Endomotor Pro-X", price: 21_250_000, image: "/img/endo.jpg", href: "/marketplace?q=Endomotor" })}><ShoppingCart className="i" /></button></div>
        </div>
      </section>
      <section className="box sellers">
        <div className="hd"><h3>Top sotuvchilar</h3><Link href="/marketplace">Barchasi <ArrowRight className="i" /></Link></div>
        {sellers.map(([n, c, r], k) => (
          <div className="row" key={n}>
            <img src={`/img/s${k}.png`} alt="" />
            <div className="nm"><b>{n}</b><small>{c}</small></div>
            <span className="rt"><Star className="i" />{r}</span>
            <button type="button" onClick={() => router.push("/marketplace")}>Do‘konga kirish</button>
          </div>
        ))}
      </section>
      <section className="box why">
        <h3>Nega StomaHub?</h3>
        <div className="g">
          {reasons.map(([Icon, title, text]) => (
            <div className="f" key={title}><span className="ic"><Icon className="i" /></span><div><b>{title}</b><small>{text}</small></div></div>
          ))}
        </div>
      </section>
    </aside>
  );
}
