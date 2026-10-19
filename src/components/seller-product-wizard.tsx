"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import {
  AlertCircle,
  ClipboardList,
  ArrowLeft,
  ArrowRight,
  Bold,
  Boxes,
  Check,
  ChevronDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  FileText,
  FolderOpen,
  Heart,
  ImagePlus,
  Images,
  Info,
  Italic,
  Lightbulb,
  Link2,
  List,
  ListChecks,
  Loader2,
  Package,
  Plus,
  ShieldCheck,
  Star,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Truck,
  Underline,
  Warehouse,
  X,
} from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { isRemoteSrc, placeholderProductImage, sellerCategories } from "@/data/shops";
import { categoryLabels, type ApparelGender, type ApparelKind, type Product, type ProductAttrs, type ProductCategory } from "@/data/products";
import { clothingSizes, formaColors, formaGenders, formaKinds } from "@/data/forma";
import { marketplaceSellerCategories, type SellerProductInput } from "@/lib/seller-work";
import { prepareImage, uploadImage, uploadWithTicket } from "@/lib/image-upload";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";


/** True from the Tailwind `lg` breakpoint up. Desktop gets the dialog layout, phones the full-screen sheet (same wizard). */
export function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 1024px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
}

const SUBCATEGORIES: Record<string, string[]> = {
  materiallar: ["Kompozitlar", "Bondinglar", "Tsementlar", "Plomba materiallari", "Anesteziya", "Dezinfeksiya", "Boshqa"],
  implantlar: ["Implantlar", "Abutmentlar", "Membranalar", "Suyak materiallari", "Implant asboblari", "Boshqa"],
  asboblar: ["Burlar", "Endodontik asboblar", "Qisqich va pinsetlar", "Ko‘zgu va zondlar", "Xirurgik asboblar", "Boshqa"],
  jihozlar: ["Stomatologik unitlar", "Avtoklav va sterilizatorlar", "Lampalar", "Rentgen va skanerlar", "Kompressorlar", "Boshqa"],
  forma: ["Xalatlar", "Scrub to‘plamlari", "Qalpoqlar", "Poyabzal", "Boshqa"],
};
const BRAND_HINTS = ["Dentium", "Dentsply Sirona", "3M ESPE", "Ivoclar", "Kerr", "GC", "Septodont", "MedForm"];
const STEPS = [
  { title: "Mahsulot", hint: "Asosiy ma’lumotlar va rasmlar" },
  { title: "Sotuv", hint: "Narx, ombor va yetkazib berish" },
  { title: "Tafsilotlar", hint: "Tavsif, xususiyatlar va qo‘shimcha" },
];
const MAX_IMAGES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Errs = Record<string, string>;

/** After a failed validation, bring the first error into view (it can be scrolled off inside the dialog). */
function scrollToFirstError() {
  setTimeout(() => document.querySelector("[role=dialog] [data-field-error]")?.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
}

function Card({ title, sub, icon: Icon, children }: { title: string; sub?: string; icon?: typeof Tag; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e6eaf2] bg-white p-4 lg:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f1ff] text-[#0066FF]">
            <Icon className="size-[18px]" />
          </span>
        ) : null}
        <div>
          <h3 className="text-[15px] leading-tight font-bold text-[#0B1F4D]">{title}</h3>
          {sub ? <p className="mt-0.5 text-[12.5px] text-[#8b93a7]">{sub}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Sel({ value, onChange, children, dot, compact }: { value: string; onChange: (v: string) => void; children: ReactNode; dot?: string; compact?: boolean }) {
  return (
    <div className="relative">
      {dot ? <span className="pointer-events-none absolute top-1/2 left-3.5 size-2.5 -translate-y-1/2 rounded-full" style={{ backgroundColor: dot }} /> : null}
      <select className={cn(inputCls(), "appearance-none pr-9", compact && "pr-8 pl-3 text-[13.5px]", dot && "pl-8")} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#8b93a7]" />
    </div>
  );
}

function Suf({ suffix, err, value, onChange, inputMode, placeholder, disabled }: { suffix: string; err?: string; value: string; onChange: (v: string) => void; inputMode?: "numeric"; placeholder?: string; disabled?: boolean }) {
  return (
    <div className="relative">
      <input className={cn(inputCls(err), "pr-14", disabled && "bg-[#f1f4f9] text-[#a6aebf]")} disabled={disabled} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px] font-medium text-[#8b93a7]">{suffix}</span>
    </div>
  );
}

function F({ label, req, hint, error, children, right }: { label: string; req?: boolean; hint?: string; error?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[12.5px] font-semibold text-[#4b5568]">
        <span>
          {label}
          {req ? <span className="ml-0.5 text-[#ef4444]">*</span> : null}
        </span>
        {right}
      </span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <span data-field-error className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[#dc2626]">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-[11.5px] text-[#8b93a7]">{hint}</span>
      ) : null}
    </label>
  );
}

const inputCls = (err?: string) =>
  cn(
    "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] text-[#1a1d26] outline-none transition-colors placeholder:text-[#a6aebf] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15",
    err ? "border-[#fca5a5] bg-[#fff8f8]" : "border-[#dfe5ef]",
  );
const DELIVERY_TIMES = ["Toshkent 24 soat", "Toshkent 1–2 kun", "O‘zbekiston bo‘ylab 1–3 kun", "O‘zbekiston bo‘ylab 3–5 kun", "O‘zbekiston bo‘ylab 5–7 kun"];
const DELIVERY_REGIONS = ["O‘zbekiston bo‘ylab", "Toshkent shahri", "Toshkent shahri va viloyati", "Viloyat markazlari"];
const DELIVERY_METHODS: { id: NonNullable<ProductAttrs["deliveryMethod"]>; title: string; hint: string; icon: typeof Truck }[] = [
  { id: "own", title: "O‘z omborimdan", hint: "Yetkazishni o‘zingiz tashkil qilasiz", icon: Truck },
  { id: "market", title: "Market omboridan", hint: "Market ombori orqali", icon: Store },
  { id: "mixed", title: "Aralash", hint: "Ikkala usul ham mumkin", icon: Boxes },
];
const STOCK_STATUSES: { id: NonNullable<ProductAttrs["stockStatus"]>; label: string }[] = [
  { id: "mavjud", label: "Mavjud" },
  { id: "buyurtma", label: "Buyurtma bo‘yicha" },
  { id: "tugagan", label: "Tugagan" },
];
const SPEC_FIELDS: { key: SpecKey; label: string; placeholder: string; options?: string[] }[] = [
  { key: "manufacturer", label: "Ishlab chiqaruvchi", placeholder: "Kompaniya nomi" },
  { key: "type", label: "Turi", placeholder: "Mahsulot turi" },
  { key: "model", label: "Model", placeholder: "Model yoki seriya" },
  { key: "usage", label: "Qo‘llanish sohasi", placeholder: "Qayerda ishlatiladi", options: ["Old tishlar", "Orqa tishlar", "Old va orqa tishlar"] },
  { key: "color", label: "Rang", placeholder: "Masalan: A2" },
  { key: "curing", label: "Qotish usuli", placeholder: "Qotish usulini tanlang yoki yozing", options: ["Yorug‘lik bilan", "Kimyoviy", "Ikki xil (dual-cure)"] },
  { key: "volume", label: "Hajm / og‘irlik", placeholder: "Masalan: 4 g yoki 50 ml" },
  { key: "storage", label: "Saqlash sharoiti", placeholder: "Harorat va shart", options: ["+2 °C … +8 °C", "+5 °C … +25 °C", "Xona haroratida, quruq joyda"] },
  { key: "packCount", label: "Qadoq soni", placeholder: "Masalan: 1 dona" },
  { key: "shelfLife", label: "Yaroqlilik muddati", placeholder: "Davomiyligi", options: ["12 oy", "24 oy", "36 oy", "48 oy", "60 oy"] },
];
type SpecKey = "manufacturer" | "model" | "color" | "volume" | "packCount" | "type" | "usage" | "curing" | "storage" | "shelfLife";
const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_DOCS = 6;
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmtSize = (n?: number) => (!n ? "" : n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function SellerProductWizard({ product, onDone }: { product?: Product; onDone: () => void }) {
  const { addProduct, updateProduct } = useSellerWork();
  const desktop = useIsDesktop();
  const [previewOpen, setPreviewOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const shortRef = useRef<HTMLTextAreaElement>(null);
  const fullRef = useRef<HTMLTextAreaElement>(null);
  const galleryRef = useRef({ image: "", images: [] as string[] });
  const uploadChain = useRef(Promise.resolve());
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [errs, setErrs] = useState<Errs>({});
  const [upload, setUpload] = useState<"" | "main" | "extra" | "doc">("");
  const [uploadErr, setUploadErr] = useState("");
  const [docErr, setDocErr] = useState("");
  const [drag, setDrag] = useState(false);
  const [slide, setSlide] = useState(0);
  const [descTab, setDescTab] = useState<"short" | "full">("short");
  const A: ProductAttrs = product?.attrs ?? {};
  const [form, setForm] = useState({
    name: product?.name ?? "",
    brand: product?.brand ?? "",
    category: (product?.category && product.category !== "laboratoriya" ? product.category : "materiallar") as ProductCategory,
    subcategory: product?.subcategory ?? "",
    sku: product?.sku ?? "",
    image: product && (isRemoteSrc(product.image) || product.image.startsWith("/")) ? product.image : "",
    images: [...new Set((product?.images ?? []).filter((u) => u && u !== product?.image))] as string[],
    // "Asosiy narx" is the price before discount
    price: product ? String(product.discount && product.oldPrice ? product.oldPrice : product.price) : "",
    discount: product?.discount ? String(product.discount) : "",
    minOrder: String(A.minOrder ?? 1),
    wholesale: A.wholesale ? String(A.wholesale) : "",
    stock: product ? String(product.stockQty ?? 0) : "",
    stockStatus: (A.stockStatus ?? (product && (product.stockQty ?? 0) === 0 ? "tugagan" : "mavjud")) as NonNullable<ProductAttrs["stockStatus"]>,
    lot: A.lot ?? "",
    expiryDate: A.expiryDate ?? "",
    deliveryMethod: (A.deliveryMethod ?? "own") as NonNullable<ProductAttrs["deliveryMethod"]>,
    delivery: product?.delivery ?? DELIVERY_TIMES[0],
    deliveryRegion: A.deliveryRegion ?? DELIVERY_REGIONS[0],
    deliveryPrice: A.deliveryPrice ? String(A.deliveryPrice) : "",
    freeDelivery: A.freeDelivery ?? false,
    shortDescription: A.shortDescription ?? "",
    description: product?.description ?? "",
    manufacturer: A.manufacturer ?? "",
    model: A.model ?? "",
    color: A.color ?? "",
    volume: A.volume ?? "",
    packCount: A.packCount ?? "",
    type: A.type ?? "",
    usage: A.usage ?? "",
    curing: A.curing ?? "",
    storage: A.storage ?? "",
    shelfLife: A.shelfLife ?? "",
    docs: (A.docs ?? []) as { url: string; name: string; size?: number }[],
    isNew: A.isNew ?? false,
    show: product ? product.active !== false : true,
    recommended: A.recommended ?? false,
    limited: A.limited ?? false,
    specLine: A.specLine ?? "",
    warrantyMonths: A.warrantyMonths ? String(A.warrantyMonths) : "12",
    year: A.year ? String(A.year) : String(new Date().getFullYear()),
    installmentMonths: A.installmentMonths ? String(A.installmentMonths) : "",
    leasing: A.leasing ?? false,
    installService: A.installService ?? false,
    official: A.official ?? false,
    condition: (A.condition ?? "yangi") as "yangi" | "ishlatilgan",
    city: A.city ?? "",
    kind: (product?.kind ?? "scrub") as ApparelKind,
    gender: (product?.gender ?? "unisex") as ApparelGender,
    sizes: (product?.sizes ?? ["M", "L"]) as string[],
    colors: (product?.colors ?? ["teal"]) as string[],
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrs((e) => (e[k as string] ? { ...e, [k as string]: "" } : e));
  };

  const isForma = form.category === "forma";
  const isJihoz = form.category === "jihozlar";
  const digits = (v: string) => Number(v.replace(/\D/g, "")) || 0;
  const priceNum = digits(form.price); // base price (before discount)
  const discountNum = digits(form.discount);
  const discountOn = discountNum >= 1 && discountNum <= 89;
  const salePrice = priceNum > 0 ? (discountOn ? Math.round(priceNum * (1 - discountNum / 100)) : priceNum) : 0;
  const gallery = [form.image, ...form.images].filter(Boolean);
  const totalImgs = gallery.length;
  const slideIdx = gallery.length ? Math.min(slide, gallery.length - 1) : 0;
  const subs = SUBCATEGORIES[form.category] ?? [];
  const deliveryTimes = DELIVERY_TIMES.includes(form.delivery) ? DELIVERY_TIMES : [form.delivery, ...DELIVERY_TIMES];
  const deliveryRegions = DELIVERY_REGIONS.includes(form.deliveryRegion) ? DELIVERY_REGIONS : [form.deliveryRegion, ...DELIVERY_REGIONS];
  const descLen = form.description.trim().length;
  const checklist = [
    { ok: descLen >= 200, text: "Kamida 200 belgilik to‘liq tavsif yozing", note: `${descLen} belgi` },
    { ok: totalImgs >= 3, text: "Kamida 3 ta sifatli rasm yuklang", note: `${totalImgs} ta rasm` },
    { ok: form.docs.length > 0, text: "Sertifikat yoki hujjat yuklang", note: `${form.docs.length} ta fayl` },
    { ok: Boolean(form.lot.trim() && form.expiryDate), text: "Partiya raqami va yaroqlilik muddatini ko‘rsating", note: "" },
  ];
  const checklistDone = checklist.filter((c) => c.ok).length;

  async function sendFile(file: File): Promise<string> {
    if (!OK_TYPES.includes(file.type)) throw new Error(`«${file.name}» — faqat JPG, PNG yoki WebP rasm yuklash mumkin.`);
    if (file.size > MAX_BYTES) throw new Error(`«${file.name}» juda katta (${(file.size / 1048576).toFixed(1)} MB). Eng ko‘pi bilan 10 MB.`);
    const prepared = await prepareImage(file, 1400, 0.82);
    try {
      return await uploadImage(prepared.blob, "product");
    } finally {
      URL.revokeObjectURL(prepared.previewUrl);
    }
  }

  /** Upload several photos at once (3 in parallel), keeping the order they were picked in. */
  async function sendAll(list: File[]): Promise<{ urls: string[]; error: string }> {
    const urls: (string | null)[] = new Array(list.length).fill(null);
    let error = "";
    let next = 0;
    const worker = async () => {
      while (next < list.length) {
        const i = next++;
        try {
          urls[i] = await sendFile(list[i]);
        } catch (e) {
          if (!error) error = e instanceof Error && e.message ? e.message : "Rasm yuklanmadi. Qayta urinib ko‘ring.";
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, list.length) }, worker));
    return { urls: urls.filter((u): u is string => Boolean(u)), error };
  }

  function enqueueUpload(task: () => Promise<void>) {
    const run = uploadChain.current.then(task, task);
    uploadChain.current = run.then(() => undefined, () => undefined);
    return run;
  }

  /**
   * Photos are applied one batch at a time against galleryRef, so a second file
   * input cannot overwrite the cover and drop the first photo.
   */
  async function applyFiles(files: File[], replaceCover: boolean) {
    const snap = galleryRef.current.image || galleryRef.current.images.length
      ? galleryRef.current
      : { image: form.image, images: form.images };
    const keepCover = Boolean(snap.image) && !replaceCover;
    const room = MAX_IMAGES - snap.images.length - (keepCover ? 1 : 0);
    if (room <= 0) {
      setUploadErr("Eng ko‘pi bilan 10 ta rasm (asosiy rasm bilan birga).");
      return;
    }
    const list = files.slice(0, room);
    setUpload(keepCover ? "extra" : "main");
    setUploadErr("");
    const { urls, error } = await sendAll(list);
    if (urls.length) {
      const next = keepCover
        ? { image: snap.image, images: [...snap.images, ...urls].slice(0, MAX_IMAGES - 1) }
        : { image: urls[0], images: [...snap.images, ...urls.slice(1)].slice(0, MAX_IMAGES - 1) };
      galleryRef.current = next;
      setForm((current) => ({ ...current, image: next.image, images: next.images }));
      if (!keepCover) setErrs((errs) => (errs.image ? { ...errs, image: "" } : errs));
    }
    setUploadErr(error || (files.length > room ? `Faqat ${room} ta rasm qo‘shildi — limit ${MAX_IMAGES} ta.` : ""));
    setUpload("");
  }

  async function addMain(files: File[], replaceCover = false) {
    if (!files.length) return;
    await enqueueUpload(() => applyFiles(files, replaceCover));
  }

  async function addExtras(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    await enqueueUpload(() => applyFiles(list, false));
  }

  /** Remove the cover: the next photo (if any) becomes the new cover so the gallery never loses its first image. */
  function removeCover() {
    setForm((p) => {
      const [next, ...rest] = p.images;
      const image = next ?? "";
      galleryRef.current = { image, images: rest };
      return { ...p, image, images: rest };
    });
    setSlide(0);
  }
  function removeExtra(j: number) {
    setForm((p) => {
      const images = p.images.filter((_, k) => k !== j);
      galleryRef.current = { image: p.image, images };
      return { ...p, images };
    });
    setSlide((s) => (s > j ? s - 1 : s));
  }
  /** Make extra photo j the cover; the old cover takes its place among the extra photos. */
  function makeCover(j: number) {
    setForm((p) => {
      const picked = p.images[j];
      if (!picked) return p;
      const images = [...p.images];
      if (p.image) images[j] = p.image;
      else images.splice(j, 1);
      galleryRef.current = { image: picked, images };
      return { ...p, image: picked, images };
    });
    setSlide(0);
  }
  /** Move a photo one step left/right in the gallery order (cover = position 0). */
  function movePhoto(i: number, dir: -1 | 1) {
    setForm((p) => {
      const all = [p.image, ...p.images].filter(Boolean);
      const j = i + dir;
      if (i < 0 || j < 0 || i >= all.length || j >= all.length) return p;
      [all[i], all[j]] = [all[j], all[i]];
      const [cover, ...rest] = all;
      galleryRef.current = { image: cover, images: rest };
      return { ...p, image: cover, images: rest };
    });
    setSlide(i + dir);
  }

  async function addDocs(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    const room = MAX_DOCS - form.docs.length;
    if (room <= 0) return setDocErr(`Eng ko‘pi bilan ${MAX_DOCS} ta hujjat yuklash mumkin.`);
    setUpload("doc");
    setDocErr("");
    const added: { url: string; name: string; size: number }[] = [];
    try {
      for (const f of list.slice(0, room)) {
        if (!DOC_TYPES.includes(f.type)) throw new Error(`«${f.name}» — faqat PDF, JPG, PNG yoki WebP fayl yuklash mumkin.`);
        if (f.size > MAX_BYTES) throw new Error(`«${f.name}» juda katta (${(f.size / 1048576).toFixed(1)} MB). Eng ko‘pi bilan 10 MB.`);
        const url = await uploadWithTicket("/api/seller/product-docs", { size: f.size }, f);
        added.push({ url, name: f.name.slice(0, 120), size: f.size });
      }
      if (list.length > room) setDocErr(`Faqat ${room} ta fayl qo‘shildi — limit ${MAX_DOCS} ta.`);
    } catch (e) {
      setDocErr(e instanceof Error && e.message ? e.message : "Fayl yuklanmadi.");
    } finally {
      if (added.length) setForm((p) => ({ ...p, docs: [...p.docs, ...added] }));
      setUpload("");
    }
  }

  const replacingCover = useRef(false);
  function onMainChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const replace = replacingCover.current;
    replacingCover.current = false;
    void addMain(files, replace);
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    void addMain(Array.from(e.dataTransfer.files ?? []).filter((f) => f.type.startsWith("image/")));
  }

  function validate(s: number): Errs {
    const e: Errs = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = "Mahsulot nomini kiriting.";
      else if (form.name.trim().length < 3) e.name = "Nom kamida 3 belgidan iborat bo‘lsin.";
      if (!form.brand.trim()) e.brand = "Brendni kiriting yoki ro‘yxatdan tanlang.";
      if (!form.image) e.image = "Asosiy rasm majburiy — davom etish uchun mahsulotning asosiy rasmini yuklang (JPG, PNG yoki WebP, 10 MB gacha).";
      if (upload === "main" || upload === "extra") e.image = "Rasm hali yuklanmoqda — tugashini kuting.";
    }
    if (s === 1) {
      if (priceNum <= 0) e.price = "Asosiy narxni kiriting (0 dan katta bo‘lsin).";
      if (form.discount && (discountNum < 1 || discountNum > 89)) e.discount = "Chegirma 1 dan 89 gacha foiz bo‘lishi kerak.";
      if (!/^\d+$/.test(form.minOrder.trim()) || Number(form.minOrder) < 1) e.minOrder = "Minimal buyurtma 1 yoki undan katta butun son bo‘lsin.";
      if (form.wholesale && (digits(form.wholesale) <= 0 || (salePrice > 0 && digits(form.wholesale) >= salePrice))) e.wholesale = "Ulgurji narx sotuv narxidan past bo‘lishi kerak.";
      if (form.stock.trim() === "" || !/^\d+$/.test(form.stock.trim())) e.stock = "Mavjud sonni butun son bilan kiriting (0 yoki undan katta).";
      else if (form.stockStatus === "tugagan" && Number(form.stock) > 0) e.stock = "Holat «Tugagan» bo‘lsa, mavjud soni 0 bo‘lishi kerak.";
      else if (form.stockStatus === "mavjud" && Number(form.stock) === 0) e.stock = "Holat «Mavjud» bo‘lsa, soni 1 dan kam bo‘lmasin (yoki holatni o‘zgartiring).";
      if (form.expiryDate && form.expiryDate < today()) e.expiryDate = "Yaroqlilik muddati o‘tib ketgan sana bo‘lmasin.";
      if (!form.freeDelivery && digits(form.deliveryPrice) <= 0) e.deliveryPrice = "Yetkazib berish narxini kiriting yoki «Bepul yetkazib berish»ni yoqing.";
    }
    if (s === 2) {
      if (isForma) {
        if (!form.sizes.length) e.sizes = "Kamida bitta o‘lcham tanlang.";
        if (!form.colors.length) e.colors = "Kamida bitta rang tanlang.";
      }
      if (upload === "doc") e.docs = "Hujjat hali yuklanmoqda — tugashini kuting.";
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrs(e);
    if (Object.values(e).some(Boolean)) return scrollToFirstError();
    if (step < 2) {
      setStep(step + 1);
      setMaxStep((m) => Math.max(m, step + 1));
      return;
    }
    submit(false);
  }

  function goTo(i: number) {
    if (i === step) return;
    if (i < step) {
      setErrs({});
      return setStep(i);
    }
    // jumping forward: every earlier step must be valid
    for (let s = step; s < i; s++) {
      const e = validate(s);
      if (Object.values(e).some(Boolean)) {
        setStep(s);
        setErrs(e);
        return scrollToFirstError();
      }
    }
    setErrs({});
    setStep(i);
    setMaxStep((m) => Math.max(m, i));
  }

  function submit(asDraft: boolean) {
    for (let s = 0; s < 3; s++) {
      const e = validate(s);
      if (Object.values(e).some(Boolean)) {
        setStep(s);
        setErrs(e);
        return scrollToFirstError();
      }
    }
    const attrs: ProductAttrs = {
      minOrder: Number(form.minOrder),
      wholesale: digits(form.wholesale) || undefined,
      stockStatus: form.stockStatus,
      lot: form.lot.trim() || undefined,
      expiryDate: form.expiryDate || undefined,
      deliveryMethod: form.deliveryMethod,
      deliveryRegion: form.deliveryRegion,
      deliveryPrice: form.freeDelivery ? undefined : digits(form.deliveryPrice) || undefined,
      freeDelivery: form.freeDelivery,
      shortDescription: form.shortDescription.trim() || undefined,
      manufacturer: form.manufacturer.trim() || undefined,
      model: form.model.trim() || undefined,
      color: form.color.trim() || undefined,
      volume: form.volume.trim() || undefined,
      packCount: form.packCount.trim() || undefined,
      type: form.type.trim() || undefined,
      usage: form.usage.trim() || undefined,
      curing: form.curing.trim() || undefined,
      storage: form.storage.trim() || undefined,
      shelfLife: form.shelfLife.trim() || undefined,
      docs: form.docs,
      isNew: form.isNew,
      recommended: form.recommended,
      limited: form.limited,
      specLine: isJihoz ? form.specLine.trim() || undefined : undefined,
      warrantyMonths: isJihoz ? digits(form.warrantyMonths) || undefined : undefined,
      year: isJihoz ? digits(form.year) || undefined : undefined,
      installmentMonths: isJihoz ? digits(form.installmentMonths) || undefined : undefined,
      installmentMonthly: isJihoz && digits(form.installmentMonths) > 0 ? Math.round(salePrice / digits(form.installmentMonths)) : undefined,
      leasing: isJihoz ? form.leasing || digits(form.installmentMonths) > 0 : undefined,
      installService: isJihoz ? form.installService : undefined,
      official: isJihoz ? form.official : undefined,
      condition: isJihoz ? form.condition : undefined,
      city: isJihoz ? form.city.trim() || undefined : undefined,
    };
    const input: SellerProductInput = {
      name: form.name,
      brand: form.brand,
      category: form.category,
      subcategory: form.subcategory || undefined,
      sku: form.sku || undefined,
      price: salePrice,
      oldPrice: discountOn ? priceNum : undefined,
      discount: discountOn ? discountNum : undefined,
      stock: Number(form.stock),
      delivery: form.delivery,
      description: form.description,
      image: form.image,
      images: form.images,
      attrs,
      active: asDraft ? false : form.show,
      kind: isForma ? form.kind : undefined,
      gender: isForma ? form.gender : undefined,
      sizes: isForma ? form.sizes : undefined,
      colors: isForma ? form.colors : undefined,
    };
    const result = product ? updateProduct(product.id, input) : addProduct(input);
    if (!result.ok) {
      setErrs({ form: "Mahsulotni saqlab bo‘lmadi. Do‘koningiz tasdiqlanganini tekshiring va qayta urinib ko‘ring." });
      return;
    }
    onDone();
  }

  const errorList = Object.entries(errs).filter(([, v]) => v);
  const deliveryLabel = form.freeDelivery ? "Bepul yetkazib berish" : digits(form.deliveryPrice) > 0 ? formatMoney(digits(form.deliveryPrice), "UZS") : "—";
  const methodLabel = DELIVERY_METHODS.find((m) => m.id === form.deliveryMethod)?.title ?? "";
  const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

  function showPreview() {
    document.getElementById("wiz-preview")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function fmt(kind: "bold" | "italic" | "underline" | "list" | "link") {
    const el = descTab === "short" ? shortRef.current : fullRef.current;
    if (!el) return;
    const key = descTab === "short" ? "shortDescription" : "description";
    const max = descTab === "short" ? 1000 : 4000;
    const val = form[key];
    const a = el.selectionStart;
    const b = el.selectionEnd;
    const sel = val.slice(a, b);
    let out = val;
    let caret = b;
    const wrap = (m: string) => {
      out = val.slice(0, a) + m + (sel || "matn") + m + val.slice(b);
      caret = a + m.length + (sel || "matn").length + m.length;
    };
    if (kind === "bold") wrap("**");
    if (kind === "italic") wrap("*");
    if (kind === "underline") wrap("__");
    if (kind === "list") {
      const start = val.lastIndexOf("\n", a - 1) + 1;
      const end = b === a ? (val.indexOf("\n", a) === -1 ? val.length : val.indexOf("\n", a)) : b;
      const block = val.slice(start, end).split("\n").map((l) => (l.startsWith("- ") ? l : `- ${l}`)).join("\n");
      out = val.slice(0, start) + block + val.slice(end);
      caret = start + block.length;
    }
    if (kind === "link") {
      const url = window.prompt("Havola manzili (https://… bilan boshlansin)", "https://");
      if (!url || !/^https?:\/\/\S+$/.test(url.trim())) return;
      const text = `[${sel || "havola"}](${url.trim()})`;
      out = val.slice(0, a) + text + val.slice(b);
      caret = a + text.length;
    }
    out = out.slice(0, max);
    set(key, out);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  const miniCard = (linkLabel: string, onLink: () => void) => (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e6eaf2] bg-white p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={gallery[0] ?? placeholderProductImage(form.category)} alt="" className="size-14 shrink-0 rounded-xl border border-[#eceff5] bg-[#f7f9fc] object-contain" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] leading-tight font-bold text-[#0B1F4D]">{form.name.trim() || "Mahsulot nomi"}</p>
        <p className="mt-0.5 truncate text-[12px] text-[#6b7280]">{form.brand.trim() || "Brend"}</p>
        <button type="button" onClick={onLink} className="mt-1 text-[12px] font-semibold text-[#0066FF] hover:underline">{linkLabel}</button>
      </div>
    </div>
  );
  const SIDE_HINTS = ["Asosiy ma’lumotlar", "Narx, ombor va yetkazib berish", "Tavsif va xususiyatlar"];
  const verticalStepper = (
    <ol className="space-y-1 rounded-2xl border border-[#e6eaf2] bg-white p-2.5">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={s.title}>
            <button type="button" onClick={() => goTo(i)} className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left", active ? "bg-[#eaf2ff]" : "hover:bg-[#f7f9fc]")}>
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[12.5px] font-bold", active ? "bg-[#0066FF] text-white" : done ? "bg-[#16a34a] text-white" : "border border-[#d5dbe7] bg-white text-[#8b93a7]")}>
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="leading-tight">
                <span className={cn("block text-[13px] font-bold", active ? "text-[#0066FF]" : "text-[#1a1d26]")}>{s.title}</span>
                <span className="block text-[11px] text-[#8b93a7]">{SIDE_HINTS[i]}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
  const previewCard = (title: string, opts?: { blue?: boolean; carousel?: boolean }) => (
    <div className="rounded-2xl border border-[#e6eaf2] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <p className="mb-3 text-[14px] font-bold text-[#0B1F4D]">{title}</p>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#eceff5] bg-[#f7f9fc]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gallery[slideIdx] ?? placeholderProductImage(form.category)} alt="" className={cn("size-full object-contain p-3", !gallery.length && "opacity-40")} />
        {!gallery.length ? (
          <span className="absolute inset-0 grid place-items-center text-center text-[12px] font-medium text-[#8b93a7]">
            <span><ImagePlus className="mx-auto mb-1 size-6" />Asosiy rasm yuklanmagan</span>
          </span>
        ) : null}
        <span className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-white/95 text-[#8b93a7] shadow-sm"><Heart className="size-4" /></span>
        {opts?.carousel !== false && gallery.length > 1 ? (
          <>
            <button type="button" aria-label="Oldingi rasm" onClick={() => setSlide((slideIdx - 1 + gallery.length) % gallery.length)} className="absolute top-1/2 left-2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow"><ChevronLeft className="size-4" /></button>
            <button type="button" aria-label="Keyingi rasm" onClick={() => setSlide((slideIdx + 1) % gallery.length)} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow"><ChevronRight className="size-4" /></button>
            <span className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
              {gallery.map((_, i) => (
                <span key={i} className={cn("size-1.5 rounded-full", i === slideIdx ? "bg-[#0066FF]" : "bg-[#c5ccda]")} />
              ))}
            </span>
          </>
        ) : null}
      </div>
      <h4 className={cn("mt-3.5 line-clamp-2 text-[16px] leading-snug font-bold", form.name.trim() ? "text-[#0B1F4D]" : "text-[#a6aebf]")}>{form.name.trim() || "Mahsulot nomi"}</h4>
      <p className={cn("mt-0.5 text-[13px]", form.brand.trim() ? "text-[#4b5568]" : "text-[#a6aebf]")}>{form.brand.trim() || "Brend"}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f1ff] px-2.5 py-1 text-[11.5px] font-semibold text-[#0066FF]"><Tag className="size-3" />{categoryLabels[form.category]}</span>
        {form.subcategory ? <span className="rounded-full bg-[#e8f1ff] px-2.5 py-1 text-[11.5px] font-semibold text-[#0066FF]">{form.subcategory}</span> : null}
      </div>
      <div className="mt-3.5">
        {salePrice > 0 ? (
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <p className={cn("text-[22px] leading-none font-extrabold", opts?.blue ? "text-[#0066FF]" : "text-[#0B1F4D]")}>{formatMoney(salePrice, "UZS")}</p>
            {discountOn ? (
              <>
                <span className="text-[12.5px] text-[#9aa3b2] line-through">{formatMoney(priceNum, "UZS")}</span>
                <span className="rounded-md bg-[#ffe9e9] px-1.5 py-0.5 text-[11px] font-bold text-[#e5484d]">-{discountNum}%</span>
              </>
            ) : null}
          </div>
        ) : (
          <p className="text-[14px] font-medium text-[#a6aebf]">Narx hali kiritilmagan</p>
        )}
        {form.stock.trim() !== "" && maxStep >= 1 ? <p className="mt-1.5 text-[12px] text-[#16a34a]">{Number(form.stock) > 0 ? `Omborda ${form.stock} dona` : "Omborda yo‘q"} · {form.delivery || "—"}</p> : null}
      </div>
      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#eef5ff] p-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#0066FF]" />
        <p className="text-[12px] leading-snug text-[#4b5568]"><b className="block text-[13px] text-[#0B1F4D]">Sifat kafolati</b>Original mahsulot, sertifikat bilan</p>
      </div>
    </div>
  );

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);
  useEffect(() => {
    if (desktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [desktop]);

  const centerContent = (
    <>
            {errorList.length > 1 || errs.form ? (
              <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#b91c1c]" role="alert">
                <p className="font-semibold">Davom etish uchun quyidagilarni to‘ldiring:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {errorList.map(([k, v]) => (
                    <li key={k}>{v}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {step === 0 ? (
              <>
                <Card icon={ClipboardList} title="Asosiy ma’lumotlar" sub="Mahsulotning asosiy ma’lumotlarini kiriting.">
                  <div className="space-y-4">
                    <F label="Mahsulot nomi" req error={errs.name} right={<span className="font-normal text-[#8b93a7]">{form.name.length}/120</span>}>
                      <input className={inputCls(errs.name)} maxLength={120} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Mahsulot nomini kiriting" />
                    </F>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <F label="Brend" req error={errs.brand}>
                        <div className="relative">
                          <input className={cn(inputCls(errs.brand), "pr-16")} list="wiz-brands" maxLength={80} value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Brendni tanlang yoki yozing" />
                          <datalist id="wiz-brands">
                            {BRAND_HINTS.map((b) => (
                              <option key={b} value={b} />
                            ))}
                          </datalist>
                          <span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5 text-[#8b93a7]">
                            {form.brand ? (
                              <button type="button" aria-label="Brendni tozalash" onClick={() => set("brand", "")} className="grid size-5 place-items-center rounded-full hover:bg-[#f1f4f9]"><X className="size-3.5" /></button>
                            ) : null}
                            <ChevronDown className="pointer-events-none size-4" />
                          </span>
                        </div>
                      </F>
                      <F label="Kategoriya" req>
                        <Sel
                          value={form.category}
                          onChange={(v) => {
                            set("category", v as ProductCategory);
                            set("subcategory", "");
                          }}
                        >
                          <optgroup label="Marketplace">
                            {sellerCategories
                              .filter((c) => marketplaceSellerCategories.includes(c.id))
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="Forma">
                            <option value="forma">Forma</option>
                          </optgroup>
                          <optgroup label="Jihozlar">
                            <option value="jihozlar">Jihozlar</option>
                          </optgroup>
                        </Sel>
                      </F>
                      <F label="Kichik kategoriya">
                        <Sel value={form.subcategory} onChange={(v) => set("subcategory", v)}>
                          <option value="">Tanlanmagan</option>
                          {subs.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Sel>
                      </F>
                      <F label="SKU (ixtiyoriy)">
                        <input className={inputCls()} maxLength={60} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="Ichki mahsulot kodingiz" />
                      </F>
                    </div>
                  </div>
                </Card>

                <Card icon={Images} title="Rasm va media" sub="Mahsulot rasmlarini yuklang. Asosiy rasm majburiy.">
                  <input ref={mainRef} data-testid="product-main-input" type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onMainChange} />
                  <input ref={extraRef} data-testid="product-extra-input" type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => { const f = e.target.files; void addExtras(f).then(() => { e.target.value = ""; }); }} />
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6">
                    <div>
                      {form.image ? (
                        <div className="group relative aspect-square overflow-hidden rounded-2xl border border-[#dfe5ef] bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.image} alt="" className="size-full object-contain p-2" />
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#16a34a] px-2 py-0.5 text-[11px] font-semibold text-white"><Check className="size-3" strokeWidth={3} />Asosiy rasm yuklandi</span>
                          <div className="absolute inset-x-2 bottom-2 flex gap-2">
                            <button type="button" disabled={upload !== ""} onClick={() => { replacingCover.current = true; mainRef.current?.click(); }} className="h-9 flex-1 rounded-xl bg-white/95 text-[12.5px] font-semibold text-[#0066FF] shadow hover:bg-white disabled:opacity-60">Almashtirish</button>
                            <button type="button" aria-label="Asosiy rasmni olib tashlash" onClick={removeCover} className="grid size-9 place-items-center rounded-xl bg-white/95 text-[#dc2626] shadow hover:bg-white"><Trash2 className="size-4" /></button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                          onDragLeave={() => setDrag(false)}
                          onDrop={onDrop}
                          className={cn(
                            "flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition-colors",
                            errs.image ? "border-[#fca5a5] bg-[#fff8f8]" : drag ? "border-[#0066FF] bg-[#f3f8ff]" : "border-[#c9d6ee] bg-[#fafcff]",
                          )}
                        >
                          <span className="grid size-12 place-items-center rounded-full bg-[#e8f1ff] text-[#0066FF]">
                            {upload === "main" ? <Loader2 className="size-6 animate-spin" /> : <CloudUpload className="size-6" />}
                          </span>
                          <p className="mt-3 text-[14px] font-semibold text-[#1a1d26]">{upload === "main" ? "Yuklanmoqda…" : <>Asosiy rasm yuklash <span className="text-[#ef4444]">*</span></>}</p>
                          <p className="mt-0.5 text-[12px] text-[#8b93a7]">JPG, PNG, WebP · maks. 10 MB · bir nechtasini birdan tanlash mumkin</p>
                          <button type="button" disabled={upload !== ""} onClick={() => mainRef.current?.click()} className="mt-3 h-10 rounded-xl bg-[#0066FF] px-6 text-[13.5px] font-semibold text-white hover:bg-[#0058dd] disabled:opacity-60">
                            Rasmlarni tanlash
                          </button>
                        </div>
                      )}
                      {errs.image ? (
                        <p data-field-error className="mt-2 flex items-start gap-1.5 text-[12.5px] font-medium text-[#dc2626]">
                          <AlertCircle className="mt-0.5 size-4 shrink-0" />
                          {errs.image}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-[#1a1d26]">Qo‘shimcha rasmlar <span className="font-normal text-[#8b93a7]">(ixtiyoriy)</span></p>
                        <span className="text-[12.5px] text-[#8b93a7]">{totalImgs}/{MAX_IMAGES}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2.5">
                        {gallery.map((src, i) => (
                          <div key={src + i} data-testid="wizard-photo" className={cn("group relative aspect-square overflow-hidden rounded-xl border-2 bg-white", i === slideIdx ? "border-[#0066FF]" : "border-[#e6eaf2]")}>
                            <button type="button" aria-label={`${i + 1}-rasmni ko‘rish`} onClick={() => setSlide(i)} className="size-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="" className="size-full object-contain p-1" />
                            </button>
                            {i === 0 ? (
                              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-[#0066FF] py-0.5 text-center text-[10px] font-semibold text-white">Asosiy</span>
                            ) : (
                              <>
                                <button type="button" aria-label={`${i + 1}-rasmni olib tashlash`} onClick={() => removeExtra(i - 1)} className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-white/95 text-[#dc2626] shadow lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100">
                                  <X className="size-3.5" />
                                </button>
                                <button type="button" aria-label={`${i + 1}-rasmni asosiy qilish`} title="Asosiy rasm qilish" onClick={() => makeCover(i - 1)} className="absolute bottom-1 left-1 grid size-6 place-items-center rounded-full bg-white/95 text-[#f59e0b] shadow lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100">
                                  <Star className="size-3.5" />
                                </button>
                                <button type="button" aria-label={`${i + 1}-rasmni chapga surish`} title="Oldinga surish" onClick={() => movePhoto(i, -1)} className="absolute right-1 bottom-1 grid size-6 place-items-center rounded-full bg-white/95 text-[#0066FF] shadow lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100">
                                  <ChevronLeft className="size-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                        {totalImgs < MAX_IMAGES && form.image ? (
                          <button
                            type="button"
                            disabled={upload !== ""}
                            onClick={() => extraRef.current?.click()}
                            className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-[#c9d6ee] text-[#0066FF] hover:bg-[#f3f8ff] disabled:opacity-60"
                            aria-label="Qo‘shimcha rasm qo‘shish"
                          >
                            {upload === "extra" ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-6" />}
                          </button>
                        ) : null}
                      </div>
                      {!form.image ? <p className="mt-3 text-[12px] text-[#8b93a7]">Avval asosiy rasmni yuklang — keyin qo‘shimcha rasmlar qo‘shiladi.</p> : null}
                      {uploadErr ? (
                        <p className="mt-2 flex items-start gap-1.5 text-[12.5px] font-medium text-[#dc2626]">
                          <AlertCircle className="mt-0.5 size-4 shrink-0" />
                          {uploadErr}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <Card icon={Tag} title="Narx va chegirma">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <F label="Asosiy narx (so‘m)" req error={errs.price}>
                      <Suf suffix="so‘m" err={errs.price} inputMode="numeric" value={form.price ? money(priceNum) : ""} onChange={(v) => set("price", v.replace(/\D/g, ""))} placeholder="0" />
                    </F>
                    <F label="Chegirma" error={errs.discount}>
                      <Suf suffix="%" err={errs.discount} inputMode="numeric" value={form.discount} onChange={(v) => set("discount", v.replace(/\D/g, "").slice(0, 2))} placeholder="0" />
                    </F>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-[#cfe0ff] bg-[#eef5ff] px-4 py-3">
                    <div>
                      <p className="text-[12px] font-semibold text-[#6b7280]">Sotuv narxi</p>
                      <p className="mt-0.5 text-[24px] leading-none font-extrabold text-[#0066FF]">{salePrice > 0 ? formatMoney(salePrice, "UZS") : "—"}</p>
                    </div>
                    {discountOn && priceNum > 0 ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-md bg-[#ffe9e9] px-2 py-0.5 text-[12px] font-bold text-[#e5484d]">-{discountNum}%</span>
                        <span className="text-[13px] text-[#9aa3b2] line-through">{formatMoney(priceNum, "UZS")}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <F label="Minimal buyurtma miqdori" req error={errs.minOrder}>
                      <Suf suffix="dona" err={errs.minOrder} inputMode="numeric" value={form.minOrder} onChange={(v) => set("minOrder", v.replace(/\D/g, ""))} />
                    </F>
                    <F label="Ulgurji narx (ixtiyoriy)" error={errs.wholesale}>
                      <Suf suffix="so‘m" err={errs.wholesale} inputMode="numeric" value={form.wholesale ? money(digits(form.wholesale)) : ""} onChange={(v) => set("wholesale", v.replace(/\D/g, ""))} placeholder="Ixtiyoriy" />
                    </F>
                  </div>
                </Card>

                <Card icon={Warehouse} title="Ombor va mavjudlik">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <F label="Mavjud soni" req error={errs.stock}>
                      <Suf suffix="dona" err={errs.stock} inputMode="numeric" value={form.stock} onChange={(v) => set("stock", v.replace(/\D/g, ""))} placeholder="0" />
                    </F>
                    <F label="Ombor holati">
                      <Sel dot={form.stockStatus === "mavjud" ? "#16a34a" : form.stockStatus === "buyurtma" ? "#f59e0b" : "#ef4444"} value={form.stockStatus} onChange={(v) => set("stockStatus", v as typeof form.stockStatus)}>
                        {STOCK_STATUSES.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </Sel>
                    </F>
                    <F label="Partiya raqami (LOT)">
                      <input className={inputCls()} maxLength={60} value={form.lot} onChange={(e) => set("lot", e.target.value)} placeholder="Partiya raqami" />
                    </F>
                    <F label="Yaroqlilik muddati" error={errs.expiryDate}>
                      <input type="date" className={inputCls(errs.expiryDate)} min={today()} value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
                    </F>
                  </div>
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#eef5ff] px-3.5 py-2.5 text-[12.5px] text-[#3a4a68]">
                    <Info className="mt-0.5 size-4 shrink-0 text-[#0066FF]" />
                    Stomatologik materiallar uchun partiya raqami va yaroqlilik muddatini ko‘rsatish xaridorlar ishonchini oshiradi.
                  </p>
                </Card>

                <Card icon={Truck} title="Yetkazib berish">
                  <p className="mb-2 text-[12.5px] font-semibold text-[#4b5568]">Yetkazib berish usuli</p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
                    {DELIVERY_METHODS.map((m) => {
                      const on = form.deliveryMethod === m.id;
                      const Icon = m.icon;
                      return (
                        <button key={m.id} type="button" aria-pressed={on} onClick={() => set("deliveryMethod", m.id)} className={cn("flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors", on ? "border-[#0066FF] bg-[#f3f8ff]" : "border-[#dfe5ef] bg-white hover:bg-[#f7f9fc]")}>
                          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", on ? "bg-[#0066FF] text-white" : "bg-[#f1f4f9] text-[#8b93a7]")}>
                            <Icon className="size-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13.5px] font-bold text-[#0B1F4D]">{m.title}</span>
                            <span className="block text-[11.5px] leading-snug text-[#8b93a7]">{m.hint}</span>
                          </span>
                          {on ? <Check className="size-4 shrink-0 text-[#0066FF]" strokeWidth={3} /> : null}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.15fr_1.3fr_1fr_84px]">
                    <F label="Yetkazib berish vaqti" req>
                      <Sel compact value={form.delivery} onChange={(v) => set("delivery", v)}>
                        {deliveryTimes.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Sel>
                    </F>
                    <F label="Yetkazib berish hududi">
                      <Sel compact value={form.deliveryRegion} onChange={(v) => set("deliveryRegion", v)}>
                        {deliveryRegions.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Sel>
                    </F>
                    <F label="Yetkazib berish narxi" req={!form.freeDelivery} error={errs.deliveryPrice}>
                      <Suf suffix="so‘m" err={errs.deliveryPrice} disabled={form.freeDelivery} inputMode="numeric" value={form.freeDelivery ? "" : form.deliveryPrice ? money(digits(form.deliveryPrice)) : ""} onChange={(v) => set("deliveryPrice", v.replace(/\D/g, ""))} placeholder={form.freeDelivery ? "Bepul" : "0"} />
                    </F>
                    <div>
                      <span className="block text-[12.5px] font-semibold text-[#4b5568]">Bepul yetkazib berish</span>
                      <div className="mt-1.5 flex h-11 items-center">
                        <button type="button" role="switch" aria-checked={form.freeDelivery} aria-label="Bepul yetkazib berish" onClick={() => set("freeDelivery", !form.freeDelivery)} className={cn("relative h-7 w-12 rounded-full transition-colors", form.freeDelivery ? "bg-[#16a34a]" : "bg-[#d5dbe7]")}>
                          <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-all", form.freeDelivery ? "left-[22px]" : "left-0.5")} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Card icon={FileText} title="Tavsif">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_230px]">
                    <div>
                      <div className="flex gap-6 border-b border-[#e6eaf2]">
                        {([["short", "Qisqa tavsif"], ["full", "To‘liq tavsif"]] as const).map(([id, label]) => (
                          <button key={id} type="button" onClick={() => setDescTab(id)} className={cn("-mb-px border-b-2 pb-2 text-[13.5px] font-semibold", descTab === id ? "border-[#0066FF] text-[#0066FF]" : "border-transparent text-[#6b7280] hover:text-[#1a1d26]")}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 overflow-hidden rounded-xl border border-[#dfe5ef] bg-white focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/15">
                        <div className="flex items-center gap-0.5 border-b border-[#eef1f6] bg-[#fafbfe] px-2 py-1.5">
                          {([["bold", Bold, "Qalin"], ["italic", Italic, "Kursiv"], ["underline", Underline, "Tagiga chizish"], ["list", List, "Ro‘yxat"], ["link", Link2, "Havola"]] as const).map(([k, Icon, label]) => (
                            <button key={k} type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt(k)} className="grid size-8 place-items-center rounded-lg text-[#4b5568] hover:bg-[#eaf2ff] hover:text-[#0066FF]">
                              <Icon className="size-4" />
                            </button>
                          ))}
                        </div>
                        {descTab === "short" ? (
                          <textarea
                            ref={shortRef}
                            aria-label="Qisqa tavsif"
                            className="block min-h-[130px] w-full resize-none px-3.5 py-3 text-[14px] outline-none placeholder:text-[#a6aebf]"
                            maxLength={1000}
                            value={form.shortDescription}
                            onChange={(e) => set("shortDescription", e.target.value)}
                            placeholder="Mahsulot haqida qisqacha yozing: nima uchun kerak, asosiy afzalliklari…"
                          />
                        ) : (
                          <textarea
                            ref={fullRef}
                            aria-label="To‘liq tavsif"
                            className="block min-h-[130px] w-full resize-none px-3.5 py-3 text-[14px] outline-none placeholder:text-[#a6aebf]"
                            maxLength={4000}
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder={isForma ? "Mato, tikuv, to‘plam tarkibi…" : "Tarkibi, qo‘llanilishi, qadoq, sertifikat, saqlash sharoiti…"}
                          />
                        )}
                        <p className="px-3.5 pb-2 text-right text-[12px] text-[#8b93a7]">{descTab === "short" ? `${form.shortDescription.length}/1000` : `${form.description.length}/4000`}</p>
                      </div>
                    </div>
                    <div className="flex flex-col rounded-2xl border border-[#cfe0ff] bg-[#eef5ff] p-4">
                      <span className="grid size-10 place-items-center rounded-xl bg-white text-[#0066FF] shadow-sm"><Sparkles className="size-5" /></span>
                      <p className="mt-3 text-[14px] font-bold text-[#0B1F4D]">Tavsif uchun AI yordam</p>
                      <p className="mt-1 text-[12px] leading-snug text-[#5b6a86]">Tavsifni avtomatik yozib berish imkoniyati tayyorlanmoqda.</p>
                      <button type="button" disabled className="mt-auto flex h-10 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-white text-[12.5px] font-semibold text-[#8b93a7] ring-1 ring-[#dbe7ff]">
                        <Sparkles className="size-4" /> AI bilan yozish · Tez orada
                      </button>
                    </div>
                  </div>
                </Card>

                {isForma ? (
                  <Card title="Forma xususiyatlari">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <F label="Turi" req>
                        <select className={inputCls()} value={form.kind} onChange={(e) => set("kind", e.target.value as ApparelKind)}>
                          {formaKinds.map((k) => (
                            <option key={k.id} value={k.id}>{k.label}</option>
                          ))}
                        </select>
                      </F>
                      <F label="Jins" req>
                        <select className={inputCls()} value={form.gender} onChange={(e) => set("gender", e.target.value as ApparelGender)}>
                          {formaGenders.map((g) => (
                            <option key={g.id} value={g.id}>{g.label}</option>
                          ))}
                        </select>
                      </F>
                    </div>
                    <div className="mt-4">
                      <p className="text-[12.5px] font-semibold text-[#4b5568]">O‘lchamlar <span className="text-[#ef4444]">*</span></p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {clothingSizes.map((s) => {
                          const on = form.sizes.includes(s);
                          return (
                            <button key={s} type="button" onClick={() => set("sizes", on ? form.sizes.filter((x) => x !== s) : [...form.sizes, s])} className={cn("grid size-10 place-items-center rounded-full text-[13px] font-semibold", on ? "bg-[#0066FF] text-white" : "bg-white text-[#4b5568] ring-1 ring-[#dfe5ef]")}>
                              {s}
                            </button>
                          );
                        })}
                      </div>
                      {errs.sizes ? <p data-field-error className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-[#dc2626]"><AlertCircle className="size-3.5" />{errs.sizes}</p> : null}
                    </div>
                    <div className="mt-4">
                      <p className="text-[12.5px] font-semibold text-[#4b5568]">Ranglar <span className="text-[#ef4444]">*</span></p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formaColors.map((c) => {
                          const on = form.colors.includes(c.id);
                          return (
                            <button key={c.id} type="button" onClick={() => set("colors", on ? form.colors.filter((x) => x !== c.id) : [...form.colors, c.id])} className={cn("inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-medium ring-1", on ? "text-[#0066FF] ring-[#0066FF]" : "text-[#4b5568] ring-[#dfe5ef]")}>
                              <span className="size-3.5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                      {errs.colors ? <p data-field-error className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-[#dc2626]"><AlertCircle className="size-3.5" />{errs.colors}</p> : null}
                    </div>
                  </Card>
                ) : null}

                {isJihoz ? (
                  <Card title="Jihoz: xususiyat va bo‘lib to‘lash">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <F label="Qisqa xususiyat">
                        <input className={inputCls()} value={form.specLine} maxLength={80} onChange={(e) => set("specLine", e.target.value)} placeholder="Masalan: 4 shlang, LED lampa" />
                      </F>
                      <F label="Holati">
                        <select className={inputCls()} value={form.condition} onChange={(e) => set("condition", e.target.value as "yangi" | "ishlatilgan")}>
                          <option value="yangi">Yangi</option>
                          <option value="ishlatilgan">Ishlatilgan</option>
                        </select>
                      </F>
                      <F label="Ishlab chiqarilgan yil">
                        <input className={inputCls()} inputMode="numeric" value={form.year} onChange={(e) => set("year", e.target.value)} />
                      </F>
                      <F label="Kafolat, oy">
                        <input className={inputCls()} inputMode="numeric" value={form.warrantyMonths} onChange={(e) => set("warrantyMonths", e.target.value)} />
                      </F>
                      <F label="Bo‘lib to‘lash, oy">
                        <input className={inputCls()} inputMode="numeric" value={form.installmentMonths} onChange={(e) => set("installmentMonths", e.target.value)} placeholder="Bo‘sh qoldirilsa, lizing yo‘q" />
                      </F>
                      <F label="Shahar">
                        <input className={inputCls()} value={form.city} onChange={(e) => set("city", e.target.value)} />
                      </F>
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.installService} onChange={(e) => set("installService", e.target.checked)} /> O‘rnatish xizmati</label>
                    <label className="mt-2 flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.official} onChange={(e) => set("official", e.target.checked)} /> Rasmiy distribyutor</label>
                  </Card>
                ) : null}

                <Card icon={SlidersHorizontal} title="Texnik xususiyatlar">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                    {SPEC_FIELDS.map((f) => (
                      <F key={f.key} label={f.label}>
                        <div className="relative">
                          <input className={cn(inputCls(), f.options && "pr-9")} list={f.options ? `wiz-${f.key}` : undefined} maxLength={f.key === "usage" ? 120 : 80} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />
                          {f.options ? (
                            <>
                              <datalist id={`wiz-${f.key}`}>
                                {f.options.map((o) => (
                                  <option key={o} value={o} />
                                ))}
                              </datalist>
                              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#8b93a7]" />
                            </>
                          ) : null}
                        </div>
                      </F>
                    ))}
                  </div>
                </Card>

                <Card icon={ShieldCheck} title="Sertifikatlar va hujjatlar">
                  <input ref={docRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => { const f = e.target.files; void addDocs(f).then(() => { e.target.value = ""; }); }} />
                  <button type="button" disabled={upload !== ""} onClick={() => docRef.current?.click()} className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-[#c9d6ee] bg-[#fafcff] px-5 py-5 text-center hover:bg-[#f3f8ff] disabled:opacity-60">
                    <span className="grid size-11 place-items-center rounded-full bg-[#e8f1ff] text-[#0066FF]">{upload === "doc" ? <Loader2 className="size-5 animate-spin" /> : <CloudUpload className="size-5" />}</span>
                    <span className="mt-2 block text-[14px] font-semibold text-[#1a1d26]">{upload === "doc" ? "Yuklanmoqda…" : "Fayl yuklash"}</span>
                    <span className="block text-[12px] text-[#8b93a7]">PDF, JPG, PNG · 10 MB gacha · {form.docs.length}/{MAX_DOCS} ta</span>
                  </button>
                  {docErr || errs.docs ? (
                    <p data-field-error className="mt-2 flex items-start gap-1.5 text-[12.5px] font-medium text-[#dc2626]">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      {docErr || errs.docs}
                    </p>
                  ) : null}
                  {form.docs.length ? (
                    <ul className="mt-3 space-y-2">
                      {form.docs.map((d, i) => (
                        <li key={d.url} className="flex items-center gap-3 rounded-xl border border-[#e6eaf2] bg-white px-3.5 py-2.5">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#fef2f2] text-[#e5484d]"><FileText className="size-5" /></span>
                          <a href={d.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[#1a1d26] hover:underline">{d.name}</a>
                          <span className="text-[12px] text-[#8b93a7]">{fmtSize(d.size)}</span>
                          <span className="grid size-5 place-items-center rounded-full bg-[#16a34a] text-white" title="Yuklandi"><Check className="size-3.5" strokeWidth={3} /></span>
                          <button type="button" aria-label={`${d.name} faylini olib tashlash`} onClick={() => set("docs", form.docs.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-lg text-[#8b93a7] hover:bg-[#fef2f2] hover:text-[#dc2626]">
                            <Trash2 className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Card>

                <Card icon={ListChecks} title="Qo‘shimcha ma’lumotlar">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
                    {([
                      ["isNew", "Yangi mahsulot"],
                      ["recommended", "Tavsiya etilgan mahsulot"],
                      ["limited", "Cheklangan miqdorda"],
                      ["show", "Sotuvda ko‘rsatish"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex cursor-pointer items-center gap-2.5 text-[14px] font-medium text-[#1a1d26]">
                        <input type="checkbox" className="size-[18px] rounded accent-[#0066FF]" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
                        {label}
                      </label>
                    ))}
                  </div>
                </Card>
              </>
            ) : null}
    </>
  );
  const rightContent = (
    <>
            {step === 1 ? (
              <>
                {previewCard("Tanlangan mahsulot", { carousel: false })}
                <div className="rounded-2xl border border-[#e6eaf2] bg-white p-4">
                  <p className="mb-3 text-[14px] font-bold text-[#0B1F4D]">Joriy sozlamalar</p>
                  <dl className="space-y-2.5 text-[13px]">
                    {([
                      ["Asosiy narx", priceNum > 0 ? formatMoney(priceNum, "UZS") : "—"],
                      ["Chegirma", discountOn ? `${discountNum}%` : "Yo‘q"],
                      ["Sotuv narxi", salePrice > 0 ? formatMoney(salePrice, "UZS") : "—"],
                      ["Mavjud soni", form.stock.trim() !== "" ? `${form.stock} dona` : "—"],
                      ["Yetkazib berish", `${form.delivery} · ${methodLabel}`],
                      ["Yetkazish narxi", deliveryLabel],
                    ] as const).map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between gap-3">
                        <dt className="text-[#6b7280]">{k}</dt>
                        <dd className={cn("text-right font-semibold", k === "Sotuv narxi" ? "text-[#0066FF]" : "text-[#1a1d26]")}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </>
            ) : (
              <>
                <div id="wiz-preview" className="scroll-mt-1">{previewCard(step === 0 ? "Ko‘rinish (oldindan)" : "Mahsulot oldindan ko‘rinishi", { blue: step === 2 })}</div>
                {step === 2 ? (
                  <div className="rounded-2xl border border-[#e6eaf2] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-[14px] font-bold text-[#0B1F4D]"><Lightbulb className="size-4 text-[#f59e0b]" />Yaxshiroq ko‘rinish uchun tavsiyalar</p>
                      <span className="text-[12px] font-semibold text-[#6b7280]">{checklistDone}/{checklist.length}</span>
                    </div>
                    <ul className="space-y-2.5">
                      {checklist.map((c) => (
                        <li key={c.text} className="flex items-start gap-2.5 text-[12.5px] leading-snug">
                          <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", c.ok ? "bg-[#0066FF] text-white" : "border border-[#d5dbe7] bg-white text-transparent")}>
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                          <span className={c.ok ? "text-[#1a1d26]" : "text-[#4b5568]"}>
                            {c.text}
                            {c.note ? <span className="block text-[11.5px] text-[#8b93a7]">{c.note}</span> : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
    </>
  );

  const footerBtns = (
    <>
      {step === 2 ? (
        <button type="button" onClick={() => submit(true)} disabled={upload !== ""} className="mb-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#dbe7ff] bg-white text-[14px] font-semibold text-[#0066FF] active:bg-[#f3f8ff] disabled:opacity-60">
          <FolderOpen className="size-4" /> Qoralama saqlash
        </button>
      ) : null}
      <div className="flex gap-2.5">
        {step === 0 ? (
          <button type="button" onClick={onDone} className="h-12 shrink-0 rounded-xl border border-[#dfe5ef] bg-white px-5 text-[14px] font-semibold text-[#4b5568] active:bg-[#f7f9fc]">
            Bekor qilish
          </button>
        ) : (
          <button type="button" onClick={() => { setErrs({}); setStep(step - 1); }} className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#dfe5ef] bg-white px-5 text-[14px] font-semibold text-[#4b5568] active:bg-[#f7f9fc]">
            <ArrowLeft className="size-4" /> Orqaga
          </button>
        )}
        <button type="button" onClick={next} disabled={upload !== ""} className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-4 text-[14.5px] font-bold text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)] active:bg-[#0058dd] disabled:opacity-60">
          {step < 2 ? "Keyingi bosqich" : product ? "Saqlash" : "Katalogga qo‘shish"}
          <ArrowRight className="size-4 shrink-0" />
        </button>
      </div>
    </>
  );

  if (!desktop) {
    return (
      <div role="dialog" aria-modal="true" aria-label={product ? "Mahsulotni tahrirlash" : "Mahsulot qo‘shish"} className="fixed inset-0 z-50 flex flex-col bg-[#f7f9fc]">
        <div className="flex items-center justify-between gap-3 border-b border-[#eef1f6] bg-white px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f1ff] text-[#0066FF]">
              <Package className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[17px] leading-tight font-extrabold tracking-tight text-[#0B1F4D]">{product ? "Mahsulotni tahrirlash" : "Mahsulot qo‘shish"}</h2>
              <p className="truncate text-[12px] text-[#6b7280]">{product ? "3 bosqichda yangilang" : "3 oddiy bosqichda qo‘shing"}</p>
            </div>
          </div>
          <button type="button" onClick={onDone} aria-label="Yopish" className="grid size-10 shrink-0 place-items-center rounded-full text-[#8b93a7] active:bg-[#f1f4f9]">
            <X className="size-5" />
          </button>
        </div>

        <ol className="flex items-start bg-white px-4 pt-3 pb-3.5 shadow-[0_1px_0_#e6eaf2]">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.title} className="flex flex-1 flex-col items-center last:flex-none first:flex-none">
                <div className="flex w-full items-center">
                  <span className={cn("h-px flex-1", i === 0 ? "bg-transparent" : i <= step ? "bg-[#16a34a]" : "bg-[#dfe5ef]")} />
                  <button type="button" aria-label={`${i + 1}-bosqich: ${s.title}`} aria-current={active ? "step" : undefined} onClick={() => goTo(i)} className={cn("mx-1 grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-bold", active ? "bg-[#0066FF] text-white shadow-[0_6px_14px_rgba(0,102,255,0.3)]" : done ? "bg-[#16a34a] text-white" : "border border-[#d5dbe7] bg-white text-[#8b93a7]")}>
                    {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                  </button>
                  <span className={cn("h-px flex-1", i === STEPS.length - 1 ? "bg-transparent" : i < step ? "bg-[#16a34a]" : "bg-[#dfe5ef]")} />
                </div>
                <span className={cn("mt-1.5 text-[12.5px] leading-tight font-bold", active ? "text-[#0066FF]" : "text-[#4b5568]")}>{s.title}</span>
              </li>
            );
          })}
        </ol>

        <div ref={bodyRef} className="min-h-0 flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-4 py-4">
          <p className="text-[12.5px] text-[#6b7280]">{step + 1}/3 · {STEPS[step].hint}</p>
          {centerContent}

          <section className="overflow-hidden rounded-2xl border border-[#e6eaf2] bg-white">
            <button type="button" aria-expanded={previewOpen} onClick={() => setPreviewOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
              <span className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f1ff] text-[#0066FF]"><Eye className="size-[18px]" /></span>
                <span className="text-[15px] font-bold text-[#0B1F4D]">Ko‘rinish (oldindan)</span>
              </span>
              <ChevronDown className={cn("size-5 text-[#8b93a7] transition-transform", previewOpen && "rotate-180")} />
            </button>
            {previewOpen ? <div id="wiz-preview" className="space-y-3 border-t border-[#eef1f6] bg-[#f7f9fc] p-3">{rightContent}</div> : null}
          </section>
        </div>

        <div className="border-t border-[#e6eaf2] bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-6px_18px_rgba(15,23,42,0.06)]">{footerBtns}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[3px] [@media(min-height:760px)]:p-6">
      <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={onDone} />
      <div role="dialog" aria-modal="true" className="relative flex max-h-full w-full max-w-[1360px] flex-col overflow-hidden rounded-[20px] bg-[#f7f9fc] shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        {/* header */}
        <div className="flex items-start justify-between gap-4 bg-white px-7 pt-5 pb-3 [@media(min-height:760px)]:pt-6 [@media(min-height:760px)]:pb-4">
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#e8f1ff] text-[#0066FF] [@media(max-height:760px)]:size-10">
              <Package className="size-6" />
            </span>
            <div>
              <h2 className="text-[22px] leading-tight font-extrabold tracking-tight text-[#0B1F4D] [@media(max-height:760px)]:text-[19px]">{product ? "Mahsulotni tahrirlash" : "Mahsulot qo‘shish"}</h2>
              <p className="mt-0.5 text-[13px] text-[#6b7280] [@media(max-height:760px)]:text-[12px]">{product ? "Mahsulot ma’lumotlarini 3 bosqichda yangilang" : "Yangi mahsulotingizni 3 oddiy bosqichda qo‘shing"}</p>
            </div>
          </div>
          <button type="button" onClick={onDone} aria-label="Yopish" className="grid size-10 place-items-center rounded-full text-[#8b93a7] hover:bg-[#f1f4f9] hover:text-[#1a1d26]">
            <X className="size-5" />
          </button>
        </div>

        {/* stepper */}
        <ol className="flex items-center gap-3 bg-white px-7 pb-4 [@media(min-height:760px)]:pb-5">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.title} className="flex flex-1 items-center gap-3 last:flex-none">
                <button type="button" onClick={() => goTo(i)} className="flex items-center gap-3 text-left">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-bold",
                      active ? "bg-[#0066FF] text-white shadow-[0_6px_14px_rgba(0,102,255,0.3)]" : done ? "bg-[#16a34a] text-white" : "border border-[#d5dbe7] bg-white text-[#8b93a7]",
                    )}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="leading-tight">
                    <span className={cn("block text-[14px] font-bold", active ? "text-[#0B1F4D]" : done ? "text-[#0B1F4D]" : "text-[#4b5568]")}>{s.title}</span>
                    <span className={cn("block text-[12px]", active ? "text-[#0066FF]" : "text-[#8b93a7]")}>{s.hint}</span>
                  </span>
                </button>
                {i < STEPS.length - 1 ? <span className={cn("h-px flex-1", i < step ? "bg-[#16a34a]" : "bg-[#dfe5ef]")} /> : null}
              </li>
            );
          })}
        </ol>

        {/* body */}
        <div className={cn("grid min-h-0 flex-1 gap-5 overflow-hidden border-t border-[#e6eaf2] px-7 py-5 [@media(max-height:760px)]:py-3", step === 0 ? "grid-cols-[minmax(0,1fr)_330px]" : "grid-cols-[220px_minmax(0,1fr)_330px]")}>
          {step > 0 ? (
            <aside className="min-h-0 space-y-3 overflow-y-auto">
              {miniCard(step === 1 ? "Tahrirlash" : "Oldindan ko‘rish", step === 1 ? () => goTo(0) : showPreview)}
              {verticalStepper}
            </aside>
          ) : null}
          <div ref={bodyRef} className="min-h-0 space-y-4 overflow-y-auto pr-1">
            {centerContent}
          </div>

          {/* right panel */}
          <aside className="min-h-0 space-y-3 overflow-y-auto">
            {rightContent}
          </aside>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[#e6eaf2] bg-white px-7 py-3.5 [@media(min-height:760px)]:py-4">
          {step === 0 ? (
            <button type="button" onClick={onDone} className="h-11 rounded-xl border border-[#dfe5ef] bg-white px-6 text-[14px] font-semibold text-[#4b5568] hover:bg-[#f7f9fc]">
              Bekor qilish
            </button>
          ) : (
            <button type="button" onClick={() => { setErrs({}); setStep(step - 1); }} className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#dfe5ef] bg-white px-5 text-[14px] font-semibold text-[#4b5568] hover:bg-[#f7f9fc]">
              <ArrowLeft className="size-4" /> Orqaga
            </button>
          )}
          <div className="flex items-center gap-2.5">
            {step === 2 ? (
              <button type="button" onClick={() => submit(true)} disabled={upload !== ""} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#dbe7ff] bg-white px-5 text-[14px] font-semibold text-[#0066FF] hover:bg-[#f3f8ff] disabled:opacity-60">
                <FolderOpen className="size-4" /> Qoralama saqlash
              </button>
            ) : null}
            <button type="button" onClick={next} disabled={upload !== ""} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0066FF] px-6 text-[14px] font-bold text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)] hover:bg-[#0058dd] disabled:opacity-60">
              {step < 2 ? "Keyingi bosqich" : product ? "Saqlash" : "Katalogga qo‘shish"}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
