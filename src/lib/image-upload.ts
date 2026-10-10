"use client";

export type PreparedImage = {
  id: string;
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
};

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall back to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Resize to fit `maxSide` and re-encode as JPEG (strips EXIF/GPS metadata too). */
export async function prepareImage(file: File, maxSide = 1600, quality = 0.82): Promise<PreparedImage> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error("Faqat rasm fayllarini tanlang.");
  }
  if (file.size > 25 * 1024 * 1024) throw new Error("Rasm juda katta (25 MB dan oshmasin).");
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    throw new Error("Rasmni o‘qib bo‘lmadi. JPG yoki PNG tanlang.");
  }
  const w0 = "naturalWidth" in source ? source.naturalWidth : source.width;
  const h0 = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  const width = Math.max(1, Math.round(w0 * scale));
  const height = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Rasmni tayyorlab bo‘lmadi.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  if ("close" in source) source.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Rasmni tayyorlab bo‘lmadi.");
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    blob,
    previewUrl: URL.createObjectURL(blob),
    width,
    height,
  };
}

/** Ask the server for a one-time upload ticket, then upload straight to Supabase Storage. */
export async function uploadImage(blob: Blob, purpose: "post" | "avatar" | "product" | "logo" | "seminar" | "listing" | "request" | "job" | "lab"): Promise<string> {
  return uploadWithTicket("/api/uploads", { purpose }, blob);
}

/** Generic: POST {..extra, contentType} to `endpoint` for a ticket, then upload the blob to the returned URL. */
export async function uploadWithTicket(endpoint: string, extra: Record<string, unknown>, blob: Blob): Promise<string> {
  const ticketRes = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...extra, contentType: blob.type || "image/jpeg" }),
  });
  const ticket = (await ticketRes.json().catch(() => null)) as
    | { ok?: boolean; uploadUrl?: string; publicUrl?: string; path?: string; error?: string }
    | null;
  if (!ticketRes.ok || !ticket?.ok || !ticket.uploadUrl) {
    throw new Error(ticket?.error ?? "Yuklashni boshlab bo‘lmadi.");
  }
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const put = await fetch(ticket.uploadUrl, {
    method: "POST",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      "Content-Type": blob.type || "image/jpeg",
      "Cache-Control": "max-age=31536000",
    },
    body: blob,
  });
  if (!put.ok) throw new Error("Fayl yuklanmadi. Internetni tekshirib, qayta urinib ko‘ring.");
  return ticket.publicUrl ?? ticket.path ?? "";
}
