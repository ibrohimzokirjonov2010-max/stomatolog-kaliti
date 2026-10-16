"use client";
/* eslint-disable @next/next/no-img-element -- seminar photos are sized by the fluid unit */

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Briefcase, CalendarDays, ChevronRight, Clock, FileCheck2, GraduationCap, Heart, MapPin, Play, Share2, Stethoscope, Users } from "lucide-react";
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
  const [tab, setTab] = useState<TabId>("umumiy");
  const [saved, setSaved] = useState(false);
  const [more, setMore] = useState(false);
  const [video, setVideo] = useState(false);
  const [join, setJoin] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const taken = Math.max(0, Math.min(100, Math.round(((item.seats - item.seatsLeft) / item.seats) * 100)));

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
        <img className="photo" src={item.image} alt="" />
        <span className="veil" />
        <Link href="/seminarlar" className="se-float back" aria-label="Orqaga">
          <ChevronRight style={{ transform: "rotate(180deg)" }} />
        </Link>
        <button type="button" className={saved ? "se-float heart on" : "se-float heart"} aria-label="Sevimlilar" aria-pressed={saved} onClick={() => setSaved((value) => !value)}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
        <button type="button" className="se-float share" aria-label="Ulashish" onClick={() => void onShare()}>
          <Share2 />
        </button>
        <button type="button" className="se-video" onClick={() => setVideo(true)}>
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
          <button type="button" className="se-go reg" onClick={() => setJoin(true)}>
            Ro‘yxatdan o‘tish <ChevronRight />
          </button>
        </section>
        <div>
          <p className="se-left">
            {item.seats} o‘rindan {item.seatsLeft} ta qoldi
          </p>
          <div className="se-bar" aria-hidden="true">
            <span style={{ width: `${taken}%` }} />
          </div>
        </div>

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
        <button type="button" className="se-go reg" data-testid="se-register" onClick={() => setJoin(true)}>
          Ro‘yxatdan o‘tish <ChevronRight />
        </button>
      </div>

      {video ? (
        <div className="se-sheet" role="dialog" aria-label="Video">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setVideo(false)} />
          <div className="se-panelbox">
            <h3>Video ko‘rish</h3>
            <div className="se-play">
              <Play /> Video ochildi
            </div>
            <button type="button" className="go" onClick={() => setVideo(false)}>
              Yopish
            </button>
          </div>
        </div>
      ) : null}

      {join ? (
        <div className="se-sheet" role="dialog" aria-label="Ro‘yxatdan o‘tish">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setJoin(false)} />
          <form
            className="se-panelbox"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;
              setJoin(false);
              setName("");
              setNote("Ariza qabul qilindi");
            }}
          >
            <h3>Ro‘yxatdan o‘tish</h3>
            <input aria-label="Ism" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ismingiz" />
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => setJoin(false)}>
                Yopish
              </button>
              <button type="submit" className="go">
                Yuborish
              </button>
            </div>
          </form>
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
