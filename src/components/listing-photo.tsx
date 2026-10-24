"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { prepareImage, uploadImage } from "@/lib/image-upload";

/** Single image picker for user listings (uploads to storage under listings/<uid>/). */
export function ListingPhoto({ value, onChange, label = "Rasm", error }: { value: string; onChange: (url: string) => void; label?: string; error?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(file?: File) {
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const prepared = await prepareImage(file, 1200, 0.85);
      onChange(await uploadImage(prepared.blob, "listing"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Rasm yuklanmadi.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }
  const msg = err || error;
  return (
    <div>
      <p className="text-sm font-medium text-[#4b5568]">{label} <span className="font-normal text-[#8b93a7]">(ixtiyoriy)</span></p>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} data-testid="listing-photo-input" />
      <div className="mt-1.5 flex items-center gap-3">
        {value ? (
          <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-[#f4f6fa]">
            <Image src={value} alt="" fill sizes="80px" className="object-cover" unoptimized />
          </span>
        ) : null}
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-[#CCFBF1] bg-[#f8faff] px-4 text-[13px] font-semibold text-[#0F766E] disabled:opacity-60">
          <ImagePlus className="size-4" />
          {busy ? "Yuklanmoqda…" : value ? "Almashtirish" : "Rasm tanlash"}
        </button>
        {value ? (
          <button type="button" onClick={() => onChange("")} className="inline-flex h-11 items-center gap-1 text-[13px] font-semibold text-[#8b93a7]" aria-label="Rasmni olib tashlash">
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>
      {msg ? <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-[#dc2626]">{msg}</p> : null}
    </div>
  );
}
