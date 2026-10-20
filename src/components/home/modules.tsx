"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Play } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/ui";
import { ProductCard } from "@/components/product-card";
import { SeminarCard } from "@/components/seminar-card";
import { useSellerWork } from "@/components/seller-provider";
import { buttonVariants } from "@/components/ui/button";
import { communityPosts, videos } from "@/data/feed";
import { seminars } from "@/data/seminars";
import { cn } from "@/lib/utils";

export function SeminarsAndOffers() {
  const { catalog } = useSellerWork();
  const offers = catalog.slice(0, 3);
  return (
    <section className="grid grid-cols-[1.15fr_0.85fr] gap-4">
      <div>
        <SectionHeader title="Bugungi seminarlar" href="/seminarlar" />
        {seminars.filter((item) => !item.featured).length === 0 ? (
          <p className="text-sm text-muted-foreground">Hozircha seminar yo‘q</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {seminars
              .filter((item) => !item.featured)
              .slice(0, 3)
              .map((seminar) => (
                <SeminarCard key={seminar.id} seminar={seminar} />
              ))}
          </div>
        )}
      </div>
      <div>
        <SectionHeader title="Maxsus takliflar" href="/marketplace" />
        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hozircha mahsulot yo‘q</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {offers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function VideosCommunityMarketing() {
  return (
    <section className="grid grid-cols-[1.1fr_0.7fr_0.9fr] gap-4">
      <div>
        <SectionHeader title="Video darslar" href="/talim" />
        <div className="grid grid-cols-3 gap-3">
          {videos.map((video) => (
            <Link
              key={video.id}
              href="/talim"
              className="overflow-hidden rounded-2xl border border-border bg-white"
            >
              <div className="relative">
                <Image
                  src={video.image}
                  alt=""
                  width={400}
                  height={220}
                  className="h-28 w-full object-cover"
                />
                <span className="absolute inset-0 m-auto flex size-9 items-center justify-center rounded-full bg-black/55 text-white">
                  <Play className="size-4 fill-white" />
                </span>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-[13px] font-semibold">{video.title}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">{video.speaker}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader title="Community" href="/community" action="Barchasini ko‘rish" />
        {communityPosts.slice(0, 1).map((post) => (
          <article key={post.id} className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center gap-2.5">
              {post.author.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {post.author.name.replace("Dr. ", "").slice(0, 1)}
                </span>
              )}
              <div>
                <p className="text-sm font-semibold">{post.author.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {post.author.specialty} · {post.time}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{post.text}</p>
            <div className="mt-3 flex items-center gap-4 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3.5" /> {post.likes}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3.5" /> {post.comments} · Javob berish
              </span>
            </div>
          </article>
        ))}
      </div>

      <Link
        href="/marketing"
        className="relative overflow-hidden rounded-2xl bg-[#eef4ff] p-5"
      >
        <p className="text-sm font-semibold text-primary">Yangi xizmat</p>
        <h3 className="mt-1 text-lg font-bold text-foreground">Klinikangiz uchun dizayn</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
          Logo, vizitka, Instagram post, veb-sayt va yana ko‘p imkoniyatlar.
        </p>
        <span className={cn(buttonVariants({ size: "sm" }), "mt-4")}>Dizayn yaratish</span>
        <div className="pointer-events-none mt-4 grid grid-cols-2 gap-2 opacity-90">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-[10px] font-bold tracking-wide text-primary">SMILE CLINIC</p>
            <p className="mt-2 h-8 rounded bg-slate-100" />
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400">Instagram</p>
            <p className="mt-2 h-8 rounded bg-primary/10" />
          </div>
        </div>
      </Link>
    </section>
  );
}

export function TrustBar() {
  const items = [
    "Tez yetkazib berish",
    "Rasmiy distribyutorlar",
    "Xavfsiz to‘lov",
    "Sertifikatlangan mahsulotlar",
    "24/7 qo‘llab-quvvatlash",
  ];
  return (
    <footer className="mt-2 flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-3 text-[12px] text-muted-foreground">
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
      <p>Namuna ma’lumot · To‘lov hozircha yo‘q</p>
    </footer>
  );
}
