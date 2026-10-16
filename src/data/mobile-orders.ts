export type MobileOrderStatus = "yetkazildi" | "yetkazilmoqda" | "jarayonda" | "bekor";

export type MobileOrderStep = {
  title: string;
  when: string;
  state: "done" | "current" | "todo";
};

export type MobileOrderItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
};

export type MobileOrder = {
  id: string;
  number: string;
  date: string;
  seller: string;
  status: MobileOrderStatus;
  itemCount: number;
  total: number;
  images: string[];
  extra: number;
  items: MobileOrderItem[];
  steps?: MobileOrderStep[];
};

export const orderStatusMeta: Record<MobileOrderStatus, { label: string }> = {
  yetkazildi: { label: "Yetkazildi" },
  yetkazilmoqda: { label: "Yetkazilmoqda" },
  jarayonda: { label: "Jarayonda" },
  bekor: { label: "Bekor qilingan" },
};

export const orderChips: { id: "all" | MobileOrderStatus; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "jarayonda", label: "Jarayonda" },
  { id: "yetkazilmoqda", label: "Yetkazilmoqda" },
  { id: "yetkazildi", label: "Yetkazildi" },
  { id: "bekor", label: "Bekor" },
];

const filtek = "/img/mobile/om-filtek-box.jpg";
const syr = "/img/mobile/om-filtek-syr.jpg";
const bottle = "/img/mobile/om-filtek.jpg";
const implant = "/img/mobile/implant.jpg";
const osstem = "/img/mobile/sv-osstem.jpg";
const hand = "/img/mobile/jz-hand.jpg";
const nsk = "/img/mobile/sv-nsk.jpg";
const tools = "/img/mobile/yn-tools.jpg";
const tip = "/img/mobile/jz-tip.jpg";
const chair = "/img/mobile/jz-chair.jpg";
const screen = "/img/mobile/jz-screen.jpg";

function item(id: string, name: string, price: number, image: string, qty = 1): MobileOrderItem {
  return { id, name, price, image, qty };
}

export const mobileOrders: MobileOrder[] = [
  {
    id: "sk-10077",
    number: "SK-10077",
    date: "2026-10-08 14:30",
    seller: "StomaHub Market",
    status: "yetkazildi",
    itemCount: 5,
    total: 3_480_000,
    images: [filtek, syr, bottle],
    extra: 2,
    items: [
      item("od-10077-box", "Filtek Universal kompakt", 800_000, filtek, 2),
      item("od-10077-syr", "Filtek shprits to‘plami", 540_000, syr, 2),
      item("od-10077-bot", "Bonding suyuqligi", 800_000, bottle, 1),
    ],
  },
  {
    id: "sk-10076",
    number: "SK-10076",
    date: "2026-10-05 11:20",
    seller: "Dentium Uzbekistan",
    status: "yetkazilmoqda",
    itemCount: 3,
    total: 9_600_000,
    images: [implant, osstem, hand],
    extra: 1,
    items: [
      item("od-10076-imp", "Osstem implant", 4_200_000, implant, 1),
      item("od-10076-box", "Implant to‘plami", 3_400_000, osstem, 1),
      item("od-10076-hand", "Jarrohlik asbobi", 2_000_000, hand, 1),
    ],
    steps: [
      { title: "Buyurtma qabul qilindi", when: "5 okt, 11:20", state: "done" },
      { title: "Tayyorlanmoqda", when: "5 okt, 16:45", state: "done" },
      { title: "Yetkazilmoqda", when: "6 okt, 10:30", state: "current" },
      { title: "Yetkaziladi", when: "6 okt, 18:00", state: "todo" },
    ],
  },
  {
    id: "sk-10075",
    number: "SK-10075",
    date: "2026-10-01 09:15",
    seller: "Stomatex",
    status: "jarayonda",
    itemCount: 4,
    total: 6_250_000,
    images: [nsk, tools, tip],
    extra: 3,
    items: [
      item("od-10075-nsk", "NSK nakonechnik", 3_200_000, nsk, 1),
      item("od-10075-box", "Steril quti", 1_000_000, tools, 2),
      item("od-10075-bur", "Bor to‘plami", 1_050_000, tip, 1),
    ],
  },
  {
    id: "sk-10074",
    number: "SK-10074",
    date: "2026-09-28 16:40",
    seller: "Dental Art Lab",
    status: "bekor",
    itemCount: 3,
    total: 12_400_000,
    images: [chair, screen],
    extra: 1,
    items: [
      item("od-10074-chair", "Stomatologik kreslo", 8_000_000, chair, 1),
      item("od-10074-screen", "Monitor", 3_200_000, screen, 1),
      item("od-10074-kit", "O‘rnatish to‘plami", 1_200_000, tools, 1),
    ],
  },
  delivered("sk-10073", "SK-10073", "2026-09-22 10:05", "MedStar Dental", 1_850_000, [filtek, syr], 1, 3),
  delivered("sk-10072", "SK-10072", "2026-09-18 15:40", "StomaHub Market", 2_140_000, [bottle, filtek], 0, 2),
  delivered("sk-10071", "SK-10071", "2026-09-12 09:10", "Dentium Uzbekistan", 4_750_000, [implant, osstem], 2, 4),
  delivered("sk-10070", "SK-10070", "2026-09-04 13:25", "Stomatex", 980_000, [tip, tools], 0, 2),
  delivered("sk-10069", "SK-10069", "2026-08-28 11:00", "Dental Art Lab", 7_300_000, [chair], 1, 2),
  delivered("sk-10068", "SK-10068", "2026-08-19 16:15", "MedStar Dental", 1_260_000, [syr, bottle], 1, 3),
  delivered("sk-10067", "SK-10067", "2026-08-11 08:50", "StomaHub Market", 3_090_000, [filtek, nsk], 0, 2),
  {
    id: "sk-10066",
    number: "SK-10066",
    date: "2026-10-12 18:05",
    seller: "MedStar Dental",
    status: "jarayonda",
    itemCount: 2,
    total: 1_540_000,
    images: [syr, bottle],
    extra: 0,
    items: [
      item("od-10066-syr", "Kompozit shprits", 740_000, syr, 1),
      item("od-10066-bot", "Primer", 800_000, bottle, 1),
    ],
  },
];

function delivered(
  id: string,
  number: string,
  date: string,
  seller: string,
  total: number,
  images: string[],
  extra: number,
  itemCount: number,
): MobileOrder {
  return {
    id,
    number,
    date,
    seller,
    status: "yetkazildi",
    itemCount,
    total,
    images,
    extra,
    items: [item(`${id}-a`, "Mahsulot", total, images[0] ?? filtek, 1)],
  };
}

export function getMobileOrder(id: string) {
  return mobileOrders.find((order) => order.id === id);
}
