"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {

  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Hash,
  Heart,
  AtSign,
  Layers,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  Send,
  Share2,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import { CrmFrame } from "@/components/crm/desktop/CrmFrame";
import { getListing, type Listing } from "@/data/listings";
import { classifiedToListing, type ClassifiedRow } from "@/lib/classified-view";
import { instagramHref, instagramValue, sourceUrlValue } from "@/lib/add-forms";
import { useStoredList } from "@/lib/stored-list";
import "./elonlar-desktop.css";
import "./elon-detail-desktop.css";

const FLAG: Record<string, string> = { sotiladi: "Sotiladi", ijara: "Ijaraga", ish: "Ish o‘rni", xizmat: "Xizmat", hamkor: "Hamkorlik" };

/** Desktop /elonlar/[id] (mock "e'lon product page"). Seller profile data is not stored, so the contact card shows only what the e'lon has. */
export function ListingDetailDesktop({ id }: { id: string }) {
  const [extra] = useStoredList("sk-elonlar-v1", [] as Listing[]);
  const [saved, setSaved] = useStoredList<string>("sk-elon-saved-v1", []);
  const [remote, setRemote] = useState<Listing | null>(null);
  const [ready, setReady] = useState(false);
  const [others, setOthers] = useState<Listing[]>([]);

  useEffect(() => {
    let cancel = false;
    void fetch(`/api/work/classifieds/${id}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { item?: ClassifiedRow } | null;
        if (!cancel && data?.item) setRemote(classifiedToListing(data.item));
        if (!cancel) setReady(true);
      })
      .catch(() => {
        if (!cancel) setReady(true);
      });
    void fetch("/api/work/classifieds")
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { items?: ClassifiedRow[] } | null;
        if (!cancel && Array.isArray(data?.items)) setOthers(data.items.map(classifiedToListing));
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [id]);

  const item = remote ?? getListing(id, extra);
  const similar = useMemo(() => {
    if (!item) return [];
    const rest = others.filter((row) => row.id !== item.id);
    const same = rest.filter((row) => row.category === item.category);
    return [...same, ...rest.filter((row) => row.category !== item.category)].slice(0, 4);
  }, [item, others]);

  if (!item) {
    return (
      <CrmFrame active="listings" listings placeholder="E’lonlar bo‘yicha qidirish...">
        <div className="eld-empty">{ready ? "E’lon topilmadi" : "Yuklanmoqda…"} {ready ? <Link href="/elonlar">E’lonlarga qaytish</Link> : null}</div>
      </CrmFrame>
    );
  }

  const isSaved = saved.includes(item.id);
  return (
    <CrmFrame active="listings" listings placeholder="E’lonlar bo‘yicha qidirish... (masalan: stomatologik ustanovka, kompressor, rentgen...)">
      <Detail
        key={item.id}
        item={item}
        similar={similar}
        saved={isSaved}
        onSave={() => setSaved((prev) => (prev.includes(item.id) ? prev.filter((row) => row !== item.id) : [...prev, item.id]))}
        savedIds={saved}
      />
    </CrmFrame>
  );
}

function Detail({ item, similar, saved, onSave, savedIds }: { item: Listing; similar: Listing[]; saved: boolean; onSave: () => void; savedIds: string[] }) {
  const photos = item.photos?.length ? item.photos : [item.image];
  const [photo, setPhoto] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [note, setNote] = useState("");
  const source = sourceUrlValue(item.sourceUrl ?? "");
  const insta = instagramHref(item.instagram ?? "");
  const tg = item.telegram ? item.telegram.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "") : "";
  const place = [item.city, item.district].filter(Boolean).join(", ");
  const shortId = item.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 2200);
    return () => window.clearTimeout(timer);
  }, [note]);

  useEffect(() => {
    if (!zoom) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setZoom(false);
      if (event.key === "ArrowRight") setPhoto((value) => (value + 1) % photos.length);
      if (event.key === "ArrowLeft") setPhoto((value) => (value - 1 + photos.length) % photos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length, zoom]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNote("Havola nusxalandi");
    } catch {
      /* cancelled */
    }
  }

  const facts: [ReactNode, string, string][] = [
    [<Layers key="h" />, "Holati", item.typeLabel],
    [<Tag key="t" />, "Turi", item.category],
    [<MapPin key="j" />, "Joylashuv", place || "—"],
    [<CalendarDays key="d" />, "E’lon joylashtirilgan", item.dateLabel || "—"],
    [<Hash key="i" />, "E’lon ID", `#${shortId}`],
  ];

  return (
    <div className="eld" data-testid="listing-detail">
      <div className="eld-top">
        <nav className="eld-crumbs" aria-label="Yo‘l">
          <Link href="/elonlar">E’lonlar</Link>
          <ChevronRight />
          <Link href={`/elonlar?tur=${item.type}`}>{FLAG[item.type] ?? "E’lon"}</Link>
          <ChevronRight />
          <span>{item.category}</span>
        </nav>
        <div className="eld-acts">
          <button type="button" onClick={() => void share()}><Share2 /> Ulashish</button>
          <button type="button" className={saved ? "on" : undefined} aria-pressed={saved} onClick={onSave}><Heart fill={saved ? "currentColor" : "none"} /> {saved ? "Saqlangan" : "Saqlash"}</button>
        </div>
      </div>

      <div className="eld-grid">
        <div className="eld-main">
          <h1>{item.title}</h1>
          <p className="eld-meta">
            <span className={item.typeLabel === "Ishlatilgan" ? "eld-cond used" : "eld-cond"}>{item.typeLabel}</span>
            {place ? <span><MapPin /> {place}</span> : null}
            {item.dateLabel ? <span><CalendarDays /> {item.dateLabel}</span> : null}
            <span>E’lon ID: #{shortId}</span>
          </p>

          <div className="eld-gallery">
            <div className="eld-stage">
              <img src={photos[photo]} alt={`${item.title}, rasm ${photo + 1}`} />
              {photos.length > 1 ? (
                <>
                  <button type="button" className="nav prev" aria-label="Oldingi rasm" onClick={() => setPhoto((photo - 1 + photos.length) % photos.length)}><ChevronLeft /></button>
                  <button type="button" className="nav next" aria-label="Keyingi rasm" onClick={() => setPhoto((photo + 1) % photos.length)}><ChevronRight /></button>
                </>
              ) : null}
              <button type="button" className="zoom" aria-label="Kattalashtirish" onClick={() => setZoom(true)}><Maximize2 /></button>
              {photos.length > 1 ? <span className="count">{photo + 1} / {photos.length}</span> : null}
            </div>
            {photos.length > 1 ? (
              <div className="eld-thumbs">
                {photos.map((src, index) => (
                  <button key={`${index}-${src}`} type="button" className={index === photo ? "on" : undefined} aria-label={`Rasm ${index + 1}`} onClick={() => setPhoto(index)}>
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <section className="eld-card">
            <div className="eld-price">
              <b>{item.priceLabel}{item.type === "ijara" && item.price ? " / oy" : ""}</b>
              <span className={item.typeLabel === "Ishlatilgan" ? "eld-cond used" : "eld-cond"}>{item.typeLabel}</span>
              {item.negotiable ? <em><MessageCircle /> Narx bo‘yicha kelishish mumkin</em> : null}
            </div>
            <div className="eld-cols">
              <div>
                <h2>Tavsif</h2>
                <p className="eld-desc">{item.description || "Tavsif yozilmagan."}</p>
                {source ? <a className="eld-link" href={source} target="_blank" rel="noopener nofollow" data-testid="listing-source"><ExternalLink /> Manba: {source.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</a> : null}
                {insta ? <a className="eld-link" href={insta} target="_blank" rel="noopener nofollow" data-testid="listing-instagram"><AtSign /> {instagramValue(item.instagram ?? "")}</a> : null}
              </div>
              <div>
                <h2>Asosiy xususiyatlar</h2>
                <dl className="eld-facts">
                  {facts.map(([icon, label, value]) => (
                    <div key={label}><dt>{icon}{label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
              </div>
            </div>
          </section>
        </div>

        <aside className="eld-side">
          <section className="eld-card eld-contact" id="aloqa">
            <div className="eld-owner">
              <span className="ava">{(item.title || "E").slice(0, 1).toUpperCase()}</span>
              <span>
                <b>E’lon egasi</b>
                <small>{place || "Manzil ko‘rsatilmagan"}</small>
              </span>
            </div>
            {item.phone ? (
              phoneOpen ? (
                <a className="eld-call" href={`tel:${item.phone.replace(/\s/g, "")}`}><Phone /> {item.phone}</a>
              ) : (
                <button type="button" className="eld-call" onClick={() => setPhoneOpen(true)}><Phone /> Telefon raqamini ko‘rsatish</button>
              )
            ) : (
              <p className="eld-muted">Telefon ko‘rsatilmagan.</p>
            )}
            {tg ? (
              <a className="eld-msg" href={`https://t.me/${tg}`} target="_blank" rel="noreferrer"><Send /> Telegram orqali yozish</a>
            ) : null}
            <div className="eld-mini">
              <span><Clock /><small>Joylangan</small><b>{item.dateLabel || "—"}</b></span>
              <span><MapPin /><small>Shahar</small><b>{item.city || "—"}</b></span>
            </div>
          </section>
          <section className="eld-card eld-tip">
            <i><ShieldCheck /></i>
            <span>
              <b>Xavfsiz savdo</b>
              <small>Uskunani ko‘rmasdan turib oldindan to‘lov qilmang. Bitimni faqat ishonchli shaxs bilan amalga oshiring.</small>
            </span>
          </section>
        </aside>
      </div>

      {similar.length ? (
        <section className="eld-similar">
          <h2>O‘xshash e’lonlar <Link href="/elonlar">Barchasini ko‘rish <ChevronRight /></Link></h2>
          <div>
            {similar.map((row) => (
              <Link key={row.id} href={`/elonlar/${row.id}`} className="eld-sim">
                <span className="ph"><img src={row.image} alt="" /><i className={`elv-flag ${row.type}`}>{FLAG[row.type] ?? row.typeLabel}</i></span>
                <span className="txt">
                  <b>{row.title}</b>
                  <small>{row.category}</small>
                  <em>{row.priceLabel}{row.type === "ijara" && row.price ? " / oy" : ""}</em>
                  <small className="row"><span><MapPin />{row.city || "—"}</span><span>{row.dateLabel}</span></small>
                </span>
                {savedIds.includes(row.id) ? <Heart className="saved" fill="currentColor" /> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {note ? <p className="eld-toast" role="status">{note}</p> : null}
      {zoom ? (
        <div className="eld-zoom" role="dialog" aria-label="Rasm" onClick={() => setZoom(false)}>
          <img src={photos[photo]} alt="" onClick={(event) => event.stopPropagation()} />
          <button type="button" aria-label="Yopish" onClick={() => setZoom(false)}><X /></button>
        </div>
      ) : null}
    </div>
  );
}
