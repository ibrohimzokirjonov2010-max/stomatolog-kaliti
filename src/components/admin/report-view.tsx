"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Card, PageHead, Segmented, btn } from "@/components/admin/ui";

const REPORTS = [
  { kind: "summary", title: "Moliyaviy xulosa", text: "Kunlar bo‘yicha: sof daromad, komissiya, reklama, kanal auksion, obunalar, GMV, buyurtmalar." },
  { kind: "orders", title: "Buyurtmalar", text: "Barcha buyurtmalar: holat, to‘lov, escrow, summa, komissiya, xaridor va do‘kon." },
  { kind: "stores", title: "Do‘konlar", text: "Do‘konlar ro‘yxati: holat, komissiya stavkasi, sotuvlar, GMV, platforma komissiyasi." },
  { kind: "users", title: "Foydalanuvchilar", text: "Foydalanuvchilar: kirish usuli, shahar, mutaxassislik, ro‘yxatdan o‘tgan va oxirgi faollik sanasi." },
];

export function ReportView() {
  const [days, setDays] = useState<"7" | "30" | "90" | "365">("30");
  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHead
        title="Hisobot (CSV)"
        subtitle="Excel / Google Sheets’da ochiladigan CSV fayllar. Har bir yuklab olish audit jurnaliga yoziladi."
        actions={
          <Segmented
            value={days}
            onChange={setDays}
            options={[
              { id: "7", label: "7 kun" },
              { id: "30", label: "30 kun" },
              { id: "90", label: "90 kun" },
              { id: "365", label: "Yil" },
            ]}
          />
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.kind} className="flex flex-col p-5">
            <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#ecfdf3] text-[#15803d]">
              <FileSpreadsheet className="size-5" />
            </span>
            <p className="font-heading text-[16px] font-bold">{r.title}</p>
            <p className="mt-1 flex-1 text-[13px] text-slate-500">{r.text}</p>
            <a href={`/api/admin/export?kind=${r.kind}&days=${days}`} className={`${btn.outline} mt-4 self-start`}>
              <Download className="size-4" /> CSV yuklab olish
            </a>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-slate-400">Davr filtri “Moliyaviy xulosa” va “Do‘konlar” hisobotiga qo‘llanadi; buyurtmalar va foydalanuvchilar to‘liq ro‘yxat sifatida chiqadi.</p>
    </div>
  );
}
