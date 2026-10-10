import type { Product } from "@/data/products";

export type JihozType =
  | "endomotor"
  | "apex"
  | "rentgen"
  | "avtoklav"
  | "qurilma"
  | "mikromotor"
  | "skaler"
  | "qolcha"
  | "boshqa";

export const jihozTypes: { id: JihozType; label: string; chip: string }[] = [
  { id: "endomotor", label: "Endomotor", chip: "Endomotor" },
  { id: "apex", label: "Apeks-lokator", chip: "Apeks-lokator" },
  { id: "rentgen", label: "Rentgen", chip: "Rentgen" },
  { id: "avtoklav", label: "Avtoklav", chip: "Avtoklav" },
  { id: "qurilma", label: "Stomatologik qurilma", chip: "Stomatologik qurilma" },
  { id: "mikromotor", label: "Mikromotor", chip: "Mikromotor" },
  { id: "skaler", label: "Ultratovushli skaler", chip: "Ultratovushli skaler" },
  { id: "qolcha", label: "Qo‘lcha", chip: "Qo‘lcha" },
  { id: "boshqa", label: "Boshqa", chip: "Boshqa" },
];

export function jihozType(product: Product): JihozType {
  const t = `${product.name} ${product.description ?? ""}`.toLowerCase();
  if (/endomotor/.test(t)) return "endomotor";
  if (/apex|apeks/.test(t)) return "apex";
  if (/rentgen|x-?ray/.test(t)) return "rentgen";
  if (/avtoklav|autoclav|sterilizator/.test(t)) return "avtoklav";
  if (/skaler|scaler/.test(t)) return "skaler";
  if (/mikromotor|surgic|jarrohlik motor/.test(t)) return "mikromotor";
  if (/qo‘lcha|qolcha|handpiece/.test(t)) return "qolcha";
  if (/fiziodispenser|kreslo|unit|qurilma/.test(t)) return "qurilma";
  return "boshqa";
}

export type JihozIcon =
  | "target"
  | "display"
  | "droplets"
  | "battery"
  | "volume"
  | "gauge"
  | "zap"
  | "shield"
  | "wrench"
  | "cable"
  | "package"
  | "sun"
  | "thermo"
  | "timer"
  | "smartphone"
  | "layers";

export type JihozInfo = {
  features: { icon: JihozIcon; title: string; sub: string }[];
  usage: string[];
  specs: [string, string][];
  kit: { icon: JihozIcon; label: string }[];
  dims: [number, number, number];
};

const common = {
  kit: (items: [JihozIcon, string][]) => items.map(([icon, label]) => ({ icon, label })),
};

/** Sample (namunaviy) typical data per equipment type — NOT manufacturer-verified. */
export const jihozInfo: Record<JihozType, JihozInfo> = {
  apex: {
    features: [
      { icon: "target", title: "Yuqori aniqlik", sub: "Ishchi uzunlikni ishonchli o‘lchash" },
      { icon: "display", title: "Rangli displey", sub: "Aniq vizual shkala" },
      { icon: "droplets", title: "Nam muhitda barqaror", sub: "Qon va eritma bilan ishlash" },
      { icon: "battery", title: "Qayta zaryadlanadi", sub: "Avtonom ishlash" },
      { icon: "volume", title: "Ovozli signal", sub: "Apeksga yaqinlashish ogohlantirishi" },
      { icon: "zap", title: "Tez kalibrovka", sub: "Ishga tayyor bir necha soniyada" },
    ],
    usage: [
      "Ildiz kanali ishchi uzunligini aniqlash",
      "Endodontik davolash va qayta davolash",
      "Rentgen nurlanishini kamaytirish (qo‘shimcha nazorat sifatida)",
      "Egri va tor kanallarda nazorat",
    ],
    specs: [
      ["O‘lchash diapazoni", "0 – 12 mm"],
      ["Aniqlik", "±0,5 mm"],
      ["Displey", "Rangli LCD"],
      ["Quvvat manbai", "Li-ion batareya"],
      ["Zaryadlash", "USB"],
      ["Signal", "Ovozli va vizual"],
      ["Og‘irlik", "≈ 180 g"],
      ["Ishlash rejimi", "Uzluksiz"],
    ],
    kit: common.kit([
      ["package", "Asosiy blok"],
      ["cable", "O‘lchash kabeli"],
      ["wrench", "Fayl ushlagichi"],
      ["zap", "Lab elektrodi"],
      ["cable", "USB zaryadlash kabeli"],
      ["package", "Foydalanish yo‘riqnomasi"],
    ]),
    dims: [140, 100, 90],
  },
  endomotor: {
    features: [
      { icon: "gauge", title: "Torque nazorati", sub: "Fayl sinishidan himoya" },
      { icon: "zap", title: "Tezlik sozlamasi", sub: "Turli fayl tizimlari uchun" },
      { icon: "display", title: "Ravshan displey", sub: "Parametrlar bir qarashda" },
      { icon: "battery", title: "Simsiz ishlash", sub: "Qulay va erkin harakat" },
      { icon: "shield", title: "Fayl himoyasi", sub: "Avto-reverse funksiyasi" },
      { icon: "wrench", title: "Ergonomik qo‘lcha", sub: "Uzoq ishlashda qulay" },
    ],
    usage: [
      "Ildiz kanallarini mexanik kengaytirish",
      "Rotatsion va reciprocating fayl tizimlari bilan ishlash",
      "Qayta endodontik davolash",
      "Apeks-lokator bilan birgalikda qo‘llash",
    ],
    specs: [
      ["Tezlik diapazoni", "100 – 1000 ayl/daq"],
      ["Moment (torque)", "0,3 – 5,0 Ncm"],
      ["Rejimlar", "Rotatsiya / reciprocating"],
      ["Displey", "LCD"],
      ["Quvvat manbai", "Li-ion batareya"],
      ["Qo‘lcha tishli uzatma", "16:1"],
      ["Og‘irlik", "≈ 120 g"],
      ["Sterilizatsiya", "Qo‘lcha avtoklavlanadi"],
    ],
    kit: common.kit([
      ["package", "Motor bloki"],
      ["wrench", "Kontrburchak qo‘lcha"],
      ["zap", "Zaryadlash stansiyasi"],
      ["cable", "Tarmoq adapteri"],
      ["package", "Moy (lubrikant)"],
      ["package", "Foydalanish yo‘riqnomasi"],
    ]),
    dims: [180, 90, 70],
  },
  rentgen: {
    features: [
      { icon: "zap", title: "Past doza", sub: "Qisqa ekspozitsiya vaqti" },
      { icon: "smartphone", title: "Portativ dizayn", sub: "Kabinetlar orasida ko‘chirish" },
      { icon: "display", title: "Raqamli panel", sub: "Oson sozlash" },
      { icon: "shield", title: "Himoya tizimi", sub: "Nurlanishdan himoya" },
      { icon: "battery", title: "Akkumulyator", sub: "Tarmoqsiz ishlash" },
      { icon: "timer", title: "Tez snimok", sub: "Diagnostika vaqtini qisqartiradi" },
    ],
    usage: [
      "Intraoral periapikal tasvirlar",
      "Endodontik davolashda nazorat",
      "Implantatsiyadan oldin va keyin tekshiruv",
      "Karies va periodontal tashxis",
    ],
    specs: [
      ["Kuchlanish", "60–70 kV"],
      ["Tok", "2–4 mA"],
      ["Ekspozitsiya vaqti", "0,02 – 1,00 s"],
      ["Fokal nuqta", "≈ 0,8 mm"],
      ["Quvvat manbai", "Akkumulyator"],
      ["Boshqaruv", "Raqamli panel"],
      ["Og‘irlik", "≈ 2,5 kg"],
      ["Sensor", "Alohida (RVG / plyonka)"],
    ],
    kit: common.kit([
      ["package", "Rentgen bloki"],
      ["zap", "Zaryadlash bloki"],
      ["shield", "Himoya qalqoni"],
      ["wrench", "Konus (kollimator)"],
      ["cable", "Tarmoq kabeli"],
      ["package", "Foydalanish yo‘riqnomasi"],
    ]),
    dims: [260, 230, 150],
  },
  avtoklav: {
    features: [
      { icon: "thermo", title: "Yuqori harorat", sub: "Ishonchli sterilizatsiya" },
      { icon: "timer", title: "Tez sikl", sub: "Qisqa sterilizatsiya vaqti" },
      { icon: "display", title: "Raqamli boshqaruv", sub: "Dasturlar tanlovi" },
      { icon: "shield", title: "Xavfsizlik tizimi", sub: "Bosim va eshik nazorati" },
      { icon: "droplets", title: "Suv nazorati", sub: "Bak darajasi indikatori" },
      { icon: "layers", title: "Ko‘p qatlamli tray", sub: "Asboblar uchun qulay" },
    ],
    usage: [
      "Stomatologik asboblar sterilizatsiyasi",
      "Qo‘lchalar va burlar sterilizatsiyasi",
      "Qadoqlangan asboblar sterilizatsiyasi",
    ],
    specs: [
      ["Kamera hajmi", "18 l"],
      ["Harorat", "121 / 134 °C"],
      ["Sikl vaqti", "≈ 30 daqiqa"],
      ["Boshqaruv", "Raqamli"],
      ["Quvvat", "≈ 1,8 kVt"],
      ["Suv baki", "Ichki"],
      ["Og‘irlik", "≈ 28 kg"],
      ["Treylar", "3 dona"],
    ],
    kit: common.kit([
      ["package", "Avtoklav"],
      ["layers", "Treylar to‘plami"],
      ["wrench", "Tray ushlagich"],
      ["cable", "Tarmoq kabeli"],
      ["droplets", "Drenaj shlangi"],
      ["package", "Foydalanish yo‘riqnomasi"],
    ]),
    dims: [450, 430, 390],
  },
  qurilma: {
    features: [
      { icon: "droplets", title: "Suv sovutish", sub: "Jarrohlik va ishlov uchun" },
      { icon: "sun", title: "Yoritish", sub: "Ishchi zonani yoritish" },
      { icon: "gauge", title: "Aniq sozlash", sub: "Tezlik va oqim nazorati" },
      { icon: "display", title: "Boshqaruv paneli", sub: "Qulay interfeys" },
      { icon: "shield", title: "Xavfsiz ishlash", sub: "Himoya funksiyalari" },
      { icon: "wrench", title: "Oson xizmat ko‘rsatish", sub: "Qismlarni almashtirish" },
    ],
    usage: [
      "Implantologik va jarrohlik amaliyotlar",
      "Klinik ishlov va tayyorlash bosqichlari",
      "Kabinet jihozlash va yangilash",
    ],
    specs: [
      ["Quvvat manbai", "220 V, 50 Hz"],
      ["Boshqaruv", "Pedal / panel"],
      ["Sovutish", "Fiziologik eritma"],
      ["Tezlik sozlamasi", "Ha"],
      ["Yoritish", "LED"],
      ["Og‘irlik", "≈ 6 kg"],
      ["Sterilizatsiya", "Ayrim qismlar avtoklavlanadi"],
      ["Ish rejimi", "Uzluksiz"],
    ],
    kit: common.kit([
      ["package", "Asosiy blok"],
      ["wrench", "Qo‘lcha"],
      ["droplets", "Sovutish naychalari"],
      ["zap", "Pedal"],
      ["cable", "Tarmoq kabeli"],
      ["package", "Foydalanish yo‘riqnomasi"],
    ]),
    dims: [320, 280, 220],
  },
  mikromotor: {
    features: [
      { icon: "gauge", title: "Barqaror aylanish", sub: "Tekis va aniq ishlov" },
      { icon: "zap", title: "Kuchli moment", sub: "Qattiq materiallar uchun" },
      { icon: "wrench", title: "Qulay qo‘lcha", sub: "Past tebranish" },
      { icon: "shield", title: "Himoya tizimi", sub: "Haddan oshishdan himoya" },
      { icon: "display", title: "Raqamli ko‘rsatkich", sub: "Tezlik nazorati" },
      { icon: "timer", title: "Uzluksiz ishlash", sub: "Kundalik yuklama uchun" },
    ],
    usage: [
      "Zubotexnik laboratoriyada frezalash va silliqlash",
      "Jarrohlik va implantologik ishlar",
      "Proteslarni moslash va jilolash",
    ],
    specs: [
      ["Tezlik", "0 – 35 000 ayl/daq"],
      ["Moment", "≈ 3,5 Ncm"],
      ["Boshqaruv", "Pedal / panel"],
      ["Quvvat manbai", "220 V, 50 Hz"],
      ["Qo‘lcha", "Chiqariladigan"],
      ["Aylanish yo‘nalishi", "To‘g‘ri / teskari"],
      ["Og‘irlik", "≈ 1,2 kg"],
      ["Ish rejimi", "Uzluksiz"],
    ],
    kit: common.kit([
      ["package", "Boshqaruv bloki"],
      ["wrench", "Mikromotor qo‘lchasi"],
      ["zap", "Pedal"],
      ["cable", "Tarmoq kabeli"],
      ["wrench", "Bur uchun kalit"],
      ["package", "Foydalanish yo‘riqnomasi"],
    ]),
    dims: [240, 160, 110],
  },
  skaler: {
    features: [
      { icon: "zap", title: "Ultratovush tebranishi", sub: "Tish toshini tez olib tashlash" },
      { icon: "droplets", title: "Suv sovutish", sub: "Qulay ishlov" },
      { icon: "sun", title: "LED yoritish", sub: "Yaxshi ko‘rinish" },
      { icon: "gauge", title: "Quvvat sozlash", sub: "Davolash turiga mos" },
      { icon: "shield", title: "Xavfsiz uchliklar", sub: "Almashtiriladigan uchlar" },
      { icon: "wrench", title: "Yengil qo‘lcha", sub: "Charchoqni kamaytiradi" },
    ],
    usage: [
      "Tish toshi va yumshoq karashni olib tashlash",
      "Professional gigiena",
      "Periodontal ishlov bosqichlari",
    ],
    specs: [
      ["Chastota", "≈ 28–32 kHz"],
      ["Quvvat darajalari", "10 gacha"],
      ["Suv ta’minoti", "Ichki / tashqi"],
      ["Yoritish", "LED"],
      ["Quvvat manbai", "220 V"],
      ["Uchliklar", "Almashtiriladigan"],
      ["Og‘irlik", "≈ 0,9 kg"],
      ["Sterilizatsiya", "Qo‘lcha va uchlar avtoklavlanadi"],
    ],
    kit: common.kit([
      ["package", "Asosiy blok"],
      ["wrench", "Qo‘lcha"],
      ["wrench", "Uchliklar to‘plami"],
      ["zap", "Pedal"],
      ["cable", "Tarmoq kabeli"],
      ["package", "Foydalanish yo‘riqnomasi"],
    ]),
    dims: [200, 150, 120],
  },
  qolcha: {
    features: [
      { icon: "gauge", title: "Yuqori tezlik", sub: "Tez va aniq tayyorlash" },
      { icon: "sun", title: "LED yoritish", sub: "Ishchi zonani yoritadi" },
      { icon: "droplets", title: "Suv sovutish", sub: "Pulpani himoyalaydi" },
      { icon: "shield", title: "Bardoshli korpus", sub: "Uzoq xizmat muddati" },
      { icon: "wrench", title: "Ergonomik shakl", sub: "Qo‘lga qulay" },
      { icon: "layers", title: "Avtoklavlanadi", sub: "Qayta sterilizatsiya" },
    ],
    usage: [
      "Tish to‘qimasini tayyorlash",
      "Kariyes bilan ishlov berish",
      "Restavratsiya va protezlash tayyorgarligi",
    ],
    specs: [
      ["Tezlik", "≈ 380 000 ayl/daq"],
      ["Bosh o‘lchami", "Standart"],
      ["Yoritish", "LED"],
      ["Sovutish", "Suv + havo"],
      ["Ulanish", "Standart (4 teshik)"],
      ["Korpus", "Titan / zanglamaydigan po‘lat"],
      ["Og‘irlik", "≈ 60 g"],
      ["Sterilizatsiya", "Avtoklavlanadi"],
    ],
    kit: common.kit([
      ["wrench", "Qo‘lcha"],
      ["package", "Himoya g‘ilofi"],
      ["droplets", "Moylash vositasi"],
      ["package", "Foydalanish yo‘riqnomasi"],
    ]),
    dims: [230, 30, 30],
  },
  boshqa: {
    features: [
      { icon: "zap", title: "Samarali ishlash", sub: "Kundalik klinik foydalanish" },
      { icon: "shield", title: "Xavfsiz foydalanish", sub: "Himoya funksiyalari" },
      { icon: "sun", title: "Ultrabinafsha nur", sub: "Yuzalar dezinfeksiyasi" },
      { icon: "timer", title: "Taymer", sub: "Avto o‘chirish" },
      { icon: "wrench", title: "Oson xizmat", sub: "Qismlarni almashtirish" },
      { icon: "layers", title: "Ixcham dizayn", sub: "Kabinetga qulay joylashadi" },
    ],
    usage: [
      "Kabinet va asboblarni dezinfeksiya qilish",
      "Sterilizatsiyani qo‘llab-quvvatlash",
      "Kundalik gigiena protokollari",
    ],
    specs: [
      ["Quvvat manbai", "220 V, 50 Hz"],
      ["Boshqaruv", "Tugma / taymer"],
      ["Ish rejimi", "Uzluksiz"],
      ["Og‘irlik", "≈ 2 kg"],
      ["Material", "Metall / plastik korpus"],
      ["Montaj", "Stol yoki devor"],
      ["Xavfsizlik", "Avto o‘chirish"],
      ["Foydalanish joyi", "Klinika kabineti"],
    ],
    kit: common.kit([
      ["package", "Asosiy qurilma"],
      ["cable", "Tarmoq kabeli"],
      ["wrench", "Mahkamlash qismlari"],
      ["package", "Foydalanish yo‘riqnomasi"],
    ]),
    dims: [420, 90, 90],
  },
};

export function jihozBestseller(product: Product) {
  return product.reviews >= 35;
}
