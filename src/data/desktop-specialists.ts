import { phoneSpecialists } from "@/data/phone14";

export type Specialty =
  | "implantolog"
  | "ortodont"
  | "terapevt"
  | "ortoped"
  | "jarroh"
  | "endodontist"
  | "parodontolog"
  | "bolalar"
  | "gigiyenist";

export type SpecSort = "reyting" | "yuqori" | "tajriba" | "bemor";

export type SpecialistReview = {
  name: string;
  date: string;
  rating: number;
  text: string;
};

export type Specialist = {
  id: string;
  name: string;
  specialty: Specialty;
  specialtyLabel: string;
  city: string;
  clinic: string;
  rating: number;
  reviews: number;
  experience: string;
  years: number;
  patientsLabel: string;
  patients: number;
  online: boolean;
  image: string;
  phone: string;
  hours: string;
  about: string;
  skills: string[];
  reviewList: SpecialistReview[];
  rank: number;
};

export const specialties: { id: Specialty; label: string }[] = [
  { id: "implantolog", label: "Implantolog" },
  { id: "ortodont", label: "Ortodont" },
  { id: "terapevt", label: "Terapevt" },
  { id: "ortoped", label: "Ortoped" },
  { id: "jarroh", label: "Jarroh" },
  { id: "endodontist", label: "Endodontist" },
  { id: "parodontolog", label: "Parodontolog" },
  { id: "bolalar", label: "Bolalar stomatologi" },
  { id: "gigiyenist", label: "Gigiyenist" },
];

export const specialistCities = ["Toshkent", "Samarqand", "Namangan"];

const review = (name: string, date: string, rating: number, text: string): SpecialistReview => ({ name, date, rating, text });

export const specialists: Specialist[] = [
  {
    id: "sardor-karimov",
    name: "Dr. Sardor Karimov",
    specialty: "implantolog",
    specialtyLabel: "Implantolog",
    city: "Toshkent",
    clinic: "Smile Dent klinikasi",
    rating: 4.9,
    reviews: 120,
    experience: "10+ yil tajriba",
    years: 10,
    patientsLabel: "1200+ bemor",
    patients: 1200,
    online: true,
    image: "/img/design-pr13/specialists/sardor-karimov.png",
    phone: "+998 90 123 45 01",
    hours: "09:00 – 18:00",
    about: "Implant joylashtirish va suyak plastikasi bo‘yicha klinik amaliyot. Reja tushuntiriladi, keyin bosqichma-bosqich nazorat qilinadi.",
    skills: ["Implant", "Suyak plastikasi", "CBCT reja"],
    reviewList: [
      review("Madina Yusupova", "12 sentabr", 5, "Implant rejasi aniq tushuntirildi. Qabul tinch va tartibli o‘tdi."),
      review("Jasur Alimov", "2 oktabr", 5, "Og‘riq nazorati yaxshi. Keyingi ko‘rik vaqtida belgilab qo‘yildi."),
    ],
    rank: 1,
  },
  {
    id: "malika-yoldosheva",
    name: "Dr. Malika Yo‘ldosheva",
    specialty: "terapevt",
    specialtyLabel: "Terapevt",
    city: "Toshkent",
    clinic: "Nur Stom",
    rating: 4.8,
    reviews: 98,
    experience: "8 yil tajriba",
    years: 8,
    patientsLabel: "950+ bemor",
    patients: 950,
    online: true,
    image: "/img/design-pr13/specialists/malika-yoldosheva.png",
    phone: "+998 90 123 45 02",
    hours: "09:00 – 17:00",
    about: "Kariyes, plomba va estetik restavratsiya. Bemorga davolash variantlari oddiy tilda tushuntiriladi.",
    skills: ["Terapiya", "Kompozit", "Gigiyena maslahati"],
    reviewList: [
      review("Dilnoza Karimova", "20 sentabr", 5, "Plomba rangi tishga mos tushdi. Qabul vaqtida qabul qilindi."),
      review("Sardor Toshpo‘latov", "28 sentabr", 4, "Tushuntirish aniq. Navbat uzoq kutdirmadi."),
    ],
    rank: 2,
  },
  {
    id: "alisher-toxtayev",
    name: "Dr. Alisher To‘xtayev",
    specialty: "ortoped",
    specialtyLabel: "Ortoped",
    city: "Samarqand",
    clinic: "Samarqand Dental",
    rating: 4.7,
    reviews: 76,
    experience: "12+ yil tajriba",
    years: 12,
    patientsLabel: "1100+ bemor",
    patients: 1100,
    online: false,
    image: "/img/design-pr13/specialists/alisher-toxtayev.png",
    phone: "+998 90 123 45 03",
    hours: "10:00 – 18:00",
    about: "Krona, ko‘prik va protez. Tishlash balandligi va rang qabulda tekshiriladi.",
    skills: ["Krona", "Ko‘prik", "Protez"],
    reviewList: [
      review("Aziza Rahimova", "5 oktabr", 5, "Krona rangi tabiiy chiqdi. O‘rnatish bir qabulda yakunlandi."),
      review("Bekzod Ismoilov", "18 sentabr", 4, "Protez moslashdi. Ikkinchi ko‘rikda mayda tuzatish qilindi."),
    ],
    rank: 3,
  },
  {
    id: "dilnoza-saidova",
    name: "Dr. Dilnoza Saidova",
    specialty: "gigiyenist",
    specialtyLabel: "Gigiyenist",
    city: "Toshkent",
    clinic: "White Smile",
    rating: 4.8,
    reviews: 64,
    experience: "7 yil tajriba",
    years: 7,
    patientsLabel: "800+ bemor",
    patients: 800,
    online: false,
    image: "/img/design-pr13/specialists/dilnoza-saidova.png",
    phone: "+998 90 123 45 04",
    hours: "09:00 – 16:00",
    about: "Professional tozalash va profilaktika. Uyda parvarish bo‘yicha qisqa reja beriladi.",
    skills: ["Professional tozalash", "Profilaktika", "Oqartirish maslahati"],
    reviewList: [
      review("Nilufar Saidova", "1 oktabr", 5, "Tozalashdan keyin tishlar yengil bo‘ldi. Maslahat aniq edi."),
      review("Komil Abdullaev", "9 sentabr", 5, "Qabul qisqa va tartibli. Keyingi sana yozib qo‘yildi."),
    ],
    rank: 4,
  },
  {
    id: "kamol-raximov",
    name: "Dr. Kamol Raximov",
    specialty: "jarroh",
    specialtyLabel: "Jarroh",
    city: "Toshkent",
    clinic: "Jarrohlik markazi",
    rating: 4.9,
    reviews: 140,
    experience: "15+ yil tajriba",
    years: 15,
    patientsLabel: "1500+ bemor",
    patients: 1500,
    online: false,
    image: "/img/design-pr13/specialists/kamol-raximov.png",
    phone: "+998 90 123 45 05",
    hours: "09:00 – 18:00",
    about: "Tish olish va yumshoq to‘qima amaliyoti. Operatsiyadan keyingi parvarish yozma beriladi.",
    skills: ["Exodontiya", "Yumshoq to‘qima", "Og‘riq nazorati"],
    reviewList: [
      review("Shahnoza Aliyeva", "14 sentabr", 5, "Tish olish tez o‘tdi. Keyingi kun aloqaga chiqishdi."),
      review("Otabek Nurmatov", "22 sentabr", 5, "Tushuntirish tinch. Shish bo‘yicha ko‘rsatma aniq."),
    ],
    rank: 5,
  },
  {
    id: "nigora-aliyeva",
    name: "Dr. Nigora Aliyeva",
    specialty: "endodontist",
    specialtyLabel: "Endodontist",
    city: "Toshkent",
    clinic: "Endo Clinic",
    rating: 4.8,
    reviews: 112,
    experience: "9 yil tajriba",
    years: 9,
    patientsLabel: "900+ bemor",
    patients: 900,
    online: false,
    image: "/img/design-pr13/specialists/nigora-aliyeva.png",
    phone: "+998 90 123 45 06",
    hours: "10:00 – 18:00",
    about: "Kanal davolash va qayta davolash. Ishchi uzunlik va irrigatsiya qabulda tushuntiriladi.",
    skills: ["Kanal davolash", "Mikroskop", "Qayta davolash"],
    reviewList: [
      review("Malika Ergasheva", "3 oktabr", 5, "Og‘riq birinchi qabuldan keyin pasaydi. Nazorat aniq belgilandi."),
      review("Javohir Qodirov", "11 sentabr", 4, "Davolash ikki qabulga bo‘lindi. Har bir qadam tushunarli."),
    ],
    rank: 6,
  },
  {
    id: "azizbek-mirzayev",
    name: "Dr. Azizbek Mirzayev",
    specialty: "ortodont",
    specialtyLabel: "Ortodont",
    city: "Namangan",
    clinic: "Namangan Ortodont",
    rating: 4.7,
    reviews: 90,
    experience: "10+ yil tajriba",
    years: 10,
    patientsLabel: "1000+ bemor",
    patients: 1000,
    online: false,
    image: "/img/design-pr13/specialists/azizbek-mirzayev.png",
    phone: "+998 90 123 45 07",
    hours: "09:00 – 17:00",
    about: "Breket va elayner. Davolash muddati va nazorat tashriflari reja qilinadi.",
    skills: ["Breket", "Elayner", "Rasm tahlili"],
    reviewList: [
      review("Sevara Mahmudova", "19 sentabr", 5, "Elayner rejasi fotosuratlar bilan ko‘rsatildi."),
      review("Bobur Ismoilov", "7 oktabr", 4, "Nazorat qabuli qisqa. Keyingi bosqich tushuntirildi."),
    ],
    rank: 7,
  },
  {
    id: "bobur-tursunov",
    name: "Dr. Bobur Tursunov",
    specialty: "bolalar",
    specialtyLabel: "Bolalar stomatologi",
    city: "Toshkent",
    clinic: "Bolajon stomatologiya",
    rating: 4.8,
    reviews: 88,
    experience: "8 yil tajriba",
    years: 8,
    patientsLabel: "850+ bemor",
    patients: 850,
    online: false,
    image: "/img/design-pr13/specialists/bobur-tursunov.png",
    phone: "+998 90 123 45 08",
    hours: "09:00 – 16:00",
    about: "Bolalar qabuli: profilaktika, plomba va tinchlantirish. Ota-onaga parvarish eslatmasi beriladi.",
    skills: ["Bolalar qabuli", "Profilaktika", "Plomba"],
    reviewList: [
      review("Gulnora Akramova", "25 sentabr", 5, "Bola qo‘rqmadi. Qabul o‘yin bilan boshlandi."),
      review("Temur Yo‘ldoshev", "30 sentabr", 5, "Tushuntirish ota-onaga ham, bolaga ham tushunarli."),
    ],
    rank: 8,
  },
];

function norm(value: string) {
  return value.toLowerCase().replaceAll("‘", "'").replaceAll("’", "'").replaceAll("ʻ", "'");
}

export function filterSpecialists(list: Specialist[], opts: { q: string; specialty: Specialty | ""; city: string }) {
  const q = norm(opts.q.trim());
  return list.filter((person) => {
    if (opts.specialty && person.specialty !== opts.specialty) return false;
    if (opts.city && person.city !== opts.city) return false;
    if (!q) return true;
    return norm(`${person.name} ${person.specialtyLabel} ${person.city} ${person.clinic}`).includes(q);
  });
}

export function sortSpecialists(list: Specialist[], sort: SpecSort) {
  const next = [...list];
  if (sort === "yuqori") next.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews || a.rank - b.rank);
  else if (sort === "tajriba") next.sort((a, b) => b.years - a.years || b.reviews - a.reviews || a.rank - b.rank);
  else if (sort === "bemor") next.sort((a, b) => b.patients - a.patients || a.rank - b.rank);
  else next.sort((a, b) => a.rank - b.rank);
  return next;
}

export function getSpecialist(id: string) {
  return specialists.find((person) => person.id === id) ?? phoneSpecialists.find((person) => person.id === id) ?? null;
}
