"use client";
/* eslint-disable @next/next/no-img-element -- category pictures and local uploads */

import { useEffect, useState, type ReactNode } from "react";
import { Box, Check, RefreshCw, Save, Tag, Upload, X } from "lucide-react";
import { SERVICE_CATEGORIES, categoryImage, type ClinicService, type ServiceCategory } from "@/lib/crm-services";
import "./service-modal.css";

const COLORS = ["#99e2d6", "#bfdbfe", "#ddd6fe", "#fde68a", "#fecaca", "#fbcfe8", "#e2e8f0"];

/** Shrinks an uploaded picture to a small JPEG data URL so it fits in browser storage. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const side = 160;
    const scale = Math.min(1, side / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** "Yangi xizmat qo‘shish" / edit dialog (mock "yangi xizmat qo'shish oynasi"). */
export function ServiceModal({
  initial,
  code,
  onClose,
  onSave,
}: {
  initial: ClinicService | null;
  code: string;
  onClose: () => void;
  onSave: (service: ClinicService) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<ServiceCategory | "">(initial?.category ?? "");
  const [svcCode, setSvcCode] = useState(initial?.code ?? code);
  const [short, setShort] = useState(initial?.short ?? "");
  const [details, setDetails] = useState(initial?.details ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [minutes, setMinutes] = useState(initial ? String(initial.minutes) : "30");
  const [teeth, setTeeth] = useState(initial?.teeth ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [inPlans, setInPlans] = useState(initial?.inPlans ?? true);
  const [materials, setMaterials] = useState<string[]>(initial?.materials ?? []);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function save() {
    const amount = Number(price.replace(/\D/g, ""));
    const mins = Number(minutes.replace(/\D/g, ""));
    if (name.trim().length < 2) return setError("Xizmat nomini yozing.");
    if (!category) return setError("Kategoriyani tanlang.");
    if (!amount) return setError("Narxni kiriting.");
    if (!mins) return setError("Davomiylikni kiriting.");
    if (!tags.length) return setError("Kamida bitta teg qo‘shing.");
    onSave({
      id: initial?.id ?? `svc-${Date.now().toString(36)}`,
      name: name.trim(),
      code: svcCode.trim() || code,
      category,
      short: short.trim(),
      details: details.trim(),
      image: image || categoryImage(category),
      price: amount,
      minutes: mins,
      teeth: teeth.trim(),
      active,
      inPlans,
      materials,
      tags,
      color,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  }

  return (
    <div className="svm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="svm-box" role="dialog" aria-modal="true" aria-labelledby="svm-title" data-testid="service-modal">
        <header className="svm-head">
          <span className="svm-logo"><ToothIcon /></span>
          <div>
            <h2 id="svm-title">{initial ? "Xizmatni tahrirlash" : "Yangi xizmat qo‘shish"}</h2>
            <p>Klinikangizda ko‘rsatiladigan tibbiy xizmatni {initial ? "yangilang" : "qo‘shing"}</p>
          </div>
          <button type="button" className="svm-x" aria-label="Yopish" onClick={onClose}><X /></button>
        </header>

        <div className="svm-body">
          <div className="svm-col">
            <section className="svm-card">
              <h3>Asosiy ma’lumotlar</h3>
              <label className="svm-f"><span>Xizmat nomi <em>*</em></span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Masalan: Kompozit plomba" data-testid="svc-name" /></label>
              <div className="svm-2">
                <label className="svm-f">
                  <span>Kategoriya <em>*</em></span>
                  <select value={category} onChange={(event) => setCategory(event.target.value as ServiceCategory)} data-testid="svc-category">
                    <option value="">Kategoriya tanlang</option>
                    {SERVICE_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className="svm-f">
                  <span>Kodi (ichki)</span>
                  <span className="svm-code">
                    <input value={svcCode} onChange={(event) => setSvcCode(event.target.value)} />
                    <button type="button" aria-label="Kodni tiklash" onClick={() => setSvcCode(initial?.code ?? code)}><RefreshCw /></button>
                  </span>
                </label>
              </div>
              <label className="svm-f"><span>Qisqa tavsif</span><textarea rows={2} value={short} maxLength={160} onChange={(event) => setShort(event.target.value)} placeholder="Xizmat haqida qisqa ma’lumot..." /></label>
              <label className="svm-f"><span>Batafsil tavsif</span><textarea rows={3} value={details} maxLength={2000} onChange={(event) => setDetails(event.target.value)} placeholder="Xizmat haqida batafsil ma’lumot..." /></label>
            </section>
            <section className="svm-card">
              <h3>Rasm / ikonka</h3>
              <div className="svm-pics">
                <label className="svm-up">
                  {image.startsWith("data:") ? <img src={image} alt="" /> : <><Upload /><b>Rasm yuklash</b><small>PNG, JPG</small></>}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void shrink(file).then(setImage).catch(() => setError("Rasmni o‘qib bo‘lmadi."));
                    }}
                  />
                </label>
                {SERVICE_CATEGORIES.map((item) => {
                  const src = categoryImage(item.id);
                  return (
                    <button key={item.id} type="button" className={image === src ? "on" : undefined} aria-label={item.label} aria-pressed={image === src} onClick={() => setImage(src)}>
                      <img src={src} alt="" />
                    </button>
                  );
                })}
              </div>
              <p className="svm-hint">Tanlanmasa, kategoriya rasmi qo‘yiladi.</p>
            </section>
          </div>

          <div className="svm-col">
            <section className="svm-card">
              <h3>Narx va vaqt</h3>
              <div className="svm-3">
                <label className="svm-f"><span>Narx (so‘m) <em>*</em></span><input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value.replace(/\D/g, ""))} placeholder="0" data-testid="svc-price" /></label>
                <label className="svm-f"><span>Davomiyligi (daqiqa) <em>*</em></span><input inputMode="numeric" value={minutes} onChange={(event) => setMinutes(event.target.value.replace(/\D/g, ""))} /></label>
                <label className="svm-f"><span>Tishlar soni (ixtiyoriy)</span><input value={teeth} onChange={(event) => setTeeth(event.target.value)} placeholder="Masalan: 1 yoki 2" /></label>
              </div>
            </section>
            <section className="svm-card">
              <h3>Qo‘shimcha sozlamalar</h3>
              <div className="svm-2">
                <label className="svm-f">
                  <span>Status</span>
                  <select value={active ? "faol" : "nofaol"} onChange={(event) => setActive(event.target.value === "faol")}>
                    <option value="faol">Faol</option>
                    <option value="nofaol">Nofaol</option>
                  </select>
                </label>
                <div className="svm-f">
                  <span>Davolash rejalarida ko‘rsatish</span>
                  <button type="button" role="switch" aria-checked={inPlans} className={inPlans ? "svm-sw on" : "svm-sw"} onClick={() => setInPlans(!inPlans)}>
                    <i /> {inPlans ? "Ha, ko‘rsatish" : "Yo‘q"}
                  </button>
                </div>
              </div>
              <Chips label="Foydalaniladigan materiallar" icon={<Box />} values={materials} onChange={setMaterials} placeholder="Masalan: Kompozit, Adgeziv, Lokal anestetik..." />
              <Chips label="Teglar (kalit so‘zlar)" required icon={<Tag />} values={tags} onChange={setTags} placeholder="Enter bilan qo‘shing..." />
            </section>
            <section className="svm-card">
              <h3>Rang</h3>
              <div className="svm-colors">
                {COLORS.map((item) => (
                  <button key={item} type="button" aria-label={`Rang ${item}`} aria-pressed={color === item} className={color === item ? "on" : undefined} style={{ background: item }} onClick={() => setColor(item)}>
                    {color === item ? <Check /> : null}
                  </button>
                ))}
              </div>
              <p className="svm-hint">Rang taqvim va davolash rejalarida xizmatni ajratib ko‘rsatish uchun.</p>
            </section>
          </div>
        </div>

        <footer className="svm-foot">
          {error ? <p role="alert">{error}</p> : <span />}
          <button type="button" className="svm-cancel" onClick={onClose}>Bekor</button>
          <button type="button" className="svm-save" onClick={save} data-testid="svc-save"><Save /> Saqlash</button>
        </footer>
      </div>
    </div>
  );
}

function Chips({ label, icon, values, onChange, placeholder, required }: { label: string; icon: ReactNode; values: string[]; onChange: (next: string[]) => void; placeholder: string; required?: boolean }) {
  const [draft, setDraft] = useState("");
  function add() {
    const clean = draft.trim().replace(/,$/, "");
    setDraft("");
    if (!clean || values.length >= 10 || values.some((item) => item.toLowerCase() === clean.toLowerCase())) return;
    onChange([...values, clean]);
  }
  return (
    <div className="svm-f">
      <span>{label} {required ? <em>*</em> : null}</span>
      <div className="svm-chips">
        {icon}
        {values.map((item) => (
          <b key={item}>{item}<button type="button" aria-label={`${item} olib tashlash`} onClick={() => onChange(values.filter((value) => value !== item))}><X /></button></b>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add();
            } else if (event.key === "Backspace" && !draft && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={add}
          placeholder={values.length ? "" : placeholder}
        />
      </div>
    </div>
  );
}

export function ToothIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3.5c-2.2 0-3.5 1.8-3.5 4.2 0 2.3.9 3.6 1.4 5.6.6 2.3.8 7.2 2.6 7.2 1.6 0 1.4-4.6 2.3-6 .6-.9 1.8-.9 2.4 0 .9 1.4.7 6 2.3 6 1.8 0 2-4.9 2.6-7.2.5-2 1.4-3.3 1.4-5.6 0-2.4-1.3-4.2-3.5-4.2-1.9 0-2.9 1-5 1s-3.1-1-5-1Z" />
    </svg>
  );
}
