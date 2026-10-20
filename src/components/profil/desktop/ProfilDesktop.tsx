"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  Award,
  Bell,
  Building2,
  Camera,
  Clock,
  CreditCard,
  Globe,
  GraduationCap,
  Heart,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  Shield,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { statusLabel } from "@/data/desktop-orders";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { formatPhoneDisplay } from "@/lib/doctor-profile";
import { useSavedPlaces } from "@/lib/saved-addresses";
import { uploadImage } from "@/lib/image-upload";
import { loadOrders, syncOrders } from "@/lib/orders";
import { toDesktopOrder } from "@/lib/order-present";
import { refreshBonus, getBonusSnapshot, subscribeBonus } from "@/lib/bonus";
import "./profil.css";

type Section = "shaxsiy" | "klinika" | "kurslar" | "saqlangan" | "manzil" | "tolov" | "bildirish" | "xavfsizlik" | "chiqish";

type Address = { id: string; title: string; line: string };
type PayCard = { id: string; brand: "UZCARD" | "HUMO"; last4: string; exp: string };

const courses: { title: string; progress: number; image: string; done: boolean }[] = [];
const EMPTY_FIELD = "Ko‘rsatilmagan — tahrirlash orqali yozing";

const specs = ["Ortoped stomatolog", "Terapevt stomatolog", "Jarroh stomatolog", "Ortodont", "Bolalar stomatologi"];
const languages = ["O‘zbekcha", "Ruscha", "English"];

const menu: { id?: Section; href?: string; label: string; icon: typeof User }[] = [
  { id: "klinika", label: "Klinikam", icon: Building2 },
  { href: "/buyurtmalarim", label: "Buyurtmalarim", icon: ShoppingBag },
  { id: "kurslar", label: "Kurslarim va sertifikatlar", icon: GraduationCap },
  { id: "saqlangan", label: "Saqlanganlar", icon: Heart },
  { id: "manzil", label: "Manzillar", icon: MapPin },
  { id: "tolov", label: "To‘lov usullari", icon: CreditCard },
  { id: "bildirish", label: "Bildirishnomalar", icon: Bell },
  { id: "xavfsizlik", label: "Xavfsizlik", icon: Shield },
  { id: "chiqish", label: "Chiqish", icon: LogOut },
];

const settingKeys = [
  ["email", "Email bildirishnomalari"],
  ["sms", "SMS bildirishnomalari"],
  ["market", "Market yangiliklari"],
  ["courses", "Kurs va tadbirlar"],
  ["offers", "Maxsus takliflar"],
] as const;

export function ProfilDesktop() {
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const { profile, updateProfile, ready } = useDoctorProfile();
  const savedPlaces = useSavedPlaces(Boolean(profile), ready);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState("");
  const [orderCount, setOrderCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<ReturnType<typeof toDesktopOrder>[]>([]);
  const [bonus, setBonus] = useState(0);
  const [section, setSection] = useState<Section>("shaxsiy");
  const [editing, setEditing] = useState(false);
  const [editClinic, setEditClinic] = useState(false);
  const [note, setNote] = useState("");
  const [language, setLanguage] = useState(languages[0]);
  const [toggles, setToggles] = useState<Record<string, boolean>>({ email: true, sms: true, market: true, courses: true, offers: true });
  const [twoFactor, setTwoFactor] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    spec: "",
    about: "",
  });
  const [clinic, setClinic] = useState({
    name: "",
    address: "",
    hours: "",
    phone: "",
    site: "",
  });
  const [cards, setCards] = useState<PayCard[]>([]);
  const [modal, setModal] = useState<null | "addr" | "card">(null);
  const [addrForm, setAddrForm] = useState({ title: "", line: "" });
  const [cardForm, setCardForm] = useState({ brand: "UZCARD" as PayCard["brand"], last4: "", exp: "" });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  function onAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    void onAvatarFile(file);
  }

  function toggle(key: string) {
    setToggles((current) => ({ ...current, [key]: !current[key] }));
  }

  useEffect(() => {
    if (!profile) return;
    setForm((current) => ({
      ...current,
      name: profile.fullName,
      phone: formatPhoneDisplay(profile.phone),
      email: profile.email || "",
      spec: profile.specialty || "",
      about: profile.bio || "",
    }));
    setClinic((current) => ({
      ...current,
      name: profile.clinic || "",
      address: profile.city || "",
      phone: formatPhoneDisplay(profile.phone),
    }));
    if (profile.avatarUrl) setAvatar(profile.avatarUrl);
  }, [profile]);

  useEffect(() => {
    const load = () => {
      const rows = loadOrders().map(toDesktopOrder);
      setOrderCount(rows.length);
      setRecentOrders(rows.slice(0, 5));
    };
    void syncOrders(true).then(load);
    window.addEventListener("sk-orders-changed", load);
    void refreshBonus();
    const unsub = subscribeBonus(() => setBonus(getBonusSnapshot().info?.balance ?? 0));
    return () => {
      window.removeEventListener("sk-orders-changed", load);
      unsub();
    };
  }, []);

  async function savePersonal() {
    const result = await updateProfile({
      fullName: form.name.trim(),
      phone: form.phone,
      specialty: form.spec.trim(),
      clinic: clinic.name.trim(),
      city: clinic.address.trim() || profile?.city,
      bio: form.about.trim(),
    });
    setEditing(false);
    setNote(result.ok ? "Shaxsiy ma‘lumotlar saqlandi" : "Saqlab bo‘lmadi");
  }

  async function onAvatarFile(file: File) {
    try {
      const url = await uploadImage(file, "avatar");
      const result = await updateProfile({ avatarUrl: url });
      if (result.ok) {
        setAvatar(url);
        setNote("Rasm saqlandi");
      } else setNote("Rasmni saqlab bo‘lmadi");
    } catch {
      setNote("Rasmni yuklab bo‘lmadi");
    }
  }

  async function addAddress() {
    if (!addrForm.title.trim() || !addrForm.line.trim()) {
      setNote("Manzil nomi va qatorini kiriting");
      return;
    }
    const result = await savedPlaces.save({ label: addrForm.title.trim(), address: addrForm.line.trim(), city: profile?.city });
    setAddrForm({ title: "", line: "" });
    setModal(null);
    setNote(result.ok ? "Yangi manzil qo‘shildi" : result.error);
  }

  function addCard() {
    if (!/^\d{4}$/.test(cardForm.last4.trim()) || !/^\d{2}\/\d{2}$/.test(cardForm.exp.trim())) {
      setNote("Karta raqami 4 ta raqam va muddat OO/YY bo‘lishi kerak");
      return;
    }
    setCards((list) => [{ id: `card-${Date.now()}`, brand: cardForm.brand, last4: cardForm.last4.trim(), exp: cardForm.exp.trim() }, ...list]);
    setCardForm({ brand: "UZCARD", last4: "", exp: "" });
    setModal(null);
    setNote("Yangi karta qo‘shildi");
  }

  function downloadCert(title: string) {
    const blob = new Blob([`${title}\nSertifikat\n${form.name}\n${clinic.name}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNote("Sertifikat yuklab olindi");
  }

  const saved = favs.map((id) => ({ id, name: id, price: 0 }));
  const addresses: Address[] = savedPlaces.places.map((place) => ({
    id: place.id,
    title: place.label,
    line: [place.city, place.address].filter(Boolean).join(", "),
  }));

  return (
    <ShopShell searchPath="/profil" cartCount={cartCount} placeholder="Stomatologiya mahsulotlari, kurslar, ustalar..." showCamera={false}>
      <div className="pf-page">
        {note ? <p className="pf-note">{note}</p> : null}
        <header className="pf-hero">
          <div className="pf-ava">
            {avatar ? <img src={avatar} alt={form.name || "Profil"} /> : <span className="pf-ava-empty" aria-hidden><User className="i" /></span>}
            <button type="button" aria-label="Rasm yuklash" onClick={() => fileRef.current?.click()}>
              <Camera className="i" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden aria-label="Profil rasmi" onChange={onAvatar} />
          </div>
          <div>
            <h1>{form.name.trim() || "Ism ko‘rsatilmagan"}</h1>
            <p className="pf-role">{form.spec.trim() || EMPTY_FIELD}</p>
            <div className="pf-meta">
              <span><Building2 className="i" /> {clinic.name.trim() || EMPTY_FIELD}</span>
              <span><MapPin className="i" /> {(profile?.city || clinic.address).trim() || EMPTY_FIELD}</span>
            </div>
          </div>
          <div className="pf-bar">
            <label>Profil to‘liqligi <span>{Math.round(([form.name, form.phone, form.spec, clinic.name, profile?.city, form.about].filter(Boolean).length / 6) * 100)}%</span></label>
            <b><i /></b>
          </div>
          <button
            type="button"
            className="pf-edit"
            onClick={() => {
              setSection("shaxsiy");
              setEditing(true);
            }}
          >
            <Pencil className="i" /> Profilni tahrirlash
          </button>
        </header>

        <div className="pf-stats">
          <Link className="pf-stat" href="/buyurtmalarim">
            <span className="mark"><ShoppingBag className="i" /></span>
            <span><b>{orderCount}</b><span>Buyurtmalar</span></span>
          </Link>
          <button type="button" className="pf-stat" onClick={() => setSection("kurslar")}>
            <span className="mark"><Award className="i" /></span>
            <span><b>0</b><span>Sertifikatlar</span></span>
          </button>
          <button type="button" className="pf-stat" onClick={() => setSection("kurslar")}>
            <span className="mark"><GraduationCap className="i" /></span>
            <span><b>0</b><span>Kurslar</span></span>
          </button>
          <button type="button" className="pf-stat" onClick={() => setNote(`Bonus balans: ${bonus.toLocaleString("fr-FR")} so‘m`)}>
            <span className="mark"><Star className="i" /></span>
            <span><b>{bonus.toLocaleString("fr-FR")}</b><span>Bonus, so‘m</span></span>
          </button>
          <button type="button" className="pf-stat" onClick={() => setSection("saqlangan")}>
            <span className="mark"><Heart className="i" /></span>
            <span><b>{favs.length}</b><span>Saqlanganlar</span></span>
          </button>
        </div>

        <div className="pf-body">
          <nav className="pf-menu" aria-label="Profil bo‘limlari">
            <button type="button" className="head" onClick={() => setSection("shaxsiy")}>
              <User className="i" /> Shaxsiy ma‘lumotlar
            </button>
            {menu.map((item) => {
              const Icon = item.icon;
              if (item.href) {
                return (
                  <Link className="item" href={item.href} key={item.label}>
                    <Icon className="i" /> {item.label}
                  </Link>
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === "chiqish" ? "item out" : section === item.id ? "item on" : "item"}
                  onClick={() => item.id && setSection(item.id)}
                >
                  <Icon className="i" /> {item.label}
                </button>
              );
            })}
          </nav>

          <div className="pf-stack">
            {section === "shaxsiy" ? (
              <>
                <div className="pf-top">
                  <PersonalCard form={form} setForm={setForm} editing={editing} setEditing={setEditing} onSave={savePersonal} />
                  <ClinicCard clinic={clinic} setClinic={setClinic} editing={editClinic} setEditing={setEditClinic} onSave={() => { setEditClinic(false); void updateProfile({ clinic: clinic.name.trim(), city: clinic.address.trim() }).then((result) => setNote(result.ok ? "Klinika ma‘lumotlari saqlandi" : "Saqlab bo‘lmadi")); }} />
                  <SettingsCard language={language} setLanguage={setLanguage} toggles={toggles} onToggle={toggle} />
                </div>
                <div className="pf-mid">
                  <CoursesCard onOpen={() => setSection("kurslar")} onContinue={(title) => setNote(`«${title}» davom ettirilmoqda`)} onCert={downloadCert} />
                  <OrdersCard orders={recentOrders} />
                </div>
                <div className="pf-bot">
                  <AddressCard addresses={addresses} limit={2} onAdd={() => setModal("addr")} onOpen={() => setSection("manzil")} />
                  <PayCardList cards={cards} limit={2} onAdd={() => setModal("card")} onOpen={() => setSection("tolov")} />
                </div>
              </>
            ) : null}
            {section === "klinika" ? (
              <ClinicCard clinic={clinic} setClinic={setClinic} editing={editClinic} setEditing={setEditClinic} onSave={() => { setEditClinic(false); void updateProfile({ clinic: clinic.name.trim(), city: clinic.address.trim() }).then((result) => setNote(result.ok ? "Klinika ma‘lumotlari saqlandi" : "Saqlab bo‘lmadi")); }} />
            ) : null}
            {section === "kurslar" ? <CoursesCard onOpen={() => setSection("kurslar")} onContinue={(title) => setNote(`«${title}» davom ettirilmoqda`)} onCert={downloadCert} /> : null}
            {section === "saqlangan" ? <SavedCard items={saved} /> : null}
            {section === "manzil" ? <AddressCard addresses={addresses} onAdd={() => setModal("addr")} onOpen={() => setSection("manzil")} /> : null}
            {section === "tolov" ? <PayCardList cards={cards} onAdd={() => setModal("card")} onOpen={() => setSection("tolov")} /> : null}
            {section === "bildirish" ? <SettingsCard language={language} setLanguage={setLanguage} toggles={toggles} onToggle={toggle} /> : null}
            {section === "xavfsizlik" ? (
              <SecurityCard
                passwords={passwords}
                setPasswords={setPasswords}
                twoFactor={twoFactor}
                setTwoFactor={setTwoFactor}
                onSave={() => {
                  setPasswords({ current: "", next: "", confirm: "" });
                  setNote("Xavfsizlik sozlamalari saqlandi");
                }}
              />
            ) : null}
            {section === "chiqish" ? (
              <section className="pf-card">
                <h3>Chiqish</h3>
                <p className="pf-role">Hisobdan chiqishni tasdiqlaysizmi? Joriy seans ochiq qoladi.</p>
                <button type="button" className="pf-go pf-save" onClick={() => setNote("Chiqish so‘rovi qabul qilindi")}>Tasdiqlash</button>
              </section>
            ) : null}
          </div>
        </div>
      </div>

      {modal ? (
        <div className="pf-modal" role="presentation" onClick={() => setModal(null)}>
          <div className="pf-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            {modal === "addr" ? (
              <>
                <h3>Yangi manzil</h3>
                <input value={addrForm.title} placeholder="Manzil nomi" aria-label="Manzil nomi" onChange={(event) => setAddrForm({ ...addrForm, title: event.target.value })} />
                <input value={addrForm.line} placeholder="Manzil" aria-label="Manzil" onChange={(event) => setAddrForm({ ...addrForm, line: event.target.value })} />
                <div className="acts">
                  <button type="button" className="pf-edit" onClick={() => setModal(null)}>Bekor</button>
                  <button type="button" className="pf-go" onClick={addAddress}>Qo‘shish</button>
                </div>
              </>
            ) : (
              <>
                <h3>Yangi karta</h3>
                <select value={cardForm.brand} aria-label="Karta turi" onChange={(event) => setCardForm({ ...cardForm, brand: event.target.value as PayCard["brand"] })}>
                  <option>UZCARD</option>
                  <option>HUMO</option>
                </select>
                <input value={cardForm.last4} placeholder="Oxirgi 4 raqam" aria-label="Oxirgi 4 raqam" inputMode="numeric" maxLength={4} onChange={(event) => setCardForm({ ...cardForm, last4: event.target.value })} />
                <input value={cardForm.exp} placeholder="OO/YY" aria-label="Amal qilish muddati" onChange={(event) => setCardForm({ ...cardForm, exp: event.target.value })} />
                <div className="acts">
                  <button type="button" className="pf-edit" onClick={() => setModal(null)}>Bekor</button>
                  <button type="button" className="pf-go" onClick={addCard}>Qo‘shish</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </ShopShell>
  );
}

function PersonalCard({
  form,
  setForm,
  editing,
  setEditing,
  onSave,
}: {
  form: { name: string; phone: string; email: string; spec: string; about: string };
  setForm: (next: { name: string; phone: string; email: string; spec: string; about: string }) => void;
  editing: boolean;
  setEditing: (value: boolean) => void;
  onSave: () => void;
}) {
  function field<K extends keyof typeof form>(key: K, value: string) {
    setForm({ ...form, [key]: value });
  }
  return (
    <section className="pf-card">
      <h3>
        Shaxsiy ma‘lumotlar
        <button type="button" onClick={() => setEditing(!editing)}>{editing ? "Yopish" : "Tahrirlash"}</button>
      </h3>
      <div className="pf-grid">
        <label>Ism familiya<input value={form.name} disabled={!editing} onChange={(event) => field("name", event.target.value)} /></label>
        <label>Telefon<input value={form.phone} disabled={!editing} onChange={(event) => field("phone", event.target.value)} /></label>
        <label>Email<input value={form.email} disabled={!editing} onChange={(event) => field("email", event.target.value)} /></label>
        <label>
          Mutaxassislik
          <select value={form.spec} disabled={!editing} onChange={(event) => field("spec", event.target.value)}>
            <option value="">Tanlang</option>
            {specs.map((spec) => <option key={spec}>{spec}</option>)}
          </select>
        </label>
      </div>
      <label className="pf-wide">
        Men haqimda
        <textarea value={form.about} disabled={!editing} onChange={(event) => field("about", event.target.value)} />
      </label>
      {editing ? <button type="button" className="pf-go pf-save" onClick={onSave}>Saqlash</button> : null}
    </section>
  );
}

function ClinicCard({
  clinic,
  setClinic,
  editing,
  setEditing,
  onSave,
}: {
  clinic: { name: string; address: string; hours: string; phone: string; site: string };
  setClinic: (next: { name: string; address: string; hours: string; phone: string; site: string }) => void;
  editing: boolean;
  setEditing: (value: boolean) => void;
  onSave: () => void;
}) {
  function field<K extends keyof typeof clinic>(key: K, value: string) {
    setClinic({ ...clinic, [key]: value });
  }
  return (
    <section className="pf-card pf-clinic">
      <h3>
        Klinikam
        <button type="button" onClick={() => setEditing(!editing)}>{editing ? "Yopish" : "Tahrirlash"}</button>
      </h3>
      <div className="pf-shot">
        <span className="pf-ava-empty" aria-hidden><Building2 className="i" /></span>
        <b>{clinic.name.trim() || EMPTY_FIELD}</b>
      </div>
      {editing ? (
        <div className="pf-grid" style={{ marginTop: "calc(.35 * var(--u))" }}>
          <label>Nomi<input value={clinic.name} onChange={(event) => field("name", event.target.value)} /></label>
          <label>Telefon<input value={clinic.phone} onChange={(event) => field("phone", event.target.value)} /></label>
          <label>Manzil<input value={clinic.address} onChange={(event) => field("address", event.target.value)} /></label>
          <label>Sayt<input value={clinic.site} onChange={(event) => field("site", event.target.value)} /></label>
          <label>Ish vaqti<input value={clinic.hours} onChange={(event) => field("hours", event.target.value)} /></label>
        </div>
      ) : (
        <>
          <p><MapPin className="i" /> {clinic.address.trim() || EMPTY_FIELD}</p>
          <p><Clock className="i" /> Ish vaqti: {clinic.hours.trim() || EMPTY_FIELD}</p>
          <p><Phone className="i" /> {clinic.phone.trim() || EMPTY_FIELD}</p>
          <p><Globe className="i" /> {clinic.site.trim() || EMPTY_FIELD}</p>
        </>
      )}
      {editing ? <button type="button" className="pf-go pf-save" onClick={onSave}>Saqlash</button> : null}
    </section>
  );
}

function SettingsCard({
  language,
  setLanguage,
  toggles,
  onToggle,
}: {
  language: string;
  setLanguage: (value: string) => void;
  toggles: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <section className="pf-card">
      <h3>Tizim sozlamalari</h3>
      <label className="pf-wide" style={{ marginTop: 0 }}>
        Til
        <select value={language} aria-label="Til" onChange={(event) => setLanguage(event.target.value)}>
          {languages.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      {settingKeys.map(([key, label]) => (
        <div className="pf-row" key={key}>
          <span>{label}</span>
          <button type="button" className={toggles[key] ? "pf-switch on" : "pf-switch"} aria-pressed={toggles[key]} aria-label={label} onClick={() => onToggle(key)}>
            <i />
          </button>
        </div>
      ))}
    </section>
  );
}

function CoursesCard({
  onOpen,
  onContinue,
  onCert,
}: {
  onOpen: () => void;
  onContinue: (title: string) => void;
  onCert: (title: string) => void;
}) {
  return (
    <section className="pf-card">
      <h3>Kurslarim va sertifikatlar <button type="button" onClick={onOpen}>Barchasini ko‘rish</button></h3>
      {courses.length === 0 ? <p className="pf-empty">Hozircha kurs yo‘q — kurs ochilganda shu yerda ko‘rinadi.</p> : null}
      <div className="pf-courses">
        {courses.map((course) => (
          <article className="pf-course" key={course.title}>
            <img src={course.image} alt="" />
            <div>
              <b>{course.title}</b>
              <div className="pf-cstat">
                <span className={course.done ? "done" : ""}>{course.done ? "Sertifikat olingan" : "Davom etmoqda"}</span>
                <em>{course.progress}%</em>
              </div>
              <div className="pf-prog"><i className={course.done ? "done" : ""} style={{ width: `${course.progress}%` }} /></div>
              {course.done ? (
                <button type="button" onClick={() => onCert(course.title)}>Sertifikatni yuklab olish</button>
              ) : (
                <button type="button" onClick={() => onContinue(course.title)}>Davom ettirish</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function OrdersCard({ orders }: { orders: ReturnType<typeof toDesktopOrder>[] }) {
  return (
    <section className="pf-card">
      <h3>Oxirgi buyurtmalarim <Link className="pf-link" href="/buyurtmalarim">Barchasini ko‘rish</Link></h3>
      {orders.length === 0 ? <p className="pf-empty">Hali buyurtma yo‘q</p> : null}
      {orders.map((order) => (
        <Link className="pf-order" href="/buyurtmalarim" key={order.id}>
          <img src={order.images[0] || "/img/design-pr13/ui/avatar.png"} alt="" />
          <span>
            <b>№ {order.number}</b>
            <span>{order.when.split(",")[0]}</span>
          </span>
          <span className="pf-order-side">
            <b>{som(order.total)}</b>
            <span className={`pf-pill ${order.status}`}>{statusLabel(order.status)}</span>
          </span>
        </Link>
      ))}
    </section>
  );
}

function AddressCard({ addresses, onAdd, onOpen, limit }: { addresses: Address[]; onAdd: () => void; onOpen: () => void; limit?: number }) {
  const shown = limit ? addresses.slice(0, limit) : addresses;
  return (
    <section className="pf-card">
      <h3>Manzillarim <button type="button" onClick={onOpen}>Barchasini ko‘rish</button></h3>
      <div className="pf-addrs">
        {addresses.length === 0 ? <p className="pf-empty">Manzil yo‘q — qo‘shish orqali yozing.</p> : null}
        {shown.map((address) => (
          <article className="pf-addr" key={address.id}>
            <b>{address.title}</b>
            <span>{address.line}</span>
          </article>
        ))}
        <button type="button" className="pf-add" onClick={onAdd}>+ Yangi manzil qo‘shish</button>
      </div>
    </section>
  );
}

function PayCardList({ cards, onAdd, onOpen, limit }: { cards: PayCard[]; onAdd: () => void; onOpen: () => void; limit?: number }) {
  const shown = limit ? cards.slice(0, limit) : cards;
  return (
    <section className="pf-card">
      <h3>To‘lov usullari <button type="button" onClick={onOpen}>Barchasini ko‘rish</button></h3>
      <div className="pf-pays">
        {cards.length === 0 ? <p className="pf-empty">Saqlangan karta yo‘q. To‘lov usuli buyurtma berishda tanlanadi.</p> : null}
        {shown.map((card) => (
          <article className={card.brand === "HUMO" ? "pf-pay humo" : "pf-pay uz"} key={card.id}>
            <b>{card.brand}</b>
            <span>**** {card.last4}</span>
            <span>{card.exp}</span>
          </article>
        ))}
        <button type="button" className="pf-add" onClick={onAdd}>+ Yangi karta qo‘shish</button>
      </div>
    </section>
  );
}

function SavedCard({ items }: { items: { id: string; name: string; price: number }[] }) {
  return (
    <section className="pf-card">
      <h3>Saqlanganlar</h3>
      <div className="pf-list">
        {items.length === 0 ? <p className="pf-empty">Saqlangan mahsulot yo‘q.</p> : null}
        {items.map((item) => (
          <article key={item.id}>
            <b>{item.name}</b>
            {item.price ? <span>{som(item.price)}</span> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function SecurityCard({
  passwords,
  setPasswords,
  twoFactor,
  setTwoFactor,
  onSave,
}: {
  passwords: { current: string; next: string; confirm: string };
  setPasswords: (next: { current: string; next: string; confirm: string }) => void;
  twoFactor: boolean;
  setTwoFactor: (value: boolean) => void;
  onSave: () => void;
}) {
  return (
    <section className="pf-card">
      <h3>Xavfsizlik</h3>
      <div className="pf-grid">
        <label>Joriy parol<input type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /></label>
        <label>Yangi parol<input type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /></label>
        <label>Parolni tasdiqlang<input type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} /></label>
      </div>
      <div className="pf-row">
        <span>Ikki bosqichli himoya</span>
        <button type="button" className={twoFactor ? "pf-switch on" : "pf-switch"} aria-pressed={twoFactor} aria-label="Ikki bosqichli himoya" onClick={() => setTwoFactor(!twoFactor)}>
          <i />
        </button>
      </div>
      <button type="button" className="pf-go pf-save" onClick={onSave}>Saqlash</button>
    </section>
  );
}

