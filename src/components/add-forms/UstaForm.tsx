"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Award, BadgeCheck, Clock, MapPin, Phone, Send, Wallet, Wrench } from "lucide-react";
import { ADD_CITIES, ADD_DISTRICTS, USTA_HOURS, USTA_SPECIALTIES, USTA_VISIT, USTA_YEARS, emptyUsta, moneyText, saveAddForm, ustaPayload, ustaTitle, validateUsta, type UstaInput } from "@/lib/add-forms";
import { PublishNote } from "@/components/forms/PublishNote";
import { DraftBanner } from "@/components/forms/DraftBanner";
import { saveFormP0, useFormDraft } from "@/lib/forms/use-draft";
import { formatGroupedNumber } from "@/lib/format";
import { PreviewCard, AddPage, AreaField, Banners, Checks, Field, FormActions, LogoPicker, PhoneField, PhotoPicker, ProfileSwitch, SelectField, SourceLinks, Step, TelegramField, TextField, Toggle, type LocalPhoto } from "@/components/add-forms/widgets";
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

  const shots = works.map((photo) => photo.preview || photo.url);
  const price = form.priceFrom.trim() ? `${moneyText(form.priceFrom)} so‘mdan` : "Narx kiritilmagan";

  return (
    <AddPage testId="add-usta" minutes={2} title="Usta profili qo‘shish" sub="Stomatologik jihozlar ta’miri va servis bo‘yicha profilingizni yarating." crumbs={[{ href: "/", label: "Bosh sahifa" }, { href: "/ustalar", label: "Ustalar" }, { label: "Usta profili qo‘shish" }]}>
      <Banners note={note} error={fail} />
      <DraftBanner draft={draft} onRestore={(value) => setForm(value)} />
      <div className="af-grid">
        <div className="af-main">
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
          <Step n={1} title="Asosiy ma’lumotlar">
            <div className="af-logorow" style={{ alignItems: "start" }}>
              <LogoPicker photo={logo} onChange={setLogo} />
              <div>
                <TextField label="Ustaxona nomi yoki ism" required testId="usta-name" value={form.name} error={errors.name} placeholder="Masalan: Shahobiddin Servis" maxLength={100} onChange={(name) => patch({ name })} />
                <p className="af-label">Mutaxassislik (bir nechtasini tanlang) <i className="af-req">*</i></p>
                <Checks options={USTA_SPECIALTIES} value={form.services} error={errors.services} onChange={(services) => patch({ services })} />
              </div>
            </div>
            {errors.photo ? <p className="af-err">{errors.photo}</p> : null}
            <div className="af-geo" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              <SelectField label="Tajriba" value={form.years} placeholder="Tajribani tanlang" options={USTA_YEARS} onChange={(years) => patch({ years })} />
              <SelectField label="Shahar" required testId="usta-city" value={form.city} error={errors.city} placeholder="Shaharni tanlang" options={ADD_CITIES} onChange={(city) => patch({ city })} />
              <SelectField label="Tuman" testId="usta-district" value={form.district} error={errors.district} placeholder="Tumanni tanlang" options={ADD_DISTRICTS} onChange={(district) => patch({ district })} />
            </div>
            <div className="af-row-wide">
              <TextField label="Manzil" testId="usta-address" value={form.address} error={errors.address} placeholder="Ko‘cha, uy" onChange={(address) => patch({ address })} />
              <SelectField label="Ish vaqti" value={form.hours} placeholder="Ish vaqtini tanlang" options={USTA_HOURS} onChange={(hours) => patch({ hours })} />
            </div>
            <div className="af-row-wide" style={{ alignItems: "end" }}>
              <div className="af-pricebox">
                <TextField label="Xizmat narxlari (dan)" testId="usta-price" value={form.priceFrom} error={errors.priceFrom} placeholder="100 000" onChange={(priceFrom) => patch({ priceFrom: moneyText(priceFrom) })} />
                <Toggle on={form.priceNegotiable} label="Narxlar kelishiladi" onChange={(priceNegotiable) => patch({ priceNegotiable })} />
              </div>
              <Field label="Joyiga chiqib ishlaysizmi?">
                <div className="af-radios">
                  {USTA_VISIT.map((item) => (
                    <button key={item.id} type="button" className={`af-radio${form.visitMode === item.id ? " on" : ""}`} aria-pressed={form.visitMode === item.id} onClick={() => patch({ visitMode: item.id })}><i />{item.label}</button>
                  ))}
                </div>
              </Field>
            </div>
            {errors.visitMode ? <p className="af-err">{errors.visitMode}</p> : null}
            <AreaField label="Tavsif" value={form.description} placeholder="Stomatologik jihozlar ta’miri va texnik xizmat ko‘rsatish. Unit, kompressor, rentgen, avtoklav va boshqa jihozlar..." onChange={(description) => patch({ description })} />
            <p className="af-label">Portfolio rasmlar</p>
            <PhotoPicker compact photos={works} onChange={setWorks} max={8} title="Rasm yuklash" hint="JPG, PNG (maks. 8 ta)" />
          </Step>
          <Step n={2} title="Aloqa ma’lumotlari">
            <div className="af-row">
              <PhoneField testId="usta-phone" value={form.phone} error={errors.phone} onChange={(phone) => patch({ phone })} />
              <TelegramField testId="usta-tg" value={form.telegram} error={errors.telegram} onChange={(telegram) => patch({ telegram })} />
            </div>
            <TextField label="Manba yoki sayt havolasi" testId="usta-source" value={form.sourceUrl} error={errors.sourceUrl} placeholder="https://" maxLength={400} onChange={(sourceUrl) => patch({ sourceUrl })} />
            <TextField label="Instagram" testId="usta-instagram" value={form.instagram} error={errors.instagram} placeholder="@username yoki https://" maxLength={200} onChange={(instagram) => patch({ instagram })} />
          </Step>
          <PublishNote />
          <FormActions pending={pending} draftLabel="Saqlash (qoralama)" publishLabel="Profilni e’lon qilish" draft={() => void save("draft")} publish={() => void save("publish")} />
        </div>
        <PreviewCard title="Profil ko‘rinishi (oldindan)" sub="Profilingiz shu tarzda ko‘rinadi." testId="usta-preview">
          <div className="af-cover">
            <div className="af-gallery">
              {shots[0] ? <img src={shots[0]} alt="" /> : <span>Portfolio rasmi yo‘q</span>}
            </div>
            <span className="logo">{logo ? <img src={logo.preview || logo.url} alt="" /> : <Wrench size={26} />}</span>
          </div>
          <div className="cap">
            <h3 className="af-name">{form.name.trim() || "Ustaxona nomi"}<BadgeCheck size={16} color="#0F766E" /></h3>
            <p className="muted">{ustaTitle(form.services) || "Mutaxassislik tanlanmagan"}</p>
            <p className="af-line"><MapPin size={14} /> {[form.city, form.district].filter(Boolean).join(", ") || "Shahar"}</p>
            <div className="af-btns">
              <span className="blue"><Send size={13} /> Telegram orqali bog‘lanish</span>
              <span><Phone size={13} /> {form.phone.trim() || "Telefon"}</span>
            </div>
            {form.services.length ? (
              <div className="af-chiprow">
                {form.services.map((item) => <span key={item}>{USTA_SPECIALTIES.find((spec) => spec.id === item)?.label ?? item}</span>)}
              </div>
            ) : null}
            <div className="af-stats">
              <div><Award size={14} /><span><b>{USTA_YEARS.find((item) => item.id === form.years)?.label ?? "—"}</b>Tajriba</span></div>
              <div><Clock size={14} /><span><b>{form.hours || "—"}</b>Ish vaqti</span></div>
              <div><Wallet size={14} /><span><b>{form.priceNegotiable && !form.priceFrom.trim() ? "Kelishiladi" : price}</b>Narxlar</span></div>
            </div>
            <p className="af-sub">Tavsif</p>
            <p className="muted">{form.description.trim() || "Tavsif shu yerda ko‘rinadi."}</p>
            {shots.length ? (
              <>
                <p className="af-sub">Portfolio <span>{shots.length} ta rasm</span></p>
                <div className="af-thumbs">
                  {shots.slice(0, 4).map((src, index) => (
                    <span key={src}>
                      <img src={src} alt="" />
                      {index === 3 && shots.length > 4 ? <b>+{shots.length - 3}</b> : null}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
            <SourceLinks source={form.sourceUrl} instagram={form.instagram} />
          </div>
        </PreviewCard>
      </div>
    </AddPage>
  );
}
