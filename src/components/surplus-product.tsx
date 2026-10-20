"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data loading effect kicks off an async fetch */
/* eslint-disable @next/next/no-img-element -- seller uploads + OSM tiles are remote */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDown,
  CalendarDays,
  ChevronLeft,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  PencilLine,
  PlayCircle,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  User,
} from "lucide-react";
import { ReportButton, RevealPhone } from "@/components/forms/RevealPhone";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { UzumHero, UzumLightbox } from "@/components/product-uzum";
import { ProductCard } from "@/components/product-card";
import { ContactForm, Modal, PostForm, sellerLine } from "@/components/surplus-forms";
import { useSurplusWork } from "@/components/surplus-provider";
import {
  conditionLabel,
  listingCondition,
  listingDiscount,
  listingExpiry,
  listingToProduct,
  normalizeCategory,
  statusLabel,
  surplusBrandLabel,
  surplusCategoryLabel,
  type SurplusListing,
} from "@/data/surplus";
import { formatGroupedNumber } from "@/lib/format";
import { listingFromDb, type DbSurplus } from "@/lib/surplus-work";
import { api } from "@/lib/work-client";
import { cn } from "@/lib/utils";
const EMPTY = "—";

function som(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

function dateUz(iso?: string) {
  if (!iso) return EMPTY;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function galleryOf(l: SurplusListing) {
  return [...new Set([l.image, ...(l.images ?? [])].filter(Boolean))];
}

function initials(name: string) {
  return (
    name
      .replace(/^Dr\.?\s*/i, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "D"
  );
}

const MOD_COPY: Record<string, string> = {
  pending: "Moderatsiyada — admin tasdiqlagach hamma ko‘radi",
  rejected: "Rad etilgan — tahrirlab qayta yuboring",
  hidden: "Admin tomonidan yashirilgan",
  closed: "Yopilgan — lentada ko‘rinmaydi",
};

export function SurplusProductPage({ id }: { id: string }) {
  return <SurplusProductBody id={id} />;
}

function SurplusProductBody({ id }: { id: string }) {
  const { feed, getById, ready: workReady, mine } = useSurplusWork();
  const [listing, setListing] = useState<SurplusListing | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [modal, setModal] = useState<"contact" | "edit" | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let off = false;
    setState((s) => (s === "ok" ? s : "loading"));
    void api<{ listing: DbSurplus }>(`/api/work/surplus/${id}`).then((res) => {
      if (off) return;
      if (res.ok && res.data.listing) {
        setListing(listingFromDb(res.data.listing));
        setState("ok");
      } else {
        const local = getById(id);
        if (local) {
          setListing(local);
          setState("ok");
        } else setState("missing");
      }
    });
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on id / after edit; getById fallback only
  }, [id, tick, mine.length]);

  const similar = useMemo(() => {
    if (!listing) return [];
    const cat = normalizeCategory(listing.category);
    return feed.filter((x) => x.id !== listing.id && normalizeCategory(x.category) === cat).slice(0, 4);
  }, [feed, listing]);

  if (state === "loading" || (!workReady && !listing)) {
    return (
      <div className="space-y-3 py-2" data-testid="surplus-pdp-loading" aria-busy="true">
        <div className="h-[340px] animate-pulse rounded-3xl bg-[#e9edf4]" />
        <div className="h-20 animate-pulse rounded-3xl bg-[#e9edf4]" />
        <div className="h-32 animate-pulse rounded-3xl bg-[#e9edf4]" />
      </div>
    );
  }

  if (state === "missing" || !listing) {
    return (
      <div className="mx-auto max-w-md py-16 text-center" data-testid="surplus-pdp-missing">
        <Package className="mx-auto size-10 text-[#8b93a7]" />
        <p className="mt-3 text-[16px] font-bold text-[#1a1d26]">E’lon topilmadi</p>
        <p className="mt-1 text-[13.5px] text-[#8b93a7]">E’lon yopilgan, o‘chirilgan yoki hali admin tasdig‘ini kutmoqda.</p>
        <Link href="/ortiqcha-material" className="mt-5 inline-flex h-11 items-center rounded-2xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white">
          Ortiqcha materiallarga qaytish
        </Link>
      </div>
    );
  }

  const l = listing;
  const gallery = galleryOf(l);
  const product = { ...listingToProduct(l), images: l.images };
  const modNote = l.mine && l.modStatus && l.modStatus !== "published" ? MOD_COPY[l.modStatus] : "";

  return (
    <div data-testid="surplus-pdp">
      {/* ─────────── MOBILE ─────────── */}
      <div className="pb-2 lg:hidden">
        <div className="relative">
          <UzumHero product={product} gallery={gallery} backHref="/ortiqcha-material" />
          {!l.hasPhoto ? <NoPhotoBadge className="absolute top-[74px] left-0" /> : null}
        </div>
        <PriceCard l={l} className="-mx-4 -mt-6 rounded-[24px] shadow-[0_-4px_16px_rgba(15,23,42,0.04)]" />
        {modNote ? <ModNote text={modNote} className="-mx-4 mt-2.5" /> : null}
        <TitleCard l={l} className="-mx-4 mt-2.5" />
        <div className="-mx-4 mt-2.5 space-y-2.5">
          <VideoCard l={l} />
          <SpecsCard l={l} />
          <DescriptionCard l={l} />
          <LocationCard l={l} />
          <SellerCard l={l} />
          <ReviewsCard />
          <SafetyCard />
          <SimilarCard items={similar} />
        </div>
        <BottomBar l={l} onContact={() => setModal("contact")} onEdit={() => setModal("edit")} />
      </div>

      {/* ─────────── DESKTOP ─────────── */}
      <div className="hidden lg:block">
        <nav className="mb-4 flex items-center gap-1.5 text-[13px] text-[#8b93a7]">
          <Link href="/ortiqcha-material" className="inline-flex items-center gap-1 font-semibold text-[#0066FF] hover:underline">
            <ChevronLeft className="size-4" />
            Ortiqcha material
          </Link>
          <span>/</span>
          <span>{surplusCategoryLabel(l.category) || EMPTY}</span>
          <span>/</span>
          <span className="truncate text-[#1a1d26]">{l.name}</span>
        </nav>
        {modNote ? <ModNote text={modNote} className="mb-4" /> : null}
        <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-6">
          <DesktopGallery l={l} gallery={gallery} />
          <div className="space-y-4">
            <PriceCard l={l} className="rounded-3xl border border-[#eceff5]" />
            <TitleCard l={l} className="rounded-3xl border border-[#eceff5]" />
            <DesktopActions l={l} onContact={() => setModal("contact")} onEdit={() => setModal("edit")} />
            <SellerCard l={l} />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <VideoCard l={l} />
            <DescriptionCard l={l} />
            <ReviewsCard />
          </div>
          <div className="space-y-4">
            <SpecsCard l={l} />
            <LocationCard l={l} />
            <SafetyCard />
          </div>
        </div>
        <div className="mt-4">
          <SimilarCard items={similar} desktop />
        </div>
      </div>

      {modal === "contact" && !l.mine ? (
        <Modal title="Sotuvchi bilan bog‘lanish" onClose={() => setModal(null)}>
          <ContactForm listing={l} onClose={() => setModal(null)} />
        </Modal>
      ) : null}
      {modal === "edit" && l.mine ? (
        <Modal title="E’lonni tahrirlash" onClose={() => setModal(null)}>
          <PostForm
            listing={l}
            onCancel={() => setModal(null)}
            onDone={() => {
              setModal(null);
              setTick((t) => t + 1);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

/* ───────────── building blocks ───────────── */

function Card({ title, icon, children, className, testid }: { title?: string; icon?: ReactNode; children: ReactNode; className?: string; testid?: string }) {
  return (
    <section className={cn("rounded-[24px] bg-white p-4", className)} data-testid={testid}>
      {title ? (
        <h2 className="mb-3 flex items-center gap-2 text-[16px] font-bold text-[#1a1d26]">
          {icon ? <span className="text-[#0066FF]">{icon}</span> : null}
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

function Neutral({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-[#f5f7fb] px-3.5 py-3 text-[13.5px] text-[#8b93a7]">{children}</p>;
}

function NoPhotoBadge({ className }: { className?: string }) {
  return (
    <span className={cn("z-[1] rounded-full bg-white/90 px-3 py-1 text-[11.5px] font-medium text-[#4b5568] shadow-sm", className)}>
      Umumiy rasm · sotuvchi rasm qo‘shmagan
    </span>
  );
}

function ModNote({ text, className }: { text: string; className?: string }) {
  return (
    <p className={cn("rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] font-semibold text-[#92400e]", className)} data-testid="surplus-mod-note">
      {text}
    </p>
  );
}

function PriceCard({ l, className }: { l: SurplusListing; className?: string }) {
  const discount = listingDiscount(l);
  const hasOld = l.newPrice > l.price;
  return (
    <section className={cn("relative bg-white px-4 pt-4 pb-4", className)} data-testid="surplus-price">
      <p className="text-[12px] font-medium text-[#8b93a7]">Hozirgi narx</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-[26px] leading-none font-extrabold tracking-tight text-[#1a1d26]">{som(l.price)}</p>
        {discount > 0 ? (
          <span className="inline-flex items-center text-[16px] font-bold text-[#e5177e]">
            <ArrowDown className="size-4" strokeWidth={2.6} />
            {discount}%
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[13px] text-[#8b93a7]">
        Asl narxi (yangi):{" "}
        {hasOld ? <span className="text-[14px] text-[#8b93a7] line-through">{som(l.newPrice)}</span> : <span className="font-semibold text-[#4b5568]">{EMPTY}</span>}
      </p>
      {hasOld ? <p className="mt-1 text-[12.5px] font-semibold text-[#15803d]">Tejaysiz: {som(l.newPrice - l.price)}</p> : null}
    </section>
  );
}

function TitleCard({ l, className }: { l: SurplusListing; className?: string }) {
  const condition = listingCondition(l);
  const opened = l.status === "ochilgan";
  return (
    <section className={cn("bg-white px-4 pt-4 pb-4", className)} data-testid="surplus-title">
      <p className="text-[12px] font-bold tracking-[0.04em] text-[#1a1d26] uppercase">
        {surplusBrandLabel(l)}
        <span className="font-semibold tracking-normal text-[#8b93a7] normal-case"> · {surplusCategoryLabel(l.category) || EMPTY}</span>
      </p>
      <h1 className="mt-2 text-[20px] leading-[1.3] font-medium text-[#1a1d26]">{l.name}</h1>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={cn("rounded-full px-3 py-1.5 text-[12.5px] font-semibold", opened ? "bg-[#fff3e0] text-[#c2410c]" : "bg-[#ecfdf3] text-[#15803d]")}>
          {statusLabel[l.status]}
        </span>
        <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 text-[12.5px] font-semibold text-[#374151]">{conditionLabel[condition]}</span>
        <span className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-[12.5px] font-semibold text-[#0066FF]">Yaroqlilik: {listingExpiry(l)}</span>
      </div>
      <div className="mt-3 rounded-[16px] border border-[#eceff3] px-3.5 py-3" data-testid="surplus-rating">
        <span className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="size-[20px] fill-[#d9dde5] text-[#d9dde5]" />
          ))}
        </span>
        <span className="mt-1 block text-[13px] text-[#8b93a7]">Hali baho yo‘q</span>
      </div>
    </section>
  );
}

function VideoCard({ l }: { l: SurplusListing }) {
  return (
    <Card title="Video obzor" icon={<PlayCircle className="size-5" />} testid="surplus-video">
      {l.video ? (
        <video src={l.video} controls playsInline preload="metadata" className="aspect-video w-full rounded-2xl bg-black object-contain" />
      ) : (
        <Neutral>Sotuvchi video obzor qo‘shmagan.</Neutral>
      )}
    </Card>
  );
}

function SpecsCard({ l }: { l: SurplusListing }) {
  const rows: [string, string][] = [
    ["Brend", l.brand?.trim() || EMPTY],
    ["Kategoriya", surplusCategoryLabel(l.category) || EMPTY],
    ["Qadoq holati", statusLabel[l.status]],
    ["Yaroqlilik muddati", `${listingExpiry(l)} · ${l.expiryMonths} oy`],
    ["Shahar", l.city || EMPTY],
    ["Tuman", l.district || EMPTY],
    ["E’lon sanasi", dateUz(l.createdAt)],
    ["Yangilangan", l.updatedLabel || EMPTY],
  ];
  return (
    <Card title="Xususiyatlar" icon={<Tag className="size-5" />} testid="surplus-specs">
      <dl className="divide-y divide-[#f0f2f7] overflow-hidden rounded-2xl border border-[#eceff5]">
        {rows.map(([k, v], i) => (
          <div key={k} className={cn("grid grid-cols-[44%_1fr] gap-3 px-3.5 py-2.5", i % 2 ? "bg-[#fafbfd]" : "bg-white")}>
            <dt className="text-[13px] text-[#8b93a7]">{k}</dt>
            <dd className={cn("text-[13.5px] font-medium", v === EMPTY ? "text-[#8b93a7]" : "text-[#1a1d26]")}>{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function DescriptionCard({ l }: { l: SurplusListing }) {
  return (
    <Card title="Tavsif" icon={<Package className="size-5" />} testid="surplus-description">
      {l.description ? (
        <p className="text-[14px] leading-relaxed whitespace-pre-line text-[#374151]">{l.description}</p>
      ) : (
        <Neutral>{EMPTY} Batafsil tavsif qo‘shilmagan.</Neutral>
      )}
      <p className="mt-4 text-[13px] font-semibold text-[#1a1d26]">Sotuvchi izohi</p>
      <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-[#4b5568]">{l.note || EMPTY}</p>
    </Card>
  );
}

function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const z = 15;
  const n = 2 ** z;
  const px = ((lng + 180) / 360) * n * 256;
  const rad = (lat * Math.PI) / 180;
  const py = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n * 256;
  const tx = Math.floor(px / 256);
  const ty = Math.floor(py / 256);
  const tiles: { x: number; y: number; left: number; top: number }[] = [];
  for (let dx = -2; dx <= 2; dx++)
    for (let dy = -1; dy <= 1; dy++) tiles.push({ x: tx + dx, y: ty + dy, left: (tx + dx) * 256 - px, top: (ty + dy) * 256 - py });
  return (
    <div className="relative h-[170px] overflow-hidden rounded-2xl bg-[#eef0f2]" data-testid="surplus-map">
      <div className="absolute top-1/2 left-1/2">
        {tiles.map((t) => (
          <img
            key={`${t.x}-${t.y}`}
            src={`https://tile.openstreetmap.org/${z}/${t.x}/${t.y}.png`}
            alt=""
            draggable={false}
            className="absolute size-[256px] max-w-none select-none [filter:saturate(0.6)]"
            style={{ left: t.left, top: t.top }}
          />
        ))}
      </div>
      <MapPin className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-full fill-[#0066FF] text-white drop-shadow" strokeWidth={1.6} />
      <span className="absolute right-1 bottom-0.5 text-[9px] text-[#4b5568]">© OpenStreetMap</span>
    </div>
  );
}

function LocationCard({ l }: { l: SurplusListing }) {
  const hasPin = l.lat != null && l.lng != null;
  const mapHref = hasPin ? `https://yandex.uz/maps/?pt=${l.lng},${l.lat}&z=16&l=map` : "";
  return (
    <Card title="Joylashuv" icon={<MapPin className="size-5" />} testid="surplus-location">
      <dl className="space-y-2 text-[13.5px]">
        <div className="flex justify-between gap-3">
          <dt className="text-[#8b93a7]">Shahar</dt>
          <dd className="font-medium text-[#1a1d26]">{l.city || EMPTY}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#8b93a7]">Tuman</dt>
          <dd className={cn("font-medium", l.district ? "text-[#1a1d26]" : "text-[#8b93a7]")}>{l.district || EMPTY}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-[#8b93a7]">Olib ketish joyi</dt>
          <dd className={cn("text-right font-medium", l.address ? "text-[#1a1d26]" : "text-[#8b93a7]")}>{l.address || "Aniqlanmoqda"}</dd>
        </div>
      </dl>
      <div className="mt-3">
        {hasPin ? (
          <>
            <MiniMap lat={l.lat as number} lng={l.lng as number} />
            <a href={mapHref} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0066FF]">
              <ExternalLink className="size-3.5" />
              Xaritada ochish
            </a>
          </>
        ) : (
          <Neutral>Xaritadagi nuqta: Aniqlanmoqda — aniq joy sotuvchi bilan kelishiladi.</Neutral>
        )}
      </div>
    </Card>
  );
}

function SellerCard({ l }: { l: SurplusListing }) {
  return (
    <Card title="Sotuvchi" icon={<User className="size-5" />} testid="surplus-seller" className="border border-transparent lg:border-[#eceff5]">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[15px] font-bold text-[#0066FF]">{initials(l.seller)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-[#1a1d26]">{sellerLine(l)}</p>
          <p className="mt-0.5 text-[12.5px] text-[#8b93a7]">Doktor · shaxsiy ortiqcha</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Reyting" value="Hali baho yo‘q" muted />
        <Stat label="Bitimlar" value={EMPTY} muted />
        <Stat label="Shahar" value={l.city || EMPTY} muted={!l.city} />
      </div>
      {l.mine ? (
        <p className="mt-3 rounded-2xl bg-[#f5f8ff] px-3.5 py-2.5 text-[12.5px] text-[#4b5568]">
          Telefon: <span className="font-semibold text-[#1a1d26]">{l.phone || EMPTY}</span>
          {l.telegram ? <> · Telegram: <span className="font-semibold text-[#1a1d26]">{l.telegram}</span></> : null}
          <span className="mt-0.5 block text-[11.5px] text-[#8b93a7]">Faqat siz ko‘rasiz. So‘rovni qabul qilganingizdan keyin xaridorga ochiladi.</span>
        </p>
      ) : (
        <>
          <p className="mt-3 text-[13px]"><RevealPhone kind="surplus" id={l.id} /></p>
          <p className="mt-2"><ReportButton kind="surplus" id={l.id} /></p>
          <p className="mt-2 text-[12px] text-[#8b93a7]">Video moderator tasdig‘idan keyin «Jonli video» belgisi chiqadi.</p>
        </>
      )}
    </Card>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-2xl bg-[#f5f7fb] px-2 py-2.5">
      <p className={cn("truncate text-[12.5px] font-bold", muted ? "text-[#8b93a7]" : "text-[#1a1d26]")}>{value}</p>
      <p className="mt-0.5 text-[11px] text-[#8b93a7]">{label}</p>
    </div>
  );
}

function ReviewsCard() {
  return (
    <Card title="Sharhlar" icon={<Star className="size-5" />} testid="surplus-reviews">
      <Neutral>Hali sharh yo‘q. Sharhlar bitim tugagach paydo bo‘ladi.</Neutral>
    </Card>
  );
}

function SafetyCard() {
  return (
    <Card title="Xavfsiz xarid" icon={<ShieldCheck className="size-5" />} testid="surplus-safety">
      <ul className="space-y-2 text-[13.5px] text-[#4b5568]">
        <li className="flex gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-[#0066FF]" />Yaroqlilik muddatini qadoqda tekshiring.</li>
        <li className="flex gap-2"><Package className="mt-0.5 size-4 shrink-0 text-[#0066FF]" />Ochilgan qadoqda saqlash sharoitini so‘rang.</li>
        <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0066FF]" />Originalligini ko‘rib, keyin to‘lang. Oldindan pul o‘tkazmang.</li>
      </ul>
    </Card>
  );
}

function SimilarCard({ items, desktop }: { items: SurplusListing[]; desktop?: boolean }) {
  return (
    <Card title="O‘xshash e’lonlar" testid="surplus-similar">
      {items.length === 0 ? (
        <Neutral>Hali o‘xshash e’lon yo‘q.</Neutral>
      ) : (
        <div className={cn("grid gap-2.5", desktop ? "grid-cols-4" : "grid-cols-2")}>
          {items.map((x) => (
            <ProductCard
              key={x.id}
              product={listingToProduct(x)}
              variant={desktop ? "desktop" : "mobile"}
              ortiqcha={{ sellerLabel: sellerLine(x), sellerCity: x.city, brandLabel: surplusBrandLabel(x), isMine: Boolean(x.mine), href: `/ortiqcha-material/${x.id}` }}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function useSurplusCart(l: SurplusListing) {
  const cart = useCart();
  const inCart = cart.lines.some((line) => line.productId === l.id);
  return {
    inCart,
    add: () => cart.add(l.id, listingToProduct(l), 1, { source: "ortiqcha", expiryMonths: l.expiryMonths }),
  };
}

function BottomBar({ l, onContact, onEdit }: { l: SurplusListing; onContact: () => void; onEdit: () => void }) {
  const c = useSurplusCart(l);
  return (
    <>
      <div className="h-[84px]" aria-hidden />
      <div
        className="fixed inset-x-0 z-40 border-t border-[#eef0f4] bg-white px-4 pt-2.5 pb-2.5 lg:hidden"
        style={{ bottom: "calc(4.15rem + env(safe-area-inset-bottom))" }}
        data-testid="surplus-bar"
      >
        <div className="mx-auto flex max-w-lg items-center gap-2.5">
          {l.mine ? (
            <>
              <Link href="/ortiqcha-material/elonlarim" className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-[#f2f4f7] text-[15px] font-semibold text-[#1a1d26]">
                Mening e’lonlarim
              </Link>
              <button type="button" onClick={onEdit} className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#0066FF] text-[16px] font-semibold text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)]">
                <PencilLine className="size-5" />
                Tahrirlash
              </button>
            </>
          ) : (
            <>
              {c.inCart ? (
                <Link href="/savat" data-testid="surplus-goto-cart" className="flex h-[52px] w-[42%] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#e8f1ff] text-[15px] font-semibold text-[#0066FF]">
                  <ShoppingBag className="size-5" />
                  Savatda
                </Link>
              ) : (
                <button type="button" onClick={c.add} data-testid="surplus-add" className="flex h-[52px] w-[42%] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#e8f1ff] text-[15px] font-semibold text-[#0066FF]">
                  <ShoppingCart className="size-5" />
                  Savatga
                </button>
              )}
              <button type="button" onClick={onContact} data-testid="surplus-contact" className="flex h-[52px] flex-1 flex-col items-center justify-center rounded-[14px] bg-[#0066FF] leading-tight text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)]">
                <span className="inline-flex items-center gap-1.5 text-[16px] font-semibold">
                  <MessageCircle className="size-[18px]" />
                  Bog‘lanish
                </span>
                <span className="text-[12px] text-white/80">{som(l.price)}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function DesktopActions({ l, onContact, onEdit }: { l: SurplusListing; onContact: () => void; onEdit: () => void }) {
  const c = useSurplusCart(l);
  const favorites = useFavorites();
  const liked = favorites.has(l.id);
  return (
    <div className="flex gap-2.5">
      {l.mine ? (
        <button type="button" onClick={onEdit} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0066FF] text-[15px] font-semibold text-white">
          <PencilLine className="size-5" />
          Tahrirlash
        </button>
      ) : (
        <>
          <button type="button" onClick={onContact} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0066FF] text-[15px] font-semibold text-white">
            <MessageCircle className="size-5" />
            Bog‘lanish
          </button>
          {c.inCart ? (
            <Link href="/savat" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#e8f1ff] text-[15px] font-semibold text-[#0066FF]">
              <ShoppingBag className="size-5" />
              Savatda
            </Link>
          ) : (
            <button type="button" onClick={c.add} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#e8f1ff] text-[15px] font-semibold text-[#0066FF]">
              <ShoppingCart className="size-5" />
              Savatga
            </button>
          )}
        </>
      )}
      <button type="button" aria-label="Sevimlilarga" aria-pressed={liked} onClick={() => favorites.toggle(l.id)} className="grid size-12 place-items-center rounded-2xl border border-[#e6eaf2] bg-white">
        <Heart className={cn("size-5", liked ? "fill-[#f43f5e] text-[#f43f5e]" : "text-[#4b5568]")} />
      </button>
    </div>
  );
}

function DesktopGallery({ l, gallery }: { l: SurplusListing; gallery: string[] }) {
  const [active, setActive] = useState(0);
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  return (
    <div>
      <button
        type="button"
        onClick={() => setZoomAt(active)}
        aria-label="Rasmni kattalashtirish"
        className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-3xl border border-[#eceff5] bg-white"
        data-testid="surplus-desktop-main"
      >
        <img src={gallery[active]} alt={l.name} className="h-full w-full object-contain p-6" />
        {!l.hasPhoto ? <NoPhotoBadge className="absolute bottom-3 left-3" /> : null}
      </button>
      <div className="mt-3 flex flex-wrap gap-2">
        {gallery.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setActive(i)}
            className={cn("size-[72px] overflow-hidden rounded-xl border-2 bg-white", i === active ? "border-[#0066FF]" : "border-[#eceff5]")}
            aria-label={`Rasm ${i + 1}`}
          >
            <img src={src} alt="" className="h-full w-full object-contain p-1" />
          </button>
        ))}
      </div>
      {zoomAt !== null ? <UzumLightbox gallery={gallery} start={zoomAt} name={l.name} onClose={() => setZoomAt(null)} /> : null}
    </div>
  );
}
