"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { ADD_CITIES, ADD_DISTRICTS, ELON_CATEGORIES, ELON_WEAR, elonPayload, emptyElon, moneyText, saveAddForm, validateElon, type ElonInput } from "@/lib/add-forms";
import { PublishNote } from "@/components/forms/PublishNote";
import { DraftBanner } from "@/components/forms/DraftBanner";
import { saveFormP0, useFormDraft } from "@/lib/forms/use-draft";
import { formatGroupedNumber } from "@/lib/format";
import { AddPage, AreaField, Banners, Field, FormActions, PhoneField, PhotoPicker, PreviewCard, SelectField, SourceLinks, Step, TelegramField, TextField, Toggle, type LocalPhoto } from "@/components/add-forms/widgets";
import { photosFromUrls, resolvePhotos } from "@/components/add-forms/upload-local";

export function ElonForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [id, setId] = useState(params.get("id") ?? "");
  const [form, setForm] = useState<ElonInput>(emptyElon());
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [wear, setWear] = useState<(typeof ELON_WEAR)[number]["id"]>("yangi");
  const draft = useFormDraft("draft:elon", form, !id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [fail, setFail] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const edit = params.get("id");
    if (!edit) return;
    let cancel = false;
    void fetch("/api/work/classifieds/mine").then(async (res) => {
      const data = await res.json().catch(() => null) as { items?: ElonRow[] } | null;
      const row = data?.items?.find((item) => item.id === edit);
      if (!row || cancel) return;
      setId(row.id);
      setForm({
        title: row.title ?? "",
        category: row.category ?? "",
        condition: row.condition === "ishlatilgan" ? "ishlatilgan" : "yangi",
        price: row.price ? formatGroupedNumber(row.price) : "",
        negotiable: Boolean(row.negotiable),
        description: row.description ?? "",
        city: row.city ?? "",
        district: row.district ?? "",
        phone: row.phone ?? "",
        telegram: row.telegram ?? "",
        sourceUrl: row.sourceUrl ?? "",
        instagram: row.instagram ?? "",
        photos: row.photos ?? [],
      });
      setWear(row.condition === "ishlatilgan" ? "alo" : "yangi");
      setPhotos(photosFromUrls(row.photos ?? []));
    }).catch(() => undefined);
    return () => { cancel = true; };
  }, [params]);

  function patch(partial: Partial<ElonInput>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  async function save(mode: "draft" | "publish") {
    setNote("");
    setFail("");
    const next = { ...form, photos: photos.map((photo) => photo.url).filter(Boolean) };
    const found = validateElon(next, mode);
    setErrors(found);
    if (Object.keys(found).length) return;
    setPending(true);
    try {
      const urls = await resolvePhotos(photos, "listing");
      const result = await saveAddForm("/api/work/classifieds/mine", elonPayload({ ...next, photos: urls }, mode, id));
      if (!result.ok) {
        setErrors(result.errors ?? {});
        setFail(result.error);
        return;
      }
      setId(result.id);
      if (result.id) {
        const extra = await saveFormP0("classified", result.id, { wear });
        if (extra.pending) setNote("E‘lon saqlandi. Qo‘shimcha maydonlar migratsiya qo‘llangach yoziladi.");
      }
      if (mode === "draft") {
        setNote("Qoralama saqlandi.");
        router.replace(`/elonlar/yangi?id=${result.id}`);
      } else router.push("/elonlar");
    } catch (error) {
      setFail(error instanceof Error ? error.message : "Rasm yuklanmadi.");
    } finally {
      setPending(false);
    }
  }

  const priceLabel = form.negotiable && !form.price.trim() ? "Kelishiladi" : form.price.trim() ? `${moneyText(form.price)} so‘m` : "Narx kiritilmagan";
  const shots = photos.map((photo) => photo.preview || photo.url);
  const wearLabel = ELON_WEAR.find((item) => item.id === wear)?.label ?? "Yangi";
  const linkError = Boolean(errors.sourceUrl || errors.instagram);

  return (
    <AddPage testId="add-elon" minutes={2} title="Yangi e‘lon qo‘shish" sub="Stomatologik jihoz, material, xizmat yoki boshqa e’loningizni joylashtiring." crumbs={[{ href: "/", label: "Bosh sahifa" }, { href: "/elonlar", label: "E‘lonlar" }, { label: "Yangi e‘lon qo‘shish" }]}>
      <Banners note={note} error={fail} />
      <DraftBanner draft={draft} onRestore={(value) => setForm(value)} />
      <div className="af-grid">
        <div className="af-main">
          <Step n={1} title="Rasmlar" hint="Jami 8 tagacha rasm yuklashingiz mumkin. Birinchi rasm asosiy rasm sifatida tanlanadi.">
            <PhotoPicker photos={photos} onChange={setPhotos} title="Rasm yuklash" hint="yoki sudrab tashlang · JPG, PNG (maks. 8 ta)" />
            {errors.photos ? <p className="af-err">{errors.photos}</p> : null}
          </Step>
          <Step n={2} title="Asosiy ma’lumotlar">
            <div className="af-row-wide">
              <TextField label="Sarlavha" required testId="elon-title" value={form.title} error={errors.title} placeholder="Masalan: Yangi stomatologik unit, A’zo yil kafolat bilan" maxLength={100} onChange={(title) => patch({ title })} />
              <SelectField label="Kategoriya" required testId="elon-category" value={form.category} error={errors.category} placeholder="Kategoriyani tanlang" options={ELON_CATEGORIES} onChange={(category) => patch({ category })} />
            </div>
            <div className="af-row-wide" style={{ alignItems: "end" }}>
              <Field label="Holati" required>
                <div className="af-radios">
                  {ELON_WEAR.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`af-radio${wear === item.id ? " on" : ""}`}
                      aria-pressed={wear === item.id}
                      title={item.label}
                      onClick={() => {
                        setWear(item.id);
                        patch({ condition: item.condition });
                      }}
                    >
                      <i />
                      {shortWear(item.label)}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="af-pricebox">
                <TextField label="Narx (so‘m)" testId="elon-price" value={form.price} error={errors.price} placeholder="Masalan: 25 000 000" onChange={(price) => patch({ price: moneyText(price) })} />
                <Toggle on={form.negotiable} label="Kelishiladi" testId="elon-negotiable" onChange={(negotiable) => patch({ negotiable })} />
              </div>
            </div>
            <AreaField label="Tavsif" testId="elon-desc" value={form.description} error={errors.description} placeholder="Mahsulot holati, xususiyatlari, komplektatsiya, kafolat va boshqa ma’lumotlarni yozing..." onChange={(description) => patch({ description })} />
            <div className="af-geo">
              <SelectField label="Shahar" required testId="elon-city" value={form.city} error={errors.city} placeholder="Shaharni tanlang" options={ADD_CITIES} onChange={(city) => patch({ city })} />
              <SelectField label="Tuman" testId="elon-district" value={form.district} placeholder="Tumanni tanlang" options={ADD_DISTRICTS} onChange={(district) => patch({ district })} />
              <div className="af-stack">
                <PhoneField label="Aloqa ma’lumotlari" testId="elon-phone" value={form.phone} error={errors.phone} onChange={(phone) => patch({ phone })} />
                <TelegramField bare testId="elon-tg" value={form.telegram} error={errors.telegram} onChange={(telegram) => patch({ telegram })} />
              </div>
            </div>
            <details className="af-extra" open={linkError || Boolean(form.sourceUrl || form.instagram)}>
              <summary>Manba havolasi yoki Instagram</summary>
              <div className="af-row">
                <TextField label="Manba yoki sayt havolasi" testId="elon-source" value={form.sourceUrl} error={errors.sourceUrl} placeholder="https://" maxLength={400} onChange={(sourceUrl) => patch({ sourceUrl })} />
                <TextField label="Instagram" testId="elon-instagram" value={form.instagram} error={errors.instagram} placeholder="@username yoki https://" maxLength={200} onChange={(instagram) => patch({ instagram })} />
              </div>
            </details>
          </Step>
          <PublishNote />
          <FormActions pending={pending} draftLabel="Saqlash (qoralama)" publishLabel="E‘lon berish" draft={() => void save("draft")} publish={() => void save("publish")} />
        </div>
        <PreviewCard title="E’lon ko‘rinishi (oldindan)" sub="E’loningiz shunday ko‘rinishda bo‘ladi." testId="elon-preview">
          <div className="af-gallery">
            {shots[0] ? <img src={shots[0]} alt="" /> : <span>Rasm yo‘q</span>}
          </div>
          {shots.length > 1 ? (
            <div className="af-thumbs">
              {shots.slice(0, 4).map((src, index) => (
                <span key={src}>
                  <img src={src} alt="" />
                  {index === 3 && shots.length > 4 ? <b>+{shots.length - 3}</b> : null}
                </span>
              ))}
            </div>
          ) : null}
          <div className="cap">
            <h3>{form.title.trim() || "Sarlavha"}</h3>
            <div className="af-pricerow">
              <p className="af-price">{priceLabel}{form.negotiable && form.price.trim() ? <span className="af-k">Kelishiladi</span> : null}</p>
              <span className="af-tag">{wearLabel}</span>
            </div>
            <p className="af-line"><MapPin size={14} /> {[form.city, form.district].filter(Boolean).join(", ") || "Shahar"}<span className="when">Bugun</span></p>
            <p className="muted">{form.description.trim() || "Tavsif shu yerda ko‘rinadi."}</p>
            <div className="af-contact">
              <p><Phone size={15} className="ph" /> <span>{form.phone.trim() || "Telefon"}</span></p>
              {form.telegram.trim() ? <p><span className="tg"><Send size={11} /></span> <span>@{form.telegram.replace(/^@/, "")}</span></p> : null}
            </div>
            <SourceLinks source={form.sourceUrl} instagram={form.instagram} />
            <button type="button" className="af-msg blue"><MessageCircle size={16} /> Xabar yozish</button>
          </div>
        </PreviewCard>
      </div>
    </AddPage>
  );
}

/** "Ishlatilgan — a’lo" → "A’lo" so the four options fit on one row like the design's two. */
function shortWear(label: string) {
  const tail = label.replace("Ishlatilgan — ", "");
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

type ElonRow = {
  id: string;
  title?: string;
  category?: string;
  condition?: string;
  price?: number | null;
  negotiable?: boolean;
  description?: string;
  city?: string;
  district?: string;
  phone?: string;
  telegram?: string;
  sourceUrl?: string | null;
  instagram?: string | null;
  photos?: string[];
};
