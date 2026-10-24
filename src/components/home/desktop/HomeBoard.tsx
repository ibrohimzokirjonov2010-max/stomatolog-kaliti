"use client";
/* eslint-disable @next/next/no-img-element -- home board thumbs follow the desktop design CSS */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Cpu,
  FlaskConical,
  GraduationCap,
  Package,
  ShoppingBag,
  Stethoscope,
  Users,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useSeminarRegs } from "@/components/seminar-provider";
import { isSeminarUpcoming, seminarHref, seminarPriceText, seminars, type Seminar } from "@/data/seminars";
import { catalogHref, fetchCatalogProducts, type CatalogCard } from "@/lib/catalog-client";
import { formatMoney, formatUzDate } from "@/lib/format";
import { isActiveStatus } from "@/lib/seminar-registrations";
import { loadOrders, syncOrders, type Order, type OrderStatus } from "@/lib/orders";
import { tashkentDateParts, tashkentHm } from "@/lib/tashkent-date";

const WEEKDAYS: Record<string, string> = {
  Sun: "Yakshanba",
  Mon: "Dushanba",
  Tue: "Seshanba",
  Wed: "Chorshanba",
  Thu: "Payshanba",
  Fri: "Juma",
  Sat: "Shanba",
};
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

const ORDER_STATUS: Record<OrderStatus, string> = {
  pending_accept: "Qabul kutilmoqda",
  qabul_qilindi: "Qabul qilindi",
  yigilmoqda: "Yig‘ilmoqda",
  yigish_tugadi: "Yig‘ildi",
  yolda: "Yo‘lda",
  yetkazildi: "Yetkazildi",
};

const ACTIONS = [
  { href: "/marketplace/sotuvchi", title: "Material sotish", text: "Do‘koningizni oching", icon: ShoppingBag },
  { href: "/seminarlar", title: "Seminarga yozilish", text: "Yaqin tadbirlar", icon: GraduationCap },
  { href: "/mutaxassislar", title: "Mutaxassis toping", text: "Klinikangiz uchun", icon: Users },
  { href: "/laboratoriya", title: "Ishni laboratoriyaga", text: "Topshiring", icon: FlaskConical },
  { href: "/elonlar/yangi", title: "Ortiqcha material", text: "E’lon qiling", icon: Package },
  { href: "/talim", title: "Bilimingizni oshiring", text: "Onlayn darslar", icon: BookOpen },
];

const CATS = [
  { href: "/jihozlar", label: "Jihozlar", icon: Cpu },
  { href: "/marketplace?cat=materiallar", label: "Materiallar", icon: Package },
  { href: "/laboratoriya", label: "Laboratoriya", icon: FlaskConical },
  { href: "/talim", label: "Dasturlar", icon: GraduationCap },
  { href: "/forma", label: "Aksessuarlar", icon: Stethoscope },
];

function greeting(date: Date) {
  const hour = Number(tashkentHm(date).slice(0, 2));
  if (hour < 12) return "Xayrli tong";
  if (hour < 18) return "Xayrli kun";
  return "Xayrli kech";
}

function todayLine(date: Date) {
  const parts = tashkentDateParts(date);
  const short = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tashkent", weekday: "short" }).format(date);
  return `Bugun ${parts.day}-${MONTHS[parts.month]}, ${WEEKDAYS[short] ?? short}. Ishlaringizga omad!`;
}

export default function HomeBoard() {
  const { profile } = useDoctorProfile();
  const { count } = useCart();
  const { registrations, catalogVersion } = useSeminarRegs();
  const [products, setProducts] = useState<CatalogCard[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const now = useMemo(() => new Date(), []);

  const upcoming = useMemo(() => {
    return seminars
      .filter((item) => !item.demo && isSeminarUpcoming(item))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    // catalogVersion bumps when the database catalog replaces the shared list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogVersion]);

  const signedUp = registrations.filter((item) => isActiveStatus(item.status)).length;
  const next = upcoming[0];
  const name = profile?.fullName?.trim();

  useEffect(() => {
    let stop = false;
    void fetchCatalogProducts().then((items) => {
      if (!stop) setProducts(items.slice(0, 4));
    });
    void syncOrders(true).then(() => {
      if (!stop) setOrders(loadOrders().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });
    return () => {
      stop = true;
    };
  }, []);

  return (
    <div className="hb" data-testid="home-board">
      <div className="hb-greet">
        <div className="hb-hello">
          <h1>
            {greeting(now)}
            {name ? `, ${name}` : ""}
          </h1>
          <p>{todayLine(now)}</p>
        </div>
        <div className="hb-quote">
          <p>“Sog‘lom tabassum — baxtli odamlarning belgisi.”</p>
        </div>
      </div>

      <div className="hb-stats">
        <Link className="hb-stat" href="/savat">
          <span>Savatda</span>
          <b>{count > 0 ? String(count) : "Savat bo‘sh"}</b>
          <small>{count > 0 ? "ta mahsulot" : "Hali hech narsa yo‘q"}</small>
          <em>Ko‘rish</em>
        </Link>
        <Link className="hb-stat" href="/seminarlar">
          <span>Yozilgan seminarlar</span>
          <b>{signedUp > 0 ? String(signedUp) : "Hali yozilmagansiz"}</b>
          <small>{signedUp > 0 ? "faol yozuv" : "Seminarlar bo‘limi"}</small>
          <em>Ko‘rish</em>
        </Link>
        {next ? <NextSeminar seminar={next} /> : (
          <div className="hb-stat">
            <span>Yaqin seminar</span>
            <b>Hozircha yo‘q</b>
            <small>E’lon qilingan seminar chiqadi</small>
          </div>
        )}
        <OrdersStat orders={orders} />
      </div>

      <section className="hb-actions">
        <h2>Tezkor amallar</h2>
        <div className="hb-acts">
          {ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="hb-act" href={item.href} key={item.href}>
                <i><Icon className="i" /></i>
                <span>
                  <b>{item.title}</b>
                  <small>{item.text}</small>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="hb-cols">
        <section className="hb-col">
          <div className="hb-hd">
            <h3>Yaqin seminarlar</h3>
            <Link href="/seminarlar">Barchasini ko‘rish <ArrowRight className="i" /></Link>
          </div>
          {upcoming.length === 0 ? <p className="hb-empty">Hozircha seminar yo‘q</p> : upcoming.slice(0, 3).map((item) => (
            <Link className="hb-sem" href={seminarHref(item.id)} key={item.id}>
              {item.image ? <img src={item.image} alt="" /> : null}
              <span>
                <b>{item.title}</b>
                <small>{item.dateTbd ? "Sana aniqlanmoqda" : formatUzDate(item.date).long}{item.city ? ` · ${item.city}` : ""}</small>
                <small>{seminarPriceText(item)}</small>
              </span>
            </Link>
          ))}
        </section>

        <section className="hb-col">
          <div className="hb-hd">
            <h3>Siz uchun mahsulotlar</h3>
            <Link href="/marketplace">Barchasini ko‘rish <ArrowRight className="i" /></Link>
          </div>
          {products === null ? <p className="hb-empty">Yuklanmoqda...</p> : products.length === 0 ? <p className="hb-empty">Hozircha mahsulot yo‘q</p> : products.map((item) => (
            <Link className="hb-prod" href={catalogHref(item.category, item.id)} key={item.id}>
              {item.image ? <img src={item.image} alt="" /> : null}
              <span>
                <b>{item.name}</b>
                <strong>{formatMoney(item.price, "UZS")}</strong>
              </span>
            </Link>
          ))}
        </section>

        <section className="hb-col">
          <div className="hb-hd">
            <h3>Tezkor kategoriyalar</h3>
            <Link href="/kategoriyalar">Barchasi <ArrowRight className="i" /></Link>
          </div>
          {CATS.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="hb-cat" href={item.href} key={item.href}>
                <i><Icon className="i" /></i>
                {item.label}
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
}

function NextSeminar({ seminar }: { seminar: Seminar }) {
  const when = seminar.dateTbd ? "Sana aniqlanmoqda" : formatUzDate(seminar.date).long;
  return (
    <Link className="hb-stat" href={seminarHref(seminar.id)}>
      <span>Yaqin seminar</span>
      <b>{seminar.title}</b>
      <small>{when}</small>
      <em>Ko‘rish</em>
    </Link>
  );
}

function OrdersStat({ orders }: { orders: Order[] | null }) {
  const latest = orders?.[0];
  return (
    <Link className="hb-stat" href="/buyurtmalarim">
      <span>Buyurtmalarim</span>
      <b>{orders === null ? "..." : orders.length > 0 ? String(orders.length) : "Holat va yetkazib berish"}</b>
      <small>{latest ? ORDER_STATUS[latest.status] : "Hali buyurtma yo‘q"}</small>
      <em>Ko‘rish</em>
    </Link>
  );
}
