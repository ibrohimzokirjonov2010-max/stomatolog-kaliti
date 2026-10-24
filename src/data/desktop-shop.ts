import type { ShopLine } from "@/components/shop/desktop/shop-cart";

export type ShopCategory =
  | "kompozitlar"
  | "bondlar"
  | "endodontiya"
  | "implantlar"
  | "uchliklar"
  | "asboblar"
  | "uskunalar"
  | "gigiyena";

export type StockKind = "ombor" | "buyurtma";

export type MarketProduct = {
  id: string;
  name: string;
  brand: string;
  brandKey: string;
  category: ShopCategory;
  price: number;
  oldPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  stock: StockKind;
  official: boolean;
  isNew?: boolean;
  image: string;
  popularity: number;
  subtitle: string;
  blurb: string;
  sold: number;
  expiry: string;
  lot: string;
  qtyLabel: string;
  city: string;
  delivery: string;
  condition: string;
  specs: { label: string; value: string }[];
  benefits: string[];
  usage: string[];
  tech: { label: string; value: string }[];
  reviewsList: { name: string; rating: number; text: string; date: string }[];
  gallery: string[];
};

const bondSpecs = [
  { label: "Brend", value: "Kerr" },
  { label: "Mahsulot turi", value: "Universal adgeziv" },
  { label: "Hajm", value: "5 ml" },
  { label: "Qo‘llash usuli", value: "Total-etch" },
  { label: "Yaroqlilik muddati", value: "09/2028" },
  { label: "Lot raqami", value: "KE3028484" },
  { label: "Ishlab chiqarilgan mamlakat", value: "AQSh" },
];

export const marketProducts: MarketProduct[] = [
  {
    id: "filtek-z350-xt",
    name: "Filtek Z350 XT Kompozit (4 g)",
    brand: "3M",
    brandKey: "3m",
    category: "kompozitlar",
    price: 800_000,
    oldPrice: 1_000_000,
    discount: 20,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: false,
    image: "/img/shop/m-filtek.jpg",
    popularity: 120,
    subtitle: "Nanogibrid universal kompozit (4 g)",
    blurb: "Estetik restavratsiyalar uchun universal nanogibrid kompozit. Rang A2, yuqori jilo va qulay modellash.",
    sold: 0,
    expiry: "10/2028",
    lot: "N892745",
    qtyLabel: "Omborda 40+",
    city: "Toshkent",
    delivery: "24 soat ichida",
    condition: "Yangi (yopiq)",
    specs: [
      { label: "Brend", value: "3M" },
      { label: "Mahsulot turi", value: "Universal kompozit" },
      { label: "Rang", value: "A2" },
      { label: "Hajm", value: "4 g" },
      { label: "Yaroqlilik muddati", value: "10/2028" },
      { label: "Lot raqami", value: "N892745" },
      { label: "Ishlab chiqarilgan mamlakat", value: "AQSh" },
    ],
    benefits: ["Yuqori estetik natija", "Qulay modellash", "Uzoq muddatli jilo", "Universal qo‘llanish"],
    usage: ["Old va orqa tishlar", "To‘g‘ridan-to‘g‘ri restavratsiya", "Qatlamlab qo‘yish"],
    tech: [
      { label: "Tur", value: "Nanogibrid" },
      { label: "Rang", value: "A2" },
      { label: "Qadoq", value: "4 g shprits" },
    ],
    reviewsList: [
      { name: "Dr. Malika", rating: 0, text: "Rang aniq, jilosi yaxshi. Klinikada doimiy ishlatamiz.", date: "12.09.2026" },
      { name: "Dr. Jasur", rating: 0, text: "Modellash qulay, yopishqoqligi me’yorida.", date: "02.08.2026" },
    ],
    gallery: ["/img/shop/m-filtek.jpg", "/img/shop/s-main.jpg", "/img/shop/s-t2.jpg"],
  },
  {
    id: "optibond-solo-plus",
    name: "OptiBond Solo Plus Bonding (5 ml)",
    brand: "Kerr",
    brandKey: "kerr",
    category: "bondlar",
    price: 275_000,
    oldPrice: 323_529,
    discount: 15,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: true,
    image: "/img/shop/m-optibond.jpg",
    popularity: 119,
    subtitle: "Universal adgeziv (5 ml)",
    blurb: "Yagona shisha flakonda total-etch bonding. Emal va dentinga ishonchli yopishish. Klinikada keng qo‘llaniladigan universal adgeziv.",
    sold: 0,
    expiry: "09/2028",
    lot: "KE3028484",
    qtyLabel: "Omborda 20+",
    city: "Toshkent",
    delivery: "24 soat ichida",
    condition: "Yangi (yopiq)",
    specs: bondSpecs,
    benefits: ["Yuqori adgeziv kuch", "Emal va dentinga ishonchli yopishish", "Keng klinik qo‘llanish", "Ishlash uchun qulay va tejamkor"],
    usage: ["Total-etch texnikasi", "Emal va dentin", "To‘g‘ridan-to‘g‘ri restavratsiya", "Bilvosita restavratsiya oldidan"],
    tech: bondSpecs,
    reviewsList: [
      { name: "Dr. Nodira", rating: 0, text: "Yopishishi barqaror, sezuvchanlik deyarli yo‘q. Flakon qulay.", date: "03.10.2026" },
      { name: "Dr. Bekzod", rating: 0, text: "Narxi yaxshi, original ekaniga ishonch hosil qildik.", date: "18.09.2026" },
      { name: "Dr. Kamola", rating: 0, text: "Klinikada asosiy bondingimiz. Yetkazish tez.", date: "29.08.2026" },
    ],
    gallery: ["/img/shop/pdp-main.jpg", "/img/shop/pdp-t1.jpg", "/img/shop/pdp-t2.jpg", "/img/shop/pdp-t3.jpg"],
  },
  {
    id: "sdr-flow-plus",
    name: "SDR flow+ Kompozit (2 g)",
    brand: "Dentsply Sirona",
    brandKey: "dentsply",
    category: "kompozitlar",
    price: 382_000,
    oldPrice: 449_000,
    discount: 15,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: false,
    image: "/img/shop/m-sdr.jpg",
    popularity: 118,
    subtitle: "Bulk fill oquvchan kompozit (2 g)",
    blurb: "Smart dentin replacement. Katta kavitlarni bir qatlamda to‘ldirish va stressni kamaytirish uchun.",
    sold: 0,
    expiry: "06/2028",
    lot: "DS441902",
    qtyLabel: "Omborda 24+",
    city: "Toshkent",
    delivery: "24 soat ichida",
    condition: "Yangi (yopiq)",
    specs: [
      { label: "Brend", value: "Dentsply Sirona" },
      { label: "Mahsulot turi", value: "Bulk fill kompozit" },
      { label: "Hajm", value: "2 g" },
      { label: "Qatlam", value: "4 mm gacha" },
      { label: "Yaroqlilik muddati", value: "06/2028" },
      { label: "Lot raqami", value: "DS441902" },
      { label: "Ishlab chiqarilgan mamlakat", value: "Germaniya" },
    ],
    benefits: ["4 mm gacha bir qatlam", "Past polimerizatsiya stressi", "Qulay oquvchanlik"],
    usage: ["Class I / II", "Liner", "Dentinni almashtirish"],
    tech: [
      { label: "Tur", value: "Flowable bulk fill" },
      { label: "Qadoq", value: "2 g" },
    ],
    reviewsList: [{ name: "Dr. Sardor", rating: 0, text: "Orqa tishlarda vaqtni ancha tejaydi.", date: "11.07.2026" }],
    gallery: ["/img/shop/m-sdr.jpg", "/img/shop/m-filtek.jpg", "/img/shop/pdp-t2.jpg"],
  },
  {
    id: "protaper-gold",
    name: "ProTaper Gold Endodontik fayllar (6 dona)",
    brand: "Dentsply",
    brandKey: "dentsply",
    category: "endodontiya",
    price: 900_000,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: true,
    image: "/img/shop/m-protaper.jpg",
    popularity: 117,
    subtitle: "Endodontik fayllar to‘plami (6 dona)",
    blurb: "ProTaper Gold — moslashuvchan NiTi fayllar. Kanalni bashoratli shakllantirish uchun.",
    sold: 0,
    expiry: "12/2029",
    lot: "PTG22018",
    qtyLabel: "Omborda 18+",
    city: "Toshkent",
    delivery: "24 soat ichida",
    condition: "Yangi (yopiq)",
    specs: [
      { label: "Brend", value: "Dentsply" },
      { label: "Mahsulot turi", value: "Endodontik fayl" },
      { label: "Miqdor", value: "6 dona" },
      { label: "Yaroqlilik muddati", value: "12/2029" },
      { label: "Lot raqami", value: "PTG22018" },
      { label: "Ishlab chiqarilgan mamlakat", value: "Shveytsariya" },
    ],
    benefits: ["Yuqori moslashuvchanlik", "Kamroq sinish xavfi", "Tanish ketma-ketlik"],
    usage: ["Kanalni shakllantirish", "Rotatsion endodontiya"],
    tech: [{ label: "Qadoq", value: "6 dona" }],
    reviewsList: [{ name: "Dr. Aziz", rating: 0, text: "Egri kanallarda ishonchli.", date: "21.06.2026" }],
    gallery: ["/img/shop/m-protaper.jpg", "/img/shop/m-endo.jpg", "/img/shop/m-sdr.jpg"],
  },
  {
    id: "timax-x95l",
    name: "Ti-Max X95L Uchlik (turbina)",
    brand: "NSK",
    brandKey: "nsk",
    category: "uchliklar",
    price: 5_590_000,
    oldPrice: 6_650_000,
    discount: 16,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: false,
    image: "/img/shop/m-timax.jpg",
    popularity: 116,
    subtitle: "Optik turbina uchlik",
    blurb: "NSK Ti-Max X95L — yorug‘likli, past shovqinli turbina. Kundalik preparatsiya uchun.",
    sold: 0,
    expiry: "—",
    lot: "NSK95L08",
    qtyLabel: "Omborda 6+",
    city: "Toshkent",
    delivery: "2–3 ish kuni",
    condition: "Yangi (yopiq)",
    specs: [
      { label: "Brend", value: "NSK" },
      { label: "Mahsulot turi", value: "Turbina uchlik" },
      { label: "Model", value: "Ti-Max X95L" },
      { label: "Lot raqami", value: "NSK95L08" },
      { label: "Ishlab chiqarilgan mamlakat", value: "Yaponiya" },
    ],
    benefits: ["Optik yoritish", "Balanslangan rotor", "Qulay tutqich"],
    usage: ["Preparatsiya", "Kundalik qabul"],
    tech: [{ label: "Ulanish", value: "Multiflex tipidagi" }],
    reviewsList: [{ name: "Dr. Otabek", rating: 0, text: "Yengil va aniq. Shovqini past.", date: "09.05.2026" }],
    gallery: ["/img/shop/m-timax.jpg", "/img/shop/m-synea.jpg", "/img/shop/m-surgic.jpg"],
  },
  {
    id: "synea-fusion",
    name: "Synea Fusion Uchlik (turbina)",
    brand: "W&H",
    brandKey: "wh",
    category: "uchliklar",
    price: 21_250_000,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: true,
    image: "/img/shop/m-synea.jpg",
    popularity: 115,
    subtitle: "Premium turbina uchlik",
    blurb: "W&H Synea Fusion — rasmiy distribyutor orqali. Yuqori moment va gigiyenik bosh qism.",
    sold: 0,
    expiry: "—",
    lot: "WHF77120",
    qtyLabel: "Omborda 3+",
    city: "Toshkent",
    delivery: "2–3 ish kuni",
    condition: "Yangi (yopiq)",
    specs: [
      { label: "Brend", value: "W&H" },
      { label: "Mahsulot turi", value: "Turbina" },
      { label: "Model", value: "Synea Fusion" },
      { label: "Lot raqami", value: "WHF77120" },
      { label: "Ishlab chiqarilgan mamlakat", value: "Avstriya" },
    ],
    benefits: ["Rasmiy kafolat", "Past shovqin", "Oson tozalash"],
    usage: ["Yuqori tezlikli preparatsiya"],
    tech: [{ label: "Kafolat", value: "Rasmiy distribyutor" }],
    reviewsList: [{ name: "Dr. Lola", rating: 0, text: "Qimmat, lekin ishi bir tekis.", date: "14.04.2026" }],
    gallery: ["/img/shop/m-synea.jpg", "/img/shop/m-timax.jpg", "/img/shop/m-surgic.jpg"],
  },
  {
    id: "endo-radar-pro",
    name: "Endo Radar Pro Apeks lokator",
    brand: "Woodpecker",
    brandKey: "woodpecker",
    category: "endodontiya",
    price: 11_250_000,
    oldPrice: 12_500_000,
    discount: 10,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: false,
    image: "/img/shop/m-endo.jpg",
    popularity: 114,
    subtitle: "Apeks lokator",
    blurb: "Aniq ishchi uzunlik o‘lchovi. Rangli ekran va barqaror signal.",
    sold: 0,
    expiry: "—",
    lot: "ER88421",
    qtyLabel: "Omborda 9+",
    city: "Toshkent",
    delivery: "24 soat ichida",
    condition: "Yangi (yopiq)",
    specs: [
      { label: "Brend", value: "Woodpecker" },
      { label: "Mahsulot turi", value: "Apeks lokator" },
      { label: "Model", value: "Endo Radar Pro" },
      { label: "Lot raqami", value: "ER88421" },
      { label: "Ishlab chiqarilgan mamlakat", value: "Xitoy" },
    ],
    benefits: ["Aniq o‘lchov", "Qulay ekran", "Klinikada tekshirilgan"],
    usage: ["Ishchi uzunlik", "Kanal davolash"],
    tech: [{ label: "Ekran", value: "Rangli" }],
    reviewsList: [{ name: "Dr. Shohruh", rating: 0, text: "Signal barqaror, narxi adolatli.", date: "01.03.2026" }],
    gallery: ["/img/shop/m-endo.jpg", "/img/shop/m-protaper.jpg", "/img/shop/m-surgic.jpg"],
  },
  {
    id: "surgic-pro2",
    name: "Surgic Pro2 Implant motor",
    brand: "NSK",
    brandKey: "nsk",
    category: "implantlar",
    price: 25_800_000,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: true,
    image: "/img/shop/m-surgic.jpg",
    popularity: 113,
    subtitle: "Implantologik motor",
    blurb: "NSK Surgic Pro2 — rasmiy implant motor. Aniq moment va yorug‘likli nasadka.",
    sold: 0,
    expiry: "—",
    lot: "SP2-1904",
    qtyLabel: "Omborda 2+",
    city: "Toshkent",
    delivery: "Kelishuv bo‘yicha",
    condition: "Yangi (yopiq)",
    specs: [
      { label: "Brend", value: "NSK" },
      { label: "Mahsulot turi", value: "Implant motor" },
      { label: "Model", value: "Surgic Pro2" },
      { label: "Lot raqami", value: "SP2-1904" },
      { label: "Ishlab chiqarilgan mamlakat", value: "Yaponiya" },
    ],
    benefits: ["Aniq moment", "Rasmiy servis", "Yorug‘likli"],
    usage: ["Implant o‘rnatish", "Jarrohlik"],
    tech: [{ label: "Kafolat", value: "Rasmiy" }],
    reviewsList: [{ name: "Dr. Timur", rating: 0, text: "Operatsiyada moment barqaror.", date: "19.02.2026" }],
    gallery: ["/img/shop/m-surgic.jpg", "/img/shop/m-timax.jpg", "/img/shop/m-endo.jpg"],
  },
  {
    id: "fuji-plus",
    name: "Fuji PLUS Sement (15 g)",
    brand: "GC",
    brandKey: "gc",
    category: "bondlar",
    price: 950_000,
    oldPrice: 1_266_000,
    discount: 25,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: false,
    image: "/img/shop/m-fuji.jpg",
    popularity: 112,
    subtitle: "Glass ionomer sement (15 g)",
    blurb: "GC Fuji PLUS — qotish va adgeziya uyg‘unligi. Toj va ko‘prik sementlash uchun.",
    sold: 0,
    expiry: "04/2028",
    lot: "FP66102",
    qtyLabel: "Omborda 15+",
    city: "Toshkent",
    delivery: "24 soat ichida",
    condition: "Yangi (yopiq)",
    specs: [
      { label: "Brend", value: "GC" },
      { label: "Mahsulot turi", value: "Sement" },
      { label: "Hajm", value: "15 g" },
      { label: "Yaroqlilik muddati", value: "04/2028" },
      { label: "Lot raqami", value: "FP66102" },
      { label: "Ishlab chiqarilgan mamlakat", value: "Yaponiya" },
    ],
    benefits: ["Ishonchli sementlash", "Namlikka chidamli", "Qulay aralashtirish"],
    usage: ["Toj", "Ko‘prik", "Inley / onley"],
    tech: [{ label: "Hajm", value: "15 g" }],
    reviewsList: [{ name: "Dr. Madina", rating: 0, text: "Ishchi vaqti qulay.", date: "08.01.2026" }],
    gallery: ["/img/shop/m-fuji.jpg", "/img/shop/m-relyx.jpg", "/img/shop/m-optibond.jpg"],
  },
  {
    id: "tetric-n-ceram",
    name: "Tetric N-Ceram Kompozit (4 g)",
    brand: "Ivoclar",
    brandKey: "ivoclar",
    category: "kompozitlar",
    price: 820_000,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: true,
    image: "/img/shop/m-tetric.jpg",
    popularity: 111,
    subtitle: "Nano-gibrid kompozit (4 g)",
    blurb: "Ivoclar Tetric N-Ceram — rasmiy yetkazma. Tabiiy rang va oson jilo.",
    sold: 0,
    expiry: "11/2028",
    lot: "TNC90811",
    qtyLabel: "Omborda 22+",
    city: "Toshkent",
    delivery: "24 soat ichida",
    condition: "Yangi (yopiq)",
    specs: [
      { label: "Brend", value: "Ivoclar" },
      { label: "Mahsulot turi", value: "Nano-gibrid kompozit" },
      { label: "Hajm", value: "4 g" },
      { label: "Yaroqlilik muddati", value: "11/2028" },
      { label: "Lot raqami", value: "TNC90811" },
      { label: "Ishlab chiqarilgan mamlakat", value: "Lixtenshteyn" },
    ],
    benefits: ["Tabiiy estetik", "Rasmiy mahsulot", "Yaxshi jilo"],
    usage: ["Old tishlar", "Orqa tishlar"],
    tech: [{ label: "Hajm", value: "4 g" }],
    reviewsList: [{ name: "Dr. Sevara", rating: 0, text: "Rang tanlovi aniq.", date: "27.09.2026" }],
    gallery: ["/img/shop/m-tetric.jpg", "/img/shop/m-filtek.jpg", "/img/shop/m-sdr.jpg"],
  },
  {
    id: "relyx-u200",
    name: "RelyX U200 Sement (11 g)",
    brand: "3M",
    brandKey: "3m",
    category: "bondlar",
    price: 1_200_000,
    oldPrice: 1_333_000,
    discount: 10,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: false,
    image: "/img/shop/m-relyx.jpg",
    popularity: 110,
    subtitle: "O‘z-o‘zidan adgeziv sement",
    blurb: "RelyX U200 — alohida bondingisiz sementlash. Toj va shtiftlar uchun.",
    sold: 0,
    expiry: "02/2028",
    lot: "RX20077",
    qtyLabel: "Omborda 12+",
    city: "Toshkent",
    delivery: "24 soat ichida",
    condition: "Yangi (yopiq)",
    specs: [
      { label: "Brend", value: "3M" },
      { label: "Mahsulot turi", value: "Rezin sement" },
      { label: "Yaroqlilik muddati", value: "02/2028" },
      { label: "Lot raqami", value: "RX20077" },
      { label: "Ishlab chiqarilgan mamlakat", value: "AQSh" },
    ],
    benefits: ["Self-adhesive", "Kam bosqich", "Ishonchli ushlash"],
    usage: ["Toj", "Shtift", "Ko‘prik"],
    tech: [{ label: "Tur", value: "Self-adhesive" }],
    reviewsList: [{ name: "Dr. Javohir", rating: 0, text: "Ortiqcha bosqichlarsiz ishlaydi.", date: "16.08.2026" }],
    gallery: ["/img/shop/m-relyx.jpg", "/img/shop/m-fuji.jpg", "/img/shop/m-optibond.jpg"],
  },
  {
    id: "woodpecker-uds-e",
    name: "UD-S-E Ultrasonik skaler",
    brand: "Woodpecker",
    brandKey: "woodpecker",
    category: "uskunalar",
    price: 1_998_000,
    rating: 0,
    reviews: 0,
    stock: "ombor",
    official: true,
    image: "/img/shop/m-uds.jpg",
    popularity: 109,
    subtitle: "Ultrasonik skaler",
    blurb: "UDS-E — rasmiy skaler. Tosh tozalash va periodontal ishlar uchun.",
    sold: 0,
    expiry: "—",
    lot: "UDSE331",
    qtyLabel: "Omborda 7+",
    city: "Toshkent",
    delivery: "24 soat ichida",
    condition: "Yangi (yopiq)",
    specs: [
      { label: "Brend", value: "Woodpecker" },
      { label: "Mahsulot turi", value: "Ultrasonik skaler" },
      { label: "Model", value: "UDS-E" },
      { label: "Lot raqami", value: "UDSE331" },
      { label: "Ishlab chiqarilgan mamlakat", value: "Xitoy" },
    ],
    benefits: ["Rasmiy yetkazma", "Avtotohlash nasadkalar", "Barqaror chastota"],
    usage: ["Tosh tozalash", "Periodontiya"],
    tech: [{ label: "Model", value: "UDS-E" }],
    reviewsList: [{ name: "Dr. Nilufar", rating: 0, text: "Narx va sifat mos.", date: "05.07.2026" }],
    gallery: ["/img/shop/m-uds.jpg", "/img/shop/m-endo.jpg", "/img/shop/m-surgic.jpg"],
  },
];

export const marketChips: { id: ShopCategory | "all"; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "kompozitlar", label: "Kompozitlar" },
  { id: "bondlar", label: "Bondlar" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "implantlar", label: "Implantlar" },
  { id: "uchliklar", label: "Uchliklar" },
  { id: "asboblar", label: "Asboblar" },
  { id: "uskunalar", label: "Uskunalar" },
  { id: "gigiyena", label: "Gigiyena" },
];

export const marketBrands: { key: string; label: string; count: number }[] = [
  { key: "all", label: "Barchasi", count: 1248 },
  { key: "3m", label: "3M", count: 156 },
  { key: "kerr", label: "Kerr", count: 98 },
  { key: "dentsply", label: "Dentsply Sirona", count: 134 },
  { key: "gc", label: "GC", count: 87 },
  { key: "ivoclar", label: "Ivoclar", count: 72 },
  { key: "nsk", label: "NSK", count: 64 },
  { key: "wh", label: "W&H", count: 58 },
  { key: "woodpecker", label: "Woodpecker", count: 41 },
  { key: "straumann", label: "Straumann", count: 22 },
  { key: "kuraray", label: "Kuraray", count: 19 },
  { key: "ultradent", label: "Ultradent", count: 17 },
];

export const PRICE_MAX = 50_000_000;

export function marketHref(id: string) {
  return `/marketplace/${id}`;
}

export function getMarketProduct(id: string) {
  return marketProducts.find((item) => item.id === id) ?? syntheticMarket(id);
}

function syntheticMarket(id: string): MarketProduct | undefined {
  const sim = pdpSimilar.find((item) => item.id === id);
  if (!sim) return undefined;
  const base = marketProducts[1];
  return {
    ...base,
    id: sim.id,
    name: sim.name,
    brand: sim.brand,
    brandKey: sim.brand.toLowerCase().includes("dentsply") ? "dentsply" : sim.brand.toLowerCase().includes("3m") ? "3m" : "kerr",
    price: sim.price,
    oldPrice: sim.oldPrice,
    discount: sim.discount,
    rating: sim.rating,
    reviews: sim.reviews,
    image: sim.image,
    official: !sim.discount,
    subtitle: sim.name,
    blurb: `${sim.brand} ${sim.name}. Original qadoq, klinikada keng qo‘llaniladi.`,
    gallery: [sim.image, base.gallery[0], "/img/shop/pdp-t2.jpg"],
    specs: base.specs.map((row, index) => (index === 0 ? { ...row, value: sim.brand } : row)),
  };
}

export const marketSeed: ShopLine[] = [
  { id: "optibond-solo-plus", name: "OptiBond Solo Plus Bonding (5 ml)", price: 275_000, image: "/img/shop/pdp-main.jpg", href: marketHref("optibond-solo-plus"), qty: 1 },
  { id: "filtek-z350-xt", name: "Filtek Z350 XT Kompozit (4 g)", price: 800_000, image: "/img/shop/m-filtek.jpg", href: marketHref("filtek-z350-xt"), qty: 2 },
  { id: "protaper-gold", name: "ProTaper Gold Fayllar (6 dona)", price: 900_000, image: "/img/shop/m-protaper.jpg", href: marketHref("protaper-gold"), qty: 1 },
  { id: "fuji-plus", name: "Fuji PLUS Sement (15 g)", price: 950_000, image: "/img/shop/m-fuji.jpg", href: marketHref("fuji-plus"), qty: 1 },
];

export const similarMarketIds = ["optibond-fl", "clearfil-se-bond-2", "single-bond-universal", "prime-bond-nt"];

export type SurplusCard = {
  id: string;
  name: string;
  brand: string;
  brandKey: string;
  category: ShopCategory;
  price: number;
  oldPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  stock: StockKind;
  official: boolean;
  isNew?: boolean;
  image: string;
  popularity: number;
  city: string;
};

export const surplusCards: SurplusCard[] = [
  { id: "filtek-z350-xt-a2", name: "Filtek Z350 XT Kompozit (4 g)", brand: "3M", brandKey: "3m", category: "kompozitlar", price: 656_000, oldPrice: 820_000, discount: 20, rating: 0, reviews: 0, stock: "ombor", official: true, image: "/img/shop/m-filtek.jpg", popularity: 100, city: "Toshkent" },
  { id: "optibond-fl", name: "OptiBond FL Bonding (8 ml)", brand: "Kerr", brandKey: "kerr", category: "bondlar", price: 1_100_000, rating: 0, reviews: 0, stock: "ombor", official: true, isNew: true, image: "/img/shop/m-optibond.jpg", popularity: 96, city: "Samarqand" },
  { id: "sdr-flow-surplus", name: "SDR flow+ Bulk fill kompozit (2 g)", brand: "Dentsply", brandKey: "dentsply", category: "kompozitlar", price: 382_000, oldPrice: 450_000, discount: 15, rating: 0, reviews: 0, stock: "ombor", official: false, image: "/img/shop/m-sdr.jpg", popularity: 90, city: "Buxoro" },
  { id: "protaper-gold-surplus", name: "ProTaper Gold Endodontik fayllar (6 dona)", brand: "Dentsply", brandKey: "dentsply", category: "endodontiya", price: 900_000, rating: 0, reviews: 0, stock: "ombor", official: true, image: "/img/shop/m-protaper.jpg", popularity: 94, city: "Buxoro" },
  { id: "timax-x600l", name: "Ti-Max X600L Uchlik (turbina)", brand: "NSK", brandKey: "nsk", category: "uchliklar", price: 5_350_000, rating: 0, reviews: 0, stock: "ombor", official: true, image: "/img/shop/m-timax.jpg", popularity: 70, city: "Toshkent" },
  { id: "synea-fusion-surplus", name: "Synea Fusion Uchlik (turbina)", brand: "W&H", brandKey: "wh", category: "uchliklar", price: 6_800_000, rating: 0, reviews: 0, stock: "ombor", official: true, isNew: true, image: "/img/shop/m-synea.jpg", popularity: 74, city: "Toshkent" },
  { id: "root-zx-mini", name: "Root ZX mini Apeks lokator", brand: "J. Morita", brandKey: "morita", category: "endodontiya", price: 11_000_000, rating: 0, reviews: 0, stock: "ombor", official: true, image: "/img/shop/m-endo.jpg", popularity: 82, city: "Toshkent" },
  { id: "gcem-one", name: "G-CEM ONE Apeks sement (4.6 g)", brand: "GC", brandKey: "gc", category: "bondlar", price: 1_025_000, oldPrice: 1_250_000, discount: 18, rating: 0, reviews: 0, stock: "ombor", official: false, image: "/img/shop/m-fuji.jpg", popularity: 77, city: "Toshkent" },
  { id: "straumann-blx", name: "Straumann BLX Implant (4.1 x 10 mm)", brand: "Straumann", brandKey: "straumann", category: "implantlar", price: 3_840_000, rating: 0, reviews: 0, stock: "ombor", official: true, image: "/img/shop/m-surgic.jpg", popularity: 85, city: "Toshkent" },
  { id: "clearfil-se-surplus", name: "Clearfil SE Bond 2 Bonding to‘plami", brand: "Kuraray", brandKey: "kuraray", category: "bondlar", price: 890_000, oldPrice: 1_112_500, discount: 20, rating: 0, reviews: 0, stock: "ombor", official: true, image: "/img/shop/m-optibond.jpg", popularity: 88, city: "Toshkent" },
  { id: "uds-e-surplus", name: "Woodpecker UDS-E Ultrasonik skaler", brand: "Woodpecker", brandKey: "woodpecker", category: "uskunalar", price: 1_998_000, rating: 0, reviews: 0, stock: "ombor", official: true, image: "/img/shop/m-uds.jpg", popularity: 73, city: "Toshkent" },
  { id: "class-b-autoclave", name: "Class B avtoklav 18 litr", brand: "Woson", brandKey: "woson", category: "uskunalar", price: 19_950_000, rating: 0, reviews: 0, stock: "ombor", official: false, image: "/img/shop/m-surgic.jpg", popularity: 68, city: "Toshkent" },
];

export const surplusBrandList: { key: string; label: string; count: number }[] = [
  { key: "3m", label: "3M", count: 134 },
  { key: "kerr", label: "Kerr", count: 86 },
  { key: "dentsply", label: "Dentsply", count: 102 },
  { key: "tokuyama", label: "Tokuyama", count: 46 },
  { key: "gc", label: "GC", count: 78 },
  { key: "nsk", label: "NSK", count: 34 },
  { key: "wh", label: "W&H", count: 42 },
  { key: "straumann", label: "Straumann", count: 18 },
  { key: "kuraray", label: "Kuraray", count: 21 },
  { key: "morita", label: "J. Morita", count: 9 },
  { key: "woodpecker", label: "Woodpecker", count: 27 },
  { key: "woson", label: "Woson", count: 6 },
];

export const surplusCategoryCounts: { id: ShopCategory | "all"; label: string; count: number }[] = [
  { id: "all", label: "Barchasi", count: 1248 },
  { id: "kompozitlar", label: "Kompozitlar", count: 312 },
  { id: "bondlar", label: "Bondlar", count: 156 },
  { id: "endodontiya", label: "Endodontiya", count: 98 },
  { id: "implantlar", label: "Implantlar", count: 74 },
  { id: "asboblar", label: "Asboblar", count: 120 },
  { id: "uskunalar", label: "Uskunalar", count: 128 },
  { id: "gigiyena", label: "Gigiyena", count: 86 },
  { id: "uchliklar", label: "Uchliklar", count: 64 },
];

export function surplusHref(id: string) {
  return `/ortiqcha-material/${id}`;
}

export const surplusSeed: ShopLine[] = [
  { id: "optibond-fl", name: "OptiBond FL Bonding (8 ml)", price: 1_100_000, image: "/img/shop/m-optibond.jpg", href: surplusHref("optibond-fl"), qty: 1 },
  { id: "filtek-z350-xt-a2", name: "Filtek Z350 XT Kompozit (4 g)", price: 656_000, image: "/img/shop/m-filtek.jpg", href: surplusHref("filtek-z350-xt-a2"), qty: 2 },
  { id: "protaper-gold-surplus", name: "ProTaper Gold Fayllar (6 dona)", price: 900_000, image: "/img/shop/m-protaper.jpg", href: surplusHref("protaper-gold-surplus"), qty: 1 },
  { id: "uds-e-surplus", name: "Woodpecker UDS-E Ultrasonik skaler", price: 1_998_000, image: "/img/shop/m-uds.jpg", href: surplusHref("uds-e-surplus"), qty: 1 },
];

export type SurplusDetail = {
  id: string;
  crumb: string[];
  title: string;
  brand: string;
  categoryLabel: string;
  badges: { text: string; tone: "green" | "blue" | "orange" }[];
  rating: number;
  reviews: number;
  views: number;
  blurb: string;
  facts: { label: string; value: string }[];
  price: number;
  oldPrice: number;
  discount: number;
  save: number;
  phone: string;
  telegram: string;
  specs: { label: string; value: string }[];
  seller: { name: string; rating: number; reviews: number; deals: number; city: string; place: string; reply: string };
  description: string;
  gallery: string[];
  similar: string[];
};

const filtekDetail: SurplusDetail = {
  id: "filtek-z350-xt-a2",
  crumb: ["Bosh sahifa", "Ortiqcha material", "Kompozit", "Filtek Z350 XT A2"],
  title: "Filtek Z350 XT A2",
  brand: "3M",
  categoryLabel: "Kompozit",
  badges: [
    { text: "Yopiq", tone: "green" },
    { text: "Yangi", tone: "blue" },
    { text: "Yaroqlilik: 10/2028", tone: "orange" },
  ],
  rating: 0,
  reviews: 0,
  views: 256,
  blurb: "Sifatli universal kompozit. Rang: A2. Yopiq, ishlatilmagan. Klinikangizda ortib qolgan, arzon narxda sotaman.",
  facts: [
    { label: "Miqdor", value: "3 dona" },
    { label: "Hajm", value: "4 g (1 dona)" },
    { label: "Shahar", value: "Toshkent" },
    { label: "Joylashuv", value: "Klinika" },
  ],
  price: 850_000,
  oldPrice: 1_200_000,
  discount: 29,
  save: 350_000,
  phone: "+998901112233",
  telegram: "ibrohim_zokirjonov",
  specs: [
    { label: "Brend", value: "3M" },
    { label: "Mahsulot nomi", value: "Filtek Z350 XT" },
    { label: "Turi", value: "Universal kompozit" },
    { label: "Rang", value: "A2" },
    { label: "Hajm", value: "4 g (1 dona)" },
    { label: "Miqdor", value: "3 dona" },
    { label: "Holati", value: "Yopiq, yangi" },
    { label: "Yaroqlilik muddati", value: "10/2028" },
    { label: "Lot raqami", value: "N892745" },
    { label: "Ishlab chiqarilgan mamlakat", value: "AQSh" },
  ],
  seller: {
    name: "Dr. Ibrohim Zokirjonov",
    rating: 0,
    reviews: 0,
    deals: 56,
    city: "Toshkent",
    place: "Klinika",
    reply: "5 daqiqa ichida",
  },
  description:
    "3M Filtek Z350 XT – estetik restavratsiyalar uchun universal nanogibrid kompozit. Rang: A2. 3 dona, barchasi yopiq va ishlatilmagan. Yaroqlilik muddati: 10/2028. Klinikamizda ortib qolgan, shuning uchun arzonroq narxda sotaman.",
  gallery: ["/img/shop/s-main.jpg", "/img/shop/s-t1.jpg", "/img/shop/s-t2.jpg", "/img/shop/s-t3.jpg"],
  similar: ["filtek-surplus-card", "optibond-fl-similar", "sdr-similar", "protaper-similar", "fuji-plus-similar"],
};

const extraSimilar: SurplusDetail[] = [
  {
    id: "filtek-surplus-card",
    crumb: ["Bosh sahifa", "Ortiqcha material", "Kompozit", "Filtek Z350 XT Kompozit (A2)"],
    title: "Filtek Z350 XT Kompozit (A2)",
    brand: "3M",
    categoryLabel: "Kompozit",
    badges: [
      { text: "Yopiq", tone: "green" },
      { text: "Yangi", tone: "blue" },
    ],
    rating: 0,
    reviews: 0,
    views: 140,
    blurb: "Yopiq shpritslar. Rang A2. Klinika ortiqchasi.",
    facts: [
      { label: "Miqdor", value: "2 dona" },
      { label: "Hajm", value: "4 g" },
      { label: "Shahar", value: "Toshkent" },
      { label: "Joylashuv", value: "Klinika" },
    ],
    price: 800_000,
    oldPrice: 1_000_000,
    discount: 20,
    save: 200_000,
    phone: "+998901110011",
    telegram: "stomahub",
    specs: [
      { label: "Brend", value: "3M" },
      { label: "Mahsulot nomi", value: "Filtek Z350 XT" },
      { label: "Holati", value: "Yopiq" },
      { label: "Shahar", value: "Toshkent" },
    ],
    seller: { name: "Dr. Aziza Karimova", rating: 0, reviews: 0, deals: 21, city: "Toshkent", place: "Klinika", reply: "10 daqiqa ichida" },
    description: "Filtek Z350 XT, yopiq qadoq. Toshkentdagi klinikadan.",
    gallery: ["/img/shop/m-filtek.jpg", "/img/shop/s-main.jpg", "/img/shop/s-t2.jpg"],
    similar: ["filtek-z350-xt-a2", "optibond-fl-similar", "sdr-similar", "protaper-similar", "fuji-plus-similar"],
  },
];

function detailFromCard(card: SurplusCard, city = card.city): SurplusDetail {
  const save = card.oldPrice ? card.oldPrice - card.price : 0;
  return {
    id: card.id,
    crumb: ["Bosh sahifa", "Ortiqcha material", marketChips.find((c) => c.id === card.category)?.label ?? "Material", card.name],
    title: card.name,
    brand: card.brand,
    categoryLabel: marketChips.find((c) => c.id === card.category)?.label ?? "",
    badges: [
      { text: "Yopiq", tone: "green" },
      ...(card.isNew ? [{ text: "Yangi", tone: "blue" as const }] : []),
      ...(card.discount ? [{ text: `−${card.discount}%`, tone: "orange" as const }] : []),
    ],
    rating: card.rating,
    reviews: card.reviews,
    views: 80 + card.reviews,
    blurb: `${card.brand} ${card.name}. Yopiq, ishlatilmagan. ${city}dagi klinikadan.`,
    facts: [
      { label: "Miqdor", value: "1 dona" },
      { label: "Holat", value: "Yopiq" },
      { label: "Shahar", value: city },
      { label: "Joylashuv", value: "Klinika" },
    ],
    price: card.price,
    oldPrice: card.oldPrice ?? card.price,
    discount: card.discount ?? 0,
    save,
    phone: "+998901112244",
    telegram: "stomahub",
    specs: [
      { label: "Brend", value: card.brand },
      { label: "Mahsulot nomi", value: card.name },
      { label: "Holati", value: "Yopiq, yangi" },
      { label: "Shahar", value: city },
      { label: "Reyting", value: String(card.rating) },
    ],
    seller: {
      name: "Dr. Ibrohim Zokirjonov",
      rating: 0,
      reviews: 0,
      deals: 56,
      city,
      place: "Klinika",
      reply: "5 daqiqa ichida",
    },
    description: `${card.brand} — ${card.name}. Qadoq yopiq, klinikada ortib qolgan. ${city} shahrida olib ketish mumkin.`,
    gallery: [card.image, "/img/shop/s-main.jpg", "/img/shop/s-t2.jpg"],
    similar: ["filtek-z350-xt-a2", "optibond-fl", "sdr-flow-surplus", "protaper-gold-surplus", "fuji-plus-similar"].filter((id) => id !== card.id),
  };
}

const handmade: Record<string, Partial<SurplusDetail> & { id: string }> = {
  "optibond-fl-similar": {
    id: "optibond-fl-similar",
    title: "OptiBond FL Bonding (8 ml)",
    price: 950_000,
    oldPrice: 950_000,
    discount: 0,
    save: 0,
    facts: [
      { label: "Miqdor", value: "1 dona" },
      { label: "Hajm", value: "8 ml" },
      { label: "Shahar", value: "Samarqand" },
      { label: "Joylashuv", value: "Klinika" },
    ],
  },
  "sdr-similar": {
    id: "sdr-similar",
    title: "SDR flow+ Kompozit (2 g)",
    price: 370_000,
    oldPrice: 450_000,
    discount: 18,
    save: 80_000,
  },
  "protaper-similar": {
    id: "protaper-similar",
    title: "ProTaper Gold Endodontik fayllar",
    price: 900_000,
    oldPrice: 900_000,
    discount: 0,
    save: 0,
  },
  "fuji-plus-similar": {
    id: "fuji-plus-similar",
    title: "GC Fuji PLUS Sement (15 g)",
    price: 950_000,
    oldPrice: 1_250_000,
    discount: 25,
    save: 300_000,
  },
};

function mergeDetail(base: SurplusDetail, patch?: Partial<SurplusDetail>): SurplusDetail {
  if (!patch) return base;
  return { ...base, ...patch, id: base.id };
}

const generated = new Map<string, SurplusDetail>();

function buildGenerated() {
  if (generated.size) return;
  generated.set(filtekDetail.id, filtekDetail);
  for (const item of extraSimilar) generated.set(item.id, item);
  for (const card of surplusCards) {
    if (!generated.has(card.id)) generated.set(card.id, detailFromCard(card));
  }
  const prototypes: { id: string; from: string; city: string; image: string }[] = [
    { id: "optibond-fl-similar", from: "optibond-fl", city: "Samarqand", image: "/img/shop/m-optibond.jpg" },
    { id: "sdr-similar", from: "sdr-flow-surplus", city: "Buxoro", image: "/img/shop/m-sdr.jpg" },
    { id: "protaper-similar", from: "protaper-gold-surplus", city: "Buxoro", image: "/img/shop/m-protaper.jpg" },
    { id: "fuji-plus-similar", from: "gcem-one", city: "Toshkent", image: "/img/shop/m-fuji.jpg" },
  ];
  for (const item of prototypes) {
    const card = surplusCards.find((c) => c.id === item.from)!;
    const base = detailFromCard({ ...card, id: item.id, image: item.image, city: item.city }, item.city);
    generated.set(item.id, mergeDetail(base, handmade[item.id]));
  }
}

export function getSurplusDetail(id: string) {
  buildGenerated();
  return generated.get(id);
}

export function surplusSimilarCards(ids: string[]) {
  buildGenerated();
  return ids.map((id) => generated.get(id)).filter((item): item is SurplusDetail => Boolean(item));
}

/** Carousel cards under the Filtek listing — prices match the design, not the shop grid. */
export const filtekSimilar = [
  { id: "filtek-surplus-card", name: "Filtek Z350 XT Kompozit (A2)", brand: "3M", price: 800_000, oldPrice: 1_000_000, discount: 20, city: "Toshkent", image: "/img/shop/m-filtek.jpg", badge: "Yopiq" },
  { id: "optibond-fl-similar", name: "OptiBond FL Bonding (8 ml)", brand: "Kerr", price: 950_000, city: "Samarqand", image: "/img/shop/m-optibond.jpg", badge: "Yopiq" },
  { id: "sdr-similar", name: "SDR flow+ Kompozit (2 g)", brand: "Dentsply", price: 370_000, oldPrice: 450_000, discount: 18, city: "Buxoro", image: "/img/shop/m-sdr.jpg", badge: "Yopiq" },
  { id: "protaper-similar", name: "ProTaper Gold Endodontik fayllar", brand: "Dentsply", price: 900_000, city: "Buxoro", image: "/img/shop/m-protaper.jpg", badge: "Yopiq" },
  { id: "fuji-plus-similar", name: "GC Fuji PLUS Sement (15 g)", brand: "GC", price: 950_000, oldPrice: 1_250_000, discount: 25, city: "Toshkent", image: "/img/shop/m-fuji.jpg", badge: "Yopiq" },
];

export const pdpSimilar = [
  { id: "optibond-fl", name: "OptiBond FL Bonding (8 ml)", brand: "Kerr", price: 1_100_000, oldPrice: 1_250_000, discount: 12, rating: 0, reviews: 0, image: "/img/shop/m-optibond.jpg", href: "/ortiqcha-material/optibond-fl" },
  { id: "clearfil-se-bond-2", name: "Clearfil SE Bond 2 Bonding to‘plami", brand: "Kuraray", price: 1_520_000, rating: 0, reviews: 0, image: "/img/shop/m-tetric.jpg", href: "/marketplace/clearfil-se-bond-2" },
  { id: "single-bond-universal", name: "Single Bond Universal Bonding (5 ml)", brand: "3M", price: 800_000, oldPrice: 975_000, discount: 18, rating: 0, reviews: 0, image: "/img/shop/m-optibond.jpg", href: "/marketplace/single-bond-universal" },
  { id: "prime-bond-nt", name: "Prime&Bond NT Bonding (5 ml)", brand: "Dentsply", price: 750_000, rating: 0, reviews: 0, image: "/img/shop/pdp-main.jpg", href: "/marketplace/prime-bond-nt" },
];

export function isMarketId(id: string) {
  return marketProducts.some((item) => item.id === id) || pdpSimilar.some((item) => item.id === id);
}

export function isSurplusId(id: string) {
  buildGenerated();
  return generated.has(id) || surplusCards.some((item) => item.id === id);
}
