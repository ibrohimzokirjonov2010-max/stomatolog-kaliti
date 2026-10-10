"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  MoreHorizontal,
  Package,
  PackageX,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  XCircle,
  Hammer,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { categoryLabels, productHref, type Product, type ProductCategory } from "@/data/products";
import { catalogHrefForCategory } from "@/lib/seller-work";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = "active" | "inactive" | "moderation" | "rejected" | "out";
type TabId = "all" | Status;

function statusOf(p: Product): Status {
  if ((p.stockQty ?? 0) <= 0) return "out";
  if (p.active === false) return "inactive";
  return "active";
}

const STATUS_META: Record<Status, { label: string; pill: string; dot: string }> = {
  active: { label: "Faol", pill: "bg-[#ecfdf3] text-[#15803d]", dot: "bg-[#22c55e]" },
  inactive: { label: "Faol emas", pill: "bg-[#f1f4f9] text-[#6b7280]", dot: "bg-[#9aa3b5]" },
  moderation: { label: "Moderatsiyada", pill: "bg-[#fff7ed] text-[#c2410c]", dot: "bg-[#f97316]" },
  rejected: { label: "Rad etilgan", pill: "bg-[#fef2f2] text-[#b91c1c]", dot: "bg-[#ef4444]" },
  out: { label: "Tugagan", pill: "bg-[#f1f4f9] text-[#4b5568]", dot: "bg-[#6b7280]" },
};

const CAT_PILL: Record<string, string> = {
  materiallar: "bg-[#e8f1ff] text-[#0066FF]",
  implantlar: "bg-[#f3ecff] text-[#7c3aed]",
  asboblar: "bg-[#fff2e6] text-[#ea580c]",
  jihozlar: "bg-[#ecfdf3] text-[#15803d]",
  laboratoriya: "bg-[#e6f7fb] text-[#0e7490]",
  forma: "bg-[#fdeaf3] text-[#be185d]",
};

type SortId = "new" | "old" | "priceAsc" | "priceDesc" | "name" | "stock" | "sold";
const SORTS: { id: SortId; label: string }[] = [
  { id: "new", label: "Yangi birinchi" },
  { id: "old", label: "Eski birinchi" },
  { id: "priceAsc", label: "Narx: arzondan" },
  { id: "priceDesc", label: "Narx: qimmatdan" },
  { id: "name", label: "Nomi: A–Z" },
  { id: "stock", label: "Ombor: kamdan" },
  { id: "sold", label: "Eng ko‘p sotilgan" },
];

const createdOf = (p: Product) => {
  const t = new Date((p as { createdAt?: string }).createdAt ?? 0).getTime();
  return Number.isFinite(t) ? t : 0;
};
const skuOf = (p: Product) => p.id.slice(0, 8).toUpperCase();

function Select({ label, value, onChange, children, className }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-[#e3e8f1] bg-white pr-8 pl-3.5 text-[13px] font-medium text-[#1a1d26] outline-none focus:border-[#0066FF] focus:ring-3 focus:ring-[#0066FF]/15"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#8b93a7]" />
    </label>
  );
}

function StatusCard({
  icon: Icon,
  tone,
  label,
  count,
  total,
  soon,
  active,
  onClick,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  count: number;
  total: number;
  soon?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border bg-white p-4 text-left shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:border-[#c9d8f5]",
        active ? "border-[#0066FF] ring-2 ring-[#0066FF]/10" : "border-[#eceff5]",
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12.5px] text-[#6b7280]">{label}</p>
          <p className="text-[22px] leading-tight font-extrabold text-[#0B1F4D]">{count}</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11.5px] text-[#8b93a7]">
          <span>{soon ? "Tez orada" : label === "Jami mahsulotlar" ? "Barcha mahsulotlar" : `Jami ning ${pct}%`}</span>
          <span className="font-semibold text-[#4b5568]">{label === "Jami mahsulotlar" ? "100%" : `${pct}%`}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eef1f6]">
          <div className={cn("h-full rounded-full", tone.split(" ").find((c) => c.startsWith("text-"))?.replace("text-", "bg-"))} style={{ width: `${label === "Jami mahsulotlar" ? (total ? 100 : 0) : pct}%` }} />
        </div>
      </div>
    </button>
  );
}

function RowMenu({ p, onToggle, onDelete }: { p: Product; onToggle: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const inactive = p.active === false;
  const item = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] hover:bg-[#f4f7fc]";
  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-label="Ko‘proq" onClick={() => setOpen((v) => !v)} className="flex size-8 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f1f4f9]">
        <MoreHorizontal className="size-4" />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-[#e3e8f1] bg-white p-1 shadow-lg">
          <Link href={productHref(p)} className={item} onClick={() => setOpen(false)}>
            <Eye className="size-4 text-[#8b93a7]" /> Saytda ko‘rish
          </Link>
          <Link href={catalogHrefForCategory(p.category)} className={item} onClick={() => setOpen(false)}>
            <Package className="size-4 text-[#8b93a7]" /> Katalogda ochish
          </Link>
          <button type="button" className={item} onClick={() => { setOpen(false); onToggle(); }}>
            <ShieldCheck className="size-4 text-[#8b93a7]" /> {inactive ? "Qayta ochish" : "Faolsizlantirish"}
          </button>
          <button type="button" className={cn(item, "text-[#b91c1c]")} onClick={() => { setOpen(false); onDelete(); }}>
            <XCircle className="size-4" /> O‘chirish
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function SellerProductsDesktop({
  onAdd,
  onEdit,
  onDuplicate,
}: {
  onAdd: () => void;
  onEdit: (p: Product) => void;
  onDuplicate: (p: Product) => void;
}) {
  const { myProducts, shopOrders, activate, deactivate, removeProduct } = useSellerWork();
  const params = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    setQ(urlQ);
  }
  const [tab, setTab] = useState<TabId>("all");
  const [cat, setCat] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState<SortId>("new");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const sold = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of shopOrders) for (const i of o.items) m.set(i.productId, (m.get(i.productId) ?? 0) + i.qty);
    return m;
  }, [shopOrders]);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { active: 0, inactive: 0, moderation: 0, rejected: 0, out: 0 };
    for (const p of myProducts) c[statusOf(p)] += 1;
    return c;
  }, [myProducts]);
  const total = myProducts.length;

  const brands = useMemo(() => [...new Set(myProducts.map((p) => p.brand))].sort((a, b) => a.localeCompare(b)), [myProducts]);
  const cats = useMemo(() => [...new Set(myProducts.map((p) => p.category))], [myProducts]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = myProducts.filter((p) => {
      if (tab !== "all" && statusOf(p) !== tab) return false;
      if (cat && p.category !== cat) return false;
      if (brand && p.brand !== brand) return false;
      if (needle && !`${p.name} ${p.brand} ${skuOf(p)} ${p.id}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    const s = [...list];
    if (sort === "new") s.sort((a, b) => createdOf(b) - createdOf(a));
    else if (sort === "old") s.sort((a, b) => createdOf(a) - createdOf(b));
    else if (sort === "priceAsc") s.sort((a, b) => a.price - b.price);
    else if (sort === "priceDesc") s.sort((a, b) => b.price - a.price);
    else if (sort === "name") s.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "stock") s.sort((a, b) => (a.stockQty ?? 0) - (b.stockQty ?? 0));
    else s.sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0));
    return s;
  }, [myProducts, tab, cat, brand, q, sort, sold]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = rows.slice((cur - 1) * pageSize, cur * pageSize);
  const allOnPage = slice.length > 0 && slice.every((p) => selected.includes(p.id));
  const filtered = Boolean(q || cat || brand || tab !== "all" || sort !== "new");

  function reset() {
    setQ("");
    setCat("");
    setBrand("");
    setTab("all");
    setSort("new");
    setPage(1);
  }

  function exportCsv() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const head = ["ID", "Nomi", "Kategoriya", "Brend", "Narx", "Eski narx", "Chegirma %", "Ombor", "Sotilgan", "Holat"];
    const body = rows.map((p) =>
      [skuOf(p), p.name, categoryLabels[p.category], p.brand, p.price, p.oldPrice ?? "", p.discount ?? "", p.stockQty ?? 0, sold.get(p.id) ?? 0, STATUS_META[statusOf(p)].label].map(esc).join(","),
    );
    const blob = new Blob(["\ufeff" + [head.map(esc).join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mahsulotlar.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const tabs: { id: TabId; label: string; n: number }[] = [
    { id: "all", label: "Barchasi", n: total },
    { id: "active", label: "Faol", n: counts.active },
    { id: "inactive", label: "Faol emas", n: counts.inactive },
    { id: "moderation", label: "Moderatsiyada", n: 0 },
    { id: "rejected", label: "Rad etilgan", n: 0 },
    { id: "out", label: "Tugagan", n: counts.out },
  ];
  const pageNums = (() => {
    const out: (number | "…")[] = [];
    for (let i = 1; i <= pages; i += 1) {
      if (i === 1 || i === pages || Math.abs(i - cur) <= 1) out.push(i);
      else if (out[out.length - 1] !== "…") out.push("…");
    }
    return out;
  })();
  const selectedRows = myProducts.filter((p) => selected.includes(p.id));
  const cell = "px-3 py-3 text-[13px] text-[#1a1d26]";

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#0B1F4D]">Mahsulotlar</h1>
          <p className="mt-1 text-[13.5px] text-[#6b7280]">Do‘koningiz mahsulotlarini boshqaring, narx va zaxirani yangilang.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            title="Katalogdan import hali ishga tushmagan"
            className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl border border-[#e3e8f1] bg-white px-4 text-[13.5px] font-semibold text-[#9aa3b5]"
          >
            <Upload className="size-4" />
            Katalogdan import
            <span className="rounded-full bg-[#f1f4f9] px-1.5 text-[10px] leading-[16px] font-semibold text-[#8b93a7]">Tez orada</span>
          </span>
          <button type="button" onClick={onAdd} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0066FF] px-4 text-[13.5px] font-bold text-white shadow-[0_6px_14px_rgba(0,102,255,0.25)] hover:bg-[#0058dd]">
            <Plus className="size-4" />
            Mahsulot qo‘shish
          </button>
        </div>
      </header>

      <div className="grid grid-cols-5 gap-3">
        <StatusCard icon={Package} tone="bg-[#e8f1ff] text-[#0066FF]" label="Jami mahsulotlar" count={total} total={total} active={tab === "all"} onClick={() => { setTab("all"); setPage(1); }} />
        <StatusCard icon={ShieldCheck} tone="bg-[#ecfdf3] text-[#16a34a]" label="Faol" count={counts.active} total={total} active={tab === "active"} onClick={() => { setTab("active"); setPage(1); }} />
        <StatusCard icon={Hammer} tone="bg-[#fff7ed] text-[#f97316]" label="Moderatsiyada" count={0} total={total} soon onClick={() => { setTab("moderation"); setPage(1); }} active={tab === "moderation"} />
        <StatusCard icon={XCircle} tone="bg-[#fef2f2] text-[#ef4444]" label="Rad etilgan" count={0} total={total} soon onClick={() => { setTab("rejected"); setPage(1); }} active={tab === "rejected"} />
        <StatusCard icon={PackageX} tone="bg-[#f1f4f9] text-[#6b7280]" label="Tugagan" count={counts.out} total={total} active={tab === "out"} onClick={() => { setTab("out"); setPage(1); }} />
      </div>

      <section className="rounded-2xl border border-[#eceff5] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#eef1f6] px-4 pt-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setPage(1); }}
              className={cn(
                "-mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-[13px] font-semibold transition",
                tab === t.id ? "border-[#0066FF] text-[#0066FF]" : "border-transparent text-[#6b7280] hover:text-[#1a1d26]",
              )}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-[11px] leading-[18px]", tab === t.id ? "bg-[#e8f1ff] text-[#0066FF]" : "bg-[#f1f4f9] text-[#8b93a7]")}>{t.n}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8b93a7]" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Mahsulot qidirish..."
              className="h-10 w-full rounded-xl border border-[#e3e8f1] bg-white pr-3 pl-10 text-[13px] outline-none placeholder:text-[#a3abbd] focus:border-[#0066FF] focus:ring-3 focus:ring-[#0066FF]/15"
            />
          </div>
          <Select label="Kategoriya" value={cat} onChange={(v) => { setCat(v); setPage(1); }} className="w-[150px]">
            <option value="">Kategoriya</option>
            {cats.map((c) => <option key={c} value={c}>{categoryLabels[c as ProductCategory]}</option>)}
          </Select>
          <Select label="Brend" value={brand} onChange={(v) => { setBrand(v); setPage(1); }} className="w-[130px]">
            <option value="">Brend</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Select label="Holat" value={tab} onChange={(v) => { setTab(v as TabId); setPage(1); }} className="w-[140px]">
            <option value="all">Holat</option>
            {(Object.keys(STATUS_META) as Status[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </Select>
          <div className="relative w-[190px]">
            <ArrowDownUp className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b93a7]" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortId)}
              aria-label="Saralash"
              className="h-10 w-full appearance-none rounded-xl border border-[#e3e8f1] bg-white pr-8 pl-9 text-[13px] font-medium text-[#1a1d26] outline-none focus:border-[#0066FF] focus:ring-3 focus:ring-[#0066FF]/15"
            >
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#8b93a7]" />
          </div>
          <button type="button" onClick={exportCsv} disabled={!rows.length} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#e3e8f1] bg-white px-3.5 text-[13px] font-semibold text-[#1a1d26] hover:bg-[#f7f9fc] disabled:opacity-50">
            <Download className="size-4" />
            Eksport
          </button>
          <button type="button" onClick={reset} disabled={!filtered} title="Filtrlarni tozalash" className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#e3e8f1] bg-white px-3.5 text-[13px] font-semibold text-[#1a1d26] hover:bg-[#f7f9fc] disabled:opacity-50">
            <SlidersHorizontal className="size-4" />
            Filterlar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead>
              <tr className="border-y border-[#eef1f6] bg-[#fafbfe] text-[11.5px] font-semibold tracking-wide text-[#8b93a7] uppercase">
                <th className="w-10 py-2.5 pl-4">
                  <input
                    type="checkbox"
                    aria-label="Hammasini tanlash"
                    className="size-4 accent-[#0066FF]"
                    checked={allOnPage}
                    onChange={(e) => setSelected((s) => e.target.checked ? [...new Set([...s, ...slice.map((p) => p.id)])] : s.filter((id) => !slice.some((p) => p.id === id)))}
                  />
                </th>
                <th className="px-3 py-2.5">Mahsulot</th>
                <th className="px-3 py-2.5">Kategoriya</th>
                <th className="px-3 py-2.5">Brend</th>
                <th className="px-3 py-2.5">Narx</th>
                <th className="px-3 py-2.5">Ombor</th>
                <th className="px-3 py-2.5">Ko‘rishlar <em className="ml-0.5 rounded bg-[#f1f4f9] px-1 text-[9px] font-semibold not-italic normal-case">Demo</em></th>
                <th className="px-3 py-2.5">Savatcha <em className="ml-0.5 rounded bg-[#f1f4f9] px-1 text-[9px] font-semibold not-italic normal-case">Demo</em></th>
                <th className="px-3 py-2.5">Sotilgan</th>
                <th className="px-3 py-2.5">Holat</th>
                <th className="px-3 py-2.5 pr-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((p) => {
                const st = statusOf(p);
                const meta = STATUS_META[st];
                const stock = p.stockQty ?? 0;
                return (
                  <tr key={p.id} className={cn("border-b border-[#f1f3f8] last:border-0 hover:bg-[#fafcff]", selected.includes(p.id) && "bg-[#f5f9ff]")}>
                    <td className="py-3 pl-4">
                      <input type="checkbox" aria-label="Tanlash" className="size-4 accent-[#0066FF]" checked={selected.includes(p.id)} onChange={(e) => setSelected((s) => e.target.checked ? [...s, p.id] : s.filter((id) => id !== p.id))} />
                    </td>
                    <td className={cell}>
                      <div className="flex min-w-[220px] items-center gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#eef1f6] bg-[#f7f9fc]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt="" className="size-full object-contain p-1" />
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[240px] truncate text-[13.5px] font-semibold">{p.name}</span>
                          <span className="block text-[11.5px] text-[#8b93a7]">ID: {skuOf(p)}</span>
                        </span>
                      </div>
                    </td>
                    <td className={cell}>
                      <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-semibold", CAT_PILL[p.category] ?? "bg-[#f1f4f9] text-[#4b5568]")}>{categoryLabels[p.category]}</span>
                    </td>
                    <td className={cell}>{p.brand}</td>
                    <td className={cell}>
                      <span className="block font-bold whitespace-nowrap">{formatMoney(p.price, "UZS")}</span>
                      {p.oldPrice && p.discount ? (
                        <span className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                          <s className="text-[11.5px] text-[#a3abbd]">{formatMoney(p.oldPrice, "UZS")}</s>
                          <span className="rounded bg-[#fef2f2] px-1 text-[10.5px] font-bold text-[#ef4444]">-{p.discount}%</span>
                        </span>
                      ) : null}
                    </td>
                    <td className={cell}>
                      <span className={cn("font-semibold whitespace-nowrap", stock <= 0 ? "text-[#ef4444]" : stock <= 5 ? "text-[#f97316]" : "text-[#16a34a]")}>{stock} dona</span>
                    </td>
                    <td className={cn(cell, "text-[#a3abbd]")}>—</td>
                    <td className={cn(cell, "text-[#a3abbd]")}>—</td>
                    <td className={cn(cell, "font-semibold")}>{sold.get(p.id) ?? 0}</td>
                    <td className={cell}>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap", meta.pill)}>
                        <span className={cn("size-1.5 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 pl-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button type="button" aria-label="Tahrirlash" title="Tahrirlash" onClick={() => onEdit(p)} className="flex size-8 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#e8f1ff] hover:text-[#0066FF]">
                          <Pencil className="size-4" />
                        </button>
                        <button type="button" aria-label="Nusxa" title="Nusxa ko‘chirish" onClick={() => onDuplicate(p)} className="flex size-8 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#e8f1ff] hover:text-[#0066FF]">
                          <Copy className="size-4" />
                        </button>
                        <RowMenu
                          p={p}
                          onToggle={() => (p.active === false ? activate(p.id) : deactivate(p.id))}
                          onDelete={() => {
                            if (window.confirm("Mahsulotni o‘chirasizmi?")) removeProduct(p.id);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!slice.length ? (
            <div className="px-4 py-14 text-center">
              <p className="text-[14px] font-semibold text-[#1a1d26]">{total ? "Mos mahsulot topilmadi" : "Hali mahsulot yo‘q"}</p>
              <p className="mt-1 text-[12.5px] text-[#8b93a7]">{total ? "Qidiruv yoki filtrlarni o‘zgartiring." : "Birinchi mahsulotingizni qo‘shing."}</p>
              {total && filtered ? (
                <button type="button" onClick={reset} className="mt-3 text-[13px] font-semibold text-[#0066FF] hover:underline">Filtrlarni tozalash</button>
              ) : !total ? (
                <button type="button" onClick={onAdd} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0066FF] px-4 text-[13px] font-bold text-white">
                  <Plus className="size-4" /> Mahsulot qo‘shish
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[#eef1f6] px-4 py-3">
          <div className="flex items-center gap-3 text-[13px] text-[#6b7280]">
            <span>Tanlangan: <b className="text-[#1a1d26]">{selected.length} ta mahsulot</b></span>
            {selectedRows.length ? (
              <>
                <button type="button" className="font-semibold text-[#0066FF] hover:underline" onClick={() => { selectedRows.forEach((p) => p.active !== false && deactivate(p.id)); setSelected([]); }}>Faolsizlantirish</button>
                <button type="button" className="font-semibold text-[#b91c1c] hover:underline" onClick={() => { if (window.confirm(`${selectedRows.length} ta mahsulotni o‘chirasizmi?`)) { selectedRows.forEach((p) => removeProduct(p.id)); setSelected([]); } }}>O‘chirish</button>
              </>
            ) : null}
            <span className="text-[#c0c7d6]">|</span>
            <span>Jami: {rows.length}{rows.length !== total ? ` / ${total}` : ""}</span>
          </div>
          <div className="flex items-center gap-3">
            <Select label="Sahifada" value={String(pageSize)} onChange={(v) => { setPageSize(Number(v)); setPage(1); }} className="w-[130px]">
              {[10, 20, 50].map((n) => <option key={n} value={n}>Sahifada {n} ta</option>)}
            </Select>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Oldingi" disabled={cur <= 1} onClick={() => setPage(cur - 1)} className="flex size-9 items-center justify-center rounded-lg border border-[#e3e8f1] text-[#4b5568] hover:bg-[#f7f9fc] disabled:opacity-40">
                <ChevronLeft className="size-4" />
              </button>
              {pageNums.map((n, i) =>
                n === "…" ? (
                  <span key={`d${i}`} className="px-1 text-[#a3abbd]">…</span>
                ) : (
                  <button key={n} type="button" onClick={() => setPage(n)} className={cn("size-9 rounded-lg text-[13px] font-semibold", n === cur ? "bg-[#0066FF] text-white" : "border border-[#e3e8f1] text-[#4b5568] hover:bg-[#f7f9fc]")}>
                    {n}
                  </button>
                ),
              )}
              <button type="button" aria-label="Keyingi" disabled={cur >= pages} onClick={() => setPage(cur + 1)} className="flex size-9 items-center justify-center rounded-lg border border-[#e3e8f1] text-[#4b5568] hover:bg-[#f7f9fc] disabled:opacity-40">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
