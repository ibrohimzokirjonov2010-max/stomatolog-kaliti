/**
 * Public "Mutaxassislar" list hygiene: drop QA / automation accounts, keep doctors only
 * (ustalar have their own section), merge duplicates and normalize city names.
 */
type Row = Record<string, unknown>;

const TEST_NAME = /\b(e2e|test|audit|qa|demo)\b/i;
const NOT_A_DOCTOR = /usta|muhandis|texnik|uskuna|kompressor|avtoklav|ta['ʼ‘’]?mir|servis|сервис|ремонт|инженер|мастер/i;
const COMPANY = /^(ооо|оао|ип|mchj|xk|ooo|llc)\b|\b(ооо|mchj|llc)\b/i;

export function normalizeCity(city: string) {
  return city
    .replace(/\s+(shahri|sh\.?|shahar|viloyati|vil\.?|tumani)$/i, "")
    .replace(/^g\.\s*/i, "")
    .replace(/^Ташкент$/i, "Toshkent")
    .trim();
}

export function cleanSpecialists(rows: Row[]): Row[] {
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const row of rows) {
    const name = String(row.name ?? "").trim();
    const specialty = String(row.specialty ?? "");
    if (!name || TEST_NAME.test(name) || TEST_NAME.test(String(row.clinic ?? ""))) continue;
    if (row.kind !== "doctor") continue;
    if (NOT_A_DOCTOR.test(specialty) || COMPANY.test(name)) continue;
    const key = name.toLowerCase().replace(/^dr\.?\s*/, "").replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...row, name, city: normalizeCity(String(row.city ?? "")) });
  }
  return out;
}
