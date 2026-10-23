"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/components/cart-provider";
import { apparelMetaLabel } from "@/data/forma";
import { surplusCartMeta } from "@/data/surplus";
import { site } from "@/data/site";
import { productShop } from "@/data/shops";
import { formatMoney } from "@/lib/format";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { shopDeliveryFee } from "@/lib/cart-totals";
import { createOrder, paymentMethods, type PaymentMethod } from "@/lib/orders";
import { BonusUseCard, useBonusUse } from "@/components/bonus/bonus";
import { cn } from "@/lib/utils";

export function CheckoutForm() {
  const router = useRouter();
  const {
    selectedItems: items,
    selectedSubtotal: subtotal,
    selectedCount: count,
    clearSelected: clear,
  } = useCart();
  const { ready: profileReady, profile } = useDoctorProfile();
  const bonus = useBonusUse(items.map((i) => ({ productId: i.product.id, qty: i.qty })));
  const profilePhone = profile?.phone && /^\d{9}$/.test(profile.phone)
    ? `+998 ${profile.phone.slice(0, 2)} ${profile.phone.slice(2, 5)} ${profile.phone.slice(5, 7)} ${profile.phone.slice(7)}`
    : "";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    phone: string;
    city: string;
    address: string;
    note: string;
    payment: PaymentMethod;
  }>({
    name: "",
    phone: "",
    city: site.city,
    address: "",
    note: "",
    payment: "naqd",
  });

  const delivery = shopDeliveryFee(items.map((item) => item.product));
  const payable = Math.max(0, subtotal + delivery - bonus.applied);
  const empty = count === 0;
  const payHint = useMemo(
    () => paymentMethods.find((item) => item.id === form.payment)?.hint ?? "",
    [form.payment]
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (empty) {
      setError("Savat bo‘sh.");
      return;
    }
    if (!profile) {
      setError("Buyurtma berish uchun avval tizimga kiring.");
      router.push("/kirish?next=/checkout");
      return;
    }
    const name = form.name.trim() || profile.fullName;
    const phone = form.phone.trim() || profilePhone;
    if (!name || !phone || !form.address.trim()) {
      setError("Ism, telefon va manzil majburiy.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await createOrder({
      name,
      phone,
      city: form.city,
      address: form.address.trim(),
      note: form.note.trim(),
      payment: form.payment,
      useBonus: bonus.enabled,
      items: items.map(({ product, qty, size, color, source, expiryMonths }) => ({
        productId: product.id,
        qty,
        size,
        color,
        source,
        expiryMonths,
      })),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.reason);
      return;
    }
    clear();
    router.push(`/buyurtma/tasdiq?id=${encodeURIComponent(res.order.id)}`);
  }

  if (empty) {
    return (
      <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1a1d26]">Savatda mahsulot yo‘q</p>
        <p className="mt-1 text-sm text-[#8b93a7]">Avval mahsulot qo‘shing, keyin buyurtma bering.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/marketplace" className={cn(buttonVariants(), "h-10 !rounded-xl")}>
            Marketplace
          </Link>
          <Link href="/forma" className={cn(buttonVariants({ variant: "outline" }), "h-10 !rounded-xl")}>
            Forma
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]" onSubmit={submit}>
      <div className="space-y-4 rounded-[16px] border border-[#eceff5] bg-white p-5">
        <h2 className="text-[16px] font-semibold text-[#1a1d26]">Yetkazib berish</h2>
        {profileReady && !profile ? (
          <p className="rounded-xl bg-[#fff7ed] px-3 py-2 text-[13px] text-[#9a3412]">
            Buyurtma berish uchun{" "}
            <Link href="/kirish?next=/checkout" className="font-semibold underline">
              tizimga kiring
            </Link>
            . Buyurtma va escrow holati akkauntingizda saqlanadi.
          </p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ism">
            <Input
              className="mt-1 h-10"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder={profile?.fullName ?? "Ism familiya"}
            />
          </Field>
          <Field label="Telefon">
            <Input
              className="mt-1 h-10"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder={profilePhone || "+998 90 123 45 67"}
            />
          </Field>
        </div>
        <Field label="Shahar">
          <select
            className="mt-1 h-10 w-full rounded-lg border border-input px-2.5 text-sm"
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
          >
            {["Toshkent", "Samarqand", "Buxoro", "Farg‘ona"].map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </Field>
        <Field label="Manzil">
          <Input
            className="mt-1 h-10"
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
            placeholder="Tuman, ko‘cha, uy"
          />
        </Field>
        <Field label="Izoh (ixtiyoriy)">
          <Textarea
            className="mt-1"
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            placeholder="Yetkazish vaqti, klinika nomi..."
          />
        </Field>

        <div>
          <p className="text-sm font-medium text-[#4b5568]">To‘lov usuli</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {paymentMethods.filter((method) => method.id === "naqd").map((method) => {
              return (
              <label
                key={method.id}
                className={cn(
                  "cursor-pointer rounded-xl border px-3 py-3 text-sm",
                  form.payment === method.id
                    ? "border-[#0F766E] bg-[#CCFBF1] text-[#0F766E]"
                    : "border-[#e6eaf2] bg-white text-[#4b5568]"
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="payment"
                  checked={form.payment === method.id}
                  onChange={() => setForm({ ...form, payment: "naqd" })}
                />
                <span className="block font-semibold">Naqd to‘lov, yetkazib berilganda</span>
              </label>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] text-[#8b93a7]">{payHint}</p>
        </div>
      </div>

      <aside className="h-fit rounded-[16px] border border-[#eceff5] bg-white p-4">
        <h2 className="text-[15px] font-semibold text-[#1a1d26]">Jami</h2>
        <ul className="mt-3 space-y-2 text-[13px] text-[#4b5568]">
          {items.map(({ product, qty, size, color, source, expiryMonths, key }) => (
            <li key={key} className="flex justify-between gap-2">
              <span className="min-w-0 truncate">
                {product.name}
                {size || color ? ` · ${apparelMetaLabel(size, color)}` : ""}
                {productShop(product)?.name ? ` · ${productShop(product)?.name}` : ""}
                {surplusCartMeta(source, expiryMonths) ? ` · ${surplusCartMeta(source, expiryMonths)}` : ""} × {qty}
              </span>
              <span className="shrink-0 font-medium text-[#1a1d26]">
                {formatMoney(product.price * qty, "UZS")}
              </span>
            </li>
          ))}
        </ul>
        <BonusUseCard use={bonus} className="mt-3" />
        <p className="mt-3 flex justify-between text-[13px] text-[#4b5568]">
          <span>Yetkazib berish</span>
          <span className="font-medium text-[#1a1d26]">{delivery > 0 ? formatMoney(delivery, "UZS") : "Bepul"}</span>
        </p>
        {bonus.applied > 0 ? (
          <p className="mt-3 flex justify-between text-[13px] text-[#0066FF]">
            <span>Bonus</span>
            <span className="font-semibold">−{formatMoney(bonus.applied, "UZS")}</span>
          </p>
        ) : null}
        <p className="mt-3 flex justify-between border-t border-[#eceff5] pt-3 text-[16px] font-bold text-[#1a1d26]">
          <span>To‘lov</span>
          <span>{formatMoney(payable, "UZS")}</span>
        </p>
        <Button type="submit" className="mt-4 h-11 w-full !rounded-xl" disabled={busy}>
          {busy ? "Yuborilmoqda..." : "Buyurtmani tasdiqlash"}
        </Button>
        <Link href="/savat" className="mt-2 block text-center text-sm font-medium text-[#0066FF] hover:underline">
          Savatga qaytish
        </Link>
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="block">
      <span className="text-[#4b5568]">{label}</span>
      {children}
    </Label>
  );
}
