"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Bell,
  Building2,
  Camera,
  Clock3,
  CreditCard,
  Download,
  Globe,
  GraduationCap,
  Heart,
  Home,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Shield,
  ShoppingBag,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useSeminarRegs } from "@/components/seminar-provider";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { certificatesFromRegistrations } from "@/data/certificates";
import { toshkentDistricts } from "@/data/masters";
import { getBonusSnapshot, refreshBonus, subscribeBonus } from "@/lib/bonus";
import { prepareImage, uploadImage } from "@/lib/image-upload";
import { loadOrders, syncOrders, type Order } from "@/lib/orders";
import { useSavedPlaces } from "@/lib/saved-addresses";
import { downloadPdf } from "@/lib/simple-pdf";
import "./profil.css";

const specs = ["Terapevt stomatolog", "Ortoped stomatolog", "Jarroh stomatolog", "Implantolog", "Ortodont", "Bolalar stomatologi", "Parodontolog", "Endodontist", "Gigiyenist", "Tish texnigi", "Assistent", "Klinika rahbari"];
const cities = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg‘ona", "Namangan", "Qarshi", "Nukus", "Urganch", "Jizzax", "Termiz", "Navoiy", "Guliston"];
const PREFS_KEY = "sh-profile-prefs-v1";
const prefKeys = [
  ["email", "Email bildirishnomalari"],
  ["sms", "SMS bildirishnomalari"],
  ["market", "Market yangiliklari"],
  ["courses", "Kurs va tadbirlar"],
  ["offers", "Maxsus takliflar"],
] as const;

const orderTone = (o: Order) => (o.paymentState === "refunded" ? ["red", "Bekor qilingan"] : o.status === "yetkazildi" ? ["green", "Yetkazildi"] : o.status === "yolda" ? ["blue", "Yo‘lda"] : o.paymentState === "awaiting_payment" && o.payment !== "naqd" ? ["amber", "To‘lov kutilmoqda"] : ["orange", "Tayyorlanmoqda"]);

function stamp(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function phonePretty(raw: string) {
  const d = raw.replace(/\D/g, "").slice(-9);
  return d.length === 9 ? `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}` : raw;
}

export function ProfilDesktop() {
  const router = useRouter();
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const { ready, profile, updateProfile, logout } = useDoctorProfile();
  const { registrations } = useSeminarRegs();
  const bonus = useSyncExternalStore(subscribeBonus, getBonusSnapshot, getBonusSnapshot);
  const places = useSavedPlaces(Boolean(profile), ready);
  const fileRef = useRef<HTMLInputElement>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [edit, setEdit] = useState<"" | "personal" | "clinic">("");
  const [form, setForm] = useState({ fullName: "", phone: "", specialty: "", bio: "", clinic: "", city: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<"" | "address" | "password" | "logout">("");
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ email: true, sms: true, market: true, courses: true, offers: false });

  useEffect(() => {
    const read = () => setOrders(loadOrders());
    window.addEventListener("sk-orders-changed", read);
    void syncOrders(true).then(read);
    void refreshBonus();
    try {
      const raw = JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate per-browser preferences once
      if (raw && typeof raw === "object") setPrefs((current) => ({ ...current, ...raw }));
    } catch {
      /* private mode */
    }
    return () => window.removeEventListener("sk-orders-changed", read);
  }, []);

  useEffect(() => {
    if (!profile || edit) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror the saved profile into the edit form
    setForm({ fullName: profile.fullName ?? "", phone: profile.phone ? phonePretty(profile.phone) : "", specialty: profile.specialty ?? "", bio: profile.bio ?? "", clinic: profile.clinic ?? "", city: profile.city ?? "" });
  }, [edit, profile]);

  const certificates = useMemo(() => certificatesFromRegistrations(registrations, profile?.fullName ?? ""), [profile?.fullName, registrations]);
  const fields = profile ? [profile.fullName, profile.phone, profile.specialty, profile.clinic, profile.city, profile.bio, profile.avatarUrl] : [];
  const complete = fields.length ? Math.round((fields.filter((v) => Boolean(v && String(v).trim())).length / fields.length) * 100) : 0;

  function togglePref(key: string) {
    setPrefs((current) => {
      const next = { ...current, [key]: !current[key] };
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }

  async function save(kind: "personal" | "clinic") {
    const next: Record<string, string> = {};
    if (kind === "personal") {
      if (form.fullName.trim().length < 2) next.fullName = "Ism familiyani kiriting.";
      const digits = form.phone.replace(/\D/g, "");
      if (digits && digits.slice(-9).length !== 9) next.phone = "Telefon: +998 XX XXX XX XX";
    } else if (!form.clinic.trim()) next.clinic = "Klinika nomini kiriting.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    const patch = kind === "personal" ? { fullName: form.fullName.trim(), phone: form.phone, specialty: form.specialty, bio: form.bio.trim() } : { clinic: form.clinic.trim(), city: form.city };
    const res = await updateProfile(patch);
    setSaving(false);
    if (res.ok) {
      setEdit("");
      setToast("Ma’lumotlar saqlandi");
    } else setErrors({ form: res.message ?? (res.reason === "exists" ? "Bu telefon raqami boshqa hisobga bog‘langan." : "Saqlab bo‘lmadi. Qayta urinib ko‘ring.") });
  }

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("Rasm faylini tanlang (JPG, PNG)");
      return;
    }
    setAvatarBusy(true);
    try {
      const prepared = await prepareImage(file, 600, 0.85);
      const url = await uploadImage(prepared.blob, "avatar");
      const res = await updateProfile({ avatarUrl: url });
      setToast(res.ok ? "Profil rasmi yangilandi" : "Rasmni saqlab bo‘lmadi");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Rasm yuklanmadi");
    } finally {
      setAvatarBusy(false);
    }
  }

  function certPdf(title: string, date: string, teacher: string) {
    downloadPdf(`Sertifikat-${title.slice(0, 40)}.pdf`, ["StomaHub", "SERTIFIKAT", "", `${profile?.fullName ?? ""}`, `"${title}" seminarida ishtirok etgani uchun`, "", `Sana: ${date}`, `Spiker: ${teacher}`]);
    setToast("Sertifikat PDF yuklab olindi");
  }

  if (ready && !profile) {
    return (
      <ShopShell searchPath="/profil" cartCount={cartCount} placeholder="Stomatologiya mahsulotlari, kurslar, ustalar..." showCamera={false}>
        <div className="pf2-guest">
          <User className="i" />
          <b>Profilni ko‘rish uchun tizimga kiring</b>
          <p>Shaxsiy ma’lumotlar, buyurtmalar, sertifikatlar va manzillar hisobingizga bog‘langan.</p>
          <Link href="/kirish?next=/profil">Kirish <ArrowRight className="i" /></Link>
        </div>
      </ShopShell>
    );
  }

  const name = profile?.fullName ?? "";
  const menu: { label: string; icon: ReactNode; href?: string; target?: string; action?: () => void; on?: boolean }[] = [
    { label: "Shaxsiy ma’lumotlar", icon: <User className="i" />, target: "pf2-personal", on: true },
    { label: "Klinikam", icon: <Building2 className="i" />, target: "pf2-clinic" },
    { label: "Buyurtmalarim", icon: <ShoppingBag className="i" />, href: "/buyurtmalarim" },
    { label: "Kurslarim va sertifikatlar", icon: <GraduationCap className="i" />, href: "/sertifikatlar" },
    { label: "Saqlanganlar", icon: <Heart className="i" />, href: "/marketplace?saqlangan=1" },
    { label: "Manzillar", icon: <MapPin className="i" />, target: "pf2-addresses" },
    { label: "To‘lov usullari", icon: <CreditCard className="i" />, target: "pf2-pay" },
    { label: "Bildirishnomalar", icon: <Bell className="i" />, target: "pf2-settings" },
    { label: "Xavfsizlik", icon: <Shield className="i" />, action: () => setModal("password") },
    { label: "Chiqish", icon: <LogOut className="i" />, action: () => setModal("logout") },
  ];

  return (
    <ShopShell searchPath="/profil" cartCount={cartCount} placeholder="Stomatologiya mahsulotlari, kurslar, ustalar..." showCamera={false}>
      <div className="pf2" data-testid="profile-page">
        <header className="pf2-hero">
          <div className="ava">
            {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={name} /> : <span className="ini">{name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("")}</span>}
            <button type="button" aria-label="Profil rasmini o‘zgartirish" disabled={avatarBusy} onClick={() => fileRef.current?.click()}><Camera className="i" /></button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label="Profil rasmi" onChange={(event) => { void onAvatar(event.target.files?.[0]); event.target.value = ""; }} />
          </div>
          <div className="who">
            <h1>{name || "Profil"} {profile?.telegramId ? <span className="pill"><BadgeCheck className="i" /> Telegram orqali tasdiqlangan</span> : null}</h1>
            <p className="role">{profile?.specialty || "Mutaxassislik ko‘rsatilmagan"}</p>
            <ul className="meta">
              {profile?.clinic ? <li><Building2 className="i" /> {profile.clinic}</li> : null}
              {profile?.city ? <li><MapPin className="i" /> {profile.city}</li> : null}
              {profile?.phone ? <li><Phone className="i" /> {phonePretty(profile.phone)}</li> : null}
              {profile?.telegramUsername ? <li><Globe className="i" /> @{profile.telegramUsername}</li> : null}
            </ul>
          </div>
          <div className="done">
            <span>Profil to‘liqligi <b>{complete}%</b></span>
            <i><b style={{ width: `${complete}%` }} /></i>
          </div>
          <button type="button" className="pf2-edit-btn" onClick={() => { setEdit("personal"); document.getElementById("pf2-personal")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><Pencil className="i" /> Profilni tahrirlash</button>
          <div className="stats">
            <Link href="/buyurtmalarim" className="stat"><span className="ic teal"><ShoppingBag className="i" /></span><span><b>{orders.length}</b><small>Buyurtmalar</small></span></Link>
            <Link href="/sertifikatlar" className="stat"><span className="ic blue"><Award className="i" /></span><span><b>{certificates.length}</b><small>Sertifikatlar</small></span></Link>
            <Link href="/talim" className="stat"><span className="ic indigo"><GraduationCap className="i" /></span><span><b>0</b><small>Kurslar</small></span></Link>
            <Link href="/bonuslarim" className="stat"><span className="ic gold"><Star className="i" /></span><span><b>{(bonus.info?.balance ?? 0).toLocaleString("ru-RU").replace(/ |,/g, " ")}</b><small>Bonus ballar</small></span></Link>
            <Link href="/marketplace?saqlangan=1" className="stat"><span className="ic pink"><Heart className="i" /></span><span><b>{favs.length}</b><small>Saqlanganlar</small></span></Link>
          </div>
        </header>

        <nav className="pf2-menu" aria-label="Profil bo‘limlari">
          {menu.map((item) =>
            item.href ? (
              <Link key={item.label} href={item.href}>{item.icon} {item.label}</Link>
            ) : (
              <button key={item.label} type="button" className={item.on ? "on" : item.label === "Chiqish" ? "out" : ""} onClick={() => (item.action ? item.action() : document.getElementById(item.target ?? "")?.scrollIntoView({ behavior: "smooth", block: "center" }))}>{item.icon} {item.label}</button>
            ),
          )}
        </nav>

        <section className="pf2-card pf2-personal" id="pf2-personal">
          <div className="hd"><h3>Shaxsiy ma’lumotlar</h3>{edit === "personal" ? null : <button type="button" onClick={() => setEdit("personal")}>Tahrirlash</button>}</div>
          <div className="grid">
            <Field label="Ism familiya" error={errors.fullName}><input value={form.fullName} disabled={edit !== "personal"} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></Field>
            <Field label="Telefon raqami" error={errors.phone}><input value={form.phone} inputMode="tel" disabled={edit !== "personal"} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
            <Field label="Email"><input value={profile?.email ?? ""} placeholder="Ulanmagan" disabled /></Field>
            <Field label="Mutaxassislik">
              <select value={form.specialty} disabled={edit !== "personal"} onChange={(event) => setForm({ ...form, specialty: event.target.value })}>
                <option value="">Tanlang</option>
                {[...new Set([form.specialty, ...specs].filter(Boolean))].map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Men haqimda" wide><textarea rows={3} maxLength={1000} value={form.bio} disabled={edit !== "personal"} placeholder="Yo‘nalishingiz va tajribangiz haqida qisqacha" onChange={(event) => setForm({ ...form, bio: event.target.value })} /></Field>
          </div>
          {edit === "personal" ? (
            <div className="acts">
              {errors.form ? <p className="err" role="alert">{errors.form}</p> : null}
              <button type="button" className="ghost" onClick={() => { setEdit(""); setErrors({}); }}>Bekor qilish</button>
              <button type="button" className="solid" disabled={saving} onClick={() => void save("personal")}>{saving ? "Saqlanmoqda…" : "Saqlash"}</button>
            </div>
          ) : null}
        </section>

        <section className="pf2-card pf2-clinic" id="pf2-clinic">
          <div className="hd"><h3><Home className="i" /> Klinikam</h3>{edit === "clinic" ? null : <button type="button" onClick={() => setEdit("clinic")}>Tahrirlash</button>}</div>
          <img src="/img/profil/d-clinic.jpg" alt="" />
          {edit === "clinic" ? (
            <div className="clinic-form">
              <Field label="Klinika nomi" error={errors.clinic}><input value={form.clinic} onChange={(event) => setForm({ ...form, clinic: event.target.value })} /></Field>
              <Field label="Shahar"><select value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}><option value="">Tanlang</option>{[...new Set([form.city, ...cities].filter(Boolean))].map((c) => <option key={c}>{c}</option>)}</select></Field>
              <div className="acts">
                <button type="button" className="ghost" onClick={() => { setEdit(""); setErrors({}); }}>Bekor qilish</button>
                <button type="button" className="solid" disabled={saving} onClick={() => void save("clinic")}>Saqlash</button>
              </div>
            </div>
          ) : (
            <>
              <h4>{profile?.clinic || "Klinika ko‘rsatilmagan"}</h4>
              <ul>
                <li><MapPin className="i" /> {profile?.city || "Shahar ko‘rsatilmagan"}</li>
                <li><Clock3 className="i" /> Ish vaqti va xizmatlar — “Mening klinikam” sahifasida</li>
              </ul>
              <Link href="/mening-klinikam" className="link">Mening klinikam <ArrowRight className="i" /></Link>
            </>
          )}
        </section>

        <section className="pf2-card pf2-settings" id="pf2-settings">
          <h3>Tizim sozlamalari</h3>
          <Field label="Til"><select value="uz" onChange={() => undefined}><option value="uz">O‘zbekcha</option></select></Field>
          {prefKeys.map(([key, label]) => (
            <div className="pref" key={key}>
              <span>{label}</span>
              <button type="button" role="switch" aria-checked={Boolean(prefs[key])} aria-label={label} className={prefs[key] ? "sw on" : "sw"} onClick={() => togglePref(key)}><i /></button>
            </div>
          ))}
          <small className="note">Sozlamalar shu brauzerda saqlanadi.</small>
        </section>

        <section className="pf2-card pf2-certs">
          <div className="hd"><h3>Kurslarim va sertifikatlar</h3><Link href="/sertifikatlar">Barchasini ko‘rish <ArrowRight className="i" /></Link></div>
          {certificates.length ? (
            <div className="row3">
              {certificates.slice(0, 3).map((cert) => (
                <article key={cert.id} className="cert">
                  <div className="ph"><Award className="i" /><span>SERTIFIKAT</span></div>
                  <b>{cert.title}</b>
                  <i className="bar"><b style={{ width: "100%" }} /></i>
                  <em>Sertifikat olingan · {cert.dateLabel}</em>
                  <button type="button" onClick={() => certPdf(cert.title, cert.dateLabel, cert.teacher)}><Download className="i" /> Sertifikatni yuklab olish</button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              <GraduationCap className="i" />
              <p>Hali sertifikat yo‘q. Seminarda qatnashganingiz tashkilotchi tomonidan tasdiqlangach, sertifikat shu yerda chiqadi.</p>
              <div><Link href="/seminarlar">Seminarlar</Link><Link href="/talim">Onlayn darslar</Link></div>
            </div>
          )}
        </section>

        <section className="pf2-card pf2-orders">
          <div className="hd"><h3>Oxirgi buyurtmalarim</h3><Link href="/buyurtmalarim">Barchasini ko‘rish <ArrowRight className="i" /></Link></div>
          {orders.length ? (
            <ul>
              {orders.slice(0, 5).map((order) => {
                const [tone, label] = orderTone(order);
                return (
                  <li key={order.id}>
                    <Link href="/buyurtmalarim">
                      {order.items[0]?.image ? <img src={order.items[0].image} alt="" /> : <span className="ph"><ShoppingBag className="i" /></span>}
                      <span className="no"><b>№ {order.id}</b><small>{stamp(order.createdAt)}</small></span>
                      <strong>{som(order.payable ?? order.total)}</strong>
                      <em className={tone}>{label}</em>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : <p className="empty-line">Hali buyurtma yo‘q. <Link href="/marketplace">Marketplace</Link></p>}
        </section>

        <section className="pf2-card pf2-addresses" id="pf2-addresses">
          <div className="hd"><h3>Manzillarim</h3></div>
          <div className="addrs">
            {places.places.map((place, index) => (
              <article key={place.id}>
                <span className="ic">{index === 0 ? <Home className="i" /> : <Building2 className="i" />}</span>
                <span className="txt"><b>{place.label} {index === 0 ? <em>Asosiy</em> : null}</b><small>{[place.city, place.district, place.address].filter(Boolean).join(", ")}</small></span>
                <button type="button" aria-label={`${place.label} manzilini o‘chirish`} onClick={() => void places.remove(place.id)}><Trash2 className="i" /></button>
              </article>
            ))}
            <button type="button" className="add" onClick={() => setModal("address")}><Plus className="i" /> Yangi manzil qo‘shish</button>
          </div>
        </section>

        <section className="pf2-card pf2-pay" id="pf2-pay">
          <div className="hd"><h3>To‘lov usullari</h3></div>
          <div className="pays">
            <span className="pm click"><i />Click</span>
            <span className="pm payme"><i />Payme</span>
            <span className="pm naqd"><i />Naqd</span>
          </div>
          <small className="note">Karta ma’lumotlari StomaHub’da saqlanmaydi — to‘lov Click yoki Payme oynasida amalga oshiriladi.</small>
        </section>

        {modal === "address" ? <AddressModal onClose={() => setModal("")} onSave={async (place) => { const res = await places.save(place); if (res.ok) { setModal(""); setToast("Manzil saqlandi"); } return res; }} /> : null}
        {modal === "password" ? <PasswordModal onClose={() => setModal("")} onDone={() => { setModal(""); setToast("Parol o‘zgartirildi"); }} /> : null}
        {modal === "logout" ? (
          <Dialog title="Hisobdan chiqish" onClose={() => setModal("")}>
            <p>Hisobingizdan chiqmoqchimisiz? Savatdagi mahsulotlar shu qurilmada saqlanib qoladi.</p>
            <div className="acts"><button type="button" className="ghost" onClick={() => setModal("")}>Bekor qilish</button><button type="button" className="solid danger" onClick={async () => { await logout(); router.push("/"); }}><LogOut className="i" /> Chiqish</button></div>
          </Dialog>
        ) : null}
        {toast ? <p className="pf2-toast" role="status" onAnimationEnd={() => setToast("")}>{toast}</p> : null}
      </div>
    </ShopShell>
  );
}

function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={wide ? "pf2-field wide" : "pf2-field"}>
      <span>{label}</span>
      {children}
      {error ? <em role="alert">{error}</em> : null}
    </label>
  );
}

function AddressModal({ onClose, onSave }: { onClose: () => void; onSave: (place: { label: string; city: string; district: string; address: string }) => Promise<{ ok: true } | { ok: false; error: string }> }) {
  const [form, setForm] = useState({ label: "Uy", city: "Toshkent", district: "", address: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title="Yangi manzil" onClose={onClose}>
      <form
        className="pf2-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!form.label.trim() || form.address.trim().length < 5) {
            setError("Manzil nomi va to‘liq manzilni kiriting.");
            return;
          }
          setBusy(true);
          const res = await onSave({ label: form.label.trim(), city: form.city, district: form.district, address: form.address.trim() });
          setBusy(false);
          if (!res.ok) setError(res.error);
        }}
      >
        <Field label="Nomi"><input value={form.label} maxLength={40} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Uy, Klinika…" /></Field>
        <Field label="Shahar"><select value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value, district: "" })}>{cities.map((c) => <option key={c}>{c}</option>)}</select></Field>
        {form.city === "Toshkent" ? <Field label="Tuman"><select value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })}><option value="">Tanlang</option>{toshkentDistricts.map((d) => <option key={d}>{d}</option>)}</select></Field> : null}
        <Field label="Manzil"><input value={form.address} maxLength={200} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Ko‘cha, uy, mo‘ljal" /></Field>
        {error ? <p className="err" role="alert">{error}</p> : null}
        <div className="acts"><button type="button" className="ghost" onClick={onClose}>Bekor qilish</button><button type="submit" className="solid" disabled={busy}>Saqlash</button></div>
      </form>
    </Dialog>
  );
}

function PasswordModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title="Xavfsizlik: parolni o‘zgartirish" onClose={onClose}>
      <form
        className="pf2-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (form.next.length < 6) return setError("Yangi parol kamida 6 belgi bo‘lsin.");
          if (form.next !== form.confirm) return setError("Yangi parollar mos emas.");
          setBusy(true);
          try {
            const res = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ current: form.current, next: form.next }) });
            const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
            if (res.ok && json?.ok) onDone();
            else setError(json?.error ?? "Parolni o‘zgartirib bo‘lmadi.");
          } catch {
            setError("Tarmoq xatosi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Joriy parol"><input type="password" autoComplete="current-password" value={form.current} onChange={(event) => setForm({ ...form, current: event.target.value })} /></Field>
        <Field label="Yangi parol"><input type="password" autoComplete="new-password" value={form.next} onChange={(event) => setForm({ ...form, next: event.target.value })} /></Field>
        <Field label="Yangi parolni takrorlang"><input type="password" autoComplete="new-password" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} /></Field>
        {error ? <p className="err" role="alert">{error}</p> : null}
        <div className="acts"><button type="button" className="ghost" onClick={onClose}>Bekor qilish</button><button type="submit" className="solid" disabled={busy}>Saqlash</button></div>
      </form>
    </Dialog>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="pf2-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="pf2-dialog">
        <div className="dhd"><h3>{title}</h3><button type="button" aria-label="Yopish" onClick={onClose}><X className="i" /></button></div>
        {children}
      </div>
    </div>
  );
}
