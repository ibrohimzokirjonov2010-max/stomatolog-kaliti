"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, MapPin, Send, Trash2, Upload, X } from "lucide-react";
import { LiveVideoRecorder } from "@/components/forms/LiveVideoRecorder";
import { PublishNote } from "@/components/forms/PublishNote";
import { MapPicker } from "@/components/map-picker";
import { ADD_CITIES } from "@/lib/add-forms";
import { SURPLUS_QTY_UNITS } from "@/lib/forms/p0";
import type { SurplusVideoMeta } from "@/lib/forms/p0";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useSurplusWork } from "@/components/surplus-provider";
import {
  expiryLabel,
  isRemoteImage,
  placeholderImage,
  statusLabel,
  surplusCategories,
  type PackageStatus,
  type SurplusCategory,
  type SurplusListing,
} from "@/data/surplus";
import { prepareImage, uploadImage } from "@/lib/image-upload";
import { cn } from "@/lib/utils";
import { validateContact, validateSurplus, type FieldErrors } from "@/lib/work-validate";
import { Gate } from "@/components/work-ui";

export function ListingImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (isRemoteImage(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
  return <Image src={src} alt={alt} width={480} height={320} className={className} />;
}

function Err({ text }: { text?: string }) {
  return text ? (
    <span role="alert" className="mt-1 block text-[12.5px] font-medium text-[#dc2626]">
      {text}
    </span>
  ) : null;
}

export function PostForm({ listing, onDone, onCancel }: { listing?: SurplusListing; onDone: () => void; onCancel: () => void }) {
  const { publish, authed, ready } = useSurplusWork();
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const profile = useDoctorProfile();
  useEffect(() => {
    if (listing) return;
    const city = profile.profile?.city ?? "";
    const phone = profile.profile?.phone ?? "";
    if (!city && !phone) return;
    setForm((prev) => ({ ...prev, city: prev.city || city, phone: prev.phone || phone }));
  }, [listing, profile.profile?.city, profile.profile?.phone]);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: listing?.name ?? "",
    brand: listing?.brand ?? "",
    category: (listing?.category === "anesteziya" ? "kompozit" : listing?.category ?? "kompozit") as SurplusCategory,
    price: listing ? String(listing.price) : "",
    newPrice: listing && listing.newPrice > listing.price ? String(listing.newPrice) : "",
    pkg: "yopiq" as PackageStatus,
    expiryMonth: "",
    expiryYear: "",
    lot: "",
    qty: "",
    qtyUnit: "dona",
    declaration: false,
    city: listing?.city || profile.profile?.city || "",
    district: listing?.district ?? "",
    note: listing?.note ?? "",
    phone: listing?.phone || profile.profile?.phone || "",
    telegram: listing?.telegram ?? "",
    image: listing?.image && listing.image.startsWith("http") ? listing.image : "",
    images: listing?.images ?? [],
    video: listing?.video ?? "",
    videoMeta: null as SurplusVideoMeta | null,
    description: listing?.description ?? "",
    address: listing?.address ?? "",
    lat: listing?.lat ?? null,
    lng: listing?.lng ?? null,
  });
  const [mapOpen, setMapOpen] = useState(false);

  const preview = form.image.trim() || placeholderImage(form.category);

  if (ready && !authed) {
    return <Gate title="E’lon joylash uchun kiring" text="E’lon berish faqat ro‘yxatdan o‘tgan foydalanuvchilar uchun." next="/ortiqcha-material" />;
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setFormError("");
    try {
      const prepared = await prepareImage(file, 1200, 0.85);
      const url = await uploadImage(prepared.blob, "listing");
      setForm((prev) => ({ ...prev, image: url }));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Rasm yuklanmadi. JPEG/PNG/WebP tanlang.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    const check = validateSurplus(form);
    setErrors(check.errors);
    setFormError("");
    if (Object.keys(check.errors).length) return;
    setBusy(true);
    const result = await publish({ ...form, qty: form.qty, declaration: form.declaration }, listing?.id);
    setBusy(false);
    if (!result.ok) {
      if (result.errors) setErrors(result.errors);
      setFormError(result.error);
      return;
    }
    onDone();
  }

  const set = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));
  const bad = (k: string) => (errors[k] ? true : undefined);

  return (
    <form className="space-y-3.5" onSubmit={submit} noValidate>
      <p className="rounded-xl bg-[#f5f8ff] px-3 py-2.5 text-[12.5px] leading-snug text-[#4b5568]">
        Faqat o‘zingizning ortiqcha material — dilerlik va ulgurji tovarlar taqiqlanadi. E’lon admin tasdiqlagach hamma uchun ko‘rinadi; telefon raqamingiz ochiq e’lon qilinmaydi.
      </p>

      <div className="grid grid-cols-[96px_1fr] gap-3 sm:grid-cols-[112px_1fr]">
        <div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-[#eceff5] bg-[#f7f9fc]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="size-full object-contain p-1.5" />
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} data-testid="surplus-photo-input" />
          <Button type="button" variant="outline" className="mt-2 h-9 w-full !rounded-lg px-1 text-[11px]" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "Yuklanmoqda…" : (<><Upload className="size-3.5" />Rasm yuklash</>)}
          </Button>
          {form.image ? (
            <button type="button" className="mt-1.5 flex w-full items-center justify-center gap-1 text-[11px] text-[#8b93a7] hover:text-[#1a1d26]" onClick={() => set({ image: "" })}>
              <Trash2 className="size-3" />
              Olib tashlash
            </button>
          ) : (
            <p className="mt-1.5 text-center text-[10px] text-[#8b93a7]">
              <ImagePlus className="mr-0.5 inline size-3" />
              Ixtiyoriy
            </p>
          )}
          <Err text={errors.image} />
        </div>

        <div className="space-y-3">
          <Field label="Mahsulot *" requiredMark>
            <Input className="mt-1 h-10" aria-invalid={bad("name")} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Masalan: Filtek Z350 XT" />
            <Err text={errors.name} />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Brend">
              <Input className="mt-1 h-10" aria-invalid={bad("brand")} value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="3M" />
              <Err text={errors.brand} />
            </Field>
            <Field label="Kategoriya">
              <select className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-2.5 text-sm" value={form.category} onChange={(e) => set({ category: e.target.value as SurplusCategory })}>
                {surplusCategories.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              <Err text={errors.category} />
            </Field>
          </div>
        </div>
      </div>

      <p className="text-[13px] font-semibold text-[#0F766E]" data-testid="surplus-step">{step}/3 · {step === 1 ? "Mahsulot" : step === 2 ? "Jonli video" : "Narx va joylash"}</p>
      <p className="text-[12px] text-[#6b7280]">~3 daqiqa. Ochilgan yoki muddati yaqin material, anestetik va boshqa dorilar qabul qilinmaydi.</p>
      {step === 1 ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Miqdor" requiredMark>
              <Input className="mt-1 h-12 text-base" inputMode="numeric" value={form.qty} onChange={(e) => set({ qty: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="3" />
              <Err text={errors.qty} />
            </Field>
            <Field label="Birlik" requiredMark>
              <select className="mt-1 h-12 w-full rounded-lg border border-input bg-white px-2 text-base" value={form.qtyUnit} onChange={(e) => set({ qtyUnit: e.target.value })}>
                {SURPLUS_QTY_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
              <Err text={errors.qtyUnit} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Yaroqlilik oyi" requiredMark>
              <Input className="mt-1 h-12 text-base" inputMode="numeric" value={form.expiryMonth} onChange={(e) => set({ expiryMonth: e.target.value.replace(/\D/g, "").slice(0, 2) })} placeholder="08" />
              <Err text={errors.expiryMonth} />
            </Field>
            <Field label="Yil" requiredMark>
              <Input className="mt-1 h-12 text-base" inputMode="numeric" value={form.expiryYear} onChange={(e) => set({ expiryYear: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="2027" />
            </Field>
          </div>
          <Field label="LOT / partiya" requiredMark>
            <Input className="mt-1 h-12 text-base" value={form.lot} onChange={(e) => set({ lot: e.target.value.toUpperCase() })} placeholder="N123456" maxLength={30} />
            <Err text={errors.lot} />
          </Field>
          <p className="text-[12px] text-[#6b7280]">Qadoq ochilmagan bo‘lishi shart. Ochilgan steril mahsulot joylanmaydi.</p>
        </>
      ) : null}
      {step === 2 ? <LiveVideoRecorder error={errors.video} onChange={(value) => set({ video: value?.url ?? "", videoMeta: value?.meta ?? null })} /> : null}
      {step === 3 ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Narx" requiredMark>
              <Input className="mt-1 h-12 text-base" inputMode="numeric" aria-invalid={bad("price")} value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder="180000" />
              <Err text={errors.price} />
            </Field>
            <Field label="Asl narx (ixtiyoriy)">
              <Input className="mt-1 h-12 text-base" inputMode="numeric" value={form.newPrice} onChange={(e) => set({ newPrice: e.target.value })} placeholder="250000" />
              <Err text={errors.newPrice} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Shahar" requiredMark>
              <select className="mt-1 h-12 w-full rounded-lg border border-input bg-white px-2 text-base" value={form.city} onChange={(e) => set({ city: e.target.value })}>
                <option value="">Shaharni tanlang</option>
                {ADD_CITIES.map((item) => <option key={item}>{item}</option>)}
              </select>
              <Err text={errors.city} />
            </Field>
            <Field label="Telefon" requiredMark>
              <Input className="mt-1 h-12 text-base" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="90 123 45 67" />
              <Err text={errors.phone} />
            </Field>
          </div>
          <label className="flex items-start gap-2 text-[13px] leading-snug">
            <input type="checkbox" className="mt-1 size-5" checked={form.declaration} onChange={(e) => set({ declaration: e.target.checked })} data-testid="surplus-declaration" />
            <span>Qadoq ochilmagan, material tavsiya etilgan sharoitda saqlangan, muddati to‘g‘ri ko‘rsatilgan. Noto‘g‘ri ma’lumot uchun javobgarlikni o‘z zimmamga olaman.</span>
          </label>
          <Err text={errors.declaration} />
          <Field label="Izoh (ixtiyoriy)">
            <Textarea className="mt-1 min-h-[72px] text-base" value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="Nima uchun ortiqcha qoldi" />
          </Field>
          <PublishNote />
        </>
      ) : null}

      {step === 3 ? <div>
        <Label className="mb-1.5 block">Olib ketish joyi (ixtiyoriy)</Label>
        <div className="flex gap-2">
          <Input className="h-10 flex-1" maxLength={200} value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="Masalan: Yunusobod, Mega Planet yonida" />
          <Button type="button" variant="outline" className="h-10 shrink-0 !rounded-lg px-3 text-[12.5px]" onClick={() => setMapOpen(true)}>
            <MapPin className="size-3.5" />
            {form.lat != null ? "Pin ✓" : "Xarita"}
          </Button>
        </div>
        {form.lat != null ? (
          <button type="button" className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-[#8b93a7] hover:text-[#1a1d26]" onClick={() => set({ lat: null, lng: null })}>
            <X className="size-3" />
            Pinni olib tashlash ({form.lat.toFixed(4)}, {form.lng?.toFixed(4)})
          </button>
        ) : null}
        <p className="mt-1 text-[11px] text-[#8b93a7]">E’londa hamma ko‘radi — uy/xonadon raqamini yozmang, mo‘ljal yetarli.</p>
      </div> : null}
      <MapPicker
        simple
        open={mapOpen}
        city={form.city}
        initial={form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng, address: form.address, district: form.district } : null}
        places={[]}
        onClose={() => setMapOpen(false)}
        onConfirm={(p) => {
          setMapOpen(false);
          if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return;
          set({ lat: p.lat, lng: p.lng, address: form.address.trim() ? form.address : p.address.slice(0, 200), district: form.district || p.district.slice(0, 60) });
        }}
        onSave={async () => null}
        onRemove={() => {}}
      />

      {formError ? <p role="alert" className="text-sm font-medium text-destructive">{formError}</p> : null}
      <div className="sticky bottom-0 flex gap-2 bg-white pt-2">
        {step > 1 ? <Button type="button" variant="outline" className="h-12 !rounded-xl" onClick={() => setStep((value) => value - 1)}>Ortga</Button> : <Button type="button" variant="outline" className="h-12 !rounded-xl" onClick={onCancel}>Bekor</Button>}
        {step < 3 ? (
          <Button type="button" className="h-12 flex-1 !rounded-xl" onClick={() => setStep((value) => value + 1)}>Davom etish</Button>
        ) : (
          <Button type="submit" className="h-12 flex-1 !rounded-xl" disabled={busy || uploading}>{busy ? "Yuborilmoqda…" : "Joylash"}</Button>
        )}
      </div>
    </form>
  );
}

/** Contact request: the owner's phone stays hidden until the owner accepts. */
export function ContactForm({ listing, onClose }: { listing: SurplusListing; onClose: () => void }) {
  const { sendInterest, authed, ready } = useSurplusWork();
  const { profile } = useDoctorProfile();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [name, setName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [message, setMessage] = useState("");

  if (ready && !authed) {
    return <Gate title="Bog‘lanish uchun kiring" text="So‘rov yuborish faqat ro‘yxatdan o‘tgan foydalanuvchilar uchun." next="/ortiqcha-material" />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const check = validateContact({ name, phone, message });
    setErrors(check.errors);
    setFormError("");
    if (Object.keys(check.errors).length) return;
    setBusy(true);
    const res = await sendInterest(listing.id, check.clean);
    setBusy(false);
    if (!res.ok) {
      if (res.errors) setErrors(res.errors);
      setFormError(res.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <p className="text-sm font-semibold text-emerald-700">So‘rov e’lon egasiga yuborildi.</p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Egasi qabul qilsa, telefon raqami ochiladi va sizga bildirishnoma keladi. Uchrashuvdan oldin originalini va muddatini tekshiring.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/ortiqcha-material/elonlarim?tab=yuborgan" className={buttonVariants()}>So‘rovlarim</Link>
          <Button variant="ghost" onClick={onClose}>Yopish</Button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={submit} noValidate>
      <p className="text-[13px] text-muted-foreground">
        {listing.seller} · {listing.city}
        {listing.district ? `, ${listing.district}` : ""} · {statusLabel[listing.status]} · {expiryLabel(listing.expiryMonths)}
      </p>
      <p className="text-sm">{listing.note}</p>
      <Field label="Ismingiz">
        <Input className="mt-1 h-10" aria-invalid={errors.name ? true : undefined} value={name} onChange={(e) => setName(e.target.value)} />
        <Err text={errors.name} />
      </Field>
      <Field label="Telefon raqamingiz">
        <Input className="mt-1 h-10" inputMode="tel" aria-invalid={errors.phone ? true : undefined} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="90 123 45 67" />
        <Err text={errors.phone} />
      </Field>
      <p className="-mt-1.5 text-[11px] text-[#8b93a7]">Raqamingiz faqat e’lon egasiga ko‘rinadi. Egasining raqami u qabul qilgach ochiladi.</p>
      <Field label="Xabar (ixtiyoriy)">
        <Textarea className="mt-1" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Masalan: hali bormi? Qayerdan olib ketsam bo‘ladi?" />
      </Field>
      {formError ? <p role="alert" className="text-sm font-medium text-destructive">{formError}</p> : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={busy}>
          <Send className="size-3.5" />
          {busy ? "Yuborilmoqda…" : "So‘rov yuborish"}
        </Button>
      </div>
    </form>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ortiqcha-modal-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="ortiqcha-modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground">
            Yopish
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  requiredMark,
}: {
  label: string;
  children: ReactNode;
  requiredMark?: boolean;
}) {
  const clean = label.replace(/\s*\*$/, "");
  const showStar = Boolean(requiredMark);
  return (
    <div>
      <Label>
        {clean}
        {showStar ? <span className="text-[#0F766E]"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}

export function sellerLine(listing: SurplusListing) {
  return listing.mine ? `Siz · ${listing.seller}` : listing.seller;
}
