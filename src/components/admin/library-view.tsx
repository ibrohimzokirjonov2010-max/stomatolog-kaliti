"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { BookOpen, GraduationCap, Newspaper, Trash2 } from "lucide-react";
import { Card, Empty, ErrorBox, Loading, PageHead, adminPost, btn, useAdminData, useToast } from "@/components/admin/ui";
import { uploadWithTicket } from "@/lib/image-upload";

type Chapter = { title: string; body: string };
type Lesson = { title: string; videoUrl: string };
type BookRow = { id: string; title: string; author: string; cover?: string; description?: string; price?: number; pdfUrl?: string; chapters?: Chapter[]; published?: boolean };
type CourseRow = { id: string; title: string; teacher: string; cover?: string; description?: string; price?: number; lessons?: Lesson[]; published?: boolean };
type NewsRow = { id: string; title: string; cover?: string; body?: string; tags?: string[]; publishedAt?: string; published?: boolean };
type Data = { books: BookRow[]; courses: CourseRow[]; news: NewsRow[] };

const blankBook = { title: "", author: "", cover: "", description: "", price: "0", pdfUrl: "", chapters: "", published: true };
const blankCourse = { title: "", teacher: "", cover: "", description: "", price: "0", lessons: "", published: true };
const blankNews = { title: "", cover: "", body: "", tags: "soha", publishedAt: "", published: true };

async function uploadLibrary(file: File) {
  return uploadWithTicket("/api/uploads", { purpose: "library" }, file);
}

export function LibraryView() {
  const { data, error, loading, reload } = useAdminData<Data>("/api/admin/library");
  const toast = useToast();
  const [tab, setTab] = useState<"book" | "course" | "news">("book");
  const [book, setBook] = useState(blankBook);
  const [course, setCourse] = useState(blankCourse);
  const [news, setNews] = useState(blankNews);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(kind: "book" | "course" | "news", row: Record<string, unknown>) {
    setBusy(true);
    const res = await adminPost("/api/admin/library", { action: "save", kind, row: editing ? { ...row, id: editing } : row });
    setBusy(false);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show("Saqlandi");
    setEditing(null);
    setBook(blankBook);
    setCourse(blankCourse);
    setNews(blankNews);
    void reload();
  }

  async function remove(kind: "book" | "course" | "news", id: string) {
    setBusy(true);
    const res = await adminPost("/api/admin/library", { action: "delete", kind, id });
    setBusy(false);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show("O‘chirildi");
    if (editing === id) setEditing(null);
    void reload();
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHead title="Kutubxona" subtitle="Kitoblar, ta’lim kurslari va yangiliklar. Rasm, PDF va video yuklash yuklash chiptasi orqali." />
      {error ? <ErrorBox text={error} onRetry={reload} /> : !data ? <Loading /> : (
        <div className="space-y-4">
          <div className="flex gap-2">
            {([
              ["book", "Kitoblar", BookOpen],
              ["course", "Kurslar", GraduationCap],
              ["news", "Yangiliklar", Newspaper],
            ] as const).map(([id, label, Icon]) => (
              <button key={id} type="button" className={tab === id ? btn.primary : btn.outline} onClick={() => setTab(id)}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          {tab === "book" ? (
            <Card className="space-y-3 p-4">
              <h2 className="font-heading text-[16px] font-bold">{editing ? "Kitobni tahrirlash" : "Yangi kitob"}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="h-10 rounded-lg border px-3 text-[14px]" placeholder="Sarlavha" value={book.title} onChange={(event) => setBook({ ...book, title: event.target.value })} />
                <input className="h-10 rounded-lg border px-3 text-[14px]" placeholder="Muallif" value={book.author} onChange={(event) => setBook({ ...book, author: event.target.value })} />
                <input className="h-10 rounded-lg border px-3 text-[14px]" placeholder="Narx (0 = bepul)" value={book.price} onChange={(event) => setBook({ ...book, price: event.target.value })} />
                <input className="h-10 rounded-lg border px-3 text-[14px]" placeholder="PDF havola" value={book.pdfUrl} onChange={(event) => setBook({ ...book, pdfUrl: event.target.value })} />
              </div>
              <textarea className="min-h-24 w-full rounded-lg border p-3 text-[14px]" placeholder="Tavsif" value={book.description} onChange={(event) => setBook({ ...book, description: event.target.value })} />
              <textarea className="min-h-24 w-full rounded-lg border p-3 text-[14px]" placeholder={"Boblar: har qator «Sarlavha | matn»"} value={book.chapters} onChange={(event) => setBook({ ...book, chapters: event.target.value })} />
              <label className="text-[13px] text-slate-500">
                Muqova
                <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block" onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  void uploadLibrary(file).then((url) => setBook((current) => ({ ...current, cover: url }))).catch(() => toast.show("Rasm yuklanmadi", "err"));
                }} />
              </label>
              {book.cover ? <img src={book.cover} alt="" className="h-24 rounded-lg object-cover" /> : null}
              <label className="text-[13px] text-slate-500">
                PDF fayl
                <input type="file" accept="application/pdf" className="mt-1 block" onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  void uploadLibrary(file).then((url) => setBook((current) => ({ ...current, pdfUrl: url }))).catch(() => toast.show("PDF yuklanmadi", "err"));
                }} />
              </label>
              <div className="flex gap-2">
                <button type="button" className={btn.primary} disabled={busy} onClick={() => save("book", {
                  title: book.title,
                  author: book.author,
                  cover: book.cover,
                  description: book.description,
                  price: Number(book.price.replace(/\D/g, "")) || 0,
                  pdfUrl: book.pdfUrl,
                  published: book.published,
                  chapters: book.chapters.split("\n").map((line) => {
                    const [title, ...rest] = line.split("|");
                    return title?.trim() ? { title: title.trim(), body: rest.join("|").trim() } : null;
                  }).filter(Boolean),
                })}>Saqlash</button>
                {editing ? <button type="button" className={btn.outline} onClick={() => { setEditing(null); setBook(blankBook); }}>Bekor</button> : null}
              </div>
              {data.books.length === 0 ? <Empty icon={<BookOpen className="size-5" />} title="Hozircha kitob yo‘q" /> : (
                <ul className="divide-y">
                  {data.books.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                      <button type="button" className="text-left" onClick={() => {
                        setEditing(item.id);
                        setBook({
                          title: item.title,
                          author: item.author,
                          cover: item.cover ?? "",
                          description: item.description ?? "",
                          price: String(item.price ?? 0),
                          pdfUrl: item.pdfUrl ?? "",
                          chapters: (item.chapters ?? []).map((chapter) => `${chapter.title} | ${chapter.body}`).join("\n"),
                          published: item.published !== false,
                        });
                      }}><b>{item.title}</b><span className="ml-2 text-slate-500">{item.author}</span></button>
                      <button type="button" aria-label="O‘chirish" onClick={() => void remove("book", item.id)}><Trash2 className="size-4" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}

          {tab === "course" ? (
            <Card className="space-y-3 p-4">
              <h2 className="font-heading text-[16px] font-bold">{editing ? "Kursni tahrirlash" : "Yangi kurs"}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="h-10 rounded-lg border px-3 text-[14px]" placeholder="Sarlavha" value={course.title} onChange={(event) => setCourse({ ...course, title: event.target.value })} />
                <input className="h-10 rounded-lg border px-3 text-[14px]" placeholder="O‘qituvchi" value={course.teacher} onChange={(event) => setCourse({ ...course, teacher: event.target.value })} />
                <input className="h-10 rounded-lg border px-3 text-[14px]" placeholder="Narx (0 = bepul)" value={course.price} onChange={(event) => setCourse({ ...course, price: event.target.value })} />
              </div>
              <textarea className="min-h-20 w-full rounded-lg border p-3 text-[14px]" placeholder="Tavsif" value={course.description} onChange={(event) => setCourse({ ...course, description: event.target.value })} />
              <textarea className="min-h-24 w-full rounded-lg border p-3 text-[14px]" placeholder={"Darslar: har qator «Sarlavha | video havola»"} value={course.lessons} onChange={(event) => setCourse({ ...course, lessons: event.target.value })} />
              <label className="text-[13px] text-slate-500">
                Muqova
                <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block" onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  void uploadLibrary(file).then((url) => setCourse((current) => ({ ...current, cover: url }))).catch(() => toast.show("Rasm yuklanmadi", "err"));
                }} />
              </label>
              <label className="text-[13px] text-slate-500">
                Dars videosi (havolaga qo‘shiladi)
                <input type="file" accept="video/mp4,video/webm,video/quicktime" className="mt-1 block" onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  void uploadLibrary(file).then((url) => setCourse((current) => ({ ...current, lessons: current.lessons ? `${current.lessons}\nDars | ${url}` : `Dars | ${url}` }))).catch(() => toast.show("Video yuklanmadi", "err"));
                }} />
              </label>
              <button type="button" className={btn.primary} disabled={busy} onClick={() => save("course", {
                title: course.title,
                teacher: course.teacher,
                cover: course.cover,
                description: course.description,
                price: Number(course.price.replace(/\D/g, "")) || 0,
                published: course.published,
                lessons: course.lessons.split("\n").map((line) => {
                  const [title, ...rest] = line.split("|");
                  return title?.trim() ? { title: title.trim(), videoUrl: rest.join("|").trim() } : null;
                }).filter(Boolean),
              })}>Saqlash</button>
              {data.courses.length === 0 ? <Empty icon={<GraduationCap className="size-5" />} title="Hozircha kurs yo‘q" /> : (
                <ul className="divide-y">
                  {data.courses.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                      <button type="button" className="text-left" onClick={() => {
                        setEditing(item.id);
                        setCourse({
                          title: item.title,
                          teacher: item.teacher,
                          cover: item.cover ?? "",
                          description: item.description ?? "",
                          price: String(item.price ?? 0),
                          lessons: (item.lessons ?? []).map((lesson) => `${lesson.title} | ${lesson.videoUrl}`).join("\n"),
                          published: item.published !== false,
                        });
                      }}><b>{item.title}</b><span className="ml-2 text-slate-500">{item.teacher}</span></button>
                      <button type="button" aria-label="O‘chirish" onClick={() => void remove("course", item.id)}><Trash2 className="size-4" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}

          {tab === "news" ? (
            <Card className="space-y-3 p-4">
              <h2 className="font-heading text-[16px] font-bold">{editing ? "Yangilikni tahrirlash" : "Yangi yangilik"}</h2>
              <input className="h-10 rounded-lg border px-3 text-[14px]" placeholder="Sarlavha" value={news.title} onChange={(event) => setNews({ ...news, title: event.target.value })} />
              <input className="h-10 rounded-lg border px-3 text-[14px]" placeholder="Teglar: soha, tadbir, tech, qonun, kompaniya, intervyu" value={news.tags} onChange={(event) => setNews({ ...news, tags: event.target.value })} />
              <textarea className="min-h-32 w-full rounded-lg border p-3 text-[14px]" placeholder="Matn" value={news.body} onChange={(event) => setNews({ ...news, body: event.target.value })} />
              <label className="text-[13px] text-slate-500">
                Muqova
                <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block" onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  void uploadLibrary(file).then((url) => setNews((current) => ({ ...current, cover: url }))).catch(() => toast.show("Rasm yuklanmadi", "err"));
                }} />
              </label>
              <button type="button" className={btn.primary} disabled={busy} onClick={() => save("news", {
                title: news.title,
                cover: news.cover,
                body: news.body,
                tags: news.tags.split(",").map((item) => item.trim()).filter(Boolean),
                publishedAt: news.publishedAt || new Date().toISOString(),
                published: news.published,
              })}>Saqlash</button>
              {data.news.length === 0 ? <Empty icon={<Newspaper className="size-5" />} title="Hozircha yangilik yo‘q" /> : (
                <ul className="divide-y">
                  {data.news.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                      <button type="button" className="text-left" onClick={() => {
                        setEditing(item.id);
                        setNews({
                          title: item.title,
                          cover: item.cover ?? "",
                          body: item.body ?? "",
                          tags: (item.tags ?? []).join(", "),
                          publishedAt: item.publishedAt ?? "",
                          published: item.published !== false,
                        });
                      }}><b>{item.title}</b></button>
                      <button type="button" aria-label="O‘chirish" onClick={() => void remove("news", item.id)}><Trash2 className="size-4" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
