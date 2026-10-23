"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Download, GraduationCap, Pause, Play, Share2, User } from "lucide-react";
import { enrollCourse, saveLessonDone, type LiveCourse } from "@/lib/live-content";
import { formatMoney } from "@/lib/format";
import "./course-player.css";

/** Phone /talim/[id]/video (mock "talim ko‘rish"): player, lesson list, next-lesson bar. */
export function CoursePlayerPhone({ course, onChange }: { course: LiveCourse; onChange: (next: LiveCourse) => void }) {
  const lessons = course.lessons;
  const [index, setIndex] = useState(() => Math.max(0, lessons.findIndex((item) => !item.done)));
  const [tab, setTab] = useState<"darslar" | "tavsif">("darslar");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const current = lessons[index];
  const next = lessons[index + 1];
  const done = lessons.filter((item) => item.done).length;
  const percent = lessons.length ? Math.round((done / lessons.length) * 100) : course.progress;

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: course.title, url });
      } catch {
        // Closing the share sheet is not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote("Havola nusxalandi");
    } catch {
      setNote(url);
    }
  }

  async function enroll() {
    setBusy(true);
    const fresh = await enrollCourse(course.id);
    setBusy(false);
    if (fresh) onChange(fresh);
    else setNote("Yozilib bo‘lmadi. Qayta urinib ko‘ring.");
  }

  async function advance() {
    if (!current) return;
    setBusy(true);
    const fresh = current.done ? null : await saveLessonDone(course.id, current.id);
    setBusy(false);
    if (fresh) onChange(fresh);
    if (next) setIndex(index + 1);
    else setNote("Kurs yakunlandi");
  }

  return (
    <div className="cp lg:hidden" data-testid="course-phone">
      <header className="cp-head">
        <Link href="/talim" aria-label="Orqaga"><ArrowLeft /></Link>
        <span>
          <b>STOMA<i>HUB</i></b>
          <small>Ta’lim / Video dars</small>
        </span>
        <button type="button" aria-label="Ulashish" onClick={() => void share()}><Share2 /></button>
      </header>

      <div className="cp-video">
        {current?.videoUrl ? (
          <video key={current.id} controls playsInline poster={course.cover || undefined} src={current.videoUrl} />
        ) : (
          <div className="cp-novideo" style={course.cover ? { backgroundImage: `url(${course.cover})` } : undefined}>
            <span><Play /></span>
            <small>{lessons.length ? "Bu dars uchun video hali qo‘yilmagan" : "Kursda hali dars yo‘q"}</small>
          </div>
        )}
      </div>

      <h1 className="cp-title">{current ? current.title : course.title}</h1>
      <div className="cp-author">
        <span className="cp-ava"><User /></span>
        <span>
          <b>{course.teacher}</b>
          <small>{course.title}</small>
        </span>
        <em>{course.price > 0 ? formatMoney(course.price, "UZS") : "Bepul"}</em>
      </div>

      <div className="cp-acts">
        {current?.videoUrl ? <a href={current.videoUrl} download><Download /> Yuklab olish</a> : null}
        <button type="button" onClick={() => void share()}><Share2 /> Ulashish</button>
      </div>

      <div className="cp-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "tavsif"} className={tab === "tavsif" ? "on" : undefined} onClick={() => setTab("tavsif")}>Tavsif</button>
        <button type="button" role="tab" aria-selected={tab === "darslar"} className={tab === "darslar" ? "on" : undefined} onClick={() => setTab("darslar")}>Darslar ({lessons.length})</button>
      </div>

      {tab === "tavsif" ? (
        <section className="cp-card cp-desc">
          <p>{course.description || "Kurs tavsifi qo‘shilmagan."}</p>
        </section>
      ) : (
        <section className="cp-card">
          <div className="cp-progress">
            <b>Kurs progressi</b>
            <span><i style={{ width: `${percent}%` }} /></span>
            <small>{done} / {lessons.length} dars</small>
            <em>{percent}%</em>
          </div>
          {lessons.length === 0 ? <p className="cp-empty">Hozircha dars yo‘q.</p> : (
            <ol className="cp-list">
              {lessons.map((item, position) => {
                const on = position === index;
                return (
                  <li key={item.id} className={on ? "on" : undefined}>
                    <button type="button" onClick={() => setIndex(position)}>
                      <span className="cp-num">{position + 1}</span>
                      {on ? null : item.done ? <CheckCircle2 className="cp-tick" /> : <span className="cp-tick" aria-hidden="true" />}
                      <span className="cp-name">
                        <b>{item.title}</b>
                        {on ? <small><Play /> Hozirgi dars</small> : null}
                      </span>
                      {on ? <span className="cp-state"><Pause /></span> : item.done ? <CheckCircle2 className="cp-done" /> : <Circle className="cp-todo" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}

      <div className="cp-pad" />
      {note ? <p className="cp-toast" role="status" onAnimationEnd={() => setNote("")}>{note}</p> : null}
      <div className="cp-bar">
        {!course.enrolled ? (
          <button type="button" disabled={busy} onClick={() => void enroll()}>
            <b><GraduationCap /> Kursga yozilish</b>
            <small>Progress saqlanishi uchun</small>
          </button>
        ) : current ? (
          <button type="button" disabled={busy} onClick={() => void advance()}>
            <b>{next ? "Keyingi dars" : current.done ? "Kurs yakunlangan" : "Darsni yakunlash"} <ArrowRight /></b>
            {next ? <small>{index + 2}. {next.title}</small> : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}
