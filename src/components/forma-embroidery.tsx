"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { site } from "@/data/site";
import {
  embroideryTypes,
  makeEmbroideryId,
  saveEmbroidery,
  type EmbroideryItem,
} from "@/lib/embroidery";
import { cn } from "@/lib/utils";

export function EmbroiderySheet({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<{
    clinic: string;
    itemType: EmbroideryItem;
    qty: string;
    phone: string;
    telegram: string;
    logoLater: boolean;
    logoName: string;
  }>({
    clinic: "",
    itemType: "xalat",
    qty: "10",
    phone: "+998 90 000 00 00",
    telegram: site.telegramHandle,
    logoLater: true,
    logoName: "",
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const qty = Number(form.qty);
    if (!form.clinic.trim() || form.phone.replace(/\D/g, "").length < 9 || !qty || qty < 1) {
      setError("Klinika nomi, telefon va miqdor majburiy.");
      return;
    }
    saveEmbroidery({
      id: makeEmbroideryId(),
      clinic: form.clinic.trim(),
      itemType: form.itemType,
      qty,
      phone: form.phone.trim(),
      telegram: form.telegram.trim() || undefined,
      logoLater: form.logoLater || !form.logoName,
      logoName: form.logoName || undefined,
      createdAt: new Date().toISOString(),
      status: "qabul",
    });
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Yopish" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 shadow-2xl lg:inset-auto lg:top-1/2 lg:left-1/2 lg:w-[min(100%-2rem,440px)] lg:max-h-[85vh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:px-5 lg:pt-5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6eaf2] lg:hidden" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[16px] font-bold text-[#1a1d26]">Embroidery buyurtma</p>
            <p className="text-[13px] text-[#8b93a7]">Logotip yoki klinika nomi formaga tikiladi (namuna).</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-[#8b93a7] hover:bg-slate-50"
            aria-label="Yopish"
          >
            <X className="size-4" />
          </button>
        </div>

        {done ? (
          <div className="pb-4 text-center">
            <p className="text-[18px] font-bold text-[#1a1d26]">Buyurtma qabul qilindi</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#4b5568]">
              So‘rov yozildi. Administrator logo va tikish tafsilotini telefon yoki Telegram orqali aniqlaydi.
            </p>
            <Button type="button" className="mt-4 h-11 w-full !rounded-xl" onClick={onClose}>
              Yopish
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 pb-3">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Field label="Klinika nomi">
              <Input
                className="mt-1 h-11"
                value={form.clinic}
                onChange={(event) => setForm({ ...form, clinic: event.target.value })}
                required
                placeholder="Masalan, Nexus Dental"
              />
            </Field>
            <Field label="Mahsulot turi">
              <div className="mt-2 flex gap-2">
                {embroideryTypes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setForm({ ...form, itemType: item.id })}
                    className={cn(
                      "h-10 flex-1 rounded-full text-[13px] font-semibold",
                      form.itemType === item.id
                        ? "bg-[#0F766E] text-white"
                        : "border border-[#e6eaf2] bg-white text-[#4b5568]",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Miqdor">
              <Input
                className="mt-1 h-11"
                inputMode="numeric"
                value={form.qty}
                onChange={(event) => setForm({ ...form, qty: event.target.value })}
                required
              />
            </Field>
            <Field label="Telefon">
              <Input
                className="mt-1 h-11"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                required
              />
            </Field>
            <Field label="Telegram">
              <Input
                className="mt-1 h-11"
                value={form.telegram}
                onChange={(event) => setForm({ ...form, telegram: event.target.value })}
                placeholder="@username"
              />
            </Field>
            <div>
              <p className="text-sm font-medium text-[#4b5568]">Logo</p>
              <label className="mt-2 flex items-center gap-2 text-[13px] text-[#4b5568]">
                <input
                  type="checkbox"
                  checked={form.logoLater}
                  onChange={(event) => setForm({ ...form, logoLater: event.target.checked })}
                />
                Logo keyin
              </label>
              {form.logoLater ? (
                <p className="mt-1 text-[12px] text-[#8b93a7]">Fayl shart emas — keyin Telegram orqali yuborasiz.</p>
              ) : (
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  className="mt-2 h-11"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      logoName: event.target.files?.[0]?.name ?? "",
                    })
                  }
                />
              )}
            </div>
            <Button type="submit" className="h-12 w-full !rounded-2xl">
              Buyurtma yuborish
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="block">
      <span className="text-[#4b5568]">{label}</span>
      {children}
    </Label>
  );
}
