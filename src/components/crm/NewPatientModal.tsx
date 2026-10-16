"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Camera, ChevronDown, Mail, MapPin, Plus } from "lucide-react";
import type { Patient } from "@/data/crm";
import { patientCities } from "@/data/crm";
import { fileToCompressedDataUrl } from "@/lib/seller-work";
import "./new-patient.css";

const SOURCES = ["Instagram", "Telegram", "Tanish orqali", "Google", "Boshqa"];
const CONDITIONS = ["Diabet", "Gipertoniya", "Allergiya", "Homiladorlik"];

export type NewPatientDraft = {
  first: string;
  family: string;
  phone: string;
  birth: string;
  gender: "Erkak" | "Ayol";
  city: string;
  address: string;
  email: string;
  source: string;
  conditions: string[];
  other: string;
  note: string;
  photo: string;
};

const emptyDraft = (): NewPatientDraft => ({
  first: "",
  family: "",
  phone: "",
  birth: "",
  gender: "Erkak",
  city: "Toshkent",
  address: "",
  email: "",
  source: "",
  conditions: [],
  other: "",
  note: "",
  photo: "",
});

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 9);
}

function formatLocal(digits: string) {
  const d = digitsOnly(digits);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

export function formatPatientPhone(digits: string) {
  const d = digitsOnly(digits);
  return `+998 ${[d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ")}`;
}

function validDate(value: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && year > 1900 && date.getTime() <= Date.now();
}

function ageFromBirth(value: string) {
  const [day, month, year] = value.split(".").map(Number);
  const now = new Date();
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) age -= 1;
  return Math.max(0, age);
}

function avatarFor(name: string, photo: string) {
  if (photo) return photo;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' rx='40' fill='#0F8A8A'/><text x='40' y='50' text-anchor='middle' font-size='28' fill='white' font-family='sans-serif'>${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function patientFromDraft(draft: NewPatientDraft, num: number): Patient {
  const name = `${draft.first.trim()} ${draft.family.trim()}`.trim();
  return {
    id: `p-${Date.now().toString().slice(-6)}`,
    num,
    name,
    age: ageFromBirth(draft.birth),
    gender: draft.gender,
    phone: formatPatientPhone(draft.phone),
    city: draft.city,
    status: "yangi",
    lastVisit: "",
    nextVisit: "",
    avatar: avatarFor(name, draft.photo),
    email: draft.email.trim(),
    created: new Date().toISOString(),
    addedAt: Date.now(),
    family: draft.family.trim(),
    birth: draft.birth,
    address: draft.address.trim(),
    source: draft.source,
    conditions: draft.conditions,
    otherCondition: draft.other.trim(),
    note: draft.note.trim(),
    teeth: {},
    visits: [],
    payments: [],
    docs: [],
  };
}

function Flag() {
  return (
    <svg className="nb-flag" viewBox="0 0 24 16" aria-hidden="true">
      <rect width="24" height="5.2" fill="#0099b5" />
      <rect y="5.4" width="24" height="5.2" fill="#fff" />
      <rect y="10.8" width="24" height="5.2" fill="#1eb53a" />
      <rect y="5.05" width="24" height="0.45" fill="#ce1126" />
      <rect y="10.5" width="24" height="0.45" fill="#ce1126" />
      <circle cx="5.2" cy="2.6" r="1.15" fill="#fff" />
    </svg>
  );
}

export function NewPatientModal({ onClose, onSave }: { onClose: () => void; onSave: (draft: NewPatientDraft) => void }) {
  const titleId = useId();
  const dateRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<NewPatientDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  function set<K extends keyof NewPatientDraft>(key: K, value: NewPatientDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onPhoto(file: File | undefined) {
    setPhotoError("");
    if (!file) return;
    const okType = file.type === "image/jpeg" || file.type === "image/png" || /\.(jpe?g|png)$/i.test(file.name);
    if (!okType) {
      setPhotoError("Faqat JPG yoki PNG");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Fayl 5 MB dan katta");
      return;
    }
    const data = await fileToCompressedDataUrl(file, 480, 0.82);
    setPreview(data);
    set("photo", data);
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!draft.first.trim()) next.first = "Ismni kiriting";
    if (!draft.family.trim()) next.family = "Familiyani kiriting";
    if (!draft.phone) next.phone = "Telefon raqamini kiriting";
    else if (draft.phone.length < 9) next.phone = "Telefon raqami to‘liq emas";
    if (!draft.birth.trim()) next.birth = "Tug‘ilgan sanani kiriting";
    else if (!validDate(draft.birth)) next.birth = "Sana DD.MM.YYYY ko‘rinishida bo‘lsin";
    if (!draft.gender) next.gender = "Jinsni tanlang";
    if (!draft.city) next.city = "Shaharni tanlang";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave(draft);
  }

  function applyIso(iso: string) {
    if (!iso) return;
    const [year, month, day] = iso.split("-");
    set("birth", `${day}.${month}.${year}`);
  }

  const node = (
    <div
      className="nb-modal"
      data-testid="patient-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="nb-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="nb-head">
          <div>
            <h2 id={titleId}>Yangi bemor qo‘shish</h2>
            <p>Bemorning asosiy ma’lumotlarini kiriting</p>
          </div>
          <button type="button" className="nb-x" aria-label="Yopish" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="nb-top">
          <div className="nb-photo">
            <label>
              {preview ? <img src={preview} alt="" /> : (<><Camera size={22} /><span>Rasm yuklash</span></>)}
              <input
                data-testid="patient-photo"
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                hidden
                onChange={(event) => {
                  void onPhoto(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            <small className={photoError ? "bad" : undefined}>{photoError || "JPG, PNG (maks. 5 MB)"}</small>
          </div>

          <div className="nb-fields">
            <label className={`nb-field${errors.first ? " bad" : ""}`}>
              <span>Ism <em className="nb-req">*</em></span>
              <input data-testid="patient-first" placeholder="Ism kiriting" value={draft.first} onChange={(event) => set("first", event.target.value)} aria-invalid={Boolean(errors.first)} />
              {errors.first ? <b className="nb-err">{errors.first}</b> : null}
            </label>
            <label className={`nb-field${errors.family ? " bad" : ""}`}>
              <span>Familiya <em className="nb-req">*</em></span>
              <input data-testid="patient-family" placeholder="Familiya kiriting" value={draft.family} onChange={(event) => set("family", event.target.value)} aria-invalid={Boolean(errors.family)} />
              {errors.family ? <b className="nb-err">{errors.family}</b> : null}
            </label>
            <label className={`nb-field${errors.phone ? " bad" : ""}`}>
              <span>Telefon raqami <em className="nb-req">*</em></span>
              <span className="nb-phone">
                <span className="nb-code"><Flag /><em>+998</em><ChevronDown className="chev" /></span>
                <input data-testid="patient-phone" inputMode="numeric" placeholder="90 123 45 67" value={formatLocal(draft.phone)} onChange={(event) => set("phone", digitsOnly(event.target.value))} aria-invalid={Boolean(errors.phone)} />
              </span>
              {errors.phone ? <b className="nb-err">{errors.phone}</b> : null}
            </label>
            <label className={`nb-field${errors.birth ? " bad" : ""}`}>
              <span>Tug‘ilgan sana <em className="nb-req">*</em></span>
              <span className="nb-date">
                <input data-testid="patient-birth" placeholder="DD.MM.YYYY" value={draft.birth} onChange={(event) => set("birth", event.target.value)} aria-invalid={Boolean(errors.birth)} />
                <button type="button" aria-label="Kalendar" onClick={() => dateRef.current?.showPicker?.()}>
                  <CalendarDays size={18} />
                </button>
                <input ref={dateRef} className="nb-native" type="date" tabIndex={-1} aria-hidden="true" onChange={(event) => applyIso(event.target.value)} />
              </span>
              {errors.birth ? <b className="nb-err">{errors.birth}</b> : null}
            </label>
          </div>
        </div>

        <div className="nb-fields" style={{ marginTop: 14 }}>
          <div className={`nb-field${errors.gender ? " bad" : ""}`}>
            <span className="nb-label">Jinsi <em className="nb-req">*</em></span>
            <div className="nb-seg" role="group" aria-label="Jinsi">
              <button type="button" className={draft.gender === "Erkak" ? "on" : undefined} data-testid="patient-gender-erkak" onClick={() => set("gender", "Erkak")}>Erkak</button>
              <button type="button" className={draft.gender === "Ayol" ? "on" : undefined} data-testid="patient-gender-ayol" onClick={() => set("gender", "Ayol")}>Ayol</button>
            </div>
            {errors.gender ? <b className="nb-err">{errors.gender}</b> : null}
          </div>
          <label className={`nb-field${errors.city ? " bad" : ""}`}>
            <span>Shahar <em className="nb-req">*</em></span>
            <select data-testid="patient-form-city" value={draft.city} onChange={(event) => set("city", event.target.value)} aria-invalid={Boolean(errors.city)}>
              <option value="">Tanlang</option>
              {patientCities.map((city) => <option key={city}>{city}</option>)}
            </select>
            {errors.city ? <b className="nb-err">{errors.city}</b> : null}
          </label>
          <label className="nb-field wide">
            <span>Manzil</span>
            <span className="nb-iconed">
              <span className="lead"><MapPin size={16} /></span>
              <input data-testid="patient-address" placeholder="To‘liq manzil kiriting" value={draft.address} onChange={(event) => set("address", event.target.value)} />
            </span>
          </label>
          <label className="nb-field">
            <span>Email</span>
            <span className="nb-iconed">
              <span className="lead"><Mail size={16} /></span>
              <input data-testid="patient-email" type="email" placeholder="email@example.com" value={draft.email} onChange={(event) => set("email", event.target.value)} />
            </span>
          </label>
          <label className="nb-field">
            <span>Qayerdan bildi?</span>
            <select data-testid="patient-source" value={draft.source} onChange={(event) => set("source", event.target.value)}>
              <option value="">Tanlang</option>
              {SOURCES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="nb-field wide">
            <span>Allergiya / kasalliklar</span>
            <div className="nb-checks">
              {CONDITIONS.map((item) => (
                <label key={item}>
                  <input
                    type="checkbox"
                    checked={draft.conditions.includes(item)}
                    onChange={(event) => set("conditions", event.target.checked ? [...draft.conditions, item] : draft.conditions.filter((entry) => entry !== item))}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
          <label className="nb-field wide">
            <input placeholder="Boshqa kasalliklar (ixtiyoriy)" value={draft.other} onChange={(event) => set("other", event.target.value)} />
          </label>
          <label className="nb-field wide nb-note">
            <span>Izoh</span>
            <textarea data-testid="patient-note" maxLength={500} placeholder="Qo‘shimcha ma’lumot (ixtiyoriy)" value={draft.note} onChange={(event) => set("note", event.target.value.slice(0, 500))} />
            <b>{draft.note.length}/500</b>
          </label>
        </div>

        <footer className="nb-foot">
          <button type="button" className="nb-cancel" data-testid="patient-cancel" onClick={onClose}>Bekor qilish</button>
          <button type="button" className="nb-save" data-testid="patient-save" onClick={submit}><Plus size={16} /> Saqlash</button>
        </footer>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}
