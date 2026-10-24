export type ChannelCategory =
  | "implantologiya"
  | "endodontiya"
  | "ortodontiya"
  | "marketing"
  | "talim"
  | "jihozlar"
  | "umumiy";

export type Channel = {
  id: string;
  username: string;
  name: string;
  category: ChannelCategory;
  /** Joriy auksion taklifi (so‘m). Kim ko‘proq to‘lasa — shu yuqorida. */
  bidSum: number;
  avatarColor: string;
  mine?: boolean;
  createdAt: string;
};

export const MIN_CHANNEL_BID = 1000;

export const channelCategories: { id: ChannelCategory; label: string }[] = [
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "marketing", label: "Marketing" },
  { id: "talim", label: "Ta’lim" },
  { id: "jihozlar", label: "Jihozlar" },
  { id: "umumiy", label: "Umumiy" },
];

export const channelCategoryLabel = Object.fromEntries(
  channelCategories.map((c) => [c.id, c.label])
) as Record<ChannelCategory, string>;

export const seedChannels: Channel[] = [
  {
    id: "ch-implant-clinic",
    username: "@implant_clinic",
    name: "Implant Klinikasi",
    category: "implantologiya",
    bidSum: 10000,
    avatarColor: "#0F766E",
    createdAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "ch-endo-pro",
    username: "@endo_pro_uz",
    name: "Endo Pro",
    category: "endodontiya",
    bidSum: 5000,
    avatarColor: "#0F766E",
    createdAt: "2026-01-12T10:00:00.000Z",
  },
  {
    id: "ch-stom-edu",
    username: "@stom_edu",
    name: "Stomatolog Ta’lim",
    category: "talim",
    bidSum: 3000,
    avatarColor: "#7c3aed",
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "ch-dental-tools",
    username: "@dental_tools_uz",
    name: "Dental Tools",
    category: "jihozlar",
    bidSum: 1500,
    avatarColor: "#ea580c",
    createdAt: "2026-02-01T10:00:00.000Z",
  },
  {
    id: "ch-clinic-market",
    username: "@clinic_market",
    name: "Klinika Marketing",
    category: "marketing",
    bidSum: 1200,
    avatarColor: "#db2777",
    createdAt: "2026-02-10T10:00:00.000Z",
  },
  {
    id: "ch-stom-uz",
    username: "@StomatologUz",
    name: "Stomatolog Uz",
    category: "umumiy",
    bidSum: 800,
    avatarColor: "#0F766E",
    createdAt: "2026-02-20T10:00:00.000Z",
  },
  {
    id: "ch-tish-salomat",
    username: "@TishSalomatligi",
    name: "Tish Salomatligi",
    category: "umumiy",
    bidSum: 500,
    avatarColor: "#059669",
    createdAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "ch-implant-tips",
    username: "@implant_tips",
    name: "Implant Tips",
    category: "implantologiya",
    bidSum: 0,
    avatarColor: "#0F766E",
    createdAt: "2026-03-05T10:00:00.000Z",
  },
];
