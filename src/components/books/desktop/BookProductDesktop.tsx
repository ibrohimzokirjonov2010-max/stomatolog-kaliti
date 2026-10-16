"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ShoppingCart, Star } from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { shopAdd, som, useShopLines } from "@/components/shop/desktop/shop-cart";
import { books as hubBooks, type Book as HubBook } from "@/data/desktop-hub";
import { books as eduBooks } from "@/data/education";
import "./book-desktop.css";

const TOC = [
  { title: "Kirish", page: "1" },
  { title: "Klinik ko‘rik", page: "12" },
  { title: "Kariyes va davolash", page: "45" },
  { title: "Pulpit va periodontit", page: "128" },
  { title: "Profilaktika", page: "210" },
  { title: "Amaliy holatlar", page: "260" },
];

function asHub(id: string): HubBook | undefined {
  return hubBooks.find((book) => book.id === id);
}

export function BookProductDesktop({ id }: { id: string }) {
  const hub = asHub(id);
  const edu = eduBooks.find((book) => book.id === id);
  const lines = useShopLines();
  const [tab, setTab] = useState<"tavsif" | "mundarija" | "sharh">("tavsif");
  const [savedNote, setSavedNote] = useState("");

  if (!hub && !edu) {
    return (
      <ClinicShell accent="blue">
        <div className="crm-empty" data-testid="book-missing">
          <p>Kitob topilmadi</p>
          <Link href="/kitoblar">Kitoblar</Link>
        </div>
      </ClinicShell>
    );
  }

  const title = hub?.title ?? edu!.title;
  const author = hub?.authors ?? edu!.author;
  const image = hub?.image ?? edu!.image;
  const price = hub?.price ?? 0;
  const oldPrice = hub?.oldPrice;
  const pages = hub?.pages ?? `${edu!.pages} sahifa`;
  const year = hub?.year ?? edu!.year;
  const lang = hub?.lang ?? (edu!.language === "uz" ? "O‘zbek" : edu!.language === "ru" ? "Rus" : "Ingliz");
  const rating = hub?.rating ?? 4.8;
  const reviews = hub?.reviews ?? edu!.downloads;
  const summary = hub?.sample ?? edu!.summary;
  const category = hub?.category ?? edu!.category;
  const qty = lines.find((line) => line.id === `book-${id}`)?.qty ?? 0;
  const related = hubBooks.filter((book) => book.id !== id && book.category === (hub?.category ?? "")).slice(0, 4);

  function add() {
    shopAdd({ id: `book-${id}`, name: title, price: price || 250000, image, href: `/kitoblar/${id}` });
    setSavedNote("Savatga qo‘shildi");
  }

  return (
    <ClinicShell accent="blue">
      <div data-testid="book-desktop">
        <p className="bkd-crumb"><Link href="/kitoblar">Kitoblar</Link> / {category} / {title}</p>
        <div className="bkd">
          <div className="bkd-cover">
            <img src={image} alt="" />
          </div>
          <div>
            <div className="bkd-badges">
              {hub?.badge === "best" ? <span className="amber">Bestseller</span> : null}
              {hub?.badge === "yangi" ? <span className="green">Yangi</span> : null}
              {hub?.offLabel ? <span>{hub.offLabel}</span> : null}
              <span>{category}</span>
            </div>
            <h1>{title}</h1>
            <p className="by">{author}</p>
            <p className="bkd-rate"><Star size={16} fill="#f5b301" color="#f5b301" /> {rating.toFixed(1)} ({reviews} ta sharh)</p>
            <p className="bkd-price">{price ? som(price) : "Bepul"}{oldPrice ? <s>{som(oldPrice)}</s> : null}</p>
            <div className="bkd-facts">
              <div><b>{pages}</b><span>Hajm</span></div>
              <div><b>{lang}</b><span>Til</span></div>
              <div><b>{year}</b><span>Yil</span></div>
              <div><b>{hub?.publisher ?? "StomaHub"}</b><span>Nashriyot</span></div>
            </div>
            <div className="bkd-actions">
              <Link className="bkd-read" href={`/kitoblar/${id}/oqish`} data-testid="book-read"><BookOpen size={16} /> O‘qib ko‘rish</Link>
              <button type="button" className="bkd-cart" data-testid="book-cart" onClick={add}><ShoppingCart size={16} /> {qty > 0 ? `Savatda (${qty})` : "Savatga"}</button>
            </div>
            {savedNote ? <p data-testid="book-added" style={{ color: "#16803c", fontWeight: 700 }}>{savedNote}</p> : null}
          </div>
        </div>
        <div className="bkd-tabs">
          {([["tavsif", "Tavsif"], ["mundarija", "Mundarija"], ["sharh", "Sharhlar"]] as const).map(([key, label]) => (
            <button key={key} type="button" className={tab === key ? "on" : undefined} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
        <div className="bkd-body">
          {tab === "tavsif" ? <p>{summary}</p> : null}
          {tab === "mundarija" ? TOC.map((item) => (
            <div key={item.title} className="bkd-toc"><b>{item.title}</b><span>{item.page}-bet</span></div>
          )) : null}
          {tab === "sharh" ? (
            <>
              <p><b>Dr. Dilnoza</b> — Aniq va amaliy. Klinikada qo‘llanma sifatida qulay.</p>
              <p><b>Dr. Sardor</b> — Rasmlar va bosqichlar tushunarli yozilgan.</p>
            </>
          ) : null}
        </div>
        {related.length ? (
          <div className="bkd-rel">
            {related.map((book) => (
              <Link key={book.id} href={`/kitoblar/${book.id}`}>
                <img src={book.image} alt="" />
                <div><b>{book.title}</b><span>{book.authors}</span></div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </ClinicShell>
  );
}
