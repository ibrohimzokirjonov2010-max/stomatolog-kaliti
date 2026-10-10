/** Small fetch helper for the DB-backed sections. Returns Uzbek errors from the server (never throws). */
export type ApiFail = { ok: false; error: string; errors?: Record<string, string>; status: number };
export type ApiOk<T> = { ok: true; data: T };

export async function api<T = Record<string, unknown>>(url: string, init?: { method?: string; body?: unknown }): Promise<ApiOk<T> | ApiFail> {
  try {
    const res = await fetch(url, {
      method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
      credentials: "same-origin",
      cache: "no-store",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const json = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; error?: string; errors?: Record<string, string> }) | null;
    if (res.ok && json?.ok !== false) return { ok: true, data: (json ?? {}) as T };
    return {
      ok: false,
      status: res.status,
      error: res.status === 401 ? "Avval tizimga kiring." : (json?.error ?? "Amalni bajarib bo‘lmadi. Qayta urinib ko‘ring."),
      errors: json?.errors,
    };
  } catch {
    return { ok: false, status: 0, error: "Aloqa xatosi. Internetni tekshirib qayta urinib ko‘ring." };
  }
}

export function timeAgoUz(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "hozirgina";
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  return `${d} kun oldin`;
}
