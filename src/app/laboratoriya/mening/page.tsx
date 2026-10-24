"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data loading effects kick off async fetches */

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { ListingPhoto } from "@/components/listing-photo";
import { Chip, FormField, Gate, ModBanner, inputCls, textareaCls } from "@/components/work-ui";
import { labCities, labMaterialFilters, labServiceFilters } from "@/data/labs";
import type { MyLab } from "@/lib/lab-work";
import { api } from "@/lib/work-client";
import { validateLab } from "@/lib/work-validate";
import { JobLogoPicker, JobMediaPicker } from "@/components/job-media-picker";
import { LabPriceEditor, type PriceRowDraft } from "@/components/lab-price-editor";

const EMPTY = {
  name: "",
  city: "Toshkent",
  services: [] as string[],
  materials: [] as string[],
  description: "",
  days: "",
  priceFrom: "",
  photo: "",
  phone: "",
  telegram: "",
  district: "",
  photos: [] as string[],
  video: "",
  logo: "",
  years: "",
  courier: "" as "" | "ha" | "yoq",
  courierArea: "",
  portfolio: [] as string[],
  priceItems: [] as PriceRowDraft[],
};

function fromLab(l: MyLab): typeof EMPTY {
  return {
    name: l.name,
    city: l.city,
    services: l.services,
    materials: l.materials,
    description: l.description ?? "",
    days: l.days ? String(l.days) : "",
    priceFrom: l.priceFrom ? String(l.priceFrom) : "",
    photo: l.photo ?? "",
    phone: l.phone,
    telegram: l.telegram ?? "",
    district: l.district ?? "",
    photos: l.photos ?? [],
    video: l.video ?? "",
    logo: l.logo ?? "",
    years: l.years != null ? String(l.years) : "",
    courier: l.courier ?? "",
    courierArea: l.courierArea ?? "",
    portfolio: l.portfolio ?? [],
    priceItems: (l.priceItems ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      cat: r.cat,
      tags: r.tags.join(", "),
      price: r.price != null ? String(r.price) : "",
      daysMin: r.daysMin != null ? String(r.daysMin) : "",
      daysMax: r.daysMax != null ? String(r.daysMax) : "",
      photo: r.photo ?? "",
    })),
  };
}

export default function MyLabPage() {
  const { profile, ready } = useDoctorProfile();
  const [state, setState] = useState<"loading" | "ready">("loading");
  const [mine, setMine] = useState<MyLab | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const inflight = useRef(false);
  const [f, setF] = useState(EMPTY);

  useEffect(() => {
    if (!ready) return;
    if (!profile) {
      setState("ready");
      return;
    }
    let alive = true;
    void api<{ lab: MyLab | null }>("/api/work/labs/mine").then((res) => {
      if (!alive) return;
      const l = res.ok ? res.data.lab : null;
      setMine(l);
      setF(l ? fromLab(l) : { ...EMPTY, phone: profile.phone ?? "" });
      setState("ready");
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, profile?.id]);

  function toggle(key: "services" | "materials", id: string) {
    setF((cur) => ({ ...cur, [key]: cur[key].includes(id) ? cur[key].filter((x) => x !== id) : [...cur[key], id] }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (inflight.current) return;
    setError("");
    setSaved(false);
    const check = validateLab(f as unknown as Record<string, unknown>);
    setErrors(check.errors);
    if (Object.keys(check.errors).length) return;
    inflight.current = true;
    setBusy(true);
    const res = await api<{ lab: MyLab }>("/api/work/labs/mine", { body: f });
    inflight.current = false;
    setBusy(false);
    if (!res.ok) {
      if (res.errors) setErrors(res.errors);
      setError(res.error);
      return;
    }
    setMine(res.data.lab);
    setSaved(true);
  }

  async function remove() {
    if (!window.confirm("Laboratoriya profili o‘chirilsin? Kelgan buyurtmalar ham o‘chadi.")) return;
    const res = await api("/api/work/labs/mine", { method: "DELETE" });
    if (!res.ok) return setError(res.error);
    setMine(null);
    setSaved(false);
    setF({ ...EMPTY, phone: profile?.phone ?? "" });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-4">
        <p className="text-[13px] text-[#8b93a7]">
          <Link href="/laboratoriya" className="text-[#0F766E] hover:underline">Laboratoriya</Link>
          <span className="mx-1">/</span>
          <span>Laboratoriya profilim</span>
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#0B1F4D] lg:text-[#1a1d26]">{mine ? "Laboratoriya profilim" : "Laboratoriya sifatida e’lon berish"}</h1>
        <p className="mt-1 text-sm text-[#8b93a7]">Profil administrator tasdiqlagach katalogda chiqadi. Telefon raqami ochiq ko‘rsatilmaydi — buyurtmani qabul qilganingizda shifokorga ochiladi.</p>
      </header>

      {ready && !profile ? (
        <Gate title="Avval tizimga kiring" text="Laboratoriya profili akkauntingizga bog‘lanadi." next="/laboratoriya/mening" />
      ) : state === "loading" ? (
        <p className="py-10 text-center text-sm text-[#8b93a7]">Yuklanmoqda…</p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4 rounded-[18px] border border-[#eceff5] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)] sm:p-6" data-testid="lab-form">
          {mine ? <ModBanner status={mine.status} reason={mine.rejectReason} /> : null}
          {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
          {saved ? <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{mine?.status === "pending" ? "Saqlandi. Administrator tasdiqlashini kuting." : "Saqlandi."}</p> : null}
          <FormField label="Laboratoriya nomi" error={errors.name}>
            <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} placeholder="Masalan, Sunrise Lab" aria-invalid={Boolean(errors.name)} />
          </FormField>
          <FormField label="Shahar" error={errors.city}>
            <select className={inputCls} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
              {labCities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </FormField>
          <div>
            <p className="text-sm font-medium text-[#4b5568]">Xizmatlar</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {labServiceFilters.map((i) => <Chip key={i.id} on={f.services.includes(i.id)} onClick={() => toggle("services", i.id)}>{i.label}</Chip>)}
            </div>
            {errors.services ? <p role="alert" className="mt-1 text-[12.5px] font-medium text-[#dc2626]">{errors.services}</p> : null}
          </div>
          <div>
            <p className="text-sm font-medium text-[#4b5568]">Materiallar <span className="font-normal text-[#8b93a7]">(ixtiyoriy)</span></p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {labMaterialFilters.map((i) => <Chip key={i.id} on={f.materials.includes(i.id)} onClick={() => toggle("materials", i.id)}>{i.label}</Chip>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="O‘rtacha muddat (kun)" error={errors.days}>
              <input className={inputCls} inputMode="numeric" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value.replace(/\D/g, "") })} placeholder="7" aria-invalid={Boolean(errors.days)} />
            </FormField>
            <FormField label="Narx (so‘mdan)" error={errors.priceFrom}>
              <input className={inputCls} inputMode="numeric" value={f.priceFrom} onChange={(e) => setF({ ...f, priceFrom: e.target.value.replace(/\D/g, "") })} placeholder="ixtiyoriy" aria-invalid={Boolean(errors.priceFrom)} />
            </FormField>
          </div>
          <FormField label="Qisqa tavsif" error={errors.description}>
            <textarea className={textareaCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={600} aria-invalid={Boolean(errors.description)} />
          </FormField>
          <ListingPhoto value={f.photo} onChange={(photo) => setF({ ...f, photo })} label="Logo yoki rasm" error={errors.photo} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tuman (ixtiyoriy)">
              <input className={inputCls} value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })} maxLength={60} placeholder="Masalan, Yunusobod" />
            </FormField>
            <FormField label="Tajriba (yil)" error={errors.years}>
              <input className={inputCls} inputMode="numeric" value={f.years} onChange={(e) => setF({ ...f, years: e.target.value.replace(/\D/g, "").slice(0, 2) })} placeholder="ixtiyoriy" aria-invalid={Boolean(errors.years)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kurier xizmati">
              <select className={inputCls} value={f.courier} onChange={(e) => setF({ ...f, courier: e.target.value as "" | "ha" | "yoq" })}>
                <option value="">Ko‘rsatilmagan</option>
                <option value="ha">Bor</option>
                <option value="yoq">Yo‘q</option>
              </select>
            </FormField>
            <FormField label="Kurier hududi">
              <input className={inputCls} value={f.courierArea} onChange={(e) => setF({ ...f, courierArea: e.target.value })} maxLength={60} placeholder="Toshkent bo‘ylab" disabled={f.courier !== "ha"} />
            </FormField>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-[#4b5568]">Logo</p>
            <JobLogoPicker value={f.logo} onChange={(logo) => setF({ ...f, logo })} purpose="lab" />
            {errors.logo ? <p role="alert" className="mt-1 text-[12px] font-medium text-destructive">{errors.logo}</p> : null}
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-[#4b5568]">Laboratoriya rasmlari va video</p>
            <JobMediaPicker
              photos={f.photos}
              video={f.video}
              onPhotos={(photos) => setF((c) => ({ ...c, photos }))}
              onVideo={(video) => setF((c) => ({ ...c, video }))}
              error={errors.photos || errors.video}
              purpose="lab"
              max={12}
              hint="Rasmlar 12 tagacha, video 10 MB gacha (ixtiyoriy). Birinchi rasm kartochkada ko‘rinadi."
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-[#4b5568]">Portfolio (bajarilgan ishlar)</p>
            <JobMediaPicker
              photos={f.portfolio}
              video=""
              onPhotos={(portfolio) => setF((c) => ({ ...c, portfolio }))}
              onVideo={() => undefined}
              purpose="lab"
              max={24}
              allowVideo={false}
              hint="24 tagacha rasm. Ro‘yxatda va profilda ko‘rinadi."
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-[#4b5568]">Xizmatlar va narxlar <span className="font-normal text-[#8b93a7]">(ixtiyoriy)</span></p>
            <LabPriceEditor rows={f.priceItems} onChange={(priceItems) => setF((c) => ({ ...c, priceItems }))} error={errors.priceItems} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Telefon (yopiq saqlanadi)" error={errors.phone}>
              <input className={inputCls} inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+998 90 123 45 67" aria-invalid={Boolean(errors.phone)} />
            </FormField>
            <FormField label="Telegram (ixtiyoriy)">
              <input className={inputCls} value={f.telegram} onChange={(e) => setF({ ...f, telegram: e.target.value })} placeholder="@username" maxLength={80} />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={busy} className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-2xl bg-[#0F766E] px-6 text-[14px] font-semibold text-white disabled:opacity-60">
              {busy ? "Saqlanmoqda…" : mine ? "Saqlash" : "Moderatsiyaga yuborish"}
            </button>
            {mine ? (
              <>
                <Link href="/laboratoriya/buyurtmalarim?tab=kelgan" className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#CCFBF1] px-5 text-[14px] font-semibold text-[#0F766E]">Kelgan buyurtmalar</Link>
                <button type="button" onClick={remove} className="inline-flex h-12 items-center justify-center rounded-2xl px-4 text-[14px] font-semibold text-[#dc2626]">O‘chirish</button>
              </>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
