"use client";

import { clothingSizes, colorLabel, formaColors } from "@/data/forma";
import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";

export function SizeColorPickers({
  product,
  size,
  color,
  onSize,
  onColor,
}: {
  product: Product;
  size: string;
  color: string;
  onSize: (value: string) => void;
  onColor: (value: string) => void;
}) {
  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];
  if (!sizes.length && !colors.length) return null;

  return (
    <div className="space-y-3">
      {sizes.length ? (
        <div>
          <p className="text-[12px] font-medium text-[#8b93a7]">O‘lcham</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {sizes.map((item) => {
              const on = size === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onSize(item)}
                  className={cn(
                    "min-w-9 rounded-full px-2.5 py-1.5 text-[13px] font-semibold",
                    on ? "bg-[#0F766E] text-white" : "border border-[#e6eaf2] bg-white text-[#4b5568]",
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
          {sizes.some((item) => clothingSizes.includes(item as (typeof clothingSizes)[number])) ? (
            <p className="mt-1 text-[11px] text-[#8b93a7]">S–XXL. Aniq o‘lchamni tanlang.</p>
          ) : null}
        </div>
      ) : null}
      {colors.length ? (
        <div>
          <p className="text-[12px] font-medium text-[#8b93a7]">Rang</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {colors.map((id) => {
              const swatch = formaColors.find((item) => item.id === id);
              const on = color === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onColor(id)}
                  title={colorLabel(id)}
                  aria-label={colorLabel(id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2 py-1 text-[12px] font-medium",
                    on ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]" : "border-[#e6eaf2] text-[#4b5568]",
                  )}
                >
                  <span
                    className={cn(
                      "size-4 rounded-full border",
                      id === "white" ? "border-slate-300" : "border-transparent",
                    )}
                    style={{ backgroundColor: swatch?.hex ?? "#cbd5e1" }}
                  />
                  {colorLabel(id)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
