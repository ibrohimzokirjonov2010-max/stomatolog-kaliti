export type UstaService = "unit" | "hand" | "compressor" | "autoclave" | "rentgen" | "scanner" | "install";
export type UstaStatus = "online" | "soon" | "offline";

export type UstaPrice = { name: string; price: string };
export type UstaReview = { name: string; clinic: string; date: string; rating: number; text: string; avatar?: string };

export type DesktopUsta = {
  slug: string;
  name: string;
  role: string;
  city: string;
  district: string;
  status: UstaStatus;
  statusLabel: string;
  services: UstaService[];
  tags: string[];
  years: number;
  jobs: number;
  rating: number;
  reviews: number;
  response: string;
  hours: string;
  warranty: string;
  prices: UstaPrice[];
  brands: string[];
  skills: string[];
  phone: string;
  telegram: string;
  image: string;
  works: string[];
  about: string;
  popularity: number;
  weekend: string;
  areas: { place: string; time: string }[];
  serviceRows: { name: string; price: string; note: string }[];
  reviewList: UstaReview[];
  stars: number[];
};

export const ustaServices: { id: "all" | UstaService; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "unit", label: "Ustanovka ta’miri" },
  { id: "hand", label: "Uchlik/turbina ta’miri" },
  { id: "compressor", label: "Kompressor" },
  { id: "autoclave", label: "Avtoklav" },
  { id: "rentgen", label: "Rentgen va CBCT" },
  { id: "scanner", label: "Skaner va CAD/CAM" },
  { id: "install", label: "O‘rnatish va montaj" },
];

export const ustaCities = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg‘ona"];
export const ustaBrandFilters = ["Sirona", "KaVo", "NSK", "W&H", "Planmeca", "Melag", "Fengdan"];

const works = [1, 2, 3, 4, 5, 6].map((n) => `/img/usta/d-work-${n}.jpg`);

const reviews: UstaReview[] = [
  { name: "Dr. Sardor Ismoilov", clinic: "Smile Dental Clinic", date: "12.12.2024", rating: 5, text: "Juda professional usta. Kresloni tez va sifatli o‘rnatib berdi. Tavsiya qilaman!", avatar: "/img/usta/d-rev-1.jpg" },
  { name: "Dr. Dilnoza Karimova", clinic: "DentaCare", date: "28.11.2024", rating: 5, text: "Kompressor ta’mirini qilgan, hozirgacha muammo yo‘q. Ishiga mas’uliyatli.", avatar: "/img/usta/d-rev-2.jpg" },
  { name: "Dr. Bekzod Nurmatov", clinic: "City Dental", date: "15.11.2024", rating: 5, text: "Rentgen apparati diagnostikasini qilib berdi, muammoni aniq topdi va bartaraf etdi.", avatar: "/img/usta/d-rev-3.jpg" },
  { name: "Dr. Malika Saidova", clinic: "Dental Plus", date: "02.11.2024", rating: 5, text: "Javob berishi tez, narxlari ham adolatli. Avtoklav profilaktikasini qildik, hammasi zo‘r.", avatar: "/img/usta/d-rev-4.jpg" },
];

function base(partial: DesktopUsta): DesktopUsta {
  return partial;
}

const featured: DesktopUsta[] = [
  base({
    slug: "sardor-rahimov",
    name: "Sardor Rahimov",
    role: "Stomatologik uskunalar bo‘yicha muhandis",
    city: "Toshkent",
    district: "Chilonzor",
    status: "online",
    statusLabel: "Onlayn",
    services: ["unit", "hand", "compressor", "autoclave"],
    tags: ["Ustanovka", "Uchlik/turbina", "Kompressor", "Avtoklav"],
    years: 9,
    jobs: 350,
    rating: 4.9,
    reviews: 128,
    response: "~20 daqiqa",
    hours: "09:00–20:00",
    warranty: "3 oy",
    prices: [
      { name: "Chaqiruv (Toshkent)", price: "150 000 so‘m" },
      { name: "Turbina podshipnik almashtirish", price: "dan 350 000 so‘m" },
      { name: "Ustanovka diagnostika", price: "Bepul" },
    ],
    brands: ["Sirona", "KaVo", "Fengdan", "NSK"],
    skills: ["Kreslo o‘rnatish", "Kompressor ta’miri", "Avtoklav servisi"],
    phone: "+998 90 111 22 33",
    telegram: "sardor_usta",
    image: "/img/usta/d-sardor.jpg",
    works: works.slice(0, 4),
    about: "Ustanovka, uchlik va kompressor bo‘yicha tajribali muhandis.",
    popularity: 100,
    weekend: "Yakshanba dam olish",
    areas: [
      { place: "Toshkent shahri", time: "1–2 soat" },
      { place: "Toshkent viloyati", time: "1 kun" },
      { place: "Boshqa viloyatlar", time: "1–3 kun" },
    ],
    serviceRows: [
      { name: "Chaqiruv (Toshkent)", price: "150 000 so‘m", note: "Shahar bo‘yicha" },
      { name: "Turbina podshipnik", price: "350 000 so‘m", note: "Almashtirish" },
      { name: "Ustanovka diagnostika", price: "Bepul", note: "Birinchi ko‘rik" },
    ],
    reviewList: reviews,
    stars: [80, 12, 5, 2, 1],
  }),
  base({
    slug: "dilshod-mavlonov",
    name: "Dilshod Mavlonov",
    role: "Rentgen va CBCT mutaxassisi",
    city: "Toshkent",
    district: "Yunusobod",
    status: "soon",
    statusLabel: "5 daqiqada javob",
    services: ["rentgen", "scanner", "install"],
    tags: ["Rentgen", "CBCT", "Skaner", "O‘rnatish"],
    years: 7,
    jobs: 280,
    rating: 4.8,
    reviews: 96,
    response: "~30 daqiqa",
    hours: "09:00–19:00",
    warranty: "6 oy",
    prices: [
      { name: "Rentgen diagnostika", price: "200 000 so‘m" },
      { name: "CBCT kalibrovka", price: "dan 500 000 so‘m" },
      { name: "Skaner o‘rnatish", price: "900 000 so‘m" },
    ],
    brands: ["Planmeca", "Carestream", "Vatech"],
    skills: ["Rentgen apparati", "CBCT", "Skaner o‘rnatish"],
    phone: "+998 90 222 33 44",
    telegram: "dilshod_rentgen",
    image: "/img/usta/d-dilshod.jpg",
    works: [works[4], works[1], works[0], works[5]],
    about: "Rentgen, CBCT va intraoral skaner o‘rnatish hamda kalibrovka.",
    popularity: 99,
    weekend: "Yakshanba kelishuv bilan",
    areas: [
      { place: "Toshkent shahri", time: "1–2 soat" },
      { place: "Toshkent viloyati", time: "1 kun" },
      { place: "Boshqa viloyatlar", time: "2–3 kun" },
    ],
    serviceRows: [
      { name: "Rentgen diagnostika", price: "200 000 so‘m", note: "Apparat tekshiruvi" },
      { name: "CBCT kalibrovka", price: "500 000 so‘m", note: "Aniqlik sozlash" },
      { name: "Skaner o‘rnatish", price: "900 000 so‘m", note: "Dastur bilan" },
    ],
    reviewList: reviews,
    stars: [76, 16, 5, 2, 1],
  }),
  base({
    slug: "azamat-iskandarov",
    name: "Azamat Iskandarov",
    role: "Avtoklav va sterilizatsiya uskunalari",
    city: "Toshkent",
    district: "Mirzo Ulug‘bek",
    status: "offline",
    statusLabel: "Offlayn",
    services: ["autoclave"],
    tags: ["Avtoklav", "Melag", "W&H", "Sterilizatsiya"],
    years: 6,
    jobs: 210,
    rating: 4.7,
    reviews: 64,
    response: "~1 soat",
    hours: "09:00–18:00",
    warranty: "6 oy",
    prices: [
      { name: "Avtoklav diagnostika", price: "150 000 so‘m" },
      { name: "Ta’mirlash", price: "dan 400 000 so‘m" },
      { name: "Profilaktik servis", price: "300 000 so‘m" },
    ],
    brands: ["Melag", "W&H"],
    skills: ["Avtoklav servisi", "Sterilizatsiya"],
    phone: "+998 90 333 44 55",
    telegram: "azamat_avtoklav",
    image: "/img/usta/d-azamat.jpg",
    works: [works[3], works[2], works[5], works[1]],
    about: "Avtoklav va sterilizatsiya uskunalarini ta’mirlash va profilaktika.",
    popularity: 98,
    weekend: "Yakshanba dam olish",
    areas: [
      { place: "Toshkent shahri", time: "2–4 soat" },
      { place: "Toshkent viloyati", time: "1 kun" },
      { place: "Boshqa viloyatlar", time: "2–4 kun" },
    ],
    serviceRows: [
      { name: "Avtoklav diagnostika", price: "150 000 so‘m", note: "Nosozlikni aniqlash" },
      { name: "Ta’mirlash", price: "400 000 so‘m", note: "Ehtiyot qism alohida" },
      { name: "Profilaktika", price: "300 000 so‘m", note: "Tozalash va sozlash" },
    ],
    reviewList: reviews,
    stars: [70, 18, 8, 3, 1],
  }),
  base({
    slug: "bobur-qodirov",
    name: "Bobur Qodirov",
    role: "Mikroskop va uchliklar bo‘yicha mutaxassis",
    city: "Toshkent",
    district: "Shayxontohur",
    status: "online",
    statusLabel: "Onlayn",
    services: ["hand", "install"],
    tags: ["Mikroskop", "Uchlik/Turbina", "KaVo", "NSK"],
    years: 10,
    jobs: 420,
    rating: 4.9,
    reviews: 142,
    response: "~20 daqiqa",
    hours: "09:00–20:00",
    warranty: "3 oy",
    prices: [
      { name: "Mikroskop diagnostika", price: "300 000 so‘m" },
      { name: "Uchlik ta’miri", price: "dan 250 000 so‘m" },
      { name: "Optika tozalash", price: "150 000 so‘m" },
    ],
    brands: ["KaVo", "NSK", "W&H"],
    skills: ["Uchliklar", "Turbina ta’miri", "Mikroskop"],
    phone: "+998 90 444 55 66",
    telegram: "bobur_uchlik",
    image: "/img/usta/d-bobur.jpg",
    works: [works[5], works[0], works[4], works[3]],
    about: "Uchlik, turbina va mikroskop optikasini ta’mirlash.",
    popularity: 97,
    weekend: "Yakshanba 10:00–16:00",
    areas: [
      { place: "Toshkent shahri", time: "1–2 soat" },
      { place: "Toshkent viloyati", time: "1 kun" },
      { place: "Boshqa viloyatlar", time: "1–3 kun" },
    ],
    serviceRows: [
      { name: "Mikroskop diagnostika", price: "300 000 so‘m", note: "Optika tekshiruvi" },
      { name: "Uchlik ta’miri", price: "250 000 so‘m", note: "Podshipnik almashtirish" },
      { name: "Optik tozalash", price: "150 000 so‘m", note: "Linza parvarishi" },
    ],
    reviewList: reviews,
    stars: [86, 9, 3, 1, 1],
  }),
  base({
    slug: "jasur-rahimov",
    name: "Jasur Rahimov",
    role: "Dental jihozlar ustasi",
    city: "Toshkent",
    district: "Yunusobod",
    status: "online",
    statusLabel: "Onlayn",
    services: ["unit", "compressor", "autoclave", "rentgen", "hand", "install"],
    tags: ["Kreslo o‘rnatish", "Kompressor ta’miri", "Avtoklav servisi", "Rentgen apparati", "Turbina ta’miri", "Uchliklar", "Profilaktik servis"],
    years: 9,
    jobs: 386,
    rating: 4.9,
    reviews: 214,
    response: "~15 daqiqa",
    hours: "09:00–18:00",
    warranty: "6 oy",
    prices: [
      { name: "Kreslo o‘rnatish", price: "1 500 000 so‘m" },
      { name: "Kompressor ta’miri", price: "450 000 so‘m" },
      { name: "Chaqiruv (Toshkent)", price: "100 000 so‘m" },
    ],
    brands: ["Sirona", "KaVo", "Fengdan", "W&H", "NSK", "Planmeca", "Carestream", "Vatech"],
    skills: ["Kreslo o‘rnatish", "Kompressor ta’miri", "Avtoklav servisi", "Rentgen apparati", "Turbina ta’miri", "Uchliklar", "Profilaktik servis"],
    phone: "+998 90 555 66 77",
    telegram: "jasur_rahimov",
    image: "/img/usta/d-jasur.jpg",
    works,
    about: "Dental jihozlarni o‘rnatish, sozlash va ta’mirlash. Rasmiy brendlar bo‘yicha tajriba.",
    popularity: 96,
    weekend: "Oldindan kelishuv bilan",
    areas: [
      { place: "Toshkent shahri", time: "1–2 soat" },
      { place: "Toshkent viloyati", time: "1 kun" },
      { place: "Boshqa viloyatlar", time: "1–3 kun" },
    ],
    serviceRows: [
      { name: "Kreslo o‘rnatish", price: "1 500 000 so‘m", note: "To‘liq o‘rnatish va sozlash" },
      { name: "Kompressor ta’miri", price: "450 000 so‘m dan", note: "Diagnostika bepul" },
      { name: "Turbina ta’miri", price: "250 000 so‘m", note: "Podshipnik almashtirish" },
      { name: "Avtoklav profilaktikasi", price: "350 000 so‘m", note: "Tozalash, tekshirish, sozlash" },
      { name: "Rentgen apparati ta’miri", price: "400 000 so‘m dan", note: "Modelga qarab" },
      { name: "Chaqiruv (Toshkent)", price: "100 000 so‘m", note: "Toshkent shahri bo‘yicha" },
    ],
    reviewList: reviews,
    stars: [88, 8, 3, 1, 0],
  }),
];

const extras: DesktopUsta[] = [
  ["Javlon Tursunov", "Toshkent", "unit", "Sirona"],
  ["Otabek Yusupov", "Toshkent", "compressor", "KaVo"],
  ["Sherzod Aliyev", "Toshkent", "rentgen", "Planmeca"],
  ["Kamoliddin Nazarov", "Toshkent", "scanner", "3Shape"],
  ["Bekzod Karimov", "Toshkent", "hand", "NSK"],
  ["Ulug‘bek Sobirov", "Toshkent", "autoclave", "Melag"],
  ["Jasur Qodirov", "Toshkent", "install", "Fengdan"],
].map((row, index) => {
  const [name, city, service, brand] = row as [string, string, UstaService, string];
  return base({
    slug: `usta-${index + 1}`,
    name,
    role: "Jihozlar bo‘yicha usta",
    city,
    district: ["Mirobod", "Yakkasaroy", "Olmazor", "Sergeli", "Uchtepa", "Yashnobod", "Bektemir"][index],
    status: index % 3 === 0 ? "online" : index % 3 === 1 ? "soon" : "offline",
    statusLabel: index % 3 === 0 ? "Onlayn" : index % 3 === 1 ? "Tez javob" : "Offlayn",
    services: [service],
    tags: [ustaServices.find((item) => item.id === service)?.label ?? "Servis", brand],
    years: 4 + index,
    jobs: 80 + index * 15,
    rating: 4.5 + (index % 4) * 0.1,
    reviews: 20 + index * 4,
    response: "~40 daqiqa",
    hours: "09:00–18:00",
    warranty: "3 oy",
    prices: [{ name: "Chaqiruv", price: "120 000 so‘m" }, { name: "Diagnostika", price: "200 000 so‘m" }],
    brands: [brand],
    skills: [ustaServices.find((item) => item.id === service)?.label ?? "Servis"],
    phone: `+998 90 700 0${index} 0${index}`,
    telegram: `usta_${index + 1}`,
    image: "",
    works: works.slice(0, 3),
    about: `${city} bo‘yicha stomatologik jihozlarga texnik xizmat.`,
    popularity: 70 - index,
    weekend: "Kelishuv bilan",
    areas: [{ place: city, time: "1 kun" }, { place: "Boshqa viloyatlar", time: "2–4 kun" }],
    serviceRows: [{ name: "Chaqiruv", price: "120 000 so‘m", note: city }, { name: "Diagnostika", price: "200 000 so‘m", note: "Ko‘rik" }],
    reviewList: reviews.slice(0, 2),
    stars: [70, 20, 6, 3, 1],
  });
});

export const desktopUstalar: DesktopUsta[] = [...featured, ...extras];

export function getDesktopUsta(slug: string) {
  return desktopUstalar.find((item) => item.slug === slug);
}

export function desktopUstaSlugs() {
  return desktopUstalar.map((item) => item.slug);
}

export const repairTypes = ["Stomatologik ustanovka", "Uchlik / turbina", "Kompressor", "Avtoklav", "Rentgen va CBCT", "Skaner", "Boshqa"];
