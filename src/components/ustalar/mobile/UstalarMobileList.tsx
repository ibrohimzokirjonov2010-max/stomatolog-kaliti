"use client";
/* eslint-disable @next/next/no-img-element -- usta photos are sized by the fluid unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, BadgeCheck, CalendarDays, ChevronDown, MapPin, Phone, Search, Star } from "lucide-react";
import { MobileBrandBar } from "@/components/mobile/MobileBrandBar";
import { ContactSheet } from "@/components/usta-contact";
import { useUstaWork } from "@/components/usta-provider";
import { serviceLabels, type Master, type UstaService } from "@/data/masters";
import { mobileUstalar, ustaKinds, type MobileUsta, type UstaKind } from "@/data/mobile-ustalar";
import { site } from "@/data/site";
import { formatMoney } from "@/lib/format";
import "./ustalar-mobile.css";

function KindIcon({ id }: { id: "all" | UstaKind }) {
  if (id === "all") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (id === "kreslo") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M14.5 5.5 18.5 9.5" />
        <path d="m8 8 8 8" />
        <path d="M6.5 9.5 4 12l2 2 2.5-2.5" />
        <path d="m14.5 15.5 2.5 2.5 2-2-2.5-2.5" />
      </svg>
    );
  }
  if (id === "rentgen") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 5c1.2 2 2.2 2.2 4 2.2S14.8 7 16 5" />
        <path d="M9 9.5c.8 3 1.6 4.5 3 4.5s2.2-1.5 3-4.5" />
        <path d="M10.2 14.2 9 20h6l-1.2-5.8" />
      </svg>
    );
  }
  if (id === "ornatish") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M14 6.5 17.5 10" />
        <path d="m7 13.5 6.2-6.2a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L10.5 17" />
        <path d="M6 18.5h5" />
      </svg>
    );
  }
  if (id === "tamirlash") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 16.5c0-3 2.2-5 6-5s6 2 6 5" />
      <path d="M8 8.5a2 2 0 1 0 0.1 0M16 8.5a2 2 0 1 0 .1 0" />
      <path d="M5 17.5h14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

type Row = MobileUsta & { master?: Master };

const KIND: Partial<Record<UstaService, UstaKind>> = { kreslo: "kreslo", rentgen: "rentgen", ornatish: "ornatish", tamirlash: "tamirlash", servis: "tamirlash", konsultatsiya: "konsultatsiya" };

/** An approved master from the database drawn with the design card. */
function fromMaster(m: Master): Row {
  return {
    id: m.id,
    name: m.name,
    role: m.title,
    city: m.city,
    status: m.online ? "onlayn" : "band",
    verified: false,
    rating: 0,
    reviews: 0,
    years: m.years,
    fromPrice: 0,
    kinds: m.services.map((s) => KIND[s]).filter((k): k is UstaKind => Boolean(k)),
    skills: m.services.map((s) => serviceLabels[s]).filter(Boolean),
    extraPhotos: Math.max(0, (m.works?.length ?? 0) - 2),
    image: m.photo || m.works?.[0] || "",
    hero: m.works?.[0] || m.photo || "",
    avatar: m.photo || "",
    works: m.works ?? [],
    rank: 0,
    master: m,
  };
}

export function UstalarMobileList() {
  const { masters } = useUstaWork();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | UstaKind>("all");
  const [city, setCity] = useState("Toshkent");
  const [spec, setSpec] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [booking, setBooking] = useState<Master | null>(null);
  const [info, setInfo] = useState<"" | "sample" | "call">("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cap = Number(maxPrice);
    const all: Row[] = [...masters.map(fromMaster), ...mobileUstalar];
    const rows = all.filter((item) => {
      if (kind !== "all" && !item.kinds.includes(kind)) return false;
      if (city !== "all" && item.city !== city) return false;
      if (spec && !item.kinds.includes(spec as UstaKind)) return false;
      if (cap > 0 && item.fromPrice > cap) return false;
      if (!q) return true;
      return `${item.name} ${item.role} ${item.city} ${item.skills.join(" ")}`.toLowerCase().includes(q);
    });
    if (sort === "reyting") rows.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    else if (sort === "arzon") rows.sort((a, b) => a.fromPrice - b.fromPrice);
    else if (sort === "tajriba") rows.sort((a, b) => b.years - a.years);
    else rows.sort((a, b) => Number(Boolean(b.master)) - Number(Boolean(a.master)) || a.rank - b.rank);
    return rows;
  }, [city, kind, masters, maxPrice, query, sort, spec]);

  return (
    <div className="ut lg:hidden" data-testid="mobile-ustalar">
      <div className="ut-body">
        <MobileBrandBar search />
        <h1 className="ut-title">Ustalar</h1>
        <p className="ut-sub">Stomatologik uskunalar ta‘mirlash ustalari</p>
        <form className="ut-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input data-usta-search data-section-search value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Usta, mutaxassis yoki xizmatni qidiring..." aria-label="Qidiruv" />
        </form>
        <div className="ut-cats" aria-label="Kategoriyalar">
          {ustaKinds.map((item) => (
            <button key={item.id} type="button" className={kind === item.id ? "on" : undefined} aria-pressed={kind === item.id} onClick={() => setKind(item.id)}>
              <i><KindIcon id={item.id} /></i>
              {item.label}
            </button>
          ))}
        </div>
        <div className="ut-drops">
          <label>
            <MapPin />
            <select className="s-city" aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="Toshkent">Toshkent</option>
              <option value="Samarqand">Samarqand</option>
              <option value="all">Barchasi</option>
            </select>
            <ChevronDown />
          </label>
          <label>
            <select className="s-spec" aria-label="Mutaxassislik" value={spec} onChange={(event) => setSpec(event.target.value)}>
              <option value="">Mutaxassislik</option>
              {ustaKinds.filter((item) => item.id !== "all").map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <ChevronDown />
          </label>
          <label>
            <select className="s-price" aria-label="Narx" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
              <option value="">Narx</option>
              <option value="200000">200 ming</option>
              <option value="300000">300 ming</option>
              <option value="500000">500 ming</option>
            </select>
            <ChevronDown />
          </label>
          <label>
            <ArrowUpDown />
            <select className="s-sort" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="">Saralash</option>
              <option value="reyting">Reyting</option>
              <option value="arzon">Arzon</option>
              <option value="tajriba">Tajriba</option>
            </select>
            <ChevronDown />
          </label>
        </div>
        <div className="ut-list">
          {list.length === 0 ? <p className="ut-sub">Usta topilmadi</p> : null}
          {list.map((item) => (
            <article key={item.id} className="ut-card" data-testid={`ut-card-${item.id}`} data-real={item.master ? "1" : undefined}>
              <Link href={`/ustalar/${item.id}`} className="ut-photo">
                {item.image ? <img src={item.image} alt="" /> : <span className="ut-ini">{item.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}</span>}
                {item.master ? (
                  item.status === "onlayn" ? <span className="ut-badge on">Onlayn</span> : null
                ) : (
                  <span className="ut-badge off">Namuna</span>
                )}
              </Link>
              <div className="ut-main">
                <Link href={`/ustalar/${item.id}`} className="ut-copy">
                  <h2>{item.name}{item.verified ? <BadgeCheck aria-label="Tasdiqlangan" /> : null}</h2>
                  <p className="ut-role">{item.role}</p>
                  {item.reviews > 0 ? (
                    <p className="ut-meta">
                      <span><Star className="star" /> {item.rating.toFixed(1)} ({item.reviews} ta baho)</span>
                    </p>
                  ) : null}
                  <p className="ut-meta">
                    <span>{item.years} yil tajriba</span>
                    <span><MapPin /> {item.city}</span>
                  </p>
                  <div className="ut-row">
                    <div className="ut-skills">
                      {item.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}
                    </div>
                    {item.works.length ? (
                      <div className="ut-thumbs">
                        {item.works.slice(0, 2).map((src, index) => <img key={`${item.id}-${index}`} src={src} alt="" />)}
                        {item.extraPhotos > 0 ? <b>+{item.extraPhotos}</b> : null}
                      </div>
                    ) : null}
                  </div>
                  <p className="ut-price">{item.fromPrice ? <>Xizmat narxi: <b>{formatMoney(item.fromPrice, "UZS")}</b> dan</> : <>Narx so‘rov bo‘yicha kelishiladi</>}</p>
                </Link>
                <div className="ut-actions">
                  <button type="button" className="ut-call" data-testid="ut-call" onClick={() => setInfo(item.master ? "call" : "sample")}><Phone /> Qo‘ng‘iroq</button>
                  <button type="button" className="ut-order" data-testid="ut-order" onClick={() => (item.master ? setBooking(item.master) : setInfo("sample"))}><CalendarDays /> Buyurtma berish</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="ut-pad" />
      </div>
      <a className="ut-find" data-testid="ut-find" href={`${site.telegram}?text=${encodeURIComponent("Usta kerak: ")}`} target="_blank" rel="noreferrer">
        + Usta topish yoki so‘rov qoldirish →
      </a>
      {booking ? <ContactSheet master={booking} onClose={() => setBooking(null)} /> : null}
      {info ? (
        <div className="mb-sheet" role="dialog" aria-label={info === "call" ? "Qo‘ng‘iroq" : "Namuna usta"} data-testid={`ut-info-${info}`}>
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setInfo("")} />
          <div className="mb-panel">
            {info === "call" ? (
              <>
                <h3>Usta bilan bog‘lanish</h3>
                <p>Ustaning telefoni u so‘rovingizni qabul qilgach «Mening so‘rovlarim»da ko‘rinadi. Avval «Buyurtma berish» orqali so‘rov yuboring.</p>
              </>
            ) : (
              <>
                <h3>Namuna usta</h3>
                <p>Bu kartochka bo‘lim qanday ko‘rinishini ko‘rsatish uchun qo‘yilgan — u haqiqiy usta emas, unga qo‘ng‘iroq yoki buyurtma qilib bo‘lmaydi.</p>
                <p>Tasdiqlangan ustalar ro‘yxat boshida chiqadi. Siz usta bo‘lsangiz, profilingizni qo‘shing.</p>
              </>
            )}
            <div className="row">
              <button type="button" onClick={() => setInfo("")}>Yopish</button>
              <Link className="go" href={info === "call" ? "/ustalar/sorovlarim" : "/ustalar/mening"}>{info === "call" ? "So‘rovlarim" : "Usta bo‘lish"}</Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
