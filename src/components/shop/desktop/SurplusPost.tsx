"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, ChevronLeft, ChevronRight, Circle, ClipboardList, Eye, FileUp, ImagePlus, MapPin, Package, Send, Tag, Upload, Video, X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useSurplusWork } from "@/components/surplus-provider";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopCart } from "@/components/shop/desktop/shop-cart";
import { surplusSeed } from "@/data/desktop-shop";
import {
  categoryToProductCategory,
  placeholderImage,
  surplusCategories,
  surplusCities,
  surplusPopularBrands,
  type PackageStatus,
  type SurplusCategory,
  type SurplusCondition,
  type SurplusListing,
} from "@/data/surplus";
import { formatPhoneDisplay } from "@/lib/doctor-profile";
import { prepareImage, uploadImage } from "@/lib/image-upload";
import { clearDraft, readDraft, writeDraft, type DraftPhoto, type SurplusDraft } from "@/lib/surplus-local";
import { phoneOk } from "@/lib/work-validate";
import "./shop.css";
import "./surplus-post.css";

const HOLATI = [
  { id: "ochilmagan", label: "Ochilmagan", pkg: "yopiq" as PackageStatus, condition: "yangi" as SurplusCondition },
  { id: "ochilgan", label: "Ochilgan, lekin ishlatilmagan", pkg: "ochilgan" as PackageStatus, condition: "ochilgan" as SurplusCondition },
  { id: "qisman", label: "Qisman ishlatilgan", pkg: "ochilgan" as PackageStatus, condition: "ishlatilgan" as SurplusCondition },
] as const;

const UNITS = ["dona", "shprits", "quti", "to‘plam"] as const;
const SOURCES = ["Rasmiy distribyutor", "Do‘kon", "Ko‘rgazma", "Chet eldan", "Boshqa"] as const;
const REASONS = ["Ortiqcha buyurtma qilingan", "Klinika yopildi", "Boshqa brendga o‘tdim", "Muddati yaqin", "Boshqa"] as const;
const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const;
const YEARS = Array.from({ length: 11 }, (_, index) => String(2026 + index));
const MAX_VIDEO = 100 * 1024 * 1024;

type Photo = DraftPhoto;
type Errors = Record<string, string>;

const emptyForm = {
  name: "",
  category: "",
  brand: "",
  qty: "",
  unit: "dona",
  month: "",
  year: "",
  holati: "",
  source: "",
  shopName: "",
  invoiceName: "",
  invoiceSize: 0,
  reason: "",
  note: "",
  price: "",
  newPrice: "",
  phone: "",
  city: "",
  telegram: "",
};

function money(value: string) {
  const n = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function monthsAhead(month: string, year: string) {
  const mm = Number(month);
  const yyyy = Number(year);
  if (!mm || !yyyy) return 0;
  return Math.max(1, (yyyy - 2026) * 12 + (mm - 10));
}

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Fayl o‘qilmadi"));
    reader.readAsDataURL(blob);
  });
}

function probeDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video o‘qilmadi. Boshqa fayl tanlang."));
    };
    video.src = url;
  });
}

export function SurplusPostDesktop() {
  const lines = useShopCart(surplusSeed);
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  return (
    <ShopShell searchPath="/ortiqcha-material" cartCount={count}>
      <SurplusPostForm />
    </ShopShell>
  );
}

export function SurplusPostMobile() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  if (!narrow) return null;
  return <SurplusPostForm mobile />;
}

export function SurplusPostForm({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const { profile } = useDoctorProfile();
  const { publish, publishLocal, authed } = useSurplusWork();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoName, setVideoName] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [cameraNote, setCameraNote] = useState("");
  const [recording, setRecording] = useState(false);
  const [readyDraft, setReadyDraft] = useState(false);

  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setForm({
        name: draft.name ?? "",
        category: draft.category ?? "",
        brand: draft.brand ?? "",
        qty: draft.qty ?? "",
        unit: draft.unit || "dona",
        month: draft.month ?? "",
        year: draft.year ?? "",
        holati: draft.holati ?? "",
        source: draft.source ?? "",
        shopName: draft.shopName ?? "",
        invoiceName: draft.invoiceName ?? "",
        invoiceSize: draft.invoiceSize ?? 0,
        reason: draft.reason ?? "",
        note: draft.note ?? "",
        price: draft.price ?? "",
        newPrice: draft.newPrice ?? "",
        phone: draft.phone ?? "",
        city: draft.city ?? "",
        telegram: draft.telegram ?? "",
      });
      setPhotos(draft.photos ?? []);
      if (draft.videoUrl) {
        setVideoUrl(draft.videoUrl);
        setVideoName(draft.videoName ?? "video");
        setVideoDuration(draft.videoDuration ?? 12);
      }
    }
    setReadyDraft(true);
  }, []);

  useEffect(() => {
    const video = liveRef.current;
    const stream = streamRef.current;
    if (!recording || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
  }, [recording]);

  useEffect(() => {
    if (!readyDraft || !profile) return;
    setForm((prev) => ({
      ...prev,
      phone: prev.phone || (profile.phone ? formatPhoneDisplay(profile.phone) : ""),
      city: prev.city || profile.city || "",
      telegram: prev.telegram || (profile.telegramUsername ? `@${profile.telegramUsername.replace(/^@/, "")}` : ""),
    }));
  }, [profile, readyDraft]);

  const price = money(form.price);
  const newPrice = money(form.newPrice);
  const discount = newPrice > price && price > 0 ? Math.round((1 - price / newPrice) * 100) : 0;
  const expiry = form.month && form.year ? `${form.month}/${form.year}` : "";
  const holati = HOLATI.find((item) => item.id === form.holati);
  const qty = Number(form.qty);
  const cover = photos[0]?.dataUrl || "";

  const checks = useMemo(
    () => ({
      photos: photos.length >= 3,
      video: Boolean(videoUrl) && videoDuration >= 10 && videoDuration <= 30,
      expiry: Boolean(expiry),
      origin: Boolean(form.source),
    }),
    [expiry, form.source, photos.length, videoDuration, videoUrl],
  );

  const sections = {
    mahsulot: form.name.trim().length >= 2 && Boolean(form.category) && qty >= 1 && Boolean(form.unit) && Boolean(expiry) && Boolean(form.holati),
    kelib: Boolean(form.source) && Boolean(form.reason),
    media: checks.photos && checks.video,
    narx: price > 0 && phoneOk(form.phone) && form.city.trim().length >= 2,
  };
  const valid = sections.mahsulot && sections.kelib && sections.media && sections.narx;
  const doneRatio = [sections.mahsulot, sections.kelib, sections.media, sections.narx].filter(Boolean).length / 3;

  function show(key: string) {
    return (attempted || errors[key]) && errors[key] ? errors[key] : "";
  }

  function collectErrors(): Errors {
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Mahsulot nomini kiriting.";
    if (!form.category) next.category = "Kategoriyani tanlang.";
    if (!qty || qty < 1) next.qty = "Miqdorni kiriting.";
    if (!form.month || !form.year) next.expiry = "Yaroqlilik oy va yilini tanlang.";
    if (!form.holati) next.holati = "Holatni tanlang.";
    if (!form.source) next.source = "Qayerdan olinganini tanlang.";
    if (!form.reason) next.reason = "Sababni tanlang.";
    if (form.note.length > 200) next.note = "Izoh 200 belgidan oshmasin.";
    if (photos.length < 3) next.photos = "Kamida 3 ta rasm yuklang (eng ko‘pi 10 ta).";
    if (!videoUrl) next.video = "Mahsulot videosini yuklang yoki kamera bilan yozing.";
    else if (videoDuration < 10 || videoDuration > 30) next.video = "Video 10–30 soniya bo‘lishi kerak.";
    if (price <= 0) next.price = "Sotuv narxini kiriting.";
    if (form.newPrice && newPrice <= 0) next.newPrice = "Yangi narxni raqam bilan kiriting yoki bo‘sh qoldiring.";
    if (!phoneOk(form.phone)) next.phone = "Telefon raqamini to‘liq kiriting (kamida 9 raqam).";
    if (form.city.trim().length < 2) next.city = "Shaharni tanlang.";
    return next;
  }

  async function addPhotos(files: File[]) {
    const room = 10 - photos.length;
    if (room <= 0) {
      setErrors((prev) => ({ ...prev, photos: "Eng ko‘pi 10 ta rasm." }));
      return;
    }
    const next: Photo[] = [];
    for (const file of files.slice(0, room)) {
      try {
        const prepared = await prepareImage(file, 1200, 0.82);
        const dataUrl = await blobToDataUrl(prepared.blob);
        next.push({ id: prepared.id, name: file.name, dataUrl });
      } catch (error) {
        setErrors((prev) => ({ ...prev, photos: error instanceof Error ? error.message : "Rasm yuklanmadi." }));
      }
    }
    if (next.length) {
      setPhotos((prev) => [...prev, ...next].slice(0, 10));
      setErrors((prev) => ({ ...prev, photos: "" }));
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const files = [...event.dataTransfer.files];
    void addPhotos(files);
  }

  function movePhoto(index: number, dir: -1 | 1) {
    setPhotos((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }

  async function acceptVideo(file: File) {
    setCameraNote("");
    if (!file.type.startsWith("video/")) {
      setErrors((prev) => ({ ...prev, video: "Faqat video fayl tanlang." }));
      return;
    }
    if (file.size > MAX_VIDEO) {
      setErrors((prev) => ({ ...prev, video: "Video 100 MB dan oshmasin." }));
      return;
    }
    try {
      const duration = await probeDuration(file);
      if (!Number.isFinite(duration) || duration < 10 || duration > 30) {
        setErrors((prev) => ({ ...prev, video: "Video 10–30 soniya bo‘lishi kerak." }));
        setVideoUrl("");
        setVideoDuration(0);
        return;
      }
      const dataUrl = file.size < 2_200_000 ? await blobToDataUrl(file) : URL.createObjectURL(file);
      setVideoUrl(dataUrl);
      setVideoName(file.name || "video");
      setVideoDuration(duration);
      setErrors((prev) => ({ ...prev, video: "" }));
    } catch (error) {
      setErrors((prev) => ({ ...prev, video: error instanceof Error ? error.message : "Video o‘qilmadi." }));
    }
  }

  async function startCamera() {
    setCameraNote("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setCameraNote("Kamera topilmadi. Video fayl yuklang.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (liveRef.current) liveRef.current.srcObject = null;
        const blob = new Blob(chunks, { type: rec.mimeType || "video/webm" });
        const file = new File([blob], "kamera.webm", { type: blob.type || "video/webm" });
        void acceptVideo(file);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      window.setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state === "recording") stopCamera();
      }, 30_000);
    } catch {
      setCameraNote("Kameraga ruxsat berilmadi. Video fayl yuklang.");
    }
  }

  function stopCamera() {
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  function draftPayload(): SurplusDraft {
    return { ...form, photos, videoName, videoUrl, videoDuration };
  }

  function saveDraft() {
    const keptVideo = writeDraft(draftPayload());
    setSavedNote(keptVideo || !videoUrl ? "Qoralama saqlandi." : "Qoralama saqlandi. Video hajmi katta — qaytganingizda qayta yuklang.");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next = collectErrors();
    setErrors(next);
    setAttempted(true);
    setFormError("");
    if (Object.keys(next).some((key) => next[key])) {
      window.setTimeout(() => {
        document.querySelector<HTMLElement>(".sp-err")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 40);
      return;
    }
    if (busy) return;
    setBusy(true);
    const listing = toListing();
    const posted = await tryServer(listing);
    if (!posted) publishLocal(listing);
    clearDraft();
    setBusy(false);
    router.push("/ortiqcha-material/elonlarim");
  }

  function toListing(): SurplusListing {
    const category = (form.category || "kompozit") as SurplusCategory;
    const note = [form.reason, form.note.trim() || "Shaxsiy klinika ortiqchasi."].filter(Boolean).join(". ");
    const description = [
      `Miqdor: ${qty} ${form.unit}`,
      `Qayerdan: ${form.source}${form.shopName.trim() ? ` (${form.shopName.trim()})` : ""}`,
      form.invoiceName ? `Chek: ${form.invoiceName}` : "",
      `Sabab: ${form.reason}`,
      form.note.trim() ? `Izoh: ${form.note.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return {
      id: `local-${Date.now().toString(36)}`,
      name: form.name.trim(),
      brand: form.brand.trim(),
      category,
      productCategory: categoryToProductCategory(category),
      price,
      newPrice: newPrice > price ? newPrice : price,
      status: holati?.pkg ?? "yopiq",
      expiryMonths: monthsAhead(form.month, form.year),
      expiry,
      condition: holati?.condition ?? "yangi",
      city: form.city.trim(),
      seller: profile?.fullName ? `Siz · ${profile.fullName}` : "Siz",
      verified: false,
      mine: true,
      updatedLabel: "hozir",
      image: cover || placeholderImage(category),
      hasPhoto: Boolean(cover),
      images: photos.slice(1).map((photo) => photo.dataUrl),
      video: videoUrl || undefined,
      description,
      phone: form.phone.trim(),
      telegram: form.telegram.trim() || undefined,
      note,
      createdAt: new Date().toISOString(),
      active: false,
      modStatus: "pending",
      qty,
      unit: form.unit,
      holatiLabel: holati?.label,
      localDemo: true,
    };
  }

  async function tryServer(listing: SurplusListing) {
    if (!authed) return false;
    try {
      const urls: string[] = [];
      for (const photo of photos.slice(0, 8)) {
        const blob = await (await fetch(photo.dataUrl)).blob();
        const url = await uploadImage(blob, "listing");
        if (!url.startsWith("http")) return false;
        urls.push(url);
      }
      const result = await publish({
        name: listing.name,
        brand: listing.brand || "Boshqa",
        category: listing.category,
        pkg: listing.status,
        expiryMonths: String(listing.expiryMonths),
        price: String(listing.price),
        newPrice: newPrice > price ? String(newPrice) : "",
        city: listing.city,
        district: "",
        phone: listing.phone,
        telegram: listing.telegram ?? "",
        image: urls[0] ?? "",
        images: urls.slice(1),
        video: "",
        note: listing.note,
        description: listing.description,
        address: "",
        lat: null,
        lng: null,
      });
      return result.ok;
    } catch {
      return false;
    }
  }

  const previewSrc = cover || placeholderImage((form.category || "kompozit") as SurplusCategory);

  return (
    <form className={mobile ? "sh sp-mobile" : undefined} onSubmit={submit} data-testid="surplus-post" noValidate>
      <div className="sp-post">
        <nav className="sp-crumbs" aria-label="Breadcrumb">
          <Link href="/ortiqcha-material">Ortiqcha material</Link>
          <span>/</span>
          <span>E’lon berish</span>
        </nav>
        <h1>Ortiqcha material sotish</h1>
        <p className="sp-lead">Ishlatilmagan yoki ortiqcha qolgan materialni boshqa stomatologlarga soting. E’lon moderatsiyadan so‘ng katalogda ko‘rinadi.</p>

        <div className="sp-steps" aria-label="Bosqichlar" style={{ ["--done" as string]: String(Math.min(1, doneRatio)) }}>
          {(
            [
              ["mahsulot", "Mahsulot", sections.mahsulot],
              ["kelib", "Kelib chiqishi", sections.kelib],
              ["media", "Rasm va video", sections.media],
              ["narx", "Narx va aloqa", sections.narx],
            ] as const
          ).map(([id, label, done], index, list) => {
            const active = !done && list.slice(0, index).every((step) => step[2]);
            return (
              <button
                key={id}
                type="button"
                className={`sp-step${done ? " done" : ""}${active ? " on" : ""}`}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                <span className="n">{done ? <Check size={14} strokeWidth={3} /> : index + 1}</span>
                <span className="label">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="sp-layout">
          <div className="sp-main">
            <section className="sp-card" id="mahsulot">
              <h2><Package size={18} /> Mahsulot ma’lumotlari</h2>
              <div className="sp-grid">
                <div className={`sp-field wide${show("name") ? " is-bad" : ""}`}>
                  <label htmlFor="sp-name">Mahsulot nomi <span className="sp-req">*</span></label>
                  <input id="sp-name" value={form.name} maxLength={100} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Masalan, Filtek Z350 XT A2" />
                  {show("name") ? <span className="sp-err" role="alert">{show("name")}</span> : null}
                </div>
                <div className={`sp-field${show("category") ? " is-bad" : ""}`}>
                  <label htmlFor="sp-cat">Kategoriya <span className="sp-req">*</span></label>
                  <select id="sp-cat" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    <option value="">Tanlang</option>
                    {surplusCategories.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                  {show("category") ? <span className="sp-err" role="alert">{show("category")}</span> : null}
                </div>
                <div className="sp-field">
                  <label htmlFor="sp-brand">Brend</label>
                  <input id="sp-brand" list="sp-brands" value={form.brand} maxLength={60} onChange={(event) => setForm({ ...form, brand: event.target.value })} placeholder="Brend yoki o‘zingiz yozing" />
                  <datalist id="sp-brands">
                    {surplusPopularBrands.map((brand) => (
                      <option key={brand} value={brand} />
                    ))}
                  </datalist>
                </div>
                <div className={`sp-field${show("qty") ? " is-bad" : ""}`}>
                  <label htmlFor="sp-qty">Miqdori <span className="sp-req">*</span></label>
                  <div className="sp-split">
                    <input id="sp-qty" inputMode="numeric" value={form.qty} onChange={(event) => setForm({ ...form, qty: event.target.value.replace(/[^\d]/g, "") })} placeholder="3" />
                    <select aria-label="Birlik" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}>
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  {show("qty") ? <span className="sp-err" role="alert">{show("qty")}</span> : null}
                </div>
                <div className={`sp-field${show("expiry") ? " is-bad" : ""}`}>
                  <span className="sp-label">Yaroqlilik muddati <span className="sp-req">*</span></span>
                  <div className="sp-split">
                    <select aria-label="Oy" value={form.month} onChange={(event) => setForm({ ...form, month: event.target.value })}>
                      <option value="">Oy</option>
                      {MONTHS.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <select aria-label="Yil" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })}>
                      <option value="">Yil</option>
                      {YEARS.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  {show("expiry") ? <span className="sp-err" role="alert">{show("expiry")}</span> : null}
                </div>
                <div className="sp-field wide">
                  <span className="sp-label">Holati <span className="sp-req">*</span></span>
                  <div className="sp-chips" role="group" aria-label="Holati">
                    {HOLATI.map((item) => (
                      <button key={item.id} type="button" className={`sp-chip${form.holati === item.id ? " on" : ""}`} onClick={() => setForm({ ...form, holati: item.id })}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {show("holati") ? <span className="sp-err" role="alert">{show("holati")}</span> : null}
                </div>
              </div>
            </section>

            <section className="sp-card" id="kelib">
              <h2><MapPin size={18} /> Kelib chiqishi va sabab</h2>
              <div className="sp-field">
                <span className="sp-label">Qayerdan olingan? <span className="sp-req">*</span></span>
                <div className="sp-chips">
                  {SOURCES.map((item) => (
                    <button key={item} type="button" className={`sp-chip${form.source === item ? " on" : ""}`} onClick={() => setForm({ ...form, source: item })}>
                      {item}
                    </button>
                  ))}
                </div>
                {show("source") ? <span className="sp-err" role="alert">{show("source")}</span> : null}
              </div>
              <div className="sp-field" style={{ marginTop: 12 }}>
                <label htmlFor="sp-shop">Sotuvchi / do‘kon nomi</label>
                <input id="sp-shop" value={form.shopName} maxLength={80} onChange={(event) => setForm({ ...form, shopName: event.target.value })} placeholder="Ixtiyoriy" />
              </div>
              <div className="sp-field" style={{ marginTop: 12 }}>
                <span className="sp-label">Chek yoki faktura</span>
                <div className="sp-invoice">
                  <FileUp size={18} />
                  <div>
                    <strong>Chek yoki fakturani yuklang</strong>
                    <span>Ixtiyoriy · PDF yoki rasm</span>
                  </div>
                  <button type="button" className="sp-outline" onClick={() => invoiceRef.current?.click()}><FileUp size={15} /> Fayl tanlash</button>
                </div>
                {form.invoiceName ? (
                  <div className="sp-filechip">
                    <FileUp size={16} />
                    <div>
                      <b>{form.invoiceName}</b>
                      <span>{form.invoiceSize ? fileSize(form.invoiceSize) : "Fayl tanlandi"}</span>
                    </div>
                    <button type="button" className="sp-icon" aria-label="Faylni olib tashlash" onClick={() => setForm({ ...form, invoiceName: "", invoiceSize: 0 })}><X size={14} /></button>
                  </div>
                ) : null}
                <input
                  ref={invoiceRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) setForm({ ...form, invoiceName: file.name, invoiceSize: file.size });
                  }}
                />
              </div>
              <div className="sp-field" style={{ marginTop: 14 }}>
                <span className="sp-label">Nima sababdan sotyapsiz? <span className="sp-req">*</span></span>
                <div className="sp-chips">
                  {REASONS.map((item) => (
                    <button key={item} type="button" className={`sp-chip${form.reason === item ? " on" : ""}`} onClick={() => setForm({ ...form, reason: item })}>
                      {item}
                    </button>
                  ))}
                </div>
                {show("reason") ? <span className="sp-err" role="alert">{show("reason")}</span> : null}
              </div>
              <div className={`sp-field${show("note") ? " is-bad" : ""}`} style={{ marginTop: 12 }}>
                <label htmlFor="sp-note">Qo‘shimcha izoh</label>
                <textarea id="sp-note" maxLength={200} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value.slice(0, 200) })} placeholder="Qayerda saqlangan, nima uchun ortiqcha qolgan" />
                <div className="sp-count">{form.note.length}/200</div>
                {show("note") ? <span className="sp-err" role="alert">{show("note")}</span> : null}
              </div>
            </section>

            <section className="sp-card" id="media">
              <h2><Camera size={18} /> Rasm va video</h2>
              <div
                className={`sp-drop${dragOver ? " over" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <strong>Rasmlarni shu yerga tashlang</strong>
                <span>Birinchi rasm muqova bo‘ladi. Kamida 3, eng ko‘pi 10 ta.</span>
                <div>
                  <button type="button" className="sp-outline" onClick={() => photoRef.current?.click()}><ImagePlus size={16} /> Rasm tanlash</button>
                </div>
                <input
                  ref={photoRef}
                  data-testid="photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(event) => {
                    const files = [...(event.target.files ?? [])];
                    event.target.value = "";
                    void addPhotos(files);
                  }}
                />
              </div>
              {photos.length ? (
                <div className="sp-thumbs">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="sp-thumb"
                      draggable
                      onDragStart={() => setDragFrom(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (dragFrom === null || dragFrom === index) return;
                        setPhotos((prev) => {
                          const copy = [...prev];
                          const [item] = copy.splice(dragFrom, 1);
                          copy.splice(index, 0, item);
                          return copy;
                        });
                        setDragFrom(null);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.dataUrl} alt="" />
                      {index === 0 ? <span className="sp-cover">Muqova</span> : null}
                      <button type="button" className="sp-x" aria-label="Rasmni olib tashlash" onClick={() => setPhotos((prev) => prev.filter((item) => item.id !== photo.id))}><X size={12} /></button>
                      <div className="tools">
                        <button type="button" className="sp-move" aria-label="Oldinga" onClick={() => movePhoto(index, -1)}><ChevronLeft size={14} /></button>
                        <button type="button" className="sp-move" aria-label="Keyinga" onClick={() => movePhoto(index, 1)}><ChevronRight size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {show("photos") ? <span className="sp-err" role="alert">{show("photos")}</span> : null}

              <div className="sp-video-head">
                <h3 style={{ margin: 0 }}>Mahsulot videosi</h3>
                <span className="sp-badge-req">Majburiy</span>
              </div>
              <p className="sp-hint" style={{ marginTop: 0 }}>Mahsulotni qo‘lda ushlab video oling. Qadoq, partiya raqami va yaroqlilik muddati ko‘rinsin, 10–30 soniya.</p>
              <div className="sp-video-box" data-testid="video-stage">
                {recording ? (
                  <video ref={liveRef} className="live" muted playsInline />
                ) : videoUrl ? (
                  <video src={videoUrl} controls playsInline />
                ) : (
                  <VideoPlaceholder />
                )}
              </div>
              <div className="sp-video-actions">
                <button type="button" className="sp-video" onClick={() => videoRef.current?.click()}><Upload size={16} /> Video yuklash</button>
                {recording ? (
                  <button type="button" className="sp-outline" onClick={stopCamera}>Yozishni to‘xtatish</button>
                ) : (
                  <button type="button" className="sp-outline" data-testid="camera-btn" onClick={() => void startCamera()}><Camera size={16} /> Kamera bilan yozish</button>
                )}
              </div>
              {videoUrl && !recording ? (
                <button
                  type="button"
                  className="sp-outline sp-remove"
                  onClick={() => {
                    setVideoUrl("");
                    setVideoName("");
                    setVideoDuration(0);
                  }}
                >
                  <X size={15} /> Videoni olib tashlash
                </button>
              ) : null}
              <input
                ref={videoRef}
                data-testid="video-input"
                type="file"
                accept="video/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void acceptVideo(file);
                }}
              />
              {videoName ? <p className="sp-hint">{videoName} · {Math.round(videoDuration)} s</p> : null}
              {cameraNote ? <p className="sp-hint">{cameraNote}</p> : null}
              {show("video") ? <span className="sp-err" role="alert">{show("video")}</span> : null}
            </section>
          </div>

          <aside className="sp-side" id="narx">
            <section className="sp-card">
              <h2><Eye size={18} /> E’lon ko‘rinishi</h2>
              <p className="sp-preview-note">Katalogdagi karta shu ko‘rinishda chiqadi.</p>
              <article className="sp-preview" data-testid="listing-preview">
                <div className="ph">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewSrc} alt="" />
                  ) : (
                    <span className="sp-ph-empty">Muqova rasmi</span>
                  )}
                  {holati ? <span className="sp-pill">{holati.label}</span> : null}
                  {checks.video ? <span className="sp-pill video">Video tasdiqlangan</span> : null}
                </div>
                <div className="brand">{form.brand.trim() || "Brend"}</div>
                <h3>{form.name.trim() || "Mahsulot nomi"}</h3>
                <div className="sp-meta-row">
                  {qty >= 1 ? <span>{qty} {form.unit}</span> : null}
                  {expiry ? <span>Yaroqlilik: {expiry}</span> : null}
                </div>
                <div className="price">
                  <strong>{price > 0 ? som(price) : "Narx"}</strong>
                  {newPrice > price ? <s>{som(newPrice)}</s> : null}
                </div>
              </article>
            </section>

            <section className="sp-card">
              <h2><Tag size={18} /> Narx</h2>
              <div className={`sp-field${show("price") ? " is-bad" : ""}`}>
                <label htmlFor="sp-price">Sotuv narxi <span className="sp-req">*</span></label>
                <input id="sp-price" inputMode="numeric" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value.replace(/[^\d]/g, "") })} placeholder="450000" />
                {show("price") ? <span className="sp-err" role="alert">{show("price")}</span> : null}
              </div>
              <div className={`sp-field${show("newPrice") ? " is-bad" : ""}`} style={{ marginTop: 10 }}>
                <label htmlFor="sp-new">Yangi narxi (avvalgi)</label>
                <input id="sp-new" inputMode="numeric" value={form.newPrice} onChange={(event) => setForm({ ...form, newPrice: event.target.value.replace(/[^\d]/g, "") })} placeholder="550000" />
                {show("newPrice") ? <span className="sp-err" role="alert">{show("newPrice")}</span> : null}
                {discount > 0 ? <p className="sp-discount">{discount}% chegirma — tejamkor ko‘rinish</p> : <p className="sp-hint">Yangi narx sotuv narxidan baland bo‘lsa, chegirma o‘zi chiqadi.</p>}
              </div>
              <div className={`sp-field${show("phone") ? " is-bad" : ""}`} style={{ marginTop: 10 }}>
                <label htmlFor="sp-phone">Telefon <span className="sp-req">*</span></label>
                <input id="sp-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+998 90 123 45 67" />
                {show("phone") ? <span className="sp-err" role="alert">{show("phone")}</span> : null}
              </div>
              <div className={`sp-field${show("city") ? " is-bad" : ""}`} style={{ marginTop: 10 }}>
                <label htmlFor="sp-city">Shahar <span className="sp-req">*</span></label>
                <select id="sp-city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}>
                  <option value="">Shaharni tanlang</option>
                  {form.city && !surplusCities.includes(form.city as (typeof surplusCities)[number]) ? <option value={form.city}>{form.city}</option> : null}
                  {surplusCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {show("city") ? <span className="sp-err" role="alert">{show("city")}</span> : null}
              </div>
              <div className="sp-field" style={{ marginTop: 10 }}>
                <label htmlFor="sp-tg">Telegram</label>
                <input id="sp-tg" value={form.telegram} onChange={(event) => setForm({ ...form, telegram: event.target.value })} placeholder="@username" />
              </div>
            </section>

            <section className="sp-card">
              <h2><ClipboardList size={18} /> E’lon talablari</h2>
              <ul className="sp-check">
                <CheckRow ok={checks.photos} text="Kamida 3 ta rasm" />
                <CheckRow ok={checks.video} text="Video qo‘lda yuklangan" />
                <CheckRow ok={checks.expiry} text="Yaroqlilik muddati ko‘rsatilgan" />
                <CheckRow ok={checks.origin} text="Kelib chiqishi tasdiqlangan" />
              </ul>
              {formError ? <p className="sp-err" role="alert">{formError}</p> : null}
              <button type="submit" className={`sp-primary${valid ? "" : " is-disabled"}`} aria-disabled={!valid} data-testid="post-submit" disabled={busy}>
                <Send size={16} /> {busy ? "Yuborilmoqda…" : "E’lonni joylash"}
              </button>
              <button type="button" className="sp-ghost" data-testid="post-draft" onClick={saveDraft}>Qoralama saqlash</button>
              {savedNote ? <p className="sp-saved">{savedNote}</p> : null}
            </section>
          </aside>
        </div>
      </div>
    </form>
  );
}

function CheckRow({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={ok ? "on" : ""}>
      <span className="dot">{ok ? <Check size={12} strokeWidth={3} /> : <Circle size={12} />}</span>
      {text}
    </li>
  );
}

function VideoPlaceholder() {
  return (
    <svg width="220" height="140" viewBox="0 0 220 140" aria-hidden="true">
      <rect x="78" y="18" width="64" height="104" rx="10" fill="#e7f4f8" stroke="#1497a8" strokeWidth="2" />
      <rect x="86" y="28" width="48" height="72" rx="4" fill="#fff" />
      <circle cx="110" cy="110" r="4" fill="#1497a8" />
      <path d="M48 96c8-28 22-46 40-46" fill="none" stroke="#8b9bb0" strokeWidth="6" strokeLinecap="round" />
      <path d="M36 78c2 8 6 14 12 18" fill="none" stroke="#c5d0dc" strokeWidth="6" strokeLinecap="round" />
      <rect x="148" y="46" width="36" height="24" rx="6" fill="#ef3b3b" />
      <path d="M160 52l10 6-10 6z" fill="#fff" />
    </svg>
  );
}
