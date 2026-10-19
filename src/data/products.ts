export type ProductCategory =
  | "materiallar"
  | "implantlar"
  | "asboblar"
  | "jihozlar"
  | "laboratoriya"
  | "forma";

export type ApparelKind = "xalat" | "scrub" | "qalpoq" | "poyabzal";
export type ApparelGender = "erkak" | "ayol" | "unisex";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  oldPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  delivery: string;
  image: string;
  demo?: boolean;
  kind?: ApparelKind;
  sizes?: string[];
  gender?: ApparelGender;
  colors?: string[];
  featured?: boolean;
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
  /** Catalog page for this line. Kept on cart snapshots so /savat can link back. */
  href?: string;
  description?: string;
  stockQty?: number;
  active?: boolean;
  listedBySeller?: boolean;
  /** Seller-entered (optional) SKU, subcategory and extra gallery images. */
  sku?: string;
  subcategory?: string;
  images?: string[];
  attrs?: ProductAttrs;
  /** Marketplace holati — omitted means "yangi". */
  condition?: ProductCondition;
  /** Optional explicit spec pills (otherwise derived from the name). */
  specs?: string[];
};

export type ProductAttrs = {
  minOrder?: number;
  wholesale?: number;
  stockStatus?: "mavjud" | "buyurtma" | "tugagan";
  lot?: string;
  /** yyyy-mm-dd */
  expiryDate?: string;
  deliveryMethod?: "own" | "market" | "mixed";
  deliveryRegion?: string;
  deliveryPrice?: number;
  freeDelivery?: boolean;
  shortDescription?: string;
  manufacturer?: string;
  model?: string;
  color?: string;
  volume?: string;
  packCount?: string;
  type?: string;
  usage?: string;
  curing?: string;
  storage?: string;
  shelfLife?: string;
  docs?: { url: string; name: string; size?: number }[];
  isNew?: boolean;
  recommended?: boolean;
  limited?: boolean;
};

export type ProductCondition = "yangi" | "ishlatilgan" | "ochilgan";

export const categoryTabs: { id: ProductCategory; label: string }[] = [
  { id: "materiallar", label: "Materiallar" },
  { id: "implantlar", label: "Implantlar" },
  { id: "asboblar", label: "Asboblar" },
  { id: "jihozlar", label: "Jihozlar" },
  { id: "laboratoriya", label: "Laboratoriya" },
  { id: "forma", label: "Forma" },
];

export const categoryLabels: Record<ProductCategory, string> = {
  materiallar: "Materiallar",
  implantlar: "Implantlar",
  asboblar: "Asboblar",
  jihozlar: "Jihozlar",
  laboratoriya: "Laboratoriya",
  forma: "Forma",
};

export const products: Product[] = [
  // ——— DentTrade-inspired (real listed prices) ———
  {
    id: "denfil-nano",
    name: "DenFil Nano nanogibrid kompozit",
    brand: "Vericom",
    category: "materiallar",
    price: 867_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/denfil-nano.png",
    description:
      "Nanogibrid restorativ kompozit — old va orqa tishlar uchun. Yaxshi yaltiroqlik va ishchi qulaylik.",
    featured: true,
    demo: true,
  },
  {
    id: "dentium-nrline",
    name: "NRLine implant",
    brand: "Dentium",
    category: "implantlar",
    price: 765_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/dentium-nrline.png",
    description:
      "Dentium NRLine — tor joylar uchun ixcham implant liniyasi. Steril qadoq, klinik sertifikat bilan.",
    featured: true,
    demo: true,
  },
  {
    id: "dentium-superline",
    name: "SuperLine implant",
    brand: "Dentium",
    category: "implantlar",
    price: 765_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/dentium-superline.png",
    description:
      "Dentium SuperLine — keng qo‘llaniladigan implant tizimi. Barqaror osseointegratsiya va qulay protezlash.",
    featured: true,
    demo: true,
  },
  {
    id: "ksenokost-bychya",
    name: "Ksenosuyak (mol) mayda, 0.15g",
    brand: "BioXen",
    category: "laboratoriya",
    price: 357_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/ksenokost-bychya.png",
    description:
      "Mol ksenograft mayda granulalar, 0.15 g. Augmentatsiya va socket preservation uchun.",
    featured: true,
    demo: true,
  },
  {
    id: "colla-d-membrane",
    name: "Kollagen membrana Colla-D Hard 10×20",
    brand: "Colla-D",
    category: "laboratoriya",
    price: 612_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/colla-d-membrane.png",
    description:
      "Resorbsiya qilinadigan kollagen membrana 10×20 mm. GBR/GTR to‘siq vazifasi.",
    featured: true,
    demo: true,
  },
  {
    id: "osteon-bone",
    name: "Osteon suyak materiali",
    brand: "Osteon",
    category: "laboratoriya",
    price: 510_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/osteon-bone.png",
    description:
      "Sintetik suyak o‘rnini bosuvchi material. Sinus lift va ridge augmentatsiya uchun.",
    featured: true,
    demo: true,
  },
  {
    id: "uv-lampa",
    name: "Ultrabinafsha lampa",
    brand: "UV Pro",
    category: "jihozlar",
    price: 2_754_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–5 kun",
    image: "/images/dentrade/uv-lampa.png",
    description:
      "Klinik UV lampa — sterilizatsiya va yuzalarni dezinfeksiya qilish uchun.",
    featured: true,
    demo: true,
  },
  {
    id: "endomotor-ecube",
    name: "Endomotor E-Cube",
    brand: "E-Cube",
    category: "jihozlar",
    price: 6_120_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–5 kun",
    image: "/images/dentrade/endomotor-ecube.png",
    description:
      "Endodontik motor — torque va tezlikni sozlash, fayl himoyasi. Kanal ishlov uchun.",
    featured: true,
    demo: true,
  },
  {
    id: "iroot-apex",
    name: "Apex-lokator I-Root (5-avlod)",
    brand: "I-Root",
    category: "jihozlar",
    price: 4_590_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–5 kun",
    image: "/images/dentrade/iroot-apex.png",
    description:
      "5-avlod apex-lokator — ishonchli ishchi uzunlik o‘lchovi, nam muhitda barqaror.",
    featured: true,
    demo: true,
  },
  {
    id: "prox-xray",
    name: "Portativ rentgen PROX",
    brand: "PROX",
    category: "jihozlar",
    price: 25_500_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–5 kun",
    image: "/images/dentrade/prox-xray.png",
    description:
      "Portativ intraoral rentgen apparati. Klinikada tez diagnostika uchun.",
    featured: true,
    demo: true,
  },
  {
    id: "strong-210",
    name: "Laboratoriya mikromotor Strong 210",
    brand: "Saeshin",
    category: "jihozlar",
    price: 1_326_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–5 kun",
    image: "/images/dentrade/strong-210.png",
    description:
      "Zubotexnik mikromotor Strong 210 — lab ishlari, frezalash va silliqlash uchun.",
    featured: true,
    demo: true,
  },
  {
    id: "physiodispenser",
    name: "Implantologiya fiziodispenseri (fibrooptik)",
    brand: "Implant Pro",
    category: "jihozlar",
    price: 25_500_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–5 kun",
    image: "/images/dentrade/physiodispenser.png",
    description:
      "Fibrooptikli implantologiya fiziodispenseri — suv sovutish va jarrohlik motor.",
    featured: true,
    demo: true,
  },

  // ——— Implant komponentlari ———
  {
    id: "gingiva-former",
    name: "Desna shakllantiruvchi (gingiva former)",
    brand: "Dentium",
    category: "implantlar",
    price: 185_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/gingiva-former.png",
    description:
      "Desna shakllantiruvchi — ikkinchi bosqichda yumshoq to‘qima konturini yaratish uchun.",
    demo: true,
  },
  {
    id: "ios-scan-abutment",
    name: "IOS skanerlanadigan abutment",
    brand: "Dentium",
    category: "implantlar",
    price: 420_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/ios-scan-abutment.png",
    description:
      "Intraoral skaner uchun scan abutment. Raqamli izlash va CAD/CAM oqimiga mos.",
    demo: true,
  },
  {
    id: "implant-cover-screw",
    name: "Implant zaglushka (cover screw)",
    brand: "Dentium",
    category: "implantlar",
    price: 95_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/implant-cover-screw.png",
    description:
      "Cover screw — birinchi bosqichda implant platformasini yopish uchun.",
    demo: true,
  },
  {
    id: "straumann-blt",
    name: "BLT Implant (4.1×10mm)",
    brand: "Straumann",
    category: "implantlar",
    price: 1_250_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/product-implant.png",
    description:
      "Bone Level Tapered implant, Ø4.1×10 mm. SLA sirt, RN platform. Steril qadoq.",
    featured: true,
    demo: true,
  },

  // ——— Laboratoriya / regeneratsiya ———
  {
    id: "mha-membrane-20x30",
    name: "Kollagen membrana MHA 20×30",
    brand: "Osteon",
    category: "laboratoriya",
    price: 480_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/mha-membrane-20x30.png",
    description:
      "MHA kollagen membrana 20×30 mm — keng defectlar uchun GBR to‘sig‘i.",
    demo: true,
  },
  {
    id: "collagen-graft-20x40",
    name: "Collagen Graft 20×40",
    brand: "Osteon",
    category: "laboratoriya",
    price: 520_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/collagen-graft-20x40.png",
    description:
      "Kollagen graft varaq 20×40 mm — yumshoq to‘qima regeneratsiyasi va yopish uchun.",
    demo: true,
  },
  {
    id: "ti-mesh-membrane",
    name: "Ti Mesh titan membrana",
    brand: "Osteon",
    category: "laboratoriya",
    price: 890_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/ti-mesh-membrane.png",
    description:
      "Titan mesh membrana — vertical/horizontal augmentatsiyada hajmni ushlab turish.",
    demo: true,
  },
  {
    id: "ptfe-micropor-frame",
    name: "PTFE mikropor membrana titan karkas",
    brand: "Osteon",
    category: "laboratoriya",
    price: 1_150_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/ptfe-micropor-frame.png",
    description:
      "Mikropor PTFE membrana titan karkas bilan — murakkab GBR holatlari uchun.",
    demo: true,
  },
  {
    id: "osteon-collagen-type2",
    name: "Osteon kollagen 2-tip silindr",
    brand: "Osteon",
    category: "laboratoriya",
    price: 390_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/osteon-collagen-type2.png",
    description:
      "Osteon + kollagen 2-tip silindr — namlanib shakllanadi, socket va kichik defectlar uchun.",
    demo: true,
  },
  {
    id: "osteon-collagen-type3",
    name: "Osteon kollagen 3-tip silindr",
    brand: "Osteon",
    category: "laboratoriya",
    price: 410_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/osteon-collagen-type3.png",
    description:
      "Osteon III + kollagen silindr — yuqori gözeneklilik, tez shakllanish va yaxshi handling.",
    demo: true,
  },
  {
    id: "osteon-sinus-syringe",
    name: "Osteon sinus-lifting shprits",
    brand: "Osteon",
    category: "laboratoriya",
    price: 560_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/osteon-sinus-syringe.png",
    description:
      "Sinus-lifting uchun tayyor graft shprits — aniq dozalash va qulay joylashtirish.",
    demo: true,
  },
  {
    id: "bio-oss",
    name: "Bio-Oss Pen 0.25g",
    brand: "Geistlich",
    category: "laboratoriya",
    price: 1_700_000,
    discount: 10,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/product-biooss-pen.png",
    description:
      "Suyak graft pen 0.25 g. Augmentatsiya va sinus lift uchun.",
    demo: true,
  },
  {
    id: "artex-cr",
    condition: "ishlatilgan",
    name: "CR Articulator",
    brand: "Artex",
    category: "laboratoriya",
    price: 8_900_000,
    discount: 5,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–5 kun",
    image: "/images/product-articulator.png",
    description:
      "Laboratoriya artikulyatori — to‘liq sozlanuvchi. Protez va crown/bridge ishlari uchun.",
    demo: true,
  },

  // ——— Asboblar (jarrohlik) ———
  {
    id: "tissue-nipper-tn375",
    name: "Tissue nipper TN-375",
    brand: "Osung",
    category: "asboblar",
    price: 275_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/tissue-nipper-tn375.png",
    description:
      "Tissue nipper TN-375 — yumshoq to‘qimalarni aniq kesish va shakllantirish.",
    demo: true,
  },
  {
    id: "bone-scraper-sd13",
    name: "Suyak qirg‘ich SD-13KT/G",
    brand: "Osung",
    category: "asboblar",
    price: 310_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/bone-scraper-sd13.png",
    description:
      "Suyak qirg‘ich SD-13KT/G — autogen chip olish va defect to‘ldirish uchun.",
    demo: true,
  },
  {
    id: "seldin-raspator-pes365",
    name: "Seldin raspator PES-365",
    brand: "Osung",
    category: "asboblar",
    price: 265_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/seldin-raspator-pes365.png",
    description:
      "Seldin raspator — periostni ajratish va flap ko‘tarish uchun klassik asbob.",
    demo: true,
  },
  {
    id: "adson-forceps-tf372",
    name: "Adson pinset 12sm TF-372",
    brand: "Osung",
    category: "asboblar",
    price: 180_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/adson-forceps-tf372.png",
    description:
      "Adson pinset 12 sm — nozik to‘qima ushlash, jarrohlik va shisha ishlari.",
    demo: true,
  },
  {
    id: "bone-rongeur-br377",
    name: "Suyak qisqichlari BR-377",
    brand: "Osung",
    category: "asboblar",
    price: 340_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/bone-rongeur-br377.png",
    description:
      "Suyak qisqichlari (rongeur) BR-377 — qirralarni tekislash va suyakni qirqish.",
    demo: true,
  },
  {
    id: "mallet-mt414",
    name: "Mallet 16mm MT-414",
    brand: "Osung",
    category: "asboblar",
    price: 290_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/mallet-mt414.png",
    description:
      "Jarrohlik bolg‘acha 16 mm — osteotom va chisellar bilan ishlash uchun.",
    demo: true,
  },
  {
    id: "castro-caliper-gag416",
    name: "Castro kaliper GAG-416",
    brand: "Osung",
    category: "asboblar",
    price: 255_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/castro-caliper-gag416.png",
    description:
      "Castroviejo kaliper — implant va soft tissue o‘lchovlari uchun.",
    demo: true,
  },
  {
    id: "saliva-ejector-tc336",
    name: "So‘lak tutgich TC-336",
    brand: "Osung",
    category: "asboblar",
    price: 120_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/saliva-ejector-tc336.png",
    description:
      "So‘lak tutgich — chairside so‘rg‘ichni bemor og‘zida ushlab turish.",
    demo: true,
  },
  {
    id: "titan-suction-suc02",
    name: "Titan so‘lakso‘rg‘ich SUC-02",
    brand: "Osung",
    category: "asboblar",
    price: 210_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/titan-suction-suc02.png",
    description:
      "Titan so‘lakso‘rg‘ich SUC-02 — yengil, korroziyaga chidamli, avtoklavga mos.",
    demo: true,
  },
  {
    id: "minnesota-retractor-rc409",
    name: "Minnesota retractor RC-409",
    brand: "Osung",
    category: "asboblar",
    price: 240_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/minnesota-retractor-rc409.png",
    description:
      "Minnesota retractor — labiya/yonoqni ushlab, jarrohlik maydonini ochish.",
    demo: true,
  },
  {
    id: "mirror-mir407",
    name: "Ko‘zgu MIR-407",
    brand: "Osung",
    category: "asboblar",
    price: 95_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/mirror-mir407.png",
    description:
      "Stomatologik ko‘zgu MIR-407 — diagnostika va yorug‘likni yo‘naltirish.",
    demo: true,
  },
  {
    id: "scalpel-handle-mh367",
    name: "Skalpel tutqich MH-367",
    brand: "Osung",
    category: "asboblar",
    price: 145_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/dentrade/scalpel-handle-mh367.png",
    description:
      "Skalpel tutqich MH-367 — standart pichoqlar uchun ergonomik tutqich.",
    demo: true,
  },
  {
    id: "hu-friedy-gracey",
    name: "Gracey Kyuret 7/8",
    brand: "Hu-Friedy",
    category: "asboblar",
    price: 320_000,
    discount: 10,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/product-curette.png",
    description:
      "Gracey 7/8 kyuret — bukkal/lingual orqa tishlar uchun. Ergonomik tutqich.",
    demo: true,
  },
  {
    id: "cattani-suction",
    condition: "ochilgan",
    name: "Suction Tip (100 dona)",
    brand: "Cattani",
    category: "asboblar",
    price: 90_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/product-suction.png",
    description:
      "Bir martalik so‘rg‘ich uchlari, 100 dona. Standart 11 mm adapter.",
    demo: true,
  },

  // ——— Materiallar (staples + DentTrade dominant featured) ———
  {
    id: "sdr-flow",
    name: "SDR flow+ Kompozit (A2)",
    brand: "Dentsply Sirona",
    category: "materiallar",
    price: 185_000,
    oldPrice: 217_650,
    discount: 15,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/sdr-flow-box.png",
    description:
      "Flowable bulk-fill kompozit: 4 mm gacha bir qatlamda, past polimerizatsiya stressi.",
    featured: true,
    demo: true,
  },
  {
    id: "kerr-optibond",
    name: "OptiBond Solo Plus",
    brand: "Kerr",
    category: "materiallar",
    price: 275_000,
    discount: 15,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/product-optibond.png",
    description:
      "Yagona shisha flakonli total-etch bonding. Emal va dentinga ishonchli yopishish.",
    demo: true,
  },
  {
    id: "3m-single-bond",
    name: "Single Bond Universal",
    brand: "3M",
    category: "materiallar",
    price: 265_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/product-bond.png",
    description:
      "Universal adhesive — self-etch yoki total-etch. To‘g‘ridan-to‘g‘ri shpritsdan.",
    demo: true,
  },
  {
    id: "gc-essentia",
    name: "Essentia Universal Kompozit A2",
    brand: "GC",
    category: "materiallar",
    price: 145_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/product-composite.png",
    description:
      "Universal kompozit A2 — oddiy rang tanlash, yaxshi yaltiroqlik.",
    demo: true,
  },
  {
    id: "3m-filtek-z250",
    name: "Filtek Z250 XT Kompozit A2",
    brand: "3M",
    category: "materiallar",
    price: 132_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/product-composite.png",
    description:
      "Universal restavratsiya kompoziti A2. Ishonchli klinik standart.",
    demo: true,
  },
  {
    id: "ivoclar-nflow",
    name: "Tetric N-Flow Kompozit A2",
    brand: "Ivoclar",
    category: "materiallar",
    price: 168_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/product-optibond.png",
    description:
      "Flowable kompozit A2 — liner va kichik kavitlar uchun.",
    demo: true,
  },
  {
    id: "kerr-harmonize",
    condition: "ochilgan",
    name: "Harmonize Kompozit A2",
    brand: "Kerr",
    category: "materiallar",
    price: 198_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/product-bond.png",
    description:
      "Nanogibrid kompozit A2, tabiiy opalesensiya.",
    demo: true,
  },
  {
    id: "gc-fuji",
    name: "Fuji IX GP Fast",
    brand: "GC",
    category: "materiallar",
    price: 210_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 24 soat",
    image: "/images/product-composite.png",
    description:
      "Glass ionomer restorativ, tez qotish. Fluorid chiqaradi.",
    demo: true,
  },

  // ——— Jihozlar (qo‘shimcha) ———
  {
    id: "nsk-timax",
    name: "Ti-Max X95L Qo‘lcha",
    brand: "NSK",
    category: "jihozlar",
    price: 4_350_000,
    discount: 10,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–5 kun",
    image: "/images/product-handpiece.png",
    description:
      "Titan korpusli tezlik qo‘lcha, LED yoritish, 1:5. Premium klinik sinf.",
    demo: true,
  },
  {
    id: "nsk-surgic-pro2",
    name: "NSK Surgic Pro2",
    brand: "NSK",
    category: "jihozlar",
    price: 21_250_000,
    discount: 10,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–5 kun",
    image: "/images/product-motor.png",
    description:
      "Jarrohlik motor tizimi — implantatsiya va suyak ishlari. Touch-screen boshqaruv.",
    demo: true,
  },

  // ——— Forma (KEEP ALL intact) ———
  {
    id: "forma-ali-01",
    name: "Bestex logo tibbiy scrub to‘plam",
    brand: "Bestex",
    category: "forma",
    kind: "scrub",
    price: 105_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-01.jpg",
    description:
      "Bestex logo tibbiy scrub to‘plam — Bestex. Rang: yashil. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["teal"],
    featured: true,
  },
  {
    id: "forma-ali-02",
    name: "Ayollar klinika scrub to‘plam",
    brand: "HNLZL",
    category: "forma",
    kind: "scrub",
    price: 165_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-02.jpg",
    description:
      "Ayollar klinika scrub to‘plam — HNLZL. Rang: to‘q ko‘k. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["navy"],
    featured: true,
  },
  {
    id: "forma-ali-03",
    name: "Bestex jarrohlik scrub to‘plam",
    brand: "Bestex",
    category: "forma",
    kind: "scrub",
    price: 123_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-03.jpg",
    description:
      "Bestex jarrohlik scrub to‘plam — Bestex. Rang: yashil. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["teal"],
    featured: true,
  },
  {
    id: "forma-ali-04",
    name: "Stand-collar dental scrub ko‘ylak",
    brand: "Zhengxing",
    category: "forma",
    kind: "scrub",
    price: 77_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-04.jpg",
    description:
      "Stand-collar dental scrub ko‘ylak — Zhengxing. Rang: qora. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["black"],
    featured: true,
  },
  {
    id: "forma-ali-05",
    name: "Bestex tibbiy scrub to‘plam",
    brand: "Bestex",
    category: "forma",
    kind: "scrub",
    price: 123_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-05.jpg",
    description:
      "Bestex tibbiy scrub to‘plam — Bestex. Rang: oq. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["white"],
    featured: true,
  },
  {
    id: "forma-ali-06",
    name: "Och ko‘k flared scrub to‘plam",
    brand: "Yangdao",
    category: "forma",
    kind: "scrub",
    price: 154_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-06.jpg",
    description:
      "Och ko‘k flared scrub to‘plam — Yangdao. Rang: moviy. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["sky"],
    featured: true,
  },
  {
    id: "forma-ali-07",
    name: "Yengsiz jogger scrub to‘plam",
    brand: "Zhengxing",
    category: "forma",
    kind: "scrub",
    price: 154_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-07.jpg",
    description:
      "Yengsiz jogger scrub to‘plam — Zhengxing. Rang: to‘q ko‘k. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["navy"],
    featured: true,
  },
  {
    id: "forma-ali-08",
    name: "Crew-neck wide-leg scrub to‘plam",
    brand: "Azure",
    category: "forma",
    kind: "scrub",
    price: 115_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-08.jpg",
    description:
      "Crew-neck wide-leg scrub to‘plam — Azure. Rang: to‘q ko‘k. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["navy"],
    featured: true,
  },
  {
    id: "forma-ali-09",
    name: "Ayollar flare-leg scrub to‘plam",
    brand: "Zhengxing",
    category: "forma",
    kind: "scrub",
    price: 164_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-09.jpg",
    description:
      "Ayollar flare-leg scrub to‘plam — Zhengxing. Rang: to‘q ko‘k. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["navy"],
  },
  {
    id: "forma-ali-10",
    name: "Polo stretch scrub to‘plam",
    brand: "Zhengxing",
    category: "forma",
    kind: "scrub",
    price: 154_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-10.jpg",
    description:
      "Polo stretch scrub to‘plam — Zhengxing. Rang: yashil. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["teal"],
  },
  {
    id: "forma-ali-11",
    name: "12-cho‘ntak jogger scrub to‘plam",
    brand: "HNLZL",
    category: "forma",
    kind: "scrub",
    price: 128_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-11.jpg",
    description:
      "12-cho‘ntak jogger scrub to‘plam — HNLZL. Rang: qora. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["black"],
  },
  {
    id: "forma-ali-12",
    name: "2026 qulay scrub to‘plam",
    brand: "Nanjing",
    category: "forma",
    kind: "scrub",
    price: 75_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-12.jpg",
    description:
      "2026 qulay scrub to‘plam — Nanjing. Rang: yashil. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["teal"],
  },
  {
    id: "forma-ali-13",
    name: "V-yaka scrub to‘plam",
    brand: "Qingdao",
    category: "forma",
    kind: "scrub",
    price: 198_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-13.jpg",
    description:
      "V-yaka scrub to‘plam — Qingdao. Rang: to‘q ko‘k. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["navy"],
  },
  {
    id: "forma-ali-14",
    name: "Ayollar spandex scrub to‘plam",
    brand: "Zhengxing",
    category: "forma",
    kind: "scrub",
    price: 118_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-14.jpg",
    description:
      "Ayollar spandex scrub to‘plam — Zhengxing. Rang: to‘q ko‘k. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["navy"],
  },
  {
    id: "forma-ali-15",
    name: "OEM qisqa yeng jumpsuit scrub",
    brand: "Zhengxing",
    category: "forma",
    kind: "scrub",
    price: 154_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-15.jpg",
    description:
      "OEM qisqa yeng jumpsuit scrub — Zhengxing. Rang: to‘q ko‘k. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["navy"],
  },
  {
    id: "forma-ali-16",
    name: "Stretch tez quriydigan scrub to‘plam",
    brand: "Zhengxing",
    category: "forma",
    kind: "scrub",
    price: 147_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-16.jpg",
    description:
      "Stretch tez quriydigan scrub to‘plam — Zhengxing. Rang: to‘q ko‘k. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["navy"],
  },
  {
    id: "forma-ali-17",
    name: "4-yo‘nalish stretch scrub to‘plam",
    brand: "Qingyue",
    category: "forma",
    kind: "scrub",
    price: 134_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-17.jpg",
    description:
      "4-yo‘nalish stretch scrub to‘plam — Qingyue. Rang: to‘q ko‘k. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["navy"],
  },
  {
    id: "forma-ali-18",
    name: "Yumshoq dental scrub to‘plam",
    brand: "Baiyi Angel",
    category: "forma",
    kind: "scrub",
    price: 149_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-18.jpg",
    description:
      "Yumshoq dental scrub to‘plam — Baiyi Angel. Rang: yashil. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["teal"],
  },
  {
    id: "forma-ali-19",
    name: "Stand-collar qisqa yeng scrub to‘plam",
    brand: "Zhengxing",
    category: "forma",
    kind: "scrub",
    price: 154_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-19.jpg",
    description:
      "Stand-collar qisqa yeng scrub to‘plam — Zhengxing. Rang: to‘q ko‘k. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["navy"],
  },
  {
    id: "forma-ali-20",
    name: "Ayollar V-yaka scrub to‘plam",
    brand: "Ruijin",
    category: "forma",
    kind: "scrub",
    price: 127_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent 3–7 kun",
    image: "/images/forma/alibaba-scrub-20.jpg",
    description:
      "Ayollar V-yaka scrub to‘plam — Ruijin. Rang: qora. O‘lchamlar: S, M, L, XL, XXL.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "unisex",
    colors: ["black"],
  },
  {
    id: "klinik-xalat-erkak",
    name: "Klinik xalat (erkaklar uchun)",
    brand: "MedForm",
    category: "forma",
    kind: "xalat",
    price: 297_000,
    oldPrice: 349_000,
    discount: 15,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent yetkazib berish: 24-48 soat",
    image: "/images/forma-coat.png",
    description:
      "Erkaklar klinik xalati, nafas oluvchi mato, 2 cho‘ntak. Oq va navy.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "erkak",
    colors: ["white", "navy"],
    featured: true,
    demo: true,
  },
  {
    id: "tibbiy-qalpoq",
    name: "Tibbiy qalpoq (bir martalik)",
    brand: "MedForm",
    category: "forma",
    kind: "qalpoq",
    price: 25_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent yetkazib berish: 24-48 soat",
    image: "/images/forma-cap.png",
    description:
      "Bir martalik tibbiy qalpoq, uniseks, 50 donalik paket.",
    sizes: ["Universal"],
    gender: "unisex",
    colors: ["sky", "white", "navy"],
    featured: true,
    demo: true,
  },
  {
    id: "tibbiy-poyabzal-erkak",
    name: "Tibbiy poyabzal (erkaklar uchun)",
    brand: "KlinikaLine",
    category: "forma",
    kind: "poyabzal",
    price: 269_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent yetkazib berish: 24-48 soat",
    image: "/images/forma-shoes.png",
    description:
      "Yuviladigan tibbiy poyabzal, anti-slip taglik, 40–44.",
    sizes: ["40", "41", "42", "43", "44"],
    gender: "erkak",
    colors: ["navy"],
    featured: true,
    demo: true,
  },
  {
    id: "klinik-xalat-ayol",
    name: "Klinik xalat (ayollar uchun)",
    brand: "MedForm",
    category: "forma",
    kind: "xalat",
    price: 285_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent yetkazib berish: 24-48 soat",
    image: "/images/forma-coat.png",
    description:
      "Ayollar klinik xalati, yengil kesim, oq va sky.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    gender: "ayol",
    colors: ["white", "sky"],
    demo: true,
  },
  {
    id: "tibbiy-poyabzal-ayol",
    name: "Tibbiy poyabzal (ayollar uchun)",
    brand: "KlinikaLine",
    category: "forma",
    kind: "poyabzal",
    price: 249_000,
    rating: 0,
    reviews: 0,
    inStock: true,
    delivery: "Toshkent yetkazib berish: 24-48 soat",
    image: "/images/forma-shoes.png",
    description:
      "Ayollar tibbiy poyabzal, qora, 36–40.",
    sizes: ["36", "37", "38", "39", "40"],
    gender: "ayol",
    colors: ["black"],
    demo: true,
  },
];

export const PRICE_MIN = 50_000;
export const PRICE_MAX = 5_000_000;
export const BRANDS_PREVIEW = 5;

/** Marketplace featured grid order — DentTrade-inspired first. */
export const marketplaceListingOrder = [
  "denfil-nano",
  "dentium-nrline",
  "dentium-superline",
  "ksenokost-bychya",
  "colla-d-membrane",
  "osteon-bone",
  "endomotor-ecube",
  "iroot-apex",
  "prox-xray",
  "physiodispenser",
  "strong-210",
  "uv-lampa",
  "sdr-flow",
  "straumann-blt",
] as const;

export const categoryCatalogCounts: Record<ProductCategory, number> = {
  materiallar: 128,
  implantlar: 96,
  asboblar: 84,
  jihozlar: 62,
  laboratoriya: 45,
  forma: 51,
};

export const brandCatalogCounts: Record<string, number> = {
  Dentium: 42,
  Osteon: 28,
  Vericom: 12,
  Osung: 36,
  "Dentsply Sirona": 32,
  "3M": 28,
  GC: 21,
  Kerr: 18,
  NSK: 14,
};

export function getProduct(id: string) {
  return products.find((item) => item.id === id);
}

export function productHref(product: Product) {
  if (product.listedBySeller || product.id.startsWith("shopprod-")) return `/marketplace/${product.id}`;
  if (product.category === "forma") return `/forma/${product.id}`;
  if (product.id.startsWith("surplus-")) return "/ortiqcha-material";
  return `/marketplace/${product.id}`;
}

export function specialOfferProducts(limit = 3) {
  return products
    .filter((item) => item.inStock && item.discount && item.category !== "forma")
    .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0) || b.price - a.price)
    .slice(0, limit);
}

export function productOldPrice(product: Product) {
  if (product.oldPrice) return product.oldPrice;
  if (product.discount) return Math.round(product.price / (1 - product.discount / 100));
  return undefined;
}

// ——— Marketplace desktop helpers (derived from existing product data) ———

export type MarketGroup =
  | "kompozit"
  | "bond"
  | "sement"
  | "endodontiya"
  | "implant"
  | "anesteziya"
  | "borlar"
  | "instrument"
  | "jihozlar"
  | "laboratoriya"
  | "forma";

export const marketGroups: { id: MarketGroup; label: string }[] = [
  { id: "kompozit", label: "Kompozit" },
  { id: "bond", label: "Bond" },
  { id: "sement", label: "Sement" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "implant", label: "Implant" },
  { id: "anesteziya", label: "Anesteziya" },
  { id: "borlar", label: "Borlar" },
  { id: "instrument", label: "Instrument" },
  { id: "jihozlar", label: "Jihozlar" },
  { id: "laboratoriya", label: "Laboratoriya" },
  { id: "forma", label: "Forma" },
];

export const conditionLabels: Record<ProductCondition, string> = {
  yangi: "Yangi",
  ishlatilgan: "Ishlatilgan",
  ochilgan: "Ochilgan",
};

export const conditionOrder: ProductCondition[] = ["yangi", "ishlatilgan", "ochilgan"];

/** Old `?cat=` values (and direct group ids) → desktop category groups. */
export function groupsForCatParam(cat: string | null | undefined): MarketGroup[] {
  switch (cat) {
    case "materiallar":
      return ["kompozit", "bond", "sement"];
    case "implantlar":
      return ["implant"];
    case "asboblar":
      return ["instrument"];
    case "jihozlar":
      return ["jihozlar", "endodontiya"];
    case "laboratoriya":
      return ["laboratoriya"];
    case "forma":
      return ["forma"];
    default:
      return marketGroups.some((g) => g.id === cat) ? [cat as MarketGroup] : [];
  }
}

export function productGroup(product: Product): MarketGroup {
  const name = product.name.toLowerCase();
  if (product.category === "forma") return "forma";
  if (product.category === "implantlar") return "implant";
  if (/\b(bur|burs|bor|borlar|frez)\b/.test(name)) return "borlar";
  if (/anest|lidokain|artikain|ubistezin/.test(name)) return "anesteziya";
  if (product.category === "asboblar") return "instrument";
  if (product.category === "laboratoriya") return "laboratoriya";
  if (product.category === "jihozlar") {
    return /endomotor|apex|endo|kanal/.test(name) ? "endodontiya" : "jihozlar";
  }
  if (/bond/.test(name)) return "bond";
  if (/fuji|sement|cement|glass/.test(name)) return "sement";
  return "kompozit";
}

export function productCondition(product: Product): ProductCondition {
  return product.condition ?? "yangi";
}

const groupTypeLabel: Record<MarketGroup, string> = {
  kompozit: "Kompozit",
  bond: "Bond",
  sement: "Sement",
  endodontiya: "Endodontiya",
  implant: "Implant",
  anesteziya: "Anesteziya",
  borlar: "Bor",
  instrument: "Asbob",
  jihozlar: "Jihoz",
  laboratoriya: "Laboratoriya",
  forma: "Forma",
};

/** Small spec pills for marketplace cards: shade, size/weight, "Universal", otherwise product type. */
export function productSpecs(product: Product): string[] {
  if (product.specs?.length) return product.specs.slice(0, 3);
  const out: string[] = [];
  const name = product.name;
  if (/universal/i.test(name)) out.push("Universal");
  const dims = name.match(/\d+(?:\.\d+)?×\d+(?:\.\d+)?(?:\s?mm)?/);
  if (dims) out.push(dims[0].replace(/\s/g, ""));
  else {
    const unit = name.match(/\d+(?:\.\d+)?\s?(?:g|ml|mm|sm)\b/i);
    if (unit) out.push(unit[0].replace(/\s/g, ""));
  }
  const shade = name.match(/\b([A-D][1-4](?:\.5)?)\b/);
  if (shade) out.push(shade[1]);
  if (product.category === "forma") {
    if (!out.length && product.sizes?.length) out.push(`${product.sizes[0]}–${product.sizes[product.sizes.length - 1]}`);
  }
  if (out.length < 2) out.unshift(groupTypeLabel[productGroup(product)]);
  return [...new Set(out)].slice(0, 3);
}

const knownCities = ["Toshkent", "Samarqand", "Buxoro", "Farg‘ona"];

export function productCity(product: Product): string {
  return knownCities.find((city) => product.delivery.startsWith(city)) ?? "Toshkent";
}
