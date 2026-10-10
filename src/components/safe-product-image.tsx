"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { placeholderProductImage } from "@/data/shops";
import type { ProductCategory } from "@/data/products";

function isRemote(src: string) {
  return src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:");
}

type Props = Omit<ImageProps, "src" | "alt" | "onError"> & {
  src: string;
  alt: string;
  category?: ProductCategory;
  fallbackSrc?: string;
};

/** next/image with remote unoptimized + dead-URL fallback so cards never show bare alt text. */
export function SafeProductImage({
  src,
  alt,
  category = "materiallar",
  fallbackSrc,
  className,
  ...rest
}: Props) {
  const fallback = fallbackSrc ?? placeholderProductImage(category);
  // Remember which src failed (not a copy of src) so a new src prop — e.g. switching gallery photos — always renders.
  const [failed, setFailed] = useState<string | null>(null);
  const current = src && failed !== src ? src : fallback;
  const remote = isRemote(current);

  return (
    <Image
      {...rest}
      src={current}
      alt={alt}
      className={className}
      unoptimized={remote || current.startsWith("data:")}
      onError={() => {
        if (current !== fallback) setFailed(src);
      }}
    />
  );
}
