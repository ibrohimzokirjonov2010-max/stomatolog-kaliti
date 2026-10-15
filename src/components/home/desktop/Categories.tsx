/* eslint-disable @next/next/no-img-element -- home design CSS sizes raw img elements */
import Link from "next/link";
import { categories } from "@/lib/bosh-sahifa-data";
import { SectionHead } from "./Seminars";

const hrefs: Record<string, string> = {
  "Stomatologik materiallar": "/marketplace?cat=materiallar",
  Implantlar: "/marketplace?cat=implantlar",
  "Asbob-uskunalar": "/marketplace?cat=asboblar",
  "Klinik uskunalar": "/marketplace?cat=jihozlar",
  Laboratoriya: "/laboratoriya",
  Forma: "/forma",
  Boshqa: "/marketplace",
};

export default function Categories() {
  return (
    <section className="sh-cat">
      <SectionHead title="Kategoriyalar" href="/marketplace" />
      <div className="grid">
        {categories.map(([t, img]) => {
          const href = hrefs[t];
          const inner = (
            <>
              <div className="ph">{img ? <img src={img} alt="" /> : <span className="more">•••</span>}</div>
              <span>{t}</span>
            </>
          );
          return href ? (
            <Link className="tile" href={href} key={t}>{inner}</Link>
          ) : (
            <div className="tile" key={t}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
