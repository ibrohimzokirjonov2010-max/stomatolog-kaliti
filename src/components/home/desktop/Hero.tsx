"use client";
/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const slides = [
  { t: "Sifatli stomatologik mahsulotlar endi yanada yaqinroq", s: "Stomatologlar uchun eng yaxshi brendlar, tez yetkazib berish, ishonchli sotuvchilar.", b: "Xarid qilish", img: "/img/hero.jpg", href: "/marketplace" },
  { t: "Yangi mahsulotlar har hafta qo‘shiladi", s: "Eng so‘nggi uskunalar va materiallar bir joyda.", b: "Ko‘rish", img: "/img/hero.jpg", href: "/marketplace" },
  { t: "Maxsus takliflar va chegirmalar", s: "Mashhur brendlarga 25% gacha chegirma.", b: "Takliflar", img: "/img/hero.jpg", href: "/marketplace" },
];
const imp = [
  { t: "Implant yechimlari", s: "Dunyoga mashhur brendlar endi StomaHub’da" },
  { t: "Implant yechimlari", s: "Dunyoga mashhur brendlar endi StomaHub’da" },
  { t: "Implant yechimlari", s: "Dunyoga mashhur brendlar endi StomaHub’da" },
];
function useSlider(n: number, start = 0, ms = 5000) {
  const [i, setI] = useState(start);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % n), ms); return () => clearInterval(t); }, [n, ms, i]);
  return [i, setI] as const;
}
function Dots({ n, i, set, cls }: { n: number; i: number; set: (k: number) => void; cls: string }) {
  return <div className={cls}>{Array.from({ length: n }).map((_, k) => <button key={k} type="button" aria-label={`Slayd ${k + 1}`} className={k === i ? "on" : ""} onClick={() => set(k)} />)}</div>;
}
export default function Hero() {
  const [a, setA] = useSlider(3, 0, 6000);
  const [b, setB] = useSlider(3, 1, 7000);
  return (
    <div className="sh-hero-row">
      <section className="sh-hero">
        {slides.map((s, k) => (
          <div key={k} className={"slide" + (k === a ? " on" : "")}>
            <img src={s.img} alt="" />
            <div className="txt">
              <h1>{s.t}</h1>
              <p>{s.s}</p>
              <Link className="btn-teal" href={s.href}>{s.b} <ArrowRight className="i" /></Link>
            </div>
          </div>
        ))}
        <Dots n={3} i={a} set={setA} cls="dots" />
      </section>
      <section className="sh-implant">
        {imp.map((s, k) => (
          <div key={k} className={"slide" + (k === b ? " on" : "")}>
            <img src="/img/implant.jpg" alt="" />
            <div className="txt">
              <h2>{s.t}</h2>
              <p>{s.s}</p>
              <Link href="/marketplace?cat=implantlar">Katalogni ko‘rish <ArrowRight className="i" /></Link>
            </div>
          </div>
        ))}
        <Dots n={3} i={b} set={setB} cls="dots light" />
      </section>
    </div>
  );
}
