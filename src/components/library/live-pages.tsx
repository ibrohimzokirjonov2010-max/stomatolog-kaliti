"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { ProductReviewsList, useProductReviews } from "@/components/product-reviews";
import { catalogCardFrom, catalogHref, fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { colorLabel, formaColors, formaGenders, formaKinds } from "@/data/forma";
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

function textAttr(attrs: Record<string, unknown>, key: string) {
  const value = attrs[key];
  return typeof value === "string" ? value.trim() : "";
}

function deliveryLabel(card: CatalogCard) {
  if (card.attrs.freeDelivery === true) return "Bepul yetkazib berish";
  const fee = Number(card.attrs.deliveryPrice);
  if (Number.isFinite(fee) && fee > 0) return `Yetkazib berish: ${formatMoney(fee, "UZS")}`;
  return "";
}

export function CatalogDetail({ id, expect }: { id: string; expect?: "forma" | "jihozlar" }) {
  const { add } = useCart();
  const { profile } = useDoctorProfile();
  const reviews = useProductReviews(id);
  const [card, setCard] = useState<CatalogCard | null | undefined>(undefined);
  const [related, setRelated] = useState<CatalogCard[]>([]);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    setCard(undefined);
    setSize("");
    setColor("");
    setPhoto(0);
    setQty(1);
    setError("");
    void fetch(`/api/catalog/${id}`, { credentials: "same-origin" })
      .then((res) => res.json())
      .then((json: { ok?: boolean; product?: Record<string, unknown> }) => {
        if (stop) return;
        const next = json.ok && json.product ? catalogCardFrom(json.product) : null;
        if (!next || (expect && next.category !== expect)) {
          setCard(null);
          return;
        }
        setCard(next);
        if (next.sizes.length === 1) setSize(next.sizes[0]);
        if (next.colors.length === 1) setColor(next.colors[0]);
      })
      .catch(() => {
        if (!stop) setCard(null);
      });
    void fetchCatalogProducts().then((rows) => {
      if (stop) return;
      setRelated(rows.filter((item) => item.id !== id));
    });
    return () => {
      stop = true;
    };
  }, [expect, id]);

  const back = expect === "forma" ? "/forma" : expect === "jihozlar" ? "/jihozlar" : "/marketplace";
  const missing = expect === "forma" ? "Forma topilmadi" : expect === "jihozlar" ? "Jihoz topilmadi" : "Mahsulot topilmadi";
  if (card === undefined) return <Shell title="Yuklanmoqda...">{null}</Shell>;
  if (!card) return <Shell title={missing}><Link href={back} className="text-[#0066FF]">Orqaga</Link></Shell>;

  const gallery = [card.image, ...card.images].filter((src, index, all) => src && all.indexOf(src) === index);
  const shot = gallery[photo] || gallery[0] || "";
  const short = textAttr(card.attrs, "shortDescription");
  const kind = formaKinds.find((item) => item.id === card.kind)?.label || "";
  const gender = formaGenders.find((item) => item.id === card.gender)?.label || "";
  const delivery = deliveryLabel(card);
  const months = Number(card.attrs.installmentMonths) || 0;
  const specs = [
    ["Ishlab chiqaruvchi", textAttr(card.attrs, "manufacturer")],
    ["Turi", textAttr(card.attrs, "type")],
    ["Rang (material)", textAttr(card.attrs, "color")],
    ["Hajm", textAttr(card.attrs, "volume")],
    ["Qo‘llanish", textAttr(card.attrs, "usage")],
    ["Model", textAttr(card.attrs, "model")],
    ["Xususiyat", textAttr(card.attrs, "specLine")],
  ].filter((row) => row[1]);
  const same = related.filter((item) => item.category === card.category).slice(0, 4);

  function addLine() {
    if (!card) return;
    if (card.sizes.length && !size) {
      setError("O‘lchamni tanlang");
      return;
    }
    if (card.colors.length && !color) {
      setError("Rangni tanlang");
      return;
    }
    setError("");
    add(card.id, productFromCatalog(card), qty, { size: size || undefined, color: color || undefined });
  }

  return (
    <article className="mx-auto max-w-5xl px-4 py-6 pb-28 lg:pb-6" data-testid="product-live">
      <Link href={back} className="text-[13px] font-semibold text-[#0066FF]">Orqaga</Link>
      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div data-testid="product-gallery">
          {shot ? <img src={shot} alt="" className="max-h-[420px] w-full rounded-2xl bg-[#f4f7fc] object-contain" /> : <div className="grid h-64 place-items-center rounded-2xl bg-[#f4f7fc] text-sm text-[#6b7280]" data-testid="product-no-photo">Rasm yo‘q</div>}
          {gallery.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((src, index) => (
                <button key={src} type="button" aria-label={`Rasm ${index + 1}`} className={index === photo ? "rounded-xl ring-2 ring-[#0066FF]" : "rounded-xl"} onClick={() => setPhoto(index)}>
                  <img src={src} alt="" className="h-16 w-16 rounded-xl object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#52637c]" data-testid="product-brand">{card.brand}</p>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-[#0B1F4D]">{card.name}</h1>
          {card.shopName ? (
            <aside className="mt-3 rounded-2xl border border-[#e6edf5] bg-white p-3" data-testid="product-seller">
              <p className="text-[12px] font-semibold text-[#6b7280]">Sotuvchi</p>
              <p className="text-[15px] font-bold text-[#0B1F4D]">{card.shopName}</p>
              {card.shopSlug ? (
                <Link href={`/marketplace/dokon/${card.shopSlug}`} className="mt-1 inline-block text-[13px] font-semibold text-[#0066FF]">
                  Do‘konni ko‘rish
                </Link>
              ) : null}
            </aside>
          ) : null}
          <p className="mt-3 text-[22px] font-extrabold text-[#0066FF]">{formatMoney(card.price, "UZS")}</p>
          {short ? <p className="mt-3 text-[15px] leading-relaxed text-[#24344d]" data-testid="product-short">{short}</p> : null}
          <dl className="mt-4 grid grid-cols-2 gap-2 text-[14px]">
            {card.sku ? <div data-testid="product-sku"><dt className="text-[#6b7280]">SKU</dt><dd className="font-semibold">{card.sku}</dd></div> : null}
            <div data-testid="product-stock"><dt className="text-[#6b7280]">Omborda</dt><dd className="font-semibold">{card.stockQty > 0 ? `${card.stockQty} ta` : "Tugagan"}</dd></div>
            {delivery ? <div data-testid="product-delivery"><dt className="text-[#6b7280]">Yetkazish</dt><dd className="font-semibold">{delivery}</dd></div> : null}
            {kind ? <div data-testid="product-kind"><dt className="text-[#6b7280]">Turi</dt><dd className="font-semibold">{kind}</dd></div> : null}
            {gender ? <div data-testid="product-gender"><dt className="text-[#6b7280]">Kim uchun</dt><dd className="font-semibold">{gender}</dd></div> : null}
          </dl>
          {card.sizes.length ? (
            <div className="mt-4">
              <p className="text-[13px] font-semibold text-[#52637c]">O‘lcham</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {card.sizes.map((item) => (
                  <button key={item} type="button" data-testid={`size-${item}`} className={size === item ? "h-9 rounded-lg bg-[#0066FF] px-3 text-[13px] font-bold text-white" : "h-9 rounded-lg border border-[#d7e0ee] px-3 text-[13px] font-semibold"} onClick={() => setSize(item)}>{item}</button>
                ))}
              </div>
            </div>
          ) : null}
          {card.colors.length ? (
            <div className="mt-4">
              <p className="text-[13px] font-semibold text-[#52637c]">Rang</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {card.colors.map((item) => {
                  const hex = formaColors.find((entry) => entry.id === item)?.hex ?? "#d1d5db";
                  return (
                    <button key={item} type="button" data-testid={`color-${item}`} className={color === item ? "inline-flex h-9 items-center gap-2 rounded-lg bg-[#0066FF] px-3 text-[13px] font-bold text-white" : "inline-flex h-9 items-center gap-2 rounded-lg border border-[#d7e0ee] px-3 text-[13px] font-semibold"} onClick={() => setColor(item)}>
                      <i className="inline-block size-3 rounded-full border border-black/10" style={{ background: hex }} />
                      {colorLabel(item)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {specs.length ? (
            <ul className="mt-4 space-y-1 text-[14px] text-[#24344d]">
              {specs.map(([label, value]) => <li key={label}><span className="text-[#6b7280]">{label}: </span>{value}</li>)}
            </ul>
          ) : null}
          {months > 0 ? <p className="mt-2 text-[14px]">{months} oyga bo‘lib to‘lash</p> : null}
          <div className="mt-5 flex items-center gap-3" data-testid="product-qty">
            <span className="text-[13px] font-semibold text-[#52637c]">Soni</span>
            <div className="inline-flex h-11 items-center overflow-hidden rounded-xl border border-[#d7e0ee]">
              <button type="button" className="grid h-11 w-11 place-items-center text-[18px] font-bold" aria-label="Kamaytirish" disabled={qty <= 1} onClick={() => setQty((value) => Math.max(1, value - 1))}>−</button>
              <span className="min-w-8 text-center text-[15px] font-bold">{qty}</span>
              <button type="button" className="grid h-11 w-11 place-items-center text-[18px] font-bold" aria-label="Oshirish" disabled={qty >= Math.max(1, card.stockQty)} onClick={() => setQty((value) => Math.min(Math.max(1, card.stockQty), value + 1))}>+</button>
            </div>
          </div>
          {error ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}
          <button type="button" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0066FF] px-4 text-[14px] font-bold text-white disabled:opacity-50" data-testid="product-add" disabled={card.stockQty < 1} onClick={addLine}>
            Savatga
          </button>
        </div>
      </div>
      {card.description ? <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-[#24344d]" data-testid="product-description">{card.description}</p> : null}
      <section className="mt-8" data-testid="product-reviews">
        <h2 className="text-[18px] font-extrabold text-[#0B1F4D]">Sharhlar</h2>
        <div className="mt-3">
          <ProductReviewsList data={reviews} columns={1} />
        </div>
        <p className="mt-3 text-[13px]">
          {profile ? (
            <Link href="/buyurtmalarim" className="font-semibold text-[#0066FF]">Yetkazilgan buyurtma bo‘lsa, sharhni buyurtma sahifasida qoldiring</Link>
          ) : (
            <Link href="/kirish" className="font-semibold text-[#0066FF]">Sharh qoldirish uchun kiring</Link>
          )}
        </p>
      </section>
      {same.length ? (
        <section className="mt-8" data-testid="product-related">
          <h2 className="text-[18px] font-extrabold text-[#0B1F4D]">Shu turkumdagi mahsulotlar</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {same.map((item) => (
              <li key={item.id}>
                <Link href={catalogHref(item.category, item.id)} className="block rounded-2xl border border-[#eceff5] bg-white p-3">
                  {item.image ? <img src={item.image} alt="" className="h-28 w-full rounded-xl object-contain" /> : null}
                  <p className="mt-2 text-[12px] text-[#6b7280]">{item.brand}</p>
                  <p className="text-[14px] font-semibold text-[#0B1F4D]">{item.name}</p>
                  <p className="text-[14px] font-bold text-[#0066FF]">{formatMoney(item.price, "UZS")}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
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
