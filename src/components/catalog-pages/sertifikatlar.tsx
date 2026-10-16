"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Award, CalendarDays, ChevronDown, Clock, Download, Eye, GraduationCap, MapPin, QrCode, Search, Star } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { cn } from "@/lib/utils";
import { CatalogLayout, ChipRow, PageTitle } from "./side-nav";

export type CertType = "seminar" | "onlayn" | "vebinar" | "trening";
export type Certificate = {
  id: string;
  title: string;
  type: CertType;
  lecturer?: string;
  /** ISO date */
  date: string;
  place?: string;
  cme?: number;
  fileUrl?: string;
  verifyUrl?: string;
};

const TYPE_LABEL: Record<CertType, string> = {
  seminar: "Seminar",
  onlayn: "Onlayn kurs",
  vebinar: "Vebinar",
  trening: "Amaliy trening",
};
type Chip = "" | CertType | "cme";
const CHIPS: { id: Chip; label: string }[] = [
  { id: "", label: "Barchasi" },
  { id: "seminar", label: "Seminarlar" },
  { id: "onlayn", label: "Onlayn darslar" },
  { id: "vebinar", label: "Vebinarlar" },
  { id: "trening", label: "Amaliy treninglar" },
  { id: "cme", label: "CME ballari" },
];
const THEMES = [
  "from-[#f7f9ff] to-[#e8efff] [--edge:#2563eb]",
  "from-[#f2fbfb] to-[#d9f3f1] [--edge:#14b8a6]",
  "from-[#fbfaf6] to-[#f1ede2] [--edge:#1e3a8a]",
];
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
function uzDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function SertifikatlarPage() {
  const { profile } = useDoctorProfile();
  const [certs, setCerts] = useState<Certificate[] | null>(null);
  const [chip, setChip] = useState<Chip>("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "old">("new");

  useEffect(() => {
    let alive = true;
    fetch("/api/certificates")
      .then((r) => (r.ok ? r.json() : { certificates: [] }))
      .then((j: { certificates?: Certificate[] }) => {
        if (alive) setCerts(j.certificates ?? []);
      })
      .catch(() => {
        if (alive) setCerts([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (certs ?? [])
      .filter((c) => (!chip ? true : chip === "cme" ? (c.cme ?? 0) > 0 : c.type === chip))
      .filter((c) => !term || `${c.title} ${c.lecturer ?? ""}`.toLowerCase().includes(term))
      .sort((a, b) => (sort === "new" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
  }, [certs, chip, q, sort]);
  const list = certs ?? [];
  const cme = list.reduce((acc, c) => acc + (c.cme ?? 0), 0);
  const name = profile?.fullName?.replace(/^Dr\.?\s*/i, "") || "Shifokor";

  return (
    <CatalogLayout>
      <PageTitle
        title="Sertifikatlar"
        subtitle="Siz olgan barcha sertifikatlar va yutuqlar"
        right={
          list.length ? (
            <div className="hidden divide-x divide-[#dbe5f7] rounded-xl border border-[#e3ebfa] bg-[#EEF4FF] py-2.5 lg:flex">
              <Stat icon={Award} n={list.length} label="ta sertifikat" />
              <Stat icon={Star} n={cme} label="CME ballari" />
              <Stat icon={Clock} n={list.length} label="ta kurs yakunlangan" />
            </div>
          ) : null
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <ChipRow items={CHIPS} value={chip} onChange={setChip} className="max-lg:basis-full lg:flex-1" />
        <label className="relative min-w-0 flex-1 lg:w-[210px] lg:flex-none">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#0066FF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sertifikat nomi yoki tashkilot..."
            className="h-10 w-full rounded-xl border border-[#e6eaf2] bg-white pr-3 pl-10 text-[12.5px] outline-none placeholder:text-[#9aa3b2] focus:border-[#0066FF]"
          />
        </label>
        <label className="relative w-[150px]">
          <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "new" | "old")}
            className="h-10 w-full appearance-none rounded-xl border border-[#e6eaf2] bg-white pr-8 pl-10 text-[12.5px] font-medium outline-none"
          >
            <option value="new">Yangidan eskiga</option>
            <option value="old">Eskidan yangiga</option>
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        </label>
      </div>
      {certs === null ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[330px] animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d9e0ec] bg-white px-6 py-14 text-center">
          <GraduationCap className="mx-auto size-10 text-[#0066FF]" strokeWidth={1.5} />
          <p className="mt-3 text-[15px] font-semibold text-[#0B1F4D]">Hali sertifikat yo‘q</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">Seminar yoki onlayn kursni yakunlang, sertifikatingiz shu yerda paydo bo‘ladi.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/onlayn-darslar" className="inline-flex h-10 items-center rounded-lg bg-[#0066FF] px-4 text-[13px] font-semibold text-white">
              Onlayn darslar
            </Link>
            <Link href="/seminarlar" className="inline-flex h-10 items-center rounded-lg border border-[#d6e4ff] px-4 text-[13px] font-semibold text-[#0066FF]">
              Seminarlar
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((c, i) => (
            <CertCard key={c.id} cert={c} name={name} theme={THEMES[i % THEMES.length]} />
          ))}
        </div>
      )}
    </CatalogLayout>
  );
}

function Stat({ icon: Icon, n, label }: { icon: typeof Award; n: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4">
      <Icon className="size-6 text-[#0066FF]" strokeWidth={1.6} />
      <div className="leading-tight">
        <div className="text-[14px] font-bold text-[#0B1F4D]">{n}</div>
        <div className="text-[11px] text-[#6b7590]">{label}</div>
      </div>
    </div>
  );
}

function CertCard({ cert, name, theme }: { cert: Certificate; name: string; theme: string }) {
  const btn = "flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#f3f8ff] text-[12.5px] font-semibold text-[#0066FF]";
  return (
    <article className="rounded-2xl border border-[#eceff5] bg-white p-2.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
      <div className={cn("relative aspect-[1.6] overflow-hidden rounded-xl border border-[#e3e8f2] bg-gradient-to-br text-center", theme)}>
        <div className="absolute -top-6 -right-6 size-20 rotate-45 bg-[var(--edge)] opacity-80" />
        <div className="absolute -bottom-6 -left-6 size-16 rotate-45 bg-[var(--edge)] opacity-25" />
        {cert.cme ? (
          <span className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[10.5px] font-bold text-[#0B1F4D] shadow">
            <Clock className="size-3 text-[#0066FF]" /> {cert.cme} CME
          </span>
        ) : null}
        <div className="relative flex h-full flex-col items-center px-6 pt-3">
          <div className="text-[9px] font-extrabold tracking-wide text-[#0B1F4D]">
            STOMA<span className="text-[#0066FF]">HUB</span>
          </div>
          <div className="mt-1 font-serif text-[19px] tracking-[0.2em] text-[#0B1F4D]">SERTIFIKAT</div>
          <div className="text-[7.5px] text-[#6b7590]">Mazkur sertifikat bilan tasdiqlanadiki,</div>
          <div className="mt-1 text-[13px] font-bold text-[#0B1F4D]">{name}</div>
          <div className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-[#0066FF]">{cert.title}</div>
          <div className="text-[7.5px] text-[#6b7590]">{TYPE_LABEL[cert.type].toLowerCase()}ni muvaffaqiyatli yakunlagan</div>
          <div className="mt-auto mb-3 flex w-full items-end justify-between text-[7.5px] text-[#4a5470]">
            <div className="w-20 border-t border-[#9aa3b2] pt-0.5">{cert.lecturer ?? ""}</div>
            <div>
              {cert.place ? <div>{cert.place}</div> : null}
              <div>{uzDate(cert.date)}</div>
            </div>
            <div className="size-8 rounded-full bg-[radial-gradient(circle_at_35%_35%,#f8e08e,#c99a2e_60%,#9c7417)] shadow" />
          </div>
        </div>
      </div>
      <div className="px-1 pt-2.5">
        <h2 className="line-clamp-1 text-[14px] font-bold text-[#0B1F4D]">{cert.title}</h2>
        <p className="mt-0.5 text-[12px] text-[#6b7590]">
          {TYPE_LABEL[cert.type]}
          {cert.lecturer ? ` • ${cert.lecturer}` : ""}
        </p>
        <div className="mt-2 flex gap-4 text-[12px] text-[#4a5470]">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" /> {uzDate(cert.date)}
          </span>
          {cert.place ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" /> {cert.place}
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
          {cert.fileUrl ? (
            <>
              <a href={cert.fileUrl} target="_blank" rel="noreferrer" className={btn}>
                <Eye className="size-4" /> Ko‘rish
              </a>
              <a href={cert.fileUrl} download className={btn}>
                <Download className="size-4" /> Yuklab olish
              </a>
            </>
          ) : (
            <>
              <span className={cn(btn, "opacity-60")}>
                <Eye className="size-4" /> Ko‘rish
              </span>
              <span className={cn(btn, "opacity-60")}>
                <Download className="size-4" /> Yuklab olish
              </span>
            </>
          )}
          <a href={cert.verifyUrl ?? "#"} aria-label="QR tekshiruv" className="flex size-9 items-center justify-center rounded-lg bg-[#f3f8ff] text-[#0066FF]">
            <QrCode className="size-4" />
          </a>
        </div>
      </div>
    </article>
  );
}
