"use client";

import { useSeminarRegs } from "@/components/seminar-provider";
import { AdBanner } from "@/components/ad-banner";
import { ProductImageFrame, listingImageFit } from "@/components/product-image-frame";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  FlaskConical,
  Heart,
  MessageCircle,
  Package,
  Play,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { MobileHome } from "@/components/home/mobile-home";
import { RegisterCta } from "@/components/seminar-card";
import { useCart } from "@/components/cart-provider";
import { useCommunityWork } from "@/components/community-provider";
import { communityHref } from "@/data/community";
import { videoLessonHref, videoLessons } from "@/data/education";
import { quickCategories } from "@/data/home";
import { productHref, productOldPrice, specialOfferProducts, type Product } from "@/data/products";
import { seminarDayMonth, seminarHref, upcomingSeminars } from "@/data/seminars";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const panel =
  "rounded-2xl border border-slate-100/90 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.045)]";

export function HomeDashboard() {
  return (
    <>
      <AdBanner placement="home" className="mb-4 hidden lg:block" />
      <MobileHome />
      <div className="hidden min-h-full flex-col gap-4 lg:flex">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1.48fr)_minmax(352px,0.94fr)] xl:grid-rows-[minmax(208px,auto)_1fr]">
          <HeroBanner />
          <ImplantPromo />
          <HomeSeminars />
          <div className="flex min-h-0 flex-col gap-4">
            <QuickCategories />
            <HomeOffers />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.72fr)_minmax(280px,1fr)]">
          <HomeVideos />
          <HomeCommunity />
          <MarketingPromo />
        </div>
        <HomeFooter />
      </div>
    </>
  );
}

function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#4b86ff_0%,#2f6bff_42%,#2563eb_100%)] text-white shadow-[0_12px_32px_rgba(37,99,235,0.2)]">
      <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute top-4 right-[42%] size-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-16 bottom-[-36px] size-40 rounded-full bg-white/10" />
      <Sparkles className="pointer-events-none absolute top-8 right-[38%] size-3.5 text-white/80" />
      <Sparkles className="pointer-events-none absolute top-16 right-32 size-3 text-white/50" />

      <div className="relative z-10 flex min-h-[208px] items-center py-6 pr-6 pl-7 md:pr-[300px]">
        <div className="max-w-[32rem]">
          <h1 className="text-[28px] leading-[1.18] font-bold tracking-tight xl:text-[30px]">
            Stomatologlar uchun barcha narsa bir joyda
          </h1>
          <p className="mt-3 max-w-[26rem] text-[13.5px] leading-relaxed text-white/88">
            Jihozlar, materiallar, ta’lim, hamjamiyat va marketing — klinikangizni rivojlantirish
            uchun to‘liq yechim.
          </p>
          <a
            href="#tezkor-kategoriyalar"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-5 h-10 rounded-full border-0 bg-white px-5 text-[13.5px] font-semibold text-primary shadow-none hover:bg-white/92"
            )}
          >
            Batafsil ko‘rish
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>

      <div className="pointer-events-none absolute right-2 bottom-0 hidden aspect-[5/4] w-[min(300px,34%)] md:block">
        <Image
          src="/images/hero-3d.png"
          alt="Implant va tish 3D modeli"
          fill
          priority
          sizes="300px"
          className="object-contain object-right-bottom"
        />
      </div>
    </section>
  );
}

function ImplantPromo() {
  return (
    <Link
      href="/marketplace?cat=implantlar"
      className={cn(panel, "relative flex min-h-[208px] overflow-hidden px-5 py-4")}
    >
      <span className="absolute top-4 right-4 rounded-full bg-[#e8f1ff] px-2.5 py-0.5 text-[11px] font-semibold text-primary">
        Yangi
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center pr-3">
        <h2 className="text-[17px] font-bold tracking-tight">Implant yetkazib berish</h2>
        <p className="mt-2 max-w-[15.5rem] text-[13px] leading-relaxed text-muted-foreground">
          Sifatli implant tizimlari yetakchi brendlardan.
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          Buyurtma berish
          <ArrowRight className="size-4" />
        </span>
      </div>
      <div className="relative h-[128px] w-[120px] shrink-0 self-center">
        <span className="absolute top-0 right-0 z-10">
          <SwirlMark />
        </span>
        <Image
          src="/images/implant-cutout.png"
          alt=""
          width={200}
          height={640}
          className="h-full w-full object-contain object-bottom"
        />
      </div>
    </Link>
  );
}

function SwirlMark() {
  return (
    <span className="flex size-10 items-center justify-center rounded-full bg-[#e7f8fc]">
      <svg viewBox="0 0 32 32" className="size-[22px]" aria-hidden="true">
        <path
          d="M16 4.8c6.4 0 11.4 4.2 11.4 9.6 0 4.8-3.8 8.7-9 9.6"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M16 9.6c3.6 0 6.4 2.3 6.4 5.2S19.6 20 16 20s-6.4-2.3-6.4-5.2"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="16" cy="14.8" r="2.2" fill="#0891b2" />
      </svg>
    </span>
  );
}

function HomeSeminars() {
  useSeminarRegs(); // re-render when organizer-created seminars finish loading
  const items = upcomingSeminars(3);

  return (
    <section className={cn(panel, "h-full p-4")}>
      <SectionHead title="Bugungi seminarlar" href="/seminarlar" />
      <div className="grid grid-cols-3 gap-3">
        {items.map((seminar) => (
          <article key={seminar.id} className="overflow-hidden rounded-xl bg-[#f4f6fa]">
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
              <Link href={seminarHref(seminar.id)} className="absolute inset-0 block">
                <Image
                  src={seminar.image}
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 33vw, 20vw"
                  className="object-cover object-center"
                />
              </Link>
              <span className="absolute bottom-2 left-2 z-10 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold text-primary shadow-sm">
                {seminarDayMonth(seminar.date)}
              </span>
            </div>
            <div className="p-2.5">
              <h3 className="line-clamp-2 min-h-9 text-[13px] font-semibold leading-snug">
                <Link href={seminarHref(seminar.id)} className="hover:text-primary">
                  {seminar.title}
                </Link>
              </h3>
              <p className="mt-1.5 text-[12px] text-muted-foreground">
                {seminar.speaker} · {seminar.time}
              </p>
              <RegisterCta seminar={seminar} home />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function QuickCategories() {
  return (
    <section id="tezkor-kategoriyalar" className={cn(panel, "scroll-mt-6 p-4")}>
      <SectionHead title="Tezkor kategoriyalar" href="/marketplace" />
      <div className="grid grid-cols-6 gap-1">
        {quickCategories.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-1.5 rounded-xl py-1 text-center hover:bg-slate-50"
          >
            <span className={cn("flex size-11 items-center justify-center rounded-xl", item.tone)}>
              <CategoryIcon name={item.icon} />
            </span>
            <span className="text-[11px] leading-tight font-medium text-slate-600">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CategoryIcon({ name }: { name: string }) {
  const stroke = { fill: "none" as const, stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "chair") {
    return (
      <svg viewBox="0 0 24 24" className="size-[18px]" {...stroke}>
        <path d="M7 13h10l.8 4.2H6.2L7 13Z" />
        <path d="M8 13V8.5A2.5 2.5 0 0 1 10.5 6H13" />
        <path d="M16 6.5v4" />
        <path d="M8 17.2v2.3M16 17.2v2.3" />
      </svg>
    );
  }
  if (name === "package") return <Package className="size-[18px]" strokeWidth={1.7} />;
  if (name === "tools") {
    return (
      <svg viewBox="0 0 24 24" className="size-[18px]" {...stroke}>
        <path d="M8 4v16" />
        <path d="M8 8c2.2 0 3.5 1.2 3.5 3S10.2 14 8 14" />
        <path d="M16 20V8.5c0-2 1.4-3.5 3.2-3.5" />
      </svg>
    );
  }
  if (name === "flask") return <FlaskConical className="size-[18px]" strokeWidth={1.7} />;
  if (name === "clock") return <Clock className="size-[18px]" strokeWidth={1.7} />;
  return <Sparkles className="size-[18px]" strokeWidth={1.7} />;
}

function HomeOffers() {
  const offers = specialOfferProducts(3);

  return (
    <section className={cn(panel, "flex-1 p-4")}>
      <SectionHead title="Maxsus takliflar" href="/marketplace" />
      <div className="grid grid-cols-3 gap-2.5">
        {offers.map((product) => (
          <OfferCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function OfferCard({ product }: { product: Product }) {
  const { add } = useCart();
  const href = productHref(product);
  const oldPrice = productOldPrice(product);
  const fit = listingImageFit(product.image);

  return (
    <article className="group flex min-w-0 flex-col rounded-xl border border-slate-200/90 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
      <Link href={href} className="block" aria-label={product.name}>
        <ProductImageFrame
          src={product.image}
          alt={product.name}
          category={product.category}
          fit={fit}
          className="rounded-lg"
          imgClassName={cn(
            "transition-transform duration-300 group-hover:scale-[1.03]",
            fit === "contain" && "p-2.5 mix-blend-multiply",
          )}
        >
          {product.discount ? (
            <span className="absolute top-1.5 left-1.5 z-10 rounded-md bg-[#22c55e] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
              -{product.discount}%
            </span>
          ) : null}
        </ProductImageFrame>
      </Link>
      <p className="mt-2 truncate text-[10.5px] text-muted-foreground">{product.brand}</p>
      <h3 className="mt-0.5 line-clamp-2 min-h-8 text-[12px] font-semibold leading-snug">
        <Link href={href} className="hover:text-primary">
          {product.name}
        </Link>
      </h3>
      <div className="mt-auto pt-1.5">
        <p className="truncate text-[13px] font-bold leading-tight text-[#0066FF]">
          {formatMoney(product.price, "UZS")}
        </p>
        <p className="mt-0.5 min-h-[14px] truncate text-[10.5px] leading-tight text-[#9aa3b2] line-through">
          {oldPrice ? formatMoney(oldPrice, "UZS") : null}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        className="mt-2 h-8 w-full !rounded-lg px-2 text-[11.5px] font-semibold"
        onClick={() => add(product.id)}
      >
        <ShoppingCart className="size-3.5" />
        Savatga
      </Button>
    </article>
  );
}

function HomeVideos() {
  return (
    <section className={cn(panel, "p-4")}>
      <SectionHead title="Video darslar" href="/talim" />
      <div className="grid grid-cols-2 gap-3">
        {videoLessons.map((video) => (
          <Link key={video.id} href={videoLessonHref(video.id)} className="overflow-hidden rounded-xl bg-[#f4f6fa]">
            <div className="relative aspect-video overflow-hidden bg-slate-100">
              <Image
                src={video.image}
                alt=""
                fill
                sizes="(max-width: 1280px) 40vw, 22vw"
                className="object-cover object-center"
              />
              <span className="pointer-events-none absolute inset-0 m-auto flex size-9 items-center justify-center rounded-full bg-black/50 text-white">
                <Play className="ml-0.5 size-4 fill-white" />
              </span>
              <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {video.duration}
              </span>
            </div>
            <p className="line-clamp-2 p-2.5 text-[12.5px] font-semibold leading-snug">{video.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HomeCommunity() {
  const { feed, toggleLike } = useCommunityWork();
  const post = feed[0];
  if (!post) return null;
  const liked = Boolean(post.likedByMe);
  const likes = post.likes;

  return (
    <section className={cn(panel, "p-4")}>
      <SectionHead title="Community" href="/community" />
      <article>
        <Link href={communityHref(post.id)} className="flex items-center gap-2.5">
          {post.author.avatar ? (
            <Image
              src={post.author.avatar}
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-[#dbeafe] text-[11px] font-semibold text-primary">
              {post.author.name.replace("Dr. ", "").slice(0, 2)}
            </span>
          )}
          <span>
            <span className="block text-sm font-semibold text-[#1a1d26]">{post.author.name}</span>
            <span className="block text-[11px] text-muted-foreground">{post.time}</span>
          </span>
        </Link>
        <p className="mt-3 line-clamp-4 text-[13px] leading-relaxed text-slate-600">{post.text}</p>
        <div className="mt-4 flex items-center gap-4 text-[12px] text-muted-foreground">
          <button
            type="button"
            onClick={() => void toggleLike(post.id)}
            className={cn("inline-flex items-center gap-1 hover:text-[#f43f5e]", liked && "text-[#f43f5e]")}
          >
            <Heart className={cn("size-3.5", liked && "fill-[#f43f5e]")} /> {likes}
          </button>
          <Link href={communityHref(post.id)} className="inline-flex items-center gap-1 hover:text-primary">
            <MessageCircle className="size-3.5" /> {post.comments}
          </Link>
          <Link href={communityHref(post.id)} className="ml-auto font-medium text-primary hover:underline">
            Javob berish
          </Link>
        </div>
      </article>
    </section>
  );
}

function MarketingPromo() {
  return (
    <Link
      href="/marketing"
      className="relative grid min-h-[172px] overflow-hidden rounded-2xl bg-[#e8f1ff] shadow-[0_6px_24px_rgba(15,23,42,0.045)] sm:grid-cols-[minmax(0,1.15fr)_minmax(140px,0.85fr)]"
    >
      <span className="absolute top-4 right-4 z-10 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-primary">
        Yangi xizmat!
      </span>
      <div className="relative z-10 flex flex-col justify-center px-5 py-5">
        <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
          Klinikangiz dizayni va marketingi
        </h2>
        <p className="mt-2 max-w-[18rem] text-[13px] leading-relaxed text-slate-600">
          Bemoringiz izlanishini va brendingizni bizga ishonib topshiring
        </p>
        <span
          className={cn(
            buttonVariants({ size: "sm" }),
            "mt-4 w-fit rounded-full bg-white text-[12.5px] font-semibold text-primary hover:bg-white/90"
          )}
        >
          Xizmatlar bilan tanishing
        </span>
      </div>
      <div className="relative min-h-[140px] sm:min-h-0">
        <Image
          src="/images/product-unit.png"
          alt=""
          fill
          sizes="(max-width: 1280px) 40vw, 22vw"
          className="object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-[linear-gradient(90deg,#e8f1ff,transparent)]" />
      </div>
    </Link>
  );
}

function HomeFooter() {
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 px-1 pt-2 pb-0 text-[12px] text-muted-foreground">
      <p>© 2026 StomaHub. Barcha huquqlar himoyalangan.</p>
      <p className="flex gap-4">
        <Link href="/shartlar" className="hover:text-primary hover:underline">Shartlar</Link>
        <Link href="/maxfiylik" className="hover:text-primary hover:underline">Maxfiylik siyosati</Link>
        <span>Yordam</span>
      </p>
    </footer>
  );
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      <Link href={href} className="text-[13px] font-medium text-primary hover:underline">
        Hammasi
      </Link>
    </div>
  );
}
