"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  ImageIcon,
  ImageOff,
  Info,
  MapPin,
  Phone,
  Send,
  Share2,
  ShieldCheck,
  Star,
  Wrench,
  X,
} from "lucide-react";
import { UstaIcon } from "@/components/usta-icons";
import { useUstaWork } from "@/components/usta-provider";
import { UstaRequestSheet } from "@/components/usta-request-sheet";
import { MasterAvatar, NoRating, VerifiedBadge, placeLine, useFavMasters } from "@/components/usta-ui";
import { phoneHref, serviceTagLabels, telegramHref, type Master } from "@/data/masters";
import { ReportButton, RevealPhone } from "@/components/forms/RevealPhone";
import { instagramHref, instagramValue, sourceUrlValue, USTA_SPECIALTIES } from "@/lib/add-forms";
import { formatGroupedNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import "./usta-profile-phone.css";

const TABS = [
  ["xizmatlar", "Xizmatlar"],
  ["ishlar", "Ishlar"],
  ["sharhlar", "Sharhlar"],
  ["malumot", "Ma’lumot"],
] as const;

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

/** Usta profile (mock 2). Phone/Telegram stay private until the master accepts one of my requests (existing privacy rule). */
export function UstaProfile({ id }: { id: string }) {
  const router = useRouter();
  const { masters, mastersReady, requests } = useUstaWork();
  const master = masters.find((m) => m.id === id) ?? null;
  const fav = useFavMasters();
  const [request, setRequest] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("xizmatlar");
  const [more, setMore] = useState(false);
  const [gallery, setGallery] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const contact = useMemo(() => requests.find((r) => r.masterId === id && r.masterPhone), [id, requests]);

  if (!mastersReady) {
    return (
      <div className="-mx-4 -mt-4 min-h-dvh bg-[#F4F7FC] px-4 pt-16">
        <div className="h-[300px] animate-pulse rounded-[24px] bg-white" />
      </div>
    );
  }

  if (!master) {
    return (
      <div className="-mx-4 -mt-4 min-h-dvh bg-[#F4F7FC] px-4">
        <TopBar onBack={() => router.push("/ustalar")} />
        <div className="mt-6 rounded-[22px] bg-white px-5 py-12 text-center" data-testid="usta-not-found">
          <p className="text-[16px] font-semibold text-[#1a1d26]">Usta topilmadi</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">Profil o‘chirilgan yoki hali moderatsiyadan o‘tmagan.</p>
          <Link href="/ustalar" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white">
            Ustalar ro‘yxati
          </Link>
        </div>
      </div>
    );
  }

  const m: Master = master;
  const works = m.works ?? [];
  const since = m.createdAt ? new Date(m.createdAt) : null;

  function go(section: (typeof TABS)[number][0]) {
    setTab(section);
    document.getElementById(`usta-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: `${m.name} — StomaHub usta`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  }

  const locked = !contact && !m.phone && !m.telegram;
  const tg = contact?.masterTelegram ?? m.telegram ?? null;
  const phone = contact?.masterPhone ?? m.phone ?? null;

  const price = m.priceFrom ? `${formatGroupedNumber(Math.round(m.priceFrom / 1000))} ming+` : "Kelishiladi";
  const cover = works[0] ?? null;
  const label = (s: string) => USTA_SPECIALTIES.find((item) => item.id === s)?.label ?? serviceTagLabels[s as keyof typeof serviceTagLabels] ?? s;

  return (
    <div className="up" data-testid="usta-profile">
      <div className={cover ? "up-cover" : "up-cover blank"}>
        {cover ? <Image src={cover} alt="" fill sizes="100vw" className="object-cover" priority /> : null}
        <button type="button" className="up-float back" aria-label="Orqaga" onClick={() => (window.history.length > 1 ? router.back() : router.push("/ustalar"))}>
          <ChevronLeft />
        </button>
        <button type="button" className={fav.has(m.id) ? "up-float heart on" : "up-float heart"} aria-label="Saqlash" aria-pressed={fav.has(m.id)} onClick={() => fav.toggle(m.id)}>
          <Heart fill={fav.has(m.id) ? "currentColor" : "none"} />
        </button>
        <button type="button" className="up-float share" aria-label="Ulashish" onClick={() => void share()}>
          <Share2 />
        </button>
      </div>
      {copied ? <p className="up-toast">Havola nusxalandi</p> : null}

      <section id="usta-asosiy" className="up-card up-main">
        <div className="up-ava">
          <MasterAvatar master={m} size={84} dot={false} priority />
          <i className={m.online ? "on" : undefined} />
        </div>
        <div className="up-who">
          <h1><span>{m.name}</span> <VerifiedBadge className="size-[18px]" /></h1>
          <p className="up-role">{m.title}</p>
          <NoRating className="text-[12.5px]" />
          <p className="up-line">
            <span><BriefcaseBusiness /> {m.years > 0 ? `${m.years} yil tajriba` : "Yangi usta"}</span>
            <span><MapPin /> {m.city}</span>
            <em className={m.online ? "on" : undefined} data-testid="usta-online">{m.online ? <CheckCircle2 /> : null}{m.online ? "Onlayn" : "Oflayn"}</em>
          </p>
        </div>
        <div className="up-chips">
          {m.services.map((s) => <span key={s}>{label(s)}</span>)}
        </div>
        {!m.mine ? (
          <p className="up-small">
            {!phone ? <><RevealPhone kind="master" id={m.id} />{" · "}</> : null}
            <ReportButton kind="master" id={m.id} />
          </p>
        ) : null}
      </section>

      <div className="up-card up-stats" data-testid="usta-stats">
        <article><Wrench /><span><b>{m.jobs > 0 ? `${m.jobs}+` : "—"}</b><small>Bajarilgan ishlar</small></span></article>
        <article><CalendarDays /><span><b>{m.years > 0 ? `${m.years} yil` : "—"}</b><small>Tajriba</small></span></article>
        <article><ShieldCheck /><span><b>{price}</b><small>Narx</small></span></article>
        <article><Clock3 /><span><b>{m.hours || "—"}</b><small>Ish vaqti</small></span></article>
      </div>

      <nav className="up-tabs" aria-label="Profil bo‘limlari">
        {TABS.map(([key, text]) => (
          <button key={key} type="button" className={tab === key ? "on" : undefined} onClick={() => go(key)}>{text}</button>
        ))}
      </nav>

      <section id="usta-xizmatlar" className="up-card up-sec">
        <h2>Xizmatlar va narxlar</h2>
        <ul className="up-services" data-testid="usta-services">
          {m.services.map((s) => (
            <li key={s}>
              <button type="button" onClick={() => (m.mine ? undefined : setRequest(true))}>
                <span className="up-sic"><UstaIcon name={s} className="size-[24px]" /></span>
                <span className="up-sname"><b>{label(s)}</b><small>{m.priceNegotiable === false ? "Narx belgilangan" : "Narx kelishiladi"}</small></span>
                <em>{m.priceFrom ? `${formatGroupedNumber(m.priceFrom)} so‘m dan` : ""}</em>
                <ChevronRight />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section id="usta-ishlar" className="up-card up-sec">
        <div className="up-sechead">
          <h2>Bajarilgan ishlar</h2>
          {works.length ? <button type="button" onClick={() => setGallery(0)}>Barchasini ko‘rish <ArrowRight /></button> : null}
        </div>
        {works.length ? (
          <div className="up-works">
            {works.slice(0, 8).map((src, i) => {
              const rest = works.length - 8;
              return (
                <button key={`${src}-${i}`} type="button" onClick={() => setGallery(i)}>
                  <Image src={src} alt={`${m.name} bajargan ish ${i + 1}`} fill sizes="25vw" className="object-cover" loading="lazy" />
                  {i === 7 && rest > 0 ? <span>+{rest}</span> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="up-empty" data-testid="usta-no-works"><ImageOff /> Usta hali bajargan ishlari rasmlarini joylamagan.</p>
        )}
      </section>

      <section id="usta-sharhlar" className="up-card up-sec">
        <h2>Mijozlar sharhlari</h2>
        <p className="up-empty" data-testid="usta-no-reviews"><Star /> Hali sharh yo‘q. Xizmatdan foydalangan klinikalar sharhlari shu yerda chiqadi.</p>
      </section>

      <section id="usta-malumot" className="up-card up-sec">
        <div className="up-sechead">
          <h2>Ma’lumot</h2>
          {m.description && m.description.length > 140 ? <button type="button" onClick={() => setMore(!more)}>{more ? "Yopish" : "Batafsil"}</button> : null}
        </div>
        <p className={more ? "up-about" : "up-about clamp"}>{m.description || "Usta hali o‘zi haqida batafsil yozmagan."}</p>
        <dl className="up-rows">
          <Row k="Turi" v={m.kind === "kompaniya" ? "Servis kompaniyasi" : "Usta"} />
          <Row k="Hudud" v={placeLine(m)} />
          {m.address ? <Row k="Manzil" v={m.address} /> : null}
          {since ? <Row k="StomaHub’da" v={`${MONTHS[since.getMonth()]} ${since.getFullYear()} dan`} /> : null}
          <Row k="Tekshiruv" v="Profil admin moderatsiyasidan o‘tgan" />
        </dl>
        <div className="up-links">
          {tg ? (
            <a href={telegramHref(tg)} target="_blank" rel="noreferrer" data-testid="usta-telegram"><Send /> {tg.startsWith("@") ? tg : `@${tg.replace(/^https?:\/\/t\.me\//, "")}`}</a>
          ) : (
            <button type="button" data-testid="usta-telegram" onClick={locked && !m.mine ? () => setRequest(true) : undefined}><Send /> {locked ? "Telegram qabul qilingach ochiladi" : "Telegram ko‘rsatilmagan"}</button>
          )}
          {sourceUrlValue(m.sourceUrl ?? "") ? (
            <a href={sourceUrlValue(m.sourceUrl ?? "")} target="_blank" rel="noopener nofollow" data-testid="usta-source"><Info /> {sourceUrlValue(m.sourceUrl ?? "")}</a>
          ) : null}
          {instagramHref(m.instagram ?? "") ? (
            <a href={instagramHref(m.instagram ?? "")} target="_blank" rel="noopener nofollow" data-testid="usta-instagram"><ImageIcon /> {instagramValue(m.instagram ?? "")}</a>
          ) : null}
        </div>
      </section>

      <div className="up-pad" />
      <div className="up-bar">
        {m.mine ? (
          <Link href={`/ustalar/yangi?id=${m.id}`} className="up-go">Bu sizning profilingiz — tahrirlash</Link>
        ) : (
          <>
            {phone ? (
              <a href={phoneHref(phone)} className="up-call" data-testid="usta-call"><Phone /> Qo‘ng‘iroq</a>
            ) : (
              <button type="button" className="up-call" data-testid="usta-call" onClick={() => setRequest(true)}><Phone /> Qo‘ng‘iroq</button>
            )}
            <button type="button" className="up-go" data-testid="usta-request-cta" onClick={() => setRequest(true)}><CalendarDays /> Buyurtma berish</button>
          </>
        )}
      </div>

      {gallery !== null && works.length ? <Gallery works={works} start={gallery} name={m.name} onClose={() => setGallery(null)} /> : null}
      {request ? <UstaRequestSheet master={m} onClose={() => setRequest(false)} onProfile={() => setRequest(false)} /> : null}
    </div>
  );
}

function TopBar({ onBack, saved, onSave, onShare }: { onBack: () => void; saved?: boolean; onSave?: () => void; onShare?: () => void }) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-3 flex items-center gap-2 bg-[#F4F7FC]/95 px-3 py-2 backdrop-blur" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
      <button type="button" onClick={onBack} className="grid size-10 place-items-center rounded-full text-[#0B1220]" aria-label="Orqaga">
        <ChevronLeft className="size-7" />
      </button>
      <span className="flex-1 text-[20px] font-extrabold tracking-[0.04em] text-[#0F766E]">
        STOMA<span className="text-[#8b93a7]">HUB</span>
      </span>
      {onSave ? (
        <button type="button" onClick={onSave} className="grid size-11 place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]" aria-label="Saqlash" aria-pressed={saved}>
          <Heart className={cn("size-5 text-[#0B1220]", saved && "fill-[#ef4444] text-[#ef4444]")} />
        </button>
      ) : null}
      {onShare ? (
        <button type="button" onClick={onShare} className="grid size-11 place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]" aria-label="Ulashish">
          <Share2 className="size-5 text-[#0B1220]" />
        </button>
      ) : null}
    </header>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3 py-2">
      <dt className="w-[110px] shrink-0 text-[#8b93a7]">{k}</dt>
      <dd className="min-w-0 flex-1 text-[#1a1d26]">{v}</dd>
    </div>
  );
}

function Gallery({ works, start, name, onClose }: { works: string[]; start: number; name: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0B1220]" role="dialog" aria-label="Bajarilgan ishlar">
      <div className="flex items-center justify-between px-3 py-2 text-white" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
        <span className="text-[13px]">
          {i + 1} / {works.length}
        </span>
        <button type="button" onClick={onClose} className="grid size-10 place-items-center" aria-label="Yopish">
          <X className="size-6" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <Image src={works[i]} alt={`${name} bajargan ish ${i + 1}`} fill sizes="100vw" className="object-contain" />
      </div>
      <div className="flex gap-1.5 overflow-x-auto p-3">
        {works.map((src, j) => (
          <button key={`${src}-${j}`} type="button" onClick={() => setI(j)} className={cn("relative size-14 shrink-0 overflow-hidden rounded-lg", j === i ? "ring-2 ring-white" : "opacity-60")}>
            <Image src={src} alt="" fill sizes="56px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
