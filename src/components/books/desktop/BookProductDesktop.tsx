"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { shopAdd, som } from "@/components/shop/desktop/shop-cart";
import { atlasEditions } from "@/data/desktop-hub";
import "./book-desktop.css";

const RELATED: { title: string; author: string; price: number; image: string }[] = [
  { title: "Clinical Periodontology", author: "Lang & Lindhe", price: 420000, image: "/img/designs/rel-0.png" },
  { title: "Endodontic Microsurgery", author: "Taschieri", price: 380000, image: "/img/designs/rel-1.png" },
  { title: "Esthetic Restorative Dentistry", author: "Ritter, Boushell", price: 395000, image: "/img/designs/rel-2.png" },
  { title: "Oral and Maxillofacial Surgery", author: "Miloro", price: 510000, image: "/img/designs/rel-3.png" },
  { title: "Dental Anatomy", author: "Nelson", price: 320000, image: "/img/designs/rel-4.png" },
];
const CHAPTERS = [
  "Basics of Implant Therapy",
  "Treatment Planning",
  "Surgical Procedures",
  "Hard and Soft Tissue Management",
  "Prosthetic Considerations",
  "Clinical Cases",
];

export function BookProductDesktop({ id }: { id: string }) {
  const [format, setFormat] = useState<"paper" | "pdf">("paper");
  const [tab, setTab] = useState<"tavsif" | "mundarija" | "sharh">("tavsif");
  const [more, setMore] = useState(false);
  const [added, setAdded] = useState(false);
  const [openChapter, setOpenChapter] = useState("");
  const edition = atlasEditions[format];
  const price = edition.price;

  function add() {
    shopAdd({ id: edition.id, name: edition.name, price, image: edition.image, href: `/kitoblar/${id}`, seller: "Quintessence" });
    setAdded(true);
  }

  return (
    <ClinicShell accent="blue">
      <div className="bkx" data-testid="book-desktop">
        <div className="bkx-crumb"><Link href="/marketplace">Do‘kon</Link><span>›</span><Link href="/kitoblar">Kitoblar</Link><span>›</span><span>Stomatologiya</span><span>›</span><b>Atlas of Dental Implantology</b></div>
        <div className="bkx-hero">
          <img className="bkx-cover" src="/img/designs/atlas-cover.png" alt="Atlas of Dental Implantology" />
          <div>
            <h1>Atlas of Dental Implantology</h1>
            <p className="bkx-author">Muallif: Myron Nevins, Hom-Lay Wang</p>
            <p className="bkx-stars">★★★★★ <b>4.9</b> <span>(128 ta sharh)</span></p>
            <p className="bkx-price">{som(price)}</p>
            <div className="bkx-label">Formatni tanlang</div>
            <div className="bkx-formats">
              <button type="button" className={format === "paper" ? "on" : undefined} onClick={() => setFormat("paper")}><b>Qog‘oz nashr</b><span>{som(atlasEditions.paper.price)}</span></button>
              <button type="button" className={format === "pdf" ? "on" : undefined} onClick={() => setFormat("pdf")}><b>Elektron nashr (PDF)</b><span>{som(atlasEditions.pdf.price)}</span></button>
            </div>
            <div className="bkx-actions">
              <Link href={`/kitoblar/${id}/oqish`} data-testid="book-read">O‘qib ko‘rish (1-bob)</Link>
              <button type="button" data-testid="book-cart" onClick={add}>{added ? "Savatga qo‘shildi" : "Savatga qo‘shish"}</button>
              <Link href="/buyurtma" className="buy">Sotib olish</Link>
            </div>
            <div className="bkx-trust">
              <span><b>Tez yetkazib berish</b><small>Toshkent 1–2 kun</small></span>
              <span><b>Original mahsulot</b><small>Rasmiy nashr</small></span>
              <span><b>Qulay to‘lov</b><small>Click, Payme, Uzum</small></span>
              <span><b>Qo‘llab-quvvatlash</b><small>Savollar bo‘yicha yordam</small></span>
            </div>
          </div>
          <aside className="bkx-facts">
            <h2>Kitob ma’lumotlari</h2>
            <div><span>Sahifalar</span><b>592 sahifa</b></div>
            <div><span>Til</span><b>Inglizcha</b></div>
            <div><span>Nashriyot</span><b>Quintessence</b></div>
            <div><span>Nashr yili</span><b>2021</b></div>
            <div><span>ISBN</span><b>978-1-78698-087-0</b></div>
            <div><span>Muqova</span><b>Qattiq muqova</b></div>
          </aside>
        </div>
        <div className="bkx-main">
          <div>
            <div className="bkx-tabs">
              {([["tavsif", "Tavsif"], ["mundarija", "Mundarija"], ["sharh", "Sharhlar (128)"]] as const).map(([key, label]) => (
                <button key={key} type="button" className={tab === key ? "on" : undefined} onClick={() => setTab(key)}>{label}</button>
              ))}
            </div>
            {tab === "tavsif" ? (
              <div className="bkx-copy">
                <p>Atlas of Dental Implantology — implantologiya sohasidagi eng nufuzli va amaliy atlaslardan biri. Ushbu kitobda dental implantlar bo‘yicha jarrohlik va protetik bosqichlar yuqori sifatli klinik rasmlar, bosqichma-bosqich izohlar va real klinik holatlar asosida ko‘rsatilgan. Talabalar, shifokorlar va implantologlar uchun muhim qo‘llanma.</p>
                {more ? <p>Nashr Quintessence Publishing tomonidan 2021-yilda chop etilgan. 592 sahifa, qattiq muqova, ISBN 978-1-78698-087-0.</p> : null}
                <button type="button" onClick={() => setMore((value) => !value)}>{more ? "Yig‘ish" : "Ko‘proq o‘qish"}</button>
              </div>
            ) : null}
            {tab === "mundarija" ? (
              <div className="bkx-toc">
                {CHAPTERS.map((title, index) => (
                  <button key={title} type="button" className={openChapter === title ? "on" : undefined} onClick={() => setOpenChapter(title)}>
                    {index + 1}. {title}
                    {openChapter === title ? <small>Bob ochildi</small> : null}
                  </button>
                ))}
              </div>
            ) : null}
            {tab === "sharh" ? (
              <div className="bkx-reviews">
                <article><b>Dr. Azizbek</b><span>★★★★★ · 12 mar 2024</span><p>Juda yaxshi atlas. Rasmlar sifati ajoyib, amaliyotda foydali ma’lumotlar ko‘p.</p></article>
                <article><b>Dr. Madina</b><span>Stomatolog · 28 fev 2024</span><p>Implantologiya bilan shug‘ullanuvchilar uchun majburiy kitob. Tavsiya qilaman!</p></article>
              </div>
            ) : null}
          </div>
          <aside className="bkx-reviews">
            <div className="bkx-saved"><h2>Sharhlar</h2><button type="button" onClick={() => setTab("sharh")}>Barchasini ko‘rish ›</button></div>
            <article><b>Dr. Azizbek</b><span>★★★★★ · 12 mar 2024</span><p>Juda yaxshi atlas. Rasmlar sifati ajoyib, amaliyotda foydali ma’lumotlar ko‘p.</p></article>
            <article><b>Dr. Madina</b><span>Stomatolog · 28 fev 2024</span><p>Implantologiya bilan shug‘ullanuvchilar uchun majburiy kitob. Tavsiya qilaman!</p></article>
          </aside>
        </div>
        <section>
          <div className="bkx-saved"><h2>O‘xshash kitoblar</h2><Link href="/kitoblar">Barchasini ko‘rish ›</Link></div>
          <div className="bkx-related">
            {RELATED.map((item) => (
              <article key={item.title}><img src={item.image} alt="" /><b>{item.title}</b><small>{item.author}</small><em>{som(item.price)}</em></article>
            ))}
          </div>
        </section>
      </div>
    </ClinicShell>
  );
}
