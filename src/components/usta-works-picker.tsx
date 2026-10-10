"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { prepareImage, uploadImage } from "@/lib/image-upload";

const MAX = 12;

/** "Bajarilgan ishlar" photos for a master profile (up to 12; uploaded to listings/<uid>/). */
export function WorksPicker({ value, onChange, error }: { value: string[]; onChange: (urls: string[]) => void; error?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(files: FileList | null) {
    const list = [...(files ?? [])].slice(0, MAX - value.length);
    if (!list.length) return;
    setErr("");
    setBusy(true);
    const added: string[] = [];
    try {
      for (const file of list) {
        const prepared = await prepareImage(file, 1400, 0.85);
        added.push(await uploadImage(prepared.blob, "listing"));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Rasm yuklanmadi.");
    } finally {
      if (added.length) onChange([...value, ...added].slice(0, MAX));
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  const msg = err || error;
  return (
    <div>
      <p className="text-sm font-medium text-[#4b5568]">
        Bajarilgan ishlar rasmlari <span className="font-normal text-[#8b93a7]">(ixtiyoriy, {MAX} tagacha)</span>
      </p>
      <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void pick(e.target.files)} data-testid="works-input" />
      <div className="mt-1.5 flex flex-wrap gap-2">
        {value.map((url, i) => (
          <span key={`${url}-${i}`} className="relative size-20 overflow-hidden rounded-xl bg-[#f4f6fa]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Ish rasmi ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-[#0B1220]/75 text-white"
              aria-label="Rasmni olib tashlash"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        {value.length < MAX ? (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="grid size-20 place-items-center rounded-xl border border-dashed border-[#c9d8f5] bg-[#f8faff] text-[11px] font-semibold text-[#0066FF] disabled:opacity-60"
          >
            <span className="flex flex-col items-center gap-1">
              <ImagePlus className="size-5" />
              {busy ? "Yuklanmoqda…" : "Qo‘shish"}
            </span>
          </button>
        ) : null}
      </div>
      {msg ? <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-[#dc2626]">{msg}</p> : null}
    </div>
  );
}
