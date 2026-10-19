"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { enrollCourse, fetchBooks, fetchCourses, fetchNews, saveLessonDone, type LiveBook, type LiveCourse, type LiveNews } from "@/lib/live-content";
import { formatMoney } from "@/lib/format";

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-[26px] font-extrabold tracking-tight text-[#0B1F4D]">{title}</h1>
      {children}
    </article>
  );
}

export function CatalogDetail({ id, expect }: { id: string; expect: "forma" | "jihozlar" }) {
  const { add } = useCart();
  const [card, setCard] = useState<CatalogCard | null | undefined>(undefined);
  useEffect(() => {
    let stop = false;
    void fetch(`/api/catalog/${id}`, { credentials: "same-origin" })
      .then((res) => res.json())
      .then((json: { ok?: boolean; product?: Record<string, unknown> }) => {
        if (stop) return;
        if (!json.ok || !json.product || json.product.category !== expect) {
          setCard(null);
          return;
        }
        const raw = json.product;
        setCard({
          id: String(raw.id),
          name: String(raw.name ?? ""),
          brand: String(raw.brand ?? ""),
          brandKey: "",
          category: String(raw.category ?? ""),
          price: Number(raw.price) || 0,
          oldPrice: Number(raw.oldPrice) || undefined,
          discount: Number(raw.discount) || undefined,
          rating: Number(raw.rating) || 0,
          reviews: Number(raw.reviews) || 0,
          inStock: raw.inStock !== false,
          image: typeof raw.image === "string" ? raw.image : "",
          createdAt: "",
          shopId: typeof raw.shopId === "string" ? raw.shopId : "",
          shopName: typeof raw.shopName === "string" ? raw.shopName : "",
          shopSlug: typeof raw.shopSlug === "string" ? raw.shopSlug : "",
          description: typeof raw.description === "string" ? raw.description : "",
          kind: typeof raw.kind === "string" ? raw.kind : "",
          gender: typeof raw.gender === "string" ? raw.gender : "",
          sizes: Array.isArray(raw.sizes) ? raw.sizes.filter((item): item is string => typeof item === "string") : [],
          colors: Array.isArray(raw.colors) ? raw.colors.filter((item): item is string => typeof item === "string") : [],
          images: Array.isArray(raw.images) ? raw.images.filter((item): item is string => typeof item === "string") : [],
          attrs: raw.attrs && typeof raw.attrs === "object" ? (raw.attrs as Record<string, unknown>) : {},
        });
      })
      .catch(() => {
        if (!stop) setCard(null);
      });
    return () => {
      stop = true;
    };
  }, [expect, id]);

  if (card === undefined) return <Shell title="Yuklanmoqda...">{null}</Shell>;
  if (!card) return <Shell title={expect === "forma" ? "Forma topilmadi" : "Jihoz topilmadi"}><Link href={expect === "forma" ? "/forma" : "/jihozlar"} className="text-[#0066FF]">Orqaga</Link></Shell>;
  const months = Number(card.attrs.installmentMonths) || 0;
  return (
    <Shell title={card.name}>
      <p className="mt-1 text-[14px] text-[#6b7280]">{card.brand}{card.shopName ? ` · ${card.shopName}` : ""}</p>
      {card.image ? <img src={card.image} alt="" className="mt-4 max-h-80 rounded-2xl object-contain" /> : null}
      <p className="mt-4 text-[22px] font-extrabold text-[#0066FF]">{formatMoney(card.price, "UZS")}</p>
      {card.description ? <p className="mt-3 text-[15px] leading-relaxed text-[#24344d]">{card.description}</p> : null}
      {card.sizes.length ? <p className="mt-2 text-[14px]">O‘lcham: {card.sizes.join(", ")}</p> : null}
      {card.colors.length ? <p className="mt-1 text-[14px]">Rang: {card.colors.join(", ")}</p> : null}
      {typeof card.attrs.specLine === "string" && card.attrs.specLine ? <p className="mt-2 text-[14px]">{card.attrs.specLine}</p> : null}
      {months > 0 ? <p className="mt-2 text-[14px]">{months} oyga bo‘lib to‘lash</p> : null}
      <button type="button" className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#0066FF] px-4 text-[14px] font-bold text-white" onClick={() => add(card.id, productFromCatalog(card))}>
        Savatga
      </button>
    </Shell>
  );
}

export function BookPage({ id }: { id: string }) {
  const [book, setBook] = useState<LiveBook | null | undefined>(undefined);
  useEffect(() => {
    let stop = false;
    void fetchBooks().then((rows) => {
      if (!stop) setBook(rows.find((item) => item.id === id) ?? null);
    });
    return () => {
      stop = true;
    };
  }, [id]);
  if (book === undefined) return <Shell title="Yuklanmoqda...">{null}</Shell>;
  if (!book) return <Shell title="Kitob topilmadi"><Link href="/kitoblar" className="text-[#0066FF]">Kitoblar</Link></Shell>;
  return (
    <Shell title={book.title}>
      <p className="mt-1 text-[14px] text-[#6b7280]">{book.author}</p>
      {book.cover ? <img src={book.cover} alt="" className="mt-4 h-56 rounded-2xl object-cover" /> : null}
      <p className="mt-3 text-[18px] font-bold">{book.price > 0 ? formatMoney(book.price, "UZS") : "Bepul"}</p>
      {book.progress ? <p className="mt-1 text-[13px] text-[#6b7280]">O‘qilgan: {book.progress.percent}%</p> : null}
      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{book.description}</p>
      <Link href={`/kitoblar/${book.id}/oqish`} className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#0066FF] px-4 text-[14px] font-bold text-white">O‘qish</Link>
    </Shell>
  );
}

export function NewsPage({ id }: { id: string }) {
  const [article, setArticle] = useState<LiveNews | null | undefined>(undefined);
  useEffect(() => {
    let stop = false;
    void fetchNews().then((rows) => {
      if (!stop) setArticle(rows.find((item) => item.id === id) ?? null);
    });
    return () => {
      stop = true;
    };
  }, [id]);
  if (article === undefined) return <Shell title="Yuklanmoqda...">{null}</Shell>;
  if (!article) return <Shell title="Yangilik topilmadi"><Link href="/yangiliklar" className="text-[#0066FF]">Yangiliklar</Link></Shell>;
  return (
    <Shell title={article.title}>
      <p className="mt-1 text-[13px] text-[#6b7280]">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("ru-RU") : ""} {article.tags.join(" · ")}</p>
      {article.cover ? <img src={article.cover} alt="" className="mt-4 max-h-80 w-full rounded-2xl object-cover" /> : null}
      <p className="mt-4 whitespace-pre-wrap text-[16px] leading-relaxed text-[#24344d]">{article.body}</p>
    </Shell>
  );
}

export function CoursePlayer({ id }: { id: string }) {
  const [course, setCourse] = useState<LiveCourse | null | undefined>(undefined);
  const [lesson, setLesson] = useState(0);
  useEffect(() => {
    let stop = false;
    void fetchCourses().then((rows) => {
      if (!stop) setCourse(rows.find((item) => item.id === id) ?? null);
    });
    return () => {
      stop = true;
    };
  }, [id]);
  if (course === undefined) return <Shell title="Yuklanmoqda...">{null}</Shell>;
  if (!course) return <Shell title="Kurs topilmadi"><Link href="/talim" className="text-[#0066FF]">Ta’lim</Link></Shell>;
  const current = course.lessons[lesson];
  return (
    <Shell title={course.title}>
      <p className="mt-1 text-[14px] text-[#6b7280]">{course.teacher} · {course.price > 0 ? formatMoney(course.price, "UZS") : "Bepul"} · {course.progress}%</p>
      {course.cover ? <img src={course.cover} alt="" className="mt-4 max-h-64 rounded-2xl object-cover" /> : null}
      <p className="mt-3 text-[15px] leading-relaxed">{course.description}</p>
      {!course.enrolled ? (
        <button type="button" className="mt-4 h-11 rounded-xl bg-[#0066FF] px-4 text-[14px] font-bold text-white" onClick={() => void enrollCourse(course.id).then((next) => next && setCourse(next))}>
          Kursga yozilish
        </button>
      ) : null}
      {current?.videoUrl ? <video key={current.id} className="mt-4 w-full rounded-2xl bg-black" controls src={current.videoUrl} /> : <p className="mt-4 text-[14px]">Video havola qo‘yilmagan.</p>}
      <ul className="mt-4 space-y-2">
        {course.lessons.length === 0 ? <li>Hozircha dars yo‘q</li> : null}
        {course.lessons.map((item, index) => (
          <li key={item.id}>
            <button type="button" className="text-left text-[14px] font-semibold" onClick={() => setLesson(index)}>
              {item.done ? "✓ " : ""}{item.title}
            </button>
            {course.enrolled && !item.done ? (
              <button type="button" className="ml-3 text-[13px] text-[#0066FF]" onClick={() => void saveLessonDone(course.id, item.id).then((next) => next && setCourse(next))}>
                Ko‘rildi
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </Shell>
  );
}
