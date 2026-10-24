"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, FlaskConical, Megaphone, Package, Presentation, ShoppingBag } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { fetchCatalog, type CatalogCard } from "@/lib/catalog-client";
import { loadOrders, syncOrders } from "@/lib/orders";
import { som } from "@/components/shop/desktop/shop-cart";

const QUICK = [
  { href: "/laboratoriya", title: "Lab buyurtma berish", text: "Ishni laboratoriyaga topshiring", icon: FlaskConical },
  { href: "/ortiqcha-material", title: "Material sotish", text: "Ortiqcha material e’lon qiling", icon: Package },
  { href: "/ishlar/yangi", title: "Vakansiya joylash", text: "Klinikangiz uchun mutaxassis toping", icon: Megaphone },
  { href: "/seminarlar", title: "Seminarga yozilish", text: "Bilimingizni oshiring", icon: Presentation },
];

const CATS = [
  { href: "/marketplace?cat=materiallar", label: "Materiallar" },
  { href: "/marketplace?cat=instrumentlar", label: "Instrumentlar" },
  { href: "/laboratoriya", label: "Laboratoriya" },
  { href: "/forma", label: "Forma" },
  { href: "/jihozlar", label: "Jihozlar" },
  { href: "/kategoriyalar", label: "Aksessuarlar" },
];

function greeting(hour: number) {
  if (hour < 12) return "Xayrli tong";
  if (hour < 18) return "Xayrli kun";
  return "Xayrli kech";
}

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const WEEKDAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];

function todayLabel(date: Date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${WEEKDAYS[date.getDay()]}`;
}

/** Logged-in Bosh sahifa from 05-bosh-sahifa-desktop.png. Counts come from the cart, orders and catalog. */
export function DashboardHome() {
  const { profile } = useDoctorProfile();
  const cartCount = useShopLineCount();
  const [orders, setOrders] = useState(0);
  const [products, setProducts] = useState<CatalogCard[]>([]);
  const [seminars, setSeminars] = useState<{ id: string; title: string; date: string | null; city: string | null }[]>([]);
  const [enrolled, setEnrolled] = useState<number | null>(null);
  const [hour, setHour] = useState(18);
  const [when, setWhen] = useState("");
  const name = profile?.fullName?.trim() || "Shifokor";

  useEffect(() => {
    const now = new Date();
    setHour(now.getHours());
    setWhen(todayLabel(now));
    void syncOrders().then(() => setOrders(loadOrders().length));
    void fetchCatalog().then(({ products: rows }) => setProducts(rows.slice(0, 3)));
    void fetch("/api/seminars/catalog", { cache: "no-store" })
      .then(async (res) => (await res.json()) as { seminars?: { id?: string; title?: string | null; date?: string | null; city?: string | null; status?: string }[] })
      .then((data) => {
        const rows = (data.seminars ?? [])
          .filter((item) => item.id && item.title && (!item.status || item.status === "published"))
          .slice(0, 3)
          .map((item) => ({ id: String(item.id), title: String(item.title), date: item.date ?? null, city: item.city ?? null }));
        setSeminars(rows);
      })
      .catch(() => setSeminars([]));
    void fetch("/api/seminars/my", { cache: "no-store", credentials: "same-origin" })
      .then(async (res) => (await res.json()) as { items?: unknown[] })
      .then((data) => setEnrolled(Array.isArray(data.items) ? data.items.length : null))
      .catch(() => setEnrolled(null));
  }, []);

  return (
    <div className="dhb" data-testid="home-dashboard">
      <section className="dhb-hello">
        <div>
          <h1>{greeting(hour)}, {name.startsWith("Dr") ? name : `Dr. ${name}`}</h1>
          <p className="quote">“Sog‘lom tabassum — baxtli odamlarning belgisi.”</p>
          <p className="when">{when ? `Bugun ${when}. Ishlaringizga omad!` : "Ishlaringizga omad!"}</p>
        </div>
      </section>

      <section className="dhb-stats">
        <Link href="/savat"><b>{cartCount}</b><span>Savatda</span><small>{cartCount ? "Mahsulot bor" : "Savat bo‘sh"}</small></Link>
        <Link href="/seminarlar"><b>{enrolled == null ? "—" : enrolled}</b><span>Yozilgan seminarlar</span><small>{enrolled ? "Ro‘yxatdan o‘tganlar" : "Hozircha yozilish yo‘q"}</small></Link>
        <Link href="/seminarlar"><CalendarDays className="i" /><span>Yaqin seminar</span><small>{seminars[0] ? seminars[0].title : "Hozircha seminar yo‘q"}</small></Link>
        <Link href="/buyurtmalarim"><b>{orders}</b><span>Buyurtmalarim</span><small>Holat va yetkazib berish</small></Link>
      </section>

      <h2>Tezkor amallar</h2>
      <section className="dhb-quick">
        {QUICK.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Icon className="i" />
              <b>{item.title}</b>
              <small>{item.text}</small>
            </Link>
          );
        })}
      </section>

      <div className="dhb-cols">
        <section>
          <header><h3>Yaqin seminarlar</h3><Link href="/seminarlar">Barchasini ko‘rish <ArrowRight className="i" /></Link></header>
          {seminars.length === 0 ? <p className="empty">Hozircha e’lon qilingan seminar yo‘q.</p> : (
            <ul>
              {seminars.map((item) => (
                <li key={item.id}><Link href={`/seminarlar/${item.id}`}><span><b>{item.title}</b><em>{[item.date, item.city].filter(Boolean).join(" · ")}</em></span></Link></li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <header><h3>Siz uchun mahsulotlar</h3><Link href="/marketplace">Barchasini ko‘rish <ArrowRight className="i" /></Link></header>
          {products.length === 0 ? <p className="empty">Katalog hozircha bo‘sh.</p> : (
            <ul>
              {products.map((item) => (
                <li key={item.id}>
                  <Link href={`/marketplace/${item.id}`}>
                    {item.image ? <img src={item.image} alt="" /> : <span className="ph" />}
                    <span><b>{item.name}</b><em>{item.price > 0 ? som(item.price) : ""}</em></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <header><h3>Tezkor kategoriyalar</h3><Link href="/kategoriyalar">Barchasini ko‘rish <ArrowRight className="i" /></Link></header>
          <div className="cats">
            {CATS.map((item) => <Link key={item.href} href={item.href}><ShoppingBag className="i" />{item.label}</Link>)}
          </div>
        </section>
      </div>
    </div>
  );
}
