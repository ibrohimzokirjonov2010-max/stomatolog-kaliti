export type MobileSeminarCat = "all" | "implantologiya" | "endodontiya" | "ortodontiya" | "estetika" | "jarrohlik";
export type MobileSeminarFormat = "oflayn" | "onlayn";

export type MobileSeminar = {
  id: string;
  /** Real catalog seminar this card advertises — registrations go to it. Absent → design sample. */
  realId?: string;
  title: string;
  category: Exclude<MobileSeminarCat, "all">;
  format: MobileSeminarFormat;
  formatLabel: string;
  kind: string;
  dateBadge: string;
  when: string;
  cardWhen: string;
  time: string;
  place: string;
  seats: number;
  seatsLeft: number;
  price: number;
  oldPrice: number;
  discount: number;
  image: string;
  /** Wide "TOP SEMINAR" banner photo and detail cover photo (fall back to `image`). */
  banner?: string;
  cover?: string;
  speaker: string;
  speakerRole: string;
  speakerOrg: string;
  speakerImage: string;
  about: string;
  aboutMore: string;
  features: { title: string; text: string }[];
  stats: { value: string; label: string }[];
  program: { time: string; title: string }[];
  address: string;
  /** ISO date used by Bu hafta / Bu oy. */
  day: string;
};

export const MOBILE_SEMINAR_TOTAL = 21;

export const mobileSeminarCats: { id: MobileSeminarCat; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "estetika", label: "Estetik stomatologiya" },
  { id: "jarrohlik", label: "Jarrohlik" },
];

const features = [
  { title: "Nazariya va protokollar", text: "Implantologiya asoslari" },
  { title: "Klinik case muhokama", text: "Real klinik holatlar" },
  { title: "Amaliy mashg‘ulot", text: "Implant o‘rnatish amaliyoti" },
  { title: "Sertifikat beriladi", text: "Seminar yakunida sertifikat" },
];

export const mobileSeminars: MobileSeminar[] = [
  {
    id: "implantdan-tojgacha",
    realId: "implantologiya-implantdan-tojgacha",
    title: "Implantologiya: Implantdan tojgacha",
    category: "implantologiya",
    format: "oflayn",
    formatLabel: "Oflayn",
    kind: "Ikki kunlik seminar",
    dateBadge: "21/10 – 22/10",
    when: "21–22 oktabr, 2026",
    cardWhen: "21–22 okt 2026, 09:00",
    time: "09:00 – 18:00",
    place: "EMU Universiteti, Toshkent",
    seats: 30,
    seatsLeft: 12,
    price: 1_800_000,
    oldPrice: 2_000_000,
    discount: 10,
    image: "/img/mobile/d-sem-t1.jpg",
    banner: "/img/mobile/d-sem-hero.jpg",
    cover: "/img/mobile/d-sem-cover.jpg",
    speaker: "Dr. Sardorbek Rahimov",
    speakerRole: "Oral jarroh, implantolog",
    speakerOrg: "Nucleos",
    speakerImage: "/img/mobile/se-sardor-face.jpg",
    about:
      "Implantologiyada diagnostika, implant rejalashtirish, jarrohlik protokoli, implant o‘rnatish va implant usti protezlash bo‘yicha intensiv 2 kunlik amaliy seminar. Nazariy bilim va real klinik case misollar asosida.",
    aboutMore: "Ishtirokchilar model ustida implant o‘rnatish ketma-ketligini bajaradi va sertifikat oladi.",
    features,
    stats: [
      { value: "10+ yil", label: "tajriba" },
      { value: "200+", label: "muvaffaqiyatli implant" },
      { value: "50+", label: "seminarlar" },
    ],
    program: [
      { time: "09:00", title: "Nazariya va diagnostika" },
      { time: "11:00", title: "Jarrohlik protokoli" },
      { time: "14:00", title: "Amaliy mashg‘ulot" },
      { time: "17:00", title: "Klinik case muhokama" },
    ],
    address: "EMU Universiteti, Toshkent",
    day: "2026-10-21",
  },
  {
    id: "ms-endo",
    title: "Endodontiyada zamonaviy yondashuvlar",
    category: "endodontiya",
    format: "onlayn",
    formatLabel: "Onlayn",
    kind: "Bir kunlik seminar",
    dateBadge: "25/10",
    when: "25 okt 2026, 10:00",
    cardWhen: "25 okt 2026, 10:00",
    time: "10:00 – 16:00",
    place: "Onlayn (Zoom)",
    seats: 100,
    seatsLeft: 40,
    price: 425_000,
    oldPrice: 500_000,
    discount: 15,
    image: "/img/mobile/d-sem-t2.jpg",
    speaker: "Dr. Dilnoza Karimova",
    speakerRole: "Endodontist",
    speakerOrg: "Nucleos",
    speakerImage: "/img/mobile/se-dilnoza.jpg",
    about: "Zamonaviy endodontiya protokollari, mikroskopda ishlash va klinik holatlar bo‘yicha bir kunlik onlayn seminar.",
    aboutMore: "Jonli efir va savol-javob. Yozuv seminardan keyin ochiladi.",
    features: [
      { title: "Nazariya", text: "Zamonaviy protokollar" },
      { title: "Klinik holatlar", text: "Real case tahlili" },
      { title: "Jonli efir", text: "Zoom orqali" },
      { title: "Sertifikat", text: "Seminar yakunida" },
    ],
    stats: [
      { value: "8+ yil", label: "tajriba" },
      { value: "120+", label: "klinik holat" },
      { value: "30+", label: "seminarlar" },
    ],
    program: [
      { time: "10:00", title: "Kirish va diagnostika" },
      { time: "12:00", title: "Instrumentatsiya" },
      { time: "14:00", title: "Klinik holatlar" },
    ],
    address: "Onlayn (Zoom)",
    day: "2026-10-25",
  },
  {
    id: "ms-estetik",
    title: "Estetik restavratsiya: old tishlar",
    category: "estetika",
    format: "oflayn",
    formatLabel: "Oflayn",
    kind: "Amaliy kurs",
    dateBadge: "28/10",
    when: "28 okt 2026, 09:00",
    cardWhen: "28 okt 2026, 09:00",
    time: "09:00 – 17:00",
    place: "Tashkent Dental Academy",
    seats: 20,
    seatsLeft: 6,
    price: 750_000,
    oldPrice: 900_000,
    discount: 17,
    image: "/img/mobile/d-sem-t3.jpg",
    speaker: "Dr. Azizbek Murodov",
    speakerRole: "Estetik stomatolog",
    speakerOrg: "Tashkent Dental Academy",
    speakerImage: "/img/mobile/se-teeth.jpg",
    about: "Old tishlar estetik restavratsiyasi bo‘yicha amaliy kurs. Qatlamlash, rang va jilo.",
    aboutMore: "Har ishtirokchi model ustida restavratsiya bajaradi.",
    features: [
      { title: "Rang tanlash", text: "Tabiiy jilo" },
      { title: "Qatlamlash", text: "Old tishlar" },
      { title: "Amaliyot", text: "Model ustida" },
      { title: "Sertifikat", text: "Kurs yakunida" },
    ],
    stats: [
      { value: "12+ yil", label: "tajriba" },
      { value: "300+", label: "restavratsiya" },
      { value: "40+", label: "seminarlar" },
    ],
    program: [
      { time: "09:00", title: "Rang va morfologiya" },
      { time: "12:00", title: "Qatlamlash" },
      { time: "15:00", title: "Jilo va tekshiruv" },
    ],
    address: "Tashkent Dental Academy",
    day: "2026-10-28",
  },
];

export function getMobileSeminar(id: string) {
  return mobileSeminars.find((item) => item.id === id) ?? null;
}
