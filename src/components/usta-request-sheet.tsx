"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Image as ImageIcon,
  Info,
  MapPin,
  Plus,
  Send,
  Settings,
  X,
} from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { UstaIcon } from "@/components/usta-icons";
import { useUstaWork } from "@/components/usta-provider";
import { MasterAvatar, VerifiedBadge, placeLine } from "@/components/usta-ui";
import { requestServicesV2, timeRanges, toshkentDistricts, type Master, type RequestServiceV2 } from "@/data/masters";
import { prepareImage, uploadImage, uploadWithTicket } from "@/lib/image-upload";
import { cn } from "@/lib/utils";
import { validateMasterRequest } from "@/lib/work-validate";

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const NOTE_MAX = 500;
const STEPS = ["Ma’lumotlar", "Tafsilotlar", "Foto / Video", "Yuborish"] as const;

type Media = { id: string; url: string; preview: string; video: boolean; duration?: string };

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  return y && m && d ? `${d}-${months[m - 1]}, ${y}` : iso;
}

/** "Xizmat so‘rovi yuborish" — 4-step bottom sheet (mock 3). Submits through POST /api/work/masters/requests (v2 fields). */
export function UstaRequestSheet({ master, onClose, onProfile }: { master: Master; onClose: () => void; onProfile?: () => void }) {
  const { submitRequest } = useUstaWork();
  const { profile, ready } = useDoctorProfile();
  const [services, setServices] = useState<RequestServiceV2[]>([]);
  const [note, setNote] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [timeRange, setTimeRange] = useState("");
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(0);
  const [extra, setExtra] = useState("");
  const [name, setName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const inflight = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const needContact = !profile?.fullName || !profile?.phone;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const districts = master.city === "Toshkent" ? [...toshkentDistricts] : [master.city, ...toshkentDistricts];
  const placeText = district ? (district === master.city ? master.city : `Toshkent, ${district} tumani`) : "";

  const flags = useMemo(() => {
    const s1 = services.length > 0;
    const s2 = note.trim().length >= 10 && Boolean(district) && address.trim().length >= 3 && Boolean(date) && Boolean(timeRange);
    const s3 = s2 && uploading === 0;
    return [s1, s2, s3, done];
  }, [address, date, district, done, note, services.length, timeRange, uploading]);
  const current = flags.findIndex((f) => !f);

  function toggle(id: RequestServiceV2) {
    setServices((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    setErrors((e) => ({ ...e, services: "" }));
  }

  function jump(section: string) {
    document.getElementById(`ureq-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function addFiles(files: FileList | null) {
    const list = [...(files ?? [])].slice(0, MAX_FILES - media.length - uploading);
    if (!list.length) return;
    setErrors((e) => ({ ...e, media: "" }));
    for (const file of list) {
      const video = file.type.startsWith("video/");
      if (file.size > MAX_BYTES) {
        setErrors((e) => ({ ...e, media: `“${file.name}” 10 MB dan katta.` }));
        continue;
      }
      if (video && !["video/mp4", "video/quicktime", "video/webm"].includes(file.type)) {
        setErrors((e) => ({ ...e, media: "Video MP4, MOV yoki WEBM bo‘lsin." }));
        continue;
      }
      setUploading((n) => n + 1);
      try {
        let url: string;
        let preview: string;
        let duration: string | undefined;
        if (video) {
          preview = URL.createObjectURL(file);
          duration = await videoDuration(preview);
          url = await uploadWithTicket("/api/uploads", { purpose: "request" }, file);
        } else {
          const prepared = await prepareImage(file, 1600, 0.85);
          preview = prepared.previewUrl;
          url = await uploadImage(prepared.blob, "request");
        }
        setMedia((cur) => [...cur, { id: `${Date.now()}-${Math.random()}`, url, preview, video, duration }].slice(0, MAX_FILES));
      } catch (e) {
        setErrors((er) => ({ ...er, media: e instanceof Error ? e.message : "Fayl yuklanmadi." }));
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit() {
    if (inflight.current || uploading) return;
    setError("");
    const body = {
      masterId: master.id,
      services,
      note,
      district,
      address,
      clinic: profile?.clinic ?? "",
      name: needContact ? name : profile?.fullName ?? "",
      phone: needContact ? phone : profile?.phone ?? "",
      when: "sana" as const,
      date,
      timeRange,
      media: media.map((m) => m.url),
      extra,
    };
    const check = validateMasterRequest(body);
    setErrors(check.errors);
    const first = ["services", "note", "address", "district", "date", "timeRange", "name", "phone"].find((k) => check.errors[k]);
    if (first) {
      const target = { services: "services", note: "note", address: "address", district: "address", date: "time", timeRange: "time", name: "contact", phone: "contact" }[first];
      jump(target ?? "services");
      return;
    }
    inflight.current = true;
    setBusy(true);
    const res = await submitRequest(body);
    inflight.current = false;
    setBusy(false);
    if (!res.ok) {
      if (res.errors) setErrors(res.errors);
      setError(res.error);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setDone(true);
  }

  const err = (key: string) => (errors[key] ? <p role="alert" className="mt-1.5 text-[12px] font-medium text-[#dc2626]">{errors[key]}</p> : null);

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Xizmat so‘rovi yuborish" data-testid="usta-request-sheet">
      <button type="button" className="absolute inset-0 bg-[#0B1220]/45" aria-label="Yopish" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[94dvh] flex-col overflow-hidden rounded-t-[28px] bg-[#F4F7FC] shadow-2xl lg:inset-auto lg:top-1/2 lg:left-1/2 lg:max-h-[90vh] lg:w-[460px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[28px]">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2.5 pb-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d5dbe7]" />
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e3eeff] text-[#0F766E]">
              <Send className="size-[22px]" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] leading-tight font-bold tracking-tight text-[#0B1220]">Xizmat so‘rovi yuborish</h2>
              <p className="mt-0.5 text-[11.5px] text-[#6b7487]">Ustaga so‘rovingizni yuboring, u tez orada javob beradi.</p>
            </div>
            <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full text-[#1a1d26]" aria-label="Yopish">
              <X className="size-[22px]" />
            </button>
          </div>

          {/* Stepper */}
          <ol className="mt-4 grid grid-cols-4" data-testid="ureq-stepper">
            {STEPS.map((label, i) => {
              const isDone = flags[i] && i !== current;
              const active = i === current || (current === -1 && i === 3);
              return (
                <li key={label} className="relative flex flex-col items-center">
                  {i > 0 ? <span className={cn("absolute top-[13px] right-1/2 h-[2px] w-full", flags[i - 1] ? "bg-[#0F766E]" : "bg-[#dde3ee]")} aria-hidden /> : null}
                  <button
                    type="button"
                    onClick={() => jump(["services", "note", "media", "submit"][i])}
                    className={cn(
                      "relative z-10 grid size-[27px] place-items-center rounded-full text-[12px] font-bold",
                      active ? "bg-[#0F766E] text-white shadow-[0_0_0_4px_rgba(15,118,110,0.15)]" : isDone ? "bg-[#0F766E] text-white" : "bg-[#e6eaf2] text-[#8b93a7]",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {isDone && !active ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </button>
                  <span className={cn("mt-1.5 text-[11px]", active ? "font-semibold text-[#0F766E]" : "text-[#6b7487]")}>{label}</span>
                </li>
              );
            })}
          </ol>

          {error ? <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</p> : null}

          {ready && !profile ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5" data-testid="usta-login-gate">
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[13px] font-semibold text-[#1a1d26]">Yuborish uchun tizimga kiring</span>
                <span className="block truncate text-[11.5px] text-[#8b93a7]">Usta qabul qilgach, telefon raqami ochiladi</span>
              </span>
              <Link href={`/kirish?next=/ustalar/${master.id}`} className="inline-flex h-9 shrink-0 items-center rounded-xl bg-[#0F766E] px-4 text-[13px] font-semibold text-white">
                Kirish
              </Link>
            </div>
          ) : null}

          {done ? (
            <div className="mt-4 rounded-2xl bg-white p-6 text-center" data-testid="usta-request-done">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e7f8ef] text-[#16a34a]">
                <Check className="size-7" strokeWidth={2.5} />
              </span>
              <p className="mt-3 text-[17px] font-bold text-[#0B1220]">So‘rov yuborildi!</p>
              <p className="mt-1 text-[13px] text-[#6b7487]">Usta qabul qilsa, bildirishnoma olasiz va uning telefon raqami ochiladi.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Link href="/ustalar/sorovlarim" className="inline-flex h-11 items-center rounded-xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white">
                  Mening so‘rovlarim
                </Link>
                <button type="button" onClick={onClose} className="inline-flex h-11 items-center rounded-xl border border-[#dbe3f0] bg-white px-5 text-[14px] font-semibold text-[#1a1d26]">
                  Yopish
                </button>
              </div>
            </div>
          ) : null}

          {/* Master mini card */}
          <div className="mt-4 flex items-center gap-3 rounded-[20px] bg-white p-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <MasterAvatar master={master} size={60} dot={false} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[15.5px] font-bold text-[#0B1220]">
                <span className="truncate">{master.name}</span>
                <VerifiedBadge />
              </p>
              <p className="mt-0.5 truncate text-[12.5px] text-[#6b7487]">
                {master.title}
                {master.years > 0 ? ` · ${master.years} yillik tajriba` : ""}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[12.5px] text-[#4b5568]">
                <MapPin className="size-3.5 text-[#0F766E]" />
                {placeLine(master)}
              </p>
            </div>
            {onProfile ? (
              <button type="button" onClick={onProfile} className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-xl bg-[#F0FDFA] px-3 text-[12px] font-semibold text-[#0F766E]">
                Profilni ko‘rish <ChevronRight className="size-3.5" />
              </button>
            ) : (
              <Link href={`/ustalar/${master.id}`} onClick={onClose} className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-xl bg-[#F0FDFA] px-3 text-[12px] font-semibold text-[#0F766E]">
                Profilni ko‘rish <ChevronRight className="size-3.5" />
              </Link>
            )}
          </div>

          {/* Xizmat turi */}
          <section id="ureq-services" className="mt-5 scroll-mt-3">
            <SectionTitle icon={<Settings className="size-[18px]" />} title="Xizmat turi" required right={<span className="text-[11.5px] text-[#0F766E]">Bir nechtasini tanlash mumkin</span>} />
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              {requestServicesV2.map((s) => {
                const on = services.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    aria-pressed={on}
                    className={cn(
                      "relative flex min-h-[84px] flex-col items-start justify-between rounded-2xl border bg-white p-2.5 text-left",
                      on ? "border-[#0F766E] bg-[#F0FDFA] shadow-[0_0_0_1px_#0F766E]" : "border-[#e8edf5]",
                    )}
                  >
                    <span className={cn("grid size-9 place-items-center rounded-xl", on ? "bg-[#dceaff] text-[#0F766E]" : "bg-[#eff4fc] text-[#0F766E]")}>
                      <UstaIcon name={s.id} className="size-[22px]" />
                    </span>
                    <span className="mt-1.5 text-[11px] leading-tight font-semibold text-[#1a1d26]">{s.label}</span>
                    {on ? (
                      <span className="absolute top-2 right-2 grid size-[18px] place-items-center rounded-full bg-[#0F766E] text-white">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {err("services")}
          </section>

          {/* Muammo tavsifi */}
          <section id="ureq-note" className="mt-5 scroll-mt-3">
            <SectionTitle icon={<FileText className="size-[18px]" />} title="Muammo tavsifi" required />
            <div className={cn("mt-2.5 rounded-2xl border bg-white px-3.5 pt-3 pb-2", errors.note ? "border-[#fca5a5]" : "border-[#e8edf5]")}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                placeholder="Uskunadagi muammo, holati va nima qilish kerakligini yozing..."
                rows={3}
                className="w-full resize-none bg-transparent text-[14px] text-[#1a1d26] outline-none placeholder:text-[#9aa3b5]"
                aria-invalid={Boolean(errors.note)}
                data-testid="ureq-note"
              />
              <p className="text-right text-[11.5px] text-[#9aa3b5]">
                {note.length}/{NOTE_MAX}
              </p>
            </div>
            {err("note")}
          </section>

          {/* Manzil */}
          <section id="ureq-address" className="mt-5 scroll-mt-3">
            <SectionTitle icon={<MapPin className="size-[18px]" />} title="Manzil" required />
            <div className="mt-2.5 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white">
              <label className={cn("relative flex h-12 items-center gap-2 bg-[#eef4fd] px-3.5", errors.district && "bg-red-50")}>
                <MapPin className="size-4 shrink-0 fill-[#0F766E] text-[#0F766E]" />
                <span className={cn("min-w-0 flex-1 truncate text-[13.5px]", district ? "font-medium text-[#1a1d26]" : "text-[#8b93a7]")}>{placeText || "Tumanni tanlang"}</span>
                <span className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-[#0F766E]">
                  {district ? "O‘zgartirish" : "Tanlash"} <ChevronRight className="size-3.5" />
                </span>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setErrors((er) => ({ ...er, district: "" }));
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Tuman"
                  data-testid="ureq-district"
                >
                  <option value="">Tumanni tanlang</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d === master.city && master.city !== "Toshkent" ? d : `${d} tumani`}
                    </option>
                  ))}
                </select>
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value.slice(0, 200))}
                placeholder="Aniq manzil (klinika nomi, ko‘cha, mo‘ljal)"
                className="h-12 w-full bg-transparent px-3.5 text-[13.5px] text-[#1a1d26] outline-none placeholder:text-[#9aa3b5]"
                aria-invalid={Boolean(errors.address)}
                data-testid="ureq-address"
              />
            </div>
            {err("district") || err("address")}
          </section>

          {/* Qulay vaqt + Vaqt oralig‘i */}
          <section id="ureq-time" className="mt-5 grid scroll-mt-3 grid-cols-2 gap-3">
            <div>
              <SectionTitle icon={<CalendarDays className="size-[18px]" />} title="Qulay vaqt" required />
              <label className={cn("relative mt-2.5 flex h-12 items-center gap-2 rounded-2xl border bg-white px-3", errors.date ? "border-[#fca5a5]" : "border-[#e8edf5]")}>
                <CalendarDays className="size-4 shrink-0 text-[#4b5568]" />
                <span className={cn("min-w-0 flex-1 truncate text-[13px]", date ? "font-medium text-[#1a1d26]" : "text-[#8b93a7]")}>{date ? prettyDate(date) : "Sana tanlash"}</span>
                <ChevronRight className="size-4 text-[#8b93a7]" />
                <input
                  type="date"
                  min={todayIso()}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setErrors((er) => ({ ...er, date: "" }));
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Sana"
                  data-testid="ureq-date"
                />
              </label>
              {err("date")}
            </div>
            <div>
              <SectionTitle icon={<Clock3 className="size-[18px]" />} title="Vaqt oralig‘i" required />
              <label className={cn("relative mt-2.5 flex h-12 items-center gap-2 rounded-2xl border bg-white px-3", errors.timeRange ? "border-[#fca5a5]" : "border-[#e8edf5]")}>
                <Clock3 className="size-4 shrink-0 text-[#4b5568]" />
                <span className={cn("min-w-0 flex-1 truncate text-[13px]", timeRange ? "font-medium text-[#1a1d26]" : "text-[#8b93a7]")}>{timeRange || "Vaqt tanlash"}</span>
                <ChevronRight className="size-4 text-[#8b93a7]" />
                <select
                  value={timeRange}
                  onChange={(e) => {
                    setTimeRange(e.target.value);
                    setErrors((er) => ({ ...er, timeRange: "" }));
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Vaqt oralig‘i"
                  data-testid="ureq-time"
                >
                  <option value="">Vaqt tanlash</option>
                  {timeRanges.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              {err("timeRange")}
            </div>
          </section>

          {/* Foto / Video */}
          <section id="ureq-media" className="mt-5 scroll-mt-3">
            <SectionTitle icon={<ImageIcon className="size-[18px]" />} title="Foto / Video" optional right={<span className="text-[11px] text-[#6b7487]">Jami 5 tagacha, har biri 10 MB gacha</span>} />
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(e) => void addFiles(e.target.files)}
              data-testid="ureq-files"
            />
            <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {media.length + uploading < MAX_FILES ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex size-[78px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-[#9cc0ff] bg-white text-[#0F766E]"
                >
                  <Plus className="size-6" />
                  <span className="text-[10.5px] font-semibold">Fayl qo‘shish</span>
                </button>
              ) : null}
              {media.map((m) => (
                <span key={m.id} className="relative size-[78px] shrink-0 overflow-hidden rounded-2xl bg-[#e6eaf2]">
                  {m.video ? (
                    <video src={m.preview} muted playsInline preload="metadata" className="size-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.preview} alt="Biriktirilgan rasm" className="size-full object-cover" />
                  )}
                  {m.video ? <span className="absolute right-1.5 bottom-1.5 rounded-md bg-[#0B1220]/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">{m.duration ?? "video"}</span> : null}
                  <button
                    type="button"
                    onClick={() => setMedia((cur) => cur.filter((x) => x.id !== m.id))}
                    className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-md bg-[#0B1220]/80 text-white"
                    aria-label="Faylni olib tashlash"
                  >
                    <X className="size-3" strokeWidth={3} />
                  </button>
                </span>
              ))}
              {Array.from({ length: uploading }).map((_, i) => (
                <span key={`u${i}`} className="grid size-[78px] shrink-0 animate-pulse place-items-center rounded-2xl bg-[#e6eaf2] text-[10.5px] font-semibold text-[#6b7487]">
                  Yuklanmoqda…
                </span>
              ))}
            </div>
            {err("media")}
          </section>

          {/* Qo‘shimcha ma’lumot */}
          <section id="ureq-extra" className="mt-5 scroll-mt-3">
            <SectionTitle icon={<Info className="size-[18px]" />} title="Qo‘shimcha ma’lumot" optional />
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value.slice(0, 500))}
              placeholder="Qo‘shimcha ma’lumot yoki maxsus talablar..."
              rows={2}
              className="mt-2.5 w-full resize-none rounded-2xl border border-[#e8edf5] bg-white px-3.5 py-3 text-[14px] text-[#1a1d26] outline-none placeholder:text-[#9aa3b5]"
              data-testid="ureq-extra"
            />
          </section>

          {needContact && profile ? (
            <section id="ureq-contact" className="mt-5 scroll-mt-3">
              <SectionTitle icon={<Info className="size-[18px]" />} title="Aloqa uchun" required />
              <div className="mt-2.5 grid gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz" className="h-12 rounded-2xl border border-[#e8edf5] bg-white px-3.5 text-[14px] outline-none" />
                {err("name")}
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" inputMode="tel" className="h-12 rounded-2xl border border-[#e8edf5] bg-white px-3.5 text-[14px] outline-none" />
                {err("phone")}
              </div>
            </section>
          ) : null}
        </div>

        <div id="ureq-submit" className="border-t border-[#e8edf5] bg-white px-4 pt-3" style={{ paddingBottom: "max(0.9rem, env(safe-area-inset-bottom))" }}>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || done || !profile || uploading > 0}
            className="flex h-[58px] w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-[#0F766E] to-[#2f86ff] text-white shadow-[0_8px_20px_rgba(15,118,110,0.32)] disabled:opacity-60"
            data-testid="ureq-submit"
          >
            <span className="inline-flex items-center gap-2 text-[16px] font-semibold">
              <Send className="size-[18px]" />
              {busy ? "Yuborilmoqda…" : uploading ? "Fayl yuklanmoqda…" : "So‘rovni yuborish"}
            </span>
            <span className="text-[11.5px] text-white/85">Bepul! · Tez javob olasiz</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, required, optional, right }: { icon: ReactNode; title: string; required?: boolean; optional?: boolean; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#0F766E]">{icon}</span>
      <h3 className="text-[14.5px] font-bold text-[#0B1220]">
        {title}
        {required ? <span className="ml-0.5 text-[#ef4444]">*</span> : null}
        {optional ? <span className="ml-1 text-[12px] font-normal text-[#8b93a7]">(ixtiyoriy)</span> : null}
      </h3>
      {right ? <span className="ml-auto">{right}</span> : null}
    </div>
  );
}

function videoDuration(src: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const s = Math.round(v.duration || 0);
      resolve(Number.isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : undefined);
    };
    v.onerror = () => resolve(undefined);
    v.src = src;
  });
}
