import {
  categoryLabels,
  getProduct,
  productOldPrice,
  products,
  type Product,
} from "@/data/products";

export type ProductSpec = { label: string; value: string };

export type ProductDetails = {
  description: string;
  benefits: string[];
  usage: string;
  /** @deprecated Marketing slogan — not shown on clinic-grade PDP */
  slogan: string;
  delivery: string;
  specs: ProductSpec[];
  gallery: string[];
  stockQty: number;
  relatedIds: string[];
  /** Show «Sertifikat» chip on gallery */
  certified: boolean;
  /** Show «Rasmiy import» trust chip */
  officialImport: boolean;
  /** Uploaded certificates / instructions (seller products only) */
  docs?: { url: string; name: string; size?: number }[];
};

const sdr: ProductDetails = {
  description:
    "SDR flow+ — smart dentin replacement texnologiyasiga ega flowable bulk fill kompozit. Katta kavitlarni bir qatlamda to‘ldirish, polimerizatsiya stressini kamaytirish va mikro qochqin xavfini pasaytirish uchun klinik qo‘llanadi.",
  benefits: [
    "Bulk fill — 4 mm gacha bir qatlamda",
    "Past polimerizatsiya stressi",
    "Yaxshi kavit moslashuvi",
    "Uzoq muddatli mustahkamlik",
  ],
  usage:
    "Orqa tishlar Class I / II kavitlari, liner va dentinni almashtirish uchun. Ishlab chiqaruvchi IFU bo‘yicha qo‘llang.",
  slogan: "",
  delivery:
    "Toshkent bo‘yicha 24 soat ichida yetkazib berish. Viloyatlarga 2–3 ish kuni. Namuna logistika — haqiqiy jo‘natma yo‘q.",
  specs: [
    { label: "Brend", value: "Dentsply Sirona" },
    { label: "Tur", value: "Flowable bulk fill kompozit" },
    { label: "Rang", value: "A2 / Universal" },
    { label: "Qatlam", value: "4 mm gacha" },
    { label: "Qadoq", value: "2 × 2 g shprits" },
    { label: "Sterilizatsiya", value: "Klinik steril emas — steril maydonda ishlating" },
    { label: "Mamlakat", value: "Germaniya" },
  ],
  gallery: [
    "/images/sdr-flow-box.png",
    "/images/product-composite.png",
    "/images/product-unit.png",
    "/images/product-bond.png",
  ],
  stockQty: 24,
  relatedIds: ["denfil-nano", "gc-essentia", "3m-filtek-z250", "ivoclar-nflow"],
  certified: true,
  officialImport: true,
};

const ksenokost: ProductDetails = {
  description:
    "Mol ksenograft (mayda granulalar) — socket preservation, ridge augmentatsiya va kichik suyak nuqsonlarini to‘ldirish uchun. Qayta ishlangan bovin mineral matritsa, osteokonduktiv xususiyatli.",
  benefits: [
    "Mayda zarrachalar — qulay joylashtirish",
    "Osteokonduktiv matritsa",
    "Steril qadoq, klinik foydalanishga tayyor",
    "GBR protokollari bilan mos",
  ],
  usage:
    "Socket preservation, horizontal/vertical augmentatsiya, peri-implant nuqsonlar. Membrana bilan birgalikda qo‘llash tavsiya etiladi.",
  slogan: "",
  delivery:
    "Toshkent 24 soat. Viloyatlarga 2–3 ish kuni. Sovutish talab qilinmaydi. Namuna logistika.",
  specs: [
    { label: "Brend", value: "BioXen" },
    { label: "Tur", value: "Ksenograft (bovin)" },
    { label: "Zarracha", value: "Mayda (0.25–1 mm)" },
    { label: "Hajm", value: "0.15 g" },
    { label: "Indikatsiya", value: "Augmentatsiya, socket preservation" },
    { label: "Sterilizatsiya", value: "Gamma / EO steril, bir martalik" },
    { label: "Qadoq", value: "Flakon, 1 dona" },
    { label: "Mamlakat", value: "Yevropa Ittifoqi" },
  ],
  gallery: [
    "/images/dentrade/ksenokost-bychya.png",
    "/images/product-graft.png",
    "/images/product-unit.png",
    "/images/dentrade/ksenokost-bychya.png",
  ],
  stockQty: 28,
  relatedIds: ["osteon-bone", "colla-d-membrane", "osteon-collagen-type2", "bio-oss"],
  certified: true,
  officialImport: true,
};

const detailOverrides: Record<string, Partial<ProductDetails>> = {
  "sdr-flow": sdr,
  "ksenokost-bychya": ksenokost,
  "osteon-bone": {
    description:
      "Sintetik / ksenograft suyak materiali — ridge va sinus augmentatsiya uchun. Klinik steril qadoq.",
    benefits: [
      "Qulay granulometriya",
      "Osteokonduktiv tuzilma",
      "Steril, bir martalik qadoq",
      "Sinus va GBR protokollariga mos",
    ],
    usage: "Ridge augmentatsiya, sinus lift, peri-implant nuqsonlar.",
    slogan: "",
    specs: [
      { label: "Brend", value: "Osteon" },
      { label: "Tur", value: "Suyak materiali" },
      { label: "Zarracha", value: "0.5–1.0 mm" },
      { label: "Hajm", value: "0.5 cc" },
      { label: "Indikatsiya", value: "Augmentatsiya, sinus lift" },
      { label: "Sterilizatsiya", value: "Steril qadoq" },
    ],
    certified: true,
    officialImport: true,
    stockQty: 22,
  },
  "colla-d-membrane": {
    description:
      "Resorbsiya qilinadigan kollagen membrana — GBR/GTR to‘siq. Hard tip, 10×20 mm.",
    benefits: [
      "Yetarli mexanik mustahkamlik",
      "Bashqariladigan resorbsiya",
      "Steril qadoq",
      "Ksenograft bilan mos",
    ],
    usage: "GBR/GTR, socket preservation, peri-implant to‘siq.",
    slogan: "",
    specs: [
      { label: "Brend", value: "Colla-D" },
      { label: "Tur", value: "Kollagen membrana (Hard)" },
      { label: "O‘lcham", value: "10 × 20 mm" },
      { label: "Indikatsiya", value: "GBR / GTR" },
      { label: "Sterilizatsiya", value: "Steril, bir martalik" },
    ],
    certified: true,
    officialImport: true,
    stockQty: 18,
  },
  "denfil-nano": {
    description:
      "Nanogibrid restorativ kompozit — old va orqa tishlar uchun. Yaltiroqlik, ishchi qulaylik va uzoq muddatli estetika.",
    benefits: [
      "Nanogibrid to‘ldiruvchi",
      "Yaxshi yaltiroqlik",
      "Past qisqarish",
      "Universal klinik qo‘llanish",
    ],
    usage: "Class I–V restavratsiyalar, estetik old tish ishlari.",
    slogan: "",
    specs: [
      { label: "Brend", value: "Vericom" },
      { label: "Tur", value: "Nanogibrid kompozit" },
      { label: "Qadoq", value: "Shprits / kapsula to‘plami" },
      { label: "Indikatsiya", value: "Restavratsiya" },
      { label: "Sterilizatsiya", value: "Klinik steril emas" },
    ],
    certified: true,
    officialImport: true,
  },
  "dentium-nrline": {
    description:
      "Dentium NRLine — tor joylar uchun ixcham implant liniyasi. Steril qadoq, klinik sertifikat bilan.",
    benefits: ["Tor joylar uchun", "Barqaror osseointegratsiya", "Steril qadoq", "Rasmiy import"],
    usage: "Tor alveolar joylar, old zona implantatsiya.",
    slogan: "",
    specs: [
      { label: "Brend", value: "Dentium" },
      { label: "Tur", value: "Dental implant (NRLine)" },
      { label: "Indikatsiya", value: "Tor joy implantatsiya" },
      { label: "Sterilizatsiya", value: "Steril, bir martalik" },
    ],
    certified: true,
    officialImport: true,
  },
  "dentium-superline": {
    description:
      "Dentium SuperLine — keng qo‘llaniladigan implant tizimi. Barqaror osseointegratsiya va qulay protezlash.",
    benefits: ["Keng klinik qo‘llanish", "Qulay protezlash", "Steril qadoq", "Rasmiy import"],
    usage: "Standart va keng alveolar joylar.",
    slogan: "",
    specs: [
      { label: "Brend", value: "Dentium" },
      { label: "Tur", value: "Dental implant (SuperLine)" },
      { label: "Indikatsiya", value: "Standart implantatsiya" },
      { label: "Sterilizatsiya", value: "Steril, bir martalik" },
    ],
    certified: true,
    officialImport: true,
  },
};

function fallback(product: Product): ProductDetails {
  const peers = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4)
    .map((item) => item.id);

  const clinicalCats = new Set(["materiallar", "implantlar", "laboratoriya", "asboblar", "jihozlar"]);

  return {
    description:
      product.description?.trim() ||
      `${product.name} — ${product.brand} brendining klinik katalogdagi mahsuloti. Namuna ombor; haqiqiy jo‘natma yo‘q.`,
    benefits: [
      "Klinik amaliyot uchun mo‘ljallangan",
      "Toshkent bo‘yicha yetkazib berish",
      product.inStock ? "Omborda mavjud" : "Buyurtma asosida",
    ],
    usage: `${categoryLabels[product.category]} bo‘yicha ishlatiladi. Ko‘rsatma va sertifikatni e’londan oldin tekshiring.`,
    slogan: "",
    delivery: `${product.delivery}. Viloyatlarga 2–3 ish kuni. Namuna logistika.`,
    specs: [
      { label: "Brend", value: product.brand },
      { label: "Kategoriya", value: categoryLabels[product.category] },
      ...(product.kind ? [{ label: "Tur", value: product.kind }] : []),
      ...(product.sizes?.length ? [{ label: "O‘lcham", value: product.sizes.join(", ") }] : []),
      ...(product.gender ? [{ label: "Jins", value: product.gender }] : []),
      { label: "Yetkazib berish", value: product.delivery },
      { label: "Holat", value: product.inStock ? "Omborda" : "Buyurtma" },
    ],
    gallery: product.images?.length ? [product.image, ...product.images] : [product.image, "/images/product-unit.png", "/images/product-composite.png", product.image],
    stockQty: typeof product.stockQty === "number" ? product.stockQty : product.inStock ? 20 : 0,
    relatedIds: peers,
    certified: clinicalCats.has(product.category),
    officialImport: clinicalCats.has(product.category) && product.category !== "forma",
  };
}

const relatedOverrides: Record<string, string[]> = {
  "denfil-nano": ["sdr-flow", "gc-essentia", "3m-filtek-z250", "kerr-harmonize"],
  "dentium-nrline": ["dentium-superline", "gingiva-former", "implant-cover-screw", "straumann-blt"],
  "dentium-superline": ["dentium-nrline", "ios-scan-abutment", "gingiva-former", "physiodispenser"],
  "ksenokost-bychya": ["osteon-bone", "colla-d-membrane", "osteon-collagen-type2", "bio-oss"],
  "colla-d-membrane": ["mha-membrane-20x30", "collagen-graft-20x40", "ti-mesh-membrane", "osteon-bone"],
  "osteon-bone": ["ksenokost-bychya", "osteon-collagen-type3", "osteon-sinus-syringe", "colla-d-membrane"],
  "endomotor-ecube": ["iroot-apex", "strong-210", "nsk-timax", "uv-lampa"],
  "iroot-apex": ["endomotor-ecube", "prox-xray", "strong-210", "nsk-timax"],
  "prox-xray": ["physiodispenser", "uv-lampa", "endomotor-ecube", "iroot-apex"],
  physiodispenser: ["prox-xray", "dentium-superline", "nsk-surgic-pro2", "strong-210"],
  "strong-210": ["endomotor-ecube", "artex-cr", "nsk-timax", "uv-lampa"],
  "uv-lampa": ["prox-xray", "strong-210", "endomotor-ecube", "iroot-apex"],
  "gc-essentia": ["sdr-flow", "denfil-nano", "ivoclar-nflow", "kerr-optibond"],
  "3m-filtek-z250": ["sdr-flow", "denfil-nano", "kerr-harmonize", "kerr-optibond"],
};

/** DentTrade product shots — gallery leads with downloaded /images/dentrade/{id}.png */
const galleryOverrides: Record<string, string[]> = {
  "denfil-nano": ["/images/dentrade/denfil-nano.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/denfil-nano.png"],
  "dentium-nrline": ["/images/dentrade/dentium-nrline.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/dentium-nrline.png"],
  "dentium-superline": ["/images/dentrade/dentium-superline.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/dentium-superline.png"],
  "ksenokost-bychya": ["/images/dentrade/ksenokost-bychya.png", "/images/product-graft.png", "/images/product-unit.png", "/images/dentrade/ksenokost-bychya.png"],
  "colla-d-membrane": ["/images/dentrade/colla-d-membrane.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/colla-d-membrane.png"],
  "osteon-bone": ["/images/dentrade/osteon-bone.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/osteon-bone.png"],
  "uv-lampa": ["/images/dentrade/uv-lampa.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/uv-lampa.png"],
  "endomotor-ecube": ["/images/dentrade/endomotor-ecube.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/endomotor-ecube.png"],
  "iroot-apex": ["/images/dentrade/iroot-apex.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/iroot-apex.png"],
  "prox-xray": ["/images/dentrade/prox-xray.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/prox-xray.png"],
  "strong-210": ["/images/dentrade/strong-210.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/strong-210.png"],
  physiodispenser: ["/images/dentrade/physiodispenser.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/physiodispenser.png"],
  "gingiva-former": ["/images/dentrade/gingiva-former.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/gingiva-former.png"],
  "ios-scan-abutment": ["/images/dentrade/ios-scan-abutment.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/ios-scan-abutment.png"],
  "implant-cover-screw": ["/images/dentrade/implant-cover-screw.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/implant-cover-screw.png"],
  "mha-membrane-20x30": ["/images/dentrade/mha-membrane-20x30.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/mha-membrane-20x30.png"],
  "collagen-graft-20x40": ["/images/dentrade/collagen-graft-20x40.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/collagen-graft-20x40.png"],
  "ti-mesh-membrane": ["/images/dentrade/ti-mesh-membrane.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/ti-mesh-membrane.png"],
  "ptfe-micropor-frame": ["/images/dentrade/ptfe-micropor-frame.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/ptfe-micropor-frame.png"],
  "osteon-collagen-type2": ["/images/dentrade/osteon-collagen-type2.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/osteon-collagen-type2.png"],
  "osteon-collagen-type3": ["/images/dentrade/osteon-collagen-type3.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/osteon-collagen-type3.png"],
  "osteon-sinus-syringe": ["/images/dentrade/osteon-sinus-syringe.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/osteon-sinus-syringe.png"],
  "tissue-nipper-tn375": ["/images/dentrade/tissue-nipper-tn375.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/tissue-nipper-tn375.png"],
  "bone-scraper-sd13": ["/images/dentrade/bone-scraper-sd13.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/bone-scraper-sd13.png"],
  "seldin-raspator-pes365": ["/images/dentrade/seldin-raspator-pes365.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/seldin-raspator-pes365.png"],
  "adson-forceps-tf372": ["/images/dentrade/adson-forceps-tf372.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/adson-forceps-tf372.png"],
  "bone-rongeur-br377": ["/images/dentrade/bone-rongeur-br377.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/bone-rongeur-br377.png"],
  "mallet-mt414": ["/images/dentrade/mallet-mt414.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/mallet-mt414.png"],
  "castro-caliper-gag416": ["/images/dentrade/castro-caliper-gag416.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/castro-caliper-gag416.png"],
  "saliva-ejector-tc336": ["/images/dentrade/saliva-ejector-tc336.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/saliva-ejector-tc336.png"],
  "titan-suction-suc02": ["/images/dentrade/titan-suction-suc02.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/titan-suction-suc02.png"],
  "minnesota-retractor-rc409": ["/images/dentrade/minnesota-retractor-rc409.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/minnesota-retractor-rc409.png"],
  "mirror-mir407": ["/images/dentrade/mirror-mir407.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/mirror-mir407.png"],
  "scalpel-handle-mh367": ["/images/dentrade/scalpel-handle-mh367.png", "/images/product-unit.png", "/images/product-composite.png", "/images/dentrade/scalpel-handle-mh367.png"],
};

/**
 * Seller (DB) products: every uploaded photo, in the seller's order — cover (`image`) first, then `images`.
 * Deduped, no filler pictures; a single-photo product yields a one-image gallery.
 */
export function sellerGallery(product: Pick<Product, "image" | "images">): string[] {
  const list = [product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(
    (src): src is string => typeof src === "string" && src.length > 0,
  );
  return [...new Set(list)].slice(0, 10);
}

/** Real, seller-entered details for DB products — replaces the generic sample-catalog copy. */
function sellerDetails(product: Product): Partial<ProductDetails> {
  const a = product.attrs ?? {};
  const money = (n: number) => `${new Intl.NumberFormat("ru-RU").format(n)} so‘m`;
  const expiry = a.expiryDate ? a.expiryDate.split("-").reverse().join(".") : "";
  const rows: ProductSpec[] = [
    { label: "Brend", value: product.brand },
    { label: "Kategoriya", value: categoryLabels[product.category] },
    ...(product.subcategory ? [{ label: "Kichik kategoriya", value: product.subcategory }] : []),
    ...(a.manufacturer ? [{ label: "Ishlab chiqaruvchi", value: a.manufacturer }] : []),
    ...(a.model ? [{ label: "Model", value: a.model }] : []),
    ...(a.color ? [{ label: "Rang", value: a.color }] : []),
    ...(a.volume ? [{ label: "Hajm / og‘irlik", value: a.volume }] : []),
    ...(a.packCount ? [{ label: "Qadoqdagi soni", value: a.packCount }] : []),
    ...(a.type ? [{ label: "Turi", value: a.type }] : []),
    ...(a.usage ? [{ label: "Qo‘llanish sohasi", value: a.usage }] : []),
    ...(a.curing ? [{ label: "Qotish usuli", value: a.curing }] : []),
    ...(a.storage ? [{ label: "Saqlash sharoiti", value: a.storage }] : []),
    ...(a.shelfLife ? [{ label: "Yaroqlilik muddati (davomiyligi)", value: a.shelfLife }] : []),
    ...(a.lot ? [{ label: "Partiya raqami (LOT)", value: a.lot }] : []),
    ...(expiry ? [{ label: "Yaroqlilik sanasi", value: expiry }] : []),
    ...(product.sku ? [{ label: "SKU", value: product.sku }] : []),
    ...(product.kind ? [{ label: "Tur", value: product.kind }] : []),
    ...(product.sizes?.length ? [{ label: "O‘lcham", value: product.sizes.join(", ") }] : []),
    ...(a.minOrder && a.minOrder > 1 ? [{ label: "Minimal buyurtma", value: `${a.minOrder} dona` }] : []),
    ...(a.wholesale ? [{ label: "Ulgurji narx", value: money(a.wholesale) }] : []),
  ];
  const benefits = [
    product.inStock ? `Omborda mavjud${typeof product.stockQty === "number" ? ` (${product.stockQty} dona)` : ""}` : "Hozircha omborda yo‘q",
    ...(a.freeDelivery ? ["Bepul yetkazib berish"] : a.deliveryPrice ? [`Yetkazib berish: ${money(a.deliveryPrice)}`] : []),
    ...(a.isNew ? ["Yangi mahsulot"] : []),
    ...(a.recommended ? ["Sotuvchi tavsiyasi"] : []),
    ...(a.limited ? ["Cheklangan miqdorda"] : []),
  ];
  return {
    description: product.description?.trim() || a.shortDescription || "",
    benefits,
    usage: a.usage ?? "",
    delivery: [product.delivery, a.deliveryRegion].filter(Boolean).join(" · "),
    specs: rows,
    docs: a.docs ?? [],
    gallery: sellerGallery(product),
    certified: Boolean(a.docs?.length),
    officialImport: false,
  };
}

export function getProductDetails(product: Product): ProductDetails {
  const base = product.id === "sdr-flow" ? { ...sdr } : fallback(product);
  const override = detailOverrides[product.id];
  if (override) Object.assign(base, override);
  const related = relatedOverrides[product.id];
  if (related) base.relatedIds = related;
  const gallery = galleryOverrides[product.id];
  if (gallery) base.gallery = gallery;
  if (product.listedBySeller) Object.assign(base, sellerDetails(product));
  if (base.certified === undefined) base.certified = product.category !== "forma";
  if (base.officialImport === undefined) base.officialImport = product.category !== "forma";
  return base;
}

export function relatedProducts(product: Product) {
  const ids = getProductDetails(product).relatedIds;
  return ids.map((id) => getProduct(id)).filter((item): item is Product => Boolean(item));
}

export function productMaxQty(product: Product) {
  if (typeof product.stockQty === "number" && product.stockQty > 0) {
    return Math.max(1, Math.min(99, product.stockQty));
  }
  const stock = getProductDetails(product).stockQty;
  return Math.max(1, stock || 20);
}

export { productOldPrice };
