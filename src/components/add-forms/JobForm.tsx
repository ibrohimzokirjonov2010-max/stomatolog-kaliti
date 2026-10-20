"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { ADD_CITIES, ADD_DISTRICTS, JOB_EXPERIENCE, JOB_PERKS, JOB_TYPES, emptyJob, jobPayload, moneyText, saveAddForm, validateJobForm, type JobInput } from "@/lib/add-forms";
import { formatGroupedNumber } from "@/lib/format";
import { AddPage, AreaField, Banners, Chips, FormActions, PhoneField, SelectField, Step, TelegramField, TextField, Toggle } from "@/components/add-forms/widgets";

type Row = {
  id: string;
  title?: string;
  clinic?: string;
  city?: string;
  district?: string | null;
  address?: string | null;
  type?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryNegotiable?: boolean;
  experienceYears?: number;
  requirements?: string[];
  duties?: string[];
  description?: string;
  benefits?: string[];
  benefitNote?: string | null;
  phone?: string;
  telegram?: string | null;
  email?: string | null;
  acceptApplications?: boolean;
};

export function JobForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [id, setId] = useState(params.get("id") ?? "");
  const [form, setForm] = useState<JobInput>(emptyJob());
  const [other, setOther] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [fail, setFail] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const edit = params.get("id");
    if (!edit) return;
    let cancel = false;
    void fetch("/api/work/jobs/mine").then(async (res) => {
      const data = await res.json().catch(() => null) as { jobs?: Row[] } | null;
      const row = data?.jobs?.find((item) => item.id === edit);
      if (!row || cancel) return;
      setId(row.id);
      setOther(Boolean(row.benefitNote));
      setForm({
        title: row.title ?? "",
        clinic: row.clinic ?? "",
        city: row.city ?? "",
        district: row.district ?? "",
        address: row.address ?? "",
        type: row.type || "full",
        salaryMin: row.salaryMin ? formatGroupedNumber(row.salaryMin) : "",
        salaryMax: row.salaryMax ? formatGroupedNumber(row.salaryMax) : "",
        negotiable: Boolean(row.salaryNegotiable),
        experienceYears: String(row.experienceYears ?? 0),
        requirements: (row.requirements ?? []).join("\n") || reqFrom(row.description, "Talablar"),
        duties: (row.duties ?? []).join("\n") || reqFrom(row.description, "Majburiyatlar"),
        benefits: row.benefits ?? [],
        benefitNote: row.benefitNote ?? "",
        phone: row.phone ?? "",
        telegram: row.telegram ?? "",
        email: row.email ?? "",
        acceptApplications: row.acceptApplications !== false,
      });
    }).catch(() => undefined);
    return () => { cancel = true; };
  }, [params]);

  function patch(partial: Partial<JobInput>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  async function save(mode: "draft" | "publish") {
    setNote("");
    setFail("");
    const found = validateJobForm(form, mode);
    setErrors(found);
    if (Object.keys(found).length) return;
    setPending(true);
    try {
      const result = await saveAddForm("/api/work/jobs/form", jobPayload(form, mode, id));
      if (!result.ok) {
        setErrors(result.errors ?? {});
        setFail(result.error);
        return;
      }
      setId(result.id);
      if (mode === "draft") {
        setNote("Qoralama saqlandi.");
        router.replace(`/ishlar/yangi?id=${result.id}`);
      } else router.push("/ishlar");
    } catch (error) {
      setFail(error instanceof Error ? error.message : "Saqlab bo‘lmadi.");
    } finally {
      setPending(false);
    }
  }

  const typeLabel = JOB_TYPES.find((item) => item.id === form.type)?.label ?? "";
  const salary = form.negotiable && !form.salaryMin && !form.salaryMax
    ? "Kelishiladi"
    : [form.salaryMin && `${moneyText(form.salaryMin)} dan`, form.salaryMax && `${moneyText(form.salaryMax)} gacha`].filter(Boolean).join(" · ") || "Maosh kiritilmagan";

  return (
    <AddPage testId="add-job" title="Vakansiya qo‘shish" sub="Ishlar" crumbs={[{ href: "/", label: "Bosh sahifa" }, { href: "/ishlar", label: "Ishlar" }, { label: "Vakansiya qo‘shish" }]}>
      <Banners note={note} error={fail} />
      <div className="af-grid">
        <div>
          <Step n={1} title="Asosiy">
            <TextField label="Lavozim" required testId="job-title" value={form.title} error={errors.title} placeholder="Masalan, Stomatolog-terapevt" onChange={(title) => patch({ title })} />
            <TextField label="Klinika nomi" required testId="job-clinic" value={form.clinic} error={errors.clinic} placeholder="Klinika nomi" onChange={(clinic) => patch({ clinic })} />
            <div className="af-row">
              <SelectField label="Shahar" required testId="job-city" value={form.city} error={errors.city} placeholder="Shaharni tanlang" options={ADD_CITIES} onChange={(city) => patch({ city })} />
              <SelectField label="Tuman" required value={form.district} error={errors.district} placeholder="Tumanni tanlang" options={ADD_DISTRICTS} onChange={(district) => patch({ district })} />
            </div>
            <TextField label="Manzil" required testId="job-address" value={form.address} error={errors.address} placeholder="Ko‘cha, uy" onChange={(address) => patch({ address })} />
          </Step>
          <Step n={2} title="Ish sharoitlari">
            <p className="af-label">Bandlik turi</p>
            <Chips options={JOB_TYPES} value={form.type} onChange={(type) => patch({ type })} />
            {errors.type ? <p className="af-err">{errors.type}</p> : null}
            <div className="af-row" style={{ alignItems: "end" }}>
              <TextField label="Maosh dan" testId="job-salary-min" value={form.salaryMin} error={errors.salaryMin} placeholder="0" onChange={(salaryMin) => patch({ salaryMin: moneyText(salaryMin) })} />
              <TextField label="Maosh gacha" testId="job-salary-max" value={form.salaryMax} error={errors.salaryMax} placeholder="0" onChange={(salaryMax) => patch({ salaryMax: moneyText(salaryMax) })} />
            </div>
            <Toggle on={form.negotiable} label="Kelishiladi" testId="job-negotiable" onChange={(negotiable) => patch({ negotiable })} />
            <p className="af-label">Tajriba talabi</p>
            <Chips options={JOB_EXPERIENCE} value={form.experienceYears} onChange={(experienceYears) => patch({ experienceYears })} />
          </Step>
          <Step n={3} title="Tavsif">
            <AreaField label="Talablar" required testId="job-req" value={form.requirements} error={errors.requirements} placeholder="Nomzoddan nima kutiladi" onChange={(requirements) => patch({ requirements })} />
            <AreaField label="Majburiyatlar" required testId="job-duties" value={form.duties} error={errors.duties} placeholder="Nimalar qilinadi" onChange={(duties) => patch({ duties })} />
            <p className="af-label">Afzalliklar</p>
            <div className="af-pills">
              {JOB_PERKS.map((item) => {
                const on = form.benefits.includes(item.id);
                return (
                  <button key={item.id} type="button" className={`af-chip${on ? " on" : ""}`} onClick={() => patch({ benefits: on ? form.benefits.filter((id) => id !== item.id) : [...form.benefits, item.id] })}>{item.label}</button>
                );
              })}
              <button type="button" className={`af-chip${other ? " on" : ""}`} onClick={() => setOther((value) => !value)}>Boshqa</button>
            </div>
            {other ? <TextField label="Boshqa afzallik" value={form.benefitNote} placeholder="Yozing" onChange={(benefitNote) => patch({ benefitNote })} /> : null}
          </Step>
          <Step n={4} title="Aloqa">
            <div className="af-row">
              <PhoneField testId="job-phone" value={form.phone} error={errors.phone} onChange={(phone) => patch({ phone })} />
              <TelegramField testId="job-tg" value={form.telegram} error={errors.telegram} onChange={(telegram) => patch({ telegram })} />
            </div>
            <TextField label="Email" testId="job-email" value={form.email} error={errors.email} placeholder="hr@klinika.uz" onChange={(email) => patch({ email })} />
            <Toggle on={form.acceptApplications} label="Saytda ariza qabul qilish" testId="job-apply" onChange={(acceptApplications) => patch({ acceptApplications })} />
            {errors.contact ? <p className="af-err" data-testid="job-contact-error">{errors.contact}</p> : null}
          </Step>
          <FormActions pending={pending} draftLabel="Saqlash (qoralama)" publishLabel="Vakansiyani e‘lon qilish" draft={() => void save("draft")} publish={() => void save("publish")} />
        </div>
        <aside className="af-side">
          <article className="af-prev" data-testid="job-preview">
            <div className="cap">
              <h3>{form.title.trim() || "Lavozim"}</h3>
              <p className="muted">{form.clinic.trim() || "Klinika nomi"}</p>
              <p className="af-price">{salary}{form.negotiable && (form.salaryMin || form.salaryMax) ? <span className="af-k">Kelishiladi</span> : null}</p>
              <p className="af-line"><MapPin size={14} /> {[form.city, form.district].filter(Boolean).join(", ") || "Shahar"}</p>
              <p className="muted">{typeLabel}{form.experienceYears === "0" ? " · Tajriba shart emas" : form.experienceYears ? ` · ${form.experienceYears} yildan` : ""}</p>
              <p className="muted">{form.requirements.trim() || "Talablar shu yerda ko‘rinadi."}</p>
              <p className="af-line">{form.acceptApplications ? "Saytda ariza ochiq" : "Ariza saytda yopiq"}</p>
              <p className="af-line">{[form.phone, form.telegram && `@${form.telegram.replace(/^@/, "")}`, form.email].filter(Boolean).join(" · ") || "Aloqa kiritilmagan"}</p>
              <button type="button" className="af-msg blue">Ariza qoldirish</button>
            </div>
          </article>
        </aside>
      </div>
    </AddPage>
  );
}

function reqFrom(description: string | undefined, label: string) {
  if (!description) return "";
  const match = description.split(/\n\n/).find((part) => part.startsWith(`${label}:`));
  return match ? match.replace(`${label}:\n`, "").trim() : "";
}
