"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, BookOpenCheck, ChevronDown, Clock, GraduationCap, Layers, MonitorPlay, Play, Search } from "lucide-react";
import { videoLessonHref, videoLessons, type LessonTopic, type VideoLesson } from "@/data/education";
import { cn } from "@/lib/utils";
import { CatalogLayout, CatalogSideNav, ChipRow, PageTitle, StatBadge } from "./side-nav";

const TOPICS: { id: LessonTopic | ""; label: string }[] = [
  { id: "", label: "Barchasi" },
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "ortopediya", label: "Ortopediya" },
  { id: "terapiya", label: "Terapiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "jarrohlik", label: "Jarrohlik" },
  { id: "gigiyena", label: "Gigiyena" },
  { id: "raqamli", label: "Raqamli stomatologiya" },
  { id: "management", label: "Management" },
];

type SortKey = "default" | "short" | "long" | "az";

/** "16:42" or "1:02:10" → seconds. */
function seconds(duration: string) {
  return duration.split(":").reduce((acc, part) => acc * 60 + (Number(part) || 0), 0);
}

export function OnlaynDarslarPage() {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<LessonTopic | "">("");
  const [sort, setSort] = useState<SortKey>("default");

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = videoLessons.filter((v) => (!topic || v.topic === topic) && (!term || v.title.toLowerCase().includes(term)));
    const sorted = [...list];
    if (sort === "short") sorted.sort((a, b) => seconds(a.duration) - seconds(b.duration));
    if (sort === "long") sorted.sort((a, b) => seconds(b.duration) - seconds(a.duration));
    if (sort === "az") sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
  }, [q, sort, topic]);

  const totalMin = Math.round(videoLessons.reduce((acc, v) => acc + seconds(v.duration), 0) / 60);
  const topicCount = new Set(videoLessons.map((v) => v.topic).filter(Boolean)).size;
  const topicLabel = (id?: LessonTopic) => TOPICS.find((t) => t.id === id)?.label;

  const search = (
    <label className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#0066FF]" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Kurs yoki mavzuni qidiring..."
        className="h-11 w-full rounded-xl border border-[#e6eaf2] bg-white pr-3 pl-10 text-[13px] outline-none placeholder:text-[#9aa3b2] focus:border-[#0066FF]"
      />
    </label>
  );

  return (
    <CatalogLayout
      side={
        <CatalogSideNav
          variant="edu"
          active="darslar"
          promo={{
            title: "Bilimingizni oshiring!",
            text: "Stomatologiya bo‘yicha eng yaxshi onlayn darslar",
            cta: "Barcha kurslar",
            href: "/onlayn-darslar",
            image: "/catalog-pages/promo-darslar.png",
            icon: GraduationCap,
          }}
        />
      }
    >
      <PageTitle
        title="Onlayn darslar"
        subtitle="Stomatologiya bo‘yicha professional onlayn kurslar"
        right={
          <div className="hidden gap-2.5 xl:flex">
            <StatBadge icon={MonitorPlay} title={`${videoLessons.length} ta dars`} text="Video darslar" />
            <StatBadge icon={Clock} title={`${totalMin} daqiqa`} text="Umumiy davomiylik" />
            <StatBadge icon={Layers} title={`${topicCount} ta mavzu`} text="Turli yo‘nalishlar" />
          </div>
        }
      />
      <div className="mb-3 flex gap-2.5">
        {search}
        <Select
          className="hidden w-[190px] lg:block"
          value={topic}
          onChange={(v) => setTopic(v as LessonTopic | "")}
          options={TOPICS.map((t) => ({ id: t.id, label: t.id ? t.label : "Barcha mavzular" }))}
        />
        <Select
          className="w-11 lg:w-[200px]"
          icon
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={[
            { id: "default", label: "Tavsiya etilgan" },
            { id: "short", label: "Qisqa darslar avval" },
            { id: "long", label: "Uzun darslar avval" },
            { id: "az", label: "Nomi bo‘yicha (A–Z)" },
          ]}
        />
      </div>
      <ChipRow items={TOPICS} value={topic} onChange={setTopic} className="mb-4" />
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d9e0ec] bg-white px-6 py-14 text-center">
          <BookOpenCheck className="mx-auto size-10 text-[#0066FF]" strokeWidth={1.5} />
          <p className="mt-3 text-[15px] font-semibold text-[#0B1F4D]">Bu mavzuda hozircha dars yo‘q</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">Yangi darslar tez orada qo‘shiladi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {visible.map((v) => (
            <LessonCard key={v.id} lesson={v} topic={topicLabel(v.topic)} />
          ))}
        </div>
      )}
    </CatalogLayout>
  );
}

function Select({
  value,
  onChange,
  options,
  className,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  className?: string;
  icon?: boolean;
}) {
  return (
    <label className={cn("relative shrink-0", className)}>
      {icon ? <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#1f2a44]" /> : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-[#e6eaf2] bg-white pr-8 text-[12.5px] font-medium text-[#1f2a44] outline-none focus:border-[#0066FF]",
          icon ? "pl-10 max-lg:pr-0 max-lg:text-transparent" : "pl-4",
        )}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id} className="text-[#1f2a44]">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className={cn("pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#1f2a44]", icon && "max-lg:hidden")} />
    </label>
  );
}

function LessonCard({ lesson, topic }: { lesson: VideoLesson; topic?: string }) {
  return (
    <Link
      href={videoLessonHref(lesson.id)}
      className="group flex overflow-hidden rounded-2xl border border-[#eceff5] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_6px_20px_rgba(15,23,42,0.09)] max-sm:p-2.5 sm:flex-col"
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden max-sm:w-[42%] max-sm:rounded-xl">
        <Image src={lesson.image} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        <span className="absolute inset-0 m-auto flex size-10 items-center justify-center rounded-full bg-black/45 text-white opacity-90">
          <Play className="ml-0.5 size-4 fill-white" />
        </span>
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11.5px] font-semibold text-[#0B1F4D] shadow-sm">
          <Clock className="size-3.5" />
          {lesson.duration}
        </span>
      </div>
      <div className="min-w-0 flex-1 p-3 max-sm:py-1 max-sm:pr-0 sm:p-3.5">
        {topic ? (
          <span className="inline-block rounded-md bg-[#EEF4FF] px-2 py-0.5 text-[11px] font-semibold text-[#0066FF]">{topic}</span>
        ) : null}
        <h2 className="mt-1.5 line-clamp-2 text-[14px] leading-snug font-bold text-[#0B1F4D] group-hover:text-[#0066FF]">{lesson.title}</h2>
        <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#8b93a7]">
          <MonitorPlay className="size-3.5" /> Video dars
        </p>
      </div>
    </Link>
  );
}
