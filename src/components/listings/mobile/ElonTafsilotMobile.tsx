"use client";
/* eslint-disable @next/next/no-img-element -- listing photos are user uploads */

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, FileText, Heart, MapPin, MessageCircle, Phone, Settings, Store, Tag } from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { getListing, type Listing } from "@/data/listings";
import { classifiedToListing, type ClassifiedRow } from "@/lib/classified-view";
import { instagramHref, instagramValue, sourceUrlValue } from "@/lib/add-forms";
import { useStoredList } from "@/lib/stored-list";
import "./elon-tafsilot-mobile.css";

type Row = ClassifiedRow & { status?: string; mine?: boolean };

export function ElonTafsilotMobile({ id }: { id: string }) {
  const [extra] = useStoredList("sk-elonlar-v1", [] as Listing[]);
  const [remote, setRemote] = useState<{ item: Listing; row: Row } | null>(null);
  const [ready, setReady] = useState(false);
  const [photo, setPhoto] = useState(0);
  const favorites = useFavorites();

  useEffect(() => {
    let cancel = false;
    void fetch(`/api/work/classifieds/${id}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { item?: Row } | null;
        if (!cancel && data?.item) setRemote({ item: classifiedToListing(data.item), row: data.item });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [id]);

  const item = remote?.item ?? getListing(id, extra);
  if (!item) {
    return (
      <div className="et lg:hidden">
        <p className="et-empty">{ready ? "E’lon topilmadi" : "Yuklanmoqda…"}</p>
        {ready ? <Link href="/elonlar" className="et-empty-link">E’lonlarga qaytish</Link> : null}
      </div>
    );
  }

  const photos = item.photos?.length ? item.photos : [item.image];
  const current = photos[Math.min(photo, photos.length - 1)];
  const thumbs = photos.slice(0, 3);
  const more = photos.length - thumbs.length;
  const place = [item.city, item.district].filter(Boolean).join(", ");
  const phone = item.phone?.replace(/\s/g, "") ?? "";
  const telegram = item.telegram?.replace(/^@/, "") ?? "";
  const source = sourceUrlValue(item.sourceUrl ?? "");
  const insta = instagramHref(item.instagram ?? "");
  const saved = favorites.has(`elon:${item.id}`);
  const draft = remote?.row.status && remote.row.status !== "published";

  return (
    <div className="et lg:hidden" data-testid="listing-detail">
      <section className="et-gallery">
        <div className="et-main">
          <img src={current} alt={item.title} />
          <button type="button" className={saved ? "et-fav on" : "et-fav"} aria-label={saved ? "Saqlangandan olib tashlash" : "Saqlash"} aria-pressed={saved} onClick={() => favorites.toggle(`elon:${item.id}`)}>
            <Heart />
          </button>
        </div>
        {photos.length > 1 ? (
          <div className="et-thumbs">
            {thumbs.map((src, index) => (
              <button key={src + index} type="button" className={index === photo ? "on" : ""} aria-label={`Rasm ${index + 1}`} onClick={() => setPhoto(index)}>
                <img src={src} alt="" />
              </button>
            ))}
            {more > 0 ? (
              <button type="button" className="et-more" onClick={() => setPhoto((photo + 1) % photos.length)}>+{more}</button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="et-card">
        <div className="et-chips">
          <span className="et-cat">{item.category}</span>
          <span className="et-badge">{item.typeLabel}</span>
          {draft ? <span className="et-badge grey">Qoralama</span> : null}
        </div>
        <h1>{item.title}</h1>
        <div className="et-price-row">
          <b className="et-price">{item.priceLabel}</b>
          {item.dateLabel ? <span className="et-date"><CalendarDays /> {item.dateLabel}</span> : null}
        </div>

        <div className="et-facts">
          <div><i><Tag /></i><span><small>Kategoriya</small><b>{item.category}</b></span></div>
          <div><i><MapPin /></i><span><small>Joylashuv</small><b>{place || "—"}</b></span></div>
          <div><i><Settings /></i><span><small>Holati</small><b>{item.typeLabel}</b></span></div>
        </div>

        {item.description ? (
          <>
            <h2><i><FileText /></i> Tavsif</h2>
            <p className="et-desc">{item.description}</p>
          </>
        ) : null}

        <h2><i><Store /></i> Sotuvchi</h2>
        <div className="et-seller">
          <i><Store /></i>
          <span>
            <b>E’lon egasi</b>
            <small>{[place, telegram ? `@${telegram}` : ""].filter(Boolean).join(" · ") || "Kontakt e’londa"}</small>
          </span>
        </div>
        {source || insta ? (
          <div className="et-links">
            {source ? <a href={source} target="_blank" rel="noopener nofollow" data-testid="listing-source">Manba <ChevronRight /></a> : null}
            {insta ? <a href={insta} target="_blank" rel="noopener nofollow" data-testid="listing-instagram">{instagramValue(item.instagram ?? "")} <ChevronRight /></a> : null}
          </div>
        ) : null}
      </section>

      <div className="et-actions">
        {telegram ? (
          <a className="et-chat" href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer"><MessageCircle /> Sotuvchi bilan chat</a>
        ) : null}
        {phone ? (
          <a className="et-call" href={`tel:${phone}`}><Phone /> Qo‘ng‘iroq qilish</a>
        ) : null}
        {!telegram && !phone ? <p className="et-nocontact">Telefon ko‘rsatilmagan.</p> : null}
      </div>
    </div>
  );
}
