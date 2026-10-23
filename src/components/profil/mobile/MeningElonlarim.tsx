"use client";
/* eslint-disable @next/next/no-img-element -- listing photos are user uploads */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ImageIcon,
  LayoutGrid,
  MoreVertical,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useJobsWork } from "@/components/jobs-provider";
import { useSurplusWork } from "@/components/surplus-provider";
import { Modal as SurplusModal, PostForm } from "@/components/surplus-forms";
import { Modal as JobModal, PostJobForm } from "@/components/job-forms";
import type { Job } from "@/data/jobs";
import type { SurplusListing } from "@/data/surplus";
import { formatGroupedNumber, formatMoney, formatSalaryRange } from "@/lib/format";
import "./mening-elonlarim.css";

type Group = "product" | "service" | "job" | "other";
type Filter = "all" | Group;
type Kind = "classified" | "surplus" | "job" | "master" | "lab";

type Item = {
  key: string;
  id: string;
  kind: Kind;
  group: Group;
  title: string;
  sub: string;
  image: string;
  priceLabel?: string;
  price: string;
  status: string;
  active: boolean;
  toggle: boolean;
  remove: boolean;
  href: string;
  editHref?: string;
  createdAt: string;
};

type ClassifiedMine = { id: string; title?: string; category?: string; condition?: string; price?: number | null; negotiable?: boolean; description?: string; city?: string; photos?: string[]; status?: string; createdAt?: string };
type ProfileMine = { id: string; name?: string; title?: string; kind?: string; services?: string[]; city?: string; photo?: string | null; logo?: string | null; status?: string; createdAt?: string; priceFrom?: number | null; priceNegotiable?: boolean };

const FILTERS: { id: Filter; label: string; icon: typeof ShoppingBag }[] = [
  { id: "all", label: "Barchasi", icon: LayoutGrid },
  { id: "product", label: "Mahsulotlar", icon: ShoppingBag },
  { id: "service", label: "Xizmatlar", icon: Sparkles },
  { id: "job", label: "Vakansiyalar", icon: Briefcase },
  { id: "other", label: "Boshqalar", icon: LayoutGrid },
];

const GROUP_LABEL: Record<Group, { label: string; icon: typeof ShoppingBag }> = {
  product: { label: "Mahsulot", icon: ShoppingBag },
  service: { label: "Xizmat", icon: Sparkles },
  job: { label: "Vakansiya", icon: Briefcase },
  other: { label: "Boshqa", icon: LayoutGrid },
};

const STATUS: Record<string, string> = {
  published: "Faol",
  pending: "Moderatsiyada",
  closed: "Yopilgan",
  rejected: "Rad etilgan",
  hidden: "Yashirilgan",
  draft: "Qoralama",
};

const PRODUCT_CATEGORIES = ["Uskunalar", "Asboblar", "Materiallar"];

function fromClassified(row: ClassifiedMine): Item {
  const status = row.status ?? "draft";
  return {
    key: `c-${row.id}`,
    id: row.id,
    kind: "classified",
    group: PRODUCT_CATEGORIES.includes(row.category ?? "") ? "product" : "other",
    title: row.title || "Nomsiz e’lon",
    sub: [row.category, row.condition === "ishlatilgan" ? "Ishlatilgan" : row.condition ? "Yangi" : "", row.city].filter(Boolean).join(", "),
    image: row.photos?.[0] ?? "",
    price: row.price ? formatMoney(row.price, "UZS") : "Kelishiladi",
    priceLabel: row.price ? undefined : "Narx:",
    status: STATUS[status] ?? status,
    active: status === "published",
    toggle: false,
    remove: false,
    href: `/elonlar/${row.id}`,
    editHref: `/elonlar/yangi?id=${row.id}`,
    createdAt: row.createdAt ?? "",
  };
}

function fromSurplus(row: SurplusListing): Item {
  const status = row.modStatus ?? "pending";
  return {
    key: `s-${row.id}`,
    id: row.id,
    kind: "surplus",
    group: "product",
    title: row.name,
    sub: [row.brand, "Ortiqcha material"].filter(Boolean).join(", "),
    image: row.image,
    price: formatMoney(row.price, "UZS"),
    status: STATUS[status] ?? status,
    active: status === "published",
    toggle: ["published", "pending", "closed"].includes(status),
    remove: true,
    href: `/ortiqcha-material/${row.id}`,
    createdAt: row.createdAt ?? "",
  };
}

function fromJob(row: Job): Item {
  const status = row.modStatus ?? "pending";
  return {
    key: `j-${row.id}`,
    id: row.id,
    kind: "job",
    group: "job",
    title: row.title,
    sub: [row.clinic, row.city].filter(Boolean).join(", "),
    image: row.photos?.[0] ?? "",
    price: !row.salaryMin && !row.salaryMax ? "Kelishiladi" : formatSalaryRange(row.salaryMin, row.salaryMax),
    priceLabel: "Maosh:",
    status: STATUS[status] ?? status,
    active: status === "published",
    toggle: status !== "hidden" && status !== "rejected",
    remove: true,
    href: `/ishlar/${row.id}`,
    createdAt: row.createdAt ?? "",
  };
}

function fromProfile(row: ProfileMine, kind: "master" | "lab"): Item {
  const status = row.status ?? "pending";
  const from = row.priceFrom ? `${formatGroupedNumber(row.priceFrom)} so‘mdan` : "Kelishiladi";
  return {
    key: `${kind}-${row.id}`,
    id: row.id,
    kind,
    group: "service",
    title: row.name || (kind === "lab" ? "Laboratoriya" : "Usta"),
    sub: [row.title || row.services?.slice(0, 2).join(", "), row.city].filter(Boolean).join(", "),
    image: row.photo || row.logo || "",
    price: row.priceNegotiable && !row.priceFrom ? "Kelishiladi" : from,
    priceLabel: "Narx:",
    status: STATUS[status] ?? status,
    active: status === "published",
    toggle: false,
    remove: false,
    href: kind === "lab" ? `/laboratoriya/${row.id}` : `/ustalar/${row.id}`,
    editHref: kind === "lab" ? "/laboratoriya/mening" : "/ustalar/mening",
    createdAt: row.createdAt ?? "",
  };
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function MeningElonlarim() {
  const router = useRouter();
  const { ready, profile } = useDoctorProfile();
  const surplus = useSurplusWork();
  const jobs = useJobsWork();
  const [filter, setFilter] = useState<Filter>("all");
  const [classifieds, setClassifieds] = useState<ClassifiedMine[]>([]);
  const [services, setServices] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [menu, setMenu] = useState("");
  const [editSurplus, setEditSurplus] = useState<SurplusListing | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const uid = profile?.id;

  useEffect(() => {
    if (!uid) return;
    let cancel = false;
    void Promise.all([
      getJson<{ items?: ClassifiedMine[] }>("/api/work/classifieds/mine"),
      getJson<{ master?: ProfileMine | null }>("/api/work/masters/mine"),
      getJson<{ lab?: ProfileMine | null }>("/api/work/labs/mine"),
    ]).then(([elon, master, lab]) => {
      if (cancel) return;
      setClassifieds(Array.isArray(elon?.items) ? elon.items : []);
      const next: Item[] = [];
      if (master?.master?.id) next.push(fromProfile(master.master, "master"));
      if (lab?.lab?.id) next.push(fromProfile(lab.lab, "lab"));
      setServices(next);
      setLoaded(true);
    });
    return () => {
      cancel = true;
    };
  }, [uid]);

  const items = [
    ...classifieds.map(fromClassified),
    ...surplus.mine.map(fromSurplus),
    ...jobs.myJobs.map(fromJob),
    ...services,
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const shown = filter === "all" ? items : items.filter((item) => item.group === filter);

  async function act(item: Item, action: "open" | "close" | "delete") {
    if (busy) return;
    if (action === "delete" && !window.confirm(item.kind === "job" ? "Vakansiya va unga kelgan arizalar o‘chiriladi. Davom etasizmi?" : "E’lon o‘chiriladi. Davom etasizmi?")) return;
    setBusy(item.key);
    setError("");
    const res = item.kind === "job" ? await jobs.setJob(item.id, action) : await surplus.setListing(item.id, action);
    setBusy("");
    if (!res.ok) setError(res.error ?? "Amalni bajarib bo‘lmadi.");
  }

  function edit(item: Item) {
    if (item.editHref) {
      router.push(item.editHref);
      return;
    }
    if (item.kind === "surplus") setEditSurplus(surplus.mine.find((row) => row.id === item.id) ?? null);
    if (item.kind === "job") setEditJob(jobs.myJobs.find((row) => row.id === item.id) ?? null);
  }

  const loading = !ready || (Boolean(uid) && (!loaded || !surplus.ready || !jobs.ready));

  return (
    <div className="me" data-testid="mening-elonlarim">
      <header className="me-head">
        <div>
          <h1>Mening e’lonlarim</h1>
          <p>E’lonlaringizni boshqaring, tahrirlang va yangilang</p>
        </div>
        <Link href="/elonlar/yangi" className="me-new"><Plus /> Yangi e’lon</Link>
      </header>

      <div className="me-chips" role="tablist">
        {FILTERS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={filter === item.id ? "on" : ""} onClick={() => setFilter(item.id)}>
              {item.id === "all" ? null : <Icon />}
              {item.label}
            </button>
          );
        })}
      </div>

      {error ? <p role="alert" className="me-error">{error}</p> : null}
      {ready && !uid ? (
        <p className="me-empty">E’lonlaringizni ko‘rish uchun <Link href="/kirish?next=/profil/elonlarim">tizimga kiring</Link>.</p>
      ) : loading ? (
        <p className="me-empty">Yuklanmoqda…</p>
      ) : shown.length === 0 ? (
        <p className="me-empty">{items.length === 0 ? "Hali e’lon joylamagansiz." : "Bu bo‘limda e’lon yo‘q."}</p>
      ) : (
        <ul className="me-list">
          {shown.map((item) => {
            const tag = GROUP_LABEL[item.group];
            const TagIcon = tag.icon;
            const disabled = busy === item.key;
            return (
              <li key={item.key} className="me-card" data-testid="me-row">
                <Link href={item.href} className="me-photo">
                  {item.image ? <img src={item.image} alt="" /> : <span className="me-noimg"><ImageIcon /></span>}
                  <span className={item.active ? "me-status on" : "me-status"}>{item.status}</span>
                </Link>
                <div className="me-body">
                  <Link href={item.href} className="me-title">{item.title}</Link>
                  {item.sub ? <p className="me-sub">{item.sub}</p> : null}
                  <span className="me-tag"><TagIcon /> {tag.label}</span>
                  <p className="me-price">{item.priceLabel ? <span>{item.priceLabel} </span> : null}{item.price}</p>
                </div>
                <div className="me-side">
                  <div className="me-top">
                    {item.toggle ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.active}
                        aria-label={item.active ? "Yopish" : "Qayta ochish"}
                        className={item.active ? "me-switch on" : "me-switch"}
                        disabled={disabled}
                        onClick={() => void act(item, item.status === "Yopilgan" ? "open" : "close")}
                      >
                        <span />
                      </button>
                    ) : <span className="me-switch-gap" />}
                    <button type="button" className="me-more" aria-label="Yana" aria-expanded={menu === item.key} onClick={() => setMenu(menu === item.key ? "" : item.key)}>
                      <MoreVertical />
                    </button>
                    {menu === item.key ? (
                      <div className="me-menu">
                        <Link href={item.href} onClick={() => setMenu("")}>Sahifasini ko‘rish</Link>
                      </div>
                    ) : null}
                  </div>
                  <button type="button" className="me-act" disabled={disabled} onClick={() => edit(item)}><Pencil /> Tahrirlash</button>
                  {item.remove ? (
                    <button type="button" className="me-act del" disabled={disabled} onClick={() => void act(item, "delete")}><Trash2 /> O‘chirish</button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editSurplus ? (
        <SurplusModal title="E’lonni tahrirlash" onClose={() => setEditSurplus(null)}>
          <PostForm listing={editSurplus} onCancel={() => setEditSurplus(null)} onDone={() => setEditSurplus(null)} />
        </SurplusModal>
      ) : null}
      {editJob ? (
        <JobModal title="Vakansiyani tahrirlash" onClose={() => setEditJob(null)}>
          <PostJobForm job={editJob} onCancel={() => setEditJob(null)} onDone={() => setEditJob(null)} />
        </JobModal>
      ) : null}
    </div>
  );
}
