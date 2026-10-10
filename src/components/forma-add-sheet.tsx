"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, X } from "lucide-react";
import { SizeColorPickers } from "@/components/apparel-pickers";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import {
  apparelReady,
  defaultApparelColor,
  defaultApparelSize,
} from "@/data/forma";
import { getProductDetails } from "@/data/product-details";
import type { Product } from "@/data/products";

export function FormaAddSheet({
  product,
  presetSize,
  presetColor,
  onClose,
}: {
  product: Product;
  presetSize?: string;
  presetColor?: string;
  onClose: () => void;
}) {
  const { add } = useCart();
  const details = getProductDetails(product);
  const [size, setSize] = useState(defaultApparelSize(product, presetSize));
  const [color, setColor] = useState(defaultApparelColor(product, presetColor));
  const [error, setError] = useState("");
  const ready = apparelReady(product, size, color);
  const stock = product.inStock
    ? details.stockQty >= 20
      ? "Omborda 20+ dona (namuna)"
      : `Omborda ${details.stockQty} dona (namuna)`
    : "Buyurtma asosida";

  function submit() {
    if (!ready) {
      setError("Savatga qo‘shishdan oldin o‘lcham va rangni tanlang.");
      return;
    }
    add(product.id, undefined, 1, { size: size || undefined, color: color || undefined });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Yopish" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 shadow-2xl lg:inset-auto lg:top-1/2 lg:left-1/2 lg:w-[min(100%-2rem,420px)] lg:max-h-[85vh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:px-5 lg:pt-5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6eaf2] lg:hidden" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <Image
              src={product.image}
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-xl bg-[#f7f9fc] object-contain p-1"
            />
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[#1a1d26]">{product.name}</p>
              <p className="text-[12px] text-[#8b93a7]">{product.brand}</p>
              <p className="mt-1 text-[12px] text-[#16a34a]">{stock}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-[#8b93a7] hover:bg-slate-50"
            aria-label="Yopish"
          >
            <X className="size-4" />
          </button>
        </div>
        <SizeColorPickers product={product} size={size} color={color} onSize={setSize} onColor={setColor} />
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        <Button type="button" className="mt-4 h-12 w-full !rounded-2xl" onClick={submit}>
          <ShoppingCart className="size-4" />
          Savatga
        </Button>
      </div>
    </div>
  );
}
