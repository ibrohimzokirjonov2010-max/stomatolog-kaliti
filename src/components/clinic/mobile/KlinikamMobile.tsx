"use client";
/* eslint-disable @next/next/no-img-element -- the clinic photo is sized by the fluid unit */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, Building2, CalendarDays, Camera, ChevronRight, Clock, Lock, MapPin, Navigation, Phone, Store, Users, X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { MobileBrandBar } from "@/components/mobile/MobileBrandBar";
import { uploadImage } from "@/lib/image-upload";
import "./klinika-mobile.css";

const steps = ["Klinika ma’lumotlari", "Xodimlar", "Xizmatlar"] as const;
const days = [
  { id: "du", label: "Du" },
  { id: "se", label: "Se" },
  { id: "ch", label: "Ch" },
  { id: "pa", label: "Pa" },
  { id: "ju", label: "Ju" },
  { id: "sha", label: "Sha" },
  { id: "ya", label: "Ya" },
] as const;
const hours = ["08:00", "09:00", "10:00", "12:00", "14:00", "18:00", "20:00"];
const branches = ["", "Chilonzor filiali", "Yunusobod filiali", "Sergeli filiali", "Mirzo Ulug‘bek filiali", "Yakkasaroy filiali"];
const KEY = "sk-clinic-v1";

type Saved = { logo: string; branch: string; phone: string; address: string; openAt: string; closeAt: string; openDays: string[] };

function readSaved(uid: string): Partial<Saved> {
  try {
    const raw = window.localStorage.getItem(`${KEY}:${uid}`);
    return raw ? (JSON.parse(raw) as Partial<Saved>) : {};
  } catch {
    return {};
  }
}

const locks = [
  { title: "Bemorlar", text: "Bemorlar bazasi va karta", icon: Users },
  { title: "Qabullar", text: "Uchrashuvlar taqvimi", icon: CalendarDays },
  { title: "Xodimlar", text: "Shifokorlar va administratorlar", icon: Users },
  { title: "Hisobotlar", text: "Daromad, statistika va tahlil", icon: BarChart3 },
];

export function KlinikamMobile() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { profile, updateProfile } = useDoctorProfile();
  const uid = profile?.id ?? "guest";
  const [step, setStep] = useState(0);
  const [logo, setLogo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openAt, setOpenAt] = useState("09:00");
  const [closeAt, setCloseAt] = useState("18:00");
  const [openDays, setOpenDays] = useState<string[]>(["du", "se", "ch", "pa", "ju", "sha"]);
  const [error, setError] = useState("");
  const [map, setMap] = useState(false);
  const [note, setNote] = useState("");

  // Load the saved clinic (name from the account, the rest from this device).
  useEffect(() => {
    const saved = readSaved(uid);
    setName(profile?.clinic ?? "");
    setLogo(saved.logo ?? "");
    setBranch(saved.branch ?? "");
    setPhone(saved.phone ?? "");
    setAddress(saved.address ?? profile?.city ?? "");
    if (saved.openAt) setOpenAt(saved.openAt);
    if (saved.closeAt) setCloseAt(saved.closeAt);
    if (saved.openDays) setOpenDays(saved.openDays);
  }, [profile?.city, profile?.clinic, uid]);

  async function save() {
    if (!name.trim()) {
      setError("Klinika nomini kiriting");
      return;
    }
    if (phone.trim() && phone.replace(/\D/g, "").length < 9) {
      setError("Telefon raqamini to‘liq kiriting");
      return;
    }
    if (!profile) {
      setError("Saqlash uchun hisobingizga kiring.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await updateProfile({ clinic: name.trim() });
    setBusy(false);
    if (!res.ok) {
      setError("Saqlab bo‘lmadi. Qayta urinib ko‘ring.");
      return;
    }
    try {
      window.localStorage.setItem(`${KEY}:${uid}`, JSON.stringify({ logo, branch, phone: phone.trim(), address: address.trim(), openAt, closeAt, openDays } satisfies Saved));
    } catch {
      /* storage unavailable — the name is saved to the account anyway */
    }
    setNote("Klinika ma’lumotlari saqlandi");
    setStep(1);
  }

  async function pickLogo(file: File) {
    setUploading(true);
    try {
      setLogo(await uploadImage(file, "logo"));
    } catch {
      setError("Logotipni yuklab bo‘lmadi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="kl lg:hidden" data-testid="mobile-klinikam">
      <div className="kl-body">
        <MobileBrandBar search={false} cart={false} />
        <h1 className="kl-title">Mening klinikam</h1>
        <p className="kl-sub">Klinikangiz ma’lumotlari faqat sizga ko‘rinadi.</p>

        <div className="kl-steps">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              className={index === step ? "on" : index < step ? "done" : undefined}
              onClick={() => {
                if (index <= step) setStep(index);
              }}
            >
              <i>{index + 1}</i>
              {label}
            </button>
          ))}
        </div>
        <div className="kl-track" aria-hidden="true">
          <span style={{ width: step === 0 ? "18%" : step === 1 ? "50%" : "100%" }} />
        </div>

        {step === 0 ? (
          <>
            <section className="kl-card">
              <div className="kl-intro">
                <div>
                  <h2>Klinikangizni sozlang</h2>
                  <p>To‘g‘ri ma’lumotlarni kiriting — keyin bemorlar, qabullar va xodimlarni qo‘shishingiz mumkin.</p>
                </div>
                <img src="/img/mobile/kl-clinic.jpg" alt="" />
              </div>
              <button type="button" className="kl-logo" onClick={() => fileRef.current?.click()}>
                {logo ? <img src={logo} alt="Klinika logotipi" /> : (<><Camera /><span>{uploading ? "Yuklanmoqda..." : "Klinika logotipi yuklash"}</span></>)}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                aria-label="Klinika logotipi"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void pickLogo(file);
                }}
              />
            </section>

            <div className="kl-field">
              <label htmlFor="kl-name">Klinika nomi <em>*</em></label>
              <div className="kl-box">
                <Store />
                <input id="kl-name" value={name} placeholder="Masalan: Smile Dental" onChange={(event) => setName(event.target.value)} aria-required="true" />
                {name ? <button type="button" className="kl-x" aria-label="Nomni tozalash" onClick={() => setName("")}><X /></button> : null}
              </div>
            </div>

            <div className="kl-split">
              <div className="kl-field">
                <label htmlFor="kl-branch">Filial (ixtiyoriy)</label>
                <div className="kl-box">
                  <Building2 />
                  <select id="kl-branch" value={branch} onChange={(event) => setBranch(event.target.value)}>
                    {branches.map((item) => <option key={item} value={item}>{item || "Filial yo‘q"}</option>)}
                  </select>
                </div>
              </div>
              <div className="kl-field">
                <label htmlFor="kl-phone">Telefon raqami</label>
                <div className="kl-box">
                  <Phone />
                  <input id="kl-phone" value={phone} placeholder="+998 __ ___ __ __" onChange={(event) => setPhone(event.target.value)} inputMode="tel" />
                  {phone ? <button type="button" className="kl-x" aria-label="Telefonni tozalash" onClick={() => setPhone("")}><X /></button> : null}
                </div>
              </div>
            </div>

            <div className="kl-map">
              <div className="kl-field">
                <label htmlFor="kl-address">Manzil (ixtiyoriy)</label>
                <div className="kl-box">
                  <MapPin />
                  <input id="kl-address" value={address} placeholder="Shahar, tuman, ko‘cha" onChange={(event) => setAddress(event.target.value)} />
                </div>
              </div>
              <button type="button" className="kl-locate" onClick={() => setMap(true)}>
                <Navigation /> Xaritada ko‘rish
              </button>
            </div>

            <div className="kl-split">
              <div className="kl-field">
                <label htmlFor="kl-open">Ochilish vaqti</label>
                <div className="kl-box">
                  <Clock />
                  <select id="kl-open" value={openAt} onChange={(event) => setOpenAt(event.target.value)}>
                    {hours.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </div>
              <div className="kl-field">
                <label htmlFor="kl-close">Yopilish vaqti</label>
                <div className="kl-box">
                  <Clock />
                  <select id="kl-close" value={closeAt} onChange={(event) => setCloseAt(event.target.value)}>
                    {hours.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="kl-field">
              <span>Ish kunlari</span>
              <div className="kl-days">
                {days.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    className={openDays.includes(day.id) ? "on" : undefined}
                    aria-pressed={openDays.includes(day.id)}
                    onClick={() => setOpenDays((current) => (current.includes(day.id) ? current.filter((id) => id !== day.id) : [...current, day.id]))}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <p className="kl-error" role="alert">
                {error} {!profile && /kiring/.test(error) ? <Link href="/kirish?next=/mening-klinikam">Kirish →</Link> : null}
              </p>
            ) : null}

            <section className="kl-next">
              <h2>Keyingi bosqichlarda nimalar bo‘ladi?</h2>
              <p>Klinikangizni to‘liq boshqarish imkoniyatlari:</p>
              <div className="kl-locks">
                {locks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.title} type="button" className="kl-lock" onClick={() => setNote("Bu bo‘lim klinika ma’lumotlari saqlangach ochiladi")}>
                      <span className="pad"><Lock /></span>
                      <i><Icon /></i>
                      <b>{item.title}</b>
                      <span>{item.text}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <section className="kl-card" data-testid="kl-step">
            <h2>{steps[step]}</h2>
            <p>
              {step === 1
                ? `${name} uchun xodimlar ro‘yxati hozircha kompyuterdagi CRM bo‘limida yuritiladi. Mobil versiyada bu bosqich tez orada ochiladi.`
                : `${name} xizmatlari va narxlari ham CRM’da yuritiladi. Ish vaqti: ${openAt}–${closeAt}.`}
            </p>
            <Link className="kl-crm" href={step === 1 ? "/crm/bemorlar" : "/crm/hisobotlar"}>
              CRM’ni ochish <ChevronRight />
            </Link>
            {note ? <p className="kl-note">{note}</p> : null}
          </section>
        )}
        {step === 0 && note ? <p className="kl-note">{note}</p> : null}
        <div className="kl-pad" />
      </div>

      {step === 0 ? (
        <button type="button" className="kl-save" data-testid="kl-save" disabled={busy || uploading} onClick={() => void save()}>
          {busy ? "Saqlanmoqda..." : "Saqlash va davom etish"} <ChevronRight />
        </button>
      ) : step === 1 ? (
        <button type="button" className="kl-save" onClick={() => setStep(2)}>
          Davom etish <ChevronRight />
        </button>
      ) : (
        <Link className="kl-save" href="/profil">
          Profilga qaytish <ChevronRight />
        </Link>
      )}

      {map ? (
        <div className="kl-sheet" role="dialog" aria-label="Xarita">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setMap(false)} />
          <div className="kl-panel">
            <h3>Xaritada ko‘rish</h3>
            <div className="kl-mapbox">{address || "Manzil kiritilmagan"}</div>
            {address ? (
              <a className="go" href={`https://yandex.uz/maps/?text=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">
                Yandex xaritada ochish
              </a>
            ) : null}
            <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => setMap(false)}>Yopish</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
