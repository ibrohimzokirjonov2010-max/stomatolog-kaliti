"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Camera, ChevronDown, Mail, MapPin, Plus } from "lucide-react";
import type { Patient } from "@/data/crm";
import { patientCities } from "@/data/crm";
import { fileToCompressedDataUrl } from "@/lib/seller-work";
import { CmDate, CmDialog, CmError, CmField, CmSelect } from "@/components/crm/crm-form-kit";
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
    <svg className="cm-flag" viewBox="0 0 24 16" aria-hidden="true">
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
  const [draft, setDraft] = useState<NewPatientDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState("");

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
    try {
      set("photo", await fileToCompressedDataUrl(file, 480, 0.82));
    } catch {
      setPhotoError("Rasmni o‘qib bo‘lmadi");
    }
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

  return (
    <CmDialog
      testId="patient-modal"
      title="Yangi bemor qo‘shish"
      subtitle="Bemorning asosiy ma’lumotlarini kiriting"
      width={540}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cm-ghost" data-testid="patient-cancel" onClick={onClose}>Bekor qilish</button>
          <button type="button" className="cm-go" data-testid="patient-save" onClick={submit}><Plus /> Saqlash</button>
        </>
      }
    >
      <div className="cm-pt-top">
        <div className="cm-photo">
          <label>
            {draft.photo ? <img src={draft.photo} alt="Bemor rasmi" /> : (<><Camera /><span>Rasm yuklash</span></>)}
            <input
              data-testid="patient-photo"
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              className="cm-native"
              aria-label="Bemor rasmi"
              onChange={(event) => {
                void onPhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          <small className={photoError ? "bad" : undefined}>{photoError || "JPG, PNG (maks. 5 MB)"}</small>
        </div>
        <div className="cm-grid">
          <CmField label="Ism" req>
            <input className={`cm-input${errors.first ? " bad" : ""}`} data-testid="patient-first" aria-label="Ism" placeholder="Ism kiriting" value={draft.first} onChange={(event) => set("first", event.target.value)} aria-invalid={Boolean(errors.first)} />
            <CmError text={errors.first} />
          </CmField>
          <CmField label="Familiya" req>
            <input className={`cm-input${errors.family ? " bad" : ""}`} data-testid="patient-family" aria-label="Familiya" placeholder="Familiya kiriting" value={draft.family} onChange={(event) => set("family", event.target.value)} aria-invalid={Boolean(errors.family)} />
            <CmError text={errors.family} />
          </CmField>
          <CmField label="Telefon raqami" req>
            <span className={`cm-phone${errors.phone ? " bad" : ""}`}>
              <span className="code"><Flag /><span>+998</span><ChevronDown className="chev" /></span>
              <input data-testid="patient-phone" aria-label="Telefon raqami" inputMode="numeric" placeholder="90 123 45 67" value={formatLocal(draft.phone)} onChange={(event) => set("phone", digitsOnly(event.target.value))} aria-invalid={Boolean(errors.phone)} />
            </span>
            <CmError text={errors.phone} />
          </CmField>
          <CmField label="Tug‘ilgan sana" req>
            <CmDate label="Tug‘ilgan sana" testId="patient-birth" value={draft.birth} bad={Boolean(errors.birth)} onChange={(value) => set("birth", value)} />
            <CmError text={errors.birth} />
          </CmField>
        </div>
      </div>

      <div className="cm-pt-mid">
        <CmField label="Jinsi" req>
          <div className="cm-seg" role="group" aria-label="Jinsi">
            <button type="button" className={draft.gender === "Erkak" ? "on" : undefined} aria-pressed={draft.gender === "Erkak"} data-testid="patient-gender-erkak" onClick={() => set("gender", "Erkak")}>Erkak</button>
            <button type="button" className={draft.gender === "Ayol" ? "on" : undefined} aria-pressed={draft.gender === "Ayol"} data-testid="patient-gender-ayol" onClick={() => set("gender", "Ayol")}>Ayol</button>
          </div>
          <CmError text={errors.gender} />
        </CmField>
        <CmField label="Shahar" req>
          <CmSelect label="Shahar" testId="patient-form-city" value={draft.city} placeholder="Tanlang" options={patientCities} bad={Boolean(errors.city)} onChange={(value) => set("city", value)} />
          <CmError text={errors.city} />
        </CmField>
        <CmField label="Manzil" className="wide">
          <span className="cm-ctl lead">
            <span className="cm-lead"><MapPin /></span>
            <input data-testid="patient-address" aria-label="Manzil" placeholder="To‘liq manzil kiriting" value={draft.address} onChange={(event) => set("address", event.target.value)} />
          </span>
        </CmField>
        <CmField label="Email">
          <span className="cm-ctl lead">
            <span className="cm-lead"><Mail /></span>
            <input data-testid="patient-email" aria-label="Email" type="email" placeholder="email@example.com" value={draft.email} onChange={(event) => set("email", event.target.value)} />
          </span>
        </CmField>
        <CmField label="Qayerdan bildi?">
          <CmSelect label="Qayerdan bildi?" testId="patient-source" value={draft.source} placeholder="Tanlang" options={SOURCES} onChange={(value) => set("source", value)} />
        </CmField>
        <CmField label="Allergiya / kasalliklar" className="wide">
          <div className="cm-checks">
            {CONDITIONS.map((item) => (
              <label key={item} className="cm-check">
                <input
                  type="checkbox"
                  checked={draft.conditions.includes(item)}
                  onChange={(event) => set("conditions", event.target.checked ? [...draft.conditions, item] : draft.conditions.filter((entry) => entry !== item))}
                />
                {item}
              </label>
            ))}
          </div>
          <input className="cm-input" aria-label="Boshqa kasalliklar" placeholder="Boshqa kasalliklar (ixtiyoriy)" value={draft.other} onChange={(event) => set("other", event.target.value)} />
        </CmField>
        <CmField label="Izoh" className="wide">
          <textarea className="cm-area" data-testid="patient-note" aria-label="Izoh" maxLength={500} placeholder="Qo‘shimcha ma’lumot (ixtiyoriy)" value={draft.note} onChange={(event) => set("note", event.target.value.slice(0, 500))} />
          <span className="cm-count">{draft.note.length}/500</span>
        </CmField>
      </div>
    </CmDialog>
  );
}
