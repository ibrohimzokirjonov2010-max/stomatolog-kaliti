"use client";

import type { ReactNode } from "react";
import { SafeProductImage } from "@/components/safe-product-image";
import type { ProductCategory } from "@/data/products";
import { cn } from "@/lib/utils";

type FrameProps = {
  src: string;
  alt: string;
  category?: ProductCategory;
  className?: string;
  imgClassName?: string;
  children?: ReactNode;
  /** contain = studio product shot; cover = filled portrait crop */
  fit?: "contain" | "cover";
};

/**
 * Shared Uzum-style listing image: portrait 3:4, consistent studio framing.
 * Used by Marketplace ProductCard and Ortiqcha surplus cards.
 */
export function ProductImageFrame({
  src,
  alt,
  category = "materiallar",
  className,
  imgClassName,
  children,
  fit = "cover",
}: FrameProps) {
  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#f7f8fb]",
        className,
      )}
    >
      <SafeProductImage
        src={src}
        alt={alt}
        category={category}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
        className={cn(
          fit === "cover" ? "object-cover object-center" : "object-contain p-3",
          imgClassName,
        )}
      />
      {children}
    </div>
  );
}

/**
 * Pick the framing for a listing image: white-background studio packshots
 * (DentTrade catalogue, seller uploads on white) are shown whole with padding,
 * lifestyle / photographic images fill the portrait frame like Marketplace cards.
 */
export function listingImageFit(src: string | undefined): "contain" | "cover" {
  if (!src) return "contain";
  if (src.startsWith("/images/dentrade/")) return "contain";
  return "cover";
}
