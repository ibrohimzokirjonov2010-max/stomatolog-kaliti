"use client";
/* eslint-disable @next/next/no-img-element -- lesson photos are fixed-size portraits */

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Bookmark, Check, ChevronDown, ChevronLeft, Clock, Download, Eye, Lock, Maximize, Pause, Play, Share2 } from "lucide-react";
import { resolveVideoCourse, type CourseComment } from "@/data/video-course";
import { saveLessonProgress } from "@/lib/lesson-progress";
import "./video-lesson.css";

const SPEEDS = [1, 1.25, 1.5, 2] as const;
const QUALITIES = ["480p", "720p", "1080p"] as const;
type Tab = "tavsif" | "darslar" | "materiallar" | "izohlar";

function clock(total: number) {
  const safe = Math.max(0, Math.floor(total));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function saveKey(id: string) {
  return `sk-video-save-${id}`;
}

export function VideoLesson({ id }: { id: string }) {
  const course = useMemo(() => resolveVideoCourse(id), [id]);
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(course.startIndex);
  const [seconds, setSeconds] = useState(course.startSec);
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]>("1080p");
  const [qualityOpen, setQualityOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [tab, setTab] = useState<Tab>("darslar");
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<CourseComment[]>(course.comments);
  const [count, setCount] = useState(course.commentCount);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");

  const speed = SPEEDS[speedIndex] ?? 1;
  const lesson = course.lessons[index] ?? course.lessons[0];
  const duration = lesson?.durationSec ?? 1;
  const next = course.lessons[index + 1];
  const pct = duration > 0 ? Math.min(100, (seconds / duration) * 100) : 0;

  useEffect(() => {
    setIndex(course.startIndex);
    setSeconds(course.startSec);
    setPlaying(false);
    setSpeedIndex(0);
    setQuality("1080p");
    setQualityOpen(false);
    setTab("darslar");
    setComments(course.comments);
    setCount(course.commentCount);
    setDraft("");
    setSaved(window.localStorage.getItem(saveKey(course.id)) === "1");
  }, [course]);

  useEffect(() => {
    if (!playing) {
      videoRef.current?.pause();
      return;
    }
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        const step = value + speed * 0.25;
        return step >= duration ? duration : step;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [playing, speed, duration]);

  useEffect(() => {
    if (playing && seconds >= duration) setPlaying(false);
  }, [playing, seconds, duration]);

  // Real "Davom ettirish": remember how far this lesson was watched on this device.
  useEffect(() => {
    if (!playing || seconds <= 0) return;
    const total = Math.max(1, course.lessons.length);
    saveLessonProgress(course.id, ((index + Math.min(1, seconds / duration)) / total) * 100);
  }, [course, duration, index, playing, seconds]);

  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 2200);
    return () => window.clearTimeout(timer);
  }, [note]);

  useEffect(() => {
    function onChange() {
      setFull(document.fullscreenElement === playerRef.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (playing) {
      video?.pause();
      setPlaying(false);
      return;
    }
    if (video) {
      video.playbackRate = speed;
      void video.play().catch(() => undefined);
    }
    setPlaying(true);
  }

  function cycleSpeed() {
    const nextIndex = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(nextIndex);
    if (videoRef.current) videoRef.current.playbackRate = SPEEDS[nextIndex] ?? 1;
  }

  async function toggleFull() {
    const el = playerRef.current;
    if (!el) return;
    if (document.fullscreenElement || full) {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      setFull(false);
      return;
    }
    try {
      await el.requestFullscreen();
    } catch {
      setFull(true);
    }
  }

  function selectLesson(nextIndex: number) {
    const item = course.lessons[nextIndex];
    if (!item || item.locked) {
      setNote("Bu dars hali ochilmagan");
      return;
    }
    if (nextIndex === index) return;
    setIndex(nextIndex);
    setSeconds(nextIndex === course.startIndex ? course.startSec : 0);
    setPlaying(false);
    videoRef.current?.pause();
  }

  function goNext() {
    if (!next) {
      setNote("Bu oxirgi dars");
      return;
    }
    if (next.locked) {
      setNote("Keyingi dars hali ochilmagan");
      return;
    }
    selectLesson(index + 1);
  }

  async function share() {
    const url = `${window.location.origin}/talim/${course.id}/video`;
    try {
      if (navigator.share) {
        await navigator.share({ title: course.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* the note still confirms the action */
      }
    }
    setNote("Havola nusxalandi");
  }

  function downloadText(filename: string, text: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNote("Fayl yuklab olindi");
  }

  function downloadLesson() {
    const current = lesson?.title ?? course.title;
    downloadText(
      `${course.id}-dars-${index + 1}.txt`,
      `${course.title}\n${current}\n${course.author}\n\n${course.about.join("\n\n")}\n`,
    );
  }

  function toggleSave() {
    const nextSaved = !saved;
    setSaved(nextSaved);
    window.localStorage.setItem(saveKey(course.id), nextSaved ? "1" : "0");
    setNote(nextSaved ? "Saqlandi" : "Olib tashlandi");
  }

  function addComment(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      setNote("Izoh yozing");
      return;
    }
    setComments((current) => [{ name: "Siz", avatar: course.avatar, when: "Hozir", text }, ...current]);
    setCount((value) => value + 1);
    setDraft("");
  }

  return (
    <div className="vd" data-testid="video-lesson" data-full={full ? "true" : "false"}>
      <header className="vd-top">
        <Link href="/talim" className="vd-back" aria-label="Orqaga">
          <ChevronLeft />
        </Link>
        <div className="vd-brand">
          <b>STOMAHUB</b>
          <span>Ta’lim / Video dars</span>
        </div>
        <button type="button" className="vd-headshare" aria-label="Ulashish" data-testid="vd-head-share" onClick={() => void share()}>
          <Share2 />
        </button>
      </header>

      <div className="vd-scroll">
        <div className={full ? "vd-player full" : "vd-player"} ref={playerRef} data-testid="vd-player">
          <video
            ref={videoRef}
            poster={course.poster}
            src={course.videoSrc}
            playsInline
            preload="metadata"
            loop
            aria-label={course.title}
          />
          <button type="button" className={playing ? "vd-big pause" : "vd-big"} data-testid="vd-play" aria-label={playing ? "Pauza" : "Ijro"} aria-pressed={playing} onClick={togglePlay}>
            {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </button>
          <div className="vd-controls">
            <span className="vd-time" data-testid="vd-time">
              {clock(seconds)} / {clock(duration)}
            </span>
            <input
              data-testid="vd-progress"
              type="range"
              min={0}
              max={duration}
              step={1}
              value={Math.min(duration, Math.round(seconds))}
              aria-label="Vaqt"
              style={{ ["--p" as string]: `${pct}%` }}
              onChange={(event) => setSeconds(Number(event.target.value))}
            />
            <button type="button" className="vd-speed" data-testid="vd-speed" aria-label="Tezlik" onClick={cycleSpeed}>
              {speed === 1 ? "1x" : `${speed}x`}
            </button>
            <div className="vd-q">
              <button
                type="button"
                className="vd-quality"
                data-testid="vd-quality"
                aria-label="Sifat"
                aria-expanded={qualityOpen}
                onClick={() => setQualityOpen((value) => !value)}
              >
                {quality}
                <ChevronDown />
              </button>
              {qualityOpen ? (
                <div className="vd-menu" role="listbox" aria-label="Sifat" data-testid="vd-quality-menu">
                  {QUALITIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="option"
                      aria-selected={item === quality}
                      className={item === quality ? "on" : undefined}
                      onClick={() => {
                        setQuality(item);
                        setQualityOpen(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button type="button" className="vd-full" data-testid="vd-full" aria-label="To‘liq ekran" onClick={() => void toggleFull()}>
              <Maximize />
            </button>
          </div>
        </div>

        <div className="vd-pad">
          <h1 className="vd-title">{course.title}</h1>
          <div className="vd-author">
            <img src={course.avatar} alt="" />
            <p className="vd-who">
              <b>{course.author}</b>
              <span>{course.role}</span>
            </p>
            <div className="vd-meta">
              <p>
                <Eye /> {course.viewsLabel}
              </p>
              <p data-testid="vd-duration">
                <Clock /> {lesson?.minutesLabel}
              </p>
            </div>
          </div>
          <div className="vd-actions">
            <button type="button" data-testid="vd-save" aria-pressed={saved} className={saved ? "on" : undefined} onClick={toggleSave}>
              <Bookmark fill={saved ? "currentColor" : "none"} /> {saved ? "Saqlangan" : "Saqlash"}
            </button>
            <button type="button" data-testid="vd-download" onClick={downloadLesson}>
              <Download /> Yuklab olish
            </button>
            <button type="button" data-testid="vd-share" onClick={() => void share()}>
              <Share2 /> Ulashish
            </button>
          </div>
          <div className="vd-tabs" role="tablist" aria-label="Dars bo‘limlari">
            <button type="button" role="tab" data-testid="vd-tab-tavsif" aria-selected={tab === "tavsif"} className={tab === "tavsif" ? "on" : undefined} onClick={() => setTab("tavsif")}>
              Tavsif
            </button>
            <button type="button" role="tab" data-testid="vd-tab-darslar" aria-selected={tab === "darslar"} className={tab === "darslar" ? "on" : undefined} onClick={() => setTab("darslar")}>
              Darslar
            </button>
            <button type="button" role="tab" data-testid="vd-tab-materiallar" aria-selected={tab === "materiallar"} className={tab === "materiallar" ? "on" : undefined} onClick={() => setTab("materiallar")}>
              Materiallar
            </button>
            <button type="button" role="tab" data-testid="vd-tab-izohlar" aria-selected={tab === "izohlar"} className={tab === "izohlar" ? "on" : undefined} onClick={() => setTab("izohlar")}>
              Izohlar ({count})
            </button>
          </div>
        </div>

        {tab === "tavsif" ? (
          <div className="vd-pad vd-copy" data-testid="vd-about">
            {course.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}

        {tab === "darslar" ? (
          <>
            <div className="vd-course" data-testid="vd-progress-label">
              <span>Kurs progressi</span>
              <span className="vd-track" aria-hidden="true">
                <i style={{ width: `${course.progressPercent}%` }} />
              </span>
              <b>
                {course.progressDone} / {course.progressTotal} dars
              </b>
              <em>{course.progressPercent}%</em>
            </div>
            <div className="vd-list">
              {course.lessons.map((item, itemIndex) => {
                const current = itemIndex === index;
                return (
                  <button
                    key={item.title}
                    type="button"
                    className={current ? "vd-lesson on" : item.locked ? "vd-lesson lock" : "vd-lesson"}
                    data-testid={`vd-lesson-${itemIndex + 1}`}
                    aria-current={current ? "true" : undefined}
                    aria-disabled={item.locked ? true : undefined}
                    onClick={() => selectLesson(itemIndex)}
                  >
                    <span className="vd-n">{itemIndex + 1}</span>
                    <span>
                      <b>{item.title}</b>
                      {current ? <span className="sub">Hozirgi dars</span> : null}
                    </span>
                    <time>{item.minutesLabel}</time>
                    <span className={current ? "vd-mark now" : item.done ? "vd-mark done" : item.locked ? "vd-mark lock" : "vd-mark"}>
                      {current ? <Pause fill="currentColor" /> : item.done ? <Check /> : item.locked ? <Lock /> : <Play fill="currentColor" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {tab === "materiallar" ? (
          <div className="vd-pad" data-testid="vd-materials">
            {course.materials.map((item) => (
              <article key={item.name} className="vd-file">
                <i>PDF</i>
                <p>
                  <b>{item.name}</b>
                  <span>{item.detail}</span>
                </p>
                <button type="button" onClick={() => downloadText(item.name.replace(/\.pdf$/i, ".txt"), `${item.name}\n${course.title}\n${course.author}\n`)}>
                  Yuklash
                </button>
              </article>
            ))}
          </div>
        ) : null}

        {tab === "izohlar" ? (
          <div className="vd-pad" data-testid="vd-comments">
            {comments.map((item) => (
              <article key={`${item.name}-${item.when}-${item.text}`} className="vd-comment">
                <img src={item.avatar} alt="" />
                <div>
                  <b>{item.name}</b>
                  <time>{item.when}</time>
                  <span>{item.text}</span>
                </div>
              </article>
            ))}
            <form className="vd-form" onSubmit={addComment}>
              <input aria-label="Izoh" value={draft} placeholder="Izoh yozing" onChange={(event) => setDraft(event.target.value)} />
              <button type="submit" data-testid="vd-comment-send">
                Yuborish
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <div className="vd-bar">
        <button type="button" className="vd-next" data-testid="vd-next" onClick={goNext}>
          <b>Keyingi dars →</b>
          <span>{next ? `${index + 2}. ${next.title}` : "Kurs yakunlandi"}</span>
        </button>
      </div>

      {note ? (
        <p className="vd-note" data-testid="vd-note" role="status">
          {note}
        </p>
      ) : null}
    </div>
  );
}
