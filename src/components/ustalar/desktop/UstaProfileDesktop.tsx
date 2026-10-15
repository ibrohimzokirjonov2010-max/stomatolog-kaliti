"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle, Phone, ShieldCheck, Star } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { getDesktopUsta, type DesktopUsta } from "@/data/desktop-ustalar";
import "./usta.css";

export function UstaProfileDesktop({ slug }: { slug: string }) {
  const person = getDesktopUsta(slug);
  if (!person) return null;
  return <View person={person} />;
}

function View({ person }: { person: DesktopUsta }) {
  const cartCount = useShopLineCount();
  const [note, setNote] = useState("");
  const [moreWorks, setMoreWorks] = useState(false);
  const [moreReviews, setMoreReviews] = useState(false);
  const works = moreWorks ? person.works : person.works.slice(0, 4);
  const reviews = moreReviews ? person.reviewList : person.reviewList;

  return (
    <ShopShell searchPath="/ustalar" cartCount={cartCount} placeholder="Usta, xizmat yoki brend bo‘yicha qidiring..." showCamera={false}>
      <div className="ut-page">
        <div className="ut-crumbs">
          <Link href="/community">Xizmatlar</Link><span>›</span>
          <Link href="/ustalar">Ustalar</Link><span>›</span>
          <b>{person.name}</b>
        </div>
        <div className="ut-top">
          <img className="ut-hero" src={person.image} alt="" />
          <section>
            <h1>{person.name} <span className="ut-verified"><BadgeCheck className="i" /> Tasdiqlangan</span></h1>
            <p className="ut-role">{person.role}</p>
            <div className="ut-stats">
              <span><MapPin className="i" /> {person.city}</span>
              <span>{person.years} yil tajriba</span>
              <span>{person.jobs} bajarilgan ish</span>
              <span>Javob vaqti: {person.response}</span>
            </div>
            <p className="ut-meta"><Star className="i" style={{ color: "#f5b400", fill: "#f5b400" }} /> <b>{person.rating.toFixed(1)}</b> ({person.reviews} sharh)</p>
            <div className="ut-cta">
              <button type="button" className="ut-order" onClick={() => setNote(`Qo‘ng‘iroq: ${person.phone}`)}><Phone className="i" /> Qo‘ng‘iroq qilish</button>
              <button type="button" className="ut-order" onClick={() => setNote(`${person.name} ga buyurtma qabul qilindi.`)}>Buyurtma berish</button>
              <button type="button" className="ut-call" onClick={() => setNote(`Xabar yuborildi · @${person.telegram}`)}><MessageCircle className="i" /> Xabar yozish</button>
            </div>
            <h3 style={{ fontSize: "calc(.68 * var(--u))", margin: "calc(.3 * var(--u)) 0 calc(.2 * var(--u))" }}>Mutaxassislik va ko‘nikmalar</h3>
            <div className="ut-skills">{person.skills.map((skill) => <span className="ut-skill" key={skill}>{skill}</span>)}</div>
            <h3 style={{ fontSize: "calc(.68 * var(--u))", margin: "calc(.4 * var(--u)) 0 calc(.15 * var(--u))" }}>Brendlar bo‘yicha tajriba</h3>
            <div className="ut-brands">{person.brands.map((brand) => <span key={brand}>{brand}</span>)}</div>
            {note ? <p className="ut-note">{note}</p> : null}
          </section>
          <aside className="ut-rail">
            <section className="ut-box">
              <h3>Ish vaqti</h3>
              <p className="ut-meta">Dushanba – Shanba</p>
              <b>{person.hours}</b>
              <p className="ut-meta">Yakshanba</p>
              <span className="ut-meta">{person.weekend}</span>
            </section>
            <section className="ut-box">
              <h3><MapPin className="i" /> Xizmat hududi</h3>
              {person.areas.map((area) => (
                <div className="ut-prices" key={area.place}><div><span>{area.place}</span><b>{area.time}</b></div></div>
              ))}
            </section>
            <section className="ut-box">
              <h3><ShieldCheck className="i" /> Kafolat</h3>
              <p>Bajarilgan ishlar uchun {person.warranty} kafolat.</p>
              <p className="ut-meta">Agar muammo takrorlansa, bepul xizmat ko‘rsatiladi.</p>
            </section>
          </aside>
        </div>
        <div className="ut-mid">
          <section className="ut-box">
            <h3>Xizmatlar va narxlar</h3>
            <table className="ut-table">
              <thead><tr><th>Xizmat turi</th><th>Narx (so‘m)</th><th>Izoh</th></tr></thead>
              <tbody>
                {person.serviceRows.map((row) => (
                  <tr key={row.name}><td>{row.name}</td><td>{row.price}</td><td>{row.note}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ut-box">
            <h3>Bajarilgan ishlar <button type="button" onClick={() => setMoreWorks(true)}>Barchasini ko‘rish</button></h3>
            <div className="ut-works">{works.map((src) => <img key={src} src={src} alt="" />)}</div>
          </section>
        </div>
        <div className="ut-reviews">
          <section>
            <h3 style={{ display: "flex", justifyContent: "space-between" }}>Sharhlar ({person.reviews}) <button type="button" onClick={() => setMoreReviews(true)}>Barchasini ko‘rish</button></h3>
            <div className="ut-revgrid">
              {reviews.map((review) => (
                <article className="ut-rev" key={review.name}>
                  <b>{review.name}</b>
                  <span>{review.clinic} · {review.date}</span>
                  <div>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
                  <p>{review.text}</p>
                </article>
              ))}
            </div>
            {moreReviews ? <p className="ut-note">Ko‘rsatilgan sharhlar namunasi. Jami {person.reviews} ta.</p> : null}
          </section>
          <section className="ut-box">
            <h3><Star className="i" style={{ color: "#22a06b" }} /> Reyting taqsimoti</h3>
            <b style={{ fontSize: "calc(1.2 * var(--u))" }}>{person.rating.toFixed(1)} / 5</b>
            <p className="ut-meta">{person.reviews} sharh asosida</p>
            {person.stars.map((value, index) => (
              <div className="ut-bar" key={index}><span>{5 - index}</span><i><b style={{ width: `${value}%` }} /></i><span>{value}%</span></div>
            ))}
          </section>
        </div>
      </div>
    </ShopShell>
  );
}
