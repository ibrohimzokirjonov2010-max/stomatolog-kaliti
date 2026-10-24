export type SaleCategory =
  | "terapiya"
  | "implantologiya"
  | "endodontiya"
  | "ortodontiya"
  | "jarrohlik"
  | "uskunalar"
  | "asboblar"
  | "gigiyena"
  | "materiallar";

export type SaleSort = "mashhurlik" | "chegirma" | "arzon" | "qimmat";

export type SaleProduct = {
  id: string;
  name: string;
  brand: string;
  category: SaleCategory;
  price: number;
  oldPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  sold: number;
  /** Higher stays first on Mashhurlik, matching the design order. */
  popularity: number;
  /** Seconds remaining when the page opens. */
  seconds: number;
  image: string;
};

export const saleCategories: { id: SaleCategory; label: string }[] = [
  { id: "terapiya", label: "Terapiya" },
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "jarrohlik", label: "Jarrohlik" },
  { id: "uskunalar", label: "Uskunalar" },
  { id: "asboblar", label: "Asboblar" },
  { id: "gigiyena", label: "Gigiyena" },
  { id: "materiallar", label: "Materiallar" },
];

const day = 86400;

export const saleProducts: SaleProduct[] = [
  { id: "sale-filtek", name: "Filtek Universal Composite", brand: "3M", category: "terapiya", price: 350_000, oldPrice: 500_000, discount: 30, rating: 0, reviews: 0, sold: 0, popularity: 80, seconds: 2 * day + 12 * 3600 + 30 * 60 + 15, image: "/img/design-pr13/sales/sale-filtek.png" },
  { id: "sale-implant", name: "Implant tizimi", brand: "Straumann", category: "implantologiya", price: 2_250_000, oldPrice: 3_000_000, discount: 25, rating: 0, reviews: 0, sold: 0, popularity: 79, seconds: 5 * day + 8 * 3600 + 15 * 60 + 42, image: "/img/design-pr13/sales/sale-implant.png" },
  { id: "sale-endo", name: "Endo fayllar to‘plami", brand: "Dentsply Sirona", category: "endodontiya", price: 480_000, oldPrice: 600_000, discount: 20, rating: 0, reviews: 0, sold: 0, popularity: 78, seconds: 1 * day + 18 * 3600 + 45 * 60 + 20, image: "/img/design-pr13/sales/sale-endo.png" },
  { id: "sale-lamp", name: "LED fotopolimer lampa", brand: "Woodpecker", category: "uskunalar", price: 1_300_000, oldPrice: 2_000_000, discount: 35, rating: 0, reviews: 0, sold: 0, popularity: 77, seconds: 3 * day + 21 * 3600 + 10 * 60 + 33, image: "/img/design-pr13/sales/sale-lamp.png" },
  { id: "sale-unit", name: "Stomatologik unit", brand: "Cingol", category: "uskunalar", price: 21_500_000, oldPrice: 30_000_000, discount: 28, rating: 0, reviews: 0, sold: 0, popularity: 76, seconds: 6 * day + 14 * 3600 + 22 * 60 + 10, image: "/img/design-pr13/sales/sale-unit.png" },
  { id: "sale-silikon", name: "A-silikon otpechatka materiali", brand: "Zhermack", category: "materiallar", price: 1_020_000, oldPrice: 1_200_000, discount: 15, rating: 0, reviews: 0, sold: 0, popularity: 75, seconds: 4 * day + 9 * 3600 + 17 * 60 + 55, image: "/img/design-pr13/sales/sale-silikon.png" },
  { id: "sale-skaler", name: "Ultratovushli skaler", brand: "Woodpecker", category: "asboblar", price: 1_080_000, oldPrice: 1_800_000, discount: 40, rating: 0, reviews: 0, sold: 0, popularity: 74, seconds: 2 * day + 16 * 3600 + 5 * 60 + 18, image: "/img/design-pr13/sales/sale-skaler.png" },
  { id: "sale-breket", name: "Ortodontik breketlar", brand: "Ormco", category: "ortodontiya", price: 980_000, oldPrice: 1_250_000, discount: 22, rating: 0, reviews: 0, sold: 0, popularity: 73, seconds: 7 * day + 11 * 3600 + 33 * 60 + 29, image: "/img/design-pr13/sales/sale-breket.png" },
];

export function filterSales(list: SaleProduct[], opts: { q: string; category: SaleCategory | "" }) {
  const q = opts.q.trim().toLowerCase();
  return list.filter((item) => {
    if (opts.category && item.category !== opts.category) return false;
    if (q && !`${item.name} ${item.brand}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function sortSales(list: SaleProduct[], sort: SaleSort) {
  const rows = [...list];
  if (sort === "chegirma") rows.sort((a, b) => b.discount - a.discount || b.popularity - a.popularity);
  else if (sort === "arzon") rows.sort((a, b) => a.price - b.price);
  else if (sort === "qimmat") rows.sort((a, b) => b.price - a.price);
  else rows.sort((a, b) => b.popularity - a.popularity);
  return rows;
}

export function formatCountdown(total: number) {
  const safe = Math.max(0, total);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${days} kun ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
