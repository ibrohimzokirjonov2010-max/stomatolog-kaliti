"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { ADD_CITIES, ADD_DISTRICTS, USTA_HOURS, USTA_SPECIALTIES, USTA_VISIT, USTA_YEARS, emptyUsta, moneyText, saveAddForm, ustaPayload, ustaTitle, validateUsta, type UstaInput } from "@/lib/add-forms";
import { PublishNote } from "@/components/forms/PublishNote";
import { DraftBanner } from "@/components/forms/DraftBanner";
import { saveFormP0, useFormDraft } from "@/lib/forms/use-draft";
import { formatGroupedNumber } from "@/lib/format";
import { AddPage, AreaField, Banners, Checks, FormActions, LogoPicker, PhoneField, PhotoPicker, ProfileSwitch, SelectField, SourceLinks, Step, TelegramField, TextField, Toggle, type LocalPhoto } from "@/components/add-forms/widgets";
import { photosFromUrls, resolvePhotos } from "@/components/add-forms/upload-local";

type Row = {
  id: string;
  name?: string;
  title?: string;
  services?: string[];
  years?: number;
  city?: string;
  district?: string;
  address?: string;
  hours?: string;
  priceFrom?: number | null;
  priceNegotiable?: boolean;
  description?: string;
  phone?: string;
  telegram?: string;
  sourceUrl?: string | null;
  instagram?: string | null;
  photo?: string | null;
  works?: string[];
  status?: string;
};

export function UstaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [id, setId] = useState(params.get("id") ?? "");
  const [form, setForm] = useState<UstaInput>(emptyUsta());
  const [logo, setLogo] = useState<LocalPhoto | null>(null);
  const [works, setWorks] = useState<LocalPhoto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [fail, setFail] = useState("");
  const [pending, setPending] = useState(false);
  const draft = useFormDraft("draft:usta", form, !id);

  function apply(row: Row) {
    setId(row.id);
    setForm({
      name: row.name ?? "",
      services: row.services ?? [],
      years: String(row.years ?? ""),
      city: row.city ?? "",
      district: row.district ?? "",
      address: row.address ?? "",
      hours: row.hours ?? "",
      priceFrom: row.priceFrom ? formatGroupedNumber(row.priceFrom) : "",
      priceNegotiable: Boolean(row.priceNegotiable),
      description: row.description ?? "",
      phone: row.phone ?? "",
      telegram: row.telegram ?? "",
      sourceUrl: row.sourceUrl ?? "",
      instagram: row.instagram ?? "",
      photo: row.photo ?? "",
      works: row.works ?? [],
      visitMode: "",
    });
    setLogo(row.photo ? photosFromUrls([row.photo])[0] : null);
    setWorks(photosFromUrls(row.works ?? []));
  }

  useEffect(() => {
    let cancel = false;
    void fetch("/api/work/masters/profiles").then(async (res) => {
      const data = await res.json().catch(() => null) as { profiles?: Row[] } | null;
      if (cancel || !data?.profiles) return;
      setRows(data.profiles);
      const wanted = params.get("id");
      const row = data.profiles.find((item) => item.id === wanted) ?? null;
      if (row) apply(row);
    }).catch(() => undefined);
    return () => { cancel = true; };
  }, [params]);

  function patch(partial: Partial<UstaInput>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function blank() {
    setId("");
    setForm(emptyUsta());
    setLogo(null);
    setWorks([]);
    setErrors({});
    router.replace("/ustalar/yangi");
  }

  async function save(mode: "draft" | "publish") {
    setNote("");
    setFail("");
    const found = validateUsta({ ...form, photo: logo ? form.photo || "pending" : "" }, mode);
    setErrors(found);
    if (Object.keys(found).length) return;
    setPending(true);
    try {
      const photo = logo ? (await resolvePhotos([logo], "logo"))[0] ?? "" : "";
      const gallery = await resolvePhotos(works, "listing");
      const result = await saveAddForm("/api/work/masters/profiles", ustaPayload({ ...form, photo, works: gallery }, mode, id));
      if (!result.ok) {
        setErrors(result.errors ?? {});
        setFail(result.error);
        return;
      }
      setId(result.id);
      if (result.id) {
        const extra = await saveFormP0("master", result.id, { visitMode: form.visitMode, services: form.services });
        if (extra.pending) setNote("Profil saqlandi. Qo‘shimcha maydonlar migratsiya qo‘llangach yoziladi.");
      }
      if (mode === "draft") {
        setNote("Qoralama saqlandi.");
        router.replace(`/ustalar/yangi?id=${result.id}`);
      } else router.push("/ustalar");
    } catch (error) {
      setFail(error instanceof Error ? error.message : "Rasm yuklanmadi.");
    } finally {
      setPending(false);
    }
  }

  const price = form.priceFrom.trim() ? `${moneyText(form.priceFrom)} so‘mdan` : "Narx kiritilmagan";

  return (
    <AddPage testId="add-usta" minutes={2} title="Usta profili qo‘shish" sub="Xizmatlar · Ustalar" crumbs={[{ href: "/", label: "Bosh sahifa" }, { href: "/ustalar", label: "Ustalar" }, { label: "Usta profili qo‘shish" }]}>
      <Banners note={note} error={fail} />
      <DraftBanner draft={draft} onRestore={(value) => setForm(value)} />
      <ProfileSwitch
        active={id}
        onCreate={blank}
        onPick={(next) => {
          const row = rows.find((item) => item.id === next);
          if (row) {
            apply(row);
            router.replace(`/ustalar/yangi?id=${row.id}`);
          }
        }}
        items={rows.map((row) => ({ id: row.id, name: row.name || "Profil", meta: row.status === "published" ? "E’lon qilingan" : row.status === "draft" ? "Qoralama" : "Profil" }))}
      />
      <div className="af-grid">
        <div>
          <Step n={1} title="Asosiy">
            <div className="af-row" style={{ alignItems: "center" }}>
              <LogoPicker photo={logo} onChange={setLogo} />
              <TextField label="Ustaxona nomi" required testId="usta-name" value={form.name} error={errors.name} placeholder="Ustaxona nomi" onChange={(name) => patch({ name })} />
            </div>
            <p className="af-label">Xizmatlar</p>
            <Checks options={USTA_SPECIALTIES} value={form.services} error={errors.services} onChange={(services) => patch({ services })} />
            <p className="af-label">Joyiga chiqib ishlaysizmi?</p>
            <div className="af-pills">
              {USTA_VISIT.map((item) => (
                <button key={item.id} type="button" className={`af-pill${form.visitMode === item.id ? " on" : ""}`} onClick={() => patch({ visitMode: item.id })}>{item.label}</button>
              ))}
            </div>
            {errors.visitMode ? <p className="af-err">{errors.visitMode}</p> : null}
            {errors.photo ? <p className="af-err">{errors.photo}</p> : null}
            <div className="af-row">
              <SelectField label="Tajriba" value={form.years} placeholder="Tajribani tanlang" options={USTA_YEARS} onChange={(years) => patch({ years })} />
              <SelectField label="Shahar" required testId="usta-city" value={form.city} error={errors.city} placeholder="Shaharni tanlang" options={ADD_CITIES} onChange={(city) => patch({ city })} />
            </div>
            <div className="af-row">
              <SelectField label="Tuman" testId="usta-district" value={form.district} error={errors.district} placeholder="Tumanni tanlang" options={ADD_DISTRICTS} onChange={(district) => patch({ district })} />
              <TextField label="Manzil" testId="usta-address" value={form.address} error={errors.address} placeholder="Ko‘cha, uy" onChange={(address) => patch({ address })} />
            </div>
            <details className="af-extra">
              <summary>Qo‘shimcha ma’lumot</summary>
              <SelectField label="Ish vaqti" value={form.hours} placeholder="Ish vaqtini tanlang" options={USTA_HOURS} onChange={(hours) => patch({ hours })} />
              <div className="af-row" style={{ alignItems: "end" }}>
                <TextField label="Xizmat narxlari dan" testId="usta-price" value={form.priceFrom} error={errors.priceFrom} placeholder="0" onChange={(priceFrom) => patch({ priceFrom: moneyText(priceFrom) })} />
                <Toggle on={form.priceNegotiable} label="Narxlar kelishiladi" onChange={(priceNegotiable) => patch({ priceNegotiable })} />
              </div>
              <AreaField label="Tavsif" value={form.description} placeholder="Qanday ish qilasiz" onChange={(description) => patch({ description })} />
              <p className="af-label">Portfolio rasmlar</p>
              <PhotoPicker photos={works} onChange={setWorks} title="Portfolio rasmi" hint="8 tagacha" />
            </details>
          </Step>
          <Step n={3} title="Aloqa">
            <div className="af-row">
              <PhoneField testId="usta-phone" value={form.phone} error={errors.phone} onChange={(phone) => patch({ phone })} />
              <TelegramField testId="usta-tg" value={form.telegram} error={errors.telegram} onChange={(telegram) => patch({ telegram })} />
            </div>
            <TextField label="Manba yoki sayt havolasi" testId="usta-source" value={form.sourceUrl} error={errors.sourceUrl} placeholder="https://" maxLength={400} onChange={(sourceUrl) => patch({ sourceUrl })} />
            <TextField label="Instagram" testId="usta-instagram" value={form.instagram} error={errors.instagram} placeholder="@username yoki https://" maxLength={200} onChange={(instagram) => patch({ instagram })} />
          </Step>
          <PublishNote />
          <FormActions pending={pending} draftLabel="Saqlash (qoralama)" publishLabel="Profilni joylash" draft={() => void save("draft")} publish={() => void save("publish")} />
        </div>
        <aside className="af-side">
          <article className="af-prev" data-testid="usta-preview">
            <div className="af-gallery">
              {logo ? <img src={logo.preview || logo.url} alt="" /> : <span>Logo yo‘q</span>}
            </div>
            <div className="cap">
              <h3>{form.name.trim() || "Ustaxona nomi"}</h3>
              <p className="muted">{ustaTitle(form.services) || "Mutaxassislik tanlanmagan"}</p>
              <p className="af-price">{price}{form.priceNegotiable ? <span className="af-k">Kelishiladi</span> : null}</p>
              <p className="af-line"><MapPin size={14} /> {[form.city, form.district].filter(Boolean).join(", ") || "Shahar"}</p>
              <p className="muted">{form.hours || "Ish vaqti"}</p>
              <p className="muted">{form.description.trim() || "Tavsif shu yerda ko‘rinadi."}</p>
              <p className="af-line">{form.phone.trim() || "Telefon"}{form.telegram.trim() ? ` · @${form.telegram.replace(/^@/, "")}` : ""}</p>
              <SourceLinks source={form.sourceUrl} instagram={form.instagram} />
              <button type="button" className="af-msg blue">Xabar yozish</button>
            </div>
          </article>
        </aside>
      </div>
    </AddPage>
  );
}
