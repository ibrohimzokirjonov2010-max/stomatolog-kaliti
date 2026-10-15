"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Check, ChevronRight, Clock3, Heart, MapPin, MonitorPlay, Star, Stethoscope, Video } from "lucide-react";
import { som, shopToggleFav, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import {
  desktopSeminars,
  getDesktopSeminar,
  implantGear,
  implantLearnings,
  implantPerks,
  implantProgram,
  implantReviews,
  seminarHref,
  tiersFor,
  type SeminarTier,
} from "@/data/desktop-seminars";
import "./seminar.css";

function ics(title: string, date: string, start: string, end: string, location: string) {
  const stamp = date.replaceAll("-", "");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StomaHub//Seminar//UZ",
    "BEGIN:VEVENT",
    `DTSTART:${stamp}T${start.replace(":", "")}00`,
    `DTEND:${stamp}T${end.replace(":", "")}00`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const file = new Blob([body], { type: "text/calendar" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "seminar.ics";
  link.click();
  URL.revokeObjectURL(url);
}

export function SeminarDetail({ id }: { id: string }) {
  const seminar = getDesktopSeminar(id);
  const favs = useShopFavs();
  const cartCount = useShopLineCount();
  const tiers = useMemo(() => (seminar ? tiersFor(seminar) : []), [seminar]);
  const [tierId, setTierId] = useState<SeminarTier["id"]>("standart");
  const [joined, setJoined] = useState(false);
  const [pay, setPay] = useState<"Click" | "Payme" | "Uzum">("Click");
  const [allReviews, setAllReviews] = useState(false);
  if (!seminar) return null;
  const tier = tiers.find((item) => item.id === tierId) ?? tiers[0];
  const loved = favs.includes(seminar.id);
  const flagship = seminar.id === "implantdan-tojgacha";
  const learnings = flagship ? implantLearnings : [seminar.summary, seminar.about, "Sertifikat va CME ball"];
  const perks = flagship
    ? implantPerks
    : [
        { title: "Amaliy mashg‘ulotlar", text: "Kichik guruh" },
        { title: "Sertifikat beriladi", text: `CME ${seminar.cme} ball` },
        { title: "Networking", text: "Hamkasblar bilan tanishish" },
      ];
  const program = flagship
    ? implantProgram
    : [
        { time: `${seminar.start} – ${seminar.end}`, title: seminar.summary },
        { time: "Tushlik", title: "Tanaffus" },
      ];
  const gear = flagship ? implantGear : ["Shaxsiy lupa (ixtiyoriy)", "Tibbiy kiyim", "Barcha asosiy materiallar tashkilotchilar tomonidan taqdim etiladi"];
  const reviews = flagship ? implantReviews : [{ name: "Dr. Sevara Ahmedova", date: "12.02.2026", rating: 5, text: "Juda foydali va amaliy seminar. Tavsiya qilaman!" }];
  const similar = desktopSeminars.filter((item) => item.id !== seminar.id).slice(0, 2);
  const shownReviews = allReviews ? reviews : reviews.slice(0, 1);

  return (
    <ShopShell searchPath="/seminarlar" cartCount={cartCount} placeholder="Stomatologga nima kerak?" showCamera={false}>
      <div className="sd-grid" data-testid="seminar-detail">
        <div>
          <div className="dk-crumbs">
            <Link href="/seminarlar">Seminarlar</Link>
            <ChevronRight className="i" />
            <span>{seminar.category}</span>
            <ChevronRight className="i" />
            <b>{seminar.detailTitle}</b>
          </div>
          <h1 className="sd-title">
            {seminar.detailTitle}
            <button type="button" className={loved ? "sem-heart on" : "sem-heart"} aria-label="Sevimli" aria-pressed={loved} onClick={() => shopToggleFav(seminar.id)}>
              <Heart className="i" />
            </button>
          </h1>
          <p className="sd-lead">
            {flagship
              ? "Diagnostika, jarrohlik protokoli, implant o‘rnatish va implant usti protezlash bo‘yicha intensiv 2 kunlik seminar."
              : seminar.about}
          </p>
          <div className="sd-facts">
            <div className="sd-fact">
              <b>
                <Stethoscope className="i" /> {seminar.category}
              </b>
            </div>
            <div className="sd-fact">
              <b>
                <Clock3 className="i" /> {seminar.dateChip}
              </b>
              <small>{seminar.dateNote}</small>
            </div>
            <div className="sd-fact">
              <b>
                <MapPin className="i" /> {flagship ? "Toshkent" : seminar.city}
              </b>
              <small>{seminar.venueLine}</small>
            </div>
            <div className="sd-fact">
              <b>
                {seminar.format === "online" ? <MonitorPlay className="i" /> : <Video className="i" />} {seminar.formatLabel}
              </b>
              <small>{seminar.formatNote}</small>
            </div>
            <div className="sd-fact">
              <b>CME {seminar.cme} ball</b>
              <small>Xalqaro sertifikat</small>
            </div>
          </div>
          <img className="sd-hero" src={flagship ? "/img/seminars/hero.jpg" : seminar.image} alt="" />

          <div className="sd-block sd-about">
            <div>
              <h2>Seminar haqida</h2>
              <p>{seminar.about}</p>
            </div>
            <div>
              <h2>Spiker</h2>
              <div className="sd-speaker">
                <img src={flagship ? "/img/seminars/speaker.jpg" : seminar.speakerImage} alt="" />
                <div>
                  <b>{flagship ? "Dr. Aziz Karimov, PhD" : seminar.speaker}</b>
                  <small>{flagship ? "Implantolog, jarroh" : seminar.speakerRole}</small>
                  <small>
                    <Star className="i" style={{ color: "#f5b400", fill: "#f5b400" }} /> 4.9 (128 ta baho)
                  </small>
                  <small>15 yil tajriba</small>
                  <small>3000+ implant operatsiyasi</small>
                  <small>Xalqaro treninglar va sertifikatlar</small>
                  <small>{flagship ? "Toshkent, DentAll Clinic" : `${seminar.city}, ${seminar.venue}`}</small>
                </div>
              </div>
            </div>
          </div>

          <div className="sd-two">
            <section>
              <h2>Nimalarni o‘rganasiz?</h2>
              <ul className="sd-list">
                {learnings.map((item) => (
                  <li key={item}>
                    <Check className="i" /> {item}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2>Ajoyib imkoniyatlar</h2>
              <ul className="sd-list">
                {perks.map((item) => (
                  <li className="sd-perk" key={item.title}>
                    <Check className="i" />
                    <span>
                      <b>{item.title}</b>
                      <small>{item.text}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="sd-prog">
            <section>
              <h2>Dastur ({seminar.dateChip})</h2>
              {program.map((item) => (
                <div className="sd-time" key={item.time + item.title}>
                  <b>{item.time}</b>
                  <span>{item.title}</span>
                </div>
              ))}
            </section>
            <section>
              <h2>Kerakli jihozlar</h2>
              <ul className="sd-list">
                {gear.map((item) => (
                  <li key={item}>
                    <Check className="i" /> {item}
                  </li>
                ))}
              </ul>
              <h2 style={{ marginTop: "calc(.7 * var(--u))" }}>Joylashuv</h2>
              <div className="sd-venue">
                <img src="/img/seminars/venue.jpg" alt="" />
                <div>
                  <b>{flagship ? "Hyatt Regency Tashkent" : seminar.venue}</b>
                  <small style={{ display: "block", color: "#6a7c93" }}>{seminar.address}</small>
                  <a className="sd-map" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(flagship ? "Hyatt Regency Tashkent" : seminar.address)}`} target="_blank" rel="noreferrer">
                    Xaritada ochish <ChevronRight className="i" />
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>

        <aside className="sd-side">
          <section className="sem-cal sd-reg" id="royxat">
            <div className="top">
              <h3>Ro‘yxatdan o‘tish</h3>
              <span className="lefts">30 ta o‘rin qoldi</span>
            </div>
            {tiers.map((item) => (
              <button key={item.id} type="button" className={tier.id === item.id ? "sd-tier on" : "sd-tier"} onClick={() => setTierId(item.id)} aria-pressed={tier.id === item.id}>
                <div className="nm">
                  <span>{item.name}</span>
                  <span className="sd-off">-{item.discount}%</span>
                </div>
                <div className="pr">
                  {som(item.price)} <s>{som(item.oldPrice)}</s>
                </div>
                <ul>
                  {item.perks.map((perk) => (
                    <li key={perk}>
                      <Check className="i" /> {perk}
                    </li>
                  ))}
                </ul>
                <div className="sem-bar">
                  <i style={{ width: `${Math.round((item.left / item.total) * 100)}%` }} />
                </div>
                <div className="sd-seat">
                  <span>
                    {item.left}/{item.total} joy qoldi
                  </span>
                </div>
              </button>
            ))}
            <button type="button" className="pd-buy" disabled={joined} onClick={() => setJoined(true)}>
              {joined ? `Ro‘yxatdan o‘tdingiz — ${tier.name}` : "Ro‘yxatdan o‘tish"}
            </button>
            <button type="button" className="pd-ghost" onClick={() => ics(seminar.detailTitle, seminar.date, flagship ? "10:00" : seminar.start, flagship ? "18:00" : seminar.end, flagship ? "Hyatt Regency Tashkent" : seminar.venue)}>
              <CalendarPlus className="i" /> Kalendarga qo‘shish
            </button>
            <div className="sd-pay" aria-label="To‘lov usullari">
              {(["Click", "Payme", "Uzum"] as const).map((item) => (
                <button key={item} type="button" className={pay === item ? "on" : ""} onClick={() => setPay(item)}>
                  {item}
                </button>
              ))}
            </div>
            <div className="sd-cert">
              <b>Sertifikat beriladi</b>
              <div>Xalqaro namunadagi CME {seminar.cme} ball</div>
              {joined ? <div>To‘lov: {pay}</div> : null}
            </div>
          </section>

          <section className="sem-box">
            <div className="hd">
              <h3>Ishtirokchilar sharhlari</h3>
              <button type="button" className="dk-link" onClick={() => setAllReviews((value) => !value)}>
                {allReviews ? "Yig‘ish" : "Barchasini ko‘rish"}
              </button>
            </div>
            {shownReviews.map((review) => (
              <article className="pd-rev" key={review.name}>
                <b>{review.name}</b>
                <div>
                  {Array.from({ length: review.rating }, (_, index) => (
                    <Star key={index} className="i" style={{ color: "#f5b400", fill: "#f5b400", width: "0.8em" }} />
                  ))}{" "}
                  <small>{review.date}</small>
                </div>
                <p>{review.text}</p>
              </article>
            ))}
          </section>

          <section className="sem-box">
            <div className="hd">
              <h3>O‘xshash seminarlar</h3>
              <Link className="dk-link" href="/seminarlar">
                Barchasini ko‘rish
              </Link>
            </div>
            {(flagship
              ? [
                  desktopSeminars.find((item) => item.id === "sinus-noyabr"),
                  desktopSeminars.find((item) => item.id === "raqamli-implant"),
                ]
              : similar
            ).map((item) =>
              item ? (
                <Link className="sd-sim" key={item.id} href={seminarHref(item.id)}>
                  <img src={item.image} alt="" />
                  <span>
                    <b>{item.detailTitle}</b>
                    <small>
                      {item.dateChip} · {item.city}
                    </small>
                  </span>
                  <strong>{som(item.price)}</strong>
                </Link>
              ) : null,
            )}
          </section>
        </aside>
      </div>
    </ShopShell>
  );
}
