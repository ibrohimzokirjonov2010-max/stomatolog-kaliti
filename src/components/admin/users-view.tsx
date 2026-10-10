"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Ban, Search, ShieldCheck, Store, UserCheck, Users } from "lucide-react";
import {
  Avatar,
  Card,
  Drawer,
  Empty,
  ErrorBox,
  Loading,
  PAYMENT_LABEL,
  PageHead,
  Pill,
  adminPost,
  btn,
  fmtDate,
  fmtInt,
  hashTone,
  moneyShort,
  timeAgo,
  useAdminData,
  useToast,
} from "@/components/admin/ui";
import { ROLE_LABEL, useAdminMe } from "@/components/admin/shell";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  provider: "phone" | "google" | "telegram";
  specialty?: string | null;
  city?: string | null;
  clinic?: string | null;
  avatarUrl?: string | null;
  isAdmin: boolean;
  adminRole?: keyof typeof ROLE_LABEL | null;
  blocked: boolean;
  isSeller: boolean;
  createdAt: string;
  lastSeenAt?: string | null;
};

type ListData = {
  total: number;
  active30: number;
  today: number;
  counts: { doctors: number; sellers: number; admins: number; blocked: number };
  cities: string[];
  matching: number;
  rows: Row[];
};

type Detail = {
  profile: Row & { telegramUsername?: string | null; bio?: string | null; blockedAt?: string | null; blockedReason?: string | null };
  posts: number;
  orders: number;
  spent: number;
  store: { id: string; name: string; status: string; slug: string } | null;
  recentOrders: { id: string; shopName: string; total: number; createdAt: string; paymentState: string; items: number }[];
};

const PROVIDER: Record<Row["provider"], string> = { phone: "Telefon", google: "Google", telegram: "Telegram" };
const FILTERS = [
  { id: "all", label: "Barchasi" },
  { id: "seller", label: "Sotuvchilar" },
  { id: "admin", label: "Adminlar" },
  { id: "blocked", label: "Bloklangan" },
  { id: "phone", label: "Telefon" },
  { id: "google", label: "Google" },
  { id: "telegram", label: "Telegram" },
];
const PAGE = 50;

export function fmtPhone(p?: string | null) {
  const d = (p ?? "").replace(/\D/g, "");
  if (d.length !== 9) return p ?? "";
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

function RolePill({ r }: { r: Row }) {
  if (r.blocked) return <Pill tone="red">Bloklangan</Pill>;
  if (r.isAdmin) return <Pill tone="violet">{ROLE_LABEL[r.adminRole ?? "admin"]}</Pill>;
  if (r.isSeller) return <Pill tone="orange">Sotuvchi</Pill>;
  return <Pill tone="gray">Shifokor</Pill>;
}

export function UsersView() {
  const me = useAdminMe();
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(() => sp.get("q") ?? "");
  const [debounced, setDebounced] = useState(() => (sp.get("q") ?? "").trim());
  const [filter, setFilter] = useState("all");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced((prev) => {
        if (prev !== q.trim()) setPage(0);
        return q.trim();
      });
    }, 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const url = `/api/admin/users?q=${encodeURIComponent(debounced)}&filter=${filter}&city=${encodeURIComponent(city)}&limit=${PAGE}&offset=${page * PAGE}`;
  const { data, error, loading, reload } = useAdminData<ListData>(url);

  const stats = data
    ? [
        { label: "Shifokorlar", value: data.counts.doctors, icon: Users, tone: "bg-[#e8f1ff] text-primary" },
        { label: "Sotuvchilar", value: data.counts.sellers, icon: Store, tone: "bg-[#fff7ed] text-[#c2410c]" },
        { label: "Adminlar", value: data.counts.admins, icon: ShieldCheck, tone: "bg-[#f3efff] text-[#6d28d9]" },
        { label: "Bloklangan", value: data.counts.blocked, icon: Ban, tone: "bg-[#fef2f2] text-[#b91c1c]" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHead
        title="Foydalanuvchilar"
        subtitle={data ? `Jami ${fmtInt(data.total)} · 30 kunda faol ${fmtInt(data.active30)} · bugun +${fmtInt(data.today)}` : "Yuklanmoqda…"}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className={cn("flex size-10 items-center justify-center rounded-xl", s.tone)}>
              <s.icon className="size-5" />
            </span>
            <span>
              <span className="block text-[12px] text-slate-500">{s.label}</span>
              <span className="font-heading text-[20px] font-bold">{fmtInt(s.value)}</span>
            </span>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#eef2f7] p-3">
          <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] lg:max-w-[340px]">
            <Search className="size-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism, telefon, email yoki klinika…" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
            className="h-9 rounded-xl border border-[#e2e8f0] bg-white px-2.5 text-[13px]"
            aria-label="Filtr"
          >
            {FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(0);
            }}
            className="h-9 rounded-xl border border-[#e2e8f0] bg-white px-2.5 text-[13px]"
            aria-label="Shahar"
          >
            <option value="">Barcha shaharlar</option>
            {(data?.cities ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <ErrorBox text={error} onRetry={reload} />
        ) : loading && !data ? (
          <Loading />
        ) : !data || data.rows.length === 0 ? (
          <Empty title="Foydalanuvchi topilmadi" hint="Qidiruv yoki filtrni o‘zgartirib ko‘ring." icon={<Users className="size-5" />} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Foydalanuvchi</th>
                    <th className="px-3 py-2.5">Mutaxassislik</th>
                    <th className="px-3 py-2.5">Shahar</th>
                    <th className="px-3 py-2.5">Rol</th>
                    <th className="px-3 py-2.5">Kirish</th>
                    <th className="px-3 py-2.5">Ro‘yxatdan</th>
                    <th className="px-4 py-2.5">Oxirgi faollik</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id} onClick={() => setOpenId(r.id)} className={cn("cursor-pointer border-t border-[#f1f5f9] hover:bg-[#f8fbff]", openId === r.id && "bg-[#eef4ff]")}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.fullName} src={r.avatarUrl} tone={hashTone(r.id)} className="size-8" />
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-[#0f172a]">{r.fullName}</div>
                            <div className="truncate text-[11.5px] text-slate-400">{r.phone ? fmtPhone(r.phone) : r.email ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{r.specialty || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.city || "—"}</td>
                      <td className="px-3 py-2.5">
                        <RolePill r={r} />
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{PROVIDER[r.provider]}</td>
                      <td className="px-3 py-2.5 text-slate-600">{fmtDate(r.createdAt)}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.lastSeenAt ? timeAgo(r.lastSeenAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-[#f1f5f9] md:hidden">
              {data.rows.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setOpenId(r.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <Avatar name={r.fullName} src={r.avatarUrl} tone={hashTone(r.id)} className="size-9" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold">{r.fullName}</span>
                      <span className="block truncate text-[12px] text-slate-400">
                        {[r.specialty, r.city, PROVIDER[r.provider]].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <RolePill r={r} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-[#eef2f7] px-4 py-2.5 text-[12.5px] text-slate-500">
              <span>
                {fmtInt(page * PAGE + 1)}–{fmtInt(page * PAGE + data.rows.length)} / {fmtInt(data.matching)}
              </span>
              <span className="flex gap-2">
                <button type="button" className={btn.outline} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Oldingi
                </button>
                <button type="button" className={btn.outline} disabled={(page + 1) * PAGE >= data.matching} onClick={() => setPage((p) => p + 1)}>
                  Keyingi
                </button>
              </span>
            </div>
          </>
        )}
      </Card>

      <UserDrawer
        key={openId ?? "none"}
        id={openId}
        meId={me?.id}
        isOwner={me?.adminRole === "owner"}
        canBlock={me?.adminRole === "owner" || me?.adminRole === "admin" || me?.adminRole === "moderator"}
        onClose={() => setOpenId(null)}
        onChanged={() => {
          void reload();
          router.refresh();
        }}
      />
    </div>
  );
}

function UserDrawer({
  id,
  meId,
  isOwner,
  canBlock,
  onClose,
  onChanged,
}: {
  id: string | null;
  meId?: string;
  isOwner: boolean;
  canBlock: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { data, error, loading, reload } = useAdminData<Detail>(id ? `/api/admin/users/${id}` : null);
  const toast = useToast();
  const [roleChoice, setRole] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [busy, setBusy] = useState(false);
  const p = data?.profile;
  const currentRole = useMemo(() => (p?.isAdmin ? p.adminRole ?? "admin" : ""), [p]);
  const role = roleChoice ?? currentRole;

  const isSelf = p?.id === meId;
  const isTargetOwner = p?.adminRole === "owner" && p?.isAdmin;

  async function act(body: Record<string, unknown>, ok: string) {
    if (!id) return;
    setBusy(true);
    const res = await adminPost(`/api/admin/users/${id}`, body);
    setBusy(false);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show(ok);
    setConfirmBlock(false);
    setRole(null);
    await reload();
    onChanged();
  }

  return (
    <>
      <Drawer
        open={Boolean(id)}
        onClose={onClose}
        title="Foydalanuvchi ma’lumotlari"
        footer={
          p && !isSelf && !isTargetOwner ? (
            <div className="space-y-2">
              {confirmBlock ? (
                <div className="space-y-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3">
                  <p className="text-[12.5px] font-semibold text-[#b91c1c]">Bloklash sababi (foydalanuvchiga ko‘rinmaydi)</p>
                  <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Masalan: spam, soxta akkaunt…" className="h-9 w-full rounded-lg border border-[#fecaca] bg-white px-2.5 text-[13px] outline-none" />
                  <div className="flex gap-2">
                    <button type="button" className={btn.outline} onClick={() => setConfirmBlock(false)}>
                      Bekor qilish
                    </button>
                    <button type="button" className={cn(btn.dangerSolid, "flex-1")} disabled={busy} onClick={() => act({ action: "block", reason }, "Foydalanuvchi bloklandi")}>
                      Bloklashni tasdiqlash
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {canBlock ? (
                    p.blocked ? (
                      <button type="button" className={cn(btn.outline, "flex-1")} disabled={busy} onClick={() => act({ action: "unblock" }, "Blok olib tashlandi")}>
                        <UserCheck className="size-4" /> Blokdan chiqarish
                      </button>
                    ) : (
                      <button type="button" className={cn(btn.danger, "flex-1")} onClick={() => setConfirmBlock(true)}>
                        <Ban className="size-4" /> Bloklash
                      </button>
                    )
                  ) : null}
                  {isOwner ? (
                    <button type="button" className={cn(btn.primary, "flex-1")} disabled={busy || role === currentRole} onClick={() => act({ action: "role", role }, "Rol saqlandi")}>
                      <ShieldCheck className="size-4" /> Rolni saqlash
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ) : null
        }
      >
        {error ? (
          <ErrorBox text={error} onRetry={reload} />
        ) : loading || !data || !p ? (
          <Loading />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={p.fullName} src={p.avatarUrl} tone={hashTone(p.id)} className="size-14 text-[16px]" />
              <div className="min-w-0">
                <p className="truncate font-heading text-[18px] font-bold">{p.fullName}</p>
                <p className="text-[12.5px] text-slate-500">
                  {p.specialty || "Mutaxassislik ko‘rsatilmagan"} · ID {p.id.slice(0, 8)}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <RolePill r={{ ...p, isSeller: data.store?.status === "active" }} />
                  <Pill tone="blue">{PROVIDER[p.provider]}</Pill>
                </div>
              </div>
            </div>
            {p.blocked ? (
              <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3 text-[12.5px] text-[#b91c1c]">
                Bloklangan: {fmtDate(p.blockedAt, true)}
                {p.blockedReason ? ` · ${p.blockedReason}` : ""}
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Postlar", fmtInt(data.posts)],
                ["Buyurtmalar", fmtInt(data.orders)],
                ["Sarflagan", moneyShort(data.spent)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-[#f8fafc] p-3">
                  <div className="text-[11.5px] text-slate-400">{l}</div>
                  <div className="font-heading text-[16px] font-bold">{v}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-[#eceff5] p-4 text-[13px]">
              {[
                ["Telefon", p.phone ? fmtPhone(p.phone) : "—"],
                ["Email", p.email || "—"],
                ["Klinika", p.clinic || "—"],
                ["Shahar", p.city || "—"],
                ["Qo‘shilgan sana", fmtDate(p.createdAt)],
                ["Oxirgi faollik", p.lastSeenAt ? fmtDate(p.lastSeenAt, true) : "—"],
                ["Telegram", p.telegramUsername ? `@${p.telegramUsername}` : "—"],
                ["Do‘kon", data.store ? `${data.store.name} (${data.store.status})` : "—"],
              ].map(([l, v]) => (
                <div key={l} className="min-w-0">
                  <div className="text-[11.5px] text-slate-400">{l}</div>
                  <div className="truncate font-semibold text-[#0f172a]">{v}</div>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold">Oxirgi buyurtmalar</p>
              {data.recentOrders.length === 0 ? (
                <p className="text-[12.5px] text-slate-400">Buyurtmalar yo‘q.</p>
              ) : (
                <ul className="divide-y divide-[#f1f5f9]">
                  {data.recentOrders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between py-2 text-[13px]">
                      <span>
                        <span className="font-semibold">
                          #{o.id} · {o.shopName}
                        </span>
                        <span className="block text-[11.5px] text-slate-400">
                          {fmtDate(o.createdAt)} · {o.items} mahsulot
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-semibold">{moneyShort(o.total)}</span>
                        <Pill tone={PAYMENT_LABEL[o.paymentState]?.tone ?? "gray"}>{PAYMENT_LABEL[o.paymentState]?.label ?? o.paymentState}</Pill>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {isOwner && !isSelf && !isTargetOwner ? (
              <div className="rounded-2xl border border-[#eceff5] p-3">
                <p className="mb-2 text-[13px] font-semibold">Rol berish</p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {[
                    ["", "Oddiy"],
                    ["moderator", "Moderator"],
                    ["finance", "Moliya"],
                    ["admin", "Admin"],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRole(v)}
                      className={cn(
                        "h-9 rounded-xl border text-[12.5px] font-semibold",
                        role === v ? "border-primary bg-[#eef4ff] text-primary" : "border-[#e2e8f0] text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11.5px] text-slate-400">Moderator — kontent, arizalar, bloklash · Moliya — escrow, komissiya, reklama · Admin — hammasi (rol berishdan tashqari).</p>
              </div>
            ) : null}
          </div>
        )}
      </Drawer>
      {toast.node}
    </>
  );
}
