"use client";

import { History } from "lucide-react";
import { Card, Empty, ErrorBox, Loading, PageHead, fmtDate, useAdminData } from "@/components/admin/ui";

type Row = { id: number; action: string; targetType: string; targetId: string; details: Record<string, unknown>; createdAt: string; actor: string | null };

const LABELS: Record<string, string> = {
  "user.block": "Foydalanuvchini blokladi",
  "user.unblock": "Blokdan chiqardi",
  "user.role": "Rol o‘zgartirdi",
  "owner.promote": "Owner huquqi berildi (env)",
  "admin.owner_promote": "Owner huquqi berildi (env)",
  "admin.owner_bootstrap": "Owner huquqi berildi (env)",
  "store.suspend": "Do‘konni to‘xtatdi",
  "store.activate": "Do‘konni faollashtirdi",
  "store.commission": "Komissiyani o‘zgartirdi",
  "application.approve": "Arizani tasdiqladi",
  "application.reject": "Arizani rad etdi",
  "order.release": "Escrowni sotuvchiga o‘tkazdi",
  "order.refund": "Pulni xaridorga qaytardi",
  "payout.paid": "Pul yechishni bajarildi deb belgiladi",
  "payout.rejected": "Pul yechish so‘rovini rad etdi",
  "platform.store_claimed": "Platforma do‘konini o‘z zimmasiga oldi",
  "ad.create": "Reklama yaratdi",
  "ad.update": "Reklamani tahrirladi",
  "ad.delete": "Reklamani o‘chirdi",
  "post.hide": "Postni yashirdi",
  "post.unhide": "Postni qayta ko‘rsatdi",
  "post.delete": "Postni o‘chirdi",
  "post.dismiss": "Shikoyatni rad etdi",
  "channel.hide_channel": "Kanalni yashirdi",
  "channel.show_channel": "Kanalni ko‘rsatdi",
  "channel.cancel_bid": "Stavkani bekor qildi",
  "export.csv": "CSV hisobot yuklab oldi",
};

function detailText(d: Record<string, unknown>) {
  if (!d || typeof d !== "object") return "";
  return Object.entries(d)
    .filter(([, v]) => v !== null && v !== "" && typeof v !== "object")
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

export function AuditView() {
  const { data, error, loading, reload } = useAdminData<Row[]>("/api/admin/audit");
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHead title="Audit jurnali" subtitle="Admin panelda bajarilgan barcha o‘zgartirishlar (oxirgi 300 ta)" />
      <Card className="overflow-hidden">
        {error ? (
          <ErrorBox text={error} onRetry={reload} />
        ) : loading && !data ? (
          <Loading />
        ) : !data || data.length === 0 ? (
          <Empty icon={<History className="size-5" />} title="Hali hech qanday amal bajarilmagan" />
        ) : (
          <ul className="divide-y divide-[#f1f5f9]">
            {data.map((r) => (
              <li key={r.id} className="flex flex-col gap-0.5 px-4 py-3 text-[13px] sm:flex-row sm:items-center sm:gap-4">
                <span className="w-36 shrink-0 text-[12px] text-slate-400">{fmtDate(r.createdAt, true)}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{r.actor ?? "—"}</span> <span className="text-slate-600">{LABELS[r.action] ?? r.action}</span>
                  <span className="text-slate-400">
                    {" "}
                    · {r.targetType} {r.targetId ? `#${String(r.targetId).slice(0, 12)}` : ""}
                  </span>
                  {detailText(r.details) ? <span className="block truncate text-[12px] text-slate-400">{detailText(r.details)}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
