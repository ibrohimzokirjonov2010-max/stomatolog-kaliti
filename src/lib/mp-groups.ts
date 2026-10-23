/** Marketplace groups shown as chips. Counts always come from catalog rows. */

export type MpGroupId =
  | "kompozitlar"
  | "bondlar"
  | "endodontiya"
  | "implantlar"
  | "uchliklar"
  | "asboblar"
  | "uskunalar"
  | "gigiyena"
  | "laboratoriya"
  | "materiallar";

export const MP_GROUPS: { id: MpGroupId; label: string }[] = [
  { id: "kompozitlar", label: "Kompozitlar" },
  { id: "bondlar", label: "Bondlar" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "implantlar", label: "Implantlar" },
  { id: "uchliklar", label: "Uchliklar" },
  { id: "asboblar", label: "Asboblar" },
  { id: "uskunalar", label: "Uskunalar" },
  { id: "gigiyena", label: "Gigiyena" },
  { id: "laboratoriya", label: "Laboratoriya" },
  { id: "materiallar", label: "Materiallar" },
];

const ALIAS: Record<string, MpGroupId> = {
  kompozit: "kompozitlar",
  kompozitlar: "kompozitlar",
  bond: "bondlar",
  bondlar: "bondlar",
  endodontiya: "endodontiya",
  endo: "endodontiya",
  implant: "implantlar",
  implantlar: "implantlar",
  uchlik: "uchliklar",
  uchliklar: "uchliklar",
  asbob: "asboblar",
  asboblar: "asboblar",
  uskuna: "uskunalar",
  uskunalar: "uskunalar",
  jihoz: "uskunalar",
  jihozlar: "uskunalar",
  gigiyena: "gigiyena",
  forma: "gigiyena",
  laboratoriya: "laboratoriya",
  material: "materiallar",
  materiallar: "materiallar",
};

const TESTS: { id: MpGroupId; re: RegExp }[] = [
  { id: "bondlar", re: /bond|adeziv|adheziv|adhesive/i },
  { id: "endodontiya", re: /endo|protaper|gutta|apex|kanal fayl/i },
  { id: "uchliklar", re: /uchlik|turbin|handpiece|nakonechnik/i },
  { id: "implantlar", re: /implant|straumann|abutment/i },
  { id: "gigiyena", re: /gigiyen|profilakt|parvarish/i },
  { id: "uskunalar", re: /avtoklav|skaler|fotopolimer|mikroskop|uskuna/i },
  { id: "kompozitlar", re: /kompozit|filtek|bulk fill|flowable/i },
  { id: "asboblar", re: /asbob|kuret|forceps|elevat|zerkalo/i },
];

export function marketGroupId(item: { name: string; brand: string; category: string; subcategory?: string }): string {
  const sub = (item.subcategory || "").trim().toLowerCase();
  if (sub && ALIAS[sub]) return ALIAS[sub];
  const blob = `${item.name} ${item.brand} ${sub}`;
  for (const test of TESTS) {
    if (test.re.test(blob)) return test.id;
  }
  const cat = item.category.trim().toLowerCase();
  if (ALIAS[cat]) return ALIAS[cat];
  return cat || "boshqa";
}

export function marketGroupLabel(id: string) {
  return MP_GROUPS.find((group) => group.id === id)?.label ?? (id === "boshqa" ? "Boshqa" : id);
}

export function isKnownGroup(id: string) {
  return id === "all" || Boolean(ALIAS[id]) || MP_GROUPS.some((group) => group.id === id);
}
