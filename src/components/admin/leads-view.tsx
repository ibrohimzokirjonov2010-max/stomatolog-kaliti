"use client";

import { UserRound } from "lucide-react";
import { Card, Empty, ErrorBox, Loading, PageHead, Pill, fmtDate, useAdminData } from "@/components/admin/ui";

type LeadRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  method: "phone" | "google" | string;
  utm: Record<string, string> | null;
  createdAt: string;
};

type Payload = { rows: LeadRow[] };

function methodLabel(method: string) {
  if (method === "google") return "Google";
  if (method === "phone") return "Telefon";
  return method || "—";
}

export function LeadsView() {
  const { data, error, loading, reload } = useAdminData<Payload>("/api/admin/leads");
  const rows = data?.rows ?? [];

  return (
    <div>
      <PageHead title="Lidlar" subtitle="Ro‘yxatdan o‘tganlar. Bir foydalanuvchi — bitta yozuv." />
      {error ? (
        <ErrorBox text={error} onRetry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Card>
          <Empty title="Hali lid yo‘q" hint="Telefon yoki Google orqali ro‘yxatdan o‘tganlar shu yerda ko‘rinadi." icon={<UserRound className="size-5" />} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Ism</th>
                  <th className="px-3 py-2.5">Telefon</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Rol</th>
                  <th className="px-3 py-2.5">Usul</th>
                  <th className="px-3 py-2.5">Manba</th>
                  <th className="px-4 py-2.5">Vaqt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const source = row.utm?.utm_source || row.utm?.referrer || "";
                  const campaign = row.utm?.utm_campaign || "";
                  return (
                    <tr key={row.id} className="border-t border-[#f1f5f9]">
                      <td className="px-4 py-2.5 font-semibold text-[#0f172a]">{row.name || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{row.phone || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{row.email || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{row.role || "—"}</td>
                      <td className="px-3 py-2.5">
                        <Pill tone={row.method === "google" ? "blue" : "green"}>{methodLabel(row.method)}</Pill>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        <div>{source || "—"}</div>
                        {campaign ? <div className="text-[11.5px] text-slate-400">{campaign}</div> : null}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{fmtDate(row.createdAt, true)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
