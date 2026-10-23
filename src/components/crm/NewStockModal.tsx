"use client";
/* eslint-disable @next/next/no-img-element -- local preview of the uploaded photo */

import { useState } from "react";
import { Bell, ImagePlus, LayoutGrid, MapPin, Save, UserRound } from "lucide-react";
import { CmDate, CmDialog, CmError, CmField, CmSelect, CmSwitch, digitsOf, dotToIso } from "@/components/crm/crm-form-kit";
import { stockCategories, type StockItem } from "@/data/crm";
import { fileToCompressedDataUrl } from "@/lib/seller-work";
import { formatGroupedNumber } from "@/lib/format";

const UNITS = ["dona", "quti", "to‘plam", "shprits", "kartrij", "paket", "ml", "gramm"];
const PLACES = ["Asosiy ombor", "Kabinet 1", "Kabinet 2", "Sterilizatsiya xonasi", "Muzlatgich", "Qabulxona"];

export function NewStockModal({ suppliers, onClose, onSave }: { suppliers: string[]; onClose: () => void; onSave: (item: StockItem) => void }) {
  const [photo, setPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");
  const [min, setMin] = useState("");
  const [alert, setAlert] = useState(true);
  const [price, setPrice] = useState(0);
  const [supplier, setSupplier] = useState("");
  const [expiry, setExpiry] = useState("");
  const [batch, setBatch] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onPhoto(file: File | undefined) {
    setPhotoError("");
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type) && !/\.(jpe?g|png)$/i.test(file.name)) {
      setPhotoError("Faqat JPG yoki PNG");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Fayl 5 MB dan katta");
      return;
    }
    try {
      setPhoto(await fileToCompressedDataUrl(file, 480, 0.82));
    } catch {
      setPhotoError("Rasmni o‘qib bo‘lmadi");
    }
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Mahsulot nomini kiriting";
    if (!category) next.category = "Kategoriyani tanlang";
    if (qty === "") next.qty = "Miqdorni kiriting";
    if (!unit) next.unit = "Birlikni tanlang";
    if (min === "") next.min = "Minimal zahirani kiriting";
    if (!price) next.price = "Narxni kiriting";
    if (!supplier) next.supplier = "Yetkazib beruvchini tanlang";
    if (expiry && !dotToIso(expiry)) next.expiry = "Sana DD.MM.YYYY ko‘rinishida bo‘lsin";
    setErrors(next);
    if (Object.keys(next).length) return;
    const stamp = Date.now();
    onSave({
      id: `st-user-${stamp}`,
      name: name.trim(),
      detail: batch.trim() ? `Partiya: ${batch.trim()}` : "",
      category,
      sku: `SKU-${String(stamp).slice(-5)}`,
      qty: Number(qty) || 0,
      min: Number(min) || 0,
      expiry,
      supplier,
      status: "mavjud",
      image: photo,
      price,
      unit,
      batch: batch.trim(),
      location,
      note: note.trim(),
      alert,
    });
  }

  return (
    <CmDialog
      testId="stock-modal"
      title="Omborga mahsulot qo‘shish"
      subtitle="Klinika omboriga yangi mahsulot qo‘shing"
      width={560}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cm-ghost" data-testid="stock-cancel" onClick={onClose}>Bekor qilish</button>
          <button type="button" className="cm-go" data-testid="stock-save" style={{ flex: "0 1 274px" }} onClick={submit}><Save /> Saqlash</button>
        </>
      }
    >
      <div className="cm-st-top">
        <CmField label="Mahsulot rasmi">
          <label className="cm-upload">
            {photo ? <img src={photo} alt="Mahsulot rasmi" /> : (<><ImagePlus /><b>Rasm yuklang</b><small>JPG, PNG (maks. 5 MB)</small></>)}
            <input
              type="file"
              className="cm-native"
              data-testid="stock-photo"
              aria-label="Mahsulot rasmi"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              onChange={(event) => {
                void onPhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {photoError ? <span className="cm-upload-err">{photoError}</span> : null}
        </CmField>
        <div className="cm-grid" style={{ gridTemplateColumns: "1fr" }}>
          <CmField label="Mahsulot nomi" req>
            <input className={`cm-input${errors.name ? " bad" : ""}`} data-testid="stock-name" aria-label="Mahsulot nomi" placeholder="Mahsulot nomini kiriting" value={name} onChange={(event) => { setName(event.target.value); clearError("name"); }} />
            <CmError text={errors.name} />
          </CmField>
          <CmField label="Kategoriya" req>
            <CmSelect label="Kategoriya" testId="stock-category-new" icon={<LayoutGrid />} value={category} placeholder="Kategoriyani tanlang" options={stockCategories} bad={Boolean(errors.category)} onChange={(value) => { setCategory(value); clearError("category"); }} />
            <CmError text={errors.category} />
          </CmField>
        </div>
      </div>

      <div className="cm-st-grid">
        <CmField label="Miqdori" req>
          <input className={`cm-input${errors.qty ? " bad" : ""}`} data-testid="stock-qty" aria-label="Miqdori" inputMode="numeric" placeholder="Miqdor kiriting" value={qty} onChange={(event) => { setQty(digitsOf(event.target.value).slice(0, 6)); clearError("qty"); }} />
          <CmError text={errors.qty} />
        </CmField>
        <CmField label="O‘lchov birligi" req>
          <CmSelect label="O‘lchov birligi" testId="stock-unit" value={unit} placeholder="Birlikni tanlang" options={UNITS} bad={Boolean(errors.unit)} onChange={(value) => { setUnit(value); clearError("unit"); }} />
          <CmError text={errors.unit} />
        </CmField>
        <CmField label="Minimal zahira" req>
          <input className={`cm-input${errors.min ? " bad" : ""}`} data-testid="stock-min" aria-label="Minimal zahira" inputMode="numeric" placeholder="Minimal miqdor" value={min} onChange={(event) => { setMin(digitsOf(event.target.value).slice(0, 6)); clearError("min"); }} />
          <CmError text={errors.min} />
        </CmField>
        <div className="cm-alert">
          <Bell />
          <div>
            <b>Zaxira haqida ogohlantirish</b>
            <small>Miqdor minimal zahiradan kam bo‘lsa, “Kam zaxira” ro‘yxatida ko‘rsatiladi.</small>
          </div>
          <CmSwitch on={alert} onChange={setAlert} label="Zaxira haqida ogohlantirish" testId="stock-alert" />
        </div>
        <CmField label="Narxi (so‘m)" req>
          <input className={`cm-input${errors.price ? " bad" : ""}`} data-testid="stock-price" aria-label="Narxi" inputMode="numeric" placeholder="Narx kiriting" value={price ? formatGroupedNumber(price) : ""} onChange={(event) => { setPrice(Math.min(999_999_999, Number(digitsOf(event.target.value)) || 0)); clearError("price"); }} />
          <CmError text={errors.price} />
        </CmField>
        <CmField label="Yetkazib beruvchi" req>
          <CmSelect label="Yetkazib beruvchi" testId="stock-supplier-new" icon={<UserRound />} value={supplier} placeholder="Yetkazib beruvchini tanlang" options={suppliers} bad={Boolean(errors.supplier)} onChange={(value) => { setSupplier(value); clearError("supplier"); }} />
          <CmError text={errors.supplier} />
        </CmField>
        <CmField label="Yaroqlilik muddati">
          <CmDate label="Yaroqlilik muddati" testId="stock-expiry" leadIcon value={expiry} bad={Boolean(errors.expiry)} onChange={(value) => { setExpiry(value); clearError("expiry"); }} />
          <CmError text={errors.expiry} />
        </CmField>
        <CmField label="Partiya raqami" hint="(ixtiyoriy)">
          <input className="cm-input" data-testid="stock-batch" aria-label="Partiya raqami" placeholder="Partiya raqamini kiriting" value={batch} onChange={(event) => setBatch(event.target.value.slice(0, 40))} />
        </CmField>
        <CmField label="Saqlash joyi" hint="(ixtiyoriy)" className="wide">
          <CmSelect label="Saqlash joyi" testId="stock-location" icon={<MapPin />} value={location} placeholder="Saqlash joyini tanlang" options={PLACES} onChange={setLocation} />
        </CmField>
        <CmField label="Izoh" hint="(ixtiyoriy)" className="wide">
          <textarea className="cm-area" data-testid="stock-note" aria-label="Izoh" maxLength={500} placeholder="Qo‘shimcha eslatmalar..." value={note} onChange={(event) => setNote(event.target.value.slice(0, 500))} />
          <span className="cm-count">{note.length}/500</span>
        </CmField>
      </div>
    </CmDialog>
  );
}
