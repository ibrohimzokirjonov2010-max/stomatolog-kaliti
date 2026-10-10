"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useJobsWork } from "@/components/jobs-provider";
import { FormField, Gate, inputCls, textareaCls } from "@/components/work-ui";
import { experienceLabel, jobBenefits, jobCategoryLabels, jobCities, jobTitles, jobTypeLabels, type Candidate, type Job, type JobBenefit, type JobCategory, type JobType } from "@/data/jobs";
import { toshkentDistricts } from "@/data/masters";
import { JobLogoPicker, JobMediaPicker } from "@/components/job-media-picker";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import type { DbResume } from "@/lib/jobs-work";
import { validateContact, validateJob, validateResume, type FieldErrors } from "@/lib/work-validate";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="ishlar-modal-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="ishlar-modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-[#f4f6fa] text-[#4b5568]" aria-label="Yopish">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function useSubmit<T extends Record<string, unknown>>(validate: (v: Record<string, unknown>) => { errors: FieldErrors }, run: (v: T) => Promise<{ ok: true } | { ok: false; error: string; errors?: FieldErrors }>, onDone: () => void) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent, value: T) {
    event.preventDefault();
    if (busy) return;
    const check = validate(value);
    setErrors(check.errors);
    setFormError("");
    if (Object.keys(check.errors).length) return;
    setBusy(true);
    const res = await run(value);
    setBusy(false);
    if (!res.ok) {
      if (res.errors) setErrors(res.errors);
      setFormError(res.error);
      return;
    }
    onDone();
  }
  return { errors, formError, busy, submit };
}

function Footer({ onCancel, busy, label, formError }: { onCancel: () => void; busy: boolean; label: string; formError: string }) {
  return (
    <>
      {formError ? <p role="alert" className="text-sm font-medium text-destructive">{formError}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onCancel}>
          Bekor
        </Button>
        <Button type="submit" disabled={busy} className="h-11 rounded-xl">
          {busy ? "Yuborilmoqda…" : label}
        </Button>
      </div>
    </>
  );
}

export function PostJobForm({ job, onDone, onCancel }: { job?: Job; onDone: () => void; onCancel: () => void }) {
  const { saveJob, authed, ready } = useJobsWork();
  const [form, setForm] = useState({
    category: (job?.category ?? "") as JobCategory | "",
    title: job?.title ?? "",
    clinic: job?.clinic ?? "",
    city: job?.city ?? "Toshkent",
    district: job?.district ?? "",
    address: job?.address ?? "",
    type: (job?.type ?? "full") as JobType,
    salaryMin: job?.salaryMin ? String(job.salaryMin) : "",
    salaryMax: job?.salaryMax ? String(job.salaryMax) : "",
    experienceYears: String(job?.experienceYears ?? 1),
    workDays: job?.workDays ?? "",
    workHours: job?.workHours ?? "",
    description: job?.description ?? "",
    requirementsText: (job?.requirements ?? []).join("\n"),
    benefits: (job?.benefits ?? []) as JobBenefit[],
    photos: job?.photos ?? [],
    video: job?.video ?? "",
    logo: job?.logo ?? "",
    employerAbout: job?.employerAbout ?? "",
    staffCount: job?.staffCount ? String(job.staffCount) : "",
    foundedYear: job?.foundedYear ? String(job.foundedYear) : "",
    phone: job?.phone ?? "",
    remote: Boolean(job?.remote),
  });
  const toInput = (v: typeof form) => {
    const { requirementsText, ...rest } = v;
    return { ...rest, requirements: requirementsText.split("\n").map((x) => x.trim()).filter(Boolean) };
  };
  const { errors, formError, busy, submit } = useSubmit<typeof form>(
    (v) => {
      const res = validateJob(toInput(v as typeof form));
      if (!(v as typeof form).category) res.errors.category = "Bo‘limni tanlang.";
      return res;
    },
    (v) => saveJob(toInput(v), job?.id),
    onDone,
  );
  const set = (p: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...p }));
  const toggleBenefit = (id: JobBenefit) =>
    set({ benefits: form.benefits.includes(id) ? form.benefits.filter((x) => x !== id) : form.benefits.length >= 6 ? form.benefits : [...form.benefits, id] });

  if (ready && !authed) return <Gate title="Vakansiya joylash uchun kiring" text="E’lon berish faqat ro‘yxatdan o‘tgan foydalanuvchilar uchun." next="/ishlar" />;

  const districts = form.city === "Toshkent" ? toshkentDistricts : [];

  return (
    <form className="space-y-3" onSubmit={(e) => submit(e, form)} noValidate data-testid="post-job-form">
      <p className="text-[13px] text-muted-foreground">Vakansiya admin tasdiqlagach hamma uchun ko‘rinadi. Telefon raqamingiz ochiq e’lon qilinmaydi — faqat arizasi qabul qilingan nomzodga ko‘rinadi.</p>

      <FormField label="Bo‘lim *" error={errors.category}>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Bo‘lim">
          {(Object.keys(jobCategoryLabels) as JobCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={form.category === c}
              onClick={() => set({ category: c })}
              className={cn("h-10 rounded-xl border text-[13px] font-semibold", form.category === c ? "border-[#0066FF] bg-[#0066FF] text-white" : "border-[#dbe3f0] bg-white text-[#1a1d26]")}
            >
              {{ klinika: "Klinika xodimi", texnik: "Texnik", shifokor: "Shifokor" }[c]}
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="Lavozim *" error={errors.title}>
        <input className={inputCls} list="job-titles" aria-invalid={errors.title ? true : undefined} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Masalan, Implantolog" />
        <datalist id="job-titles">
          {jobTitles.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </FormField>
      <FormField label="Klinika / ish beruvchi *" error={errors.clinic}>
        <input className={inputCls} aria-invalid={errors.clinic ? true : undefined} value={form.clinic} onChange={(e) => set({ clinic: e.target.value })} placeholder="Klinika nomi" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Shahar *" error={errors.city}>
          <select className={inputCls} value={form.city} onChange={(e) => set({ city: e.target.value, district: "" })}>
            {jobCities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Tuman">
          {districts.length ? (
            <select className={inputCls} value={form.district} onChange={(e) => set({ district: e.target.value })}>
              <option value="">Tanlanmagan</option>
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          ) : (
            <input className={inputCls} value={form.district} onChange={(e) => set({ district: e.target.value })} placeholder="Tuman" />
          )}
        </FormField>
      </div>
      <FormField label="Manzil (xarita uchun)">
        <input className={inputCls} value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="Ko‘cha, uy, mo‘ljal" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Ish turi">
          <select className={inputCls} value={form.type} onChange={(e) => set({ type: e.target.value as JobType })}>
            {(Object.keys(jobTypeLabels) as JobType[]).map((id) => (
              <option key={id} value={id}>
                {jobTypeLabels[id]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Tajriba (yil)" error={errors.experienceYears}>
          <input className={inputCls} inputMode="numeric" value={form.experienceYears} onChange={(e) => set({ experienceYears: e.target.value })} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Maosh, min (so‘m)" error={errors.salaryMin}>
          <input className={inputCls} inputMode="numeric" value={form.salaryMin} onChange={(e) => set({ salaryMin: e.target.value })} placeholder="Kelishiladi" />
        </FormField>
        <FormField label="Maosh, max (so‘m)" error={errors.salaryMax}>
          <input className={inputCls} inputMode="numeric" value={form.salaryMax} onChange={(e) => set({ salaryMax: e.target.value })} placeholder="Kelishiladi" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Ish kunlari">
          <input className={inputCls} list="job-days" value={form.workDays} onChange={(e) => set({ workDays: e.target.value })} placeholder="Dushanba–Shanba" />
          <datalist id="job-days">
            <option value="Dushanba–Juma" />
            <option value="Dushanba–Shanba" />
            <option value="Har kuni" />
            <option value="Smena bo‘yicha" />
          </datalist>
        </FormField>
        <FormField label="Ish vaqti">
          <input className={inputCls} value={form.workHours} onChange={(e) => set({ workHours: e.target.value })} placeholder="09:00 – 18:00" />
        </FormField>
      </div>
      <FormField label="Tavsif *" error={errors.description}>
        <textarea className={textareaCls} aria-invalid={errors.description ? true : undefined} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Ish kuni, asbob-uskuna, nima kutiladi — kamida 20 belgi." rows={4} />
      </FormField>
      <FormField label="Asosiy talablar (har biri yangi qatordan, 8 tagacha)">
        <textarea className={textareaCls} value={form.requirementsText} onChange={(e) => set({ requirementsText: e.target.value })} placeholder={"Kamida 2 yil ish tajribasi\nBemorlar bilan muloqot madaniyati"} rows={3} data-testid="post-job-requirements" />
      </FormField>
      <FormField label={`Biz taklif qilamiz (6 tagacha · ${form.benefits.length}/6)`} error={errors.benefits}>
        <div className="grid grid-cols-2 gap-2" data-testid="post-job-benefits">
          {jobBenefits.map((b) => {
            const on = form.benefits.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleBenefit(b.id)}
                className={cn("rounded-xl border px-2.5 py-2 text-left leading-tight", on ? "border-[#0066FF] bg-[#eef4ff]" : "border-[#e6ebf3] bg-white")}
              >
                <span className={cn("block text-[12.5px] font-semibold", on ? "text-[#0066FF]" : "text-[#1a1d26]")}>{b.title}</span>
                <span className="block text-[11px] text-[#8b93a7]">{b.sub}</span>
              </button>
            );
          })}
        </div>
      </FormField>
      <FormField label="Ish joyi rasmlari va video" error={errors.photos || errors.video}>
        <JobMediaPicker photos={form.photos} video={form.video} onPhotos={(photos) => set({ photos })} onVideo={(video) => set({ video })} />
      </FormField>

      <fieldset className="space-y-3 rounded-2xl border border-[#e6ebf3] p-3">
        <legend className="px-1 text-[13px] font-semibold text-[#4b5568]">Klinika haqida (ixtiyoriy)</legend>
        <FormField label="Logo" error={errors.logo}>
          <JobLogoPicker value={form.logo} onChange={(logo) => set({ logo })} />
        </FormField>
        <FormField label="Qisqacha (160 belgigacha)">
          <input className={inputCls} maxLength={160} value={form.employerAbout} onChange={(e) => set({ employerAbout: e.target.value })} placeholder="Zamonaviy stomatologik klinika" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Xodimlar soni" error={errors.staffCount}>
            <input className={inputCls} inputMode="numeric" value={form.staffCount} onChange={(e) => set({ staffCount: e.target.value })} placeholder="12" />
          </FormField>
          <FormField label="Tashkil topgan yil" error={errors.foundedYear}>
            <input className={inputCls} inputMode="numeric" value={form.foundedYear} onChange={(e) => set({ foundedYear: e.target.value })} placeholder="2021" />
          </FormField>
        </div>
      </fieldset>

      <FormField label="Telefon * (yopiq)" error={errors.phone}>
        <input className={inputCls} inputMode="tel" aria-invalid={errors.phone ? true : undefined} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="90 123 45 67" />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-[#4b5568]">
        <input type="checkbox" checked={form.remote} onChange={(e) => set({ remote: e.target.checked })} className="size-4" />
        Masofaviy ish
      </label>
      <Footer onCancel={onCancel} busy={busy} formError={formError} label={job ? "Saqlash" : "E’lon qilish"} />
    </form>
  );
}

export function ResumeForm({ initial, onDone, onCancel }: { initial: DbResume | null; onDone: () => void; onCancel: () => void }) {
  const { saveUserResume, authed, ready } = useJobsWork();
  const { profile } = useDoctorProfile();
  const [form, setForm] = useState({
    name: initial?.name ?? profile?.fullName ?? "",
    role: initial?.role ?? "",
    city: initial?.city ?? "Toshkent",
    experienceYears: String(initial?.experienceYears ?? 1),
    salaryFrom: initial?.salaryFrom ? String(initial.salaryFrom) : "",
    phone: initial?.phone ?? profile?.phone ?? "",
    telegram: initial?.telegram ?? "",
    about: initial?.about ?? "",
    published: initial?.published ?? true,
  });
  const { errors, formError, busy, submit } = useSubmit<typeof form>(validateResume, (v) => saveUserResume(v), onDone);
  const set = (p: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...p }));

  if (ready && !authed) return <Gate title="Rezyume joylash uchun kiring" text="Rezyume faqat ro‘yxatdan o‘tgan foydalanuvchilar uchun." next="/ishlar" />;

  return (
    <form className="space-y-3" onSubmit={(e) => submit(e, form)} noValidate>
      <p className="text-[13px] text-muted-foreground">Rezyume talabgorlar ro‘yxatida ko‘rinadi. Telefon raqamingiz ochiq ko‘rsatilmaydi — faqat siz ariza yuborgan ish beruvchiga yoki o‘zingiz bilan bog‘lanish so‘ragan ish beruvchiga beriladi.</p>
      <FormField label="Ism *" error={errors.name}>
        <input className={inputCls} aria-invalid={errors.name ? true : undefined} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nilufar R." />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Mutaxassislik *" error={errors.role}>
          <input className={inputCls} list="resume-roles" aria-invalid={errors.role ? true : undefined} value={form.role} onChange={(e) => set({ role: e.target.value })} placeholder="Stomatolog terapevt" />
          <datalist id="resume-roles">
            {jobTitles.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </FormField>
        <FormField label="Shahar *" error={errors.city}>
          <select className={inputCls} value={form.city} onChange={(e) => set({ city: e.target.value })}>
            {jobCities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tajriba (yil)" error={errors.experienceYears}>
          <input className={inputCls} inputMode="numeric" value={form.experienceYears} onChange={(e) => set({ experienceYears: e.target.value })} />
        </FormField>
        <FormField label="Kutilayotgan maosh" error={errors.salaryFrom}>
          <input className={inputCls} inputMode="numeric" value={form.salaryFrom} onChange={(e) => set({ salaryFrom: e.target.value })} placeholder="12 000 000" />
        </FormField>
      </div>
      <FormField label="Telefon * (yopiq)" error={errors.phone}>
        <input className={inputCls} inputMode="tel" aria-invalid={errors.phone ? true : undefined} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="90 123 45 67" />
      </FormField>
      <FormField label="Qisqa bio" error={errors.about}>
        <textarea className={textareaCls} value={form.about} onChange={(e) => set({ about: e.target.value })} placeholder="Qaysi yo‘nalish, qancha yil, qaysi shaharga ochiqsiz." />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-[#4b5568]">
        <input type="checkbox" checked={form.published} onChange={(e) => set({ published: e.target.checked })} className="size-4" />
        Talabgorlar ro‘yxatida ko‘rinsin
      </label>
      <Footer onCancel={onCancel} busy={busy} formError={formError} label={initial ? "Yangilash" : "Saqlash"} />
    </form>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-lg font-semibold text-primary">{initials}</span>;
}

export function ProfileView({ person, onClose }: { person: Candidate; onClose: () => void }) {
  const { sendOffer, removeResume, authed, ready } = useJobsWork();
  const { profile } = useDoctorProfile();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: profile?.fullName ?? "", phone: profile?.phone ?? "", message: "" });
  const { errors, formError, busy, submit } = useSubmit<typeof form>((v) => validateContact(v), (v) => sendOffer(person.id, v), () => setSent(true));

  return (
    <div>
      <div className="flex gap-3">
        <Avatar name={person.name} />
        <div>
          {person.mine ? <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Mening rezyumem</p> : null}
          <p className="text-lg font-semibold">{person.name}</p>
          <p className="text-sm text-muted-foreground">{person.role}</p>
          <p className="mt-1 text-[13px] text-slate-600">
            {person.city} · {experienceLabel(person.experienceYears, false)}
          </p>
        </div>
      </div>
      {person.about ? <p className="mt-4 text-sm leading-relaxed text-slate-600">{person.about}</p> : null}
      {person.salaryFrom ? <p className="mt-3 text-sm font-semibold">{formatMoney(person.salaryFrom, "UZS")}dan</p> : null}
      {person.mine ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">Bu sizning rezyumeingiz. Telefon raqamingiz ochiq ko‘rinmaydi.</p>
          <Button variant="outline" className="h-10 rounded-xl" onClick={async () => { if (window.confirm("Rezyumeni o‘chirasizmi?")) { await removeResume(); onClose(); } }}>
            O‘chirish
          </Button>
        </div>
      ) : sent ? (
        <p className="mt-4 text-sm font-medium text-emerald-700">Taklif nomzodga yuborildi. U javob bersa, bildirishnoma olasiz.</p>
      ) : !open ? (
        <div className="mt-4">
          <Button className="h-11 rounded-xl" onClick={() => setOpen(true)}>
            Bog‘lanish (taklif yuborish)
          </Button>
          <p className="mt-2 text-[12px] text-[#8b93a7]">Nomzod telefon raqami yopiq. Taklif yuborsangiz, u sizning raqamingizni ko‘radi va o‘zi bog‘lanadi.</p>
        </div>
      ) : ready && !authed ? (
        <div className="mt-4">
          <Gate title="Bog‘lanish uchun kiring" text="Taklif yuborish faqat ro‘yxatdan o‘tgan foydalanuvchilar uchun." next="/ishlar" />
        </div>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={(e) => submit(e, form)} noValidate>
          <FormField label="Ismingiz / klinika" error={errors.name}>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Telefon raqamingiz" error={errors.phone}>
            <input className={inputCls} inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="90 123 45 67" />
          </FormField>
          <FormField label="Xabar (ixtiyoriy)">
            <textarea className={textareaCls} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Qaysi vakansiya, qaysi klinika…" />
          </FormField>
          {formError ? <p role="alert" className="text-sm font-medium text-destructive">{formError}</p> : null}
          <Button type="submit" disabled={busy} className="h-11 rounded-xl">
            {busy ? "Yuborilmoqda…" : "Taklif yuborish"}
          </Button>
        </form>
      )}
      <button type="button" onClick={onClose} className="mt-4 block text-sm text-muted-foreground hover:underline">
        Yopish
      </button>
    </div>
  );
}
