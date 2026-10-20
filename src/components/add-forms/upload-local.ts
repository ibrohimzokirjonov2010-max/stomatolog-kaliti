"use client";

import { prepareImage, uploadImage } from "@/lib/image-upload";
import type { LocalPhoto } from "@/components/add-forms/widgets";

export async function resolvePhotos(photos: LocalPhoto[], purpose: "listing" | "logo" | "lab" | "job") {
  const urls: string[] = [];
  for (const photo of photos) {
    if (photo.file) {
      const prepared = await prepareImage(photo.file);
      urls.push(await uploadImage(prepared.blob, purpose));
    } else if (photo.url) urls.push(photo.url);
  }
  return urls;
}

export function photosFromUrls(urls: string[]): LocalPhoto[] {
  return urls.filter(Boolean).map((url, index) => ({ key: `saved-${index}-${url.slice(-12)}`, name: "photo", url, preview: url }));
}
