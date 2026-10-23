"use client";
/* eslint-disable @next/next/no-img-element -- stock photos are local uploads */

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, BarChart3, CalendarDays, ChevronRight, Filter, MoreVertical, Package, Plus, Search, Trash2 } from "lucide-react";
import { NewStockModal } from "@/components/crm/NewStockModal";
import { stockCategories, stockSuppliers, type StockItem } from "@/data/crm";
import { formatUzDate } from "@/lib/format";
import { useStoredList } from "@/lib/stored-list";
import { tashkentDateParts } from "@/lib/tashkent-date";
import "./ombor-mobile.css";

const DAY_MS = 86_400_000;

/** "24.10.2026" → days from today, or null when the date is missing. */
function daysLeft(expiry: string, todayIso: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(expiry || "");
  if (!match) return null;
  return Math.round((new Date(`${match[3]}-${match[2]}-${match[1]}`).getTime() - new Date(todayIso).getTime()) / DAY_MS);
}

function expiryText(expiry: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(expiry || "");
  if (!match) return "";
  const date = formatUzDate(`${match[3]}-${match[2]}-${match[1]}`);
  return `${date.dayNum} ${date.monthShort} ${date.year}`;
}

/** Phone /crm/ombor (mocks "ombor telefon" + "omborga mahsulot qo‘shish telefon"). Same storage as the desktop page. */
export function OmborMobile() {
  const [items, setItems] = useStoredList<StockItem>("sk-crm-stock-v2", []);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [adding, setAdding] = useState(false);
  const [restock, setRestock] = useState<StockItem | null>(null);
  const [amount, setAmount] = useState("10");
  const [menu, setMenu] = useState("");
  const today = tashkentDateParts().iso;
  const suppliers = Array.from(new Set([...stockSuppliers, ...items.map((item) => item.supplier).filter(Boolean)]));
  const low = (item: StockItem) => item.alert !== false && item.qty <= item.min;
  const lowCount = items.filter(low).length;
  const cats = stockCategories.filter((name) => items.some((item) => item.category === name));
  const needle = q.trim().toLowerCase();
  const shown = items.filter(
    (item) =>
      (!cat || item.category === cat) &&
      (!lowOnly || low(item)) &&
      (!needle || `${item.name} ${item.category} ${item.sku}`.toLowerCase().includes(needle)),
  );

  function addQty() {
    const add = Number(amount) || 0;
    if (!restock || add <= 0) return;
    setItems((prev) => prev.map((item) => (item.id === restock.id ? { ...item, qty: item.qty + add } : item)));
    setRestock(null);
  }

  return (
    <div className="om" data-testid="stock-mobile">
      <header className="om-head">
        <div>
          <h1>Ombor</h1>
          <p>Materiallar va jihozlar inventarizatsiyasi</p>
        </div>
        <Link href="/crm/hisobotlar" className="om-report-btn"><BarChart3 /> Hisobot</Link>
      </header>

      <div className="om-tools">
        <label className="om-search"><Search /><input value={q} placeholder="Mahsulot nomi, kategoriya yoki SKU bo‘yicha qidirish..." aria-label="Qidirish" onChange={(event) => setQ(event.target.value)} /></label>
        <button type="button" className={lowOnly ? "om-filter on" : "om-filter"} aria-pressed={lowOnly} onClick={() => setLowOnly((value) => !value)}><Filter /> Filtr</button>
      </div>

      {items.length ? (
        <div className="om-chips" role="tablist">
          <button type="button" role="tab" aria-selected={!cat} className={!cat ? "on" : ""} onClick={() => setCat("")}>Barchasi ({items.length})</button>
          {cats.map((name) => (
            <button key={name} type="button" role="tab" aria-selected={cat === name} className={cat === name ? "on" : ""} onClick={() => setCat(name)}>
              {name} ({items.filter((item) => item.category === name).length})
            </button>
          ))}
        </div>
      ) : null}

      {lowCount > 0 ? (
        <button type="button" className="om-alert" onClick={() => setLowOnly(true)}>
          <AlertTriangle />
          <span><b>Kam miqdordagi mahsulotlar</b><small>{lowCount} ta mahsulotning qoldig‘i kam. Zudlik bilan buyurtma bering.</small></span>
          <ChevronRight />
        </button>
      ) : null}

      {items.length === 0 ? (
        <div className="om-empty">
          <Package />
          <b>Hozircha ombor yozuvi yo‘q</b>
          <p>Birinchi mahsulotni qo‘shing — qoldiq va yaroqlilik muddati shu yerda kuzatiladi.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="om-empty"><p>Mos mahsulot topilmadi.</p></div>
      ) : (
        <ul className="om-list">
          {shown.map((item) => {
            const isLow = low(item);
            const left = daysLeft(item.expiry, today);
            const target = Math.max(item.min * 2, item.qty, 1);
            const pct = Math.min(100, Math.round((item.qty / target) * 100));
            const tone = isLow ? (item.qty <= item.min / 2 ? "red" : "amber") : "green";
            return (
              <li key={item.id} className="om-card">
                <div className="om-photo">{item.image ? <img src={item.image} alt="" /> : <Package />}</div>
                <div className="om-body">
                  <b className="om-name">{item.name}</b>
                  <p className="om-sub">{item.category}{item.sku ? <> <i>|</i> SKU: {item.sku}</> : null}</p>
                  <div className="om-bar-row">
                    <span className={`om-bar ${tone}`}><span style={{ width: `${pct}%` }} /></span>
                    <span className={`om-qty ${tone}`}>{item.qty} / {target} {item.unit || "dona"}</span>
                  </div>
                  {item.expiry ? (
                    <p className={left !== null && left <= 30 ? "om-exp warn" : "om-exp"}><CalendarDays /> Yaroqlilik muddati: {expiryText(item.expiry)}</p>
                  ) : null}
                </div>
                <div className="om-side">
                  <div className="om-side-top">
                    <span className={isLow ? "om-pill low" : "om-pill"}>{isLow ? "Kam qoldi" : "Norma"}</span>
                    <span className="om-menu-wrap">
                      <button type="button" className="om-more" aria-label="Yana" aria-expanded={menu === item.id} onClick={() => setMenu(menu === item.id ? "" : item.id)}><MoreVertical /></button>
                      {menu === item.id ? (
                        <span className="om-menu">
                          <button type="button" onClick={() => { setMenu(""); if (window.confirm(`${item.name} o‘chirilsinmi?`)) setItems((prev) => prev.filter((row) => row.id !== item.id)); }}><Trash2 /> O‘chirish</button>
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <button type="button" className="om-order" onClick={() => { setRestock(item); setAmount(String(Math.max(1, item.min * 2 - item.qty))); }}><Plus /> To‘ldirish</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="om-foot">
        <Link href="/crm/hisobotlar" className="om-report"><Package /> Ombor hisoboti <ChevronRight /></Link>
        <button type="button" className="om-fab" data-testid="stock-add-mobile" onClick={() => setAdding(true)}><Plus /> Mahsulot qo‘shish</button>
      </div>

      {adding ? (
        <NewStockModal
          suppliers={suppliers}
          onClose={() => setAdding(false)}
          onSave={(item) => {
            setItems((prev) => [item, ...prev]);
            setAdding(false);
          }}
        />
      ) : null}

      {restock ? (
        <div className="om-sheet" role="dialog" aria-label="Qoldiqni to‘ldirish">
          <button type="button" className="om-sheet-close" aria-label="Yopish" onClick={() => setRestock(null)} />
          <div className="om-box">
            <h3>{restock.name}</h3>
            <p>Hozir: {restock.qty} {restock.unit || "dona"} · minimal: {restock.min}</p>
            <label>Nechta keldi?<input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
            <button type="button" className="om-save" onClick={addQty}>Omborga qo‘shish</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
