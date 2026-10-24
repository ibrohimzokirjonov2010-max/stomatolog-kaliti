"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Heart,
  ImageIcon,
  Info,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Send,
  Share2,
  ShieldCheck,
  Star,
  Truck,
  X,
} from "lucide-react";
import { Modal, OrderForm } from "@/components/lab-browse";
import { useLabWork } from "@/components/lab-provider";
import { ReportButton, RevealPhone } from "@/components/forms/RevealPhone";
import { LabLogo, LabPhoto, VerifiedBadge, daysText, labGallery, labMapHref, labPlace, labTurnaround, priceText, somText, useSavedLabs } from "@/components/lab-ui";
import { labMaterialLabel, labServiceLabel, phoneHref, telegramHref, type Lab, type LabPriceCat, type LabPriceItem, type LabService } from "@/data/labs";
import { instagramHref, instagramValue, sourceUrlValue } from "@/lib/add-forms";
import "./lab-profile-phone.css";

type Tab = "xizmatlar" | "ishlar" | "sharhlar" | "malumot";
const TABS: { id: Tab; label: string; icon: typeof Star }[] = [
  { id: "xizmatlar", label: "Xizmatlar", icon: Package },
  { id: "ishlar", label: "Ishlar", icon: ImageIcon },
  { id: "sharhlar", label: "Sharhlar", icon: Star },
  { id: "malumot", label: "Ma’lumot", icon: Info },
];

const catToService: Partial<Record<LabPriceCat, LabService>> = {
  "metall-keramika": "crown",
  sirkon: "crown",
  emax: "crown",
  viner: "veneer",
  implant: "implant",
  protez: "removable",
};

type Row = LabPriceItem & { derived?: boolean };

function rowsOf(lab: Lab): Row[] {
  if (lab.priceItems?.length) return lab.priceItems;
  return lab.services.map((s) => ({
    id: `svc-${s}`,
    title: labServiceLabel(s),
    cat: "boshqa" as LabPriceCat,
    tags: lab.materials.slice(0, 2).map(labMaterialLabel),
    price: null,
    daysMin: lab.days,
    daysMax: lab.days,
    photo: null,
    derived: true,
  }));
}

/** Phone layout of /laboratoriya/[id] (desktop keeps LabProfileView). */
export function LabProfilePhone({ lab }: { lab: Lab }) {
  const { labs, orders, authed } = useLabWork();
  const saved = useSavedLabs();
  const gallery = labGallery(lab);
  const portfolio = lab.portfolio ?? [];
  const rows = rowsOf(lab);
  const [tab, setTab] = useState<Tab>("xizmatlar");
  const params = useSearchParams();
  // "Buyurtma berish" on the lab list links here with ?buyurtma=1.
  const [order, setOrder] = useState<{ service?: LabService; note?: string } | null>(() => (!lab.mine && params.get("buyurtma") === "1" ? {} : null));
  const [contact, setContact] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Contacts open only after the lab accepted one of my orders (same rule as the desktop profile).
  const accepted = orders.find((o) => o.labId === lab.id && o.labPhone);
  const labPhone = accepted?.labPhone ?? lab.phone ?? null;
  const labTg = accepted?.labTelegram ?? lab.telegram ?? null;
  const turnaround = labTurnaround(lab);
  const materials = lab.materials.slice(0, 2).map(labMaterialLabel).join(", ");
  const courier = lab.courier === "ha" ? (lab.courierArea ? `${lab.courierArea} bo‘ylab yetkazib berish` : "Kurier orqali yetkazib berish") : lab.delivery ? "Yetkazib berish bor" : "Olib ketish";

  function orderFrom(row?: Row) {
    if (lab.mine) return;
    if (!row) return setOrder({});
    const service = row.derived ? (row.id.replace("svc-", "") as LabService) : catToService[row.cat];
    setOrder({ service, note: row.derived ? "" : `Xizmat: ${row.title}` });
  }

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

  const chat = labTg ? (
    <a href={telegramHref(labTg)} target="_blank" rel="noreferrer" className="lp-chat" data-testid="lab-msg"><MessageCircle /> Chat</a>
  ) : (
    <button type="button" className="lp-chat" onClick={() => setContact(true)} data-testid="lab-msg"><MessageCircle /> Chat</button>
  );
  const orderBtn = lab.mine ? (
    <Link href={`/laboratoriya/yangi?id=${lab.id}`} className="lp-order">Tahrirlash</Link>
  ) : (
    <button type="button" className="lp-order" onClick={() => orderFrom()} data-testid="lab-order"><FileText /> Buyurtma berish</button>
  );

  const works = (
    <section className="lp-card">
      <div className="lp-head">
        <h2><i><ImageIcon /></i> Bizning ishlar</h2>
        {portfolio.length > 4 && tab !== "ishlar" ? <button type="button" onClick={() => setTab("ishlar")}>Barchasini ko‘rish <ChevronRight /></button> : null}
      </div>
      {portfolio.length === 0 ? (
        <p className="lp-muted">Hali ishlar qo‘shilmagan.</p>
      ) : (
        <div className={tab === "ishlar" ? "lp-works all" : "lp-works"}>
          {(tab === "ishlar" ? portfolio : portfolio.slice(0, 4)).map((src, index) => (
            <button key={src + index} type="button" onClick={() => setViewer(index)} aria-label={`Ish ${index + 1}`}>
              <Image src={src} alt="" fill sizes="25vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="lp lg:hidden" data-testid="lab-profile">
      <div className="lp-banner">
        <LabPhoto src={gallery[0] ?? null} alt={`${lab.name} laboratoriyasi`} sizes="100vw" priority className="lp-banner-img" iconClass="size-12" />
        <div className="lp-banner-tools">
          <button type="button" aria-label="Saqlash" aria-pressed={saved.has(lab.id)} onClick={() => saved.toggle(lab.id)} data-testid="lab-heart" className={saved.has(lab.id) ? "on" : ""}><Heart /></button>
          <button type="button" aria-label="Ulashish" onClick={() => void share()}><Share2 /></button>
        </div>
        {copied ? <span className="lp-toast">Havola nusxalandi</span> : null}
      </div>

      <section className="lp-id">
        <LabLogo lab={lab} className="lp-logo" />
        <div className="lp-name">
          <h1>{lab.name} <VerifiedBadge lab={lab} className="lp-verified" /></h1>
          <p>Stomatologik laboratoriya</p>
          <p className="lp-place"><MapPin /> {labPlace(lab)}</p>
        </div>
        <div className="lp-id-actions">
          {chat}
          {orderBtn}
        </div>
      </section>

      <div className="lp-feats">
        <span><i><Package /></i>{materials ? `Materiallar: ${materials}` : "Sifatli materiallar"}</span>
        <span><i><ShieldCheck /></i>{turnaround !== "—" ? `Muddat: ${turnaround}` : "Aniq muddatlar"}</span>
        <span><i><Truck /></i>{courier}</span>
      </div>

      <div className="lp-tabs" role="tablist">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "on" : ""} onClick={() => setTab(item.id)}>
              <Icon /> {item.label}
            </button>
          );
        })}
      </div>

      {tab === "xizmatlar" ? (
        <>
          <section className="lp-card">
            <h2><i><Package /></i> Bizning xizmatlar</h2>
            {rows.length === 0 ? <p className="lp-muted">Xizmatlar hali kiritilmagan.</p> : null}
            <ul className="lp-services">
              {rows.map((row) => (
                <li key={row.id}>
                  <button type="button" disabled={lab.mine} onClick={() => orderFrom(row)}>
                    <span className="lp-svc-img">{row.photo ? <Image src={row.photo} alt="" fill sizes="64px" className="object-cover" /> : <Package />}</span>
                    <span className="lp-svc-copy">
                      <b>{row.title}</b>
                      <small>{[row.tags.join(", "), daysText(row.daysMin, row.daysMax) !== "—" ? daysText(row.daysMin, row.daysMax) : ""].filter(Boolean).join(" · ")}</small>
                    </span>
                    <span className="lp-svc-price">{priceText(row)}</span>
                    <ChevronRight className="lp-chev" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {works}
          <section className="lp-card">
            <h2><i><FileText /></i> Laboratoriya haqida</h2>
            <p className="lp-text">{lab.description || "Laboratoriya hali o‘zi haqida batafsil yozmagan."}</p>
          </section>
        </>
      ) : null}

      {tab === "ishlar" ? works : null}

      {tab === "sharhlar" ? (
        <section className="lp-card" data-testid="lab-reviews">
          <h2><i><Star /></i> Sharhlar</h2>
          <p className="lp-muted">Hali sharh qoldirilmagan. Buyurtmangiz yetkazilgach, birinchi bo‘lib baho bering.</p>
        </section>
      ) : null}

      {tab === "malumot" ? (
        <section className="lp-card">
          <h2><i><Info /></i> Ma’lumot</h2>
          <dl className="lp-info">
            <dt>Manzil</dt><dd>{[labPlace(lab), lab.address].filter(Boolean).join(", ")}</dd>
            {lab.hours ? <><dt>Ish vaqti</dt><dd>{lab.hours}</dd></> : null}
            <dt>Xizmat turlari</dt><dd>{lab.services.map(labServiceLabel).join(", ") || "—"}</dd>
            <dt>Materiallar</dt><dd>{lab.materials.map(labMaterialLabel).join(", ") || "—"}</dd>
            <dt>Narx</dt><dd>{lab.priceFrom != null ? `${somText(lab.priceFrom)}dan` : "Narx kelishiladi"}</dd>
            {lab.years ? <><dt>Tajriba</dt><dd>{lab.years} yil</dd></> : null}
            <dt>Bajarilgan ishlar</dt><dd>{lab.done}</dd>
            <dt>Telefon</dt><dd>{labPhone ? <a href={phoneHref(labPhone)}>{labPhone}</a> : lab.mine ? "—" : <RevealPhone kind="lab" id={lab.id} />}</dd>
            <dt>Telegram</dt><dd>{labTg ? <a href={telegramHref(labTg)} target="_blank" rel="noreferrer">{labTg}</a> : labPhone ? "Ko‘rsatilmagan" : "Buyurtma qabul qilingach ochiladi"}</dd>
          </dl>
          <div className="lp-links">
            <a href={labMapHref(lab)} target="_blank" rel="noreferrer"><MapPin /> Xaritada ko‘rish</a>
            {sourceUrlValue(lab.sourceUrl ?? "") ? <a href={sourceUrlValue(lab.sourceUrl ?? "")} target="_blank" rel="noopener nofollow" data-testid="lab-source">Manba</a> : null}
            {instagramHref(lab.instagram ?? "") ? <a href={instagramHref(lab.instagram ?? "")} target="_blank" rel="noopener nofollow" data-testid="lab-instagram">{instagramValue(lab.instagram ?? "")}</a> : null}
          </div>
          {!lab.mine ? <ReportButton kind="lab" id={lab.id} /> : null}
        </section>
      ) : null}

      {lab.mine ? (
        <p className="lp-mine">Bu sizning laboratoriyangiz. <Link href={`/laboratoriya/yangi?id=${lab.id}`}>Profilni tahrirlash</Link></p>
      ) : null}

      <div className="lp-bottom">
        {chat}
        {orderBtn}
      </div>

      {order ? (
        <Modal title="Yangi buyurtma" onClose={() => setOrder(null)}>
          <OrderForm labs={labs} preselectLabId={lab.id} presetService={order.service} presetNote={order.note} onCancel={() => setOrder(null)} onSaved={() => setOrder(null)} />
        </Modal>
      ) : null}

      {contact ? (
        <Modal title="Telegram orqali yozish" onClose={() => setContact(false)}>
          <div className="text-center" data-testid="lab-contact-sheet">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#e6f7f6] text-[#0F766E]"><Send className="size-5" /></span>
            <p className="mt-3 text-[15px] font-semibold text-[#1a1d26]">{labPhone ? "Laboratoriya Telegram manzilini ko‘rsatmagan" : "Aloqa ma’lumotlari buyurtma qabul qilingach ochiladi"}</p>
            <p className="mx-auto mt-1 max-w-xs text-[13px] text-[#8b93a7]">
              {labPhone ? "Telefon orqali bog‘lanishingiz mumkin." : "Buyurtma bering — laboratoriya qabul qilgach, telefon va Telegram shu yerda ochiladi."}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {labPhone ? (
                <a href={phoneHref(labPhone)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white"><Phone className="size-4" /> Qo‘ng‘iroq qilish</a>
              ) : lab.mine ? null : (
                <button type="button" onClick={() => { setContact(false); orderFrom(); }} className="inline-flex h-11 items-center rounded-xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white">
                  {authed ? "Buyurtma berish" : "Kirish va buyurtma berish"}
                </button>
              )}
            </div>
          </div>
        </Modal>
      ) : null}

      {viewer !== null && portfolio[viewer] ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90" onClick={() => setViewer(null)} data-testid="lab-viewer">
          <button type="button" className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/15 text-white" aria-label="Yopish"><X className="size-5" /></button>
          <div className="relative h-[70vh] w-full max-w-lg">
            <Image src={portfolio[viewer]} alt={`${lab.name} ishi ${viewer + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          <span className="absolute bottom-6 rounded-full bg-white/15 px-3 py-1 text-[12px] text-white">{viewer + 1}/{portfolio.length}</span>
        </div>
      ) : null}
    </div>
  );
}
