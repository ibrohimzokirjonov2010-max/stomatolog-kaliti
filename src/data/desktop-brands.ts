export type DeskBrand = {
  slug: string;
  name: string;
  country: string;
  flag: string;
  count: number;
  /** First character used by the A–Z filter. Digits stay on Barchasi. */
  letter: string;
  /** Key in the desktop marketplace catalog, when that brand is stocked. */
  brandKey: string;
};

export const deskBrands: DeskBrand[] = [
  { slug: "3m", name: "3M", country: "AQSH", flag: "🇺🇸", count: 450, letter: "3", brandKey: "3m" },
  { slug: "dentsply-sirona", name: "Dentsply Sirona", country: "Germaniya", flag: "🇩🇪", count: 1240, letter: "D", brandKey: "dentsply" },
  { slug: "ivoclar", name: "Ivoclar", country: "Lixtenshteyn", flag: "🇱🇮", count: 980, letter: "I", brandKey: "ivoclar" },
  { slug: "straumann", name: "Straumann", country: "Shveytsariya", flag: "🇨🇭", count: 860, letter: "S", brandKey: "straumann" },
  { slug: "nobel-biocare", name: "Nobel Biocare", country: "Shveytsariya", flag: "🇨🇭", count: 720, letter: "N", brandKey: "nobel" },
  { slug: "zimmer-biomet", name: "Zimmer Biomet", country: "AQSH", flag: "🇺🇸", count: 680, letter: "Z", brandKey: "zimmer" },
  { slug: "coltene", name: "Coltene", country: "Shveytsariya", flag: "🇨🇭", count: 520, letter: "C", brandKey: "coltene" },
  { slug: "kerr", name: "Kerr", country: "AQSH", flag: "🇺🇸", count: 610, letter: "K", brandKey: "kerr" },
  { slug: "gc", name: "GC", country: "Yaponiya", flag: "🇯🇵", count: 590, letter: "G", brandKey: "gc" },
  { slug: "tokuyama", name: "Tokuyama", country: "Yaponiya", flag: "🇯🇵", count: 430, letter: "T", brandKey: "tokuyama" },
  { slug: "fanta-dental", name: "Fanta Dental", country: "Italiya", flag: "🇮🇹", count: 380, letter: "F", brandKey: "fanta" },
  { slug: "ultradent", name: "Ultradent", country: "AQSH", flag: "🇺🇸", count: 550, letter: "U", brandKey: "ultradent" },
  { slug: "mectron", name: "Mectron", country: "Italiya", flag: "🇮🇹", count: 320, letter: "M", brandKey: "mectron" },
  { slug: "nsk", name: "NSK", country: "Yaponiya", flag: "🇯🇵", count: 790, letter: "N", brandKey: "nsk" },
  { slug: "wh", name: "W&H", country: "Avstriya", flag: "🇦🇹", count: 410, letter: "W", brandKey: "wh" },
  { slug: "vatech", name: "Vatech", country: "Janubiy Koreya", flag: "🇰🇷", count: 360, letter: "V", brandKey: "vatech" },
  { slug: "planmeca", name: "Planmeca", country: "Finlyandiya", flag: "🇫🇮", count: 280, letter: "P", brandKey: "planmeca" },
  { slug: "osstem", name: "Osstem", country: "Janubiy Koreya", flag: "🇰🇷", count: 690, letter: "O", brandKey: "osstem" },
  { slug: "mindray", name: "Mindray", country: "Xitoy", flag: "🇨🇳", count: 240, letter: "M", brandKey: "mindray" },
  { slug: "angelus", name: "Angelus", country: "Braziliya", flag: "🇧🇷", count: 310, letter: "A", brandKey: "angelus" },
];

export const brandLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const countryOrder = ["AQSH", "Avstriya", "Braziliya", "Finlyandiya", "Germaniya", "Italiya", "Janubiy Koreya", "Lixtenshteyn", "Shveytsariya", "Xitoy", "Yaponiya"];

export function brandCountries() {
  const present = new Set(deskBrands.map((item) => item.country));
  return countryOrder.filter((country) => present.has(country));
}

export function getDeskBrand(slug: string) {
  return deskBrands.find((item) => item.slug === slug) ?? null;
}

export function filterDeskBrands(list: DeskBrand[], opts: { q: string; country: string; letter: string }) {
  const q = opts.q.trim().toLowerCase();
  return list.filter((item) => {
    if (q && !item.name.toLowerCase().includes(q)) return false;
    if (opts.country && item.country !== opts.country) return false;
    if (opts.letter && item.letter !== opts.letter) return false;
    return true;
  });
}
