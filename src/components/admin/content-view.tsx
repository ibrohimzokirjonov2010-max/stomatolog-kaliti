"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, EyeOff, Eye, Flag, MessageSquareText, Trash2, X } from "lucide-react";
import { Avatar, Card, Chips, Empty, ErrorBox, Loading, PageHead, Pill, adminPost, btn, fmtInt, hashTone, timeAgo, useAdminData, useToast } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  body: string;
  kind: string;
  createdAt: string;
  hidden: boolean;
  images: number;
  author: { id: string; fullName: string; blocked: boolean };
  likes: number;
  comments: number;
  reports: number;
  reasons: string[] | null;
};
type Data = { counts: { reported: number; all: number; hidden: number }; rows: Row[] };
type Filter = "reported" | "all" | "hidden";

export function ContentView() {
  const [filter, setFilter] = useState<Filter>("reported");
  const { data, error, loading, reload } = useAdminData<Data>(`/api/admin/content?filter=${filter}`);
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  async function act(id: string, action: "hide" | "unhide" | "delete" | "dismiss") {
    setBusy(id + action);
    const res = await adminPost(`/api/admin/content/${id}`, { action });
    setBusy(null);
    setConfirmDel(null);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show({ hide: "Post yashirildi", unhide: "Post qayta ko‘rsatildi", delete: "Post o‘chirildi", dismiss: "Shikoyat rad etildi" }[action]);
    await reload();
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHead title="Kontent moderatsiyasi" subtitle="Hamjamiyat postlari va foydalanuvchi shikoyatlari" />
      <div className="mb-4">
        <Chips
          value={filter}
          onChange={setFilter}
          options={[
            { id: "reported", label: "Shikoyat qilingan", count: data?.counts.reported },
            { id: "all", label: "Barcha postlar", count: data?.counts.all },
            { id: "hidden", label: "Yashirilgan", count: data?.counts.hidden },
          ]}
        />
      </div>
      {error ? (
        <ErrorBox text={error} onRetry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : !data || data.rows.length === 0 ? (
        <Card>
          <Empty
            icon={<MessageSquareText className="size-5" />}
            title={filter === "reported" ? "Ochiq shikoyatlar yo‘q" : filter === "hidden" ? "Yashirilgan postlar yo‘q" : "Postlar yo‘q"}
            hint={filter === "reported" ? "Foydalanuvchilar post menyusidagi “Shikoyat qilish” orqali xabar berganda shu yerda ko‘rinadi." : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {data.rows.map((r) => (
            <Card key={r.id} className={cn("p-4", r.hidden && "opacity-80")}>
              <div className="flex items-start gap-3">
                <Avatar name={r.author.fullName} tone={hashTone(r.author.id)} className="size-9" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
                    <span className="font-semibold">{r.author.fullName}</span>
                    {r.author.blocked ? <Pill tone="red">Bloklangan</Pill> : null}
                    <span className="text-slate-400">· {timeAgo(r.createdAt)}</span>
                    {r.hidden ? <Pill tone="gray">Yashirilgan</Pill> : null}
                    {r.reports > 0 ? (
                      <Pill tone="red">
                        <Flag className="size-3" /> {r.reports} shikoyat
                      </Pill>
                    ) : null}
                  </div>
                  <p className="mt-1.5 whitespace-pre-line break-words text-[13.5px] text-slate-700">{r.body || <i className="text-slate-400">(matnsiz)</i>}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
                    <span>♥ {fmtInt(r.likes)}</span>
                    <span>💬 {fmtInt(r.comments)}</span>
                    {r.images ? <span>🖼 {r.images} rasm</span> : null}
                    {(r.reasons ?? []).map((x) => (
                      <Pill key={x} tone="orange">
                        {x}
                      </Pill>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-[#f1f5f9] pt-3">
                {!r.hidden ? (
                  <a href={`/community/${r.id}`} target="_blank" rel="noreferrer" className={btn.outline}>
                    <ExternalLink className="size-4" /> Ko‘rish
                  </a>
                ) : null}
                {r.reports > 0 ? (
                  <button type="button" className={btn.outline} disabled={busy !== null} onClick={() => act(r.id, "dismiss")}>
                    <X className="size-4" /> Rad etish
                  </button>
                ) : null}
                {r.hidden ? (
                  <button type="button" className={btn.outline} disabled={busy !== null} onClick={() => act(r.id, "unhide")}>
                    <Eye className="size-4" /> Qayta ko‘rsatish
                  </button>
                ) : (
                  <button type="button" className={btn.danger} disabled={busy !== null} onClick={() => act(r.id, "hide")}>
                    <EyeOff className="size-4" /> Yashirish
                  </button>
                )}
                {confirmDel === r.id ? (
                  <button type="button" className={btn.dangerSolid} disabled={busy !== null} onClick={() => act(r.id, "delete")}>
                    <Trash2 className="size-4" /> Butunlay o‘chirilsinmi?
                  </button>
                ) : (
                  <button type="button" className={btn.outline} onClick={() => setConfirmDel(r.id)}>
                    <Trash2 className="size-4" /> O‘chirish
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {toast.node}
    </div>
  );
}
