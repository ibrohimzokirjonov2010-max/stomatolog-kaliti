"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Play, Video, X } from "lucide-react";
import { prepareImage, uploadImage, uploadWithTicket } from "@/lib/image-upload";

const MAX_PHOTOS = 8;
const MAX_VIDEO = 10 * 1024 * 1024;

/** Vacancy photos (≤8) + one optional short video (≤10 MB). Uploaded to jobs/<uid>/. */
export function JobMediaPicker({
  photos,
  video,
  onPhotos,
  onVideo,
  error,
  purpose = "job",
  max = MAX_PHOTOS,
  allowVideo = true,
  hint,
}: {
  photos: string[];
  video: string;
  onPhotos: (urls: string[]) => void;
  onVideo: (url: string) => void;
  error?: string;
  purpose?: "job" | "lab" | "listing";
  max?: number;
  allowVideo?: boolean;
  hint?: string;
}) {
  const MAX_PHOTOS = max;
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  async function addPhotos(files: FileList | null) {
    const list = [...(files ?? [])].slice(0, MAX_PHOTOS - photos.length);
    if (!list.length) return;
    setErr("");
    setBusy("Rasmlar yuklanmoqda…");
    const added: string[] = [];
    try {
      for (const f of list) {
        const prepared = await prepareImage(f, 1600, 0.85);
        added.push(await uploadImage(prepared.blob, purpose));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Rasm yuklanmadi.");
    } finally {
      if (added.length) onPhotos([...photos, ...added].slice(0, MAX_PHOTOS));
      setBusy("");
      if (photoRef.current) photoRef.current.value = "";
    }
  }

  async function addVideo(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setErr("");
    if (!["video/mp4", "video/quicktime", "video/webm"].includes(f.type)) return setErr("Video MP4, MOV yoki WEBM bo‘lsin.");
    if (f.size > MAX_VIDEO) return setErr("Video 10 MB dan oshmasin.");
    setBusy("Video yuklanmoqda…");
    try {
      onVideo(await uploadWithTicket("/api/uploads", { purpose }, f));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Video yuklanmadi.");
    } finally {
      setBusy("");
      if (videoRef.current) videoRef.current.value = "";
    }
  }

  const msg = err || error;
  return (
    <div data-testid="job-media-picker">
      <div className="flex flex-wrap gap-2">
        {photos.map((src, i) => (
          <span key={src} className="relative size-[68px] overflow-hidden rounded-xl bg-[#eef2f8]">
            <Image src={src} alt={`Rasm ${i + 1}`} fill sizes="68px" className="object-cover" />
            {i === 0 ? <span className="absolute inset-x-0 bottom-0 bg-[#0F766E]/85 py-0.5 text-center text-[9px] font-semibold text-white">Asosiy</span> : null}
            <button type="button" onClick={() => onPhotos(photos.filter((x) => x !== src))} className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-[#0B1220]/70 text-white" aria-label="Olib tashlash">
              <X className="size-3" />
            </button>
          </span>
        ))}
        {video ? (
          <span className="relative grid size-[68px] place-items-center overflow-hidden rounded-xl bg-[#0B1220] text-white">
            <Play className="size-5 fill-current" />
            <span className="absolute bottom-0.5 text-[9px] font-semibold">Video</span>
            <button type="button" onClick={() => onVideo("")} className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-white/25" aria-label="Videoni olib tashlash">
              <X className="size-3" />
            </button>
          </span>
        ) : null}
        {photos.length < MAX_PHOTOS ? (
          <button type="button" onClick={() => photoRef.current?.click()} disabled={Boolean(busy)} className="grid size-[68px] place-items-center rounded-xl border border-dashed border-[#CCFBF1] bg-[#f5f9ff] text-[#0F766E] disabled:opacity-60">
            <span className="grid place-items-center gap-0.5 text-[10px] font-semibold">
              <ImagePlus className="size-5" />
              Rasm
            </span>
          </button>
        ) : null}
        {allowVideo && !video ? (
          <button type="button" onClick={() => videoRef.current?.click()} disabled={Boolean(busy)} className="grid size-[68px] place-items-center rounded-xl border border-dashed border-[#CCFBF1] bg-[#f5f9ff] text-[#0F766E] disabled:opacity-60">
            <span className="grid place-items-center gap-0.5 text-[10px] font-semibold">
              <Video className="size-5" />
              Video
            </span>
          </button>
        ) : null}
      </div>
      <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => void addPhotos(e.target.files)} />
      <input ref={videoRef} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={(e) => void addVideo(e.target.files)} />
      <p className="mt-1.5 text-[11.5px] text-[#8b93a7]">{busy || hint || `Rasmlar ${MAX_PHOTOS} tagacha, video 10 MB gacha (ixtiyoriy). Birinchi rasm kartochkada ko‘rinadi.`}</p>
      {msg ? <p role="alert" className="mt-1 text-[12px] font-medium text-destructive">{msg}</p> : null}
    </div>
  );
}

/** Single logo upload. */
export function JobLogoPicker({ value, onChange, purpose = "job" }: { value: string; onChange: (url: string) => void; purpose?: "job" | "lab" }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setErr("");
    setBusy(true);
    try {
      const prepared = await prepareImage(f, 600, 0.9);
      onChange(await uploadImage(prepared.blob, purpose));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Logo yuklanmadi.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f3f6fb] ring-1 ring-[#e6ebf3]">
        {value ? <Image src={value} alt="Logo" fill sizes="56px" className="object-contain p-1" /> : <ImagePlus className="size-5 text-[#9aa3b5]" />}
      </span>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="h-9 rounded-xl border border-[#dbe3f0] px-3 text-[13px] font-semibold text-[#1a1d26] disabled:opacity-60">
          {busy ? "Yuklanmoqda…" : value ? "Almashtirish" : "Logo yuklash"}
        </button>
        {value ? (
          <button type="button" onClick={() => onChange("")} className="h-9 rounded-xl px-2 text-[13px] text-[#8b93a7]">
            Olib tashlash
          </button>
        ) : null}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void pick(e.target.files)} />
      {err ? <p role="alert" className="text-[12px] text-destructive">{err}</p> : null}
    </div>
  );
}
