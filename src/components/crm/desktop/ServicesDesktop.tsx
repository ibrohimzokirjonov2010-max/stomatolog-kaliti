"use client";
/* eslint-disable @next/next/no-img-element -- service pictures are small local images */

import { useMemo, useRef, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Clock, Copy, Download, LayoutGrid, MoreVertical, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { formatGroupedNumber } from "@/lib/format";
import { downloadText } from "@/lib/simple-pdf";
import { useStoredList } from "@/lib/stored-list";
import { SERVICES_KEY, SERVICE_CATEGORIES, categoryImage, categoryOf, nextServiceCode, type ClinicService, type ServiceCategory } from "@/lib/crm-services";
import { ServiceModal, ToothIcon } from "./ServiceModal";
import "./services.css";

type Sort = "az" | "za" | "cheap" | "dear" | "new";
const PAGE = 8;

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

/** Parses a CSV line with quoted cells. */
function csvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === "," || ch === ";") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((cell) => cell.trim());
}

/** Desktop /crm/xizmatlar (mock "xizmatlar bo'limi"). */
export function ServicesDesktop() {
  const [items, setItems] = useStoredList<ClinicService>(SERVICES_KEY, []);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ServiceCategory | "">("");
  const [status, setStatus] = useState<"" | "faol" | "nofaol">("");
  const [sort, setSort] = useState<Sort>("az");
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [modal, setModal] = useState<{ open: boolean; edit: ClinicService | null }>({ open: false, edit: null });
  const [menu, setMenu] = useState<string | null>(null);
  const [io, setIo] = useState(false);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const rows = items.filter((item) => {
      if (cat && item.category !== cat) return false;
      if (status === "faol" && !item.active) return false;
      if (status === "nofaol" && item.active) return false;
      return !query || `${item.name} ${item.code} ${item.tags.join(" ")}`.toLowerCase().includes(query);
    });
    const by: Record<Sort, (a: ClinicService, b: ClinicService) => number> = {
      az: (a, b) => a.name.localeCompare(b.name),
      za: (a, b) => b.name.localeCompare(a.name),
      cheap: (a, b) => a.price - b.price,
      dear: (a, b) => b.price - a.price,
      new: (a, b) => b.createdAt.localeCompare(a.createdAt),
    };
    return [...rows].sort(by[sort]);
  }, [cat, items, q, sort, status]);

  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const current = Math.min(page, pages);
  const pageRows = shown.slice((current - 1) * PAGE, current * PAGE);
  const allPicked = pageRows.length > 0 && pageRows.every((item) => picked.includes(item.id));

  function flash(text: string) {
    setNote(text);
    window.setTimeout(() => setNote(""), 2400);
  }

  function upsert(service: ClinicService) {
    setItems((prev) => (prev.some((item) => item.id === service.id) ? prev.map((item) => (item.id === service.id ? service : item)) : [service, ...prev]));
    setModal({ open: false, edit: null });
    flash("Xizmat saqlandi");
  }

  function duplicate(service: ClinicService) {
    const copy: ClinicService = { ...service, id: `svc-${Date.now().toString(36)}`, name: `${service.name} (nusxa)`, code: nextServiceCode(items), createdAt: new Date().toISOString() };
    setItems((prev) => [copy, ...prev]);
    flash("Nusxa yaratildi");
  }

  function remove(ids: string[]) {
    if (!ids.length || !window.confirm(ids.length > 1 ? `${ids.length} ta xizmatni o‘chirasizmi?` : "Xizmatni o‘chirasizmi?")) return;
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    setPicked((prev) => prev.filter((id) => !ids.includes(id)));
  }

  function exportCsv() {
    const head = ["Kod", "Nomi", "Kategoriya", "Narx", "Davomiylik (daqiqa)", "Status", "Teglar"].map(csvCell).join(",");
    const rows = items.map((item) => [item.code, item.name, categoryOf(item.category).label, item.price, item.minutes, item.active ? "Faol" : "Nofaol", item.tags.join("; ")].map(csvCell).join(","));
    downloadText("xizmatlar.csv", `﻿${[head, ...rows].join("\n")}\n`, "text/csv");
    setIo(false);
  }

  async function importCsv(file: File) {
    setIo(false);
    const text = (await file.text()).replace(/^﻿/, "");
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    let list = [...items];
    let added = 0;
    for (const line of lines.slice(1)) {
      const [code, name, catLabel, price, mins, st, tags] = csvLine(line);
      const category = SERVICE_CATEGORIES.find((item) => item.label.toLowerCase() === (catLabel ?? "").toLowerCase() || item.id === catLabel)?.id;
      const amount = Number((price ?? "").replace(/\D/g, ""));
      if (!name || !category || !amount) continue;
      list = [
        {
          id: `svc-${Date.now().toString(36)}-${added}`,
          name,
          code: code || nextServiceCode(list),
          category,
          short: "",
          details: "",
          image: categoryImage(category),
          price: amount,
          minutes: Number((mins ?? "").replace(/\D/g, "")) || 30,
          teeth: "",
          active: (st ?? "").toLowerCase() !== "nofaol",
          inPlans: true,
          materials: [],
          tags: (tags ?? "").split(";").map((tag) => tag.trim()).filter(Boolean),
          color: "#99e2d6",
          createdAt: new Date().toISOString(),
        },
        ...list,
      ];
      added += 1;
    }
    setItems(list);
    flash(added ? `${added} ta xizmat import qilindi` : "Faylda mos qator topilmadi (Kod, Nomi, Kategoriya, Narx...)");
  }

  return (
    <ClinicShell accent="teal">
      <div className="sv" data-testid="services-desktop">
        <header className="sv-head">
          <div>
            <h1>Xizmatlar</h1>
            <p>Klinikangizda ko‘rsatiladigan barcha tibbiy xizmatlar va narxlar</p>
          </div>
          <div className="sv-io">
            <button type="button" className="sv-ghost" aria-expanded={io} onClick={() => setIo(!io)}><Upload /> Import/Export <ChevronDown /></button>
            {io ? (
              <div role="menu">
                <button type="button" role="menuitem" onClick={() => fileRef.current?.click()}><Upload /> CSV import</button>
                <button type="button" role="menuitem" onClick={exportCsv} disabled={!items.length}><Download /> CSV export</button>
              </div>
            ) : null}
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void importCsv(file); }} />
          </div>
          <button type="button" className="sv-add" onClick={() => setModal({ open: true, edit: null })} data-testid="service-add"><Plus /> Yangi xizmat</button>
        </header>

        <div className="sv-cats">
          <button type="button" className={cat === "" ? "on" : undefined} onClick={() => { setCat(""); setPage(1); }}>
            <span className="all"><LayoutGrid /></span>
            <b>Barchasi</b>
            <small>{items.length} ta</small>
          </button>
          {SERVICE_CATEGORIES.map((item) => (
            <button key={item.id} type="button" className={cat === item.id ? "on" : undefined} onClick={() => { setCat(item.id); setPage(1); }}>
              <img src={categoryImage(item.id)} alt="" />
              <b>{item.label}</b>
              <small>{items.filter((row) => row.category === item.id).length} ta</small>
            </button>
          ))}
        </div>

        <div className="sv-tools">
          <label className="sv-search"><Search /><input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Xizmat nomi yoki kodi bo‘yicha qidirish..." /></label>
          <label className="sv-sel">
            <select value={cat} onChange={(event) => { setCat(event.target.value as ServiceCategory | ""); setPage(1); }} aria-label="Kategoriya">
              <option value="">Kategoriya: Barchasi</option>
              {SERVICE_CATEGORIES.map((item) => <option key={item.id} value={item.id}>Kategoriya: {item.label}</option>)}
            </select>
            <ChevronDown />
          </label>
          <label className="sv-sel">
            <select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }} aria-label="Status">
              <option value="">Status: Barchasi</option>
              <option value="faol">Status: Faol</option>
              <option value="nofaol">Status: Nofaol</option>
            </select>
            <ChevronDown />
          </label>
          {picked.length ? <button type="button" className="sv-del" onClick={() => remove(picked)}><Trash2 /> {picked.length} tasini o‘chirish</button> : <span className="sv-gap" />}
          <label className="sv-sel sort">
            <ArrowUpDown />
            <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="Saralash">
              <option value="az">Nomi bo‘yicha (A-Z)</option>
              <option value="za">Nomi bo‘yicha (Z-A)</option>
              <option value="cheap">Arzonroq</option>
              <option value="dear">Qimmatroq</option>
              <option value="new">Yangi qo‘shilgan</option>
            </select>
            <ChevronDown />
          </label>
        </div>

        <section className="sv-table">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Hammasini tanlash" checked={allPicked} onChange={() => setPicked(allPicked ? picked.filter((id) => !pageRows.some((row) => row.id === id)) : [...new Set([...picked, ...pageRows.map((row) => row.id)])])} /></th>
                <th>#</th>
                <th>Xizmat nomi</th>
                <th>Kategoriya</th>
                <th>Narx (so‘m)</th>
                <th>Davomiyligi</th>
                <th>Status</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    <span className="ic"><ToothIcon /></span>
                    <b>{items.length ? "Xizmat topilmadi" : "Hali xizmat qo‘shilmagan"}</b>
                    <small>{items.length ? "Filtrlarni o‘zgartiring." : "Klinikangiz xizmatlari va narxlarini qo‘shing — ular to‘lov va rejalarda ishlatiladi."}</small>
                    {items.length ? null : <button type="button" onClick={() => setModal({ open: true, edit: null })}><Plus /> Birinchi xizmatni qo‘shish</button>}
                  </td>
                </tr>
              ) : pageRows.map((item, index) => {
                const meta = categoryOf(item.category);
                return (
                  <tr key={item.id}>
                    <td><input type="checkbox" aria-label={`${item.name} tanlash`} checked={picked.includes(item.id)} onChange={() => setPicked(picked.includes(item.id) ? picked.filter((id) => id !== item.id) : [...picked, item.id])} /></td>
                    <td>{(current - 1) * PAGE + index + 1}</td>
                    <td>
                      <span className="sv-name">
                        <img src={item.image || categoryImage(item.category)} alt="" style={{ background: item.color }} />
                        <span><b>{item.name}</b><small>{item.code}</small></span>
                      </span>
                    </td>
                    <td><span className="sv-pill" style={{ color: meta.tone, background: `${meta.tone}1a` }}>{meta.label}</span></td>
                    <td className="price">{formatGroupedNumber(item.price)}</td>
                    <td><span className="sv-time"><Clock /> {item.minutes} daqiqa</span></td>
                    <td><span className={item.active ? "sv-st on" : "sv-st"}>{item.active ? "Faol" : "Nofaol"}</span></td>
                    <td>
                      <span className="sv-acts">
                        <button type="button" aria-label="Tahrirlash" onClick={() => setModal({ open: true, edit: item })}><Pencil /></button>
                        <button type="button" aria-label="Nusxa olish" onClick={() => duplicate(item)}><Copy /></button>
                        <span className="sv-more">
                          <button type="button" aria-label="Boshqa amallar" aria-expanded={menu === item.id} onClick={() => setMenu(menu === item.id ? null : item.id)}><MoreVertical /></button>
                          {menu === item.id ? (
                            <span role="menu" onMouseLeave={() => setMenu(null)}>
                              <button type="button" role="menuitem" onClick={() => { setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, active: !row.active } : row))); setMenu(null); }}>{item.active ? "Nofaol qilish" : "Faol qilish"}</button>
                              <button type="button" role="menuitem" className="danger" onClick={() => { setMenu(null); remove([item.id]); }}>O‘chirish</button>
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <footer className="sv-pager">
            <span>Jami: <b>{shown.length}</b> ta xizmat</span>
            {pages > 1 ? (
              <div>
                <button type="button" aria-label="Oldingi sahifa" disabled={current <= 1} onClick={() => setPage(current - 1)}><ChevronLeft /></button>
                {Array.from({ length: pages }, (_, index) => index + 1).slice(Math.max(0, current - 3), Math.max(0, current - 3) + 5).map((n) => (
                  <button key={n} type="button" className={n === current ? "on" : undefined} onClick={() => setPage(n)}>{n}</button>
                ))}
                <button type="button" aria-label="Keyingi sahifa" disabled={current >= pages} onClick={() => setPage(current + 1)}><ChevronRight /></button>
              </div>
            ) : null}
          </footer>
        </section>

        {note ? <p className="sv-toast" role="status">{note}</p> : null}
        {modal.open ? <ServiceModal initial={modal.edit} code={nextServiceCode(items)} onClose={() => setModal({ open: false, edit: null })} onSave={upsert} /> : null}
      </div>
    </ClinicShell>
  );
}
