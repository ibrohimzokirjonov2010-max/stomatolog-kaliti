"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Eye,
  FlaskConical,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Microscope,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { CrmFrame } from "@/components/crm/desktop/CrmFrame";
import { listingCities, type Listing, type ListingType } from "@/data/listings";
import { classifiedToListing, type ClassifiedRow } from "@/lib/classified-view";
import { useStoredList } from "@/lib/stored-list";
import "./elonlar-desktop.css";

type Tile = { id: string; label: string; icon: LucideIcon; match?: (item: Listing) => boolean; href?: string; api?: string };

/** Category tiles from the mockup, mapped onto the categories the e'lon form saves. Jobs and services live in their own sections. */
const TILES: Tile[] = [
  { id: "", label: "Barchasi", icon: LayoutGrid },
  { id: "uskuna", label: "Ustanovkalar", icon: Microscope, match: (item) => item.category === "Uskunalar" },
  { id: "asbob", label: "Asbob-uskunalar", icon: Wrench, match: (item) => item.category === "Asboblar" },
  { id: "material", label: "Materiallar", icon: Package, match: (item) => item.category === "Materiallar" },
  { id: "ijara", label: "Ijara", icon: CalendarDays, match: (item) => item.type === "ijara" },
  { id: "lab", label: "Laboratoriya", icon: FlaskConical, match: (item) => item.category === "Laboratoriya" },
  { id: "ish", label: "Ish o‘rni", icon: BriefcaseBusiness, href: "/ishlar", api: "/api/work/jobs" },
  { id: "xizmat", label: "Xizmatlar", icon: MessagesSquare, href: "/ustalar", api: "/api/work/masters" },
  { id: "boshqa", label: "Boshqalar", icon: MoreHorizontal, match: (item) => item.category === "Boshqa" || item.category === "Hamkorlik" },
];

const DEALS: { id: ListingType | ""; label: string }[] = [
  { id: "", label: "Barchasi" },
  { id: "sotiladi", label: "Sotiladi" },
  { id: "ijara", label: "Ijaraga" },
  { id: "xizmat", label: "Xizmatlar" },
  { id: "hamkor", label: "Hamkorlik" },
];

const FLAG: Record<string, string> = { sotiladi: "Sotiladi", ijara: "Ijaraga", ish: "Ish o‘rni", xizmat: "Xizmat", hamkor: "Hamkorlik" };
const PRICE_STEPS = [["", "Narx (so‘m)"], ["1", "1 mln gacha"], ["10", "1–10 mln"], ["11", "10 mln dan yuqori"]] as const;
const SAVED = "sk-elon-saved-v1";

/** Desktop /elonlar (mock "e'lonlar bo'limi"). */
export function ListingsDesktop() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = (params.get("tur") as ListingType | null) ?? "";
  const [extra] = useStoredList("sk-elonlar-v1", [] as Listing[]);
  const [remote, setRemote] = useState<Listing[] | null>(null);
  const [outside, setOutside] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [tile, setTile] = useState("");
  const [deal, setDeal] = useState<ListingType | "">(initial);
  const [seenInitial, setSeenInitial] = useState(initial);
  const [wear, setWear] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState("yangi");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [saved, setSaved] = useStoredList<string>(SAVED, []);
  if (seenInitial !== initial) {
    setSeenInitial(initial);
    setDeal(initial);
  }

  useEffect(() => {
    let cancel = false;
    void fetch("/api/work/classifieds")
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { items?: ClassifiedRow[] } | null;
        if (!cancel) setRemote(Array.isArray(data?.items) ? data.items.map(classifiedToListing) : []);
      })
      .catch(() => {
        if (!cancel) setRemote([]);
      });
    for (const item of TILES) {
      if (!item.api) continue;
      void fetch(item.api)
        .then(async (res) => {
          const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
          const list = Object.values(data ?? {}).find(Array.isArray) as unknown[] | undefined;
          if (!cancel) setOutside((cur) => ({ ...cur, [item.id]: list?.length ?? 0 }));
        })
        .catch(() => undefined);
    }
    return () => {
      cancel = true;
    };
  }, []);

  const all = useMemo(() => [...(remote ?? []), ...extra.filter((item) => !(remote ?? []).some((row) => row.id === item.id))], [extra, remote]);
  const tileMatch = TILES.find((item) => item.id === tile)?.match;

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    const next = all.filter((item) => {
      if (tileMatch && !tileMatch(item)) return false;
      if (deal && item.type !== deal) return false;
      if (wear && item.typeLabel !== wear) return false;
      if (city && item.city !== city) return false;
      if (query && !`${item.title} ${item.city} ${item.category} ${item.description}`.toLowerCase().includes(query)) return false;
      const sum = item.price ?? 0;
      if (price === "1" && !(item.price != null && sum <= 1_000_000)) return false;
      if (price === "10" && !(sum > 1_000_000 && sum <= 10_000_000)) return false;
      if (price === "11" && !(sum > 10_000_000)) return false;
      return true;
    });
    next.sort((a, b) => (sort === "arzon" ? (a.price ?? 0) - (b.price ?? 0) : sort === "qimmat" ? (b.price ?? 0) - (a.price ?? 0) : b.date.localeCompare(a.date)));
    return next;
  }, [all, city, deal, price, q, sort, tileMatch, wear]);

  const cities = useMemo(
    () => listingCities.map((item) => ({ city: item.city, count: all.filter((row) => row.city === item.city).length })).sort((a, b) => b.count - a.count).slice(0, 6),
    [all],
  );
  const recent = useMemo(() => [...all].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4), [all]);

  function toggle(id: string) {
    setSaved((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function reset() {
    setTile("");
    setDeal("");
    setWear("");
    setCity("");
    setPrice("");
    setQ("");
  }

  return (
    <CrmFrame active="listings" listings placeholder="E’lonlar bo‘yicha qidirish... (masalan: stomatologik ustanovka, kompressor, rentgen...)" headerQuery={q} onHeaderQuery={setQ}>
      <div data-testid="listings-desktop" className="elv">
        <div className="elv-main">
          <div className="elv-head">
            <h1>E’lonlar</h1>
            <p>Stomatologiya sohasidagi e’lonlar: sotiladi, ijaraga, ish o‘rni va boshqalar</p>
          </div>

          <div className="elv-stats">
            {([
              { id: "sotiladi" as const, label: "Sotiladi", count: all.filter((row) => row.type === "sotiladi").length },
              { id: "ijara" as const, label: "Ijaraga", count: all.filter((row) => row.type === "ijara").length },
              { id: "ish" as const, label: "Ish o‘rni", count: outside.ish ?? 0, href: "/ishlar" },
              { id: "xizmat" as const, label: "Xizmatlar", count: outside.xizmat ?? 0, href: "/ustalar" },
              { id: "hamkor" as const, label: "Hamkorlik", count: all.filter((row) => row.type === "hamkor").length },
            ]).map((item) => (
              <button
                key={item.id}
                type="button"
                className={deal === item.id ? "on" : undefined}
                onClick={() => (item.href ? router.push(item.href) : setDeal(deal === item.id ? "" : item.id))}
              >
                <b>{item.count}</b>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="elv-tools">
            <label className="elv-search">
              <Search />
              <input data-testid="listing-search" aria-label="E’lon qidirish" value={q} placeholder="Kalit so‘z bo‘yicha qidirish..." onChange={(event) => setQ(event.target.value)} />
            </label>
            <Select label="Holat" value={wear} onChange={setWear} options={[["", "Holat: Barchasi"], ["Yangi", "Holat: Yangi"], ["Ishlatilgan", "Holat: Ishlatilgan"]]} />
            <Select label="Shahar" value={city} onChange={setCity} options={[["", "Shahar: Barchasi"], ...listingCities.map((item) => [item.city, `Shahar: ${item.city}`] as const)]} testId="listing-city" />
            <Select label="Narx" value={price} onChange={setPrice} options={PRICE_STEPS} testId="listing-price" />
            <button type="button" className="elv-reset" onClick={reset}><SlidersHorizontal /> Tozalash</button>
          </div>

          <div className="elv-bar">
            <div className="elv-deals" role="tablist">
              {DEALS.map((item) => (
                <button key={item.id || "all"} type="button" role="tab" aria-selected={deal === item.id} className={deal === item.id ? "on" : undefined} data-testid={`listing-type-${item.id || "all"}`} onClick={() => setDeal(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <Select label="Saralash" value={sort} onChange={setSort} options={[["yangi", "Saralash: Eng yangi"], ["arzon", "Saralash: Arzonroq"], ["qimmat", "Saralash: Qimmatroq"]]} />
            <div className="elv-view">
              <button type="button" aria-label="Katak" aria-pressed={view === "grid"} className={view === "grid" ? "on" : undefined} onClick={() => setView("grid")}><LayoutGrid /></button>
              <button type="button" aria-label="Ro‘yxat" aria-pressed={view === "list"} className={view === "list" ? "on" : undefined} onClick={() => setView("list")}><List /></button>
            </div>
          </div>

          {remote === null ? (
            <div className="elv-empty">Yuklanmoqda…</div>
          ) : items.length === 0 ? (
            <div className="elv-empty" data-testid="listing-empty">
              <b>E’lon topilmadi</b>
              <span>Filtrlarni o‘zgartiring yoki birinchi bo‘lib e’lon joylashtiring.</span>
              <Link href="/elonlar/yangi" className="elv-add"><Plus /> E’lon joylashtirish</Link>
            </div>
          ) : (
            <div className={view === "grid" ? "elv-cards" : "elv-cards list"}>
              {items.map((item) => (
                <ListingCard key={item.id} item={item} saved={saved.includes(item.id)} onSave={() => toggle(item.id)} />
              ))}
            </div>
          )}
        </div>

        <aside className="elv-rail">
          <Link href="/elonlar/yangi" className="elv-add big" data-testid="listing-add"><Plus /> E’lon joylashtirish</Link>
          <section className="elv-box">
            <h3>Ommabop shaharlar</h3>
            {cities.map((item) => (
              <button key={item.city} type="button" className={city === item.city ? "elv-city on" : "elv-city"} onClick={() => setCity(city === item.city ? "" : item.city)}>
                <MapPin /><span>{item.city}</span><b>{item.count}</b>
              </button>
            ))}
          </section>
          <section className="elv-box">
            <h3>So‘nggi e’lonlar <button type="button" onClick={reset}>Barchasini ko‘rish <ArrowRight /></button></h3>
            {recent.length === 0 ? <p className="elv-muted">Hozircha e’lon yo‘q</p> : recent.map((item) => (
              <Link key={item.id} href={`/elonlar/${item.id}`} className="elv-recent">
                <img src={item.image} alt="" />
                <span><b>{item.title}</b><em>{item.priceLabel}</em><small><MapPin />{[item.city, item.dateLabel].filter(Boolean).join(" • ")}</small></span>
              </Link>
            ))}
          </section>
          <section className="elv-ask">
            <div><i><MessageCircle /></i><b>Kerakli jihozni topa olmayapsizmi?</b></div>
            <p>Nima kerakligini e’lon qilib joylang — sotuvchilar sizga o‘zlari yozadi.</p>
            <Link href="/elonlar/yangi">E’lon yozish</Link>
          </section>
        </aside>
      </div>
    </CrmFrame>
  );
}

function Select({ label, value, onChange, options, testId }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[]; testId?: string }) {
  return (
    <label className="elv-sel">
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} data-testid={testId}>
        {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
      </select>
      <ChevronDown />
    </label>
  );
}

function ListingCard({ item, saved, onSave }: { item: Listing; saved: boolean; onSave: () => void }) {
  const href = `/elonlar/${item.id}`;
  const photos = item.photos?.length ?? 0;
  const contact = item.type === "sotiladi" || item.type === "ijara";
  return (
    <article className="elv-card" data-testid="listing-card">
      <Link href={href} className="ph"><img src={item.image} alt="" /></Link>
      <span className={`elv-flag ${item.type}`}>{FLAG[item.type] ?? item.typeLabel}</span>
      <button type="button" className={saved ? "elv-heart on" : "elv-heart"} aria-label="Saqlash" aria-pressed={saved} data-testid={`listing-heart-${item.id}`} onClick={onSave}>
        <Heart fill={saved ? "currentColor" : "none"} />
      </button>
      <div className="pad">
        <h3><Link href={href}>{item.title}</Link></h3>
        <p className="meta">
          <span><MapPin />{item.city || "—"}</span>
          {item.dateLabel ? <span><CalendarDays />{item.dateLabel}</span> : null}
        </p>
        <p className={item.price ? "price" : "price deal"}>{item.priceLabel}{item.type === "ijara" && item.price ? " / oy" : ""}</p>
        <p className="stats">
          <span><ImageIcon />{photos}</span>
          <span><Heart />{item.likes + (saved ? 1 : 0)}</span>
          {item.views ? <span><Eye />{item.views}</span> : null}
        </p>
        <div className="acts">
          {contact ? (
            <>
              <Link href={`${href}#aloqa`} className="go">Sotuvchiga yozish</Link>
              {item.telegram ? (
                <a href={`https://t.me/${item.telegram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="chat" aria-label="Telegram orqali yozish"><MessageCircle /></a>
              ) : (
                <Link href={href} className="chat" aria-label="E’lonni ochish"><MessageCircle /></Link>
              )}
            </>
          ) : (
            <Link href={href} className="more">Batafsil</Link>
          )}
        </div>
      </div>
    </article>
  );
}
