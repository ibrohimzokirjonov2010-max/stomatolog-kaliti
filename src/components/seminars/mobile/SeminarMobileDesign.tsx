"use client";
/* eslint-disable @next/next/no-img-element -- seminar photos are sized by the fluid unit */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Briefcase, CalendarDays, ChevronRight, Clock, FileCheck2, GraduationCap, Heart, MapPin, Play, Share2, Stethoscope, Users } from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { useSeminarRegs } from "@/components/seminar-provider";
import { type MobileSeminar } from "@/data/mobile-seminars";
import { formatMoney } from "@/lib/format";
import "./seminar-mobile.css";

const tabs = [
  { id: "umumiy", label: "Umumiy" },
  { id: "dastur", label: "Dastur" },
  { id: "maruzachi", label: "Ma’ruzachi" },
  { id: "manzil", label: "Manzil" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const featureIcons = [BookOpen, Users, Stethoscope, FileCheck2];

export function SeminarMobileDesign({ item }: { item: MobileSeminar }) {
  const router = useRouter();
  const favorites = useFavorites();
  const { occupancyOf, isRegistered } = useSeminarRegs();
  const [tab, setTab] = useState<TabId>("umumiy");
  const [more, setMore] = useState(false);
  const [sheet, setSheet] = useState<"" | "video" | "sample">("");
  const [note, setNote] = useState("");
  const favId = `seminar-${item.id}`;
  const saved = favorites.has(favId);
  const real = item.realId;
  /** Seats left come from real registrations; design samples show only the seat count. */
  const left = real ? Math.max(0, item.seats - occupancyOf(real).active) : null;
  const taken = left === null ? 0 : Math.max(0, Math.min(100, Math.round(((item.seats - left) / item.seats) * 100)));
  const registered = real ? isRegistered(real) : false;

  function onRegister() {
    if (!real) {
      setSheet("sample");
      return;
    }
    if (registered) {
      router.push("/seminarlar/yozuvlarim");
      return;
    }
    router.push(`/seminarlar/${item.id}/royxat`);
  }

  async function onShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* the note still confirms the action */
      }
    }
    setNote("Havola nusxalandi");
  }

  return (
    <div className="se lg:hidden" data-testid="mobile-seminar-detail">
      <div className="se-cover">
        <img className="photo" src={item.cover ?? item.image} alt="" />
        <span className="veil" />
        <Link href="/seminarlar" className="se-float back" aria-label="Orqaga">
          <ChevronRight style={{ transform: "rotate(180deg)" }} />
        </Link>
        <button type="button" className={saved ? "se-float heart on" : "se-float heart"} aria-label="Sevimlilar" aria-pressed={saved} onClick={() => favorites.toggle(favId)}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
        <button type="button" className="se-float share" aria-label="Ulashish" onClick={() => void onShare()}>
          <Share2 />
        </button>
        <button type="button" className="se-video" onClick={() => setSheet("video")}>
          <Play /> Video ko‘rish
        </button>
        <div className="copy">
          <div className="se-pills">
            <span>{item.formatLabel}</span>
            <span className="soft">{item.kind}</span>
          </div>
          <h1>{item.title}</h1>
          <p>
            <CalendarDays /> {item.when}
          </p>
          <p>
            <Clock /> {item.time}
          </p>
          <p>
            <MapPin /> {item.place}
          </p>
          <p>
            <Users /> {item.seats} o‘rin
          </p>
          <p>Tashkilotchi: {item.speakerOrg}</p>
          <p className="se-org">
            <i>N</i> {item.speakerOrg}
          </p>
        </div>
      </div>

      <div className="se-body">
        <section className="se-panel">
          <div>
            <b>{formatMoney(item.price, "UZS")}</b>
            <span>
              <em>-{item.discount}%</em>
              <s>{formatMoney(item.oldPrice, "UZS")}</s>
            </span>
          </div>
          <button type="button" className="se-go reg" onClick={onRegister}>
            {registered ? "Yozilgansiz" : "Ro‘yxatdan o‘tish"} <ChevronRight />
          </button>
        </section>
        {left !== null ? (
          <div>
            <p className="se-left" data-testid="se-left">
              {item.seats} o‘rindan {left} ta qoldi
            </p>
            <div className="se-bar" aria-hidden="true">
              <span style={{ width: `${taken}%` }} />
            </div>
          </div>
        ) : (
          <p className="se-left muted" data-testid="se-sample">Namuna seminar — ro‘yxat hali ochilmagan</p>
        )}

        <div className="se-tabs" role="tablist">
          {tabs.map((entry) => (
            <button key={entry.id} type="button" className={tab === entry.id ? "on" : undefined} onClick={() => setTab(entry.id)}>
              {entry.label}
            </button>
          ))}
        </div>

        {tab === "umumiy" ? (
          <>
            <section className="se-box">
              <h2>Seminar haqida</h2>
              <p>{item.about}</p>
              {more ? <p style={{ marginTop: "calc(.35 * var(--u))" }}>{item.aboutMore}</p> : null}
              <button type="button" className="se-more" onClick={() => setMore((value) => !value)}>
                {more ? "Yig‘ish" : "Batafsil"} <ChevronRight />
              </button>
            </section>
            <div className="se-feats">
              {item.features.map((feature, index) => {
                const Icon = featureIcons[index % featureIcons.length];
                return (
                  <article key={feature.title} className="se-feat">
                    <i>
                      <Icon />
                    </i>
                    <div>
                      <b>{feature.title}</b>
                      <span>{feature.text}</span>
                    </div>
                  </article>
                );
              })}
            </div>
            <SpeakerCard item={item} />
          </>
        ) : null}

        {tab === "dastur" ? (
          <section className="se-box">
            <h2>Dastur</h2>
            <div className="se-meta">
              {item.program.map((row) => (
                <p key={row.time}>
                  <Clock /> {row.time} — {row.title}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "maruzachi" ? <SpeakerCard item={item} /> : null}

        {tab === "manzil" ? (
          <section className="se-box">
            <h2>Manzil</h2>
            <p>{item.address}</p>
            <p style={{ marginTop: "calc(.3 * var(--u))" }}>
              <MapPin /> {item.place}
            </p>
          </section>
        ) : null}

        {note ? <p className="se-note">{note}</p> : null}
        <div className="se-pad" />
      </div>

      <div className="se-buy">
        <div>
          <b>{formatMoney(item.price, "UZS")}</b>
          <span>
            <em>-{item.discount}%</em>
            <s>{formatMoney(item.oldPrice, "UZS")}</s>
          </span>
        </div>
        <button type="button" className="se-go reg" data-testid="se-register" onClick={onRegister}>
          {registered ? "Yozilgansiz" : "Ro‘yxatdan o‘tish"} <ChevronRight />
        </button>
      </div>

      {sheet ? (
        <div className="mb-sheet" role="dialog" aria-label={sheet === "video" ? "Video" : "Namuna seminar"} data-testid={`se-sheet-${sheet}`}>
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setSheet("")} />
          <div className="mb-panel">
            {sheet === "video" ? (
              <>
                <h3>Video obzor</h3>
                <p>Bu seminar uchun video hali joylanmagan. Tashkilotchi videoni qo‘shganda shu yerda ko‘rasiz.</p>
              </>
            ) : (
              <>
                <h3>Namuna seminar</h3>
                <p>Bu kartochka bo‘lim qanday ko‘rinishini ko‘rsatish uchun qo‘yilgan — unga ro‘yxat ochilmagan va to‘lov olinmaydi.</p>
                <p>Haqiqiy seminarlarga ro‘yxatdan o‘tsangiz, ariza tashkilotchiga boradi va chipta «Seminarlarim»da saqlanadi.</p>
              </>
            )}
            <div className="row">
              <button type="button" onClick={() => setSheet("")}>
                Yopish
              </button>
              {sheet === "sample" ? (
                <Link className="go" href="/seminarlar">
                  Seminarlar
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}

function SpeakerCard({ item }: { item: MobileSeminar }) {
  return (
    <section className="se-box">
      <h2>Ma’ruzachi</h2>
      <div className="se-speaker">
        <img src={item.speakerImage} alt="" />
        <div>
          <b>{item.speaker}</b>
          <span>{item.speakerRole}</span>
          <span className="se-org">
            <i>N</i> {item.speakerOrg}
          </span>
        </div>
        <ChevronRight style={{ marginLeft: "auto", color: "#8b93a7" }} />
      </div>
      <div className="se-stats">
        {item.stats.map((stat, index) => {
        const Icon = [Briefcase, GraduationCap, Users][index % 3];
        return (
          <div key={stat.label}>
            <Icon />
            <b>{stat.value}</b>
            <span>{stat.label}</span>
          </div>
        );
      })}
      </div>
    </section>
  );
}
