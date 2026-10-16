export type OrderStatus = "pending" | "preparing" | "shipping" | "delivered" | "cancelled";
export type OrderKind = "product" | "service" | "lab";
export type PayMethod = "Click" | "Payme" | "Uzum" | "Naqd";

export type DesktopOrder = {
  id: string;
  number: string;
  kind: OrderKind;
  status: OrderStatus;
  title: string;
  seller: string;
  total: number;
  pay: PayMethod;
  count: number;
  images: string[];
  sortKey: string;
  when: string;
  note?: string;
  steps?: { label: string; date: string }[];
  countdown?: number;
};

export const orderKinds: { id: OrderKind; label: string }[] = [
  { id: "product", label: "Mahsulotlar" },
  { id: "service", label: "Xizmatlar (Ustalar)" },
  { id: "lab", label: "Laboratoriya" },
];

export const orderStatuses: { id: "all" | OrderStatus; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "pending", label: "To‘lov kutilmoqda" },
  { id: "preparing", label: "Tayyorlanmoqda" },
  { id: "shipping", label: "Yo‘lda" },
  { id: "delivered", label: "Yetkazildi" },
  { id: "cancelled", label: "Bekor qilingan" },
];

export function statusLabel(status: OrderStatus) {
  return orderStatuses.find((item) => item.id === status)?.label ?? status;
}

const photos = [
  "/img/shop/m-filtek.jpg",
  "/img/shop/m-protaper.jpg",
  "/img/forma/f-teal.jpg",
  "/img/jihoz/lamp.jpg",
  "/img/cart/gloves.jpg",
  "/img/shop/m-fuji.jpg",
  "/img/shop/m-uds.jpg",
  "/img/cart/masks.jpg",
  "/img/shop/m-endo.jpg",
  "/img/shop/m-surgic.jpg",
];

const featured: DesktopOrder[] = [
  {
    id: "sh-240518",
    number: "SH-240518",
    kind: "product",
    status: "shipping",
    title: "Straumann implant to‘plami",
    seller: "StomaHub Market",
    total: 2_340_000,
    pay: "Click",
    count: 5,
    images: [photos[8], photos[9], photos[0], photos[1], photos[5]],
    sortKey: "2024-05-12T14:35",
    when: "12.05.2024, 14:35",
    note: "Taxminiy yetkazib berish: 15.05.2024",
    steps: [
      { label: "Qabul qilindi", date: "12.05.2024" },
      { label: "Tayyorlandi", date: "13.05.2024" },
      { label: "Yo‘lda", date: "14.05.2024" },
      { label: "Yetkaziladi", date: "15.05.2024" },
    ],
  },
  {
    id: "sh-240510",
    number: "SH-240510",
    kind: "product",
    status: "preparing",
    title: "3M kompozit materiali",
    seller: "StomaHub Market",
    total: 1_250_000,
    pay: "Payme",
    count: 4,
    images: [photos[0], photos[1], photos[5], photos[6]],
    sortKey: "2024-05-10T11:20",
    when: "10.05.2024, 11:20",
  },
  {
    id: "sh-240502",
    number: "SH-240502",
    kind: "product",
    status: "delivered",
    title: "Stomatolog formasi Premium",
    seller: "StomaHub Market",
    total: 858_000,
    pay: "Uzum",
    count: 3,
    images: [photos[2], photos[3], photos[4]],
    sortKey: "2024-05-02T18:10",
    when: "02.05.2024, 18:10",
    note: "Yetkazib berildi: 04.05.2024",
  },
  {
    id: "sh-240428",
    number: "SH-240428",
    kind: "product",
    status: "pending",
    title: "Himoya vositalari to‘plami",
    seller: "Dental Pro",
    total: 620_000,
    pay: "Click",
    count: 6,
    images: [photos[4], photos[7], photos[5], photos[0], photos[1], photos[6]],
    sortKey: "2024-04-28T09:15",
    when: "28.04.2024, 09:15",
    countdown: 23 * 3600 + 45 * 60 + 12,
  },
  {
    id: "sh-240421",
    number: "SH-240421",
    kind: "product",
    status: "cancelled",
    title: "Endodontik fayllar to‘plami",
    seller: "StomaHub Market",
    total: 980_000,
    pay: "Click",
    count: 4,
    images: [photos[1], photos[8], photos[0], photos[5]],
    sortKey: "2024-04-21T16:40",
    when: "21.04.2024, 16:40",
    note: "Bekor qilingan: 22.04.2024",
  },
];

const extraTitles = [
  "Bond va primer to‘plami",
  "Implant navigatsiya to‘plami",
  "Artikulyatsion qog‘oz",
  "Kompozit sayqallash disklari",
  "Kanal yuvish eritmasi",
  "Matritsa tizimi",
  "Retraksion iplar",
  "Shisha ionomer sement",
  "Polirovka pastasi",
  "Sterilizatsiya paketlar",
  "Apex lokator",
  "Kofferdam to‘plami",
  "Vaqtinchalik tojlar",
  "Okluzion spray",
  "Profilaktika cho‘tkalari",
  "Endomotor nasadka",
  "Skaner uchlari",
  "Gigiyena to‘plami",
  "Kompozit shprits",
];

const extraStatus: OrderStatus[] = [
  "preparing",
  "shipping",
  "shipping",
  ...Array(15).fill("delivered"),
  "cancelled",
];

const extras: DesktopOrder[] = extraStatus.map((status, index) => {
  const day = 18 - index;
  const month = day > 0 ? 4 : 3;
  const date = day > 0 ? day : 28 + day;
  const stamp = `2024-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}T10:00`;
  const when = `${String(date).padStart(2, "0")}.${String(month).padStart(2, "0")}.2024, 10:00`;
  const count = 2 + (index % 3);
  return {
    id: `sh-extra-${index + 1}`,
    number: `SH-24${String(400 - index).padStart(4, "0")}`,
    kind: "product" as const,
    status,
    title: extraTitles[index] ?? "Stomatologik to‘plam",
    seller: index % 2 === 0 ? "StomaHub Market" : "Dental Pro",
    total: 180_000 + index * 70_000,
    pay: (["Click", "Payme", "Uzum", "Naqd"] as PayMethod[])[index % 4],
    count,
    images: Array.from({ length: count }, (_, n) => photos[(index + n) % photos.length]),
    sortKey: stamp,
    when,
    note: status === "delivered" ? `Yetkazib berildi: ${String(date + 1).padStart(2, "0")}.${String(month).padStart(2, "0")}.2024` : status === "cancelled" ? "Bekor qilingan: 20.04.2024" : undefined,
    steps: status === "shipping"
      ? [
          { label: "Qabul qilindi", date: when.slice(0, 10) },
          { label: "Tayyorlandi", date: when.slice(0, 10) },
          { label: "Yo‘lda", date: when.slice(0, 10) },
          { label: "Yetkaziladi", date: when.slice(0, 10) },
        ]
      : undefined,
  };
});

const services: DesktopOrder[] = [
  { id: "sv-1", number: "SH-240430", kind: "service", status: "preparing", title: "Kreslo o‘rnatish", seller: "Sardor Rahimov", total: 1_500_000, pay: "Click", count: 1, images: ["/img/jihoz/chair.jpg"], sortKey: "2024-04-30T09:00", when: "30.04.2024, 09:00" },
  { id: "sv-2", number: "SH-240412", kind: "service", status: "delivered", title: "Avtoklav profilaktikasi", seller: "Azamat Iskandarov", total: 350_000, pay: "Naqd", count: 1, images: ["/img/jihoz/autoclave.jpg"], sortKey: "2024-04-12T15:00", when: "12.04.2024, 15:00", note: "Yetkazib berildi: 12.04.2024" },
  { id: "sv-3", number: "SH-240401", kind: "service", status: "cancelled", title: "Kompressor ta’miri", seller: "Jasur Rahimov", total: 450_000, pay: "Payme", count: 1, images: ["/img/jihoz/compressor.jpg"], sortKey: "2024-04-01T11:30", when: "01.04.2024, 11:30", note: "Bekor qilingan: 02.04.2024" },
];

const labs: DesktopOrder[] = [
  { id: "lb-1", number: "SH-240515", kind: "lab", status: "shipping", title: "Zirkon tojlar (3 dona)", seller: "Dental Lab", total: 1_080_000, pay: "Click", count: 3, images: ["/img/shop/pdp-tooth.jpg", "/img/shop/m-fuji.jpg", "/img/shop/m-tetric.jpg"], sortKey: "2024-05-15T12:00", when: "15.05.2024, 12:00", note: "Taxminiy yetkazib berish: 18.05.2024", steps: [
    { label: "Qabul qilindi", date: "15.05.2024" },
    { label: "Tayyorlandi", date: "16.05.2024" },
    { label: "Yo‘lda", date: "17.05.2024" },
    { label: "Yetkaziladi", date: "18.05.2024" },
  ] },
  { id: "lb-2", number: "SH-240408", kind: "lab", status: "delivered", title: "Vaqtinchalik protez", seller: "Smile Lab", total: 640_000, pay: "Uzum", count: 1, images: ["/img/shop/pdp-t1.jpg"], sortKey: "2024-04-08T13:20", when: "08.04.2024, 13:20", note: "Yetkazib berildi: 11.04.2024" },
  { id: "lb-3", number: "SH-240322", kind: "lab", status: "pending", title: "Individual qoshiq", seller: "Dental Lab", total: 220_000, pay: "Payme", count: 2, images: ["/img/shop/pdp-t2.jpg", "/img/shop/pdp-t3.jpg"], sortKey: "2024-03-22T16:40", when: "22.03.2024, 16:40", countdown: 5 * 3600 },
];

export const desktopOrders: DesktopOrder[] = [...featured, ...extras, ...services, ...labs].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

export const ORDER_PAGE_SIZE = 5;
