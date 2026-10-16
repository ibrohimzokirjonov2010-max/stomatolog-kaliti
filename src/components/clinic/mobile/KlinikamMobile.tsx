"use client";
/* eslint-disable @next/next/no-img-element -- the clinic photo is sized by the fluid unit */

import { useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, Building2, CalendarDays, Camera, ChevronRight, Clock, Lock, MapPin, Navigation, Phone, Store, Users, X } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
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
const branches = ["Chilonzor filiali", "Yunusobod filiali", "Sergeli filiali"];

const locks = [
  { title: "Bemorlar", text: "Bemorlar bazasi va karta", icon: Users },
  { title: "Qabullar", text: "Uchrashuvlar taqvimi", icon: CalendarDays },
  { title: "Xodimlar", text: "Shifokorlar va administratorlar", icon: Users },
  { title: "Hisobotlar", text: "Daromad, statistika va tahlil", icon: BarChart3 },
];

export function KlinikamMobile() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [logo, setLogo] = useState("");
  const [name, setName] = useState("Smile Dental");
  const [branch, setBranch] = useState(branches[0]);
  const [phone, setPhone] = useState("+998 90 123 45 67");
  const [address, setAddress] = useState("Toshkent, Chilonzor");
  const [openAt, setOpenAt] = useState("09:00");
  const [closeAt, setCloseAt] = useState("18:00");
  const [openDays, setOpenDays] = useState<string[]>(["du", "se", "ch", "pa", "ju", "sha"]);
  const [error, setError] = useState("");
  const [map, setMap] = useState(false);
  const [note, setNote] = useState("");

  function save() {
    if (!name.trim()) {
      setError("Klinika nomini kiriting");
      return;
    }
    setError("");
    setStep(1);
  }

  return (
    <div className="kl lg:hidden" data-testid="mobile-klinikam">
      <header className="mh-bar">
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <NotificationBell variant="mobile" minBadge={2} buttonClassName="size-10 text-[#1a1d26]" />
      </header>
      <div className="kl-body">
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
                {logo ? <img src={logo} alt="Klinika logotipi" /> : (<><Camera /><span>Klinika logotipi yuklash</span></>)}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                aria-label="Klinika logotipi"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setLogo(String(reader.result || ""));
                  reader.readAsDataURL(file);
                }}
              />
            </section>

            <div className="kl-field">
              <label htmlFor="kl-name">Klinika nomi <em>*</em></label>
              <div className="kl-box">
                <Store />
                <input id="kl-name" value={name} onChange={(event) => setName(event.target.value)} aria-required="true" />
                {name ? <button type="button" className="kl-x" aria-label="Nomni tozalash" onClick={() => setName("")}><X /></button> : null}
              </div>
            </div>

            <div className="kl-split">
              <div className="kl-field">
                <label htmlFor="kl-branch">Filial (ixtiyoriy)</label>
                <div className="kl-box">
                  <Building2 />
                  <select id="kl-branch" value={branch} onChange={(event) => setBranch(event.target.value)}>
                    {branches.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </div>
              <div className="kl-field">
                <label htmlFor="kl-phone">Telefon raqami</label>
                <div className="kl-box">
                  <Phone />
                  <input id="kl-phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" />
                  {phone ? <button type="button" className="kl-x" aria-label="Telefonni tozalash" onClick={() => setPhone("")}><X /></button> : null}
                </div>
              </div>
            </div>

            <div className="kl-map">
              <div className="kl-field">
                <label htmlFor="kl-address">Manzil (ixtiyoriy)</label>
                <div className="kl-box">
                  <button type="button" aria-label="Joylashuv" onClick={() => setAddress((value) => value || "Toshkent, Chilonzor")}><MapPin /></button>
                  <input id="kl-address" value={address} onChange={(event) => setAddress(event.target.value)} />
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

            {error ? <p className="kl-error" role="alert">{error}</p> : null}

            <section className="kl-next">
              <h2>Keyingi bosqichlarda nimalar bo‘ladi?</h2>
              <p>Klinikangizni to‘liq boshqarish imkoniyatlari:</p>
              <div className="kl-locks">
                {locks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.title} type="button" className="kl-lock" onClick={() => setNote("Bu bo‘lim keyingi bosqichda ochiladi")}>
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
          <section className="kl-card">
            <h2>{steps[step]}</h2>
            <p>{step === 1 ? `${name} klinikasiga xodimlarni shu yerda qo‘shasiz.` : `${name} xizmatlari shu yerda ochiladi. ${openAt}–${closeAt}.`}</p>
            {note ? <p className="kl-note">{note}</p> : null}
          </section>
        )}
        {step === 0 && note ? <p className="kl-note">{note}</p> : null}
        <div className="kl-pad" />
      </div>

      {step === 0 ? (
        <button type="button" className="kl-save" onClick={save}>
          Saqlash va davom etish <ChevronRight />
        </button>
      ) : step === 1 ? (
        <button type="button" className="kl-save" onClick={() => setStep(2)}>
          Davom etish <ChevronRight />
        </button>
      ) : (
        <button type="button" className="kl-save" onClick={() => setNote("Saqlangan")}>
          Saqlash <ChevronRight />
        </button>
      )}

      {map ? (
        <div className="kl-sheet" role="dialog" aria-label="Xarita">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setMap(false)} />
          <div className="kl-panel">
            <h3>Xaritada ko‘rish</h3>
            <div className="kl-mapbox">{address || "Manzil kiritilmagan"}</div>
            <button type="button" className="go" onClick={() => setMap(false)}>Yopish</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
