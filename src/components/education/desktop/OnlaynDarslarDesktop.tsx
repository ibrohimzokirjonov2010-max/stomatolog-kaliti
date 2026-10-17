"use client";
/* eslint-disable @next/next/no-img-element -- course photos are fixed-size cards */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  BadgeCheck,
  Bookmark,
  ChevronRight,
  Clock,
  GraduationCap,
  Search,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { MarketFrame, type HeaderLink } from "@/components/shop/desktop/MarketFrame";
import {
  courseBadgeLabel,
  courseLevels,
  coursePrices,
  courseTopics,
  desktopCourses,
  filterCourses,
  sortCourses,
  studentsLabel,
  type CourseLevel,
  type CoursePrice,
  type CourseSort,
  type CourseTopic,
  type DesktopCourse,
} from "@/data/desktop-courses";
import { formatMoney } from "@/lib/format";
import "./onlayn-darslar.css";

const headerLinks: HeaderLink[] = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/seminarlar", label: "Seminarlar" },
  { href: "/ustalar", label: "Ustalar" },
  { href: "/forma", label: "Forma" },
  { href: "/kitoblar", label: "Kitoblar" },
  { href: "/talim", label: "Ta’lim", key: "talim" },
];



export function OnlaynDarslarDesktop() {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<CourseTopic | "">("");
  const [level, setLevel] = useState<CourseLevel | "">("");
  const [price, setPrice] = useState<CoursePrice>("");
  const [sort, setSort] = useState<CourseSort>("mashhurlik");
  const [saved, setSaved] = useState<string[]>([]);
  const items = useMemo(() => sortCourses(filterCourses(desktopCourses, { q, topic, level, price }), sort), [q, topic, level, price, sort]);

  function reset() {
    setQ("");
    setTopic("");
    setLevel("");
    setPrice("");
    setSort("mashhurlik");
  }

  function toggleSave(id: string) {
    setSaved((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <MarketFrame
      active="courses"
      headerLinks={headerLinks}
      headerActive="talim"
      searchPlaceholder="Onlayn darslar, mavzular yoki o‘qituvchini qidiring..."
      headerQuery={q}
      onHeaderQuery={setQ}
      promoTitle="Bilimingizni oshiring!"
      promoText="Stomatologiya bo‘yicha eng yaxshi onlayn darslar"
      promoCta="Barcha kurslar"
      promoImage="/img/design-pr13/promo/books.png"
      promoIcon={<GraduationCap className="od-cap i" />}
      promoClass="od-promo"
      onPromo={reset}
    >
      <div data-testid="courses-desktop">
        <div className="od-head">
          <div>
            <h1>Onlayn darslar</h1>
            <p>Stomatologiya bo‘yicha professional onlayn kurslar</p>
          </div>
          <div className="od-badges">
            <div className="brd-badge">
              <span className="medal">
                <GraduationCap className="i" />
              </span>
              <span>
                <b>100+ kurs</b>
                <span>Professional darslar</span>
              </span>
            </div>
            <div className="brd-badge">
              <span className="medal">
                <Users className="i" />
              </span>
              <span>
                <b>Top mutaxassislar</b>
                <span>Tajribali o‘qituvchilar</span>
              </span>
            </div>
            <div className="brd-badge">
              <span className="medal">
                <BadgeCheck className="i" />
              </span>
              <span>
                <b>Sertifikat</b>
                <span>Kurs yakunida</span>
              </span>
            </div>
          </div>
        </div>
        <div className="od-tools">
          <label className="od-search">
            <Search className="i" />
            <input data-testid="course-search" aria-label="Kurs yoki o‘qituvchi qidiring" value={q} placeholder="Kurs yoki o‘qituvchi qidiring..." onChange={(event) => setQ(event.target.value)} />
          </label>
          <label className="od-select">
            <select data-testid="course-topic" aria-label="Mavzu" value={topic} onChange={(event) => setTopic(event.target.value as CourseTopic | "")}>
              <option value="">Barcha mavzular</option>
              {courseTopics.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronRight className="i" style={{ transform: "rotate(90deg)" }} />
          </label>
          <label className="od-select">
            <select data-testid="course-level" aria-label="Daraja" value={level} onChange={(event) => setLevel(event.target.value as CourseLevel | "")}>
              <option value="">Barcha darajalar</option>
              {courseLevels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronRight className="i" style={{ transform: "rotate(90deg)" }} />
          </label>
          <label className="od-select">
            <select data-testid="course-price" aria-label="Narx" value={price} onChange={(event) => setPrice(event.target.value as CoursePrice)}>
              <option value="">Barcha narxlar</option>
              {coursePrices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronRight className="i" style={{ transform: "rotate(90deg)" }} />
          </label>
          <label className="od-select">
            <ArrowUpDown className="i" />
            <select data-testid="course-sort" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as CourseSort)}>
              <option value="mashhurlik">Mashhurlik bo‘yicha</option>
              <option value="reyting">Reyting bo‘yicha</option>
              <option value="arzon">Arzon</option>
              <option value="qimmat">Qimmat</option>
            </select>
            <ChevronRight className="i" style={{ transform: "rotate(90deg)" }} />
          </label>
        </div>
        <div className="od-chips" role="tablist" aria-label="Mavzu">
          <button type="button" className={topic === "" ? "on" : undefined} data-testid="course-chip-all" onClick={() => setTopic("")}>
            Barchasi
          </button>
          {courseTopics.map((item) => (
            <button key={item.id} type="button" className={topic === item.id ? "on" : undefined} data-testid={`course-chip-${item.id}`} onClick={() => setTopic(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="od-empty" data-testid="course-empty">
            <p>Kurs topilmadi</p>
            <button type="button" onClick={reset}>
              Tozalash
            </button>
          </div>
        ) : (
          <div className="od-grid">
            {items.map((item) => (
              <CourseCard key={item.id} item={item} saved={saved.includes(item.id)} onSave={() => toggleSave(item.id)} />
            ))}
          </div>
        )}
      </div>
    </MarketFrame>
  );
}

function CourseCard({ item, saved, onSave }: { item: DesktopCourse; saved: boolean; onSave: () => void }) {
  return (
    <article className="od-card" data-testid="course-card">
      <button type="button" className={saved ? "od-mark on" : "od-mark"} data-testid="course-save" aria-label="Saqlash" aria-pressed={saved} onClick={onSave}>
        <Bookmark className="i" />
      </button>
      <Link className="od-hit" href={`/talim/${item.id}/video`} data-testid={`course-link-${item.id}`}>
        <div className="od-ph">
          <img src={item.image} alt="" />
          {item.badge ? <span className={`od-flag ${item.badge === "bestseller" ? "best" : item.badge === "yangi" ? "new" : item.badge === "ommabop" ? "pop" : "pro"}`}>{courseBadgeLabel[item.badge]}</span> : null}
          <span className="od-hours">
            <Clock className="i" />
            {item.hours} soat
          </span>
        </div>
        <h3>{item.title}</h3>
        <div className="od-teach">
          <img src={item.avatar} alt="" />
          <div>
            <b>{item.teacher}</b>
            <span>{item.role}</span>
          </div>
        </div>
        <p className="od-meta">
          <Star className="star i" />
          <b>
            {item.rating} ({item.reviews})
          </b>
          <span className="stu">
            <UserRound className="i" />
            {studentsLabel(item.students)}
          </span>
        </p>
        <p className="od-price">{formatMoney(item.price, "UZS")}</p>
      </Link>
    </article>
  );
}
