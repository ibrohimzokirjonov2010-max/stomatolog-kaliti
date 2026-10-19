"use client";

export type CrmKind = "patients" | "appointments";

async function send<T>(kind: CrmKind, method: "GET" | "PUT" | "PATCH", body?: unknown): Promise<T[]> {
  const response = await fetch(`/api/crm/${kind}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json().catch(() => null)) as { ok?: boolean; items?: T[]; item?: T } | null;
  if (!response.ok || !data?.ok) return [];
  if (method === "PATCH") return data.item ? [data.item] : [];
  return Array.isArray(data.items) ? data.items : [];
}

export function loadCrm<T>(kind: CrmKind) {
  return send<T>(kind, "GET");
}

export function replaceCrm<T extends { id: string }>(kind: CrmKind, items: T[]) {
  return send<T>(kind, "PUT", { items });
}

export function upsertCrm<T extends { id: string }>(kind: CrmKind, item: T) {
  return send<T>(kind, "PATCH", { item }).then((rows) => rows[0] ?? item);
}

const IMPORT_PATIENTS = "sk-crm-patients-v1";
const IMPORT_APPTS = "sk-crm-appointments-v1";

function readLocal<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Patients the doctor actually added. The bundled p-0001… list has no addedAt and is not imported. */
export function userPatients<T extends { id: string; addedAt?: number }>(rows: T[]) {
  return rows.filter((row) => Boolean(row.addedAt) || !/^p-\d{4}$/.test(row.id));
}

export async function loadPatientsWithImport<T extends { id: string; addedAt?: number }>() {
  const remote = await loadCrm<T>("patients");
  if (window.localStorage.getItem("sk-crm-import-patients")) return remote;
  const local = userPatients(readLocal<T>(IMPORT_PATIENTS));
  window.localStorage.setItem("sk-crm-import-patients", "1");
  if (!local.length || remote.length) {
    window.localStorage.removeItem(IMPORT_PATIENTS);
    return remote;
  }
  const saved = await replaceCrm("patients", local);
  window.localStorage.removeItem(IMPORT_PATIENTS);
  return saved.length ? saved : local;
}

export async function loadAppointmentsWithImport<T extends { id: string }>() {
  const remote = await loadCrm<T>("appointments");
  if (window.localStorage.getItem("sk-crm-import-appts")) return remote;
  const local = readLocal<T>(IMPORT_APPTS).filter((row) => row.id.startsWith("user-"));
  const queue = readLocal<T>("sk-phone14-queue-v2").filter((row) => row.id.startsWith("user-") || row.id.startsWith("q-user"));
  window.localStorage.setItem("sk-crm-import-appts", "1");
  const extras = [...local, ...queue].filter((row, index, all) => all.findIndex((item) => item.id === row.id) === index);
  if (!extras.length || remote.length) return remote;
  const saved = await replaceCrm("appointments", extras);
  return saved.length ? saved : extras;
}
