"use client";
/* eslint-disable @next/next/no-img-element -- local previews and uploaded photos */

import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Check, ClipboardList, Heart, HelpCircle, ImagePlus, MessageCircle, MessagesSquare, Send, Share2, ShieldCheck, Tag, Upload, X } from "lucide-react";
import { useCommunityWork } from "@/components/community-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { uploadImage } from "@/lib/image-upload";
import { CASE_TAGS, caseProblem, personalDataProblem } from "@/lib/forms/p0";
import type { PostKind } from "@/data/desktop-hub";
import "./post-composer.css";

export const COMPOSER_KINDS = [
  { id: "keys" as PostKind, label: "Klinik keys", text: "Haqiqiy klinik holatni ulashing", icon: ClipboardList, tone: "teal" },
  { id: "savol" as PostKind, label: "Savol", text: "Hamkasblardan yordam oling", icon: HelpCircle, tone: "blue" },
  { id: "muhokama" as PostKind, label: "Muhokama", text: "Dolzarb mavzularni muhokama qiling", icon: MessagesSquare, tone: "violet" },
];

const STEPS = [
  { id: "complaint", label: "Shikoyat", hint: "Bemorning shikoyatlari va anamnezi..." },
  { id: "exam", label: "Klinik tekshiruv", hint: "Ko‘rik, rentgen va testlar natijalari..." },
  { id: "diagnosis", label: "Tashxis", hint: "Yakuniy tashxis..." },
  { id: "plan", label: "Davolash rejasi", hint: "Rejalashtirilgan davolash..." },
  { id: "steps", label: "Davolash jarayoni", hint: "1. ...\n2. ...\n3. ..." },
  { id: "result", label: "Natija", hint: "Davolash natijasi va nazorat..." },
] as const;
type StepId = (typeof STEPS)[number]["id"];

const RULES = [
  ["Bemorning roziligi", " olingan bo‘lishi shart."],
  ["Rasmlarda bemorni aniqlash mumkin bo‘lgan", " ma’lumotlar bo‘lmasin."],
  ["Klinik ma’lumotlar faqat ta’lim va tajriba", " almashish maqsadida qo‘llansin."],
  ["Etik qoidalar va tibbiy maxfiylikka", " rioya qiling."],
] as const;

const MAX_PHOTOS = 6;
const MAX_TAGS = 6;

type Photo = { file: File; url: string };

function displayDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}.${m}.${y}` : "";
}

/** Desktop "Yangi post yozish" dialog (mock "yengi post qoshish"). Publishes through /api/community. */
export function PostComposer({ initialKind, onClose, onPublished }: { initialKind: PostKind; onClose: () => void; onPublished: () => void }) {
  const work = useCommunityWork();
  const { profile } = useDoctorProfile();
  const [kind, setKind] = useState<PostKind>(initialKind);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState<string>(CASE_TAGS[1]);
  const [about, setAbout] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"" | "Erkak" | "Ayol">("");
  const [date, setDate] = useState("");
  const [step, setStep] = useState<StepId>("complaint");
  const [clinic, setClinic] = useState<Record<StepId, string>>({ complaint: "", exam: "", diagnosis: "", plan: "", steps: "", result: "" });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [consent, setConsent] = useState(false);
  const [faceAck, setFaceAck] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isCase = kind === "keys";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  // Object URLs are freed when a photo is removed and, for the rest, when the dialog closes.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url)), []);

  function removePhoto(photo: Photo) {
    URL.revokeObjectURL(photo.url);
    setPhotos((current) => current.filter((item) => item !== photo));
  }

  const allTags = useMemo(() => [topic, ...tags.filter((tag) => tag.toLowerCase() !== topic.toLowerCase())].slice(0, MAX_TAGS), [tags, topic]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_PHOTOS - photos.length;
    const next = [...list].filter((file) => file.type.startsWith("image/")).slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (next.length) setPhotos((current) => [...current, ...next]);
  }

  function addTag() {
    const clean = tagDraft.trim().replace(/^#/, "").replace(/\s+/g, "");
    setTagDraft("");
    if (!clean || tags.length + 1 >= MAX_TAGS) return;
    if (!tags.some((tag) => tag.toLowerCase() === clean.toLowerCase())) setTags([...tags, clean]);
  }

  function composeText() {
    const parts = [title.trim(), about.trim()];
    if (isCase) {
      const patient = [age ? `${age} yosh` : "", gender].filter(Boolean).join(", ");
      const meta = [patient ? `Bemor: ${patient}` : "", date ? `Davolash sanasi: ${displayDate(date)}` : ""].filter(Boolean).join(" · ");
      const lines = [
        meta,
        `Shikoyat: ${clinic.complaint.trim()}`,
        clinic.exam.trim() ? `Klinik tekshiruv: ${clinic.exam.trim()}` : "",
        `Diagnoz: ${clinic.diagnosis.trim()}`,
        clinic.plan.trim() ? `Davolash rejasi: ${clinic.plan.trim()}` : "",
        `Bosqichlar:\n${clinic.steps.trim()}`,
        clinic.result.trim() ? `Natija: ${clinic.result.trim()}` : "",
      ].filter(Boolean);
      parts.push(lines.join("\n"));
    }
    return parts.filter(Boolean).join("\n\n");
  }

  async function submit() {
    if (busy) return;
    if (!title.trim()) return setError("Sarlavhani yozing.");
    if (!about.trim()) return setError("Qisqacha tavsifni yozing.");
    const text = composeText();
    if (isCase) {
      const problem = caseProblem({
        text,
        tags: allTags,
        images: photos.map(() => "pending"),
        consent,
        faceAck,
        complaint: clinic.complaint,
        diagnosis: clinic.diagnosis,
        steps: clinic.steps,
      });
      if (problem) return setError(problem);
      if (!hidden) return setError("Ism va shaxsiy ma’lumotlar yashirilganini tasdiqlang.");
    } else {
      const personal = personalDataProblem(text);
      if (personal) return setError(personal);
    }
    setError("");
    setBusy(true);
    try {
      const images: string[] = [];
      for (const photo of photos) images.push(await uploadImage(photo.file, "post"));
      const result = await work.publish({
        kind: isCase ? "case" : kind === "savol" ? "savol" : "yangilik",
        text,
        tags: allTags,
        images,
        ...(isCase ? { consent, faceAck, complaint: clinic.complaint, diagnosis: clinic.diagnosis, steps: clinic.steps } : {}),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onPublished();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Postni saqlab bo‘lmadi.");
    } finally {
      setBusy(false);
    }
  }

  const name = profile?.fullName || "Siz";
  const role = [profile?.specialty, profile?.city].filter(Boolean).join(" · ");
  const kindMeta = COMPOSER_KINDS.find((item) => item.id === kind) ?? COMPOSER_KINDS[0];

  return (
    <div className="pc-scrim" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <div className="pc" role="dialog" aria-modal="true" aria-labelledby="pc-title" data-testid="post-composer">
        <header className="pc-head">
          <span className="pc-logo"><ClipboardList /></span>
          <div>
            <h2 id="pc-title">Yangi post yozish</h2>
            <p>Bilim, tajriba va qiziqarli mavzularni hamkasblaringiz bilan ulashing</p>
          </div>
          <button type="button" className="pc-x" aria-label="Yopish" onClick={onClose} disabled={busy}><X /></button>
        </header>

        <div className="pc-kinds" role="radiogroup" aria-label="Post turi">
          {COMPOSER_KINDS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" role="radio" aria-checked={kind === item.id} className={kind === item.id ? `pc-kind ${item.tone} on` : `pc-kind ${item.tone}`} onClick={() => setKind(item.id)}>
                <i><Icon /></i>
                <span><b>{item.label}</b><small>{item.text}</small></span>
              </button>
            );
          })}
        </div>

        <div className="pc-body">
          <div className="pc-form">
            <h3>Asosiy ma’lumotlar</h3>
            <div className="pc-row2">
              <label className="pc-field">
                <span>Sarlavha <em>*</em></span>
                <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder={isCase ? "Masalan: 36-tish: apikal periodontit, qayta endodontik davolash" : "Post sarlavhasi"} data-testid="pc-title" />
              </label>
              <label className="pc-field">
                <span>Mavzu (kategoriya) <em>*</em></span>
                <select value={topic} onChange={(event) => setTopic(event.target.value)} data-testid="pc-topic">
                  {CASE_TAGS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <label className="pc-field">
              <span>Qisqacha tavsif <em>*</em><small>{about.length}/1000</small></span>
              <textarea value={about} maxLength={1000} rows={4} onChange={(event) => setAbout(event.target.value)} placeholder={isCase ? "Klinik holat haqida qisqacha ma’lumot yozing..." : "Fikringiz yoki savolingizni batafsil yozing..."} data-testid="pc-about" />
            </label>

            {isCase ? (
              <>
                <div className="pc-row2">
                  <div className="pc-field">
                    <span>Bemor ma’lumotlari (ixtiyoriy)</span>
                    <div className="pc-patient">
                    <label>
                      <small>Yosh</small>
                      <input inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Masalan: 28" />
                    </label>
                    <div>
                      <small>Jinsi</small>
                      <span className="pc-radios">
                        {(["Erkak", "Ayol"] as const).map((item) => (
                          <button key={item} type="button" role="radio" aria-checked={gender === item} className={gender === item ? "on" : undefined} onClick={() => setGender(gender === item ? "" : item)}>
                            <i />{item}
                          </button>
                        ))}
                      </span>
                    </div>
                    </div>
                  </div>
                  <label className="pc-field">
                    <span>Davolash sanasi</span>
                    <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                  </label>
                </div>

                <h3>Klinik ma’lumotlar</h3>
                <div className="pc-steps" role="tablist">
                  {STEPS.map((item, index) => (
                    <button key={item.id} type="button" role="tab" aria-selected={step === item.id} className={step === item.id ? "on" : clinic[item.id].trim() ? "done" : undefined} onClick={() => setStep(item.id)}>
                      <i>{clinic[item.id].trim() && step !== item.id ? <Check /> : index + 1}</i>
                      {item.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className="pc-step-text"
                  rows={3}
                  value={clinic[step]}
                  onChange={(event) => setClinic({ ...clinic, [step]: event.target.value })}
                  placeholder={STEPS.find((item) => item.id === step)?.hint}
                  aria-label={STEPS.find((item) => item.id === step)?.label}
                  data-testid={`pc-step-${step}`}
                />
              </>
            ) : null}

            <h3>Rasm va fayllar</h3>
            <div className="pc-photos">
              {photos.length < MAX_PHOTOS && photos.length === 0 ? (
                <label className="pc-drop">
                  <Upload />
                  <b>Rasm yoki rentgen yuklash</b>
                  <small>PNG, JPG, JPEG · {MAX_PHOTOS} tagacha{isCase ? " · oldin va keyin, kamida 2 ta" : ""}</small>
                  <input type="file" accept="image/*" multiple hidden onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
                </label>
              ) : null}
              {photos.map((photo, index) => (
                <figure key={photo.url}>
                  <img src={photo.url} alt={`Rasm ${index + 1}`} />
                  <button type="button" aria-label="Olib tashlash" onClick={() => removePhoto(photo)}><X /></button>
                </figure>
              ))}
              {photos.length > 0 && photos.length < MAX_PHOTOS ? (
                <label className="pc-more">
                  <ImagePlus />
                  <span>Yana qo‘shish</span>
                  <input type="file" accept="image/*" multiple hidden onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
                </label>
              ) : null}
            </div>

            <h3>Teglar (kalit so‘zlar)</h3>
            <div className="pc-tags">
              {allTags.map((tag) => (
                <span key={tag}>
                  #{tag.replace(/\s+/g, "")}
                  {tag !== topic ? <button type="button" aria-label={`${tag} tegini olib tashlash`} onClick={() => setTags(tags.filter((item) => item !== tag))}><X /></button> : null}
                </span>
              ))}
              {allTags.length < MAX_TAGS ? (
                <label>
                  <Tag />
                  <input
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                    onBlur={addTag}
                    placeholder="Enter bilan qo‘shing..."
                  />
                </label>
              ) : null}
            </div>

            {isCase ? (
              <>
                <h3>Maxfiylik va rozilik</h3>
                <div className="pc-consent">
                  <Tick on={consent} onClick={() => setConsent(!consent)} label="Bemor roziligi olingan" />
                  <Tick on={faceAck} onClick={() => setFaceAck(!faceAck)} label="Yuz ko‘rinmaydi" />
                  <Tick on={hidden} onClick={() => setHidden(!hidden)} label="Ism va shaxsiy ma’lumotlar yashirilgan" />
                </div>
              </>
            ) : null}
          </div>

          <aside className="pc-side">
            <section className="pc-preview" aria-label="Post ko‘rinishi">
              <h4>Post ko‘rinishi (oldindan)</h4>
              <div className="pc-card">
                <div className="pc-author">
                  {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span className="pc-ini">{name.replace(/^Dr\.?\s*/i, "").slice(0, 1).toUpperCase()}</span>}
                  <span>
                    <b>{name} <BadgeCheck /></b>
                    {role ? <small>{role}</small> : null}
                  </span>
                  <em className={kindMeta.tone}><kindMeta.icon /> {kindMeta.label}</em>
                </div>
                <h5>{title.trim() || "Sarlavha shu yerda ko‘rinadi"}</h5>
                <p>{about.trim() || "Qisqacha tavsif shu yerda ko‘rinadi."}</p>
                {photos.length ? (
                  <div className="pc-pv-photos">
                    {photos.slice(0, 3).map((photo, index) => (
                      <span key={photo.url}>
                        <img src={photo.url} alt="" />
                        {index === 2 && photos.length > 3 ? <i>+{photos.length - 3}</i> : null}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="pc-pv-tags">{allTags.map((tag) => <span key={tag}>#{tag.replace(/\s+/g, "")}</span>)}</div>
                <div className="pc-pv-acts">
                  <span><Heart /> 0</span>
                  <span><MessageCircle /> 0</span>
                  <span className="end"><Share2 /> Ulashish</span>
                </div>
              </div>
            </section>
            <section className="pc-rules">
              <h4><ShieldCheck /> Muhim eslatma</h4>
              <ul>
                {RULES.map(([strong, rest]) => (
                  <li key={strong}><Check /><span><b>{strong}</b>{rest}</span></li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <footer className="pc-foot">
          {error ? <p role="alert" data-testid="pc-error">{error}</p> : <span />}
          <button type="button" className="pc-cancel" onClick={onClose} disabled={busy}>Bekor</button>
          <button type="button" className="pc-go" onClick={() => void submit()} disabled={busy} data-testid="pc-submit">
            {busy ? "Joylanmoqda…" : <><Send /> Post joylash</>}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Tick({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} className={on ? "pc-tick on" : "pc-tick"} onClick={onClick}>
      <i>{on ? <Check /> : null}</i>
      {label}
    </button>
  );
}

