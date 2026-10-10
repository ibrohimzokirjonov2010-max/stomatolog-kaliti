"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { seminarCities } from "@/data/seminars";
import { prepareImage, uploadImage } from "@/lib/image-upload";
import { SPECIALTIES, type SeminarRow } from "@/lib/seminar-remote";
import { emptySeminarInput, validateSeminar, type SeminarErrors, type SeminarInput } from "@/lib/seminar-validate";
import { cn } from "@/lib/utils";

const field =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] text-[#1a1d26] outline-none transition-colors placeholder:text-[#a3abbd] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15";

function Field({ label, error, hint, children, id }: { label: string; error?: string; hint?: string; children: ReactNode; id: string }) {
  return (
    <div data-field={id}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-[#1a1d26]">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-[#dc2626]">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-[#8b93a7]">{hint}</p>
      ) : null}
    </div>
  );
}

function toInput(r: SeminarRow): SeminarInput {
  return {
    title: r.title ?? "",
    description: r.description ?? "",
    speakers: r.speakers?.length ? r.speakers.map((s) => ({ name: s.name, role: s.role })) : [{ name: "", role: "" }],
    date: r.date ?? "",
    startTime: r.time ?? "",
    endTime: r.timeEnd ?? "",
    city: r.city ?? "Toshkent",
    venue: r.venue ?? "",
    price: String(r.price ?? ""),
    seats: String(r.seats ?? ""),
    specialty: r.specialty ?? "implantologiya",
    image: r.image ?? "",
    tags: (r.tags ?? []).join(", "),
    program: r.program ?? [],
    learnings: (r.learnings ?? []).join("\n"),
  };
}

/** Create / edit form for an organizer's seminar. `seminarId` set → edit. */
export function SeminarForm({ seminarId }: { seminarId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<SeminarInput>(emptySeminarInput);
  const [errors, setErrors] = useState<SeminarErrors>({});
  const [loading, setLoading] = useState(Boolean(seminarId));
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState<SeminarRow["status"] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !seminarId;

  useEffect(() => {
    if (!seminarId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/seminars/mine/${seminarId}`, { cache: "no-store", credentials: "same-origin" });
        const j = (await res.json()) as { ok?: boolean; seminar?: SeminarRow; error?: string };
        if (!alive) return;
        if (!res.ok || !j.seminar) setLoadError(res.status === 401 ? "Avval tizimga kiring." : "Seminar topilmadi.");
        else {
          setForm(toInput(j.seminar));
          setStatus(j.seminar.status);
        }
      } catch {
        if (alive) setLoadError("Yuklab bo‘lmadi. Internetni tekshiring.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [seminarId]);

  const set = <K extends keyof SeminarInput>(key: K, value: SeminarInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: undefined }));
  };

  async function pickImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setErrors((e) => ({ ...e, image: undefined }));
    try {
      const prepared = await prepareImage(file, 1600, 0.85);
      const url = await uploadImage(prepared.blob, "seminar");
      URL.revokeObjectURL(prepared.previewUrl);
      set("image", url);
    } catch (e) {
      setErrors((x) => ({ ...x, image: e instanceof Error ? e.message : "Rasm yuklanmadi." }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    const { errors: found } = validateSeminar(form, { isNew });
    if (Object.keys(found).length) {
      setErrors(found);
      setFormError("Qizil bilan belgilangan maydonlarni to‘ldiring.");
      requestAnimationFrame(() => document.querySelector(`[data-field="${Object.keys(found)[0]}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/seminars/mine", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: seminarId }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; seminar?: SeminarRow; errors?: SeminarErrors; error?: string };
      if (j.ok && j.seminar) {
        router.push(`/seminarlar/yozuvlarim/tashkilotchi?saved=${isNew ? j.seminar.status : "updated"}`);
        return;
      }
      if (j.errors) setErrors(j.errors);
      setFormError(res.status === 401 ? "Avval tizimga kiring." : (j.error ?? "Saqlab bo‘lmadi. Qayta urinib ko‘ring."));
    } catch {
      setFormError("Aloqa xatosi. Qayta urinib ko‘ring.");
    } finally {
      setSaving(false);
    }
  }

  const bad = (k: string) => (errors[k] ? "border-[#dc2626]" : "border-[#e1e6ef]");

  if (loading) return <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-[16px] bg-[#f1f3f8]" />;
  if (loadError)
    return (
      <div className="mx-auto max-w-3xl rounded-[16px] border border-[#eceff5] bg-white px-6 py-14 text-center">
        <p className="text-[16px] font-semibold text-[#1a1d26]">{loadError}</p>
        <Link href="/seminarlar/yozuvlarim/tashkilotchi" className="mt-3 inline-block text-[14px] font-semibold text-[#0066FF]">
          Kabinetga qaytish
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-4">
        <Link href="/seminarlar/yozuvlarim/tashkilotchi" className="inline-flex items-center gap-1 text-[13px] text-[#0066FF] hover:underline">
          <ChevronLeft className="size-4" />
          Tashkilotchi kabineti
        </Link>
        <h1 className="mt-2 text-[24px] font-bold tracking-tight text-[#1a1d26]">{isNew ? "Yangi seminar" : "Seminarni tahrirlash"}</h1>
        <p className="mt-1 text-sm text-[#8b93a7]">
          {isNew
            ? "Yuborilgach administrator ko‘rib chiqadi — tasdiqlangach seminar hamma uchun ko‘rinadi."
            : status === "published" || status === "closed"
              ? "O‘zgarishlar darhol saytda ko‘rinadi."
              : "Saqlagach seminar qayta tasdiqqa yuboriladi."}
        </p>
        {status === "rejected" ? <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-800">Seminar rad etilgan. Tuzatib qayta yuboring.</p> : null}
      </header>

      <form onSubmit={submit} noValidate className="space-y-5 rounded-[16px] border border-[#eceff5] bg-white p-4 sm:p-6" data-testid="seminar-form">
        <Field id="title" label="Seminar nomi" error={errors.title}>
          <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={160} placeholder="Masalan: Implantologiya: amaliy kurs" className={cn(field, bad("title"))} />
        </Field>

        <div data-field="speakers">
          <p className="mb-1.5 text-[13px] font-semibold text-[#1a1d26]">Ma‘ruzachi(lar)</p>
          <div className="space-y-2">
            {form.speakers.map((sp, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                <input
                  aria-label={`Ma‘ruzachi ${i + 1} ismi`}
                  value={sp.name}
                  onChange={(e) => set("speakers", form.speakers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  placeholder="Ism familiya"
                  maxLength={80}
                  className={cn(field, bad("speakers"), "flex-1")}
                />
                <input
                  aria-label={`Ma‘ruzachi ${i + 1} lavozimi`}
                  value={sp.role}
                  onChange={(e) => set("speakers", form.speakers.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}
                  placeholder="Lavozimi (ixtiyoriy)"
                  maxLength={100}
                  className={cn(field, "flex-1 border-[#e1e6ef]")}
                />
                </div>
                {form.speakers.length > 1 ? (
                  <button type="button" aria-label="Ma‘ruzachini o‘chirish" onClick={() => set("speakers", form.speakers.filter((_, j) => j !== i))} className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#e1e6ef] text-[#8b93a7]">
                    <Trash2 className="size-4" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {errors.speakers ? <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-[#dc2626]">{errors.speakers}</p> : null}
          {form.speakers.length < 5 ? (
            <button type="button" onClick={() => set("speakers", [...form.speakers, { name: "", role: "" }])} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0066FF]">
              <Plus className="size-4" /> Yana ma‘ruzachi
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="date" label="Sana" error={errors.date}>
            <input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={cn(field, bad("date"))} />
          </Field>
          <Field id="startTime" label="Boshlanishi" error={errors.startTime}>
            <input id="startTime" type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className={cn(field, bad("startTime"))} />
          </Field>
          <Field id="endTime" label="Tugashi" error={errors.endTime}>
            <input id="endTime" type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className={cn(field, bad("endTime"))} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Field id="city" label="Shahar" error={errors.city}>
            <select id="city" value={form.city} onChange={(e) => set("city", e.target.value)} className={cn(field, bad("city"))}>
              {seminarCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field id="venue" label={form.city === "Online" ? "Platforma / havola" : "Joy (manzil)"} error={errors.venue}>
            <input id="venue" value={form.venue} onChange={(e) => set("venue", e.target.value)} maxLength={200} placeholder={form.city === "Online" ? "Zoom, Google Meet…" : "Masalan: Hilton Tashkent, 2-zal"} className={cn(field, bad("venue"))} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="price" label="Narx (so‘m)" error={errors.price} hint="Bepul bo‘lsa 0 yozing.">
            <input id="price" inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value.replace(/[^\d\s]/g, ""))} placeholder="450000" className={cn(field, bad("price"))} />
          </Field>
          <Field id="seats" label="O‘rinlar soni" error={errors.seats}>
            <input id="seats" inputMode="numeric" value={form.seats} onChange={(e) => set("seats", e.target.value.replace(/[^\d]/g, ""))} placeholder="40" className={cn(field, bad("seats"))} />
          </Field>
          <Field id="specialty" label="Yo‘nalish" error={errors.specialty}>
            <select id="specialty" value={form.specialty} onChange={(e) => set("specialty", e.target.value)} className={cn(field, bad("specialty"))}>
              {SPECIALTIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="description" label="Tavsif" error={errors.description}>
          <textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} maxLength={4000} placeholder="Seminar nima haqida, kimlar uchun, nimalar kiradi…" className={cn(field, bad("description"), "h-auto py-3 leading-relaxed")} />
        </Field>

        <div data-field="image">
          <p className="mb-1.5 text-[13px] font-semibold text-[#1a1d26]">Muqova rasmi</p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void pickImage(e.target.files?.[0])} data-testid="seminar-image-input" />
          {form.image ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-[#e1e6ef] bg-[#f1f3f8] sm:max-w-sm">
              <Image src={form.image} alt="Seminar rasmi" fill sizes="400px" className="object-cover" unoptimized />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="absolute right-2 bottom-2 rounded-lg bg-white/95 px-3 py-1.5 text-[12.5px] font-semibold text-[#0B1F4D] shadow">
                {uploading ? "Yuklanmoqda…" : "Almashtirish"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={cn("flex aspect-[16/9] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed bg-[#f8faff] text-[13px] font-semibold text-[#0066FF] sm:max-w-sm", errors.image ? "border-[#dc2626]" : "border-[#c9d8f5]")}
            >
              {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
              {uploading ? "Yuklanmoqda…" : "Rasm yuklash (JPG, PNG, WEBP)"}
            </button>
          )}
          {errors.image ? <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-[#dc2626]">{errors.image}</p> : null}
        </div>

        <div data-field="program">
          <p className="mb-1.5 text-[13px] font-semibold text-[#1a1d26]">Dastur bosqichlari <span className="font-normal text-[#8b93a7]">(ixtiyoriy)</span></p>
          <div className="space-y-2">
            {form.program.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input aria-label={`${i + 1}-bosqich vaqti`} value={p.time} onChange={(e) => set("program", form.program.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} placeholder="10:00 – 11:00" maxLength={20} className={cn(field, bad("program"), "w-36 shrink-0")} />
                <input aria-label={`${i + 1}-bosqich nomi`} value={p.title} onChange={(e) => set("program", form.program.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Nazariy qism" maxLength={100} className={cn(field, bad("program"), "flex-1")} />
                <button type="button" aria-label="Bosqichni o‘chirish" onClick={() => set("program", form.program.filter((_, j) => j !== i))} className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#e1e6ef] text-[#8b93a7]">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.program ? <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-[#dc2626]">{errors.program}</p> : null}
          {form.program.length < 12 ? (
            <button type="button" onClick={() => set("program", [...form.program, { time: "", title: "" }])} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0066FF]">
              <Plus className="size-4" /> Bosqich qo‘shish
            </button>
          ) : null}
        </div>

        <Field id="learnings" label="Nima o‘rganasiz (ixtiyoriy)" error={errors.learnings} hint="Har bir bandni yangi qatordan yozing.">
          <textarea id="learnings" value={form.learnings} onChange={(e) => set("learnings", e.target.value)} rows={3} className={cn(field, bad("learnings"), "h-auto py-3 leading-relaxed")} />
        </Field>

        <Field id="tags" label="Teglar (ixtiyoriy)" error={errors.tags} hint="Vergul bilan ajrating, eng ko‘pi 6 ta. Masalan: master-klass, amaliyot">
          <input id="tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} className={cn(field, bad("tags"))} />
        </Field>

        {formError ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-800" data-testid="seminar-form-error">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href="/seminarlar/yozuvlarim/tashkilotchi" className="inline-flex h-11 items-center justify-center rounded-xl border border-[#e1e6ef] px-5 text-[14px] font-semibold text-[#4b5568]">
            Bekor qilish
          </Link>
          <button type="submit" disabled={saving || uploading} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0066FF] px-6 text-[14px] font-semibold text-white shadow-[0_6px_14px_rgba(0,102,255,0.28)] disabled:opacity-60" data-testid="seminar-submit">
            {saving ? "Saqlanmoqda…" : isNew ? "Tasdiqqa yuborish" : "Saqlash"}
          </button>
        </div>
      </form>
    </div>
  );
}
