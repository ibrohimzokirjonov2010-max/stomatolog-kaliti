import "server-only";

/**
 * Server-only Supabase access.
 * Tables have RLS with no policies; every read/write goes through SECURITY DEFINER
 * RPCs that require STOMAHUB_DB_SECRET (never sent to the browser).
 */
export class DbError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

type SupabaseConfig = { url: string; key: string; secret: string };

/** One config object for the life of the isolate. rpc() does not build a new client per request. */
let cached: SupabaseConfig | null = null;

function supabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "") ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const secret = process.env.STOMAHUB_DB_SECRET?.trim() ?? "";
  if (!cached || cached.url !== url || cached.key !== key || cached.secret !== secret) {
    cached = { url, key, secret };
  }
  return cached;
}

export function supabaseUrl() {
  const { url } = supabaseConfig();
  if (!url) throw new DbError("Supabase sozlanmagan.");
  return url;
}

export function supabaseAnonKey() {
  const { key } = supabaseConfig();
  if (!key) throw new DbError("Supabase sozlanmagan.");
  return key;
}

/** Public catalogs may be cached briefly. Anything tied to a session stays private. */
export function readCache(personalized: boolean) {
  return {
    "Cache-Control": personalized ? "private, no-store" : "public, s-maxage=15, stale-while-revalidate=60",
  };
}

export function privateCache() {
  return { "Cache-Control": "private, no-store" };
}

export const COMMUNITY_BUCKET = "community";

export function publicObjectUrl(path: string) {
  return `${supabaseUrl()}/storage/v1/object/public/${COMMUNITY_BUCKET}/${path}`;
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { url, key, secret } = supabaseConfig();
  if (!secret || !url || !key) throw new DbError("Server sozlanmagan.");
  const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_secret: secret, ...args }),
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) {
    let message = "Ma’lumotlar bazasi xatosi.";
    let parsed: { message?: string; code?: string } = {};
    try {
      parsed = JSON.parse(text) as { message?: string; code?: string };
    } catch {
      console.error(`[rpc ${fn}]`, response.status, text.slice(0, 200));
    }
    if (parsed.code === "23503") message = "Topilmadi.";
    else if (parsed.code === "23505") message = "Allaqachon mavjud.";
    else if (parsed.code === "42501" && parsed.message === "blocked") {
      console.error(`[rpc ${fn}] blocked user`);
      throw new DbError("Akkauntingiz bloklangan.", 403);
    } else if (parsed.code === "P0001") {
      const known: Record<string, string> = {
        product_unavailable: "Mahsulot hozir sotuvda emas.",
        store_closed: "Do‘kon vaqtincha yopilgan. Keyinroq urinib ko‘ring.",
        min_order: "Buyurtma summasi do‘konning minimal summasidan kam.",
        out_of_stock: "Omborda yetarli mahsulot yo‘q.",
        own_product: "O‘z do‘koningiz mahsulotini sotib ololmaysiz.",
        not_releasable: "Buyurtma holati bu amalga mos emas.",
        not_refundable: "Buyurtma holati bu amalga mos emas.",
        bonus_min_order: "Bonus faqat Marketplace mahsulotlari (materiallar, implantlar, asboblar) uchun ishlatiladi.",
        bonus_empty: "Bonus balansingiz bo‘sh yoki muddati tugagan.",
        otp_invalid: "Kod eskirgan. Yangi kod so‘rang.",
        sem_invalid: "Ism va telefon majburiy (kamida 9 raqam).",
        sem_closed: "Bu seminar o‘tib ketgan — yozilish yopiq.",
        sem_duplicate: "Allaqachon yozilgansiz.",
        sem_full: "Joy qolmadi.",
        sem_notfound: "Topilmadi.",
        sem_retry: "Qayta urinib ko‘ring.",
        sem_not_organizer: "Seminar yaratish uchun avval tashkilotchi arizangiz tasdiqlanishi kerak.",
        val_invalid: "Maydonlarni to‘g‘ri to‘ldiring.",
        req_notfound: "Topilmadi yoki endi mavjud emas.",
        req_self: "O‘zingizning e’loningizga so‘rov yubora olmaysiz.",
        req_duplicate: "Bu so‘rov allaqachon yuborilgan — javobni kuting.",
        req_rate: "Juda ko‘p so‘rov yuborildi. Bir ozdan keyin urinib ko‘ring.",
        req_state: "Holat bu amalga mos emas yoki allaqachon o‘zgargan.",
        lim_reached: "Limitga yetdingiz. Avvalgi e’lonlarni yoping yoki o‘chiring, yoki keyinroq urinib ko‘ring.",
        listing_duplicate: "Bunday e’lon allaqachon bor. Avvalgisini tahrirlang yoki yoping.",
        clinic_none: "Avval klinika ma’lumotlarini saqlang.",
        sem_seats_low: "O‘rinlar soni allaqachon yozilganlar sonidan kam bo‘lishi mumkin emas.",
      };
      console.error(`[rpc ${fn}]`, parsed.message);
      throw new DbError(known[parsed.message ?? ""] ?? message, 400);
    }
    if (parsed.code) console.error(`[rpc ${fn}]`, parsed.code, parsed.message);
    throw new DbError(message, response.status >= 500 ? 502 : 400);
  }
  return (text ? JSON.parse(text) : null) as T;
}

/** Maps a thrown DbError to a JSON response (keeps specific user-facing messages like "blocked"). */
export function dbErrorJson(error: unknown, fallback: string) {
  const known = error instanceof DbError && (error.status === 403 || error.status === 400);
  return Response.json(
    { ok: false, error: known ? error.message : fallback },
    { status: known ? error.status : 502 },
  );
}
