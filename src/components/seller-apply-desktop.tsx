"use client";

import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  FileText,
  Globe,
  Headphones,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Package,
  Send,
  ShieldCheck,
  Shirt,
  Smile,
  Sparkles,
  Store,
  Syringe,
  Users,
  Wrench,
  X,
  ArrowRight,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { shopCities } from "@/data/shops";
import { site } from "@/data/site";
import type { SellerDoc } from "@/lib/seller-work";
import type { ApplyFormState } from "@/components/seller-apply-form";
import { cn } from "@/lib/utils";
import { MARKETPLACE_COMMISSION_PERCENT } from "@/lib/commission";

const inputCls =
  "h-11 w-full rounded-xl border border-[#e3e8f1] bg-white px-3.5 text-[14px] text-[#1a1d26] outline-none transition placeholder:text-[#a3abbd] focus:border-[#0F766E] focus:ring-3 focus:ring-[#0F766E]/15";

const steps = [
  { n: 1, title: "Ariza", sub: "Ma’lumotlarni kiriting" },
  { n: 2, title: "Tekshiruv", sub: "Biz tekshiramiz" },
  { n: 3, title: "Do‘kon", sub: "Do‘kon ochiladi" },
  { n: 4, title: "Sotuv", sub: "Boshlang" },
];

const categories: { label: string; icon: LucideIcon }[] = [
  { label: "Stomatologik materiallar", icon: Package },
  { label: "Instrumentlar", icon: Wrench },
  { label: "Implant tizimlari", icon: Cpu },
  { label: "Jihozlar", icon: Syringe },
  { label: "Ortodontiya", icon: Smile },
  { label: "Forma va kiyim", icon: Shirt },
  { label: "Gigiena va parvarish", icon: Sparkles },
  { label: "Boshqalar", icon: MoreHorizontal },
];

const benefits = [
  "Shaxsiy do‘kon sahifasi",
  "Mahsulotlarni boshqarish paneli",
  "Statistika va analitika",
  "Buyurtmalar va escrow himoyasi",
  "Katta mijozlar bazasiga chiqish",
];

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#eceff5] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-baseline gap-3">
        <h2 className="text-[16px] font-bold text-[#0B1F4D]">{title}</h2>
        {hint ? <span className="text-[12.5px] text-[#8b93a7]">{hint}</span> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-[13px] font-medium text-[#4b5568]">
      {children}
      {required ? <span className="ml-0.5 text-[#ef4444]">*</span> : null}
    </span>
  );
}

function IconInput({ icon: Icon, ...props }: { icon: (p: { className?: string }) => ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[#8b93a7]" />
      <input {...props} className={cn(inputCls, "pl-11")} />
    </div>
  );
}

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TelegramGlyph({ className }: { className?: string }) {
  return <Send className={className} />;
}

function DocBlock({
  title,
  label,
  stir,
  onStir,
  docs,
  uploading,
  addDoc,
  removeDoc,
}: {
  title: string;
  label: string;
  stir?: { value: string; onChange: (v: string) => void };
  docs: SellerDoc[];
  uploading: boolean;
  addDoc: (file: File | undefined, label?: string, maxMb?: number) => Promise<void>;
  removeDoc: (path: string) => void;
  onStir?: never;
}) {
  const mine = docs.filter((d) => d.name.startsWith(`${label}: `));
  return (
    <div className="rounded-xl border border-dashed border-[#c9d8f5] bg-[#f8faff] p-4">
      <p className="text-[13.5px] font-semibold text-[#1a1d26]">{title}</p>
      {stir ? (
        <input
          className={cn(inputCls, "mt-2.5 h-10 bg-white")}
          inputMode="numeric"
          maxLength={11}
          value={stir.value}
          onChange={(e) => stir.onChange(e.target.value)}
          placeholder="9 ta raqam"
          aria-label="STIR raqami"
        />
      ) : null}
      <div className="mt-3 flex items-center gap-3">
        <label
          className={cn(
            "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#99F6E4] bg-white px-4 text-[13.5px] font-semibold text-[#0F766E] transition hover:bg-[#eef4ff]",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "Yuklanmoqda…" : "Fayl tanlash"}
          <input
            type="file"
            className="sr-only"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => {
              void addDoc(e.target.files?.[0], label, 5);
              e.target.value = "";
            }}
          />
        </label>
        <span className="text-[12px] text-[#8b93a7]">PDF, JPG, PNG (maks. 5MB)</span>
      </div>
      {mine.length ? (
        <ul className="mt-3 space-y-1.5">
          {mine.map((doc) => (
            <li key={doc.path} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-[12.5px] text-[#1a1d26]">
              <FileText className="size-4 shrink-0 text-[#0F766E]" />
              <span className="min-w-0 flex-1 truncate">{doc.name.slice(label.length + 2)}</span>
              <span className="shrink-0 text-[11px] text-[#8b93a7]">{Math.max(1, Math.round(doc.size / 1024))} KB</span>
              <button type="button" aria-label="Olib tashlash" className="shrink-0 rounded p-0.5 text-[#8b93a7] hover:text-[#ef4444]" onClick={() => removeDoc(doc.path)}>
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SellerApplyDesktopView({
  form,
  setForm,
  docs,
  setDocs,
  uploading,
  addDoc,
  error,
  loggedIn,
  agreed,
  setAgreed,
  onSubmit,
}: {
  form: ApplyFormState;
  setForm: Dispatch<SetStateAction<ApplyFormState>>;
  docs: SellerDoc[];
  setDocs: Dispatch<SetStateAction<SellerDoc[]>>;
  uploading: boolean;
  addDoc: (file: File | undefined, label?: string, maxMb?: number) => Promise<void>;
  error: string;
  loggedIn: boolean;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const set = (k: keyof ApplyFormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const phoneLocal = form.phone.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  const removeDoc = (path: string) => setDocs((d) => d.filter((x) => x.path !== path));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <nav className="flex items-center gap-1 text-[12.5px] text-[#8b93a7]">
          <Link href="/marketplace" className="hover:text-[#0F766E]">Marketplace</Link>
          <ChevronRight className="size-3.5" />
          <span>Sotuvchi</span>
          <ChevronRight className="size-3.5" />
          <span className="text-[#4b5568]">Ariza</span>
        </nav>
        <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-tight text-[#0B1F4D]">Sotuvchi bo‘lish</h1>
        <p className="mt-1 text-[14px] text-[#6b7280]">
          Stomatologik material, jihoz va xizmatlaringizni minglab mutaxassislarga soting.
        </p>
        <p className="mt-2 inline-flex rounded-full bg-[#F0FDFA] px-3 py-1 text-[12.5px] font-semibold text-[#115E59]">
          Platforma komissiyasi: {MARKETPLACE_COMMISSION_PERCENT}% (faqat yakunlangan buyurtmadan, do‘kon ochish bepul)
        </p>

        <ol className="mt-5 grid grid-cols-4 gap-3 rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          {steps.map((s, i) => (
            <li key={s.n} className="relative flex items-center gap-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-[14px] font-bold",
                  i === 0 ? "bg-[#0F766E] text-white shadow-[0_4px_10px_rgba(15,118,110,0.3)]" : "bg-[#eef1f6] text-[#8b93a7]",
                )}
              >
                {s.n}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[14px] font-bold", i === 0 ? "text-[#0F766E]" : "text-[#4b5568]")}>{s.title}</span>
                <span className="block truncate text-[12px] text-[#8b93a7]">{s.sub}</span>
              </span>
              {i < steps.length - 1 ? <span className="absolute -right-2 top-1/2 h-px w-4 -translate-y-1/2 bg-[#dfe4ee]" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>

        <form id="dokon-form" onSubmit={onSubmit} className="mt-5 space-y-4">
          <Card title="Asosiy ma’lumotlar">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <label className="block">
                <Label required>Egasi ismi</Label>
                <input className={inputCls} value={form.ownerName} onChange={(e) => set("ownerName")(e.target.value)} placeholder="Ism va familiya" required />
              </label>
              <label className="block">
                <Label required>Telefon</Label>
                <div className="flex h-11 overflow-hidden rounded-xl border border-[#e3e8f1] bg-white transition focus-within:border-[#0F766E] focus-within:ring-3 focus-within:ring-[#0F766E]/15">
                  <span className="flex items-center gap-1.5 border-r border-[#e3e8f1] bg-[#f7f9fc] px-3 text-[14px] font-medium text-[#4b5568]">
                    <span className="flex h-3.5 w-5 flex-col overflow-hidden rounded-[2px] border border-black/10" aria-hidden="true">
                      <span className="h-1/3 bg-[#1eb53a]" />
                      <span className="h-1/3 bg-white" />
                      <span className="h-1/3 bg-[#0099b5]" />
                    </span>
                    +998
                  </span>
                  <input
                    className="min-w-0 flex-1 bg-transparent px-3.5 text-[14px] outline-none placeholder:text-[#a3abbd]"
                    inputMode="tel"
                    value={phoneLocal}
                    onChange={(e) => set("phone")(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="90 123 45 67"
                    required
                  />
                </div>
              </label>
              <label className="block">
                <Label required>Do‘kon nomi</Label>
                <input className={inputCls} value={form.shopName} onChange={(e) => set("shopName")(e.target.value)} placeholder="Masalan: MedSupply Toshkent" required />
              </label>
              <label className="block">
                <Label required>Shahar</Label>
                <div className="relative">
                  <select className={cn(inputCls, "appearance-none pr-10")} value={form.city} onChange={(e) => set("city")(e.target.value)}>
                    {shopCities.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8b93a7]" />
                </div>
              </label>
              <label className="col-span-2 block">
                <Label required>Biznes tavsifi</Label>
                <div className="relative">
                  <Textarea
                    rows={4}
                    maxLength={500}
                    className="min-h-[104px] resize-none rounded-xl border-[#e3e8f1] px-3.5 py-3 text-[14px] md:text-[14px]"
                    value={form.bio}
                    onChange={(e) => set("bio")(e.target.value)}
                    placeholder="Nima sotasiz, mijozlar kim — kamida 20 belgi"
                    required
                  />
                  <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-[12px] text-[#a3abbd]">{form.bio.length}/500</span>
                </div>
              </label>
            </div>
          </Card>

          <Card title="Aloqa tarmoqlari" hint="Instagram yoki Telegram — kamida bittasi majburiy">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <label className="block">
                <Label>Instagram</Label>
                <IconInput icon={InstagramGlyph} value={form.instagram} onChange={(e) => set("instagram")(e.target.value)} placeholder="@dokon yoki link" />
              </label>
              <label className="block">
                <Label>Telegram</Label>
                <IconInput icon={TelegramGlyph} value={form.telegram} onChange={(e) => set("telegram")(e.target.value)} placeholder="@dokon yoki t.me/…" />
              </label>
              <label className="block">
                <Label>Facebook</Label>
                <IconInput icon={FacebookGlyph} value={form.facebook} onChange={(e) => set("facebook")(e.target.value)} placeholder="facebook.com/…" />
              </label>
              <label className="block">
                <Label>Veb-sayt</Label>
                <IconInput icon={Globe} value={form.website} onChange={(e) => set("website")(e.target.value)} placeholder="https://" />
              </label>
            </div>
          </Card>

          <Card title="Manzil va tajriba">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <label className="block">
                <Label>Manzil (ixtiyoriy)</Label>
                <input className={inputCls} value={form.address} onChange={(e) => set("address")(e.target.value)} placeholder="Ko‘cha, ofis…" />
              </label>
              <label className="block">
                <Label>Tajriba (yil, ixtiyoriy)</Label>
                <input className={inputCls} inputMode="numeric" value={form.yearsInBusiness} onChange={(e) => set("yearsInBusiness")(e.target.value)} placeholder="Masalan: 5" />
              </label>
            </div>
          </Card>

          <Card title="Hujjatlar" hint="Ixtiyoriy, tekshiruvni tezlashtiradi · faqat platforma adminlari ko‘radi">
            <div className="grid grid-cols-2 gap-4">
              <DocBlock title="STIR (INN)" label="STIR" stir={{ value: form.stir, onChange: set("stir") }} docs={docs} uploading={uploading} addDoc={addDoc} removeDoc={removeDoc} />
              <DocBlock title="Guvohnoma / litsenziya" label="Guvohnoma" docs={docs} uploading={uploading} addDoc={addDoc} removeDoc={removeDoc} />
            </div>
          </Card>

          {error ? (
            <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5 text-[13.5px] text-[#b91c1c]">
              {error}{" "}
              {!loggedIn ? (
                <Link href="/kirish?next=/marketplace/sotuvchi" className="font-semibold underline">
                  Kirish
                </Link>
              ) : null}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-6 rounded-2xl border border-[#eceff5] bg-white px-6 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-[#4b5568]">
              <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition",
                  agreed ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-[#c9d1e0] bg-white",
                )}
              >
                {agreed ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
              <span>
                Men <span className="font-semibold text-[#0F766E]">platforma shartlari</span> va{" "}
                <span className="font-semibold text-[#0F766E]">maxfiylik siyosati</span> bilan tanishdim va roziman.
              </span>
            </label>
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-[#0F766E] px-8 text-[15px] font-bold text-white shadow-[0_8px_18px_rgba(15,118,110,0.28)] transition hover:bg-[#115E59]"
            >
              Ariza yuborish
              <ArrowRight className="size-4.5" />
            </button>
          </div>
        </form>
      </div>

      <aside className="min-w-0 space-y-4 pt-[26px]">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b4fd6] via-[#0F766E] to-[#3b8bff] p-6 text-white shadow-[0_10px_28px_rgba(15,118,110,0.25)]">
          <div className="relative z-10 max-w-[210px]">
            <h3 className="text-[19px] font-extrabold leading-snug">Sizning mahsulotlaringiz minglab mutaxassislarga yetib boradi</h3>
          </div>
          <div className="pointer-events-none absolute -right-2 top-3 flex w-[190px] flex-wrap justify-end gap-1.5">
            {["product-composite", "product-bond", "product-curette", "product-handpiece"].map((n) => (
              <span key={n} className="relative size-[86px] overflow-hidden rounded-xl bg-white/95 shadow-md">
                <Image src={`/images/${n}.png`} alt="" fill sizes="86px" className="object-contain p-2" />
              </span>
            ))}
          </div>
          <div className="relative z-10 mt-[88px] grid grid-cols-4 gap-2 border-t border-white/20 pt-4">
            {[
              { icon: Users, label: "Keng mijozlar bazasi" },
              { icon: ShieldCheck, label: "Ishonchli platforma" },
              { icon: Store, label: "Qulay do‘kon" },
              { icon: BarChart3, label: "Statistika" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/25">
                  <Icon className="size-[18px]" />
                </span>
                <span className="text-[11px] font-medium leading-tight text-white/95">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-2xl border border-[#eceff5] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h3 className="text-[15px] font-bold text-[#0B1F4D]">Nima sotishingiz mumkin?</h3>
          <div className="mt-3.5 grid grid-cols-4 gap-2">
            {categories.map(({ label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-[#eef1f6] bg-[#fafbfe] px-1 py-3 text-center">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0F766E]">
                  <Icon className="size-[18px]" />
                </span>
                <span className="text-[10.5px] font-medium leading-tight text-[#4b5568]">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#eceff5] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h3 className="text-[15px] font-bold text-[#0B1F4D]">Sotuvchi bo‘lgach sizga nimalar beriladi?</h3>
          <div className="mt-3.5 flex items-center gap-3">
            <ul className="min-w-0 flex-1 space-y-2.5">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[13px] text-[#1a1d26]">
                  <CheckCircle2 className="mt-px size-[18px] shrink-0 fill-[#22c55e] text-white" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="hidden w-[118px] shrink-0 xl:block" aria-hidden="true">
              <div className="rounded-t-lg border-[3px] border-[#1a1d26] bg-white p-1.5">
                <div className="mb-1 h-1.5 w-8 rounded bg-[#0F766E]" />
                <div className="flex h-10 items-end gap-1">
                  {[40, 65, 50, 85, 70, 95].map((h, i) => (
                    <span key={i} className="flex-1 rounded-sm bg-[#7fb0ff]" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mt-1 h-1 rounded bg-[#e6ebf5]" />
              </div>
              <div className="h-1.5 rounded-b-lg bg-[#1a1d26]" />
            </div>
          </div>
        </section>

        <section className="flex items-center gap-4 rounded-2xl border border-[#CCFBF1] bg-[#F0FDFA] p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0F766E] text-white">
            <Headphones className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-[#0B1F4D]">Savollaringiz bormi?</h3>
            <p className="mt-0.5 text-[12.5px] text-[#6b7280]">Biz sizga yordam berishga tayyormiz</p>
          </div>
          <a
            href={site.telegram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#99F6E4] bg-white px-3.5 text-[13px] font-semibold text-[#0F766E] hover:bg-[#eef4ff]"
          >
            <MessageCircle className="size-4" />
            Qo‘llab-quvvatlash
          </a>
        </section>
      </aside>
    </div>
  );
}
