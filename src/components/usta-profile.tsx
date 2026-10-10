"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageIcon,
  ImageOff,
  Info,
  MapPin,
  Phone,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { UstaIcon } from "@/components/usta-icons";
import { useUstaWork } from "@/components/usta-provider";
import { UstaRequestSheet } from "@/components/usta-request-sheet";
import { MasterAvatar, NoRating, VerifiedBadge, placeLine, useFavMasters } from "@/components/usta-ui";
import { phoneHref, serviceTagLabels, telegramHref, type Master } from "@/data/masters";
import { cn } from "@/lib/utils";

const TABS = [
  ["asosiy", "Asosiy"],
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
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("asosiy");
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
          <Link href="/ustalar" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white">
            Ustalar ro‘yxati
          </Link>
        </div>
      </div>
    );
  }

  const m: Master = master;
  const works = m.works ?? [];
  const chips = m.services.slice(0, 3);
  const extraChips = m.services.length - chips.length;
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

  const locked = !contact;
  const tg = contact?.masterTelegram ?? null;

  return (
    <div className="-mx-4 -mt-4 min-h-dvh bg-[#F4F7FC] px-4 pb-8 lg:mx-auto lg:mt-0 lg:max-w-[560px]" data-testid="usta-profile">
      <TopBar onBack={() => (window.history.length > 1 ? router.back() : router.push("/ustalar"))} saved={fav.has(m.id)} onSave={() => fav.toggle(m.id)} onShare={() => void share()} />
      {copied ? <p className="fixed inset-x-0 top-16 z-50 mx-auto w-fit rounded-full bg-[#0B1220] px-4 py-2 text-[12px] text-white">Havola nusxalandi</p> : null}

      {/* Main card */}
      <section id="usta-asosiy" className="scroll-mt-16 rounded-[24px] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
        <div className="flex gap-3.5">
          <MasterAvatar master={m} size={86} priority />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h1 className="flex min-w-0 flex-1 items-center gap-1 text-[19px] leading-tight font-bold text-[#0B1220]">
                <span className="truncate">{m.name}</span>
                <VerifiedBadge className="size-[19px]" />
              </h1>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  m.online ? "bg-[#e7f8ef] text-[#16a34a]" : "bg-[#f1f3f7] text-[#8b93a7]",
                )}
                data-testid="usta-online"
              >
                <span className={cn("size-1.5 rounded-full", m.online ? "bg-[#22c55e]" : "bg-[#b6bdca]")} />
                {m.online ? "Online" : "Oflayn"}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#6b7487]">
              {m.title}
              {m.years > 0 ? ` · ${m.years} yillik tajriba` : ""}
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
              <NoRating className="text-[13px]" />
              <span className="inline-flex items-center gap-1 text-[#4b5568]">
                <BriefcaseBusiness className="size-3.5 text-[#0066FF]" />
                {m.jobs > 0 ? `${m.jobs}+ ish` : "Yangi usta"}
              </span>
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-[13px] text-[#4b5568]">
              <MapPin className="size-3.5 text-[#0066FF]" />
              {placeLine(m)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-hidden">
          {chips.map((s) => (
            <span key={s} className="inline-flex h-8 min-w-0 items-center gap-1 rounded-xl border border-[#e6ebf3] bg-white px-2 text-[11.5px] font-medium whitespace-nowrap text-[#1a1d26]">
              <UstaIcon name={s} className="size-[15px] shrink-0 text-[#1a1d26]" style={{ ["--ua" as string]: "#1a1d26" }} />
              <span className="truncate">{serviceTagLabels[s]}</span>
            </span>
          ))}
          {extraChips > 0 ? (
            <button type="button" onClick={() => go("xizmatlar")} className="inline-flex h-8 shrink-0 items-center rounded-xl border border-[#e6ebf3] bg-white px-2.5 text-[11.5px] font-semibold text-[#4b5568]">
              +{extraChips}
            </button>
          ) : null}
        </div>

        {m.mine ? (
          <Link href="/ustalar/mening" className="mt-3.5 flex h-[60px] w-full items-center justify-center rounded-2xl border border-[#dbe3f0] text-[15px] font-semibold text-[#1a1d26]">
            Bu sizning profilingiz — tahrirlash
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setRequest(true)}
            className="mt-3.5 flex h-[62px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#3b8bff] text-white shadow-[0_10px_22px_rgba(0,102,255,0.3)]"
            data-testid="usta-request-cta"
          >
            <Send className="size-6" />
            <span className="text-left leading-tight">
              <span className="block text-[16.5px] font-semibold">Xizmat so‘rovi yuborish</span>
              <span className="block text-[12px] text-white/85">Bepul · Tez javob olasiz</span>
            </span>
          </button>
        )}

        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <ContactButton
            tone="green"
            icon={<Phone className="size-[18px] fill-current" />}
            title="Qo‘ng‘iroq qilish"
            sub={contact?.masterPhone ?? "Qabul qilingach ochiladi"}
            href={contact?.masterPhone ? phoneHref(contact.masterPhone) : undefined}
            onClick={locked && !m.mine ? () => setRequest(true) : undefined}
            testId="usta-call"
          />
          <ContactButton
            tone="blue"
            icon={<Send className="size-[18px] fill-current" />}
            title="Telegram orqali yozish"
            sub={tg ? (tg.startsWith("@") ? tg : `@${tg.replace(/^https?:\/\/t\.me\//, "")}`) : locked ? "Qabul qilingach ochiladi" : "Telegram ko‘rsatilmagan"}
            href={tg ? telegramHref(tg) : undefined}
            external
            onClick={locked && !m.mine ? () => setRequest(true) : undefined}
            testId="usta-telegram"
          />
        </div>
      </section>

      {/* Tabs */}
      <nav className="sticky top-0 z-20 -mx-4 mt-3 border-b border-[#e6ebf3] bg-[#F4F7FC]/95 px-4 backdrop-blur" aria-label="Profil bo‘limlari">
        <div className="flex justify-between">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => go(key)}
              className={cn("relative h-11 px-1.5 text-[13.5px]", tab === key ? "font-semibold text-[#0066FF]" : "font-medium text-[#4b5568]")}
            >
              {label}
              {tab === key ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0066FF]" /> : null}
            </button>
          ))}
        </div>
      </nav>

      {/* Usta haqida */}
      <Card id="usta-haqida" icon={<UserRound className="size-[19px]" />} title="Usta haqida" action={m.description && m.description.length > 140 ? (more ? "Yopish" : "Batafsil") : undefined} onAction={() => setMore(!more)}>
        <p className={cn("text-[13px] leading-relaxed text-[#4b5568]", !more && "line-clamp-3")}>{m.description || "Usta hali o‘zi haqida batafsil yozmagan."}</p>
        <div className="mt-3 grid grid-cols-4 gap-1 border-t border-[#eef1f6] pt-3" data-testid="usta-stats">
          <Stat icon={<CalendarDays className="size-[13px]" />} tone="blue" value={m.years > 0 ? `${m.years} yil` : "—"} label="Tajriba" />
          <Stat icon={<BriefcaseBusiness className="size-[13px]" />} tone="blue" value={m.jobs > 0 ? `${m.jobs}+` : "Yangi"} label="Bajarilgan ish" />
          <Stat icon={<ShieldCheck className="size-[13px]" />} tone="green" value="—" label="Kafolat" />
          <Stat icon={<MapPin className="size-[13px]" />} tone="blue" value={m.city} label="Xizmat hududi" />
        </div>
      </Card>

      {/* Bajarilgan ishlar */}
      <Card id="usta-ishlar" icon={<ImageIcon className="size-[19px]" />} title="Bajarilgan ishlar" action={works.length ? "Barchasini ko‘rish" : undefined} onAction={() => setGallery(0)}>
        {works.length ? (
          <div className="grid grid-cols-5 gap-1.5">
            {works.slice(0, 5).map((src, i) => {
              const rest = works.length - 5;
              const last = i === 4 && rest > 0;
              return (
                <button key={`${src}-${i}`} type="button" onClick={() => setGallery(i)} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#eef2f8]">
                  <Image src={src} alt={`${m.name} bajargan ish ${i + 1}`} fill sizes="80px" className="object-cover" loading="lazy" />
                  {last ? <span className="absolute inset-0 grid place-items-center bg-[#0B1220]/55 text-[16px] font-bold text-white">+{rest}</span> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-[#f6f8fb] px-3 py-4 text-[12.5px] text-[#8b93a7]" data-testid="usta-no-works">
            <ImageOff className="size-5 shrink-0" />
            Usta hali bajargan ishlari rasmlarini joylamagan.
          </div>
        )}
      </Card>

      {/* Asosiy xizmatlar */}
      <Card id="usta-xizmatlar" icon={<Settings className="size-[19px]" />} title="Asosiy xizmatlar" action={m.services.length > 4 ? "Barchasini ko‘rish" : undefined} onAction={() => setMore(true)}>
        <div className="grid grid-cols-4 gap-2" data-testid="usta-services">
          {(more ? m.services : m.services.slice(0, 4)).map((s) => (
            <div key={s} className="rounded-2xl bg-[#f4f8ff] p-2.5">
              <span className="grid size-10 place-items-center rounded-full bg-white text-[#0066FF] shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
                <UstaIcon name={s} className="size-[22px]" />
              </span>
              <p className="mt-2 text-[12px] leading-tight font-semibold text-[#0B1220]">{serviceTagLabels[s]}</p>
              <p className="mt-1 text-[10.5px] text-[#8b93a7]">Narx kelishiladi</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Sharhlar */}
      <Card id="usta-sharhlar" icon={<Star className="size-[19px] fill-[#f5b301] text-[#f5b301]" />} title="Usta haqidagi sharhlar">
        <div className="flex items-center gap-3 rounded-xl bg-[#f6f8fb] px-3 py-4" data-testid="usta-no-reviews">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#c5cbd8]">
            <Star className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-[13.5px] font-semibold text-[#1a1d26]">Hali sharh yo‘q</span>
            <span className="mt-0.5 block text-[12px] text-[#8b93a7]">Xizmatdan foydalangan klinikalar sharhlari shu yerda chiqadi.</span>
          </span>
        </div>
      </Card>

      {/* Ma’lumot */}
      <Card id="usta-malumot" icon={<Info className="size-[19px]" />} title="Ma’lumot">
        <dl className="divide-y divide-[#eef1f6] text-[13px]">
          <Row k="Turi" v={m.kind === "kompaniya" ? "Servis kompaniyasi" : "Usta"} />
          <Row k="Mutaxassislik" v={m.title} />
          <Row k="Hudud" v={placeLine(m)} />
          {since ? <Row k="StomaHub’da" v={`${MONTHS[since.getMonth()]} ${since.getFullYear()} dan`} /> : null}
          <Row k="Tekshiruv" v="Profil admin moderatsiyasidan o‘tgan" />
          <Row k="Telefon" v={contact?.masterPhone ?? "Yopiq — so‘rovingiz qabul qilingach ochiladi"} />
        </dl>
      </Card>

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
      <span className="flex-1 text-[20px] font-extrabold tracking-[0.04em] text-[#0066FF]">
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

function ContactButton({
  tone,
  icon,
  title,
  sub,
  href,
  external,
  onClick,
  testId,
}: {
  tone: "green" | "blue";
  icon: ReactNode;
  title: string;
  sub: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  testId: string;
}) {
  const cls = cn("flex min-h-[56px] min-w-0 items-center gap-2 rounded-2xl border bg-white px-2.5 py-2 text-left", tone === "green" ? "border-[#bfe8cf]" : "border-[#bcd4ff]");
  const inner = (
    <>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", tone === "green" ? "bg-[#e3f6ea] text-[#16a34a]" : "bg-[#e3eeff] text-[#0066FF]")}>{icon}</span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[12.5px] font-semibold whitespace-nowrap text-[#0B1220]">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-[#6b7487]">{sub}</span>
      </span>
    </>
  );
  if (href)
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={cls} data-testid={testId}>
        {inner}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={cls} data-testid={testId}>
      {inner}
    </button>
  );
}

function Card({ id, icon, title, action, onAction, children }: { id: string; icon: ReactNode; title: string; action?: string; onAction?: () => void; children: ReactNode }) {
  return (
    <section id={id} className="mt-3 scroll-mt-16 rounded-[22px] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-[#0066FF]">{icon}</span>
        <h2 className="text-[15.5px] font-bold text-[#0B1220]">{title}</h2>
        {action ? (
          <button type="button" onClick={onAction} className="ml-auto inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#0066FF]">
            {action}
            <ChevronRight className="size-3.5" />
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Stat({ icon, tone, value, label }: { icon: ReactNode; tone: "blue" | "green"; value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", tone === "green" ? "bg-[#e3f6ea] text-[#16a34a]" : "bg-[#e3eeff] text-[#0066FF]")}>{icon}</span>
      <span className="min-w-0 leading-tight">
        <span className={cn("block truncate font-bold", value === "—" ? "text-[13px] text-[#8b93a7]" : "text-[12px] tracking-tight text-[#0B1220]")}>{value}</span>
        <span className="block text-[9.5px] leading-[1.15] text-[#6b7487]">{label}</span>
      </span>
    </div>
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
