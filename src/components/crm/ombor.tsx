"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Boxes,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileSpreadsheet,
  Filter,
  LayoutGrid,
  Package,
  PackagePlus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Wallet,
} from "lucide-react";
import { Sheet } from "@/components/clinic-dashboard";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CrmFrame, CrmTitle, fmtDate, selectCls } from "./crm-shared";

/**
 * There is no inventory table in Supabase yet, so stock lives in this browser (localStorage).
 * Shape kept simple so it can move to a table later without UI changes.
 */
export type StockItem = {
  id: string;
  name: string;
  subtitle?: string;
  category: string;
  sku?: string;
  qty: number;
  minQty: number;
  price?: number;
  expiry?: string;
  supplier?: string;
  image?: string;
};
const KEY = "stomahub:clinic-inventory:v1";
const PAGE = 10;
const SOON_DAYS = 90;

function daysLeft(expiry?: string) {
  if (!expiry) return null;
  const ms = new Date(`${expiry}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(ms / 86400000);
}
type Status = "kam" | "arafa" | "mavjud";
function statusOf(it: StockItem): Status {
  if (it.qty <= 0 || it.qty < it.minQty) return "kam";
  if (it.qty <= Math.ceil(it.minQty * 1.2)) return "arafa";
  return "mavjud";
}
const STATUS: Record<Status, { label: string; cls: string }> = {
  kam: { label: "Kam zaxira", cls: "bg-[#fdecec] text-[#d93b3b]" },
  arafa: { label: "Tugash arafasida", cls: "bg-[#fff1e5] text-[#d9730d]" },
  mavjud: { label: "Mavjud", cls: "bg-[#e8f8ef] text-[#17914f]" },
};

function useInventory() {
  const [items, setItems] = useState<StockItem[] | null>(null);
  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage once
      setItems(Array.isArray(raw) ? raw : []);
    } catch {
      setItems([]);
    }
  }, []);
  const save = (next: StockItem[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  return { items, save };
}

export function OmborPage() {
  return <CrmFrame next="/klinika/ombor">{() => <Ombor />}</CrmFrame>;
}

function Ombor() {
  const { items, save } = useInventory();
  const all = useMemo(() => items ?? [], [items]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [st, setSt] = useState<"" | Status>("");
  const [sup, setSup] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState<StockItem | null | "new">(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cats = [...new Set(all.map((i) => i.category).filter(Boolean))].sort();
  const sups = [...new Set(all.map((i) => i.supplier ?? "").filter(Boolean))].sort();
  const list = all.filter(
    (i) =>
      (!q.trim() || `${i.name} ${i.sku ?? ""} ${i.subtitle ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())) &&
      (!cat || i.category === cat) &&
      (!st || statusOf(i) === st) &&
      (!sup || i.supplier === sup),
  );
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(page, pages);
  const rows = list.slice((cur - 1) * PAGE, cur * PAGE);
  const low = all.filter((i) => statusOf(i) === "kam");
  const soon = all
    .map((i) => ({ i, d: daysLeft(i.expiry) }))
    .filter((x): x is { i: StockItem; d: number } => x.d != null && x.d <= SOON_DAYS)
    .sort((a, b) => a.d - b.d);
  const value = all.reduce((acc, i) => acc + (i.price ?? 0) * i.qty, 0);
  const priced = all.some((i) => i.price);

  async function importCsv(file: File) {
    // columns: nomi, kategoriya, sku, zaxira, min, narx, muddat(yyyy-mm-dd), yetkazib beruvchi
    const lines = (await file.text()).split(/\r?\n/).map((l) => l.split(/[,;]/).map((x) => x.replace(/^"|"$/g, "").trim()));
    const add: StockItem[] = lines
      .filter((l) => l[0] && !/^(nomi|name)$/i.test(l[0]))
      .map((l, k) => ({
        id: `${Date.now()}-${k}`,
        name: l[0],
        category: l[1] || "Boshqa",
        sku: l[2] || undefined,
        qty: Number(l[3]) || 0,
        minQty: Number(l[4]) || 0,
        price: Number(l[5]) || undefined,
        expiry: /^\d{4}-\d{2}-\d{2}$/.test(l[6] ?? "") ? l[6] : undefined,
        supplier: l[7] || undefined,
      }));
    save([...all, ...add]);
  }

  return (
    <div>
      <CrmTitle
        title="Ombor"
        subtitle="Klinika inventari va sarf materiallari"
        actions={
          <>
            <Link href="/kategoriyalar" className="hidden h-10 items-center gap-2 rounded-xl border border-[#d6e4ff] bg-white px-4 text-[13px] font-semibold text-[#0066FF] lg:flex">
              <LayoutGrid className="size-4" /> Kategoriyalar
            </Link>
            <Link href="/marketplace" className="flex h-10 items-center gap-2 rounded-xl bg-[#0066FF] px-5 text-[13px] font-semibold text-white hover:bg-[#0057d9]">
              <Plus className="size-4" /> Buyurtma berish
            </Link>
          </>
        }
      />
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && void importCsv(e.target.files[0])} />

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-4 grid grid-cols-3 gap-2.5 lg:gap-3">
            <Kpi icon={Boxes} tone="bg-[#eef4ff] text-[#0066FF]" label="Jami mahsulotlar" value={String(all.length)} />
            <Kpi icon={Wallet} tone="bg-[#e9f8f1] text-[#17914f]" label="Ombordagi qiymat" value={priced ? formatMoney(value, "UZS") : "—"} />
            <Kpi icon={AlertTriangle} tone="bg-[#fdeeee] text-[#d93b3b]" label="Kam zaxira" value={String(low.length)} danger={low.length > 0} />
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <label className="relative min-w-0 flex-1 max-lg:basis-full">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#0066FF]" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Mahsulot nomi yoki SKU..." className="h-10 w-full rounded-xl border border-[#e6eaf2] bg-white pr-3 pl-10 text-[12.5px] outline-none focus:border-[#0066FF]" />
            </label>
            <Sel value={cat} onChange={setCat} label="Barcha kategoriyalar" opts={cats.map((c) => [c, c])} />
            <Sel value={st} onChange={(v) => setSt(v as "" | Status)} label="Barcha holatlar" opts={(Object.keys(STATUS) as Status[]).map((s) => [s, STATUS[s].label])} />
            <Sel value={sup} onChange={setSup} label="Barcha yetkazib beruvchilar" opts={sups.map((s) => [s, s])} className="hidden xl:block" />
            <button type="button" onClick={() => { setQ(""); setCat(""); setSt(""); setSup(""); }} className="flex h-10 items-center gap-1.5 rounded-xl border border-[#d6e4ff] bg-white px-3.5 text-[12.5px] font-semibold text-[#0066FF]">
              <Filter className="size-4" /> Tozalash
            </button>
          </div>

          {items === null ? (
            <div className="h-[300px] animate-pulse rounded-2xl bg-white" />
          ) : all.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9e0ec] bg-white px-6 py-14 text-center">
              <Package className="mx-auto size-10 text-[#0066FF]" strokeWidth={1.5} />
              <p className="mt-3 text-[15px] font-semibold text-[#0B1F4D]">Omborda hali mahsulot yo‘q</p>
              <p className="mt-1 text-[13px] text-[#8b93a7]">Mahsulot qo‘shing yoki CSV fayldan import qiling. Ma’lumotlar shu qurilmada saqlanadi.</p>
              <div className="mt-4 flex justify-center gap-2">
                <button type="button" onClick={() => setAdding("new")} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0066FF] px-4 text-[13px] font-semibold text-white"><PackagePlus className="size-4" /> Yangi mahsulot</button>
                <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d6e4ff] px-4 text-[13px] font-semibold text-[#0066FF]"><FileSpreadsheet className="size-4" /> CSV import</button>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-2xl border border-[#eceff5] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] lg:block">
                <table className="w-full min-w-[820px] text-left text-[12px]">
                  <thead className="border-b border-[#eef1f6] text-[11px] text-[#6b7590]">
                    <tr>
                      <th className="w-8 py-3 pl-4 font-medium">#</th>
                      <th className="font-medium">Mahsulot</th>
                      <th className="font-medium">Kategoriya</th>
                      <th className="font-medium">SKU</th>
                      <th className="font-medium">Zaxira</th>
                      <th className="font-medium">Min.</th>
                      <th className="font-medium">Yaroqlilik</th>
                      <th className="font-medium">Yetkazib beruvchi</th>
                      <th className="font-medium">Holat</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((i, k) => {
                      const s = statusOf(i);
                      const d = daysLeft(i.expiry);
                      return (
                        <tr key={i.id} onClick={() => setAdding(i)} className="cursor-pointer border-b border-[#f2f4f8] last:border-0 hover:bg-[#f8faff]">
                          <td className="py-2.5 pl-4 text-[#6b7590]">{(cur - 1) * PAGE + k + 1}</td>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#f4f6fa]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {i.image ? <img src={i.image} alt="" className="size-full object-contain" /> : <Package className="size-4 text-[#9aa3b2]" />}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-[#0B1F4D]">{i.name}</div>
                                {i.subtitle ? <div className="truncate text-[11px] text-[#8b93a7]">{i.subtitle}</div> : null}
                              </div>
                            </div>
                          </td>
                          <td className="text-[#4a5470]">{i.category}</td>
                          <td className="text-[#4a5470]">{i.sku || "—"}</td>
                          <td className={cn("font-semibold", i.qty < i.minQty ? "text-[#d93b3b]" : "text-[#17914f]")}>{i.qty}</td>
                          <td className="text-[#4a5470]">{i.minQty}</td>
                          <td className={cn(d != null && d <= SOON_DAYS ? "font-semibold text-[#d93b3b]" : "text-[#4a5470]")}>{i.expiry ? fmtDate(i.expiry) : "—"}</td>
                          <td className="text-[#4a5470]">{i.supplier || "—"}</td>
                          <td><span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", STATUS[s].cls)}>{STATUS[s].label}</span></td>
                          <td className="pr-3" onClick={(e) => e.stopPropagation()}>
                            <button type="button" aria-label="O‘chirish" onClick={() => window.confirm(`${i.name} ni o‘chirasizmi?`) && save(all.filter((x) => x.id !== i.id))} className="grid size-8 place-items-center rounded-lg text-[#8b93a7] hover:bg-[#f1f3f7]"><Trash2 className="size-3.5" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="flex items-center gap-3 border-t border-[#eef1f6] px-4 py-3 text-[12px] text-[#6b7590]">
                  <span>Jami: {list.length} mahsulot</span>
                  <div className="mx-auto flex gap-1">
                    {Array.from({ length: pages }, (_, n) => n + 1).map((n) => (
                      <button key={n} type="button" onClick={() => setPage(n)} className={cn("grid size-8 place-items-center rounded-lg border text-[12px] font-semibold", n === cur ? "border-[#0066FF] bg-[#0066FF] text-white" : "border-[#e6eaf2]")}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
              <ul className="space-y-2.5 lg:hidden">
                {list.map((i) => {
                  const s = statusOf(i);
                  return (
                    <li key={i.id}>
                      <button type="button" onClick={() => setAdding(i)} className="flex w-full items-center gap-3 rounded-2xl border border-[#eceff5] bg-white p-3 text-left">
                        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f4f6fa]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {i.image ? <img src={i.image} alt="" className="size-full object-contain" /> : <Package className="size-5 text-[#9aa3b2]" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-bold text-[#0B1F4D]">{i.name}</span>
                          <span className="block text-[12px] text-[#6b7590]">{i.category}{i.sku ? ` · ${i.sku}` : ""}</span>
                          <span className="mt-1 flex items-center gap-2 text-[12px]">
                            <span className={cn("font-semibold", i.qty < i.minQty ? "text-[#d93b3b]" : "text-[#17914f]")}>{i.qty} / {i.minQty}</span>
                            <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", STATUS[s].cls)}>{STATUS[s].label}</span>
                          </span>
                        </span>
                        <ChevronRight className="size-4 text-[#9aa3b2]" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <aside className="sticky top-0 hidden w-[280px] shrink-0 space-y-3 lg:block 2xl:w-[300px]">
          <SideList tone="red" icon={ShoppingCart} title="Kam zaxira mahsulotlar" empty="Kam zaxira yo‘q" rows={low.slice(0, 4).map((i) => ({ id: i.id, name: i.name, image: i.image, sub: <><b className="text-[#d93b3b]">{i.qty}</b> / {i.minQty} qolgan</> }))} />
          <SideList tone="orange" icon={AlertTriangle} title="Yaroqlilik muddati yaqin" empty="Muddati yaqin mahsulot yo‘q" rows={soon.slice(0, 3).map(({ i, d }) => ({ id: i.id, name: i.name, image: i.image, sub: <><b className="text-[#d93b3b]">{fmtDate(i.expiry)}</b> ({d < 0 ? "muddati o‘tgan" : `${d} kun qoldi`})</> }))} />
          <div className="rounded-2xl border border-[#eceff5] bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            <h3 className="mb-2 text-[14px] font-bold text-[#0B1F4D]">Tezkor amallar</h3>
            {[
              { icon: PackagePlus, label: "Yangi mahsulot", on: () => setAdding("new") },
              { icon: ShoppingCart, label: "Buyurtma berish", href: "/marketplace" },
              { icon: ClipboardCheck, label: "Inventarizatsiya", on: () => { setSt(""); setQ(""); setCat(""); setSup(""); } },
              { icon: FileSpreadsheet, label: "Excel (CSV) import", on: () => fileRef.current?.click() },
            ].map((a) => {
              const Icon = a.icon;
              const cls = "mb-1.5 flex h-10 w-full items-center gap-2.5 rounded-xl bg-[#f3f8ff] px-3 text-[12.5px] font-semibold text-[#0066FF] last:mb-0";
              const inner = <><Icon className="size-4" /> {a.label}<ChevronRight className="ml-auto size-4" /></>;
              return a.href ? <Link key={a.label} href={a.href} className={cls}>{inner}</Link> : <button key={a.label} type="button" onClick={a.on} className={cls}>{inner}</button>;
            })}
          </div>
        </aside>
      </div>

      <button type="button" aria-label="Yangi mahsulot" onClick={() => setAdding("new")} className="fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-[0_8px_24px_rgba(0,102,255,0.4)] lg:hidden">
        <Plus className="size-6" />
      </button>

      {adding ? (
        <Sheet title={adding === "new" ? "Yangi mahsulot" : "Mahsulotni tahrirlash"} onClose={() => setAdding(null)}>
          <ItemForm
            item={adding === "new" ? null : adding}
            onSave={(it) => {
              save(adding === "new" ? [it, ...all] : all.map((x) => (x.id === it.id ? it : x)));
              setAdding(null);
            }}
          />
        </Sheet>
      ) : null}
    </div>
  );
}

function Kpi({ icon: Icon, tone, label, value, danger }: { icon: typeof Boxes; tone: string; label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#eceff5] bg-white p-3 shadow-[0_2px_12px_rgba(15,23,42,0.05)] lg:p-4">
      <span className={cn("hidden size-11 shrink-0 place-items-center rounded-xl sm:grid", tone)}><Icon className="size-5" /></span>
      <div className="min-w-0">
        <div className="text-[11.5px] text-[#6b7590] lg:text-[12.5px]">{label}</div>
        <div className={cn("truncate text-[16px] font-extrabold lg:text-[22px]", danger ? "text-[#d93b3b]" : "text-[#0B1F4D]")}>{value}</div>
      </div>
    </div>
  );
}

function Sel({ value, onChange, label, opts, className }: { value: string; onChange: (v: string) => void; label: string; opts: [string, string][]; className?: string }) {
  return (
    <label className={cn("relative flex-1 lg:w-[150px] lg:flex-none", className)}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        <option value="">{label}</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
    </label>
  );
}

function SideList({ tone, icon: Icon, title, rows, empty }: { tone: "red" | "orange"; icon: typeof Boxes; title: string; empty: string; rows: { id: string; name: string; image?: string; sub: React.ReactNode }[] }) {
  return (
    <div className={cn("rounded-2xl border p-3", tone === "red" ? "border-[#fbdada] bg-[#fff6f6]" : "border-[#fde3c8] bg-[#fff9f2]")}>
      <h3 className={cn("mb-2 flex items-center gap-2 text-[13.5px] font-bold", tone === "red" ? "text-[#d93b3b]" : "text-[#d9730d]")}><Icon className="size-4" /> {title}</h3>
      {rows.length === 0 ? (
        <p className="py-3 text-center text-[12px] text-[#8b93a7]">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2.5 rounded-xl bg-white p-2">
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#f4f6fa]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.image ? <img src={r.image} alt="" className="size-full object-contain" /> : <Package className="size-4 text-[#9aa3b2]" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-[#0B1F4D]">{r.name}</span>
                <span className="block text-[11.5px] text-[#6b7590]">{r.sub}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemForm({ item, onSave }: { item: StockItem | null; onSave: (it: StockItem) => void }) {
  const [f, setF] = useState({
    name: item?.name ?? "",
    subtitle: item?.subtitle ?? "",
    category: item?.category ?? "",
    sku: item?.sku ?? "",
    qty: String(item?.qty ?? ""),
    minQty: String(item?.minQty ?? ""),
    price: item?.price ? String(item.price) : "",
    expiry: item?.expiry ?? "",
    supplier: item?.supplier ?? "",
  });
  const [err, setErr] = useState("");
  const input = "h-11 w-full rounded-xl border border-[#e6eaf2] bg-white px-3 text-[14px] outline-none focus:border-[#0066FF]";
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.category.trim()) return setErr("Nomi va kategoriyasi majburiy");
    onSave({
      id: item?.id ?? `${Date.now()}`,
      name: f.name.trim(),
      subtitle: f.subtitle.trim() || undefined,
      category: f.category.trim(),
      sku: f.sku.trim() || undefined,
      qty: Math.max(0, Number(f.qty) || 0),
      minQty: Math.max(0, Number(f.minQty) || 0),
      price: Number(f.price) || undefined,
      expiry: f.expiry || undefined,
      supplier: f.supplier.trim() || undefined,
      image: item?.image,
    });
  }
  const field = (k: keyof typeof f, label: string, type = "text") => (
    <label className="block text-[12.5px] font-medium text-[#4a5470]">
      {label}
      <input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={cn(input, "mt-1")} />
    </label>
  );
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <div className="col-span-2">{field("name", "Nomi *")}</div>
      <div className="col-span-2">{field("subtitle", "Qisqa tavsif")}</div>
      {field("category", "Kategoriya *")}
      {field("sku", "SKU")}
      {field("qty", "Zaxira", "number")}
      {field("minQty", "Min. zaxira", "number")}
      {field("price", "Narx (so‘m)", "number")}
      {field("expiry", "Yaroqlilik muddati", "date")}
      <div className="col-span-2">{field("supplier", "Yetkazib beruvchi")}</div>
      {err ? <p className="col-span-2 text-[13px] text-red-600">{err}</p> : null}
      <button type="submit" className="col-span-2 h-11 rounded-xl bg-[#0066FF] text-[14px] font-semibold text-white">Saqlash</button>
    </form>
  );
}
