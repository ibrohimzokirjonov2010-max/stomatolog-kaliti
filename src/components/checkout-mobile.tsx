"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bike,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  FileText,
  House,
  Info,
  Map as MapIcon,
  MapPin,
  Package,
  Plus,
  Phone,
  ShoppingBag,
  Store,
  Truck,
  User,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { BonusUseCard, useBonusUse } from "@/components/bonus/bonus";
import { apparelMetaLabel } from "@/data/forma";
import { isRemoteImage, surplusCartMeta } from "@/data/surplus";
import { productShop } from "@/data/shops";
import { site } from "@/data/site";
import { createOrder, type PaymentMethod } from "@/lib/orders";
import { useSavedPlaces } from "@/lib/saved-addresses";
import { MapPicker, PlaceIcon, type PickedPlace } from "@/components/map-picker";
import { cn } from "@/lib/utils";

function som(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU").replace(/,/g, " ")} so‘m`;
}

type Delivery = "yandex" | "pickup";
type PayChoice = PaymentMethod | "uzum";

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Farg‘ona", "Andijon", "Namangan", "Qarshi", "Nukus", "Urganch", "Jizzax", "Navoiy", "Termiz", "Guliston"];

const PAYS: { id: PayChoice; label: string; sub?: string; badge: ReactNode; ready: boolean }[] = [
  {
    id: "click",
    label: "Click",
    ready: true,
    badge: <span className="grid size-8 place-items-center rounded-full bg-[#0a7cff] text-[16px] font-extrabold text-white">C</span>,
  },
  {
    id: "payme",
    label: "Payme",
    ready: true,
    badge: <span className="grid size-8 place-items-center rounded-[9px] bg-[#1fc5bd] text-[16px] font-extrabold text-white">P</span>,
  },
  {
    id: "uzum",
    label: "Uzum Bank",
    sub: "tez orada",
    ready: false,
    badge: <span className="grid size-8 place-items-center rounded-[9px] bg-[#7b2bf9] text-[16px] font-extrabold text-white">U</span>,
  },
  {
    id: "naqd",
    label: "Naqd",
    sub: "(yetkazganda)",
    ready: true,
    badge: (
      <span className="grid size-8 place-items-center rounded-[9px] bg-[#eef1f6] text-[#4b5568]">
        <Banknote className="size-5" />
      </span>
    ),
  },
];

const PAY_HINT: Record<PayChoice, string> = {
  click: "Click hali ulanmagan — demo rejim: haqiqiy pul yechilmaydi, to‘lov namuna sifatida qayd etiladi.",
  payme: "Payme hali ulanmagan — demo rejim: haqiqiy pul yechilmaydi, to‘lov namuna sifatida qayd etiladi.",
  uzum: "Uzum Bank orqali to‘lov tez orada qo‘shiladi.",
  naqd: "Mahsulotni olganda kuryerga yoki sotuvchiga naqd to‘laysiz.",
};

const STEPS = ["Yetkazish", "To‘lov", "Tasdiqlash"] as const;

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[18px] bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]", className)}>
      {children}
    </section>
  );
}

function CardTitle({ icon, children, right }: { icon: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="text-[#1f6bff]">{icon}</span>
      <h2 className="flex-1 text-[16px] font-bold text-[#0B1220]">{children}</h2>
      {right}
    </div>
  );
}

function FieldBox({
  icon,
  label,
  children,
  className,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-[54px] items-center gap-2.5 rounded-[12px] border border-[#e3e8f0] bg-white px-3 py-1.5 focus-within:border-[#1f6bff]",
        className,
      )}
    >
      <span className="shrink-0 text-[#7a8397]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] leading-tight text-[#7a8397]">{label}</span>
        {children}
      </span>
    </label>
  );
}

const inputCls =
  "w-full bg-transparent text-[14.5px] leading-snug text-[#0B1220] outline-none placeholder:text-[#9aa3b5]";

function Thumb({ src }: { src: string }) {
  return (
    <span className="flex size-[58px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#f4f6fa]">
      {isRemoteImage(src) ? (
        <img src={src} alt="" className="size-full object-contain" />
      ) : (
        <Image src={src} alt="" width={120} height={120} className="size-full object-contain" />
      )}
    </span>
  );
}

export function CheckoutMobile() {
  const router = useRouter();
  const { selectedItems: items, selectedSubtotal: subtotal, selectedCount: count, clearSelected } = useCart();
  const { ready: profileReady, profile } = useDoctorProfile();
  const bonus = useBonusUse(items.map((i) => ({ productId: i.product.id, qty: i.qty })));

  const profilePhone =
    profile?.phone && /^\d{9}$/.test(profile.phone)
      ? `+998 ${profile.phone.slice(0, 2)} ${profile.phone.slice(2, 5)} ${profile.phone.slice(5, 7)} ${profile.phone.slice(7)}`
      : "";

  const [step, setStep] = useState(0);
  const [showItems, setShowItems] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState<string>(site.city || "Toshkent");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [mapPoint, setMapPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const saved = useSavedPlaces(!!profile, profileReady);
  const [delivery, setDelivery] = useState<Delivery>("yandex");
  const [pay, setPay] = useState<PayChoice>("click");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Prefill from the signed-in profile (real account data only).
  useEffect(() => {
    if (!profile) return;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time prefill from profile */
    setName((v) => v || profile.fullName || "");
    setPhone((v) => v || profilePhone);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [profile, profilePhone]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const total = Math.max(0, subtotal - bonus.applied);

  function applyPlace(p: PickedPlace, id: string | null) {
    setAddress(p.address);
    if (p.district) setDistrict(p.district);
    setMapPoint(Number.isFinite(p.lat) && Number.isFinite(p.lng) ? { lat: p.lat, lng: p.lng } : null);
    setPlaceId(id);
    setPickerOpen(false);
    setError("");
  }

  const mapUrl = mapPoint ? `https://yandex.uz/maps/?pt=${mapPoint.lng},${mapPoint.lat}&z=17&l=map` : "";

  function validateDelivery(): string {
    if (!name.trim()) return "Ismingizni kiriting.";
    if (phone.replace(/\D/g, "").length < 9) return "Telefon raqamini to‘liq kiriting.";
    if (delivery === "yandex" && !address.trim() && !district.trim() && !mapPoint)
      return "Aniq manzilni kiriting yoki xaritadan tanlang.";
    return "";
  }

  function next() {
    setError("");
    if (step === 0) {
      const e = validateDelivery();
      if (e) return setError(e);
    }
    if (step === 1 && pay === "uzum") return setError("Uzum Bank hali ulanmagan. Boshqa usulni tanlang.");
    if (step < 2) setStep(step + 1);
    else void submit();
  }

  async function submit() {
    if (!profile) {
      setError("Buyurtma berish uchun avval tizimga kiring.");
      router.push("/kirish?next=/buyurtma");
      return;
    }
    if (pay === "uzum") return setError("Uzum Bank hali ulanmagan.");
    const fullAddress =
      delivery === "pickup"
        ? "O‘zim olib ketaman (sotuvchidan)"
        : [district.trim(), address.trim(), mapPoint ? `Xarita: ${mapUrl}` : ""].filter(Boolean).join(", ");
    const fullNote = [
      `Yetkazish: ${delivery === "yandex" ? "Yandex kuryer" : "O‘zim olib ketaman"}`,
      note.trim(),
    ]
      .filter(Boolean)
      .join(" · ");
    setBusy(true);
    setError("");
    const res = await createOrder({
      name: name.trim(),
      phone: phone.trim(),
      city,
      address: fullAddress,
      note: fullNote,
      payment: pay,
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
    if (!res.ok) return setError(res.reason);
    clearSelected();
    router.push(`/buyurtma/tasdiq?id=${encodeURIComponent(res.order.id)}`);
  }

  if (count === 0) {
    return (
      <div className="px-1 pt-1 pb-6" data-testid="buyurtma-mobile">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0B1220]">Buyurtma berish</h1>
        <div className="mt-4 rounded-[18px] bg-white px-6 py-14 text-center shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#F0FDFA] text-[#1f6bff]">
            <ShoppingBag className="size-7" />
          </span>
          <p className="mt-4 text-[17px] font-bold text-[#0B1220]">Savatda tanlangan mahsulot yo‘q</p>
          <p className="mt-1 text-[14px] text-[#7a8397]">Avval mahsulot qo‘shing, keyin buyurtma bering.</p>
          <Link
            href="/marketplace"
            className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1f6bff] px-6 text-[15px] font-semibold text-white"
          >
            Marketplace <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  const extra = Math.max(0, items.length - 3);
  const payLabel = PAYS.find((p) => p.id === pay)?.label ?? "";
  const nextLabel = step === 0 ? "Keyingi bosqich: to‘lov" : step === 1 ? "Keyingi bosqich: tasdiqlash" : "Buyurtma sotuvchiga yuboriladi";

  return (
    <div className="-mx-1 -mt-1 pb-14" data-testid="buyurtma-mobile">
      {/* Title */}
      <div className="px-1">
        <h1 className="text-[29px] leading-tight font-extrabold tracking-tight text-[#0B1220]">Buyurtma berish</h1>
        <p className="mt-0.5 text-[13.5px] text-[#7a8397]">Manzil va to‘lov usulini tanlang. Buyurtmangizni tasdiqlang.</p>
      </div>

      {/* Stepper */}
      <ol className="mt-3 flex items-center px-1" aria-label="Bosqichlar">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={label} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i)}
                className="flex items-center gap-2"
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "grid size-[30px] place-items-center rounded-full text-[13.5px] font-bold",
                    active || done ? "bg-[#1f6bff] text-white" : "bg-[#e9edf3] text-[#4b5568]",
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn("text-[13.5px]", active ? "font-semibold text-[#1f6bff]" : "text-[#4b5568]")}>{label}</span>
              </button>
              {i < STEPS.length - 1 ? <span className={cn("mx-2 h-px flex-1", done ? "bg-[#1f6bff]" : "bg-[#d7dde7]")} /> : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 space-y-3">
        {/* Cart summary */}
        <Card>
          <div className="mb-2.5 flex items-center gap-2">
            <Package className="size-[18px] text-[#1f6bff]" />
            <p className="text-[14.5px] font-bold text-[#0B1220]">{count} ta mahsulot</p>
          </div>
          <button
            type="button"
            onClick={() => setShowItems((v) => !v)}
            className="flex w-full items-center gap-1.5 text-left"
            aria-expanded={showItems}
          >
            <span className="flex gap-1.5">
              {items.slice(0, 3).map((i) => (
                <Thumb key={i.key} src={i.product.image} />
              ))}
              {extra > 0 ? (
                <span className="grid size-[58px] place-items-center rounded-[10px] bg-[#F0FDFA] text-[17px] font-bold text-[#1f6bff]">
                  +{extra}
                </span>
              ) : null}
            </span>
            <span className="ml-auto shrink-0 pl-1 text-right">
              <span className="block text-[12px] text-[#7a8397]">Mahsulotlar</span>
              <span className="block text-[15px] font-extrabold whitespace-nowrap text-[#0B1220] [@media(max-width:400px)]:text-[14px]" data-testid="buyurtma-subtotal">
                {som(subtotal)}
              </span>
            </span>
            <ChevronDown className={cn("size-5 shrink-0 text-[#4b5568] transition-transform", showItems && "rotate-180")} />
          </button>
          {showItems ? (
            <ul className="mt-3 space-y-1.5 border-t border-[#eceff5] pt-2.5 text-[13px]">
              {items.map(({ product, qty, size, color, source, expiryMonths, key, lineTotal }) => {
                const meta = [apparelMetaLabel(size, color), surplusCartMeta(source, expiryMonths), productShop(product)?.name]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={key} className="flex justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-[#0B1220]">{product.name}</span>
                      <span className="block truncate text-[12px] text-[#7a8397]">
                        {meta ? `${meta} · ` : ""}× {qty}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-[#0B1220]">{som(lineTotal)}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </Card>

        {profileReady && !profile ? (
          <p className="rounded-[14px] bg-[#fff7ed] px-3.5 py-2.5 text-[13px] text-[#9a3412]">
            Buyurtma berish uchun{" "}
            <Link href="/kirish?next=/buyurtma" className="font-semibold underline">
              tizimga kiring
            </Link>
            .
          </p>
        ) : null}

        {step === 0 ? (
          <>
            {/* Delivery details */}
            <Card>
              <CardTitle icon={<MapPin className="size-[22px] fill-[#1f6bff] text-white" />}>Yetkazib berish ma’lumotlari</CardTitle>
              <div className="grid grid-cols-2 gap-2">
                <FieldBox icon={<User className="size-[18px]" />} label="Ism">
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism familiya" autoComplete="name" />
                </FieldBox>
                <FieldBox icon={<Phone className="size-[18px]" />} label="Telefon">
                  <input
                    className={inputCls}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 __ ___ __ __"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </FieldBox>
                <FieldBox icon={<MapPin className="size-[18px]" />} label="Shahar">
                  <span className="relative block">
                    <select className={cn(inputCls, "appearance-none pr-5")} value={city} onChange={(e) => setCity(e.target.value)}>
                      {CITIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-[#0B1220]" />
                  </span>
                </FieldBox>
                <FieldBox icon={<Building2 className="size-[18px]" />} label="Tuman">
                  <input className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Tuman, ko‘cha, uy" />
                </FieldBox>
                <FieldBox icon={<House className="size-[18px]" />} label="Aniq manzil" className="col-span-1">
                  <input className={inputCls} value={address} onChange={(e) => { setAddress(e.target.value); setPlaceId(null); }} placeholder="Manzilni batafsil kiriting" />
                </FieldBox>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className={cn(
                    "flex min-h-[54px] items-center justify-center gap-2 rounded-[12px] px-2 text-[13.5px] font-semibold",
                    mapPoint ? "bg-[#e8f8ee] text-[#16a34a]" : "bg-[#F0FDFA] text-[#1f6bff]",
                  )}
                  data-testid="xarita-btn"
                >
                  {mapPoint ? <Check className="size-[18px]" /> : <MapIcon className="size-[18px]" />}
                  {mapPoint ? "Xaritada belgilandi" : "Xaritadan tanlash"}
                </button>
                {mapPoint ? (
                  <p className="col-span-2 -mt-0.5 px-1 text-[12px] text-[#7a8397]">
                    Pin: {mapPoint.lat}, {mapPoint.lng} ·{" "}
                    <a href={mapUrl} target="_blank" rel="noreferrer" className="font-medium text-[#1f6bff] underline">
                      xaritada ko‘rish
                    </a>
                  </p>
                ) : null}
                <div className="col-span-2" data-testid="saved-chips">
                  <p className="mb-1.5 px-0.5 text-[12.5px] font-semibold text-[#4b5568]">Saqlangan manzillar</p>
                  <div className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:none]">
                    {saved.places.map((p) => {
                      const on = placeId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            applyPlace(
                              { lat: p.lat ?? NaN, lng: p.lng ?? NaN, address: p.address, district: p.district ?? "" },
                              p.id,
                            )
                          }
                          aria-pressed={on}
                          className={cn(
                            "flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold",
                            on ? "border-[#1f6bff] bg-[#1f6bff] text-white" : "border-[#dfe4ec] bg-white text-[#0B1220]",
                          )}
                        >
                          <PlaceIcon label={p.label} className="size-4" />
                          {p.label}
                        </button>
                      );
                    })}
                    {saved.loaded && saved.places.length === 0 ? (
                      <span className="flex h-10 shrink-0 items-center rounded-full bg-[#f4f6fa] px-3 text-[12.5px] text-[#7a8397]">
                        Hali saqlangan manzil yo‘q
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="flex h-10 shrink-0 items-center gap-1 rounded-full border border-dashed border-[#5EEAD4] bg-[#f3f7ff] px-3 text-[13px] font-semibold text-[#1f6bff]"
                    >
                      <Plus className="size-4" /> Qo‘shish
                    </button>
                  </div>
                </div>
                <FieldBox icon={<FileText className="size-[18px]" />} label="Izoh (ixtiyoriy)" className="col-span-2">
                  <input
                    className={inputCls}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Yetkazish vaqti, klinika nomi, qo‘shimcha ma’lumot..."
                  />
                </FieldBox>
              </div>
            </Card>

            {/* Delivery method */}
            <Card>
              <CardTitle icon={<Truck className="size-[22px] fill-[#1f6bff]" />}>Yetkazib berish usuli</CardTitle>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Yetkazib berish usuli">
                {(
                  [
                    { id: "yandex", title: "Yandex kuryer", sub: "Narx keyin hisoblanadi", icon: <Bike className="size-5" /> },
                    { id: "pickup", title: "O‘zim olib ketaman", sub: "Bepul", icon: <Store className="size-5" /> },
                  ] as const
                ).map((o) => {
                  const on = delivery === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setDelivery(o.id)}
                      className={cn(
                        "relative flex items-center gap-2 rounded-[14px] border py-3 pr-6 pl-2 text-left",
                        on ? "border-[#1f6bff] bg-[#f3f7ff]" : "border-[#e3e8f0] bg-white",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full",
                          on ? "bg-[#1f6bff] text-white" : "bg-[#eef1f6] text-[#1f6bff]",
                        )}
                      >
                        {o.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] leading-tight font-bold text-[#0B1220]">{o.title}</span>
                        <span className={cn("mt-0.5 block text-[11.5px] leading-tight", o.id === "pickup" ? "font-medium text-[#16a34a]" : "text-[#7a8397]")}>
                          {o.sub}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "absolute top-2 right-2 grid size-[18px] place-items-center rounded-full border-2",
                          on ? "border-[#1f6bff] bg-[#1f6bff] text-white" : "border-[#c9d1df] bg-white",
                        )}
                      >
                        {on ? <Check className="size-3" strokeWidth={3.5} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </>
        ) : null}

        {step <= 1 ? (
          /* Payment */
          <Card>
            <CardTitle icon={<CreditCard className="size-[22px]" />}>To‘lov usuli</CardTitle>
            <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="To‘lov usuli">
              {PAYS.map((p) => {
                const on = pay === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-disabled={!p.ready}
                    onClick={() => {
                      setPay(p.id);
                      setError("");
                    }}
                    className={cn(
                      "relative flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[12px] border px-1 py-2",
                      on ? "border-[#1f6bff] bg-[#f3f7ff]" : "border-[#e3e8f0] bg-white",
                      !p.ready && "opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full border-2",
                        on ? "border-[#1f6bff] bg-[#1f6bff] text-white" : "border-[#c9d1df] bg-white",
                      )}
                    >
                      {on ? <Check className="size-2.5" strokeWidth={4} /> : null}
                    </span>
                    {p.badge}
                    <span className="text-[12.5px] leading-tight font-semibold text-[#0B1220]">{p.label}</span>
                    {p.sub ? <span className="-mt-1 text-[10.5px] text-[#7a8397]">{p.sub}</span> : null}
                  </button>
                );
              })}
            </div>
            {step === 1 || pay !== "click" ? (
              <p className="mt-2.5 rounded-[10px] bg-[#f4f6fa] px-3 py-2 text-[12.5px] text-[#4b5568]">{PAY_HINT[pay]}</p>
            ) : null}
            {step === 1 ? <BonusUseCard use={bonus} className="mt-3" /> : null}
          </Card>
        ) : null}

        {step === 2 ? (
          <Card>
            <CardTitle icon={<Check className="size-[22px]" strokeWidth={3} />}>Tasdiqlash</CardTitle>
            <dl className="space-y-2 text-[13.5px]">
              {[
                ["Qabul qiluvchi", `${name} · ${phone}`],
                [
                  "Manzil",
                  delivery === "pickup"
                    ? "O‘zim olib ketaman (sotuvchidan)"
                    : [city, district, address, mapPoint ? "xaritada belgilangan" : ""].filter(Boolean).join(", "),
                ],
                ["Yetkazish", delivery === "yandex" ? "Yandex kuryer" : "O‘zim olib ketaman"],
                ["To‘lov", payLabel],
                ...(note.trim() ? [["Izoh", note.trim()]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="shrink-0 text-[#7a8397]">{k}</dt>
                  <dd className="text-right font-medium text-[#0B1220]">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ) : null}

        {/* Order summary */}
        <Card>
          <CardTitle icon={<FileText className="size-[22px]" />}>Buyurtma summasi</CardTitle>
          <dl className="space-y-1.5 text-[13.5px] text-[#4b5568]">
            <div className="flex justify-between">
              <dt>Mahsulotlar ({count} ta)</dt>
              <dd className="text-[#0B1220]">{som(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Yetkazib berish</dt>
              <dd className={delivery === "pickup" ? "font-medium text-[#16a34a]" : "text-[#0B1220]"}>
                {delivery === "pickup" ? "Bepul" : "Hisoblanadi keyin"}
              </dd>
            </div>
            {bonus.applied > 0 ? (
              <div className="flex justify-between text-[#1f6bff]">
                <dt>Bonus</dt>
                <dd className="font-semibold">− {som(bonus.applied)}</dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-2.5 flex items-baseline justify-between border-t border-[#eceff5] pt-2.5">
            <span className="text-[15px] font-bold text-[#0B1220]">
              Jami {delivery === "yandex" ? <span className="text-[12.5px] font-normal text-[#7a8397]">(taxminiy)</span> : null}
            </span>
            <span className="text-[19px] font-extrabold text-[#0B1220]" data-testid="buyurtma-total">
              {som(total)}
            </span>
          </div>
          <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-[#eef4ff] px-3 py-2 text-[12px] text-[#4b5568]">
            <Info className="mt-px size-4 shrink-0 text-[#1f6bff]" />
            Buyurtma tasdiqlangach sotuvchi bilan yetkazish tafsilotlari kelishiladi.
          </p>
        </Card>

        {error ? (
          <p className="rounded-[12px] bg-[#fef2f2] px-3.5 py-2.5 text-[13px] font-medium text-[#dc2626]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <MapPicker
        open={pickerOpen}
        city={city}
        initial={mapPoint ? { ...mapPoint, address, district } : null}
        places={saved.places}
        onClose={() => setPickerOpen(false)}
        onConfirm={(p) => applyPlace(p, saved.places.find((x) => x.address === p.address && x.lat === p.lat)?.id ?? null)}
        onSave={async (p) => {
          const r = await saved.save({ label: p.label, address: p.address, district: p.district, city, lat: p.lat, lng: p.lng });
          return r.ok ? null : r.error;
        }}
        onRemove={(id) => {
          void saved.remove(id);
          if (placeId === id) setPlaceId(null);
        }}
      />

      {/* Sticky CTA above the bottom nav */}
      <div
        className="fixed inset-x-0 z-30 bg-gradient-to-t from-[#f4f6fa] via-[#f4f6fa]/95 to-transparent px-3 pt-3 pb-2 lg:hidden"
        style={{ bottom: "calc(64px + max(0.5rem, env(safe-area-inset-bottom)))" }}
      >
        <div className="flex gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep(step - 1);
              }}
              aria-label="Orqaga"
              className="grid h-[56px] w-[56px] shrink-0 place-items-center rounded-[16px] border border-[#dfe4ec] bg-white text-[#0B1220]"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={next}
            disabled={busy}
            data-testid="davom-etish"
            className="flex h-[56px] flex-1 flex-col items-center justify-center rounded-[16px] bg-[#1f6bff] text-white shadow-[0_8px_20px_rgba(31,107,255,0.3)] disabled:opacity-70"
          >
            <span className="flex items-center gap-1.5 text-[16px] font-semibold">
              {busy ? "Yuborilmoqda..." : step === 2 ? "Buyurtmani tasdiqlash" : "Davom etish"}
              {!busy ? <ArrowRight className="size-[18px]" /> : null}
            </span>
            <span className="text-[11.5px] text-white/80">{nextLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
