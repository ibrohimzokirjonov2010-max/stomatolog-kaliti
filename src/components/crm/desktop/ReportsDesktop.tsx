"use client";

import { ClinicShell } from "@/components/shell/ClinicShell";
import { downloadText } from "@/lib/simple-pdf";
import "./reports-faithful.css";

export function ReportsDesktop() {
  function exportCsv() {
    downloadText("hisobotlar.csv", "Ko'rsatkich,Qiymat\nDaromad,0\nBemorlar,0\nQabullar,0\n", "text/csv");
  }
  function exportPdf() {
    downloadText("hisobotlar.pdf", "Hisobotlar\nHozircha ma'lumot yo'q.\n", "application/pdf");
  }

  return (
    <ClinicShell accent="teal">
      <div className="rpx" data-testid="reports-desktop">
        <header className="rpx-head">
          <div>
            <h1>Hisobotlar</h1>
            <p>Klinikangiz faoliyati bo‘yicha statistika</p>
          </div>
          <div className="rpx-actions">
            <button type="button" data-testid="reports-export" onClick={exportCsv}>Excel export</button>
            <button type="button" data-testid="reports-pdf" onClick={exportPdf}>PDF export</button>
          </div>
        </header>
        <section className="rpx-kpis">
          <article><small>Umumiy daromad</small><b data-testid="report-revenue">0 so‘m</b></article>
          <article><small>Yangi bemorlar</small><b>0</b></article>
          <article><small>Qabullar soni</small><b>0</b></article>
          <article><small>O‘rtacha chek</small><b>0 so‘m</b></article>
        </section>
        <p className="rpx-key" data-testid="reports-empty">Hozircha hisobot yo‘q. Raqamlar real qabul va to‘lovlardan keyin chiqadi.</p>
      </div>
    </ClinicShell>
  );
}
