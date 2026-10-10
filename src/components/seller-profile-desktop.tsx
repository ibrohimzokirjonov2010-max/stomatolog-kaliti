"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Clock, ExternalLink, Image as ImageIcon, MapPin, Pencil, Phone, Send, ShoppingBag, Star, Store, Upload, Globe } from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { ShopAvatar, VerifiedBadge } from "@/components/seller-ui";
import { DemoTag, Panel, PillTabs, SoonTag } from "@/components/seller-desktop-ui";
import { shopCities, shopHref, type Shop } from "@/data/shops";
import { prepareImage, uploadImage } from "@/lib/image-upload";
import { cn } from "@/lib/utils";
import { useReviewSummary } from "@/lib/use-seller-live";

type PTab = "basic" | "brand" | "hours" | "social" | "extra";
const TABS: { id: PTab; label: string }[] = [
  { id: "basic", label: "Asosiy ma’lumotlar" },
  { id: "brand", label: "Ko‘rinish va brending" },
  { id: "hours", label: "Ish vaqti va manzil" },
  { id: "social", label: "Ijtimoiy tarmoqlar" },
  { id: "extra", label: "Qo‘shimcha ma’lumotlar" },
];
const BIO_MAX = 500;

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function F({ label, children, hint, tag }: { label: string; children: ReactNode; hint?: ReactNode; tag?: ReactNode }) {
  return (
    <label className="block text-[12.5px] font-semibold text-[#4b5568]">
      <span className="flex items-center gap-2">
        {label}
        {tag}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint ? <span className="mt-1 block text-[11.5px] font-normal text-[#8b93a7]">{hint}</span> : null}
    </label>
  );
}
const inputCls =
  "h-11 w-full rounded-xl border border-[#e4e9f2] bg-white px-3.5 text-[14px] font-medium text-[#0B1F4D] outline-none placeholder:font-normal placeholder:text-[#a3abbd] focus:border-[#0066FF] disabled:bg-[#f7f9fc] disabled:text-[#8b93a7]";

export function SellerProfileDesktop({ shop }: { shop: Shop }) {
  const { updateShop, shopOrders } = useSellerWork();
  const [tab, setTab] = useState<PTab>("basic");
  const [saved, setSaved] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoErr, setLogoErr] = useState("");
  const [form, setForm] = useState({
    name: shop.name,
    city: shop.city,
    bio: shop.bio,
    phone: shop.phone,
    telegram: shop.telegram ?? "",
    instagram: shop.instagram ?? "",
    facebook: shop.facebook ?? "",
    website: shop.website ?? "",
    address: shop.address ?? "",
    yearsInBusiness: shop.yearsInBusiness != null ? String(shop.yearsInBusiness) : "",
    logo: shop.logo ?? "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const cities = shopCities.includes(form.city as (typeof shopCities)[number]) ? [...shopCities] : [form.city, ...shopCities];

  function save() {
    const years = form.yearsInBusiness.trim() ? Number(form.yearsInBusiness.replace(/\D/g, "")) : undefined;
    updateShop({
      ...form,
      yearsInBusiness: years != null && Number.isFinite(years) ? years : undefined,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  async function onLogo(file?: File) {
    if (!file) return;
    setLogoBusy(true);
    setLogoErr("");
    try {
      const prepared = await prepareImage(file, 512, 0.85);
      const url = await uploadImage(prepared.blob, "logo");
      URL.revokeObjectURL(prepared.previewUrl);
      setForm((f) => ({ ...f, logo: url }));
    } catch (e) {
      setLogoErr(e instanceof Error && e.message ? e.message : "Logo yuklanmadi.");
    } finally {
      setLogoBusy(false);
    }
  }

  const preview: Shop = { ...shop, name: form.name || shop.name, logo: form.logo || undefined };
  const years = form.yearsInBusiness.replace(/\D/g, "");
  const orderCount = shopOrders.length;
  const rating = useReviewSummary();

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#0B1F4D]">Do‘kon profili</h1>
          <p className="mt-1 text-[13.5px] text-[#6b7280]">Ommaviy do‘kon sahifasida ko‘rinadigan ma’lumotlarni tahrirlang.</p>
        </div>
        <div className="flex items-center gap-2">
          {saved ? <span className="text-[13px] font-semibold text-[#16a34a]">Saqlandi</span> : null}
          <Link
            href={shopHref(shop.slug)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#d7e4ff] bg-white px-4 text-[13.5px] font-semibold text-[#0066FF] hover:bg-[#f5f9ff]"
          >
            <ExternalLink className="size-4" />
            Do‘konni ko‘rish
          </Link>
          <button type="button" onClick={save} className="h-10 rounded-xl bg-[#0066FF] px-6 text-[13.5px] font-semibold text-white hover:bg-[#0055d4]">
            Saqlash
          </button>
        </div>
      </header>

      <PillTabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="grid grid-cols-[minmax(0,1fr)_330px] items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          {tab === "basic" ? (
            <>
              <Panel
                title="Asosiy ma’lumotlar"
                action={shop.verified ? <VerifiedBadge status={shop.verified} /> : null}
              >
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <F label="Do‘kon nomi">
                    <input className={inputCls} value={form.name} onChange={(e) => set("name")(e.target.value)} />
                  </F>
                  <F label="Brend nomi" tag={<SoonTag />}>
                    <input className={inputCls} value="" placeholder="Hozircha do‘kon nomi ishlatiladi" disabled />
                  </F>
                  <F label="Kategoriya" tag={<SoonTag />}>
                    <select className={inputCls} disabled>
                      <option>Mahsulot kategoriyasi bo‘yicha avtomatik</option>
                    </select>
                  </F>
                  <F label="Shahar">
                    <select className={inputCls} value={form.city} onChange={(e) => set("city")(e.target.value)}>
                      {cities.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </F>
                </div>
                <div className="mt-4">
                  <F label="Do‘kon tavsifi">
                    <textarea
                      className={cn(inputCls, "h-[110px] resize-none py-3 leading-relaxed")}
                      maxLength={BIO_MAX}
                      value={form.bio}
                      onChange={(e) => set("bio")(e.target.value)}
                    />
                    <span className="mt-1 block text-right text-[11.5px] font-normal text-[#8b93a7]">
                      {form.bio.length}/{BIO_MAX}
                    </span>
                  </F>
                </div>
              </Panel>

              <Panel title="Logo va banner">
                <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-6">
                  <div>
                    <p className="text-[12.5px] font-semibold text-[#4b5568]">Logo</p>
                    <div className="relative mt-2 w-fit">
                      <ShopAvatar shop={preview} className="size-[104px] rounded-full text-[34px]" />
                      <label className="absolute -right-1 -bottom-1 grid size-8 cursor-pointer place-items-center rounded-full bg-[#0066FF] text-white shadow hover:bg-[#0055d4]" title="Logoni almashtirish">
                        <Pencil className="size-4" />
                        <input type="file" accept="image/*" className="sr-only" disabled={logoBusy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void onLogo(f); }} />
                      </label>
                    </div>
                    <p className="mt-2 text-[11.5px] text-[#8b93a7]">{logoBusy ? "Yuklanmoqda…" : "JPG/PNG, kvadrat"}</p>
                    {logoErr ? <p className="mt-1 text-[11.5px] text-[#dc2626]">{logoErr}</p> : null}
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-[12.5px] font-semibold text-[#4b5568]">
                      Banner <SoonTag />
                    </p>
                    <div className="mt-2 grid h-[104px] place-items-center rounded-xl border border-dashed border-[#d7e0ee] bg-[#f7f9fc] text-center">
                      <div>
                        <ImageIcon className="mx-auto size-6 text-[#a3abbd]" />
                        <p className="mt-1 text-[12px] text-[#8b93a7]">Banner yuklash hali ulanmagan</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel
                title={
                  <span className="flex items-center gap-2">
                    Teglar va afzalliklar <SoonTag />
                  </span>
                }
              >
                <p className="mt-3 text-[13px] text-[#6b7280]">
                  “Sifatli mahsulotlar”, “Tez yetkazib berish” kabi teglar do‘kon sahifasida ko‘rsatiladi. Saqlash hozircha ulanmagan.
                </p>
              </Panel>
            </>
          ) : null}

          {tab === "brand" ? (
            <Panel title="Ko‘rinish va brending">
              <div className="mt-4 flex items-center gap-5">
                <div className="relative">
                  <ShopAvatar shop={preview} className="size-[104px] rounded-full text-[34px]" />
                  <label className="absolute -right-1 -bottom-1 grid size-8 cursor-pointer place-items-center rounded-full bg-[#0066FF] text-white shadow hover:bg-[#0055d4]">
                    <Upload className="size-4" />
                    <input type="file" accept="image/*" className="sr-only" disabled={logoBusy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void onLogo(f); }} />
                  </label>
                </div>
                <div className="min-w-0 flex-1">
                  <F label="Logo havolasi (ixtiyoriy)">
                    <input className={inputCls} value={form.logo} onChange={(e) => set("logo")(e.target.value)} placeholder="https://… yoki rasm yuklang" />
                  </F>
                  {logoErr ? <p className="mt-1 text-[11.5px] text-[#dc2626]">{logoErr}</p> : null}
                </div>
              </div>
              <p className="mt-5 flex items-center gap-2 text-[13px] text-[#6b7280]">
                Banner, ranglar va brend nomi <SoonTag />
              </p>
            </Panel>
          ) : null}

          {tab === "hours" ? (
            <>
              <Panel title="Manzil">
                <div className="mt-4">
                  <F label="Manzil (ixtiyoriy)">
                    <input className={inputCls} value={form.address} onChange={(e) => set("address")(e.target.value)} placeholder="Ko‘cha, uy, mo‘ljal" />
                  </F>
                </div>
              </Panel>
              <Panel
                title={
                  <span className="flex items-center gap-2">
                    Ish vaqti <SoonTag />
                  </span>
                }
              >
                <p className="mt-3 flex items-center gap-2 text-[13px] text-[#6b7280]">
                  <Clock className="size-4 text-[#8b93a7]" />
                  Haftalik ish jadvalini belgilash tez orada qo‘shiladi.
                </p>
              </Panel>
            </>
          ) : null}

          {tab === "social" ? (
            <Panel title="Aloqa va ijtimoiy tarmoqlar">
              <div className="mt-4 grid grid-cols-2 gap-4">
                <F label="Telefon">
                  <input className={inputCls} value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
                </F>
                <F label="Telegram">
                  <input className={inputCls} value={form.telegram} onChange={(e) => set("telegram")(e.target.value)} placeholder="@do‘kon" />
                </F>
                <F label="Instagram">
                  <input className={inputCls} value={form.instagram} onChange={(e) => set("instagram")(e.target.value)} placeholder="@do‘kon" />
                </F>
                <F label="Facebook (ixtiyoriy)">
                  <input className={inputCls} value={form.facebook} onChange={(e) => set("facebook")(e.target.value)} />
                </F>
                <F label="Veb-sayt (ixtiyoriy)">
                  <input className={inputCls} value={form.website} onChange={(e) => set("website")(e.target.value)} placeholder="https://…" />
                </F>
              </div>
            </Panel>
          ) : null}

          {tab === "extra" ? (
            <Panel title="Qo‘shimcha ma’lumotlar">
              <div className="mt-4 grid grid-cols-2 gap-4">
                <F label="Tajriba (yil)">
                  <input className={inputCls} inputMode="numeric" value={form.yearsInBusiness} onChange={(e) => set("yearsInBusiness")(e.target.value)} />
                </F>
                <F label="STIR / hujjatlar" tag={<DemoTag>Maxfiy</DemoTag>}>
                  <input className={inputCls} value="Ariza bosqichida yuborilgan" disabled />
                </F>
              </div>
              <p className="mt-4 flex items-center gap-2 text-[13px] text-[#6b7280]">
                Sertifikatlar va litsenziyalar <SoonTag />
              </p>
            </Panel>
          ) : null}
        </div>

        <aside className="sticky top-20">
          <Panel title="Mijoz ko‘radigan ko‘rinish">
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#eceff5]">
              <div className="relative h-[96px] bg-gradient-to-r from-[#0B1F4D] via-[#0a3a96] to-[#0066FF]">
                <Store className="absolute top-3 right-4 size-14 text-white/10" />
              </div>
              <div className="px-4 pb-4">
                <ShopAvatar shop={preview} className="-mt-8 size-[64px] rounded-full border-4 border-white text-[22px]" />
                <div className="mt-2 flex items-center gap-1.5">
                  <h3 className="min-w-0 truncate text-[15.5px] font-bold text-[#0B1F4D]">{form.name || shop.name}</h3>
                  <VerifiedBadge status={shop.verified} />
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#6b7280]">
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-[#f5b100] text-[#f5b100]" /> {rating.avg != null ? rating.avg.toFixed(1) : "—"}{" "}
                    <span className="text-[#a3abbd]">{rating.count ? `(${rating.count} sharh)` : "(hali sharh yo‘q)"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="size-3.5" /> {orderCount} buyurtma
                  </span>
                  {years ? <span>{years} yil tajriba</span> : null}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#8b93a7]">
                  <MapPin className="size-3.5" /> {form.city}
                  {form.address ? `, ${form.address}` : ""}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <span className="grid h-9 place-items-center rounded-lg bg-[#0066FF] text-[12.5px] font-semibold text-white">Xabar yozish</span>
                  <span className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#d7e4ff] text-[12.5px] font-semibold text-[#0066FF]">
                    <Phone className="size-3.5" /> Qo‘ng‘iroq
                  </span>
                </div>
                <div className="mt-3 flex gap-4 border-b border-[#eef1f6] text-[12px] font-semibold text-[#8b93a7]">
                  <span className="border-b-2 border-[#0066FF] pb-1.5 text-[#0066FF]">Bosh sahifa</span>
                  <span className="pb-1.5">Mahsulotlar</span>
                  <span className="pb-1.5">Sharhlar</span>
                  <span className="pb-1.5">Ma’lumot</span>
                </div>
                <p className="mt-3 text-[12px] font-bold text-[#0B1F4D]">Biz haqimizda</p>
                <p className="mt-1 line-clamp-4 text-[12px] leading-relaxed text-[#4b5568]">{form.bio || "—"}</p>
                {form.telegram || form.instagram || form.website ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-[11.5px] font-medium text-[#0066FF]">
                    {form.telegram ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f1ff] px-2.5 py-1">
                        <Send className="size-3" /> {form.telegram}
                      </span>
                    ) : null}
                    {form.instagram ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f1ff] px-2.5 py-1">
                        <InstagramIcon className="size-3" /> {form.instagram}
                      </span>
                    ) : null}
                    {form.website ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f1ff] px-2.5 py-1">
                        <Globe className="size-3" /> sayt
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-[#8b93a7]">Ko‘rinish saqlashdan oldin ham yangilanadi. Tugmalar faqat namuna.</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
