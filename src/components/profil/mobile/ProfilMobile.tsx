"use client";
/* eslint-disable @next/next/no-img-element -- profile photos are content images */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  ChevronRight,
  ClipboardList,
  Coins,
  CreditCard,
  Crown,
  Globe,
  GraduationCap,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  Pencil,
  Search,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useFavorites } from "@/components/favorites-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { uploadImage } from "@/lib/image-upload";
import { useSavedPlaces } from "@/lib/saved-addresses";
import { loadOrders, syncOrders } from "@/lib/orders";
import { getBonusSnapshot, refreshBonus, subscribeBonus } from "@/lib/bonus";
import "./profil-mobile.css";

type Sheet = "edit" | "plus" | "fav" | "addr" | "pay" | "notes" | "lang" | "help" | "out";

const LANGUAGES = ["O‘zbekcha", "Ruscha", "English"];
const EMPTY_FIELD = "Ko‘rsatilmagan — tahrirlash orqali yozing";

const groupOne = [
  { id: "orders", title: "Mening buyurtmalarim", subtitle: "Buyurtmalar tarixi va holati", icon: ClipboardList, tint: "#e8f1ff", color: "#2f6bff", href: "/buyurtmalarim" },
  { id: "fav", title: "Sevimlilar", subtitle: "Saqlangan mahsulotlar va ustalar", icon: Heart, tint: "#fde8f0", color: "#e11d78", sheet: "fav" as const },
  { id: "courses", title: "Kurslarim", subtitle: "Onlayn kurslar va sertifikatlar", icon: GraduationCap, tint: "#f3e8ff", color: "#7c3aed", href: "/talim" },
  { id: "seminars", title: "Seminarlarim", subtitle: "Ro‘yxatdan o‘tgan seminarlar", icon: CalendarDays, tint: "#e8f1ff", color: "#2f6bff", href: "/seminarlar/yozuvlarim" },
  { id: "ads", title: "E‘lonlarim", subtitle: "Ish va xizmat e‘lonlarim", icon: Briefcase, tint: "#e7f8ef", color: "#0f9f75", href: "/ishlar" },
];

const groupTwo = [
  { id: "address", title: "Manzillarim", subtitle: "Yetkazib berish manzillari", icon: MapPin, tint: "#e8f1ff", color: "#2f6bff", sheet: "addr" as const },
  { id: "pay", title: "To‘lov usullari", subtitle: "Saqlangan kartalar va to‘lovlar", icon: CreditCard, tint: "#e7f8ef", color: "#0f9f75", sheet: "pay" as const },
  { id: "notes", title: "Bildirishnomalar", subtitle: "Yangiliklar va xabarlar", icon: Bell, tint: "#fff4e5", color: "#e08a00", sheet: "notes" as const },
  { id: "lang", title: "Til", subtitle: "", icon: Globe, tint: "#e8f1ff", color: "#2f6bff", sheet: "lang" as const },
  { id: "help", title: "Yordam", subtitle: "Savollar va qo‘llab-quvvatlash", icon: HelpCircle, tint: "#f3e8ff", color: "#7c3aed", sheet: "help" as const },
  { id: "out", title: "Chiqish", subtitle: "Hisobdan chiqish", icon: LogOut, tint: "#fff1f0", color: "#d92d20", sheet: "out" as const },
];

export function ProfilMobile() {
  const router = useRouter();
  const cart = useCart();
  const favorites = useFavorites();
  const { profile, updateProfile, logout, ready } = useDoctorProfile();
  const places = useSavedPlaces(Boolean(profile), ready);
  const fileRef = useRef<HTMLInputElement>(null);
  const lines = cart.items.length;
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState("");
  const [city, setCity] = useState("");
  const [orderCount, setOrderCount] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [avatar, setAvatar] = useState("");
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [draft, setDraft] = useState({ name, specialty, clinic, city });
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [help, setHelp] = useState("");
  const [addressDraft, setAddressDraft] = useState("");
  const [card, setCard] = useState("");
  const [cardDraft, setCardDraft] = useState("");

  useEffect(() => {
    if (!profile) return;
    setName(profile.fullName || "");
    if (profile.specialty) setSpecialty(profile.specialty);
    if (profile.clinic) setClinic(profile.clinic);
    if (profile.city) setCity(profile.city);
    if (profile.avatarUrl && profile.avatarUrl !== "/img/mobile/avatar.jpg") setAvatar(profile.avatarUrl);
  }, [profile]);

  useEffect(() => {
    const load = () => setOrderCount(loadOrders().length);
    void syncOrders(true).then(load);
    window.addEventListener("sk-orders-changed", load);
    void refreshBonus();
    const unsub = subscribeBonus(() => setBonus(getBonusSnapshot().info?.balance ?? 0));
    return () => {
      window.removeEventListener("sk-orders-changed", load);
      unsub();
    };
  }, []);

  function openSheet(next: Sheet) {
    setError("");
    setNote("");
    if (next === "edit") setDraft({ name, specialty, clinic, city });
    setSheet(next);
  }

  async function saveEdit() {
    if (!draft.name.trim()) {
      setError("Ismni kiriting");
      return;
    }
    const next = {
      name: draft.name.trim(),
      specialty: draft.specialty.trim(),
      clinic: draft.clinic.trim(),
      city: draft.city.trim(),
    };
    setName(next.name);
    setSpecialty(next.specialty);
    setClinic(next.clinic);
    setCity(next.city);
    if (profile) {
      await updateProfile({ fullName: next.name, specialty: next.specialty, clinic: next.clinic, city: next.city });
    }
    setError("");
    setNote("Saqlangan");
  }

  const q = query.trim().toLowerCase();
  const match = (title: string, subtitle: string) => !q || `${title} ${subtitle}`.toLowerCase().includes(q);
  const rowsOne = groupOne.filter((row) => match(row.title, row.subtitle));
  const rowsTwo = groupTwo.filter((row) => match(row.title, row.id === "lang" ? lang : row.subtitle));

  return (
    <div className="pm lg:hidden" data-testid="mobile-profil">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <button type="button" className="mh-ic" aria-label="Qidiruv" aria-expanded={searchOpen} onClick={() => setSearchOpen((open) => !open)}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {lines > 0 ? <span className="mh-badge" data-testid="pf-cart-badge">{lines > 9 ? "9+" : lines}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>
      <div className="pm-body">
        {searchOpen ? (
          <label className="pm-search">
            <Search />
            <input value={query} placeholder="Bo‘lim qidirish" aria-label="Profil qidirish" onChange={(event) => setQuery(event.target.value)} />
          </label>
        ) : null}
        <article className="pm-hero">
          <div className="pm-hero-row">
            <div className="pm-ava">
              {avatar ? <img src={avatar} alt="" /> : <span className="pm-ava-empty" aria-hidden />}
              <button type="button" className="pm-cam" aria-label="Rasm yuklash" onClick={() => fileRef.current?.click()}>
                <Camera />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void uploadImage(file, "avatar").then(async (url) => {
                    const result = await updateProfile({ avatarUrl: url });
                    if (result.ok) setAvatar(url);
                    else setNote("Rasmni saqlab bo‘lmadi");
                  }).catch(() => setNote("Rasmni yuklab bo‘lmadi"));
                  event.target.value = "";
                }}
              />
            </div>
            <div className="pm-id">
              <h1>{name.trim() || "Ism ko‘rsatilmagan"}</h1>
              <p className="pm-role">{specialty.trim() || EMPTY_FIELD}</p>
              <p className="pm-meta"><Building2 /> {clinic.trim() || EMPTY_FIELD}</p>
              <p className="pm-meta"><MapPin /> {city.trim() || EMPTY_FIELD}</p>
              <button type="button" className="pm-pill" data-testid="pf-edit-pill" onClick={() => openSheet("edit")}>Profilni tahrirlash →</button>
            </div>
          </div>
        </article>
        <div className="pm-stats">
          <Link href="/buyurtmalarim" className="pm-stat"><ShoppingBag color="#12b981" /><b>{orderCount}</b><span>Buyurtmalar</span></Link>
          <Link href="/bonuslarim" className="pm-stat"><Coins color="#12b981" /><b className="pm-money">{bonus.toLocaleString("fr-FR")} so‘m</b><span>Bonus balans</span></Link>
        </div>
        <button type="button" className="pm-plus" data-testid="pf-plus" onClick={() => openSheet("plus")}>
          <i className="pm-crown"><Crown /></i>
          <span><b>StomaHub Plus</b><span>Ko‘proq imkoniyatlar, maxsus takliflar va chegirmalar</span></span>
          <ChevronRight />
        </button>
        {rowsOne.length + rowsTwo.length === 0 ? <p className="pm-empty">Mos bo‘lim yo‘q</p> : null}
        {rowsOne.length > 0 ? (
          <nav className="pm-group" aria-label="Kabinet">
            {rowsOne.map((row) => <MenuRow key={row.id} row={row} onSheet={openSheet} />)}
          </nav>
        ) : null}
        {rowsTwo.length > 0 ? (
          <nav className="pm-group" aria-label="Sozlamalar">
            {rowsTwo.map((row) => (
              <MenuRow key={row.id} row={{ ...row, subtitle: row.id === "lang" ? lang : row.subtitle }} onSheet={openSheet} />
            ))}
          </nav>
        ) : null}
        <div className="pm-pad" />
      </div>
      <button type="button" className="pm-go" data-testid="pf-edit" onClick={() => openSheet("edit")}>
        <Pencil /> Profilni tahrirlash →
      </button>
      {sheet ? (
        <div className="pm-sheet" role="dialog" aria-label="Profil" data-testid="pf-sheet">
          <button type="button" aria-label="Yopish" data-testid="pf-sheet-close" className="absolute inset-0" onClick={() => setSheet(null)} />
          <div className="pm-box">
            {sheet === "edit" ? (
              <>
                <h3>Profilni tahrirlash</h3>
                <label>Ism<input value={draft.name} aria-label="Ism" onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
                <label>Mutaxassislik<input value={draft.specialty} aria-label="Mutaxassislik" onChange={(event) => setDraft({ ...draft, specialty: event.target.value })} /></label>
                <label>Klinika<input value={draft.clinic} aria-label="Klinika" onChange={(event) => setDraft({ ...draft, clinic: event.target.value })} /></label>
                <label>Manzil<input value={draft.city} aria-label="Manzil" onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></label>
                {error ? <p>{error}</p> : null}
                {note ? <p className="pm-note" data-testid="pf-saved">{note}</p> : null}
                <button type="button" className="pm-save" data-testid="pf-save" onClick={() => void saveEdit()}>Saqlash</button>
              </>
            ) : null}
            {sheet === "plus" ? (
              <>
                <h3>StomaHub Plus</h3>
                <p>Ko‘proq imkoniyatlar, maxsus takliflar va chegirmalar.</p>
                <button type="button" className="pm-save" onClick={() => setSheet(null)}>Tushunarli</button>
              </>
            ) : null}
            {sheet === "fav" ? (
              <>
                <h3>Sevimlilar</h3>
                <p>{favorites.ids.length > 0 ? `${favorites.ids.length} ta saqlangan.` : "Saqlangan mahsulotlar va ustalar shu yerda."}</p>
                <Link href="/marketplace" className="pm-save" style={{ display: "grid", placeItems: "center" }} onClick={() => setSheet(null)}>Marketplace</Link>
              </>
            ) : null}
            {sheet === "addr" ? (
              <>
                <h3>Manzillarim</h3>
                {places.places.length === 0 ? <p>Manzil yo‘q — qo‘shish orqali yozing.</p> : places.places.map((place) => <p key={place.id}>{place.label}: {place.address}</p>)}
                <input value={addressDraft} aria-label="Yangi manzil" placeholder="Yangi manzil" onChange={(event) => setAddressDraft(event.target.value)} />
                <button type="button" className="pm-save" onClick={() => { if (!addressDraft.trim()) { setError("Manzilni kiriting"); return; } void places.save({ label: "Manzil", address: addressDraft.trim(), city: city || undefined }).then((result) => { if (!result.ok) { setError(result.error); return; } setAddressDraft(""); setError(""); setNote("Saqlangan"); }); }}>Saqlash</button>
                {error ? <p>{error}</p> : null}
                {note ? <p className="pm-note">{note}</p> : null}
              </>
            ) : null}
            {sheet === "pay" ? (
              <>
                <h3>To‘lov usullari</h3>
                <p>{card || "Saqlangan karta yo‘q"}</p>
                <input value={cardDraft} aria-label="Karta" placeholder="Karta raqami" onChange={(event) => setCardDraft(event.target.value)} />
                <button type="button" className="pm-save" onClick={() => { if (cardDraft.trim().length < 4) { setError("Karta raqamini kiriting"); return; } setCard(`**** ${cardDraft.trim().slice(-4)}`); setCardDraft(""); setError(""); setNote("Saqlangan"); }}>Saqlash</button>
                {error ? <p>{error}</p> : null}
                {note ? <p className="pm-note">{note}</p> : null}
              </>
            ) : null}
            {sheet === "notes" ? (
              <>
                <h3>Bildirishnomalar</h3>
                <p>Yangiliklar va xabarlar yuqoridagi qo‘ng‘iroqchada.</p>
                <button type="button" className="pm-save" onClick={() => setSheet(null)}>Tushunarli</button>
              </>
            ) : null}
            {sheet === "lang" ? (
              <>
                <h3>Til</h3>
                {LANGUAGES.map((item) => (
                  <button key={item} type="button" className={lang === item ? "pick on" : "pick"} onClick={() => setLang(item)}>{item}</button>
                ))}
              </>
            ) : null}
            {sheet === "help" ? (
              <>
                <h3>Yordam</h3>
                <textarea value={help} aria-label="Xabar" placeholder="Savolingizni yozing" onChange={(event) => setHelp(event.target.value)} />
                {note ? <p className="pm-note" data-testid="pf-help-sent">{note}</p> : null}
                <button type="button" className="pm-save" onClick={() => { if (help.trim().length < 3) { setError("Xabarni yozing"); setNote(""); return; } setError(""); setNote("So‘rov yuborildi"); }}>Yuborish</button>
                {error ? <p>{error}</p> : null}
              </>
            ) : null}
            {sheet === "out" ? (
              <>
                <h3>Chiqish</h3>
                <p>Hisobdan chiqasizmi?</p>
                <button
                  type="button"
                  className="pm-save pm-danger"
                  data-testid="pf-logout"
                  onClick={() => { void logout().then(() => router.push("/kirish")); }}
                >
                  Hisobdan chiqish
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuRow({
  row,
  onSheet,
}: {
  row: { id: string; title: string; subtitle: string; icon: typeof Heart; tint: string; color: string; count?: number; href?: string; sheet?: Sheet };
  onSheet: (sheet: Sheet) => void;
}) {
  const Icon = row.icon;
  const body = (
    <>
      <i className="pm-ico" style={{ background: row.tint, color: row.color }}><Icon /></i>
      <span className="pm-copy"><b>{row.title}</b><small>{row.subtitle}</small></span>
      {row.count != null ? <span className="pm-count">{row.count}</span> : null}
      <ChevronRight className="pm-chev" />
    </>
  );
  if (row.href) {
    return <Link href={row.href} className="pm-row" data-testid={`pf-row-${row.id}`}>{body}</Link>;
  }
  return (
    <button type="button" className="pm-row" data-testid={`pf-row-${row.id}`} onClick={() => row.sheet && onSheet(row.sheet)}>
      {body}
    </button>
  );
}
