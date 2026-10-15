export type SeminarCategory =
  | "implantologiya"
  | "endodontiya"
  | "ortodontiya"
  | "estetika"
  | "parodontologiya"
  | "jarrohlik"
  | "boshqa";

export type SeminarFormat = "offline" | "online" | "hybrid";

export type DesktopSeminar = {
  id: string;
  title: string;
  detailTitle: string;
  category: string;
  categoryKey: SeminarCategory;
  summary: string;
  about: string;
  city: string;
  venue: string;
  venueLine: string;
  address: string;
  start: string;
  end: string;
  hours: string;
  date: string;
  dayLabel: string;
  monthShort: string;
  monthTitle: string;
  dayNum: string;
  speaker: string;
  speakerRole: string;
  speakerImage: string;
  cme: number;
  seatsLeft: number;
  seatsTotal: number;
  price: number;
  image: string;
  format: SeminarFormat;
  formatLabel: string;
  formatNote: string;
  dateChip: string;
  dateNote: string;
};

export const seminarCategories: { id: SeminarCategory | "all"; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "estetika", label: "Estetik restavratsiya" },
  { id: "parodontologiya", label: "Parodontologiya" },
  { id: "jarrohlik", label: "Jarrohlik" },
  { id: "boshqa", label: "Boshqa" },
];

export const desktopSeminars: DesktopSeminar[] = [
  {
    id: "implantdan-tojgacha",
    title: "Implantologiya: implantdan tojgacha",
    detailTitle: "Implantologiya: Implantdan tojgacha",
    category: "Implantologiya",
    categoryKey: "implantologiya",
    summary: "Diagnostika, jarrohlik protokoli, implant protezlash",
    about:
      "Ushbu amaliy va nazariy seminar implantologiyada zamonaviy yondashuvlarni qamrab oladi: diagnostika, suyak augmentatsiyasi, implant o‘rnatish protokoli, implant usti protezlash va asoratlarning oldini olish. Nazariy bilimlar amaliy mashg‘ulotlar bilan mustahkamlanadi.",
    city: "Toshkent",
    venue: "EMU Universiteti",
    venueLine: "Hyatt Regency, konferens-zal",
    address: "Toshkent sh., Navoi ko‘chasi, 1A",
    start: "09:00",
    end: "17:00",
    hours: "8 soat",
    date: "2026-10-24",
    dayLabel: "Juma",
    monthShort: "OKT",
    monthTitle: "Oktabr 2026",
    dayNum: "24",
    speaker: "Dr. Sardor Raximov",
    speakerRole: "Implantolog, PhD",
    speakerImage: "/images/usta-featured.png",
    cme: 8,
    seatsLeft: 18,
    seatsTotal: 30,
    price: 1_200_000,
    image: "/img/seminars/s1.jpg",
    format: "hybrid",
    formatLabel: "Offline + jonli efir",
    formatNote: "Zalda va onlayn qatnashish",
    dateChip: "24-oktabr 2026",
    dateNote: "Shanba, 10:00 – 18:00",
  },
  {
    id: "mikroskop-endodontiya",
    title: "Mikroskop yordamida endodontik davolash",
    detailTitle: "Mikroskop yordamida endodontik davolash",
    category: "Endodontiya",
    categoryKey: "endodontiya",
    summary: "Mikroskopda ishlash protokoli va klinik holatlar",
    about: "Mikroskop ostida kanal topish, instrumentatsiya va obturatsiya. Klinik holatlar va jonli namoyish.",
    city: "Samarqand",
    venue: "Hyatt Regency",
    venueLine: "Hyatt Regency",
    address: "Samarqand sh.",
    start: "09:00",
    end: "17:00",
    hours: "8 soat",
    date: "2026-10-28",
    dayLabel: "Seshanba",
    monthShort: "OKT",
    monthTitle: "Oktabr 2026",
    dayNum: "28",
    speaker: "Dr. Malika Karimova",
    speakerRole: "Endodontist",
    speakerImage: "/images/forma-banner-doctor.png",
    cme: 6,
    seatsLeft: 12,
    seatsTotal: 25,
    price: 850_000,
    image: "/img/seminars/s2.jpg",
    format: "offline",
    formatLabel: "Offline",
    formatNote: "Zalda qatnashish",
    dateChip: "28-oktabr 2026",
    dateNote: "Seshanba, 09:00 – 17:00",
  },
  {
    id: "sinus-lifting",
    title: "Sinus lifting va vertikal augmentatsiya",
    detailTitle: "Sinus lifting va vertikal augmentatsiya",
    category: "Jarrohlik",
    categoryKey: "jarrohlik",
    summary: "Amaliyot va jonli jarrohlik namoyishi",
    about: "Sinus lifting va vertikal augmentatsiya bo‘yicha jonli jarrohlik va amaliy mashg‘ulot.",
    city: "Toshkent",
    venue: "Nexus Clinic",
    venueLine: "Nexus Clinic",
    address: "Toshkent, Nexus Clinic",
    start: "09:00",
    end: "18:00",
    hours: "9 soat",
    date: "2026-10-30",
    dayLabel: "Chorshanba",
    monthShort: "OKT",
    monthTitle: "Oktabr 2026",
    dayNum: "30",
    speaker: "Dr. Javohir Ahmedov",
    speakerRole: "Implantolog",
    speakerImage: "/images/usta-sardor.png",
    cme: 8,
    seatsLeft: 8,
    seatsTotal: 20,
    price: 2_500_000,
    image: "/img/seminars/s3.jpg",
    format: "offline",
    formatLabel: "Offline",
    formatNote: "Zalda qatnashish",
    dateChip: "30-oktabr 2026",
    dateNote: "Chorshanba, 09:00 – 18:00",
  },
  {
    id: "kompozit-oldingi",
    title: "Kompozit restavratsiya: oldingi tishlar",
    detailTitle: "Kompozit restavratsiya: oldingi tishlar",
    category: "Estetik restavratsiya",
    categoryKey: "estetika",
    summary: "To‘g‘ridan-to‘g‘ri va bilvosita restavratsiya texnikalari",
    about: "Oldingi tishlarda qatlamlab restavratsiya, rang tanlash va jilo protokollari.",
    city: "Toshkent",
    venue: "Dentashop Center",
    venueLine: "Dentashop Center",
    address: "Toshkent, Dentashop Center",
    start: "09:00",
    end: "17:00",
    hours: "8 soat",
    date: "2026-10-31",
    dayLabel: "Shanba",
    monthShort: "OKT",
    monthTitle: "Oktabr 2026",
    dayNum: "31",
    speaker: "Dr. Kamola Abdullayeva",
    speakerRole: "Estetik stomatolog",
    speakerImage: "/images/usta-akbar.png",
    cme: 6,
    seatsLeft: 20,
    seatsTotal: 30,
    price: 1_000_000,
    image: "/img/seminars/s4.jpg",
    format: "offline",
    formatLabel: "Offline",
    formatNote: "Zalda qatnashish",
    dateChip: "31-oktabr 2026",
    dateNote: "Shanba, 09:00 – 17:00",
  },
  {
    id: "aligner-case",
    title: "Aligner terapiya: case selection",
    detailTitle: "Aligner terapiya: case selection",
    category: "Ortodontiya",
    categoryKey: "ortodontiya",
    summary: "Klinik holatlar va rejalashtirish rejasi",
    about: "Aligner bilan davolanadigan holatlarni tanlash va raqamli reja tuzish.",
    city: "Toshkent",
    venue: "Joy Congress Hall",
    venueLine: "Joy Congress Hall",
    address: "Toshkent, Joy Congress Hall",
    start: "10:00",
    end: "18:00",
    hours: "8 soat",
    date: "2026-11-02",
    dayLabel: "Dushanba",
    monthShort: "NOY",
    monthTitle: "Noyabr 2026",
    dayNum: "02",
    speaker: "Dr. Farrukh Khaydarov",
    speakerRole: "Ortodontist",
    speakerImage: "/images/usta-jamshid.png",
    cme: 5,
    seatsLeft: 25,
    seatsTotal: 40,
    price: 900_000,
    image: "/img/seminars/s5.jpg",
    format: "offline",
    formatLabel: "Offline",
    formatNote: "Zalda qatnashish",
    dateChip: "2-noyabr 2026",
    dateNote: "Dushanba, 10:00 – 18:00",
  },
  {
    id: "sinus-noyabr",
    title: "Sinus lifting va vertikal augmentatsiya",
    detailTitle: "Sinus lifting va vertikal augmentatsiya",
    category: "Jarrohlik",
    categoryKey: "jarrohlik",
    summary: "Amaliyot va jonli jarrohlik namoyishi",
    about: "Noyabr oqimidagi sinus lifting kursi. Jonli namoyish va phantom mashg‘ulot.",
    city: "Toshkent",
    venue: "Nexus Clinic",
    venueLine: "Nexus Clinic",
    address: "Toshkent, Nexus Clinic",
    start: "09:00",
    end: "18:00",
    hours: "9 soat",
    date: "2026-11-12",
    dayLabel: "Payshanba",
    monthShort: "NOY",
    monthTitle: "Noyabr 2026",
    dayNum: "12",
    speaker: "Dr. Javohir Ahmedov",
    speakerRole: "Implantolog",
    speakerImage: "/images/usta-sardor.png",
    cme: 8,
    seatsLeft: 10,
    seatsTotal: 20,
    price: 1_800_000,
    image: "/img/seminars/s3.jpg",
    format: "offline",
    formatLabel: "Offline",
    formatNote: "Zalda qatnashish",
    dateChip: "12-noyabr 2026",
    dateNote: "Payshanba, 09:00 – 18:00",
  },
  {
    id: "raqamli-implant",
    title: "Raqamli implantologiya va skanerlar",
    detailTitle: "Raqamli implantologiya va skanerlar",
    category: "Implantologiya",
    categoryKey: "implantologiya",
    summary: "Intraoral skaner va raqamli rejalashtirish",
    about: "Skaner bilan implant rejalashtirish, guide va raqamli ish oqimi.",
    city: "Samarqand",
    venue: "Hyatt Regency",
    venueLine: "Hyatt Regency",
    address: "Samarqand sh.",
    start: "10:00",
    end: "17:00",
    hours: "7 soat",
    date: "2026-11-28",
    dayLabel: "Shanba",
    monthShort: "NOY",
    monthTitle: "Noyabr 2026",
    dayNum: "28",
    speaker: "Dr. Aziz Karimov",
    speakerRole: "Implantolog, jarroh",
    speakerImage: "/img/seminars/speaker.jpg",
    cme: 6,
    seatsLeft: 16,
    seatsTotal: 30,
    price: 1_000_000,
    image: "/images/product-scanner.png",
    format: "hybrid",
    formatLabel: "Offline + jonli efir",
    formatNote: "Zalda va onlayn qatnashish",
    dateChip: "28-noyabr 2026",
    dateNote: "Shanba, 10:00 – 17:00",
  },
];

export const mySeminars = [
  { id: "implantdan-tojgacha", day: "24", month: "OKT", title: "Implantologiya: implantdan tojgacha", place: "Toshkent, EMU" },
  { id: "raqamli-ortopediya", day: "15", month: "NOY", title: "Raqamli ortopediya", place: "Toshkent, Nexus Clinic" },
];

export const whyAttend = [
  { title: "Dunyo darajasidagi spikerlar", text: "Tajribali mutaxassislardan o‘rganing" },
  { title: "Amaliy ko‘nikmalar", text: "Hands-on mashg‘ulotlar" },
  { title: "Sertifikat va CME ballari", text: "Rasmiy sertifikat va CME" },
  { title: "Kasbiy aloqa", text: "Hamkasblar bilan tanishish" },
];

export type SeminarTier = {
  id: "standart" | "amaliy" | "online";
  name: string;
  price: number;
  oldPrice: number;
  discount: number;
  perks: string[];
  left: number;
  total: number;
};

export const implantTiers: SeminarTier[] = [
  {
    id: "standart",
    name: "Standart",
    price: 1_200_000,
    oldPrice: 1_400_000,
    discount: 15,
    perks: ["Zalda qatnashish", "Kofe-breyk va tushlik", "Sertifikat (CME 8 ball)"],
    left: 18,
    total: 30,
  },
  {
    id: "amaliy",
    name: "Amaliy (hands-on)",
    price: 2_500_000,
    oldPrice: 2_900_000,
    discount: 15,
    perks: ["Zalda + amaliy mashg‘ulotlar", "Har bir ishtirokchiga implant tizimi", "Sertifikat (CME 8 ball)"],
    left: 8,
    total: 20,
  },
  {
    id: "online",
    name: "Online",
    price: 600_000,
    oldPrice: 800_000,
    discount: 25,
    perks: ["Jonli efirda qatnashish", "Yozuvlarga 3 oy kirish", "Sertifikat (CME 8 ball)"],
    left: 50,
    total: 100,
  },
];

export const implantLearnings = [
  "Implantologiyada diagnostika va rejalashtirish",
  "Suyak augmentatsiyasi va sinus lifting",
  "Implant o‘rnatish bosqichlari va jarrohlik protokollari",
  "Abatment tanlash va vaqtinchalik/doimiy toj protezlash",
  "Asoratlar va ularning oldini olish",
  "Amaliy mashg‘ulotlar: phantom modellarda",
];

export const implantPerks = [
  { title: "Amaliy mashg‘ulotlar", text: "Har bir ishtirokchiga implant tizimi" },
  { title: "Kichik guruhlar", text: "Individual yondashuv" },
  { title: "Sertifikat beriladi", text: "CME 8 ball" },
  { title: "Ilmiy materiallar", text: "Prezentatsiyalar va protokollar" },
  { title: "Networking", text: "Hamkasblar bilan tanishish" },
];

export const implantProgram = [
  { time: "09:30 – 10:00", title: "Ro‘yxatdan o‘tish va qahva" },
  { time: "10:00 – 10:40", title: "Implantologiyada diagnostika va rejalashtirish" },
  { time: "10:40 – 11:20", title: "Suyak augmentatsiyasi va sinus lifting" },
  { time: "11:20 – 11:40", title: "Kofe-breyk" },
  { time: "11:40 – 13:00", title: "Implant o‘rnatish jarrohligi: jonli amaliy ko‘rsatma" },
  { time: "13:00 – 14:00", title: "Tushlik" },
  { time: "14:00 – 15:30", title: "Implant usti protezlash: abutment va toj tanlash" },
  { time: "15:30 – 15:50", title: "Kofe-breyk" },
  { time: "15:50 – 17:30", title: "Amaliy mashg‘ulotlar (phantom modellarda)" },
  { time: "17:30 – 18:00", title: "Savol-javob va sertifikat topshirish" },
];

export const implantGear = [
  "Shaxsiy lupa (ixtiyoriy)",
  "Jarrohlik kostyumi va niqob",
  "Shaxsiy asboblar (ixtiyoriy)",
  "Barcha asosiy materiallar tashkilotchilar tomonidan taqdim etiladi",
];

export const implantReviews = [
  {
    name: "Dr. Sevara Ahmedova",
    date: "12.02.2026",
    rating: 5,
    text: "Juda foydali va amaliy seminar. Amaliy qism ayniqsa zo‘r bo‘ldi, tavsiya qilaman!",
  },
  {
    name: "Dr. Bekzod Tursunov",
    date: "03.03.2026",
    rating: 5,
    text: "Spiker aniq va sabrli. Phantomdagi mashq ertasi kuni qabulda qo‘l keldi.",
  },
  {
    name: "Dr. Nilufar Yusupova",
    date: "18.03.2026",
    rating: 4,
    text: "Dastur zich, lekin tushunarli. Sertifikat o‘sha kuni topshirildi.",
  },
];

export function seminarHref(id: string) {
  return `/seminarlar/${id}`;
}

const ortopediya: DesktopSeminar = {
  id: "raqamli-ortopediya",
  title: "Raqamli ortopediya",
  detailTitle: "Raqamli ortopediya",
  category: "Boshqa",
  categoryKey: "boshqa",
  summary: "Raqamli skaner va protezlash ish oqimi",
  about: "Intraoral skaner, raqamli modellash va ortopedik restavratsiyalar bo‘yicha amaliy seminar.",
  city: "Toshkent",
  venue: "Nexus Clinic",
  venueLine: "Nexus Clinic",
  address: "Toshkent, Nexus Clinic",
  start: "10:00",
  end: "17:00",
  hours: "7 soat",
  date: "2026-11-15",
  dayLabel: "Yakshanba",
  monthShort: "NOY",
  monthTitle: "Noyabr 2026",
  dayNum: "15",
  speaker: "Dr. Aziz Karimov",
  speakerRole: "Ortoped",
  speakerImage: "/img/seminars/speaker.jpg",
  cme: 5,
  seatsLeft: 14,
  seatsTotal: 24,
  price: 950_000,
  image: "/images/seminar-smile.png",
  format: "offline",
  formatLabel: "Offline",
  formatNote: "Zalda qatnashish",
  dateChip: "15-noyabr 2026",
  dateNote: "Yakshanba, 10:00 – 17:00",
};

export function getDesktopSeminar(id: string) {
  return desktopSeminars.find((item) => item.id === id) ?? (id === ortopediya.id ? ortopediya : undefined);
}

export function isDesktopSeminarId(id: string) {
  return id === "raqamli-ortopediya" || desktopSeminars.some((item) => item.id === id);
}

/** Slugs the desktop seminar pages know about, including ids that are not in the mobile seed catalog. */
export function desktopSeminarIds() {
  return [...desktopSeminars.map((item) => item.id), ortopediya.id];
}

export function tiersFor(seminar: DesktopSeminar): SeminarTier[] {
  if (seminar.id === "implantdan-tojgacha") return implantTiers;
  const price = seminar.price;
  return [
    {
      id: "standart",
      name: "Standart",
      price,
      oldPrice: Math.round(price / 0.85 / 1000) * 1000,
      discount: 15,
      perks: ["Zalda qatnashish", "Kofe-breyk va tushlik", `Sertifikat (CME ${seminar.cme} ball)`],
      left: seminar.seatsLeft,
      total: seminar.seatsTotal,
    },
    {
      id: "amaliy",
      name: "Amaliy (hands-on)",
      price: Math.round(price * 1.8),
      oldPrice: Math.round((price * 1.8) / 0.85 / 1000) * 1000,
      discount: 15,
      perks: ["Zalda + amaliy mashg‘ulotlar", "Materiallar taqdim etiladi", `Sertifikat (CME ${seminar.cme} ball)`],
      left: Math.max(4, Math.round(seminar.seatsLeft / 2)),
      total: Math.max(8, Math.round(seminar.seatsTotal / 2)),
    },
    {
      id: "online",
      name: "Online",
      price: Math.round(price * 0.5),
      oldPrice: Math.round((price * 0.5) / 0.75 / 1000) * 1000,
      discount: 25,
      perks: ["Jonli efirda qatnashish", "Yozuvlarga 3 oy kirish", `Sertifikat (CME ${seminar.cme} ball)`],
      left: 40,
      total: 80,
    },
  ];
}
