const STORAGE_PREFIX = /^(products|avatars|logos|seminars|listings|posts|jobs|labs|requests)\//i;

function supabaseBase() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
}

/** Turn a stored product photo into a URL a browser can load. */
export function resolveStoredImage(src: unknown): string {
  if (typeof src !== "string") return "";
  const value = src.trim();
  if (!value || value.startsWith("blob:") || value.startsWith("data:")) return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  const base = supabaseBase();
  if (/^https?:\/\//i.test(value)) {
    if (base && value.startsWith(`${base}/storage/v1/object/`) && !value.includes("/storage/v1/object/public/")) {
      return value.replace("/storage/v1/object/", "/storage/v1/object/public/");
    }
    return value;
  }
  if (base && STORAGE_PREFIX.test(value)) {
    return `${base}/storage/v1/object/public/community/${value.replace(/^\/+/, "")}`;
  }
  return "";
}

/** Fill a blank cover from the gallery and expand storage paths to public URLs. */
export function publicizeProduct<T extends Record<string, unknown>>(row: T): T {
  const images = Array.isArray(row.images) ? row.images.map(resolveStoredImage).filter(Boolean) : [];
  let image = resolveStoredImage(row.image);
  if (!image && images[0]) image = images[0];
  return { ...row, image, images: images.filter((item) => item !== image) };
}
