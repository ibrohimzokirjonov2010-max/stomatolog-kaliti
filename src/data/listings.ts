export type ListingType = "sotiladi" | "ijara" | "ish" | "xizmat" | "hamkor";

export type Listing = {
  id: string;
  type: ListingType;
  typeLabel: string;
  title: string;
  city: string;
  date: string;
  dateLabel: string;
  price: number | null;
  priceLabel: string;
  views: number;
  likes: number;
  image: string;
  category: string;
  description: string;
  phone?: string;
  telegram?: string;
  photos?: string[];
  district?: string;
  sourceUrl?: string;
  instagram?: string;
};

export const listingTypes: { id: ListingType | ""; label: string }[] = [
  { id: "", label: "Barcha e’lonlar" },
  { id: "sotiladi", label: "Sotiladi" },
  { id: "ijara", label: "Ijaraga" },
  { id: "ish", label: "Ish o‘rni" },
  { id: "xizmat", label: "Xizmatlar" },
  { id: "hamkor", label: "Hamkorlik" },
];

export const listingCities = [
  { city: "Toshkent" },
  { city: "Samarqand" },
  { city: "Buxoro" },
  { city: "Andijon" },
  { city: "Namangan" },
  { city: "Farg‘ona" },
];

export const seedListings: Listing[] = [
  { id: "el-1", type: "sotiladi", typeLabel: "Sotiladi", title: "Stomatologik ustanovka (komplekt)", city: "Toshkent", date: "2026-10-12", dateLabel: "12.10.2026", price: 45000000, priceLabel: "45 000 000 so‘m", views: 245, likes: 12, image: "/img/jihoz/unit.jpg", category: "Uskunalar", description: "To‘liq stomatologik ustanovka. Kompressor, kreslo, lampa va asbob paneli bilan. Toshkentda ko‘rib chiqish mumkin." },
  { id: "el-2", type: "ijara", typeLabel: "Ijaraga", title: "Klinika xonasi ijaraga beriladi", city: "Toshkent", date: "2026-10-10", dateLabel: "10.10.2026", price: 6000000, priceLabel: "6 000 000 so‘m / oy", views: 189, likes: 8, image: "/img/mobile/kl-clinic.jpg", category: "Ijara", description: "Tayyor stomatologiya xonasi. Kreslo o‘rni, suv va elektr tayyor. Oylik to‘lov." },
  { id: "el-3", type: "ish", typeLabel: "Ish o‘rni", title: "Stomatolog shifokor kerak", city: "Samarqand", date: "2026-10-09", dateLabel: "09.10.2026", price: null, priceLabel: "Kelishiladi", views: 312, likes: 15, image: "/img/jobs/doctor.jpg", category: "Ish", description: "Terapevt yoki ortoped. To‘liq stavka, bemor oqimi bor klinika. Maosh suhbatda." },
  { id: "el-4", type: "xizmat", typeLabel: "Xizmatlar", title: "Zirkoniya protez tayyorlash", city: "Toshkent", date: "2026-10-08", dateLabel: "08.10.2026", price: 300000, priceLabel: "300 000 so‘m", views: 176, likes: 6, image: "/img/hub/course-3.jpg", category: "Laboratoriya", description: "Laboratoriya zirkoniya krona va ko‘prik tayyorlaydi. Muddat 5 ish kuni." },
  { id: "el-5", type: "ish", typeLabel: "Ish o‘rni", title: "Assistent (medsestra) kerak", city: "Buxoro", date: "2026-10-07", dateLabel: "07.10.2026", price: null, priceLabel: "Kelishiladi", views: 94, likes: 4, image: "/img/forma/f-navy.jpg", category: "Ish", description: "Qabulda shifokorga yordam. Tajriba talab qilinmaydi, o‘qitamiz." },
  { id: "el-6", type: "sotiladi", typeLabel: "Sotiladi", title: "Implant motor (yangi)", city: "Toshkent", date: "2026-10-06", dateLabel: "06.10.2026", price: 28000000, priceLabel: "28 000 000 so‘m", views: 203, likes: 11, image: "/img/jihoz/handpiece.jpg", category: "Uskunalar", description: "Yangi implant motor, kafolat taloni bilan. Bir marta ishlatilmagan." },
  { id: "el-7", type: "ijara", typeLabel: "Ijaraga", title: "Stomatologik kabinet ijaraga", city: "Andijon", date: "2026-10-05", dateLabel: "05.10.2026", price: 5000000, priceLabel: "5 000 000 so‘m / oy", views: 167, likes: 7, image: "/img/mobile/pf-clinic.jpg", category: "Ijara", description: "Markazda kabinet. Qabul soatlari kelishiladi." },
  { id: "el-8", type: "sotiladi", typeLabel: "Sotiladi", title: "Surgic instrumentlar (to‘plam)", city: "Toshkent", date: "2026-10-04", dateLabel: "04.10.2026", price: 3500000, priceLabel: "3 500 000 so‘m", views: 129, likes: 5, image: "/img/hub/course-6.jpg", category: "Asboblar", description: "Jarrohlik asboblari to‘plami. Steril konteyner bilan." },
];

export function getListing(id: string, extra: Listing[] = []) {
  return extra.find((item) => item.id === id) ?? null;
}
