"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { inputCls } from "@/components/work-ui";
import { labPriceCats, type LabPriceCat } from "@/data/labs";
import { prepareImage, uploadImage } from "@/lib/image-upload";

export type PriceRowDraft = { id: string; title: string; cat: LabPriceCat; tags: string; price: string; daysMin: string; daysMax: string; photo: string };

export function newPriceRow(): PriceRowDraft {
  return { id: Math.random().toString(36).slice(2, 10), title: "", cat: "sirkon", tags: "", price: "", daysMin: "", daysMax: "", photo: "" };
}

/** Owner-side editor for the lab price list (≤30 rows). Empty price = "Narx kelishiladi". */
export function LabPriceEditor({ rows, onChange, error }: { rows: PriceRowDraft[]; onChange: (rows: PriceRowDraft[]) => void; error?: string }) {
  const set = (i: number, patch: Partial<PriceRowDraft>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div data-testid="lab-price-editor">
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={r.id} className="rounded-2xl border border-[#e6ebf3] bg-[#fbfcfe] p-3">
            <div className="flex items-start gap-2.5">
              <RowPhoto value={r.photo} onChange={(photo) => set(i, { photo })} />
              <div className="min-w-0 flex-1 space-y-2">
                <input className={inputCls} value={r.title} onChange={(e) => set(i, { title: e.target.value })} maxLength={80} placeholder="Xizmat nomi, masalan Sirkon koronka" aria-label="Xizmat nomi" />
                <div className="grid grid-cols-2 gap-2">
                  <select className={inputCls} value={r.cat} onChange={(e) => set(i, { cat: e.target.value as LabPriceCat })} aria-label="Bo‘lim">
                    {labPriceCats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input className={inputCls} value={r.tags} onChange={(e) => set(i, { tags: e.target.value })} maxLength={64} placeholder="Teglar (vergul bilan)" aria-label="Teglar" />
                </div>
                <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
                  <input className={inputCls} inputMode="numeric" value={r.price} onChange={(e) => set(i, { price: e.target.value.replace(/\D/g, "") })} placeholder="Narx (so‘m)" aria-label="Narx" />
                  <input className={inputCls} inputMode="numeric" value={r.daysMin} onChange={(e) => set(i, { daysMin: e.target.value.replace(/\D/g, "").slice(0, 2) })} placeholder="kun dan" aria-label="Muddat (dan)" />
                  <input className={inputCls} inputMode="numeric" value={r.daysMax} onChange={(e) => set(i, { daysMax: e.target.value.replace(/\D/g, "").slice(0, 2) })} placeholder="kun gacha" aria-label="Muddat (gacha)" />
                </div>
              </div>
              <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} className="grid size-9 shrink-0 place-items-center rounded-xl text-[#dc2626]" aria-label="O‘chirish">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {rows.length < 30 ? (
        <button type="button" onClick={() => onChange([...rows, newPriceRow()])} className="mt-2.5 inline-flex h-10 items-center gap-1.5 rounded-xl border border-dashed border-[#9ec0ff] bg-[#f5f9ff] px-3.5 text-[13px] font-semibold text-[#0066FF]">
          <Plus className="size-4" />
          Xizmat qo‘shish
        </button>
      ) : null}
      <p className="mt-1.5 text-[11.5px] text-[#8b93a7]">Narx bo‘sh qolsa “Narx kelishiladi” ko‘rinadi. 30 tagacha xizmat.</p>
      {error ? <p role="alert" className="mt-1 text-[12px] font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

function RowPhoto({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const prepared = await prepareImage(f, 800, 0.85);
      onChange(await uploadImage(prepared.blob, "lab"));
    } catch {
      /* ignore — row photo is optional */
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }
  return (
    <button type="button" onClick={() => (value ? onChange("") : ref.current?.click())} disabled={busy} className="relative grid h-[54px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-[#9ec0ff] bg-[#f5f9ff] text-[#0066FF]" aria-label={value ? "Rasmni olib tashlash" : "Rasm qo‘shish"}>
      {value ? <Image src={value} alt="" fill sizes="72px" className="object-cover" /> : <ImagePlus className="size-5" />}
      {busy ? <span className="absolute inset-0 grid place-items-center bg-white/70 text-[10px]">…</span> : null}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void pick(e.target.files)} />
    </button>
  );
}
