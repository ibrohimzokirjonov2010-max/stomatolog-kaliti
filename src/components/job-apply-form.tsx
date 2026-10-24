"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useJobsWork } from "@/components/jobs-provider";
import { FormField, Gate, inputCls, textareaCls } from "@/components/work-ui";
import { experienceLabel, type Job } from "@/data/jobs";
import { formatSalaryRange } from "@/lib/format";
import { validateJobApplication, type FieldErrors } from "@/lib/work-validate";

export function JobApplyForm({ job, onCancel, onSuccess, focusNote }: { job: Job; onCancel: () => void; onSuccess: () => void; focusNote?: boolean }) {
  const { apply, hasApplied, authed, ready, resume } = useJobsWork();
  const { profile } = useDoctorProfile();
  const already = hasApplied(job.id);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(resume?.name ?? profile?.fullName ?? "");
  const [phone, setPhone] = useState(resume?.phone ?? profile?.phone ?? "");
  const [telegram, setTelegram] = useState(resume?.telegram ?? "");
  const [experienceYears, setExperienceYears] = useState(resume ? String(resume.experienceYears) : "1");
  const [note, setNote] = useState(resume?.about && !focusNote ? resume.about.slice(0, 800) : "");

  if (ready && !authed) {
    return <Gate title="Ariza yuborish uchun kiring" text="Ariza yuborish faqat ro‘yxatdan o‘tgan foydalanuvchilar uchun." next={`/ishlar/${job.id}`} />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const input = { jobId: job.id, name, phone, telegram, experienceYears, note };
    const check = validateJobApplication(input);
    setErrors(check.errors);
    setFormError("");
    if (Object.keys(check.errors).length) return;
    setBusy(true);
    const result = await apply(input);
    setBusy(false);
    if (!result.ok) {
      if (result.errors) setErrors(result.errors);
      setFormError(result.error);
      return;
    }
    onSuccess();
  }

  if (already) {
    return (
      <div>
        <p className="text-sm font-medium text-emerald-700">Ariza yuborildi. Holatni «Mening arizalarim» sahifasida kuzating.</p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          {job.clinic} — {job.title}. {formatSalaryRange(job.salaryMin, job.salaryMax)}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/ishlar/arizalarim" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white">
            Mening arizalarim
          </Link>
          <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onCancel}>
            Yopish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={submit} noValidate>
      {focusNote ? (
        <p className="rounded-xl bg-[#f0f5ff] px-3 py-2 text-[12.5px] text-[#1e3a8a]">Klinika bilan to‘g‘ridan-to‘g‘ri chat hozircha yo‘q — xabaringiz arizangiz bilan birga ish beruvchiga boradi.</p>
      ) : resume ? (
        <p className="rounded-xl bg-[#ecfdf3] px-3 py-2 text-[12.5px] text-[#166534]">Rezyumengizdagi ma’lumotlar to‘ldirildi.</p>
      ) : null}
      <p className="text-[13px] text-muted-foreground">
        {job.clinic} — {job.title}. {experienceLabel(job.experienceYears)}. Telefon raqamingiz faqat ish beruvchiga ko‘rinadi; klinika raqami ariza qabul qilingach ochiladi.
      </p>
      <FormField label="Ism" error={errors.name}>
        <input className={inputCls} aria-invalid={errors.name ? true : undefined} value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan, Nilufar R." autoComplete="name" />
      </FormField>
      <FormField label="Telefon" error={errors.phone}>
        <input className={inputCls} aria-invalid={errors.phone ? true : undefined} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="90 123 45 67" inputMode="tel" autoComplete="tel" />
      </FormField>
      <FormField label="Telegram (ixtiyoriy)">
        <input className={inputCls} value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" />
      </FormField>
      <FormField label="Tajriba (yil)" error={errors.experienceYears}>
        <input className={inputCls} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} inputMode="numeric" />
      </FormField>
      <FormField label={focusNote ? "Klinikaga xabaringiz" : "Qisqa xat (ixtiyoriy)"}>
        <textarea autoFocus={focusNote} className={textareaCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nega aynan shu vakansiya — 2–3 jumla." rows={4} />
      </FormField>
      {formError ? <p role="alert" className="text-sm font-medium text-destructive">{formError}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onCancel}>
          Bekor
        </Button>
        <Button type="submit" disabled={busy} className="h-11 rounded-xl bg-[#0F766E]">
          {busy ? "Yuborilmoqda…" : "Ariza yuborish"}
        </Button>
      </div>
    </form>
  );
}
