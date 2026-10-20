"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { ADD_CITIES, ADD_DISTRICTS, LAB_DAY_LABEL, LAB_DAYS, LAB_MATERIALS, LAB_SPECIALTIES, emptyLab, labPayload, moneyText, saveAddForm, validateLabForm, type LabInput, type LabRow } from "@/lib/add-forms";
import { AddPage, Banners, Checks, FormActions, LogoPicker, PhoneField, PhotoPicker, ProfileSwitch, SelectField, Step, TelegramField, TextField, Toggle, type LocalPhoto } from "@/components/add-forms/widgets";
import { photosFromUrls, resolvePhotos } from "@/components/add-forms/upload-local";

type Stored = {
  id: string;
  name?: string;
  services?: string[];
  materials?: string[];
  city?: string;
  district?: string;
  address?: string;
  weekdays?: string[];
  openTime?: string | null;
  closeTime?: string | null;
  delivery?: boolean;
  phone?: string;
  telegram?: string;
  email?: string;
  logo?: string | null;
  photos?: string[];
  priceItems?: { id?: string; service?: string; title?: string; material?: string; price?: number | null; days?: number | null; daysMin?: number | null; tags?: string[] }[];
  status?: string;
};

export function LabForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [saved, setSaved] = useState<Stored[]>([]);
  const [id, setId] = useState(params.get("id") ?? "");
  const [form, setForm] = useState<LabInput>(emptyLab());
  const [logo, setLogo] = useState<LocalPhoto | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [fail, setFail] = useState("");
  const [pending, setPending] = useState(false);

  function apply(row: Stored) {
    setId(row.id);
    const rows: LabRow[] = (row.priceItems ?? []).map((item, index) => ({
      key: item.id || `row-${index}`,
      service: item.service || item.title || "",
      material: item.material || item.tags?.[0] || "",
      price: item.price ? String(item.price) : "",
      days: item.days || item.daysMin ? String(item.days || item.daysMin) : "",
    }));
    setForm({
      ...emptyLab(),
      name: row.name ?? "",
      services: row.services ?? [],
      materials: row.materials ?? [],
      rows: rows.length ? rows : emptyLab().rows,
      city: row.city ?? "",
      district: row.district ?? "",
      address: row.address ?? "",
      weekdays: row.weekdays?.length ? row.weekdays : emptyLab().weekdays,
      openTime: row.openTime || "09:00",
      closeTime: row.closeTime || "18:00",
      delivery: Boolean(row.delivery),
      phone: row.phone ?? "",
      telegram: row.telegram ?? "",
      email: row.email ?? "",
      logo: row.logo ?? "",
      photos: row.photos ?? [],
    });
    setLogo(row.logo ? photosFromUrls([row.logo])[0] : null);
    setPhotos(photosFromUrls(row.photos ?? []));
  }

  useEffect(() => {
    let cancel = false;
    void fetch("/api/work/labs/profiles").then(async (res) => {
      const data = await res.json().catch(() => null) as { profiles?: Stored[] } | null;
      if (cancel || !data?.profiles) return;
      setSaved(data.profiles);
      const row = data.profiles.find((item) => item.id === params.get("id"));
      if (row) apply(row);
    }).catch(() => undefined);
    return () => { cancel = true; };
  }, [params]);

  function patch(partial: Partial<LabInput>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function blank() {
    setId("");
    setForm(emptyLab());
    setLogo(null);
    setPhotos([]);
    setErrors({});
    router.replace("/laboratoriya/yangi");
  }

  async function save(mode: "draft" | "publish") {
    setNote("");
    setFail("");
    const found = validateLabForm(form, mode);
    setErrors(found);
    if (Object.keys(found).length) return;
    setPending(true);
    try {
      const logoUrl = logo ? (await resolvePhotos([logo], "logo"))[0] ?? "" : "";
      const gallery = await resolvePhotos(photos, "lab");
      const result = await saveAddForm("/api/work/labs/profiles", labPayload({ ...form, logo: logoUrl, photos: gallery }, mode, id));
      if (!result.ok) {
        setErrors(result.errors ?? {});
        setFail(result.error);
        return;
      }
      setId(result.id);
      if (mode === "draft") {
        setNote("Qoralama saqlandi.");
        router.replace(`/laboratoriya/yangi?id=${result.id}`);
      } else router.push("/laboratoriya");
    } catch (error) {
      setFail(error instanceof Error ? error.message : "Rasm yuklanmadi.");
    } finally {
      setPending(false);
    }
  }

  const names = form.services.map((item) => LAB_SPECIALTIES.find((spec) => spec.id === item)?.label ?? item).join(", ");

  return (
    <AddPage testId="add-lab" title="Laboratoriya qo‘shish" sub="Xizmatlar · Laboratoriyalar" crumbs={[{ href: "/", label: "Bosh sahifa" }, { href: "/laboratoriya", label: "Laboratoriyalar" }, { label: "Laboratoriya qo‘shish" }]}>
      <Banners note={note} error={fail} />
      <ProfileSwitch
        active={id}
        onCreate={blank}
        onPick={(next) => {
          const row = saved.find((item) => item.id === next);
          if (row) {
            apply(row);
            router.replace(`/laboratoriya/yangi?id=${row.id}`);
          }
        }}
        items={saved.map((row) => ({ id: row.id, name: row.name || "Laboratoriya", meta: row.status === "published" ? "E’lon qilingan" : row.status === "draft" ? "Qoralama" : "Profil" }))}
      />
      <div className="af-grid">
        <div>
          <Step n={1} title="Asosiy">
            <div className="af-row" style={{ alignItems: "center" }}>
              <LogoPicker photo={logo} onChange={setLogo} />
              <TextField label="Laboratoriya nomi" required testId="lab-name" value={form.name} error={errors.name} placeholder="Laboratoriya nomi" onChange={(name) => patch({ name })} />
            </div>
            <p className="af-label">Mutaxassislik</p>
            <Checks options={LAB_SPECIALTIES} value={form.services} error={errors.services} onChange={(services) => patch({ services })} />
          </Step>
          <Step n={2} title="Xizmatlar va narxlar">
            <table className="af-table">
              <thead><tr><th>Xizmat turi</th><th>Material</th><th>Narx</th><th>Muddat</th><th /></tr></thead>
              <tbody>
                {form.rows.map((row) => (
                  <tr key={row.key}>
                    <td><input data-testid="lab-service" value={row.service} placeholder="Krona" onChange={(event) => patch({ rows: form.rows.map((item) => item.key === row.key ? { ...item, service: event.target.value } : item) })} /></td>
                    <td><input value={row.material} placeholder="Zirkon" onChange={(event) => patch({ rows: form.rows.map((item) => item.key === row.key ? { ...item, material: event.target.value } : item) })} /></td>
                    <td><input value={row.price} placeholder="0" onChange={(event) => patch({ rows: form.rows.map((item) => item.key === row.key ? { ...item, price: moneyText(event.target.value) } : item) })} /></td>
                    <td><input value={row.days} placeholder="kun" onChange={(event) => patch({ rows: form.rows.map((item) => item.key === row.key ? { ...item, days: event.target.value.replace(/\D/g, "").slice(0, 2) } : item) })} /></td>
                    <td><button type="button" className="af-add" aria-label="Qatorni o‘chirish" onClick={() => patch({ rows: form.rows.filter((item) => item.key !== row.key).length ? form.rows.filter((item) => item.key !== row.key) : emptyLab().rows })}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {errors.rows ? <p className="af-err">{errors.rows}</p> : null}
            <button type="button" className="af-add" onClick={() => patch({ rows: [...form.rows, { key: `row-${Date.now()}`, service: "", material: "", price: "", days: "" }] })}>+ Yana xizmat qo‘shish</button>
            <p className="af-label">Materiallar</p>
            <Checks options={LAB_MATERIALS} value={form.materials} onChange={(materials) => patch({ materials })} />
          </Step>
          <Step n={3} title="Manzil va ish tartibi">
            <div className="af-row">
              <SelectField label="Shahar" required testId="lab-city" value={form.city} error={errors.city} placeholder="Shaharni tanlang" options={ADD_CITIES} onChange={(city) => patch({ city })} />
              <SelectField label="Tuman" required value={form.district} error={errors.district} placeholder="Tumanni tanlang" options={ADD_DISTRICTS} onChange={(district) => patch({ district })} />
            </div>
            <TextField label="Manzil" required testId="lab-address" value={form.address} error={errors.address} placeholder="Ko‘cha, uy" onChange={(address) => patch({ address })} />
            <p className="af-label">Ish kunlari</p>
            <div className="af-pills">
              {LAB_DAYS.map((day) => (
                <button key={day} type="button" className={`af-chip${form.weekdays.includes(day) ? " on" : ""}`} onClick={() => patch({ weekdays: form.weekdays.includes(day) ? form.weekdays.filter((item) => item !== day) : [...form.weekdays, day] })}>{LAB_DAY_LABEL[day]}</button>
              ))}
            </div>
            {errors.weekdays ? <p className="af-err">{errors.weekdays}</p> : null}
            <div className="af-row">
              <TextField label="Ochilish" value={form.openTime} onChange={(openTime) => patch({ openTime })} />
              <TextField label="Yopilish" value={form.closeTime} onChange={(closeTime) => patch({ closeTime })} />
            </div>
            <Toggle on={form.delivery} label="Yetkazib berish" testId="lab-delivery" onChange={(delivery) => patch({ delivery })} />
          </Step>
          <Step n={4} title="Galereya">
            <PhotoPicker photos={photos} onChange={setPhotos} title="Galereya rasmi" hint="8 tagacha" />
          </Step>
          <Step n={5} title="Aloqa">
            <div className="af-row">
              <PhoneField required testId="lab-phone" value={form.phone} error={errors.phone} onChange={(phone) => patch({ phone })} />
              <TelegramField value={form.telegram} onChange={(telegram) => patch({ telegram })} />
            </div>
            <TextField label="Email" testId="lab-email" value={form.email} error={errors.email} placeholder="lab@example.com" onChange={(email) => patch({ email })} />
          </Step>
          <FormActions pending={pending} draftLabel="Saqlash (qoralama)" publishLabel="Laboratoriyani e‘lon qilish" draft={() => void save("draft")} publish={() => void save("publish")} />
        </div>
        <aside className="af-side">
          <article className="af-prev" data-testid="lab-preview">
            <div className="af-gallery">{logo ? <img src={logo.preview || logo.url} alt="" /> : photos[0] ? <img src={photos[0].preview || photos[0].url} alt="" /> : <span>Rasm yo‘q</span>}</div>
            <div className="cap">
              <h3>{form.name.trim() || "Laboratoriya nomi"}</h3>
              <p className="muted">{names || "Mutaxassislik tanlanmagan"}</p>
              <p className="af-line"><MapPin size={14} /> {[form.city, form.district, form.address].filter(Boolean).join(", ") || "Manzil"}</p>
              <p className="muted">{form.delivery ? "Yetkazib berish bor" : "Yetkazib berish yo‘q"} · {form.openTime}–{form.closeTime}</p>
              {form.rows.filter((row) => row.service.trim()).slice(0, 4).map((row) => (
                <p key={row.key} className="af-line">{row.service}{row.price ? ` · ${row.price} so‘m` : ""}{row.days ? ` · ${row.days} kun` : ""}</p>
              ))}
              <p className="af-line">{form.phone.trim() || "Telefon"}{form.email.trim() ? ` · ${form.email.trim()}` : ""}</p>
              <button type="button" className="af-msg blue">Buyurtma berish</button>
            </div>
          </article>
        </aside>
      </div>
    </AddPage>
  );
}
