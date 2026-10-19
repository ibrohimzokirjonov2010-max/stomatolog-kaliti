/** Design sample labs for the mobile Laboratoriya screen. They are labelled "Namuna" in the UI and cannot be ordered from. */
export type LabTile = "crown" | "veneer" | "implant" | "removable" | "aligner";

export type MobileLabSample = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  place: string;
  city: string;
  daysMin: number;
  daysMax: number;
  top?: boolean;
  cover: string;
  thumbs: string[];
  prices: { title: string; price: number }[];
  tiles: LabTile[];
  rank: number;
};

const img = (name: string) => `/img/mobile/${name}.jpg`;

export const labTiles: { id: "" | LabTile; label: string; image: string }[] = [
  { id: "", label: "Barchasi", image: img("d-lab-t1") },
  { id: "crown", label: "Tojlar (crown)", image: img("d-lab-t2") },
  { id: "veneer", label: "Veneerlar", image: img("d-lab-t3") },
  { id: "implant", label: "Implant ustqurmalari", image: img("d-lab-t4") },
  { id: "removable", label: "Protezlar", image: img("d-lab-t5") },
  { id: "aligner", label: "Elaynerlar", image: img("d-lab-t6") },
];

export const mobileLabSamples: MobileLabSample[] = [
  {
    id: "namuna-dental-art",
    name: "Dental Art Lab",
    rating: 4.9,
    reviews: 128,
    place: "Toshkent, Chilonzor",
    city: "Toshkent",
    daysMin: 3,
    daysMax: 5,
    top: true,
    cover: img("d-lab-1"),
    thumbs: [img("d-lab-1-1"), img("d-lab-1-2"), img("d-lab-1-3")],
    prices: [
      { title: "Tsirkoniy toj", price: 450000 },
      { title: "E-max veneer", price: 550000 },
      { title: "Implant ustqurma", price: 600000 },
    ],
    tiles: ["crown", "veneer", "implant"],
    rank: 1,
  },
  {
    id: "namuna-perfect-smile",
    name: "Perfect Smile Lab",
    rating: 4.8,
    reviews: 96,
    place: "Toshkent, Yunusobod",
    city: "Toshkent",
    daysMin: 2,
    daysMax: 4,
    cover: img("d-lab-2"),
    thumbs: [img("d-lab-2-1"), img("d-lab-2-2"), img("d-lab-2-3")],
    prices: [
      { title: "Metallokeramik toj", price: 320000 },
      { title: "To‘liq protez", price: 1200000 },
      { title: "Elayner (1 jag‘)", price: 1800000 },
    ],
    tiles: ["crown", "removable", "aligner"],
    rank: 2,
  },
  {
    id: "namuna-uzdental",
    name: "UzDental Lab",
    rating: 4.7,
    reviews: 74,
    place: "Toshkent, Yakkasaroy",
    city: "Toshkent",
    daysMin: 3,
    daysMax: 6,
    cover: img("d-lab-3"),
    thumbs: [img("d-lab-3-1"), img("d-lab-3-2"), img("d-lab-3-3")],
    prices: [
      { title: "Implant ustqurma", price: 600000 },
      { title: "Akril protez", price: 850000 },
      { title: "Zirniy/tsirkoniy", price: 480000 },
    ],
    tiles: ["implant", "removable", "crown"],
    rank: 3,
  },
];
