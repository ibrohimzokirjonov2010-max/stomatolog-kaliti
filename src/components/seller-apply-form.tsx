"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, CreditCard, FileText, Loader2, Package, Paperclip, ShieldCheck, Store, X } from "lucide-react";
import { SellerApplyDesktopView } from "@/components/seller-apply-desktop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSellerWork } from "@/components/seller-provider";
import { shopCities, type Shop } from "@/data/shops";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { uploadWithTicket } from "@/lib/image-upload";
import { cn } from "@/lib/utils";
import { MARKETPLACE_COMMISSION_PERCENT } from "@/lib/commission";
import type { SellerApplicationInput, SellerDoc } from "@/lib/seller-work";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-[#1a1d26]">{label}</span>
      {hint ? <span className="mt-0.5 block text-[11.5px] leading-snug text-[#8b93a7]">{hint}</span> : null}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function emptyApplicationForm(seed?: Partial<Shop>) {
  return {
    ownerName: seed?.ownerName ?? "",
    phone: seed?.phone ?? "",
    shopName: seed?.name ?? "",
    city: seed?.city ?? "Toshkent",
    bio: seed?.bio ?? "",
    telegram: seed?.telegram ?? "",
    instagram: seed?.instagram ?? "",
    facebook: seed?.facebook ?? "",
    website: seed?.website ?? "",
    address: seed?.address ?? "",
    yearsInBusiness: seed?.yearsInBusiness != null ? String(seed.yearsInBusiness) : "",
    stir: "",
  };
}

export type ApplyFormState = ReturnType<typeof emptyApplicationForm>;

export function toApplicationInput(form: ApplyFormState, docs: SellerDoc[] = []): SellerApplicationInput {
  const years = form.yearsInBusiness.trim() ? Number(form.yearsInBusiness.replace(/\D/g, "")) : undefined;
  return {
    ownerName: form.ownerName,
    phone: form.phone,
    shopName: form.shopName,
    city: form.city,
    bio: form.bio,
    telegram: form.telegram || undefined,
    instagram: form.instagram || undefined,
    facebook: form.facebook || undefined,
    website: form.website || undefined,
    address: form.address || undefined,
    yearsInBusiness: years != null && Number.isFinite(years) ? years : undefined,
    stir: form.stir.replace(/\D/g, "") || undefined,
    docs,
  };
}

export function SellerApplyForm({
  mode = "create",
  initial,
  onSuccess,
  submitLabel,
  variant = "default",
}: {
  variant?: "default" | "desktop";
  mode?: "create" | "edit" | "reapply";
  initial?: Partial<Shop>;
  onSuccess?: (shop: Shop) => void;
  submitLabel?: string;
}) {
  const router = useRouter();
  const { register, updateApplication, reapply } = useSellerWork();
  const [error, setError] = useState("");
  const { profile } = useDoctorProfile();
  const [form, setForm] = useState(() => {
    const base = emptyApplicationForm(initial);
    if (!base.ownerName && profile?.fullName) base.ownerName = profile.fullName;
    if (!base.phone && profile?.phone) base.phone = profile.phone;
    return base;
  });
  const [docs, setDocs] = useState<SellerDoc[]>([]);
  const [uploading, setUploading] = useState(false);

  async function addDoc(file: File | undefined, label = "", maxMb = 8) {
    if (!file) return;
    setError("");
    if (!profile) {
      setError("Hujjat yuklash uchun avval tizimga kiring.");
      return;
    }
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Faqat PDF, JPG, PNG yoki WEBP fayl.");
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Fayl ${maxMb} MB dan oshmasin.`);
      return;
    }
    if (docs.length >= 5) {
      setError("Ko‘pi bilan 5 ta hujjat.");
      return;
    }
    setUploading(true);
    try {
      const path = await uploadWithTicket("/api/seller/docs-upload", { size: file.size }, file);
      setDocs((d) => [...d, { path, name: `${label ? `${label}: ` : ""}${file.name}`.slice(0, 120), size: file.size, type: file.type }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fayl yuklanmadi.");
    } finally {
      setUploading(false);
    }
  }

  const [agreed, setAgreed] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (variant === "desktop" && !agreed) {
      setError("Davom etish uchun platforma shartlariga rozilik bering.");
      return;
    }
    if (uploading) {
      setError("Hujjat yuklanmoqda — biroz kuting.");
      return;
    }
    const input = toApplicationInput(form, docs);
    if (variant === "desktop") {
      let digits = input.phone.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("998")) digits = digits.slice(3);
      if (digits.length === 9) input.phone = `+998 ${digits}`;
    }
    if (input.stir && input.stir.length !== 9) {
      setError("STIR 9 ta raqamdan iborat bo‘lishi kerak.");
      return;
    }
    if (!input.telegram && !input.instagram) {
      setError("Instagram yoki Telegram — kamida bittasi majburiy.");
      return;
    }
    if (input.bio.trim().length < 20) {
      setError("Biznes tavsifi kamida 20 belgi bo‘lsin.");
      return;
    }
    const result =
      mode === "edit" ? updateApplication(input) : mode === "reapply" ? reapply(input) : register(input);
    if (!result.ok) {
      if (result.reason === "auth") {
        setError("Ariza yuborish uchun avval tizimga kiring.");
        return;
      }
      setError("Ism, telefon (9+ raqam), do‘kon nomi, tavsif va ijtimoiy tarmoq majburiy.");
      return;
    }
    onSuccess?.(result.shop);
    if (mode === "create") {
      router.replace("/marketplace/sotuvchi");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (variant === "desktop") {
    return (
      <SellerApplyDesktopView
        form={form}
        setForm={setForm}
        docs={docs}
        setDocs={setDocs}
        uploading={uploading}
        addDoc={addDoc}
        error={error}
        loggedIn={Boolean(profile)}
        agreed={agreed}
        setAgreed={setAgreed}
        onSubmit={submit}
      />
    );
  }

  const title =
    mode === "reapply" ? "Qayta ariza yuborish" : mode === "edit" ? "Arizani tahrirlash" : "Sotuvchi arizasi";
  const buttonText =
    submitLabel ??
    (mode === "reapply" ? "Qayta yuborish" : mode === "edit" ? "Saqlash" : "Ariza yuborish");

  return (
    <form
      id="dokon-form"
      onSubmit={submit}
      className="scroll-mt-24 space-y-2.5 rounded-[14px] border border-[#F0FDFA] bg-white p-3.5 shadow-[0_6px_20px_rgba(17, 24, 39, 0.05)] sm:p-4"
    >
      <div>
        <h2 className="text-[16px] font-bold text-[#1a1d26] sm:text-[17px]">{title}</h2>
        <p className="mt-0.5 text-[12.5px] leading-snug text-[#8b93a7]">
          Ishonchli do‘konlargina sotadi. Ariza → platforma tekshiruvi → do‘kon ochiladi.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="Egasi ismi">
          <Input
            className="h-10"
            value={form.ownerName}
            onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            required
          />
        </Field>
        <Field label="Telefon">
          <Input
            className="h-10"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </Field>
        <Field label="Do‘kon nomi">
          <Input
            className="h-10"
            value={form.shopName}
            onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            placeholder="Masalan: MedSupply Toshkent"
            required
          />
        </Field>
        <Field label="Shahar">
          <select
            className="h-10 w-full rounded-lg border border-input px-2.5 text-sm"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          >
            {shopCities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Biznes tavsifi" hint="Nima sotasaniz, mijozlar kim — kamida 20 belgi">
        <Textarea
          rows={3}
          className="min-h-0 resize-y"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Klinikaga material / forma / jihoz yetkazamiz. Tajriba va assortiment haqida qisqa yozing."
          required
        />
      </Field>

      <div className="rounded-xl border border-[#eceff5] bg-[#f7f9fc] p-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-[12.5px] font-semibold text-[#1a1d26]">Ijtimoiy tarmoqlar</p>
          <p className="text-[11.5px] text-[#8b93a7]">IG yoki Telegram — majburiy</p>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Field label="Instagram">
            <Input
              className="h-10"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="@dokon yoki link"
            />
          </Field>
          <Field label="Telegram">
            <Input
              className="h-10"
              value={form.telegram}
              onChange={(e) => setForm({ ...form, telegram: e.target.value })}
              placeholder="@dokon yoki t.me/…"
            />
          </Field>
          <Field label="Facebook (ixtiyoriy)">
            <Input
              className="h-10"
              value={form.facebook}
              onChange={(e) => setForm({ ...form, facebook: e.target.value })}
              placeholder="facebook.com/…"
            />
          </Field>
          <Field label="Veb-sayt (ixtiyoriy)">
            <Input
              className="h-10"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://"
            />
          </Field>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="Manzil (ixtiyoriy)">
          <Input
            className="h-10"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Ko‘cha, ofis…"
          />
        </Field>
        <Field label="Tajriba (yil, ixtiyoriy)">
          <Input
            className="h-10"
            inputMode="numeric"
            value={form.yearsInBusiness}
            onChange={(e) => setForm({ ...form, yearsInBusiness: e.target.value })}
            placeholder="Masalan: 5"
          />
        </Field>
      </div>

      <div className="rounded-xl border border-[#eceff5] bg-[#f7f9fc] p-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-[12.5px] font-semibold text-[#1a1d26]">Hujjatlar (ixtiyoriy, tekshiruvni tezlashtiradi)</p>
          <p className="text-[11.5px] text-[#8b93a7]">Faqat platforma adminlari ko‘radi</p>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Field label="STIR (INN)">
            <Input
              className="h-10"
              inputMode="numeric"
              maxLength={11}
              value={form.stir}
              onChange={(e) => setForm({ ...form, stir: e.target.value })}
              placeholder="9 ta raqam"
            />
          </Field>
          <div>
            <span className="text-[12.5px] font-medium text-[#1a1d26]">Guvohnoma / litsenziya</span>
            <label
              className={cn(
                "mt-1 flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#CCFBF1] bg-white px-3 text-[13px] font-medium text-[#0F766E] hover:bg-[#f5f9ff]",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
              {uploading ? "Yuklanmoqda…" : "Fayl biriktirish (PDF/JPG, 8 MB)"}
              <input
                type="file"
                className="sr-only"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  void addDoc(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
        {docs.length ? (
          <ul className="mt-2 space-y-1">
            {docs.map((doc) => (
              <li key={doc.path} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-[12.5px] text-[#1a1d26]">
                <FileText className="size-4 shrink-0 text-[#0F766E]" />
                <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                <span className="shrink-0 text-[11px] text-[#8b93a7]">{Math.max(1, Math.round(doc.size / 1024))} KB</span>
                <button
                  type="button"
                  aria-label="Olib tashlash"
                  className="shrink-0 rounded p-0.5 text-[#8b93a7] hover:text-destructive"
                  onClick={() => setDocs((d) => d.filter((x) => x.path !== doc.path))}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error}{" "}
          {!profile ? (
            <Link href="/kirish?next=/marketplace/sotuvchi" className="font-semibold underline">
              Kirish
            </Link>
          ) : null}
        </p>
      ) : null}

      <Button type="submit" className="h-11 w-full !rounded-xl text-[14.5px]">
        {buttonText}
      </Button>
      <p className="text-[11.5px] leading-snug text-[#8b93a7]">
        Platforma ijtimoiy tarmoqlar va ma’lumotlarni tekshiradi. Tasdiqlangach mahsulot qo‘shish ochiladi.
      </p>
    </form>
  );
}

export function SellerOnboarding() {
  const steps = [
    { n: "1", icon: Store, title: "Ariza" },
    { n: "2", icon: ShieldCheck, title: "Tekshiruv" },
    { n: "3", icon: Package, title: "Sotuv" },
  ];

  return (
    <>
    <div className="hidden lg:block">
      <SellerApplyForm mode="create" variant="desktop" />
    </div>
    <div className="mx-auto w-full max-w-[760px] lg:hidden">
      <p className="text-[12.5px] text-[#8b93a7]">
        <Link href="/marketplace" className="text-[#0F766E] hover:underline">
          Marketplace
        </Link>
        <span className="mx-1">/</span>
        <span>Sotuvchi</span>
      </p>
      <h1 className="mt-1.5 text-[20px] font-bold tracking-tight text-[#1a1d26] sm:text-[22px]">Sotuvchi bo‘lish</h1>
      <p className="mt-0.5 text-[13px] leading-snug text-[#6b7280]">
        Ishonchli do‘konlargina sotadi. Ariza → tekshiruv → ochiladi.
      </p>
      <p className="mt-2 inline-flex rounded-full bg-[#eaf2ff] px-3 py-1 text-[12px] font-semibold text-[#115E59]">
        Platforma komissiyasi: {MARKETPLACE_COMMISSION_PERCENT}% (faqat yakunlangan buyurtmadan)
      </p>

      <ol className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
        {steps.map((step, index) => (
          <li key={step.n} className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border border-[#F0FDFA] bg-[#f5f9ff] px-2.5 text-[12.5px] font-semibold text-[#0F766E]",
              )}
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-[#0F766E] text-[11px] font-bold text-white">
                {step.n}
              </span>
              <step.icon className="size-3.5 shrink-0" />
              <span>{step.title}</span>
            </span>
            {index < steps.length - 1 ? (
              <span className="hidden text-[#c5cedd] sm:inline" aria-hidden="true">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-[#ecfdf3] bg-[#f0fdf4] px-2.5 py-1.5 text-[12px] text-[#15803d]">
        <BadgeCheck className="size-3.5 shrink-0" />
        <span>Faqat tekshiruvdan o‘tgan do‘konlar Marketplace / Forma / Jihozlarda sotadi.</span>
      </div>

      <div className="mt-3.5">
        <SellerApplyForm mode="create" />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-[#8b93a7]">
        <CreditCard className="size-3.5" />
        Karta ulash — do‘kon tasdiqlangandan keyin.
      </p>
    </div>
    </>
  );
}
