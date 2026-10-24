"use client";

import { useState } from "react";
import { Card, Empty, ErrorBox, Loading, PageHead, Pill, adminPost, btn, fmtInt, moneyShort, useAdminData, useToast } from "@/components/admin/ui";

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
  storeName: string;
  storeStatus: string;
};

export function ProductsView() {
  const { data, error, loading, reload } = useAdminData<ProductRow[]>("/api/admin/products");
  const toast = useToast();
  const [busy, setBusy] = useState("");
  const rows = data ?? [];

  async function setActive(row: ProductRow, action: "approve" | "hide") {
    setBusy(row.id);
    const res = await adminPost("/api/admin/products", { id: row.id, action });
    setBusy("");
    if (!res.ok) {
      toast.show(res.error ?? "Bajarib bo‘lmadi");
      return;
    }
    toast.show(action === "approve" ? "Mahsulot ko‘rsatildi" : "Mahsulot yashirildi");
    reload();
  }

  return (
    <div className="space-y-4">
      <PageHead title="Mahsulotlar" subtitle="Katalogdagi mahsulotlarni ko‘rsatish yoki yashirish. Hisoblar o‘chirilmaydi." />
      {error ? <ErrorBox text={error} /> : null}
      {loading && !data ? <Loading /> : null}
      {!loading && data && rows.length === 0 ? <Empty title="Mahsulot yo‘q" hint="Sotuvchi mahsulot qo‘shsa, shu yerda chiqadi." /> : null}
      {rows.length ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="text-[12px] text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Mahsulot</th>
                <th className="px-3 py-2.5">Do‘kon</th>
                <th className="px-3 py-2.5 text-right">Narx</th>
                <th className="px-3 py-2.5 text-right">Qoldiq</th>
                <th className="px-3 py-2.5">Holat</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2.5">
                    <b className="block text-[#111827]">{row.name}</b>
                    <span className="text-[12px] text-slate-400">{row.brand} · {row.category}</span>
                  </td>
                  <td className="px-3 py-2.5">{row.storeName}</td>
                  <td className="px-3 py-2.5 text-right">{moneyShort(row.price)}</td>
                  <td className="px-3 py-2.5 text-right">{fmtInt(row.stock)}</td>
                  <td className="px-3 py-2.5">
                    <Pill tone={row.active ? "green" : "gray"}>{row.active ? "Ko‘rinadi" : "Yashirin"}</Pill>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {row.active ? (
                      <button type="button" className={btn.outline} disabled={busy === row.id} onClick={() => void setActive(row, "hide")}>Yashirish</button>
                    ) : (
                      <button type="button" className={btn.primary} disabled={busy === row.id} onClick={() => void setActive(row, "approve")}>Ko‘rsatish</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </div>
  );
}
