"use client";

import type { CatalogCard } from "@/lib/catalog-client";
import { fetchCatalogProducts } from "@/lib/catalog-client";
import type { Book, BookFormat, ContinueItem, Course } from "@/data/desktop-hub";
import type { DesktopForma, FormaCat, FormaGender } from "@/data/desktop-forma";
import type { DesktopJihoz, JihozCat, JihozCond } from "@/data/desktop-jihozlar";
import type { DesktopArticle, NewsCat } from "@/data/desktop-news";
import type { FormaKind, MobileForma } from "@/data/mobile-forma";
import type { JihozKind, MobileJihoz } from "@/data/mobile-jihozlar";
import type { BookFormat as MobileBookFormat, BookTopic, MobileBook } from "@/data/mobile-books";
import type { MobileNews, NewsKind } from "@/data/mobile-news";
import type { LessonLevel, LessonTopic, MobileLesson } from "@/data/mobile-lessons";

export type LiveChapter = { title: string; body: string };
export type LiveLesson = { id: string; title: string; videoUrl: string; position: number; done: boolean };

export type LiveBook = {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  price: number;
  pdfUrl: string;
  chapters: LiveChapter[];
  createdAt: string;
  progress: { chapter: number; percent: number } | null;
};

export type LiveCourse = {
  id: string;
  title: string;
  teacher: string;
  cover: string;
  description: string;
  price: number;
  createdAt: string;
  lessons: LiveLesson[];
  enrolled: boolean;
  progress: number;
};

export type LiveNews = {
  id: string;
  title: string;
  cover: string;
  body: string;
  tags: string[];
  publishedAt: string;
};

const SWATCH: Record<string, string> = {
  teal: "#1aa6a0",
  navy: "#1d3d6e",
  white: "#f7f8fa",
  oq: "#f4f6f8",
  black: "#1c2430",
  qora: "#1c2430",
  purple: "#6d4ea3",
  green: "#2f8f4e",
  yalpiz: "#7ddec8",
  pushti: "#e7b7c8",
};

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function chaptersOf(value: unknown): LiveChapter[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = text(row.title).trim();
      if (!title) return null;
      return { title, body: text(row.body) };
    })
    .filter((item): item is LiveChapter => Boolean(item));
}

function lessonsOf(value: unknown): LiveLesson[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = text(row.id);
      const title = text(row.title).trim();
      if (!id || !title) return null;
      return { id, title, videoUrl: text(row.videoUrl), position: num(row.position), done: row.done === true };
    })
    .filter((item): item is LiveLesson => Boolean(item));
}

export function parseBook(raw: Record<string, unknown>): LiveBook | null {
  const id = text(raw.id);
  const title = text(raw.title);
  if (!id || !title) return null;
  const progress = raw.progress && typeof raw.progress === "object" ? (raw.progress as Record<string, unknown>) : null;
  return {
    id,
    title,
    author: text(raw.author) || "Muallif",
    cover: text(raw.cover),
    description: text(raw.description),
    price: num(raw.price),
    pdfUrl: text(raw.pdfUrl),
    chapters: chaptersOf(raw.chapters),
    createdAt: text(raw.createdAt),
    progress: progress ? { chapter: num(progress.chapter), percent: num(progress.percent) } : null,
  };
}

export function parseCourse(raw: Record<string, unknown>): LiveCourse | null {
  const id = text(raw.id);
  const title = text(raw.title);
  if (!id || !title) return null;
  return {
    id,
    title,
    teacher: text(raw.teacher) || "O‘qituvchi",
    cover: text(raw.cover),
    description: text(raw.description),
    price: num(raw.price),
    createdAt: text(raw.createdAt),
    lessons: lessonsOf(raw.lessons),
    enrolled: raw.enrolled === true,
    progress: num(raw.progress),
  };
}

export function parseNews(raw: Record<string, unknown>): LiveNews | null {
  const id = text(raw.id);
  const title = text(raw.title);
  if (!id || !title) return null;
  return {
    id,
    title,
    cover: text(raw.cover),
    body: text(raw.body),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((item): item is string => typeof item === "string") : [],
    publishedAt: text(raw.publishedAt) || text(raw.createdAt),
  };
}

async function readList<T>(url: string, key: string, parse: (raw: Record<string, unknown>) => T | null): Promise<T[]> {
  try {
    const res = await fetch(url, { credentials: "same-origin" });
    const json = (await res.json()) as { ok?: boolean; [key: string]: unknown };
    const rows = json[key];
    if (!json.ok || !Array.isArray(rows)) return [];
    return rows.map((item) => (item && typeof item === "object" ? parse(item as Record<string, unknown>) : null)).filter((item): item is T => Boolean(item));
  } catch {
    return [];
  }
}

export const fetchBooks = () => readList<LiveBook>("/api/books", "books", parseBook);

export async function fetchBook(id: string): Promise<LiveBook | null> {
  try {
    const res = await fetch(`/api/books/${id}`, { credentials: "same-origin" });
    const json = (await res.json()) as { ok?: boolean; book?: Record<string, unknown> };
    if (!json.ok || !json.book) return null;
    return parseBook(json.book);
  } catch {
    return null;
  }
}
export const fetchCourses = () => readList<LiveCourse>("/api/courses", "courses", parseCourse);
export const fetchNews = () => readList<LiveNews>("/api/news", "news", parseNews);

export async function saveBookProgress(id: string, chapter: number, percent: number) {
  await fetch(`/api/books/${id}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ chapter, percent }),
  });
}

export async function enrollCourse(id: string) {
  const res = await fetch(`/api/courses/${id}/enroll`, { method: "POST", credentials: "same-origin" });
  const json = (await res.json().catch(() => null)) as { ok?: boolean; course?: Record<string, unknown> } | null;
  return json?.ok && json.course ? parseCourse(json.course) : null;
}

export async function saveLessonDone(courseId: string, lessonId: string) {
  const res = await fetch(`/api/courses/${courseId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ lessonId, done: true }),
  });
  const json = (await res.json().catch(() => null)) as { ok?: boolean; course?: Record<string, unknown> } | null;
  return json?.ok && json.course ? parseCourse(json.course) : null;
}

function formaCat(kind: string): FormaCat {
  if (kind === "xalat" || kind === "qalpoq" || kind === "poyabzal") return kind;
  if (kind === "scrub") return "scrub";
  return "aksessuar";
}

function mobileFormaKind(kind: string): FormaKind {
  if (kind === "xalat") return "xalat";
  if (kind === "poyabzal") return "poyabzal";
  if (kind === "qalpoq") return "bosh";
  if (kind === "scrub") return "kostyum";
  return "kostyum";
}

function jihozCat(card: CatalogCard): JihozCat {
  const blob = `${card.name} ${text(card.attrs.subcategory)} ${card.description}`.toLowerCase();
  if (blob.includes("rentgen") || blob.includes("cbct")) return "rentgen";
  if (blob.includes("skaner")) return "skaner";
  if (blob.includes("avtoklav") || blob.includes("steril")) return "avtoklav";
  if (blob.includes("mikroskop")) return "mikroskop";
  if (blob.includes("kompressor") || blob.includes("aspirator")) return "kompressor";
  if (blob.includes("uchlik")) return "uchlik";
  if (blob.includes("lampa")) return "lampa";
  return "ustanovka";
}

function mobileJihozKind(cat: JihozCat): JihozKind {
  if (cat === "rentgen") return "rentgen";
  if (cat === "avtoklav") return "sterilizatsiya";
  if (cat === "uchlik") return "qolcha";
  return "kreslo";
}

export async function fetchSectionProducts(category: "forma" | "jihozlar") {
  const rows = await fetchCatalogProducts();
  return rows.filter((item) => item.category === category);
}

export function toDesktopForma(card: CatalogCard): DesktopForma {
  const gender: FormaGender = card.gender === "erkak" || card.gender === "ayol" ? card.gender : "uniseks";
  return {
    slug: card.id,
    brand: card.brand,
    brandKey: card.brandKey,
    name: card.name,
    blurb: text(card.attrs.shortDescription) || card.description,
    rating: card.rating,
    reviews: card.reviews,
    price: card.price,
    oldPrice: card.oldPrice,
    off: card.discount,
    colors: (card.colors.length ? card.colors : ["teal"]).map((id) => ({ id, hex: SWATCH[id] ?? "#d7dee8", label: id })),
    sizes: card.sizes,
    gender,
    cat: formaCat(card.kind),
    material: "paxta",
    image: card.image,
    gallery: card.images.length ? card.images : card.image ? [card.image] : [],
    popularity: card.reviews,
    isNew: card.attrs.isNew === true,
  };
}

export function toMobileForma(card: CatalogCard): MobileForma {
  return {
    id: card.id,
    brand: card.brand,
    name: card.name,
    kind: mobileFormaKind(card.kind),
    gender: card.gender === "erkak" || card.gender === "ayol" ? card.gender : "uniseks",
    price: card.price,
    oldPrice: card.oldPrice,
    discount: card.discount,
    rating: card.rating,
    reviews: card.reviews,
    colors: (card.colors.length ? card.colors : ["teal"]).map((id) => ({ id, hex: SWATCH[id] ?? "#d7dee8", label: id })),
    sizes: card.sizes,
    image: card.image,
    gallery: card.images,
    sku: text(card.attrs.sku),
    fresh: card.attrs.isNew === true,
  };
}

export function toDesktopJihoz(card: CatalogCard): DesktopJihoz {
  const condition: JihozCond = card.attrs.condition === "ishlatilgan" ? "ishlatilgan" : "yangi";
  const months = num(card.attrs.installmentMonths);
  const monthly = num(card.attrs.installmentMonthly) || (months > 0 ? Math.round(card.price / months) : 0);
  return {
    slug: card.id,
    brand: card.brand,
    brandKey: card.brandKey,
    name: card.name,
    cat: jihozCat(card),
    condition,
    year: num(card.attrs.year) || new Date().getFullYear(),
    warranty: num(card.attrs.warrantyMonths) || 12,
    spec: text(card.attrs.specLine) || text(card.attrs.model) || card.description.slice(0, 80),
    price: card.price,
    months,
    monthly,
    leasing: card.attrs.leasing === true || months > 0,
    install: card.attrs.installService === true,
    official: card.attrs.official === true,
    city: text(card.attrs.city) || "Toshkent",
    rating: card.rating,
    reviews: card.reviews,
    sold: 0,
    image: card.image,
    gallery: card.images.length ? card.images : card.image ? [card.image] : [],
    popularity: card.reviews,
  };
}

export function toMobileJihoz(card: CatalogCard, rank: number): MobileJihoz {
  const desktop = toDesktopJihoz(card);
  return {
    id: card.id,
    brand: card.brand,
    name: card.name,
    kind: mobileJihozKind(desktop.cat),
    condition: desktop.condition === "yangi" ? "yangi" : "bu",
    badge: desktop.official ? "Original" : "Yangi",
    price: card.price,
    oldPrice: card.oldPrice,
    discount: card.discount,
    monthly: desktop.monthly,
    months: desktop.months,
    rating: card.rating,
    reviews: card.reviews,
    image: card.image,
    gallery: card.images,
    rank,
  };
}

export function toHubBook(book: LiveBook): Book {
  const formats: BookFormat[] = book.pdfUrl || book.chapters.length ? ["pdf"] : ["bosma"];
  const year = book.createdAt ? new Date(book.createdAt).getFullYear() : new Date().getFullYear();
  return {
    id: book.id,
    title: book.title,
    authors: book.author,
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    pages: book.chapters.length ? `${book.chapters.length} bob` : book.pdfUrl ? "PDF" : "—",
    lang: "O‘zbek",
    rating: 0,
    reviews: 0,
    price: book.price,
    formats,
    stock: "ombor",
    publisher: book.author,
    category: "Barchasi",
    image: book.cover,
    popularity: book.progress?.percent ?? 0,
    sample: book.description,
  };
}

export function toMobileBook(book: LiveBook): MobileBook {
  const topic: BookTopic = "endodontiya";
  const format: MobileBookFormat = book.pdfUrl || book.chapters.length ? "pdf" : "bosma";
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    topic,
    format,
    rating: 0,
    reviews: 0,
    price: book.price,
    image: book.cover,
    fresh: false,
  };
}

export function toCourseCard(course: LiveCourse): Course {
  return {
    id: course.id,
    title: course.title,
    blurb: course.description,
    teacher: course.teacher,
    role: "O‘qituvchi",
    avatar: course.cover,
    direction: "terapiya",
    level: "orta",
    format: "video",
    price: course.price,
    badge: course.price === 0 ? "bepul" : undefined,
    lessons: course.lessons.length,
    hours: course.lessons.length,
    lang: "O‘zbek",
    rating: 0,
    reviews: 0,
    duration: `${course.lessons.length} dars`,
    popularity: course.enrolled ? 1 : 0,
    image: course.cover,
  };
}

export function toContinue(course: LiveCourse): ContinueItem {
  const done = course.lessons.filter((item) => item.done).length;
  return {
    id: course.id,
    title: course.title,
    seen: done,
    total: course.lessons.length,
    progress: course.progress,
    time: course.lessons[0]?.title ?? "",
    image: course.cover,
  };
}

export function toMobileLesson(course: LiveCourse): MobileLesson {
  const topic: LessonTopic = "terapiya";
  const level: LessonLevel = "orta";
  return {
    id: course.id,
    title: course.title,
    topic,
    topicLabel: "Terapiya",
    level,
    levelLabel: "O‘rta",
    author: course.teacher,
    avatar: course.cover,
    image: course.cover,
    duration: `${course.lessons.length} dars`,
    views: 0,
    viewsLabel: course.enrolled ? `${course.progress}%` : "Yangi",
    lessons: course.lessons.length,
    price: course.price,
    progress: course.enrolled ? course.progress : undefined,
  };
}

const NEWS_CATS = new Set<NewsCat>(["soha", "tadbir", "tech", "qonun", "kompaniya", "intervyu"]);
const MOBILE_KINDS = new Set<NewsKind>(["texnologiya", "seminarlar", "klinikalar", "tadqiqotlar"]);

export function toDesktopNews(item: LiveNews, index: number): DesktopArticle {
  const tag = item.tags.find((value): value is NewsCat => NEWS_CATS.has(value as NewsCat)) ?? "soha";
  const date = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" }) : "";
  return {
    id: item.id,
    cat: tag,
    title: item.title,
    lead: item.body.replace(/\s+/g, " ").slice(0, 180),
    date,
    views: 0,
    minutes: Math.max(1, Math.round(item.body.length / 900)),
    image: item.cover,
    author: "StomaHub",
    role: "Tahririyat",
    featured: index === 0,
  };
}

export function toMobileNews(item: LiveNews, index: number): MobileNews {
  const kind = item.tags.find((value): value is NewsKind => MOBILE_KINDS.has(value as NewsKind)) ?? "texnologiya";
  const date = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }) : "";
  return {
    id: item.id,
    title: item.title,
    excerpt: item.body.replace(/\s+/g, " ").slice(0, 140),
    body: item.body,
    date,
    minutes: Math.max(1, Math.round(item.body.length / 900)),
    views: 0,
    kind,
    image: item.cover,
    featured: index === 0,
    rank: index,
  };
}
