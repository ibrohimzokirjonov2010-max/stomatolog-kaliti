"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Clock3,
  Coins,
  Crown,
  Gift,
  Info,
  Percent,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  Star,
  TicketPercent,
} from "lucide-react";
import { useBonus } from "@/components/bonus/bonus";
import type { BonusHistoryItem, BonusInfo } from "@/lib/bonus";
import { formatGroupedNumber, formatMoney, formatUzDate } from "@/lib/format";
import "./bonuslarim-mobile.css";

type Tab = "history" | "rewards";
type Filter = "all" | "earned" | "spent" | "expired";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "earned", label: "Yig‘ilgan" },
  { id: "spent", label: "Sarflangan" },
  { id: "expired", label: "Muddatli" },
];

const typeLabel: Record<string, string> = { signup: "Ro‘yxatdan o‘tish bonusi", first_purchase: "Birinchi xarid bonusi" };

/** "12-oktabr 2026, 14:25" in Tashkent time. */
function when(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const day = formatUzDate(`${pick("year")}-${pick("month")}-${pick("day")}`);
  return `${day.dayNum}-${day.month} ${day.year}, ${pick("hour")}:${pick("minute")}`;
}

function rowLook(item: BonusHistoryItem) {
  if (item.kind === "spend") return { title: "Bonus bilan to‘lov", icon: Percent, tone: "pink" };
  if (item.kind === "refund") return { title: "Bonus qaytarildi", icon: RotateCcw, tone: "teal" };
  if (item.kind === "expire") return { title: "Bonus muddati tugadi", icon: Clock3, tone: "grey" };
  if (item.type === "first_purchase") return { title: typeLabel.first_purchase, icon: ShoppingCart, tone: "teal" };
  return { title: (item.type && typeLabel[item.type]) || "Bonus", icon: Gift, tone: "teal" };
}

function matches(item: BonusHistoryItem, filter: Filter) {
  if (filter === "earned") return item.kind === "grant" || item.kind === "refund";
  if (filter === "spent") return item.kind === "spend";
  if (filter === "expired") return item.kind === "expire";
  return true;
}

function rewards(info: BonusInfo) {
  return [
    {
      key: "signup",
      title: typeLabel.signup,
      amount: info.rules.signup,
      status: info.signupGranted ? "Berildi" : info.signupEligible ? "Kutilmoqda" : "Mavjud emas",
      done: info.signupGranted,
    },
    {
      key: "first",
      title: typeLabel.first_purchase,
      amount: info.rules.firstPurchase,
      status: info.firstPurchaseGranted ? "Berildi" : info.firstPurchasePending ? "Xarid yetkazilishi kutilmoqda" : info.signupGranted ? "Birinchi xariddan keyin" : "Mavjud emas",
      done: info.firstPurchaseGranted,
    },
  ];
}

export function BonuslarimMobile() {
  const { ready, signedIn, loaded, info } = useBonus();
  const [tab, setTab] = useState<Tab>("history");
  const [filter, setFilter] = useState<Filter>("all");
  const [howOpen, setHowOpen] = useState(false);
  const history = info ? [...info.history].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  const shown = history.filter((item) => matches(item, filter));
  const months = info ? Math.max(1, Math.round(info.rules.days / 30)) : 12;

  return (
    <div className="bm lg:hidden" data-testid="mobile-bonuslarim">
      <section className="bm-hero">
        <div className="bm-art" aria-hidden>
          <span className="bm-glow" />
          <span className="bm-dot" />
          <svg className="bm-tooth" viewBox="0 0 64 72">
            <defs>
              <linearGradient id="bm-tooth-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="1" stopColor="#d6e4ea" />
              </linearGradient>
            </defs>
            <path fill="url(#bm-tooth-g)" stroke="#c9dbe2" strokeWidth="1" d="M32 8c-6 0-9-3-16-3C8 5 3 11 3 20c0 8 3 13 5 20 2 8 2 22 9 25 5 2 7-9 9-16 1-4 3-6 6-6s5 2 6 6c2 7 4 18 9 16 7-3 7-17 9-25 2-7 5-12 5-20 0-9-5-15-13-15-7 0-10 3-16 3z" />
          </svg>
          <Crown className="bm-crown" />
          <span className="bm-pct"><Percent /></span>
        </div>
        <h1>Bonuslarim</h1>
        <p className="bm-lead">Xaridlaringiz uchun bonuslar to‘plang va maxsus chegirmalarga ega bo‘ling!</p>
        <div className="bm-balance">
          <i><Coins /></i>
          <div>
            <span>Mavjud bonuslar</span>
            <b data-testid="bm-balance">{info ? formatGroupedNumber(info.balance) : "0"} <small>so‘m</small></b>
            {info?.expiresAt && info.balance > 0 ? <em>{formatUzDate(info.expiresAt.slice(0, 10)).long} gacha</em> : null}
          </div>
        </div>
        <Link href="/marketplace" className="bm-use">
          <i><Gift /></i>
          <span>Bonuslardan foydalanib, xaridingizda chegirma oling</span>
          <ChevronRight />
        </Link>
      </section>

      <div className="bm-tiles">
        <Link href="/marketplace" className="bm-tile"><i><ShoppingBag /></i><b>Bonus to‘plash</b><span>Ro‘yxat va 1-xarid</span></Link>
        <Link href="/savat" className="bm-tile"><i><TicketPercent /></i><b>Chegirmalar</b><span>Bonuslar bilan</span></Link>
        <Link href="/aksiyalar" className="bm-tile"><i><Gift /></i><b>Maxsus takliflar</b><span>Aksiyalar</span></Link>
        <button type="button" className="bm-tile" onClick={() => setHowOpen(true)}><i><Star /></i><b>Qanday ishlaydi?</b><span>Batafsil ma’lumot</span></button>
      </div>

      <section className="bm-card">
        <div className="bm-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "history"} className={tab === "history" ? "on" : ""} onClick={() => setTab("history")}>
            <Clock3 /> Harakatlar tarixi
          </button>
          <button type="button" role="tab" aria-selected={tab === "rewards"} className={tab === "rewards" ? "on" : ""} onClick={() => setTab("rewards")}>
            <Gift /> Mening mukofotlarim
          </button>
        </div>

        {!ready || (signedIn && !loaded) ? <p className="bm-empty">Yuklanmoqda…</p> : null}
        {ready && !signedIn ? (
          <p className="bm-empty">
            Bonuslaringizni ko‘rish uchun <Link href="/kirish?next=/bonuslarim">tizimga kiring</Link>.
          </p>
        ) : null}
        {signedIn && loaded && !info ? <p className="bm-empty">Bonus ma’lumotini yuklab bo‘lmadi.</p> : null}

        {info && tab === "history" ? (
          <>
            <div className="bm-chips">
              {FILTERS.map((item) => (
                <button key={item.id} type="button" className={filter === item.id ? "on" : ""} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            {shown.length === 0 ? <p className="bm-empty">{history.length === 0 ? "Hozircha bonus harakatlari yo‘q." : "Bu filtrda harakat yo‘q."}</p> : null}
            <ul className="bm-list" data-testid="bm-history">
              {shown.map((item, index) => {
                const look = rowLook(item);
                const Icon = look.icon;
                const plus = item.kind === "grant" || item.kind === "refund";
                const body = (
                  <>
                    <i className={`bm-ico ${look.tone}`}><Icon /></i>
                    <span className="bm-copy"><b>{look.title}</b><small>{when(item.createdAt)}</small></span>
                    <span className={plus ? "bm-amt plus" : "bm-amt"}>{plus ? "+" : "-"} {formatGroupedNumber(Math.abs(item.amount))}</span>
                    {item.orderId ? <ChevronRight className="bm-chev" /> : null}
                  </>
                );
                return (
                  <li key={`${item.createdAt}-${index}`}>
                    {item.orderId ? <Link href={`/buyurtmalarim/${item.orderId}`} className="bm-row">{body}</Link> : <div className="bm-row">{body}</div>}
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}

        {info && tab === "rewards" ? (
          <ul className="bm-list">
            {rewards(info).map((item) => (
              <li key={item.key}>
                <div className="bm-row">
                  <i className="bm-ico teal"><Gift /></i>
                  <span className="bm-copy"><b>{item.title}</b><small>{item.status}</small></span>
                  <span className={item.done ? "bm-amt plus" : "bm-amt"}>{formatMoney(item.amount, "UZS")}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <p className="bm-note">
        <i><Info /></i>
        <span>Bonuslar faqat StomaHub Marketplace’da xarid qilishda ishlatiladi. Bonuslarning amal qilish muddati {months} oy.</span>
      </p>

      {howOpen ? (
        <div className="bm-sheet" role="dialog" aria-label="Qanday ishlaydi?">
          <button type="button" aria-label="Yopish" className="bm-sheet-close" onClick={() => setHowOpen(false)} />
          <div className="bm-box">
            <h3>Bonus qanday ishlaydi?</h3>
            <p>Ro‘yxatdan o‘tib, telefoningizni tasdiqlasangiz — {formatMoney(info?.rules.signup ?? 10_000, "UZS")}.</p>
            <p>Birinchi Marketplace xaridingiz yetkazilib, siz tasdiqlagach — yana {formatMoney(info?.rules.firstPurchase ?? 30_000, "UZS")}.</p>
            <p>Savatda “Bonus ishlatish”ni yoqing: to‘lovning {info?.rules.maxSharePercent ?? 50}% gacha bonus bilan yopiladi. Naqdga yechilmaydi.</p>
            <button type="button" className="bm-ok" onClick={() => setHowOpen(false)}>Tushunarli</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
