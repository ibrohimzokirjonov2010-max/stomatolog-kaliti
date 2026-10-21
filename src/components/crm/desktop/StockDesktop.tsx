"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Boxes, ChevronRight, ClipboardCheck, Download, FileUp, LayoutGrid, Package, Plus, Search, ShoppingCart, Wallet } from "lucide-react";
import { CrmFrame, CrmModal, CrmPager } from "@/components/crm/desktop/CrmFrame";
import { stockCategories, stockSuppliers, type StockItem, type StockStatus } from "@/data/crm";
import { formatDotDate, formatMoney } from "@/lib/format";
import { useStoredList } from "@/lib/stored-list";
import { tashkentDateParts } from "@/lib/tashkent-date";

const SEED: StockItem[] = [];
const statusLabel: Record<StockStatus, string> = { kam: "Kam zaxira", mavjud: "Mavjud", tugash: "Tugash arafasida" };
const DAY_MS = 86_400_000;
/** Items expiring within this many days are listed as "Yaroqlilik muddati yaqin". */
const EXPIRY_WINDOW = 90;

/** "24.10.2026" → days from today, or null when the date is missing. */
function daysLeft(expiry: string, todayIso: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(expiry || "");
  if (!match) return null;
  return Math.round((new Date(`${match[3]}-${match[2]}-${match[1]}`).getTime() - new Date(todayIso).getTime()) / DAY_MS);
}

/** Status follows the numbers, not whatever was stored when the item was added. */
function statusOf(item: StockItem, todayIso: string): StockStatus {
  const left = daysLeft(item.expiry, todayIso);
  if (left !== null && left <= 30) return "tugash";
  if (item.qty <= item.min) return "kam";
  return "mavjud";
}

const EMPTY_FORM = { id: "", name: "", category: stockCategories[0], sku: "", qty: "10", min: "5", supplier: stockSuppliers[0], expiry: "", price: "" };

export function StockDesktop() {
  const today = tashkentDateParts().iso;
  const [items, setItems] = useStoredList("sk-crm-stock-v2", SEED);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<StockStatus | "">("");
  const [supplier, setSupplier] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [mode, setMode] = useState<"" | "new" | "order" | "count">("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [note, setNote] = useState("");

  const rows = useMemo(() => items.map((item) => ({ ...item, status: statusOf(item, today) })), [items, today]);
  const filtered = useMemo(() => rows.filter((item) => {
    if (category && item.category !== category) return false;
    if (status && item.status !== status) return false;
    if (supplier && item.supplier !== supplier) return false;
    if (q.trim() && !`${item.name} ${item.sku} ${item.category} ${item.supplier}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  }), [category, q, rows, status, supplier]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const safe = Math.min(page, pages);
  const slice = filtered.slice((safe - 1) * size, safe * size);
  const value = rows.reduce((sum, item) => sum + item.price * item.qty, 0);
  const low = rows.filter((item) => item.qty <= item.min).sort((a, b) => a.qty / Math.max(1, a.min) - b.qty / Math.max(1, b.min));
  const soon = rows
    .map((item) => ({ item, left: daysLeft(item.expiry, today) }))
    .filter((row): row is { item: (typeof rows)[number]; left: number } => row.left !== null && row.left <= EXPIRY_WINDOW)
    .sort((a, b) => a.left - b.left);
  const suppliers = Array.from(new Set([...stockSuppliers, ...items.map((item) => item.supplier).filter(Boolean)]));

  function open(next: "new" | "order" | "count", item?: StockItem) {
    setForm(item ? { ...EMPTY_FORM, id: item.id, qty: next === "count" ? String(item.qty) : "10" } : { ...EMPTY_FORM, id: rows[0]?.id ?? "" });
    setMode(next);
  }

  function add() {
    if (!form.name.trim()) return;
    const [year, month, day] = form.expiry.split("-");
    const next: StockItem = {
      id: `st-user-${Date.now()}`,
      name: form.name.trim(),
      detail: "",
      category: form.category,
      sku: form.sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      qty: Number(form.qty) || 0,
      min: Number(form.min) || 1,
      expiry: day && month && year ? `${day}.${month}.${year}` : "",
      supplier: form.supplier,
      status: "mavjud",
      image: "",
      price: Number(form.price) || 0,
    };
    setItems((prev) => [next, ...prev]);
    setMode("");
    setPage(1);
  }

  function changeQty(id: string, next: (qty: number) => number) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, qty: Math.max(0, next(item.qty)) } : item)));
    setMode("");
  }

  /** CSV columns: nomi, kategoriya, SKU, miqdor, min, yaroqlilik (dd.mm.yyyy), yetkazib beruvchi, narx. */
  async function importCsv(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const body = /nom|name/i.test(lines[0] ?? "") ? lines.slice(1) : lines;
    const added: StockItem[] = body.map((line, index) => {
      const [name, cat, sku, qty, min, expiry, sup, price] = line.split(/[;,]/).map((cell) => cell.trim());
      return {
        id: `st-imp-${Date.now()}-${index}`,
        name: name || "Mahsulot",
        detail: "",
        category: cat || stockCategories[0],
        sku: sku || `SKU-${index + 1}`,
        qty: Number(qty) || 0,
        min: Number(min) || 1,
        expiry: /^\d{2}\.\d{2}\.\d{4}$/.test(expiry ?? "") ? expiry : "",
        supplier: sup || "",
        status: "mavjud",
        image: "",
        price: Number(price) || 0,
      };
    });
    if (added.length) setItems((prev) => [...added, ...prev]);
    setNote(added.length ? `${added.length} ta mahsulot qo‘shildi` : "Faylda mahsulot topilmadi");
  }

  const kpis = [
    { label: "Jami mahsulotlar", value: String(rows.length), icon: Boxes, tone: "blue", sub: `${new Set(rows.map((item) => item.category)).size} ta kategoriya` },
    { label: "Ombordagi qiymat", value: formatMoney(value, "UZS"), icon: Wallet, tone: "green", sub: "Narx × qoldiq" },
    { label: "Kam zaxira", value: String(low.length), icon: AlertTriangle, tone: "red", sub: low.length ? "Diqqat talab qiladi" : "Hammasi yetarli" },
  ];

  return (
    <CrmFrame active="stock" placeholder="Mahsulot nomi, brend, kategoriya yoki SKU qidirish..." headerQuery={q} onHeaderQuery={(next) => { setQ(next); setPage(1); }}>
      <div data-testid="stock-desktop">
        <div className="crm-head">
          <div>
            <h1>Ombor</h1>
            <p>Klinika inventari va sarf materiallari</p>
          </div>
          <div className="crm-actions">
            <label className="crm-btn" data-testid="stock-cats">
              <LayoutGrid className="i" />
              <select aria-label="Kategoriya" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
                <option value="">Kategoriyalar</option>
                {stockCategories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <button type="button" className="crm-btn blue" data-testid="stock-order" onClick={() => open("order")}><Plus className="i" /> Buyurtma berish</button>
          </div>
        </div>
        <div className="pay-kpis sk-kpis">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <article key={kpi.label} className={kpi.tone}>
                <span className="ic"><Icon className="i" /></span>
                <div>
                  <small>{kpi.label}</small>
                  <b className={kpi.tone === "red" && low.length ? "money-minus" : undefined}>{kpi.value}</b>
                  <em className="plain">{kpi.sub}</em>
                </div>
              </article>
            );
          })}
        </div>
        {note ? <p className="crm-muted sk-note">{note}</p> : null}
        <div className="crm-split">
          <div className="crm-card">
            <div className="crm-tools pay-tools">
              <label className="crm-search"><Search className="i" /><input data-testid="stock-search" aria-label="Mahsulot qidirish" value={q} placeholder="Mahsulot nomi, brend yoki SKU..." onChange={(event) => { setQ(event.target.value); setPage(1); }} /></label>
              <label className="crm-select"><select data-testid="stock-category" aria-label="Kategoriya" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">Barcha kategoriyalar</option>{stockCategories.map((item) => <option key={item}>{item}</option>)}</select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
              <label className="crm-select"><select data-testid="stock-status" aria-label="Holat" value={status} onChange={(event) => { setStatus(event.target.value as StockStatus | ""); setPage(1); }}><option value="">Barcha holatlar</option><option value="kam">Kam zaxira</option><option value="mavjud">Mavjud</option><option value="tugash">Tugash arafasida</option></select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
              <label className="crm-select"><select data-testid="stock-supplier" aria-label="Yetkazib beruvchi" value={supplier} onChange={(event) => { setSupplier(event.target.value); setPage(1); }}><option value="">Barcha yetkazib beruvchilar</option>{suppliers.map((item) => <option key={item}>{item}</option>)}</select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
            </div>
            {slice.length === 0 ? <div className="crm-empty">{items.length ? "Mahsulot topilmadi" : "Omborda hali mahsulot yo‘q. «Yangi mahsulot» yoki «Excel import» orqali qo‘shing."}</div> : (
              <div className="crm-table-scroll">
                <table className="crm-table">
                  <thead><tr><th>#</th><th>Mahsulot</th><th>Kategoriya</th><th>SKU</th><th>Zaxira</th><th>Min. zaxira</th><th>Yaroqlilik muddati</th><th>Yetkazib beruvchi</th><th>Holat</th><th>Amallar</th></tr></thead>
                  <tbody>
                    {slice.map((item, index) => {
                      const left = daysLeft(item.expiry, today);
                      return (
                        <tr key={item.id} data-testid="stock-row">
                          <td className="num">{(safe - 1) * size + index + 1}</td>
                          <td>
                            <span className="crm-person">
                              {item.image ? <img className="sk-thumb" src={item.image} alt="" /> : <span className="sk-thumb sk-ph" aria-hidden><Package className="i" /></span>}
                              <span><b>{item.name}</b>{item.detail ? <small>{item.detail}</small> : null}</span>
                            </span>
                          </td>
                          <td className="crm-muted">{item.category}</td>
                          <td className="crm-muted">{item.sku}</td>
                          <td className={item.qty <= item.min ? "sk-low" : "sk-ok"}>{item.qty}</td>
                          <td className={item.qty <= item.min ? "sk-low" : undefined}>{item.min}</td>
                          <td className={left !== null && left <= 30 ? "sk-low" : undefined}>{formatDotDate(item.expiry)}</td>
                          <td>{item.supplier || "–"}</td>
                          <td><span className={`crm-pill ${item.status}`}>{statusLabel[item.status]}</span></td>
                          <td>
                            <span className="sk-acts">
                              <button type="button" aria-label={`${item.name}: buyurtma`} title="Buyurtma berish" onClick={() => open("order", item)}><ShoppingCart className="i" /></button>
                              <button type="button" aria-label={`${item.name}: qoldiqni sanash`} title="Inventarizatsiya" onClick={() => open("count", item)}><ClipboardCheck className="i" /></button>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <CrmPager page={safe} pages={pages} size={size} totalLabel={`Jami: ${filtered.length} mahsulot`} onPage={setPage} onSize={(next) => { setSize(next); setPage(1); }} />
          </div>
          <aside className="pay-rail">
            <div className="pl-box sk-side red">
              <div className="pay-card-h"><b><AlertTriangle className="i" /> Kam zaxira mahsulotlar</b><button type="button" className="pay-link" onClick={() => { setStatus("kam"); setPage(1); }}>Barchasi <ArrowRight className="i" /></button></div>
              {low.length === 0 ? <p className="crm-muted">Hammasi yetarli</p> : low.slice(0, 4).map((item) => (
                <button key={item.id} type="button" className="sk-row" onClick={() => open("order", item)}>
                  {item.image ? <img src={item.image} alt="" /> : <span className="sk-ph" aria-hidden><Package className="i" /></span>}
                  <span><b>{item.name}</b><small><em>{item.qty}</em> / {item.min} qolgan</small></span>
                  <ChevronRight className="i" />
                </button>
              ))}
            </div>
            <div className="pl-box sk-side amber">
              <div className="pay-card-h"><b><AlertTriangle className="i" /> Yaroqlilik muddati yaqin</b></div>
              {soon.length === 0 ? <p className="crm-muted">{EXPIRY_WINDOW} kun ichida muddati tugaydigan mahsulot yo‘q</p> : soon.slice(0, 3).map(({ item, left }) => (
                <div key={item.id} className="sk-row">
                  {item.image ? <img src={item.image} alt="" /> : <span className="sk-ph" aria-hidden><Package className="i" /></span>}
                  <span><b>{item.name}</b><small><em>{item.expiry}</em> ({left < 0 ? "muddati o‘tgan" : `${left} kun qoldi`})</small></span>
                  <AlertTriangle className="i warn" />
                </div>
              ))}
            </div>
            <div className="pl-box">
              <b>Tezkor amallar</b>
              <div className="sk-quick">
                <button type="button" data-testid="stock-new" onClick={() => open("new")}><Plus className="i" /> Yangi mahsulot <ChevronRight className="i" /></button>
                <button type="button" onClick={() => open("order")}><ShoppingCart className="i" /> Buyurtma berish <ChevronRight className="i" /></button>
                <button type="button" data-testid="stock-count" onClick={() => open("count")}><ClipboardCheck className="i" /> Inventarizatsiya <ChevronRight className="i" /></button>
                <label><FileUp className="i" /> Excel (CSV) import <ChevronRight className="i" /><input data-testid="stock-import" type="file" accept=".csv,text/csv" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.target.value = ""; }} /></label>
              </div>
              <p className="crm-muted sk-hint"><Download className="i" /> CSV ustunlari: nomi, kategoriya, SKU, miqdor, min, muddat (kk.oo.yyyy), yetkazib beruvchi, narx</p>
            </div>
          </aside>
        </div>
        {mode === "new" ? (
          <CrmModal title="Yangi mahsulot" onClose={() => setMode("")}>
            <label className="crm-field">Nomi<input data-testid="stock-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="crm-field">Kategoriya<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{stockCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="crm-field">SKU<input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label>
            <label className="crm-field">Miqdor<input inputMode="numeric" value={form.qty} onChange={(event) => setForm({ ...form, qty: event.target.value })} /></label>
            <label className="crm-field">Minimal zaxira<input inputMode="numeric" value={form.min} onChange={(event) => setForm({ ...form, min: event.target.value })} /></label>
            <label className="crm-field">Yaroqlilik muddati<input type="date" value={form.expiry} onChange={(event) => setForm({ ...form, expiry: event.target.value })} /></label>
            <label className="crm-field">Yetkazib beruvchi<select value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })}>{suppliers.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="crm-field">Narx (so‘m, bir dona)<input inputMode="numeric" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
            <div className="row"><button type="button" className="go" data-testid="stock-save" onClick={add}>Saqlash</button></div>
          </CrmModal>
        ) : null}
        {mode === "order" || mode === "count" ? (
          <CrmModal title={mode === "order" ? "Buyurtma berish (kirim)" : "Inventarizatsiya"} onClose={() => setMode("")}>
            {rows.length === 0 ? <p className="crm-muted">Avval omborga mahsulot qo‘shing.</p> : (
              <>
                <label className="crm-field">Mahsulot<select value={form.id} onChange={(event) => { const item = rows.find((row) => row.id === event.target.value); setForm({ ...form, id: event.target.value, qty: mode === "count" ? String(item?.qty ?? 0) : form.qty }); }}>{rows.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.qty} dona</option>)}</select></label>
                <label className="crm-field">{mode === "order" ? "Kelgan miqdor" : "Haqiqiy qoldiq"}<input inputMode="numeric" value={form.qty} onChange={(event) => setForm({ ...form, qty: event.target.value })} /></label>
                <div className="row">
                  <button
                    type="button"
                    className="go"
                    data-testid="stock-save"
                    onClick={() => changeQty(form.id, (qty) => (mode === "order" ? qty + (Number(form.qty) || 0) : Number(form.qty) || 0))}
                  >
                    Saqlash
                  </button>
                </div>
              </>
            )}
          </CrmModal>
        ) : null}
      </div>
    </CrmFrame>
  );
}
