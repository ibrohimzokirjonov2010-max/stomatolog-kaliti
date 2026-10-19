"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  ChevronDown,
  Clock3,
  Cog,
  Heart,
  MapPin,
  Minus,
  PhoneCall,
  Phone,
  Plus,
  ScanLine,
  Send,
  ShieldCheck,
  Star,
  Tag,
  Timer,
  Upload,
  UserPlus,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { useFavMasters } from "@/components/usta-ui";
import { useUstaWork } from "@/components/usta-provider";
import type { UstaRequestDraft } from "./usta-view";
import { timeRanges, toshkentDistricts, type RequestServiceV2 } from "@/data/masters";
import { ustaBrandFilters, ustaCities, ustaServices, type UstaService } from "@/data/desktop-ustalar";
import { useEscape, useUstaActions } from "./UstaActions";
import { initials, ustaList, type UstaView } from "./usta-view";
import "./usta.css";

const tabIcons: Record<"all" | UstaService, ReactNode> = {
  all: null,
  unit: <ChairIcon />,
  hand: <HandpieceIcon />,
  compressor: <CompressorIcon />,
  autoclave: <AutoclaveIcon />,
  rentgen: <XrayIcon />,
  scanner: <ScanLine className="i" />,
  install: <Wrench className="i" />,
};

const equipment: { label: string; services: UstaService[]; request: RequestServiceV2[] }[] = [
  { label: "Stomatologik ustanovka", services: ["unit"], request: ["kreslo"] },
  { label: "Uchlik / turbina", services: ["hand"], request: ["boshqa"] },
  { label: "Kompressor", services: ["compressor"], request: ["kompressor"] },
  { label: "Avtoklav / sterilizator", services: ["autoclave"], request: ["sterilizatsiya"] },
  { label: "Rentgen va CBCT", services: ["rentgen"], request: ["rentgen"] },
  { label: "Intraoral skaner", services: ["scanner"], request: ["skaner"] },
  { label: "Boshqa jihoz", services: [], request: ["boshqa"] },
];

const whenOptions = [
  { id: "today", label: "Bugun", offset: 0 },
  { id: "tomorrow", label: "Ertaga", offset: 1 },
  { id: "after", label: "Indinga", offset: 2 },
];

function isoAfter(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Schematic Toshkent district positions (percent of the map box) — an approximation, not GPS. */
const districtSpot: Record<string, [number, number]> = {
  Chilonzor: [30, 64], Yunusobod: [56, 22], "Mirzo Ulug‘bek": [72, 40], Shayxontohur: [40, 42], Mirobod: [58, 58], Yakkasaroy: [48, 62],
  Olmazor: [30, 34], Sergeli: [44, 84], Bektemir: [84, 74], Uchtepa: [16, 52], Yangihayot: [26, 86], Yashnobod: [80, 56],
};

function spotOf(item: UstaView, index: number): [number, number] {
  return districtSpot[item.district] ?? [20 + ((index * 23) % 60), 25 + ((index * 17) % 55)];
}

export function UstaCatalog() {
  const cartCount = useShopLineCount();
  const favs = useFavMasters();
  const params = useSearchParams();
  const { masters } = useUstaWork();
  const actions = useUstaActions();
  const listRef = useRef<HTMLDivElement>(null);
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [service, setService] = useState<"all" | UstaService>(() => {
    const raw = params.get("xizmat");
    return ustaServices.some((item) => item.id === raw) ? (raw as UstaService) : "all";
  });
  const [city, setCity] = useState("Toshkent");
  const [district, setDistrict] = useState("Barchasi");
  const [brand, setBrand] = useState("Barchasi");
  const [free, setFree] = useState("Barchasi");
  const [rating, setRating] = useState("Barchasi");
  const [sort, setSort] = useState("pop");
  const [note, setNote] = useState("");
  const [zoom, setZoom] = useState(1);
  const [bigMap, setBigMap] = useState(false);
  const [draft, setDraft] = useState<UstaRequestDraft | null>(null);

  const all = useMemo(() => ustaList(masters), [masters]);
  useEscape(bigMap, () => setBigMap(false));

  const items = useMemo(() => {
    const rows = all.filter((item) => {
      if (service !== "all" && !item.services.includes(service)) return false;
      if (city !== "Barchasi" && item.city !== city) return false;
      if (district !== "Barchasi" && item.district !== district) return false;
      if (brand !== "Barchasi" && !item.brands.includes(brand) && !item.tags.includes(brand)) return false;
      if (free === "online" && item.status !== "online") return false;
      if (free === "fast" && item.status === "offline") return false;
      if (rating === "4.8" && item.rating < 4.8) return false;
      if (rating === "4.5" && item.rating < 4.5) return false;
      if (q && !`${item.name} ${item.role} ${item.tags.join(" ")} ${item.brands.join(" ")} ${item.district}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const minutes = (text: string) => (/soat/.test(text) ? 60 * (Number(text.match(/\d+/)?.[0]) || 1) : Number(text.match(/\d+/)?.[0]) || 999);
    return [...rows].sort((a, b) => {
      if (sort === "rate") return b.rating - a.rating || b.reviews - a.reviews;
      if (sort === "years") return b.years - a.years;
      if (sort === "jobs") return b.jobs - a.jobs;
      if (sort === "fast") return minutes(a.response) - minutes(b.response);
      return b.popularity - a.popularity;
    });
  }, [all, brand, city, district, free, q, rating, service, sort]);

  const top = items[0];

  function emergency() {
    setService("all");
    setFree("online");
    setSort("fast");
    setNote("Hozir onlayn ustalar javob tezligi bo‘yicha saralandi. Ustani tanlab qo‘ng‘iroq qiling yoki so‘rov yuboring.");
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function findFor(next: UstaRequestDraft & { equipment: number; city: string }) {
    const kind = equipment[next.equipment];
    setDraft(next);
    setService(kind.services[0] ?? "all");
    setCity(next.city);
    setDistrict("Barchasi");
    const real = all.filter((item) => item.master && !item.master.mine && (!kind.services.length || kind.services.some((id) => item.services.includes(id))));
    setNote(
      real.length
        ? `Sizga mos ${real.length} ta tasdiqlangan usta topildi. Ustani tanlab “Buyurtma berish” ni bosing — so‘rov ma’lumotlaringiz bilan ochiladi.`
        : "Hozircha bu yo‘nalishda usta yo‘q.",
    );
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <ShopShell searchPath="/ustalar" cartCount={cartCount} placeholder="Usta, brend yoki xizmat turini qidiring..." showCamera={false}>
      <div className="us" data-testid="usta-catalog">
        <div className="us-head">
          <div>
            <h1>Ustalar va servis</h1>
            <p>Stomatologik uskunalar uchun professional ta’mirlash, o‘rnatish va texnik xizmat.</p>
          </div>
          <div className="us-head-acts">
            <button type="button" className="us-sos" onClick={emergency}>
              <PhoneCall className="i" />
              <span><b>Shoshilinch chaqiruv</b><small>24/7 tezkor xizmat</small></span>
            </button>
            <Link href="/ustalar/mening" className="us-join"><UserPlus className="i" /> Usta sifatida ro‘yxatdan o‘tish</Link>
          </div>
        </div>

        <div className="us-cols">
          <div className="us-main">
            <div className="us-tabs" role="tablist" aria-label="Xizmat turi">
              {ustaServices.map((item) => (
                <button key={item.id} type="button" role="tab" aria-selected={service === item.id} className={service === item.id ? "us-tab on" : "us-tab"} onClick={() => setService(item.id)}>
                  {tabIcons[item.id]}{item.label}
                </button>
              ))}
            </div>

            <div className="us-filters">
              <Field label="Shahar" value={city} onChange={(value) => { setCity(value); setDistrict("Barchasi"); }} options={["Barchasi", ...ustaCities]} />
              <Field label="Tuman" value={district} onChange={setDistrict} options={["Barchasi", ...(city === "Toshkent" ? toshkentDistricts : [])]} />
              <Field label="Brend tajribasi" value={brand} onChange={setBrand} options={["Barchasi", ...ustaBrandFilters]} />
              <Field label="Hozir bo‘sh" value={free} onChange={setFree} options={[["Barchasi", "Barchasi"], ["online", "Hozir onlayn"], ["fast", "Tez javob beradi"]]} />
              <Field label="Reyting" value={rating} onChange={setRating} options={[["Barchasi", "Barchasi"], ["4.8", "4.8 va yuqori"], ["4.5", "4.5 va yuqori"]]} />
              <label className="us-sort">
                <span>Saralash:</span>
                <select value={sort} aria-label="Saralash" onChange={(event) => setSort(event.target.value)}>
                  <option value="pop">Eng mashhur</option>
                  <option value="rate">Reyting</option>
                  <option value="fast">Javob tezligi</option>
                  <option value="years">Tajriba</option>
                  <option value="jobs">Bajarilgan ishlar</option>
                </select>
                <ChevronDown className="i" />
              </label>
            </div>

            <div className="us-found" ref={listRef}>
              <b>{items.length} ta usta topildi</b>
              {note ? (
                <p className="us-hint" role="status">{note} <button type="button" aria-label="Yopish" onClick={() => setNote("")}><X className="i" /></button></p>
              ) : null}
            </div>

            {items.length === 0 ? (
              <div className="us-empty">
                <b>{all.length === 0 ? "Hozircha usta yo‘q" : "Mos usta topilmadi"}</b>
                <p>Filtrlarni o‘zgartirib ko‘ring.</p>
                <button type="button" onClick={() => { setService("all"); setCity("Barchasi"); setDistrict("Barchasi"); setBrand("Barchasi"); setFree("Barchasi"); setRating("Barchasi"); }}>Filtrlarni tozalash</button>
              </div>
            ) : (
              <div className="us-list">
                {items.map((item) => (
                  <UstaCard
                    key={item.slug}
                    item={item}
                    fav={favs.has(item.slug)}
                    onFav={() => favs.toggle(item.slug)}
                    onAction={(kind) => actions.open(kind, item, kind === "order" && draft ? draft : undefined)}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="us-rail">
            <RepairForm onFind={findFor} />

            <section className="us-box us-mapbox">
              <h3>Ustalar xaritada</h3>
              <MiniMap items={items.slice(0, 6)} zoom={zoom} top={top} />
              <div className="us-zoom">
                <button type="button" aria-label="Kattalashtirish" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.2).toFixed(1)))}><Plus className="i" /></button>
                <button type="button" aria-label="Kichiklashtirish" onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(1)))}><Minus className="i" /></button>
              </div>
              <button type="button" className="us-ghost wide" onClick={() => setBigMap(true)}>Barcha ustalarni xaritada ko‘rish <ArrowRight className="i" /></button>
            </section>

            <section className="us-box">
              <h3>Nega StomaHub ustalari?</h3>
              <ul className="us-why">
                <li><ShieldCheck className="i" /><span><b>Tekshirilgan ustalar</b><small>Profil moderatsiyadan o‘tadi</small></span></li>
                <li><BadgeCheck className="i" /><span><b>Kafolatli xizmat</b><small>Kafolat muddati profilda</small></span></li>
                <li><Timer className="i" /><span><b>Tezkor javob</b><small>Onlayn ustalar darhol ko‘rinadi</small></span></li>
                <li><Tag className="i" /><span><b>Shaffof narxlar</b><small>Oldindan ko‘rsatilgan narxlar</small></span></li>
              </ul>
            </section>
          </aside>
        </div>

        {bigMap ? (
          <div className="us-modal" role="dialog" aria-modal="true" aria-label="Ustalar xaritada" onMouseDown={(event) => event.target === event.currentTarget && setBigMap(false)}>
            <div className="us-dialog wide">
              <div className="us-dialog-hd">
                <h3>Ustalar xaritada · {items.length} ta</h3>
                <button type="button" className="x" aria-label="Yopish" onClick={() => setBigMap(false)}><X className="i" /></button>
              </div>
              <div className="us-bigmap">
                <MiniMap items={items} zoom={1} big />
                <ul>
                  {items.map((item) => (
                    <li key={item.slug}>
                      <Avatar item={item} small />
                      <span><Link href={`/ustalar/${item.slug}`}>{item.name}</Link><small>{item.district || item.city}</small></span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="us-muted">Joylashuv tuman bo‘yicha taxminiy ko‘rsatilgan. Aniq manzil buyurtmada kelishiladi.</p>
            </div>
          </div>
        ) : null}

        {actions.node}
      </div>
    </ShopShell>
  );
}

function UstaCard({ item, fav, onFav, onAction }: { item: UstaView; fav: boolean; onFav: () => void; onAction: (kind: "call" | "telegram" | "order") => void }) {
  const real = Boolean(item.master);
  return (
    <article className="us-card" data-testid="usta-card" data-real={real ? "1" : undefined}>
      <Link href={`/ustalar/${item.slug}`} className="us-photo" aria-label={item.name}>
        {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span className="us-initials">{initials(item.name)}</span>}
        <span className={`us-status ${item.status}`}>{item.status === "soon" ? <Zap className="i" /> : <i />}{item.statusLabel}</span>
      </Link>

      <div className="us-info">
        <h3><Link href={`/ustalar/${item.slug}`}>{item.name}</Link> <BadgeCheck className="i badge" aria-label={real ? "Moderatsiyadan o‘tgan" : "Tasdiqlangan"} /></h3>
        <p className="us-role">{item.role}</p>
        <div className="us-tags">{item.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <p className="us-place"><MapPin className="i" /> {item.district ? `${item.city}, ${item.district}` : item.city}</p>
        <div className="us-stats">
          <span><CalendarClock className="i" /><b>{item.years} yil</b><small>tajriba</small></span>
          <span><Cog className="i" /><b>{item.jobs}+</b><small>bajarilgan ish</small></span>
          {item.rating ? (
            <span><Star className="i star" /><b>{item.rating.toFixed(1)}</b><small>({item.reviews} sharh)</small></span>
          ) : (
            <span><Star className="i none" /><b className="muted">Hali baho yo‘q</b><small>yangi usta</small></span>
          )}
        </div>
      </div>

      <div className="us-offer">
        <h4>Xizmat narxlari</h4>
        <div className="us-offer-grid">
          <div className="us-prices">
            {item.prices.length ? (
              item.prices.map((row) => (
                <div key={row.name}><span>{row.name}</span><b className={row.price === "Bepul" ? "free" : undefined}>{row.price}</b></div>
              ))
            ) : (
              <p className="us-muted">Narx ish hajmiga qarab so‘rovda kelishiladi.</p>
            )}
          </div>
          <ul className="us-facts">
            {item.warranty ? <li><ShieldCheck className="i" /> Kafolat: {item.warranty}</li> : <li><ShieldCheck className="i" /> Moderatsiyadan o‘tgan</li>}
            {item.response ? <li><Timer className="i" /> Javob vaqti: {item.response}</li> : <li><BriefcaseBusiness className="i" /> {item.services.length || 1} yo‘nalish</li>}
            {item.hours ? <li><Clock3 className="i" /> Ish vaqti: {item.hours}</li> : <li><Clock3 className="i" /> Vaqt so‘rovda kelishiladi</li>}
          </ul>
        </div>
        <div className="us-btns">
          <button type="button" className="us-ghost" onClick={() => onAction("call")}><Phone className="i" /> Qo‘ng‘iroq</button>
          <button type="button" className="us-ghost" onClick={() => onAction("telegram")}><Send className="i" /> Telegram</button>
          <button type="button" className="us-btn" onClick={() => onAction("order")}>Buyurtma berish</button>
        </div>
      </div>

      <button type="button" className={fav ? "us-heart on" : "us-heart"} aria-pressed={fav} aria-label={fav ? "Saqlanganlardan olib tashlash" : "Saqlash"} onClick={onFav}><Heart className="i" /></button>
    </article>
  );
}

function RepairForm({ onFind }: { onFind: (draft: UstaRequestDraft & { equipment: number; city: string }) => void }) {
  const [kind, setKind] = useState("");
  const [model, setModel] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [city, setCity] = useState("Toshkent");
  const [district, setDistrict] = useState("");
  const [when, setWhen] = useState("today");
  const [slot, setSlot] = useState<string>(timeRanges[2]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <form
      className="us-box us-repair"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const next: Record<string, string> = {};
        if (!kind) next.kind = "Jihoz turini tanlang.";
        if (text.trim().length < 10) next.text = "Muammoni kamida 10 ta belgida yozing.";
        setErrors(next);
        if (Object.keys(next).length) return;
        const index = Number(kind);
        const offset = whenOptions.find((item) => item.id === when)?.offset ?? 0;
        onFind({
          equipment: index,
          city,
          services: equipment[index].request,
          note: [model.trim() ? `${equipment[index].label}: ${model.trim()}.` : `${equipment[index].label}.`, text.trim()].join(" ").slice(0, 500),
          district: city === "Toshkent" ? district : city,
          date: isoAfter(offset),
          timeRange: slot,
          files: file ? [file] : undefined,
        });
      }}
    >
      <h3>Ta’mir so‘rovi</h3>
      <p className="sub">Uskuna va batafsil ma’lumot qoldiring, biz sizga mos ustani topamiz.</p>
      <label className="us-input">
        <span>Jihoz turi</span>
        <div className="sel">
          <select value={kind} aria-invalid={Boolean(errors.kind)} onChange={(event) => setKind(event.target.value)}>
            <option value="" disabled>Masalan, stomatologik ustanovka</option>
            {equipment.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}
          </select>
          <ChevronDown className="i" />
        </div>
        {errors.kind ? <em role="alert">{errors.kind}</em> : null}
      </label>
      <label className="us-input">
        <span>Brend va model</span>
        <input value={model} maxLength={80} placeholder="Masalan, Sirona Intego" onChange={(event) => setModel(event.target.value)} />
      </label>
      <label className="us-input">
        <span>Muammo tavsifi</span>
        <textarea value={text} maxLength={400} rows={3} placeholder="Muammoni qisqacha yozing..." aria-invalid={Boolean(errors.text)} onChange={(event) => setText(event.target.value)} />
        {errors.text ? <em role="alert">{errors.text}</em> : null}
      </label>
      <label className="us-file">
        <Upload className="i" />
        <span><b>{file ? file.name : "Rasm yoki video yuklash"}</b><small>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "(JPG, PNG, MP4 – 10 MB gacha)"}</small></span>
        {file ? <button type="button" className="x" aria-label="Faylni olib tashlash" onClick={(event) => { event.preventDefault(); setFile(null); }}><X className="i" /></button> : null}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          aria-label="Rasm yoki video"
          onChange={(event) => {
            const picked = event.target.files?.[0] ?? null;
            event.target.value = "";
            if (picked && picked.size > 10 * 1024 * 1024) {
              setErrors((current) => ({ ...current, file: "Fayl 10 MB dan katta bo‘lmasin." }));
              return;
            }
            setErrors((current) => ({ ...current, file: "" }));
            setFile(picked);
          }}
        />
      </label>
      {errors.file ? <em className="us-err" role="alert">{errors.file}</em> : null}
      <span className="us-label">Manzil</span>
      <div className="us-two">
        <div className="sel"><select aria-label="Shahar" value={city} onChange={(event) => { setCity(event.target.value); setDistrict(""); }}>{ustaCities.map((name) => <option key={name}>{name}</option>)}</select><ChevronDown className="i" /></div>
        <div className="sel">
          <select aria-label="Tuman" value={district} disabled={city !== "Toshkent"} onChange={(event) => setDistrict(event.target.value)}>
            <option value="">Tuman</option>
            {toshkentDistricts.map((name) => <option key={name}>{name}</option>)}
          </select>
          <ChevronDown className="i" />
        </div>
      </div>
      <span className="us-label">Qulay vaqt</span>
      <div className="us-two">
        <div className="sel"><select aria-label="Kun" value={when} onChange={(event) => setWhen(event.target.value)}>{whenOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown className="i" /></div>
        <div className="sel"><select aria-label="Soat" value={slot} onChange={(event) => setSlot(event.target.value)}>{timeRanges.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="i" /></div>
      </div>
      <button type="submit" className="us-btn wide"><Send className="i" /> So‘rov yuborish</button>
    </form>
  );
}

function Field({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: (string | [string, string])[] }) {
  return (
    <label className="us-field">
      <small>{label}</small>
      <select value={value} aria-label={label} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const [id, text] = typeof option === "string" ? [option, option] : option;
          return <option key={id} value={id}>{text}</option>;
        })}
      </select>
      <ChevronDown className="i" />
    </label>
  );
}

export function Avatar({ item, small }: { item: UstaView; small?: boolean }) {
  return (
    <span className={small ? "us-ava sm" : "us-ava"}>
      {item.image ? <img src={item.image} alt="" /> : <b>{initials(item.name)}</b>}
    </span>
  );
}

function MiniMap({ items, zoom, top, big }: { items: UstaView[]; zoom: number; top?: UstaView; big?: boolean }) {
  return (
    <div className={big ? "us-map big" : "us-map"} aria-label="Ustalar joylashuvi sxemasi">
      <div className="us-map-in" style={{ transform: `scale(${zoom})` }}>
        <svg viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true">
          <rect width="200" height="120" fill="#e9f4ef" />
          <path d="M0 78 C40 70 60 90 100 80 S160 60 200 70" stroke="#bfe0f2" strokeWidth="7" fill="none" />
          <path d="M20 0 L60 120 M120 0 L95 120 M0 40 L200 30 M150 0 L190 120 M0 100 L200 92" stroke="#fff" strokeWidth="3" fill="none" />
          <path d="M70 0 L80 120 M0 60 L200 54 M40 0 C70 40 120 50 200 12" stroke="#fff" strokeWidth="1.6" fill="none" />
          <circle cx="132" cy="70" r="16" fill="#d7ecdd" />
        </svg>
        <span className="us-city">Toshkent</span>
        {items.map((item, index) => {
          const [x, y] = spotOf(item, index);
          return (
            <Link key={item.slug} href={`/ustalar/${item.slug}`} className="us-pin" style={{ left: `${x}%`, top: `${y}%` }} aria-label={`${item.name} — ${item.district || item.city}`} title={item.name}>
              <Avatar item={item} small />
            </Link>
          );
        })}
      </div>
      {top && !big ? (
        <Link href={`/ustalar/${top.slug}`} className="us-map-card">
          <Avatar item={top} small />
          <span>
            <b>{top.name}</b>
            <small>{top.response ? `Javob: ${top.response}` : top.district || top.city}</small>
            {top.rating ? <small className="r"><Star className="i star" /> {top.rating.toFixed(1)} ({top.reviews})</small> : null}
          </span>
        </Link>
      ) : null}
    </div>
  );
}

function svgIcon(paths: ReactNode) {
  return <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>;
}
function ChairIcon() {
  return svgIcon(<><path d="M6 4v8h9l3 4" /><path d="M6 12l-2 6h6" /><path d="M10 18v3M7 21h6" /><path d="M15 6h4" /></>);
}
function HandpieceIcon() {
  return svgIcon(<><path d="M4 20 15 9" /><path d="m15 9 3-3 2 2-3 3z" /><path d="M9 13l2 2" /></>);
}
function CompressorIcon() {
  return svgIcon(<><rect x="3" y="9" width="14" height="9" rx="4" /><path d="M17 12h3v4h-3M6 18v2M14 18v2M8 9V6h4v3" /></>);
}
function AutoclaveIcon() {
  return svgIcon(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="11" cy="12" r="4" /><path d="M18 8v.01M18 12v.01" /></>);
}
function XrayIcon() {
  return svgIcon(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M12 7v10M9 9h6M9 12h6M9 15h6" /></>);
}
