"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical,
  Heart,
  ImageIcon,
  Images,
  Info,
  MapPin,
  MessageCircleMore,
  PackageCheck,
  Phone,
  Play,
  Send,
  Settings,
  Share2,
  Star,
  Truck,
  X,
} from "lucide-react";
import { Modal, OrderForm } from "@/components/lab-browse";
import { LabProfilePhone } from "@/components/labs/mobile/LabProfilePhone";
import { useLabWork } from "@/components/lab-provider";
import { findPhoneLab } from "@/data/phone14";
import { instagramHref, instagramValue, sourceUrlValue } from "@/lib/add-forms";
import { ReportButton, RevealPhone } from "@/components/forms/RevealPhone";
import {
  LabLogo,
  LabPhoto,
  VerifiedBadge,
  daysText,
  labGallery,
  labMapHref,
  labPlace,
  labTurnaround,
  priceText,
  somText,
  timeAgo,
  useSavedLabs,
} from "@/components/lab-ui";
import {
  labMaterialLabel,
  labPriceCatLabel,
  labServiceLabel,
  phoneHref,
  telegramHref,
  type Lab,
  type LabPriceCat,
  type LabPriceItem,
  type LabService,
} from "@/data/labs";
import { cn } from "@/lib/utils";

type Tab = "umumiy" | "xizmatlar" | "portfolio" | "sharhlar" | "aloqa";
const TABS: [Tab, string][] = [
  ["umumiy", "Umumiy"],
  ["xizmatlar", "Xizmatlar va narxlar"],
  ["portfolio", "Portfolio"],
  ["sharhlar", "Sharhlar"],
  ["aloqa", "Aloqa"],
];

const catToService: Partial<Record<LabPriceCat, LabService>> = {
  "metall-keramika": "crown",
  sirkon: "crown",
  emax: "crown",
  viner: "veneer",
  implant: "implant",
  protez: "removable",
};

const derivedTitles: Record<LabService, string> = {
  crown: "Koronka (crown)",
  veneer: "Viner (veneer)",
  implant: "Implant koronkasi",
  bridge: "Ko‘prik",
  removable: "Protez",
  cadcam: "CAD/CAM frezerlash",
  ortodontiya: "Ortodontiya",
};

/** Rows shown in "Xizmatlar va narxlar": the owner's price list, else the declared service types with neutral price/time. */
function serviceRows(lab: Lab): (LabPriceItem & { derived?: boolean })[] {
  if (lab.priceItems?.length) return lab.priceItems;
  return lab.services.map((s) => ({
    id: `svc-${s}`,
    title: derivedTitles[s],
    cat: "boshqa" as LabPriceCat,
    tags: lab.materials.slice(0, 2).map(labMaterialLabel),
    price: null,
    daysMin: lab.days,
    daysMax: lab.days,
    photo: null,
    derived: true,
  }));
}

export function LabProfile({ id }: { id: string }) {
  const { labs, labsReady } = useLabWork();
  const lab = labs.find((l) => l.id === id) ?? findPhoneLab(id) ?? null;
  if (!labsReady && !lab) return <p className="py-16 text-center text-sm text-[#8b93a7]">Yuklanmoqda…</p>;
  if (!lab)
    return (
      <div className="mx-auto max-w-md py-16 text-center" data-testid="lab-notfound">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#eef4ff] text-[#0066FF]">
          <FlaskConical className="size-6" />
        </span>
        <p className="mt-4 text-[16px] font-semibold text-[#1a1d26]">Laboratoriya topilmadi</p>
        <p className="mt-1 text-[13px] text-[#8b93a7]">Profil o‘chirilgan yoki hali tasdiqlanmagan bo‘lishi mumkin.</p>
        <Link href="/laboratoriya" className="mt-5 inline-flex h-11 items-center rounded-2xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white">
          Laboratoriyalarga qaytish
        </Link>
      </div>
    );
  return (
    <>
      <LabProfilePhone lab={lab} />
      <div className="hidden lg:block">
        <LabProfileView lab={lab} />
      </div>
    </>
  );
}

function LabProfileView({ lab }: { lab: Lab }) {
  const router = useRouter();
  const { labs, orders, authed } = useLabWork();
  const saved = useSavedLabs();
  const gallery = labGallery(lab);
  const portfolio = lab.portfolio ?? [];
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("xizmatlar");
  const [cat, setCat] = useState<LabPriceCat | "">("");
  const [allRows, setAllRows] = useState(false);
  const [video, setVideo] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const [order, setOrder] = useState<{ service?: LabService; note?: string } | null>(null);
  const [contact, setContact] = useState<"tg" | "call" | null>(null);
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => serviceRows(lab), [lab]);
  const cats = useMemo(() => Array.from(new Set(rows.filter((r) => !("derived" in r && r.derived)).map((r) => r.cat))), [rows]);
  const filtered = cat ? rows.filter((r) => r.cat === cat) : rows;
  const shownRows = allRows ? filtered : filtered.slice(0, 6);

  // Contacts open only after the lab accepted one of my orders (same rule as the rest of the app).
  const accepted = orders.find((o) => o.labId === lab.id && o.labPhone);
  const labPhone = accepted?.labPhone ?? lab.phone ?? null;
  const labTg = accepted?.labTelegram ?? lab.telegram ?? null;

  const current = gallery[Math.min(idx, Math.max(0, gallery.length - 1))] ?? null;
  const seen = timeAgo(lab.lastSeen);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: lab.name, text: `${lab.name} — dental laboratoriya`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  }

  function orderFrom(row?: LabPriceItem & { derived?: boolean }) {
    if (lab.mine) return;
    if (!row) return setOrder({});
    const svc = row.derived ? (row.id.replace("svc-", "") as LabService) : catToService[row.cat];
    setOrder({ service: svc, note: row.derived ? "" : `Xizmat: ${row.title}` });
  }

  return (
    <div className="-mx-4 -mt-4 min-h-dvh bg-[#F4F7FC] pb-[calc(10rem+env(safe-area-inset-bottom))] lg:mx-auto lg:mt-0 lg:max-w-2xl lg:pb-8" data-testid="lab-profile">
      {/* Hero */}
      <div className="relative">
        <LabPhoto src={current} alt={`${lab.name} laboratoriyasi`} sizes="(max-width: 1024px) 100vw, 672px" priority className="h-[260px] w-full lg:rounded-b-[26px]" iconClass="size-14" />
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-4" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
          <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push("/laboratoriya"))} className="grid size-10 place-items-center rounded-full bg-white/95 text-[#1a1d26] shadow" aria-label="Orqaga">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => saved.toggle(lab.id)} className="ml-auto grid size-10 place-items-center rounded-full bg-white/95 text-[#1a1d26] shadow" aria-label="Saqlash" aria-pressed={saved.has(lab.id)} data-testid="lab-heart">
            <Heart className={cn("size-[19px]", saved.has(lab.id) && "fill-[#ef4444] text-[#ef4444]")} />
          </button>
          <button type="button" onClick={() => void share()} className="grid size-10 place-items-center rounded-full bg-white/95 text-[#1a1d26] shadow" aria-label="Ulashish">
            <Share2 className="size-[18px]" />
          </button>
        </div>
        <span className="absolute right-4 bottom-11 inline-flex items-center gap-1 rounded-lg bg-[#0B1220]/60 px-2 py-1 text-[11.5px] font-medium text-white" data-testid="lab-media-counter">
          <Images className="size-3.5" />
          {gallery.length ? `${Math.min(idx, gallery.length - 1) + 1}/${gallery.length}` : "0/0"}
        </span>
        {copied ? <span className="absolute inset-x-0 top-16 mx-auto w-fit rounded-full bg-[#0B1220] px-3 py-1.5 text-[12px] text-white">Havola nusxalandi</span> : null}
      </div>

      <div className="relative -mt-7 rounded-t-[26px] bg-[#F4F7FC] px-4 pt-3">
        {/* Thumbnails (+ video tile only when a real video exists) */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="lab-thumbs">
          <div className="flex w-max gap-2">
            {gallery.map((src, i) => (
              <button key={`${src}-${i}`} type="button" onClick={() => setIdx(i)} className={cn("relative h-[58px] w-[80px] overflow-hidden rounded-xl ring-2", i === idx ? "ring-[#0066FF]" : "ring-transparent")} aria-label={`Rasm ${i + 1}`}>
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
            {lab.video ? (
              <button type="button" onClick={() => setVideo(true)} className="relative grid h-[58px] w-[80px] place-items-center overflow-hidden rounded-xl bg-[#0B1220] text-white" data-testid="lab-video-tile">
                {gallery[0] ? <Image src={gallery[0]} alt="" fill sizes="80px" className="object-cover opacity-45" /> : null}
                <span className="relative grid place-items-center">
                  <span className="grid size-7 place-items-center rounded-full bg-white/90 text-[#0066FF]">
                    <Play className="size-3.5 fill-current" />
                  </span>
                  <span className="mt-0.5 text-[11px] font-semibold">Video</span>
                </span>
              </button>
            ) : null}
            {!gallery.length && !lab.video ? (
              <span className="flex h-[58px] items-center gap-2 rounded-xl bg-white px-3 text-[12px] text-[#8b93a7]" data-testid="lab-no-photos">
                <Images className="size-4" />
                Laboratoriya rasmlari hali joylanmagan
              </span>
            ) : null}
          </div>
        </div>

        {/* Identity */}
        <div className="mt-3.5 flex items-start gap-3">
          <LabLogo lab={lab} className="size-[78px] shadow-[0_4px_14px_rgba(15,23,42,0.08)]" />
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-start gap-2">
              <h1 className="flex min-w-0 flex-1 items-center gap-1.5 text-[20px] leading-tight font-bold text-[#0B1220]">
                <span className="truncate">{lab.name}</span>
                <VerifiedBadge lab={lab} className="size-5" />
              </h1>
              <span className="shrink-0 text-right" data-testid="lab-online">
                <span className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold", lab.online ? "bg-[#e7f8ee] text-[#15803d]" : "bg-[#eef1f6] text-[#6b7487]")}>
                  <span className={cn("size-2 rounded-full", lab.online ? "bg-[#22c55e]" : "bg-[#a3acbd]")} />
                  {lab.online ? "Onlayn" : "Oflayn"}
                </span>
                <span className="mt-0.5 block text-[10.5px] text-[#8b93a7]">{lab.online ? "Hozir faol" : seen ? seen : "Faollik —"}</span>
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[12.5px] text-[#6b7487]" data-testid="lab-rating-row">
              <Star className="size-4 text-[#c9d1de]" />
              Hali baho yo‘q
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-[#4b5568]">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 text-[#6b7487]" />
                {labPlace(lab)}
              </span>
              <a href={labMapHref(lab)} target="_blank" rel="noreferrer" className="inline-flex items-center font-semibold text-[#0066FF]" data-testid="lab-map">
                Xaritada ko‘rish
                <ChevronRight className="size-3.5" />
              </a>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3.5 grid grid-cols-4 gap-1.5" data-testid="lab-stats">
          <Stat icon={<CalendarDays className="size-[17px]" />} value={lab.years != null ? `${lab.years} yil` : "—"} label="Tajriba" />
          <Stat icon={<PackageCheck className="size-[17px]" />} value={lab.done > 0 ? `${lab.done}` : "—"} label="Bajarilgan ishlar" />
          <Stat icon={<Clock className="size-[17px]" />} value={labTurnaround(lab)} label="O‘rtacha muddat" />
          <Stat
            icon={<Truck className="size-[17px]" />}
            value={lab.courier === "yoq" ? "Kurier yo‘q" : "Kurier xizmati"}
            label={lab.courier === "ha" ? lab.courierArea || "Mavjud" : lab.courier === "yoq" ? "O‘zingiz olib ketasiz" : "Aniqlanmoqda"}
            small
          />
        </div>

        {/* Tabs */}
        <nav className="sticky top-0 z-20 -mx-4 mt-3.5 bg-[#F4F7FC]/95 px-4 py-1.5 backdrop-blur" aria-label="Profil bo‘limlari">
          <div className="flex gap-0 overflow-x-auto rounded-2xl bg-white p-1 shadow-[0_2px_10px_rgba(15,23,42,0.05)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="lab-tabs">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={tab === key}
                className={cn("h-10 flex-auto shrink-0 rounded-xl px-[7px] text-[12px] whitespace-nowrap", tab === key ? "bg-[#0066FF] font-semibold text-white shadow-[0_4px_12px_rgba(0,102,255,0.3)]" : "font-medium text-[#1a1d26]")}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        {tab === "umumiy" ? (
          <>
            <Card icon={<Info className="size-[19px]" />} title="Laboratoriya haqida">
              <p className="text-[13px] leading-relaxed text-[#4b5568]">{lab.description || "Laboratoriya hali o‘zi haqida batafsil yozmagan."}</p>
              <InfoRow label="Xizmat turlari" value={lab.services.map(labServiceLabel).join(", ") || "—"} />
              <InfoRow label="Materiallar" value={lab.materials.map(labMaterialLabel).join(", ") || "—"} />
              <InfoRow label="Narx" value={lab.priceFrom != null ? `${somText(lab.priceFrom)}dan` : "Narx kelishiladi"} />
            </Card>
            <PortfolioCard lab={lab} portfolio={portfolio} onAll={() => setTab("portfolio")} onOpen={setViewer} />
          </>
        ) : null}

        {tab === "xizmatlar" ? (
          <>
            <Card
              icon={<Settings className="size-[19px]" />}
              title="Xizmatlar va narxlar"
              sub="Laboratoriya xizmatlari va taxminiy muddatlari"
              action={filtered.length > 6 ? (allRows ? "Qisqaroq" : "To‘liq narxlar") : "To‘liq narxlar"}
              onAction={() => setAllRows(!allRows)}
              actionBoxed
              testId="lab-services"
            >
              <div className="-mx-3.5 mb-2 overflow-x-auto px-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max gap-1.5">
                  {[{ id: "" as const, label: "Barchasi" }, ...cats.map((c) => ({ id: c, label: labPriceCatLabel(c) }))].map((c) => (
                    <button
                      key={c.id || "all"}
                      type="button"
                      onClick={() => setCat(c.id)}
                      aria-pressed={cat === c.id}
                      className={cn("h-8 shrink-0 rounded-full px-3.5 text-[12.5px] font-medium", cat === c.id ? "bg-[#0066FF] font-semibold text-white" : "border border-[#e6ebf3] bg-white text-[#1a1d26]")}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {!lab.priceItems?.length ? (
                <p className="mb-1 rounded-xl bg-[#f6f8fb] px-3 py-2 text-[11.5px] text-[#8b93a7]" data-testid="lab-no-prices">
                  Laboratoriya hali narxlar ro‘yxatini kiritmagan — xizmat turlari ko‘rsatilmoqda.
                </p>
              ) : null}
              <ul className="divide-y divide-[#eef1f6]">
                {shownRows.map((row) => (
                  <li key={row.id}>
                    <button type="button" onClick={() => orderFrom(row)} className="flex w-full items-center gap-3 py-2.5 text-left" data-testid="lab-service-row">
                      <LabPhoto src={row.photo} alt="" sizes="84px" className="h-[54px] w-[84px] shrink-0 rounded-xl" iconClass="size-5" />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-[13.5px] leading-snug font-semibold text-[#0B1220]">{row.title}</span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          {(row.tags.length ? row.tags : [row.derived ? "Xizmat turi" : labPriceCatLabel(row.cat)]).map((t) => (
                            <span key={t} className="rounded-md bg-[#f1f3f7] px-1.5 py-0.5 text-[10.5px] font-medium text-[#6b7487]">
                              {t}
                            </span>
                          ))}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className={cn("block text-[13.5px] font-bold", row.price != null ? "text-[#0066FF]" : "text-[#6b7487]")}>{priceText(row)}</span>
                        <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-[#6b7487]">
                          <Clock className="size-3.5" />
                          {daysText(row.daysMin, row.daysMax)}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-[#a3acbd]" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
            <PortfolioCard lab={lab} portfolio={portfolio} onAll={() => setTab("portfolio")} onOpen={setViewer} />
          </>
        ) : null}

        {tab === "portfolio" ? (
          <Card icon={<ImageIcon className="size-[19px]" />} title="Portfolio" sub={portfolio.length ? `${portfolio.length} ta ish` : undefined}>
            {portfolio.length ? (
              <div className="grid grid-cols-3 gap-1.5" data-testid="lab-portfolio-grid">
                {portfolio.map((src, i) => (
                  <button key={`${src}-${i}`} type="button" onClick={() => setViewer(i)} className="relative aspect-square overflow-hidden rounded-xl bg-[#eef2f8]">
                    <Image src={src} alt={`${lab.name} ishi ${i + 1}`} fill sizes="33vw" className="object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyNote icon={<ImageIcon className="size-5" />} text="Laboratoriya hali portfolio rasmlarini joylamagan." />
            )}
          </Card>
        ) : null}

        {tab === "sharhlar" ? (
          <Card icon={<Star className="size-[19px]" />} title="Sharhlar" testId="lab-reviews">
            <div className="flex items-center gap-3">
              <span className="text-[28px] font-bold text-[#c2c9d6]">—</span>
              <span>
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 text-[#d5dbe6]" />
                  ))}
                </span>
                <span className="mt-0.5 block text-[12px] text-[#8b93a7]">Hali baho yo‘q · 0 ta sharh</span>
              </span>
            </div>
            <EmptyNote icon={<MessageCircleMore className="size-5" />} text="Hali sharh qoldirilmagan. Buyurtmangiz yetkazilgach, birinchi bo‘lib baho bering." />
          </Card>
        ) : null}

        {tab === "aloqa" ? (
          <Card icon={<Phone className="size-[19px]" />} title="Aloqa">
            <InfoRow label="Manzil" value={labPlace(lab)} />
            <InfoRow label="Telefon" value={labPhone ?? "Raqamni ko‘rsatish orqali ochiladi"} />
            {!lab.mine && !labPhone ? <p className="mt-2 text-[13px]"><RevealPhone kind="lab" id={lab.id} /></p> : null}
            {!lab.mine ? <p className="mt-2"><ReportButton kind="lab" id={lab.id} /></p> : null}
            <InfoRow label="Telegram" value={labTg ?? (labPhone ? "Ko‘rsatilmagan" : "Buyurtma qabul qilingach ochiladi")} />
            <InfoRow label="Kurier" value={lab.courier === "ha" ? `Bor${lab.courierArea ? ` · ${lab.courierArea}` : ""}` : lab.courier === "yoq" ? "Yo‘q" : "Aniqlanmoqda"} />
            {sourceUrlValue(lab.sourceUrl ?? "") ? (
              <a href={sourceUrlValue(lab.sourceUrl ?? "")} target="_blank" rel="noopener nofollow" className="mt-3 inline-flex text-[13px] font-semibold text-[#0066FF] break-all" data-testid="lab-source">
                {sourceUrlValue(lab.sourceUrl ?? "")}
              </a>
            ) : null}
            {instagramHref(lab.instagram ?? "") ? (
              <a href={instagramHref(lab.instagram ?? "")} target="_blank" rel="noopener nofollow" className="mt-3 inline-flex text-[13px] font-semibold text-[#0066FF] break-all" data-testid="lab-instagram">
                {instagramValue(lab.instagram ?? "")}
              </a>
            ) : null}
            <a href={labMapHref(lab)} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#dbe3f0] px-3.5 text-[13px] font-semibold text-[#0066FF]">
              <MapPin className="size-4" />
              Xaritada ko‘rish
            </a>
          </Card>
        ) : null}

        {lab.mine ? (
          <p className="mt-3 rounded-xl bg-[#eef4ff] px-3 py-2.5 text-[12.5px] text-[#2f4a7a]">
            Bu sizning laboratoriyangiz.{" "}
            <Link href={`/laboratoriya/yangi?id=${lab.id}`} className="font-semibold text-[#0066FF]">
              Profilni tahrirlash
            </Link>
          </p>
        ) : null}
      </div>

      {/* Sticky action bar (above the global 5-tab bar on mobile) */}
      <div
        className="fixed inset-x-0 z-30 border-t border-[#e6ebf3] bg-white/95 px-3 py-2.5 backdrop-blur lg:static lg:mx-4 lg:mt-4 lg:rounded-2xl lg:border"
        style={{ bottom: "calc(4.15rem + env(safe-area-inset-bottom))" }}
        data-testid="lab-action-bar"
      >
        <div className="grid grid-cols-[1fr_1.08fr_1.12fr] gap-1.5">
          <BarButton
            icon={<MessageCircleMore className="size-[19px]" />}
            title="Xabar yozish"
            sub="(Telegram)"
            href={labTg ? telegramHref(labTg) : undefined}
            onClick={labTg ? undefined : () => setContact("tg")}
            testId="lab-msg"
          />
          <BarButton icon={<Phone className="size-[18px]" />} title="Qo‘ng‘iroq qilish" href={labPhone ? phoneHref(labPhone) : undefined} onClick={labPhone ? undefined : () => setContact("call")} testId="lab-call" />
          {lab.mine ? (
            <Link href="/laboratoriya/mening" className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#0066FF] px-2 text-[13px] font-semibold text-white">
              Tahrirlash
            </Link>
          ) : (
            <button type="button" onClick={() => orderFrom()} className="flex h-[52px] items-center justify-center gap-1.5 rounded-2xl bg-[#0066FF] px-1.5 text-white shadow-[0_8px_18px_rgba(0,102,255,0.3)]" data-testid="lab-order">
              <FileText className="size-[18px] shrink-0" />
              <span className="text-left leading-tight">
                <span className="block text-[12.5px] font-semibold whitespace-nowrap">Buyurtma berish</span>
                <span className="block text-[11px] text-white/85">(Online)</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {order ? (
        <Modal title="Yangi buyurtma" onClose={() => setOrder(null)}>
          <OrderForm labs={labs} preselectLabId={lab.id} presetService={order.service} presetNote={order.note} onCancel={() => setOrder(null)} onSaved={() => setOrder(null)} />
        </Modal>
      ) : null}

      {contact ? (
        <Modal title={contact === "tg" ? "Telegram orqali yozish" : "Qo‘ng‘iroq qilish"} onClose={() => setContact(null)}>
          <div className="text-center" data-testid="lab-contact-sheet">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#eef4ff] text-[#0066FF]">{contact === "tg" ? <Send className="size-5" /> : <Phone className="size-5" />}</span>
            <p className="mt-3 text-[15px] font-semibold text-[#1a1d26]">
              {labPhone && contact === "tg" ? "Laboratoriya Telegram manzilini ko‘rsatmagan" : "Aloqa ma’lumotlari buyurtma qabul qilingach ochiladi"}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-[13px] text-[#8b93a7]">
              {labPhone && contact === "tg"
                ? "Telefon orqali bog‘lanishingiz mumkin."
                : "Laboratoriya telefon raqami va Telegrami ochiq ko‘rsatilmaydi. Buyurtma bering — lab qabul qilgach, shu yerda ochiladi."}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {labPhone && contact === "tg" ? (
                <a href={phoneHref(labPhone)} className="inline-flex h-11 items-center rounded-xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white">
                  Qo‘ng‘iroq qilish
                </a>
              ) : lab.mine ? null : (
                <button
                  type="button"
                  onClick={() => {
                    setContact(null);
                    orderFrom();
                  }}
                  className="inline-flex h-11 items-center rounded-xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white"
                >
                  {authed ? "Buyurtma berish" : "Kirish va buyurtma berish"}
                </button>
              )}
            </div>
          </div>
        </Modal>
      ) : null}

      {video && lab.video ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4" onClick={() => setVideo(false)}>
          <button type="button" className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/15 text-white" aria-label="Yopish">
            <X className="size-5" />
          </button>
          <video src={lab.video} controls autoPlay playsInline className="max-h-[80vh] w-full max-w-lg rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}

      {viewer !== null && portfolio[viewer] ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90" onClick={() => setViewer(null)} data-testid="lab-viewer">
          <button type="button" className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/15 text-white" aria-label="Yopish">
            <X className="size-5" />
          </button>
          <div className="relative h-[70vh] w-full max-w-lg">
            <Image src={portfolio[viewer]} alt={`${lab.name} ishi ${viewer + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          <span className="absolute bottom-6 rounded-full bg-white/15 px-3 py-1 text-[12px] text-white">
            {viewer + 1}/{portfolio.length}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function PortfolioCard({ lab, portfolio, onAll, onOpen }: { lab: Lab; portfolio: string[]; onAll: () => void; onOpen: (i: number) => void }) {
  const shown = portfolio.length > 5 ? portfolio.slice(0, 4) : portfolio.slice(0, 5);
  const rest = portfolio.length - shown.length;
  return (
    <Card icon={<ImageIcon className="size-[19px]" />} title="Portfolio" action={portfolio.length ? "Barchasini ko‘rish" : undefined} onAction={onAll} testId="lab-portfolio">
      {portfolio.length ? (
        <div className="grid grid-cols-5 gap-1.5">
          {shown.map((src, i) => (
            <button key={`${src}-${i}`} type="button" onClick={() => onOpen(i)} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#eef2f8]">
              <Image src={src} alt={`${lab.name} ishi ${i + 1}`} fill sizes="80px" className="object-cover" loading="lazy" />
            </button>
          ))}
          {rest > 0 ? (
            <button type="button" onClick={onAll} className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-xl bg-[#0B1220] text-white">
              <Image src={portfolio[4]} alt="" fill sizes="80px" className="object-cover opacity-35" loading="lazy" />
              <span className="relative text-center leading-tight">
                <span className="block text-[16px] font-bold">+{rest}</span>
                <span className="block text-[11px]">ish</span>
              </span>
            </button>
          ) : null}
        </div>
      ) : (
        <EmptyNote icon={<ImageIcon className="size-5" />} text="Laboratoriya hali portfolio rasmlarini joylamagan." />
      )}
    </Card>
  );
}

function Card({
  icon,
  title,
  sub,
  action,
  onAction,
  actionBoxed,
  children,
  testId,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
  actionBoxed?: boolean;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section className="mt-3 rounded-[20px] border border-[#eceff5] bg-white px-3.5 py-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]" data-testid={testId}>
      <div className="mb-2.5 flex items-start gap-2">
        <span className="mt-0.5 text-[#0066FF]">{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-bold text-[#0B1220]">{title}</h2>
          {sub ? <p className="mt-0.5 text-[11.5px] text-[#8b93a7]">{sub}</p> : null}
        </div>
        {action ? (
          <button
            type="button"
            onClick={onAction}
            className={cn("inline-flex shrink-0 items-center gap-0.5 text-[12.5px] font-semibold text-[#0066FF]", actionBoxed && "h-8 rounded-full border border-[#cfe0ff] px-3")}
          >
            {action}
            <ChevronRight className="size-3.5" />
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Stat({ icon, value, label, small }: { icon: ReactNode; value: string; label: string; small?: boolean }) {
  return (
    <div className="flex min-w-0 items-start gap-1.5 rounded-2xl border border-[#eceff5] bg-white px-2 py-2.5">
      <span className="mt-px shrink-0 text-[#0066FF]">{icon}</span>
      <span className="min-w-0 leading-tight">
        <span className={cn("block font-bold break-words text-[#0B1220]", small ? "text-[11.5px]" : "text-[13px]")}>{value}</span>
        <span className="mt-0.5 block text-[10px] leading-[1.15] break-words text-[#8b93a7]">{label}</span>
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2.5 flex items-start justify-between gap-3 border-t border-[#f0f2f6] pt-2.5 text-[13px]">
      <span className="shrink-0 text-[#8b93a7]">{label}</span>
      <span className="text-right font-medium text-[#1a1d26]">{value}</span>
    </div>
  );
}

function EmptyNote({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="mt-1 flex items-center gap-3 rounded-xl bg-[#f6f8fb] px-3 py-4 text-[12.5px] text-[#8b93a7]">
      <span className="shrink-0">{icon}</span>
      {text}
    </div>
  );
}

function BarButton({ icon, title, sub, href, onClick, testId }: { icon: ReactNode; title: string; sub?: string; href?: string; onClick?: () => void; testId: string }) {
  const cls = "flex h-[52px] min-w-0 items-center justify-center gap-1 rounded-2xl border border-[#dbe3f0] bg-white px-1 text-[#0066FF]";
  const inner = (
    <>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 text-left leading-tight">
        <span className="block text-[12px] font-semibold whitespace-nowrap text-[#1a1d26]">{title}</span>
        {sub ? <span className="block text-[10.5px] text-[#8b93a7]">{sub}</span> : null}
      </span>
    </>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={cls} data-testid={testId}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls} data-testid={testId}>
      {inner}
    </button>
  );
}

