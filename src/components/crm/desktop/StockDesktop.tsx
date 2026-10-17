"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { CrmFrame, CrmModal, CrmPager } from "@/components/crm/desktop/CrmFrame";
import { buildStock, stockCategories, stockSuppliers, type StockItem, type StockStatus } from "@/data/crm";
import { downloadText } from "@/lib/simple-pdf";
import { formatMoney } from "@/lib/format";
import { useStoredList } from "@/lib/stored-list";

const SEED = buildStock();
const statusLabel: Record<StockStatus, string> = { kam: "Kam zaxira", mavjud: "Mavjud", tugash: "Tugash arafasida" };

export function StockDesktop() {
  const [items, setItems] = useStoredList("sk-crm-stock-v1", SEED);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<StockStatus | "">("");
  const [supplier, setSupplier] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [mode, setMode] = useState<"" | "new" | "order" | "count">("");
  const [form, setForm] = useState({ name: "", category: stockCategories[0], sku: "", qty: "10", min: "5", supplier: stockSuppliers[0] });

  const filtered = useMemo(() => items.filter((item) => {
    if (category && item.category !== category) return false;
    if (status && item.status !== status) return false;
    if (supplier && item.supplier !== supplier) return false;
    if (q.trim() && !`${item.name} ${item.sku} ${item.category} ${item.supplier}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  }), [category, items, q, status, supplier]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const safe = Math.min(page, pages);
  const slice = filtered.slice((safe - 1) * size, safe * size);
  const pristine = !q && !category && !status && !supplier && items.length === SEED.length;
  const value = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const low = items.filter((item) => item.status === "kam");
  const soon = items.filter((item) => item.expiry.endsWith("2026") && (item.expiry.startsWith("05.01") || item.expiry.startsWith("12.03") || item.expiry.startsWith("20.12") || item.expiry.includes(".02."))).slice(0, 4);

  function add() {
    if (!form.name.trim()) return;
    const next: StockItem = { id: `st-user-${Date.now()}`, name: form.name.trim(), detail: "Yangi", category: form.category, sku: form.sku || `SKU-${Date.now().toString().slice(-4)}`, qty: Number(form.qty) || 0, min: Number(form.min) || 1, expiry: "01.01.2028", supplier: form.supplier, status: Number(form.qty) <= Number(form.min) ? "kam" : "mavjud", image: "/img/cart/gloves.jpg", price: 50000 };
    setItems((prev) => [next, ...prev]);
    setMode("");
    setPage(1);
  }

  return (
    <CrmFrame active="stock" placeholder="Mahsulot nomi, brend, kategoriya yoki SKU qidirish..." headerQuery={q} onHeaderQuery={(value) => { setQ(value); setPage(1); }}>
      <div data-testid="stock-desktop">
        <div className="crm-head">
          <div>
            <h1>Ombor</h1>
            <p>Klinika inventari va sarf materiallari</p>
          </div>
          <div className="crm-actions">
            <button type="button" className="crm-btn" data-testid="stock-cats" onClick={() => setCategory(category ? "" : stockCategories[0])}>Kategoriyalar</button>
            <button type="button" className="crm-btn blue" data-testid="stock-order" onClick={() => setMode("order")}><Plus className="i" /> Buyurtma berish</button>
          </div>
        </div>
        <div className="pay-kpis" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          <article><small>Jami mahsulotlar</small><b>{pristine ? 248 : filtered.length}</b><em className="money-plus">+12% o‘tgan oyga nisbatan</em></article>
          <article><small>Ombordagi qiymat</small><b>{pristine ? "125 600 000 so‘m" : formatMoney(value, "UZS")}</b><em className="money-plus">+8% o‘tgan oyga nisbatan</em></article>
          <article><small>Kam zaxira</small><b className="money-minus">{pristine ? 18 : low.length}</b><em>Diqqat talab qiladi</em></article>
        </div>
        <div className="crm-split">
          <div className="crm-card">
            <div className="crm-tools" style={{ padding: "calc(.4 * var(--u))" }}>
              <label className="crm-search"><Search className="i" /><input data-testid="stock-search" aria-label="Mahsulot qidirish" value={q} placeholder="Mahsulot nomi, brend yoki SKU..." onChange={(event) => { setQ(event.target.value); setPage(1); }} /></label>
              <label className="crm-select"><select data-testid="stock-category" aria-label="Kategoriya" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">Barcha kategoriyalar</option>{stockCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="crm-select"><select data-testid="stock-status" aria-label="Holat" value={status} onChange={(event) => { setStatus(event.target.value as StockStatus | ""); setPage(1); }}><option value="">Barcha holatlar</option><option value="kam">Kam zaxira</option><option value="mavjud">Mavjud</option><option value="tugash">Tugash arafasida</option></select></label>
              <label className="crm-select"><select data-testid="stock-supplier" aria-label="Yetkazib beruvchi" value={supplier} onChange={(event) => { setSupplier(event.target.value); setPage(1); }}><option value="">Barcha yetkazib beruvchilar</option>{stockSuppliers.map((item) => <option key={item}>{item}</option>)}</select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
            </div>
            {slice.length === 0 ? <div className="crm-empty">Mahsulot topilmadi</div> : (
              <div className="crm-table-scroll">
              <table className="crm-table">
                <thead><tr><th /><th>#</th><th>Mahsulot</th><th>Kategoriya</th><th>SKU</th><th>Zaxira</th><th>Min zaxira</th><th>Yaroqlilik muddati</th><th>Yetkazib beruvchi</th><th>Holat</th><th /></tr></thead>
                <tbody>
                  {slice.map((item, index) => (
                    <tr key={item.id} data-testid="stock-row">
                      <td><input type="checkbox" aria-label={item.name} /></td>
                      <td>{(safe - 1) * size + index + 1}</td>
                      <td><span className="crm-person"><img className="sk-thumb" src={item.image} alt="" /><span><b>{item.name}</b><small>{item.detail}</small></span></span></td>
                      <td>{item.category}</td>
                      <td>{item.sku}</td>
                      <td style={{ color: item.qty < item.min ? "#dc2626" : "#16803c", fontWeight: 800 }}>{item.qty}</td>
                      <td>{item.min}</td>
                      <td>{item.expiry || "–"}</td>
                      <td>{item.supplier}</td>
                      <td><span className={`crm-pill ${item.status}`}>{statusLabel[item.status]}</span></td>
                      <td>···</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
            <CrmPager page={safe} pages={pages} size={size} totalLabel={`Jami: ${filtered.length} mahsulot`} onPage={setPage} onSize={(value) => { setSize(value); setPage(1); }} />
          </div>
          <aside>
            <div className="pl-box">
              <b>Kam zaxira mahsulotlar</b>
              {low.slice(0, 4).map((item) => <div key={item.id} className="visit"><span className="crm-person"><img className="sk-thumb" src={item.image} alt="" /><span><b>{item.name}</b><small>{item.qty} / {item.min} qolgan</small></span></span></div>)}
            </div>
            <div className="pl-box" style={{ marginTop: "calc(.4 * var(--u))" }}>
              <b>Yaroqlilik muddati yaqin</b>
              {soon.map((item) => <div key={item.id} className="visit"><span><b>{item.name}</b><small className="crm-muted">{item.expiry}</small></span></div>)}
            </div>
            <div className="pl-box" style={{ marginTop: "calc(.4 * var(--u))" }}>
              <b>Tezkor amallar</b>
              <button type="button" className="visit" style={{ width: "100%", textAlign: "left" }} data-testid="stock-new" onClick={() => setMode("new")}>Yangi mahsulot</button>
              <button type="button" className="visit" style={{ width: "100%", textAlign: "left" }} onClick={() => setMode("order")}>Buyurtma berish</button>
              <button type="button" className="visit" style={{ width: "100%", textAlign: "left" }} data-testid="stock-count" onClick={() => setMode("count")}>Inventarizatsiya</button>
              <label className="visit" style={{ display: "block" }}>Excel import<input data-testid="stock-import" type="file" accept=".csv" hidden onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const text = await file.text(); downloadText("import-qabul.txt", text, "text/plain"); }} /></label>
            </div>
          </aside>
        </div>
        {mode === "new" || mode === "order" ? (
          <CrmModal title={mode === "new" ? "Yangi mahsulot" : "Buyurtma berish"} onClose={() => setMode("")}>
            <label className="crm-field">Nomi<input data-testid="stock-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="crm-field">Miqdor<input value={form.qty} onChange={(event) => setForm({ ...form, qty: event.target.value })} /></label>
            <div className="row"><button type="button" className="go" data-testid="stock-save" onClick={() => { if (mode === "order" && items[0]) { setItems((prev) => prev.map((item, index) => index === 0 ? { ...item, qty: item.qty + (Number(form.qty) || 1), status: "mavjud" } : item)); setMode(""); return; } add(); }}>Saqlash</button></div>
          </CrmModal>
        ) : null}
        {mode === "count" ? (
          <CrmModal title="Inventarizatsiya" onClose={() => setMode("")}>
            <p className="crm-muted">Birinchi mahsulot qoldig‘ini yangilang.</p>
            <label className="crm-field">Yangi qoldiq<input value={form.qty} onChange={(event) => setForm({ ...form, qty: event.target.value })} /></label>
            <div className="row"><button type="button" className="go" onClick={() => { setItems((prev) => prev.map((item, index) => index === 0 ? { ...item, qty: Number(form.qty) || item.qty } : item)); setMode(""); }}>Saqlash</button></div>
          </CrmModal>
        ) : null}
      </div>
    </CrmFrame>
  );
}
