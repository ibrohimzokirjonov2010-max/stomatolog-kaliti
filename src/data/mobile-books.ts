export type BookFormat = "bosma" | "pdf";
export type BookTopic = "endodontiya" | "implantologiya" | "ortodontiya" | "jarrohlik" | "estetika";
export type BookSort = "mashhur" | "yangi" | "narx";

export type MobileBook = {
  id: string;
  title: string;
  author: string;
  topic: BookTopic;
  format: BookFormat;
  rating: number;
  reviews: number;
  price: number;
  image: string;
  fresh: boolean;
};

export const bookTopics: { id: "all" | BookTopic; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "implantologiya", label: "Implantologiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "jarrohlik", label: "Jarrohlik" },
];

export const bookSorts: { id: BookSort; label: string }[] = [
  { id: "mashhur", label: "Mashhurlari" },
  { id: "yangi", label: "Yangilari" },
  { id: "narx", label: "Narx" },
];

export const mobileBooks: MobileBook[] = [
  {
    id: "kb-misch",
    title: "Contemporary Implant Dentistry",
    author: "Carl E. Misch",
    topic: "implantologiya",
    format: "bosma",
    rating: 4.9,
    reviews: 128,
    price: 350_000,
    image: "/img/mobile/kb-implant.jpg",
    fresh: true,
  },
  {
    id: "kb-pulp",
    title: "Pathways of the Pulp",
    author: "Hargreaves, Cohen",
    topic: "endodontiya",
    format: "bosma",
    rating: 4.8,
    reviews: 96,
    price: 289_000,
    image: "/img/mobile/kb-pulp.jpg",
    fresh: true,
  },
  {
    id: "kb-magne",
    title: "Esthetic Restorative Dentistry",
    author: "Pascal Magne",
    topic: "estetika",
    format: "pdf",
    rating: 4.9,
    reviews: 74,
    price: 79_000,
    image: "/img/mobile/kb-esthetic.jpg",
    fresh: true,
  },
  {
    id: "kb-lindhe",
    title: "Clinical Periodontology and Implant Dentistry",
    author: "Lindhe, Lang, Karring",
    topic: "jarrohlik",
    format: "bosma",
    rating: 4.8,
    reviews: 52,
    price: 320_000,
    image: "/img/mobile/kb-perio.jpg",
    fresh: true,
  },
];
