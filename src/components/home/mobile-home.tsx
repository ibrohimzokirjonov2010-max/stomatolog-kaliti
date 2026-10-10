"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Download,
  Filter,
  FlaskConical,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { ProductImageFrame, listingImageFit } from "@/components/product-image-frame";
import { useCart } from "@/components/cart-provider";
import { useMobileNav } from "@/components/dashboard/mobile-chrome";
import { MobileSectionHeader, mobileHeaderActionCls } from "@/components/mobile-section-header";
import { useCommunityWork } from "@/components/community-provider";
import { useSeminarRegs } from "@/components/seminar-provider";
import { communityHref } from "@/data/community";
import { quickCategories } from "@/data/home";
import { specialOfferProducts, productHref, productOldPrice, type Product } from "@/data/products";
import { seminarHref, seminarDayMonth, upcomingSeminars, type Seminar } from "@/data/seminars";
import { videoLessons, videoLessonHref } from "@/data/education";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PromoSlider, type PromoSlide } from "@/components/promo-slider";

/* ── Mobile Home ─────────────────────────────────────────────── */
export function MobileHome() {
  return (
    <div className="flex flex-col gap-5 lg:hidden">
      <MobileSectionHeader title="Bosh sahifa" subtitle="Stomatologlar uchun barcha narsa bir joyda" extra={<HomeMenuButton />} className="-mb-2" />
      <MobileSearch />
      <MobileHero />
      <MobileSeminars />
      <MobileCategories />
      <MobileOffers />
      <MobileCommunity />
      <MobileVideos />
      <MobileMarketingBanner />
    </div>
  );
}

/** Opens the section drawer (all StomaHub sections) — the old top bar's logo button. */
function HomeMenuButton() {
  const { open, setOpen } = useMobileNav();
  return (
    <button type="button" aria-label="Barcha bo‘limlar" aria-expanded={open} onClick={() => setOpen(!open)} className={mobileHeaderActionCls}>
      <Menu className="size-5" />
    </button>
  );
}

/* ── 1. Search ───────────────────────────────────────────────── */
function MobileSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  }

  return (
    <form onSubmit={onSearch} className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#8b93a7]" />
      <input
        data-section-search
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Stomatologga nima kerak?"
        className="h-[48px] w-full rounded-2xl border border-[#e8eef4] bg-[#f7f8fb] pr-12 pl-11 text-[15px] text-[#1a1d26] outline-none placeholder:text-[#8b93a7] focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15"
      />
      <button
        type="button"
        onClick={() => router.push(query.trim() ? `/marketplace?q=${encodeURIComponent(query.trim())}` : "/marketplace")}
        className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[#8b93a7]"
        aria-label="Filtr"
      >
        <Filter className="size-[18px]" />
      </button>
    </form>
  );
}

/* ── 2. Hero slider (Poster Dizayner: 3 slides, shared PromoSlider) ── */
const HOME_SLIDES: PromoSlide[] = [
  {
    id: "seminarlar",
    title: "Qo‘yilgan seminarlar",
    subtitle: "Bugungi va kelgusi tadbirlar",
    cta: "Seminarlarga o‘tish",
    href: "/seminarlar",
    ctaTone: "white",
    image: "/images/bosh/bosh-slayd-seminarlar-mobil.webp",
    desktopImage: "/images/bosh/bosh-slayd-seminarlar.webp",
    alt: "Implantologiya bo‘yicha seminar zali",
  },
  {
    id: "bonus",
    title: "Marketplace’da 10 000 so‘m bonus",
    subtitle: "Birinchi buyurtmangizga",
    cta: "Bonusni olish",
    href: "/bonuslarim",
    image: "/images/bosh/bosh-slayd-bonus-mobil.webp",
    desktopImage: "/images/bosh/bosh-slayd-bonus.webp",
    alt: "Sovg‘a qutisi va stomatologik materiallar",
  },
  {
    id: "forma",
    title: "Stomatologlar uchun forma",
    subtitle: "Kostyum, xalat, poyabzal",
    cta: "Formani ko‘rish",
    href: "/forma",
    image: "/images/bosh/bosh-slayd-forma-mobil.webp",
    desktopImage: "/images/bosh/bosh-slayd-forma.webp",
    alt: "Rangli stomatolog formalari va oq xalat",
  },
];

function MobileHero() {
  return <PromoSlider slides={HOME_SLIDES} testId="home-hero" label="Bosh sahifa takliflari" className="mb-0" />;
}

/* ── 3. Seminars ─────────────────────────────────────────────── */
function MobileSeminars() {
  const items = upcomingSeminars(6);
  const { liveSeminar } = useSeminarRegs();

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-bold tracking-tight text-[#1a1d26]">Bugungi seminarlar</h2>
        <Link href="/seminarlar" className="text-[13px] font-semibold text-[#0066FF]">
          Barchasi &gt;
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#8b93a7]">Yaqin seminar yo&apos;q.</p>
      ) : (
        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((seminar) => (
            <li key={seminar.id} className="w-[min(72vw,260px)] shrink-0 snap-start">
              <SeminarPeek seminar={liveSeminar(seminar)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SeminarPeek({ seminar }: { seminar: Seminar }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
      <div className="relative">
        <Link href={seminarHref(seminar.id)}>
          <Image
            src={seminar.image}
            alt=""
            width={320}
            height={160}
            className="h-[100px] w-full object-cover"
          />
        </Link>
        <span className="absolute top-2 left-2 rounded-md bg-[#0066FF] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
          {seminarDayMonth(seminar.date)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <Link
          href={seminarHref(seminar.id)}
          className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#1a1d26]"
        >
          {seminar.title}
        </Link>
        <Link
          href={seminarHref(seminar.id)}
          className="mt-2 text-[12px] font-medium text-[#0066FF]"
        >
          Ro&apos;yxatdan o&apos;tish
        </Link>
      </div>
    </article>
  );
}

/* ── 4. Quick Categories (3×2 grid matching mock) ────────────── */
function MobileCategories() {
  return (
    <section>
      <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#1a1d26]">
        Tezkor kategoriyalar
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {quickCategories.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-3.5 shadow-[0_1px_4px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-md"
          >
            <span
              className={cn(
                "grid size-[52px] place-items-center rounded-2xl",
                CATEGORY_IMG[item.label] ? "bg-[#e8f1ff]" : item.tone
              )}
            >
              {CATEGORY_IMG[item.label] ? (
                <Image src={CATEGORY_IMG[item.label]} alt="" width={40} height={40} className="size-10 object-contain" />
              ) : (
                <CategoryIcon name={item.icon} />
              )}
            </span>
            <span className="text-[12px] font-semibold text-[#4b5568]">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Poster Dizayner icons (512 PNG → 128px, blue #0066FF) shown ~40px inside the light card. */
const CATEGORY_IMG: Record<string, string> = {
  Jihozlar: "/icons/bosh/jihozlar-128.png",
  Materiallar: "/icons/bosh/materiallar-128.png",
  Instrumentlar: "/icons/bosh/instrumentlar-128.png",
};

function CategoryIcon({ name }: { name: string }) {
  const cls = "size-[20px]";
  const sw = 1.8;
  if (name === "chair") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 13h10l.8 4.2H6.2L7 13Z" />
        <path d="M8 13V8.5A2.5 2.5 0 0 1 10.5 6H13" />
        <path d="M16 6.5v4" />
        <path d="M8 17.2v2.3M16 17.2v2.3" />
      </svg>
    );
  }
  if (name === "package") return <Package className={cls} strokeWidth={sw} />;
  if (name === "tools") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 4v16" />
        <path d="M8 8c2.2 0 3.5 1.2 3.5 3S10.2 14 8 14" />
        <path d="M16 20V8.5c0-2 1.4-3.5 3.2-3.5" />
      </svg>
    );
  }
  if (name === "flask") return <FlaskConical className={cls} strokeWidth={sw} />;
  if (name === "clock") return <Clock className={cls} strokeWidth={sw} />;
  return <Sparkles className={cls} strokeWidth={sw} />;
}

/* ── 5. Offers — Marketplace-style portrait cards ─────────────── */
function MobileOffers() {
  const offers = specialOfferProducts(4);
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-bold tracking-tight text-[#1a1d26]">Maxsus takliflar</h2>
        <Link href="/marketplace" className="text-[13px] font-semibold text-[#0066FF]">
          Barchasi &gt;
        </Link>
      </div>
      {offers.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#8b93a7]">Hozircha taklif yo&apos;q.</p>
      ) : (
        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {offers.map((product) => (
            <li key={product.id} className="flex w-[min(44vw,180px)] shrink-0 snap-start">
              <MobileOfferCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MobileOfferCard({ product }: { product: Product }) {
  const { add } = useCart();
  const href = productHref(product);
  const oldPrice = productOldPrice(product);
  const fit = listingImageFit(product.image);

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-2xl border border-[#eceff5] bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <Link href={href} className="block overflow-hidden rounded-xl" aria-label={product.name}>
        <ProductImageFrame
          src={product.image}
          alt={product.name}
          category={product.category}
          fit={fit}
          className="rounded-xl"
          imgClassName={fit === "contain" ? "p-3 mix-blend-multiply" : undefined}
        >
          {product.discount ? (
            <span className="absolute top-1.5 left-1.5 z-10 rounded-md bg-[#22c55e] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-sm">
              -{product.discount}%
            </span>
          ) : null}
        </ProductImageFrame>
      </Link>
      <Link href={href} className="mt-2 block min-w-0">
        <p className="truncate text-[11px] text-[#8b93a7]">{product.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-[36px] text-[13px] font-bold leading-snug text-[#1a1d26]">
          {product.name}
        </h3>
      </Link>
      <div className="mt-auto pt-1.5">
        <p className="truncate text-[14px] font-bold leading-tight text-[#0066FF]">
          {formatMoney(product.price, "UZS")}
        </p>
        <p className="mt-0.5 min-h-[15px] truncate text-[11px] text-[#9aa3b2] line-through">
          {oldPrice ? formatMoney(oldPrice, "UZS") : null}
        </p>
      </div>
      <button
        type="button"
        onClick={() => add(product.id)}
        className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0066FF] text-[13px] font-semibold text-white active:bg-[#0055dd]"
      >
        <ShoppingCart className="size-3.5" />
        Savatga
      </button>
    </article>
  );
}

/* ── 6. Community ────────────────────────────────────────────── */
function MobileCommunity() {
  const { feed } = useCommunityWork();
  const post = feed[0];
  if (!post) return null;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-bold tracking-tight text-[#1a1d26]">Community</h2>
        <Link href="/community" className="text-[13px] font-semibold text-[#0066FF]">
          Ko&apos;rish
        </Link>
      </div>
      <Link href={communityHref(post.id)} className="mt-3 flex items-center gap-3">
        {post.author.avatar ? (
          <Image
            src={post.author.avatar}
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-11 place-items-center rounded-full bg-[#dbeafe] text-[12px] font-semibold text-[#0066FF]">
            {post.author.name.replace("Dr. ", "").slice(0, 2)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold text-[#1a1d26]">{post.author.name}</span>
          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-[#6b7280]">{post.text}</span>
        </span>
      </Link>
    </section>
  );
}

/* ── 7. Video darslar ────────────────────────────────────────── */
function MobileVideos() {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-bold tracking-tight text-[#1a1d26]">Video darslar</h2>
        <Link href="/talim" className="text-[13px] font-semibold text-[#0066FF]">
          Barchasi &gt;
        </Link>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videoLessons.map((video) => (
          <li key={video.id} className="w-[min(72vw,240px)] shrink-0 snap-start">
            <Link href={videoLessonHref(video.id)} className="block overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
              <div className="relative">
                <Image
                  src={video.image}
                  alt=""
                  width={320}
                  height={180}
                  className="h-[100px] w-full object-cover"
                />
                <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {video.duration}
                </span>
              </div>
              <p className="line-clamp-2 p-3 text-[13px] font-semibold leading-snug text-[#1a1d26]">{video.title}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── 8. Marketing Banner ─────────────────────────────────────── */
function MobileMarketingBanner() {
  return (
    <Link
      href="/marketing"
      className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-[#0066FF] px-4 py-3.5 text-white shadow-[0_10px_24px_rgba(0,102,255,0.28)]"
    >
      <span className="min-w-0 flex-1 text-[14px] leading-snug font-semibold">
        Marketing bo&apos;yicha bepul qo&apos;llanma yuklab oling
      </span>
      <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-[13px] font-semibold">
        <Download className="size-4" />
        Yuklab olish
      </span>
    </Link>
  );
}
