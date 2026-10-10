import { books, type Book } from "@/data/education";

export const bookFavId = (id: string) => `book:${id}`;
export const bookHref = (id: string) => `/kitoblar/${id}`;
export const latestBookYear = Math.max(...books.map((b) => b.year));
export const isNewBook = (b: Book) => b.year === latestBookYear;
export const topBookIds = new Set([...books].sort((a, b) => b.downloads - a.downloads).slice(0, 3).map((b) => b.id));
export const formatCount = (n: number) => new Intl.NumberFormat("ru-RU").format(n).replace(/\u00a0|\u202f/g, " ");
