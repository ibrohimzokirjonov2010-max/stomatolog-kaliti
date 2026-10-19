"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data loading effect kicks off an async fetch */
/* eslint-disable @next/next/no-img-element -- seller uploads are remote */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Package,
  PencilLine,
  Phone,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { UzumLightbox } from "@/components/product-uzum";
import { ContactForm, Modal, PostForm, sellerLine } from "@/components/surplus-forms";
import { useSurplusWork } from "@/components/surplus-provider";
import {
  conditionLabel,
  listingCondition,
  listingDiscount,
  listingExpiry,
  normalizeCategory,
  phoneHref,
  statusLabel,
  surplusBrandLabel,
  surplusCategoryLabel,
  telegramHref,
  surplusContactTemplate,
  type SurplusListing,
} from "@/data/surplus";
import { listingFromDb, type DbSurplus } from "@/lib/surplus-work";
import { api } from "@/lib/work-client";
import { som, useShopLines } from "./shop-cart";
import { ShopShell } from "./ShopShell";
import "./surplus-desktop.css";

const EMPTY = "—";

const MOD_COPY: Record<string, string> = {
  pending: "Moderatsiyada — admin tasdiqlagach hamma ko‘radi",
  rejected: "Rad etilgan — tahrirlab qayta yuboring",
  hidden: "Admin tomonidan yashirilgan",
  closed: "Yopilgan — lentada ko‘rinmaydi",
};

function dateUz(iso?: string) {
  if (!iso) return EMPTY;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function initials(name: string) {
  return (
    name
      .replace(/^Dr\.?\s*/i, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "D"
  );
}

/** Only the seller's own photos — never a generic product shot of another brand. */
function galleryOf(listing: SurplusListing) {
  return [...new Set([listing.hasPhoto ? listing.image : "", ...(listing.images ?? [])].filter(Boolean))];
}

export function SurplusDesktopDetail({ id }: { id: string }) {
  const { feed, getById, ready: workReady, mine, outgoing } = useSurplusWork();
  const lines = useShopLines();
  const favorites = useFavorites();
  const [listing, setListing] = useState<SurplusListing | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [modal, setModal] = useState<"contact" | "edit" | null>(null);
  const [tick, setTick] = useState(0);
  const [active, setActive] = useState(0);
  const [zoomAt, setZoomAt] = useState<number | null>(null);

  useEffect(() => {
    let off = false;
    setState((current) => (current === "ok" ? current : "loading"));
    void api<{ listing: DbSurplus }>(`/api/work/surplus/${id}`).then((res) => {
      if (off) return;
      if (res.ok && res.data.listing) {
        setListing(listingFromDb(res.data.listing));
        setState("ok");
        return;
      }
      const local = getById(id);
      if (local) {
        setListing(local);
        setState("ok");
      } else if (workReady) setState("missing");
    });
    return () => {
      off = true;
    };
    // Refetch when the demo/API feed arrives, so a failed /api/work/surplus/:id still resolves.
  }, [id, tick, mine.length, workReady, feed]);

  useEffect(() => setActive(0), [id]);

  const similar = useMemo(() => {
    if (!listing) return [];
    const cat = normalizeCategory(listing.category);
    const others = feed.filter((item) => item.id !== listing.id);
    return [...others.filter((item) => normalizeCategory(item.category) === cat), ...others.filter((item) => normalizeCategory(item.category) !== cat)].slice(0, 5);
  }, [feed, listing]);

  const cartCount = lines.reduce((sum, line) => sum + line.qty, 0);

  if (state === "loading" || (!workReady && !listing)) {
    return (
      <ShopShell searchPath="/ortiqcha-material" cartCount={cartCount}>
        <div className="okd" aria-busy="true" data-testid="surplus-pdp-loading">
          <div className="okd-skel" />
        </div>
      </ShopShell>
    );
  }

  if (state === "missing" || !listing) {
    return (
      <ShopShell searchPath="/ortiqcha-material" cartCount={cartCount}>
        <div className="ok-empty okd-missing" data-testid="surplus-pdp-missing">
          <Package className="big" />
          <b>E’lon topilmadi</b>
          <p>E’lon yopilgan, o‘chirilgan yoki hali admin tasdig‘ini kutmoqda.</p>
          <div className="acts">
            <Link href="/ortiqcha-material" className="btn">
              Ortiqcha materiallarga qaytish
            </Link>
          </div>
        </div>
      </ShopShell>
    );
  }

  const l = listing;
  const gallery = galleryOf(l);
  const shown = Math.min(active, gallery.length - 1);
  const discount = listingDiscount(l);
  const hasOld = l.newPrice > l.price;
  const opened = l.status === "ochilgan";
  const condition = listingCondition(l);
  const liked = favorites.has(l.id);
  const category = surplusCategoryLabel(l.category) || EMPTY;
  const modNote = l.mine && l.modStatus && l.modStatus !== "published" ? MOD_COPY[l.modStatus] : "";
  // Seller contacts open only after the seller accepts my request (privacy model of the API).
  const accepted = outgoing.find((item) => item.listingId === l.id && item.status === "qabul");
  const sellerPhone = accepted?.sellerPhone ?? "";
  const sellerTelegram = accepted?.sellerTelegram ?? "";
  const pending = outgoing.find((item) => item.listingId === l.id && item.status === "yuborildi");

  const facts: { Icon: typeof Package; label: string; value: string }[] = l.highlights?.length
    ? l.highlights.map((item) => ({ Icon: item.label === "Shahar" || item.label === "Joylashuv" ? MapPin : item.label === "Yaroqlilik" ? CalendarDays : Package, label: item.label, value: item.value }))
    : [
        { Icon: Package, label: "Qadoq", value: statusLabel[l.status] },
        { Icon: CalendarDays, label: "Yaroqlilik", value: listingExpiry(l) },
        { Icon: MapPin, label: "Shahar", value: l.city || EMPTY },
        { Icon: MapPin, label: "Tuman", value: l.district || EMPTY },
      ];

  const specs: [string, string][] = l.specRows?.length
    ? l.specRows
    : [
    ["Brend", l.brand?.trim() || EMPTY],
    ["Mahsulot nomi", l.name],
    ["Turi", category],
    ["Qadoq holati", statusLabel[l.status]],
    ["Holati", conditionLabel[condition]],
    ["Yaroqlilik muddati", `${listingExpiry(l)} · ${l.expiryMonths} oy`],
    ["Shahar", l.city || EMPTY],
    ["Tuman", l.district || EMPTY],
    ["Olib ketish joyi", l.address || "Sotuvchi bilan kelishiladi"],
    ["E’lon sanasi", dateUz(l.createdAt)],
  ];

  const go = (step: number) => setActive((current) => (current + step + gallery.length) % gallery.length);

  return (
    <ShopShell searchPath="/ortiqcha-material" cartCount={cartCount} placeholder="Material, brend yoki kategoriya bo‘yicha qidiring...">
      <div className="okd" data-testid="surplus-pdp">
        <nav className="ok-crumbs okd-crumbs" aria-label="Breadcrumb">
          <Link href="/ortiqcha-material" className="back">
            <ChevronLeft className="i" /> Ortiqcha material
          </Link>
          <ChevronRight className="i" />
          <span>{category}</span>
          <ChevronRight className="i" />
          <b>{l.name}</b>
        </nav>
        {modNote ? <p className="okd-mod">{modNote}</p> : null}

        <div className="okd-cols">
          {/* Column 1 — gallery + description */}
          <div className="okd-col">
            <div className="okd-stage">
              {gallery.length ? (
                <button type="button" className="okd-main" aria-label="Rasmni kattalashtirish" onClick={() => setZoomAt(shown)}>
                  <img src={gallery[shown]} alt={l.name} />
                </button>
              ) : (
                <div className="okd-main ok-noimg big">
                  <Package className="i" />
                  <small>Sotuvchi hali rasm qo‘shmagan</small>
                </div>
              )}
              {gallery.length > 1 ? (
                <>
                  <button type="button" className="okd-nav prev" aria-label="Oldingi rasm" onClick={() => go(-1)}>
                    <ChevronLeft className="i" />
                  </button>
                  <button type="button" className="okd-nav next" aria-label="Keyingi rasm" onClick={() => go(1)}>
                    <ChevronRight className="i" />
                  </button>
                </>
              ) : null}
            </div>
            {gallery.length > 1 ? (
              <div className="okd-thumbs">
                {gallery.slice(0, 5).map((src, index) => (
                  <button key={`${src}-${index}`} type="button" className={index === shown ? "on" : ""} aria-label={`Rasm ${index + 1}`} aria-pressed={index === shown} onClick={() => setActive(index)}>
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
            <section className="okd-card">
              <h2>Tavsif</h2>
              <p className="okd-text">{l.description || l.note || "Sotuvchi tavsif qo‘shmagan."}</p>
              {l.description && l.note ? (
                <>
                  <h3>Sotuvchi izohi</h3>
                  <p className="okd-text">{l.note}</p>
                </>
              ) : null}
              {l.video ? <video className="okd-video" src={l.video} controls playsInline preload="metadata" /> : null}
            </section>
          </div>

          {/* Column 2 — title, badges, facts, specs */}
          <div className="okd-col">
            <p className="okd-kicker">
              {surplusBrandLabel(l)} · {category}
            </p>
            <h1 className="okd-title">{l.name}</h1>
            <div className="okd-badges">
              <span className={opened ? "okd-pill opened" : "okd-pill closed"}>{statusLabel[l.status]}</span>
              <span className="okd-pill plain">{conditionLabel[condition]}</span>
              <span className="okd-pill blue">Yaroqlilik: {listingExpiry(l)}</span>
            </div>
            <p className="okd-rate">
              <Star className="i" /> {l.rating ? `${l.rating.toFixed(1)} (${l.reviews ?? 0} ta sharh)` : "Hali baho yo‘q"} <span className="sep">|</span> E’lon: {dateUz(l.createdAt)}
            </p>
            {l.note && l.description ? <p className="okd-blurb">{l.note}</p> : null}
            <div className="okd-facts">
              {facts.map(({ Icon, label, value }) => (
                <div key={label}>
                  <Icon className="i" />
                  <span>
                    <small>{label}</small>
                    <b>{value}</b>
                  </span>
                </div>
              ))}
            </div>
            <section className="okd-card">
              <h2>Xususiyatlari</h2>
              <dl className="okd-specs">
                {specs.map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd className={value === EMPTY ? "muted" : undefined}>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* Column 3 — price + contact, seller, safety */}
          <div className="okd-col">
            <section className="okd-card okd-price" data-testid="surplus-price">
              {discount > 0 ? <span className="ok-badge sale">-{discount}%</span> : null}
              <div className="now">{som(l.price)}</div>
              {hasOld ? (
                <>
                  <p className="was">
                    Asl narxi: <s>{som(l.newPrice)}</s>
                  </p>
                  <p className="save">Tejaysiz: {som(l.newPrice - l.price)}</p>
                </>
              ) : null}
              {l.mine ? (
                <div className="okd-acts">
                  <button type="button" className="okd-primary" onClick={() => setModal("edit")}>
                    <PencilLine className="i" />
                    <span>
                      E’lonni tahrirlash
                      <small>Faqat siz ko‘rasiz</small>
                    </span>
                  </button>
                  <div className="okd-acts-row">
                    <Link href="/ortiqcha-material/elonlarim" className="okd-secondary">
                      Mening e’lonlarim
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="okd-acts">
                  {sellerTelegram ? (
                    <a className="okd-primary" href={telegramHref(sellerTelegram, surplusContactTemplate(l))} target="_blank" rel="noreferrer">
                      <Send className="i" />
                      <span>
                        Sotuvchiga yozish
                        <small>Telegram orqali</small>
                      </span>
                    </a>
                  ) : (
                    <button type="button" className="okd-primary" data-testid="surplus-contact" onClick={() => setModal("contact")}>
                      <Send className="i" />
                      <span>
                        Sotuvchiga yozish
                        <small>{pending ? "So‘rovingiz yuborilgan" : "StomaHub orqali so‘rov"}</small>
                      </span>
                    </button>
                  )}
                  <div className="okd-acts-row">
                    {sellerPhone ? (
                      <a className="okd-secondary" href={phoneHref(sellerPhone)}>
                        <Phone className="i" /> Qo‘ng‘iroq qilish
                      </a>
                    ) : (
                      <button type="button" className="okd-secondary" onClick={() => setModal("contact")}>
                        <Phone className="i" /> Qo‘ng‘iroq qilish
                      </button>
                    )}
                    <button type="button" className={liked ? "okd-heart on" : "okd-heart"} aria-pressed={liked} aria-label={liked ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"} onClick={() => favorites.toggle(l.id)}>
                      <Heart className="i" />
                    </button>
                  </div>
                  {!sellerPhone ? <p className="okd-hint">Telefon raqam sotuvchi so‘rovingizni qabul qilgach ochiladi.</p> : null}
                </div>
              )}
            </section>

            <section className="okd-card okd-seller" data-testid="surplus-seller">
              <h2>Sotuvchi</h2>
              <div className="who">
                <span className="ava" aria-hidden>
                  {initials(l.seller)}
                </span>
                <div>
                  <p className="name">
                    {sellerLine(l)}
                    {l.verified ? (
                      <span className="okd-verified">
                        <BadgeCheck className="i" /> Tekshirilgan sotuvchi
                      </span>
                    ) : null}
                  </p>
                  <p className="line">
                    <Star className="i star" /> {l.rating ? `${l.rating.toFixed(1)} · ${l.sellerDeals ?? l.reviews ?? 0} ta bitim` : "Hali baho yo‘q"}
                  </p>
                  <p className="line">
                    <MapPin className="i" /> {l.city || EMPTY}
                    {l.district ? <> · {l.district}</> : null}
                  </p>
                  <p className="line">
                    <Clock3 className="i" /> Doktor · shaxsiy ortiqcha
                  </p>
                </div>
              </div>
            </section>

            <section className="okd-card okd-safe" data-testid="surplus-safety">
              <h2>
                <ShieldCheck className="i" /> Xavfsiz xarid uchun
              </h2>
              <ul>
                <li>Yaroqlilik muddati va lot raqamini qadoqda tekshiring</li>
                <li>Ochilgan qadoqda saqlash sharoitini so‘rang</li>
                <li>Mahsulotni ko‘rib, keyin to‘lang</li>
                <li>Oldindan pul o‘tkazmang</li>
                <li>Shaxsiy ma’lumotlaringizni begonalarga bermang</li>
              </ul>
            </section>
          </div>
        </div>

        {similar.length > 0 ? (
          <section className="okd-similar">
            <div className="hd">
              <h2>O‘xshash e’lonlar</h2>
              <Link href="/ortiqcha-material">
                Barchasini ko‘rish <ChevronRight className="i" />
              </Link>
            </div>
            <div className="okd-sim-row">
              {similar.map((item) => {
                const off = listingDiscount(item);
                return (
                  <Link key={item.id} href={`/ortiqcha-material/${item.id}`} className="okd-sim">
                    <span className="badges">
                      {off > 0 ? <span className="ok-badge sale">-{off}%</span> : null}
                      <span className={item.status === "ochilgan" ? "ok-badge opened" : "ok-badge closed"}>{statusLabel[item.status]}</span>
                    </span>
                    {item.hasPhoto ? (
                      <img src={item.image} alt="" loading="lazy" />
                    ) : (
                      <span className="ok-noimg sm">
                        <Package className="i" />
                      </span>
                    )}
                    <span className="txt">
                      <b>{item.name}</b>
                      <small>{surplusBrandLabel(item)}</small>
                      <strong className={off > 0 ? "sale" : undefined}>{som(item.price)}</strong>
                      {item.newPrice > item.price ? <s>{som(item.newPrice)}</s> : null}
                      <em>
                        <MapPin className="i" /> {item.city || EMPTY}
                      </em>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {zoomAt !== null ? <UzumLightbox gallery={gallery} start={zoomAt} name={l.name} onClose={() => setZoomAt(null)} /> : null}
        {modal === "contact" && !l.mine ? (
          <Modal title="Sotuvchi bilan bog‘lanish" onClose={() => setModal(null)}>
            <ContactForm listing={l} onClose={() => setModal(null)} />
          </Modal>
        ) : null}
        {modal === "edit" && l.mine ? (
          <Modal title="E’lonni tahrirlash" onClose={() => setModal(null)}>
            <PostForm
              listing={l}
              onCancel={() => setModal(null)}
              onDone={() => {
                setModal(null);
                setTick((value) => value + 1);
              }}
            />
          </Modal>
        ) : null}
      </div>
    </ShopShell>
  );
}
