"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Phone, Plus, Search, Send } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useLabWork } from "@/components/lab-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { ModBanner } from "@/components/work-ui";
import { labMaterialLabel, labServiceLabel, orderStatusSteps, phoneHref, telegramHref } from "@/data/labs";
import { canDoctorCancel, canLabDecline, nextActionLabel, nextOrderStatus, orderStatusCopy, orderStepIndex, type LabOrder, type LabOrderStatus, type MyLab } from "@/lib/lab-work";
import { api, timeAgoUz } from "@/lib/work-client";
import { cn } from "@/lib/utils";

type StatusChip = "all" | "jarayonda" | "tayyor" | "yetkazildi";

function matchesChip(status: LabOrderStatus, chip: StatusChip) {
  if (chip === "all") return status !== "bekor";
  if (chip === "jarayonda") return status === "yangi" || status === "qabul_qilindi" || status === "ishlanmoqda";
  return status === chip;
}

function rank(item: LabOrder) {
  if (item.status === "bekor") return 3;
  if (item.status === "yetkazildi") return 2;
  return item.status === "tayyor" ? 1 : 0;
}

export function LabOrdersPage() {
  const { orders, incoming, setOrderStatus, ordersReady, authed } = useLabWork();
  const { ready } = useDoctorProfile();
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") === "kelgan" ? "kelgan" : "yuborgan";
  const [chip, setChip] = useState<StatusChip>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [myLab, setMyLab] = useState<MyLab | null>(null);

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    void api<{ lab: MyLab | null }>("/api/work/labs/mine").then((res) => {
      if (alive && res.ok) setMyLab(res.data.lab);
    });
    return () => {
      alive = false;
    };
  }, [authed]);

  const source = tab === "kelgan" ? incoming : orders;
  const counts = useMemo(() => {
    const active = source.filter((r) => r.status !== "bekor");
    return {
      all: active.length,
      jarayonda: active.filter((r) => matchesChip(r.status, "jarayonda")).length,
      tayyor: active.filter((r) => r.status === "tayyor").length,
      yetkazildi: active.filter((r) => r.status === "yetkazildi").length,
    };
  }, [source]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...source]
      .filter((row) => matchesChip(row.status, chip) || (chip === "all" && row.status === "bekor"))
      .filter((row) => {
        if (!q) return true;
        return [row.patientCode, row.id, row.labName, row.doctorName ?? "", labServiceLabel(row.service), labMaterialLabel(row.material), row.note ?? ""].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt));
  }, [chip, query, source]);

  async function change(id: string, status: LabOrderStatus) {
    if (busyId) return;
    setBusyId(id);
    setError("");
    const res = await setOrderStatus(id, status);
    setBusyId(null);
    if (!res.ok) setError(res.error);
  }

  const chips: { key: StatusChip; label: string; count: number; tone: string }[] = [
    { key: "all", label: "Barchasi", count: counts.all, tone: "active" },
    { key: "jarayonda", label: "Jarayonda", count: counts.jarayonda, tone: "sky" },
    { key: "tayyor", label: "Tayyor", count: counts.tayyor, tone: "green" },
    { key: "yetkazildi", label: "Yetkazildi", count: counts.yetkazildi, tone: "muted" },
  ];

  return (
    <div>
      <header className="mb-4">
        <Link href="/laboratoriya" className="mb-2 inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-[#0F766E]">
          <ChevronLeft className="size-4" />
          Laboratoriya
        </Link>
        <h1 className="text-[26px] font-bold tracking-tight text-[#0B1F4D] lg:text-[#1a1d26]">Mening lab buyurtmalarim</h1>
        <p className="mt-1 text-[13px] text-[#8b93a7] lg:text-sm">Holat real vaqtda yangilanadi. Laboratoriya telefon raqami u buyurtmani qabul qilgach ochiladi.</p>
        <div className="mt-3 inline-flex rounded-full bg-[#eef2f8] p-1" role="tablist">
          {(
            [
              ["yuborgan", `Yuborganlarim${orders.length ? ` (${orders.length})` : ""}`],
              ["kelgan", `Kelgan buyurtmalar${incoming.length ? ` (${incoming.length})` : ""}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => router.replace(id === "kelgan" ? "/laboratoriya/buyurtmalarim?tab=kelgan" : "/laboratoriya/buyurtmalarim", { scroll: false })}
              className={cn("h-10 rounded-full px-4 text-[13px] font-semibold", tab === id ? "bg-white text-[#0F766E] shadow-sm" : "text-[#6b7280]")}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === "kelgan" && myLab ? (
        <div>
          <ModBanner status={myLab.status} reason={myLab.rejectReason} />
          <p className="mb-3 -mt-2 text-[13px]"><Link href="/laboratoriya/mening" className="font-semibold text-[#0F766E]">Laboratoriya profilini tahrirlash</Link></p>
        </div>
      ) : null}

      {error ? <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      {ready && !authed ? (
        <div className="rounded-[18px] border border-[#eceff5] bg-white px-6 py-16 text-center shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <p className="text-[16px] font-semibold text-[#1a1d26]">Avval tizimga kiring</p>
          <p className="mt-1 text-sm text-[#8b93a7]">Buyurtmalaringiz akkauntingizga bog‘langan.</p>
          <Link href="/kirish?next=/laboratoriya/buyurtmalarim" className={cn(buttonVariants(), "mt-5 inline-flex h-12 min-w-[160px] !rounded-2xl text-[14px] font-semibold")}>Kirish</Link>
        </div>
      ) : !ordersReady ? (
        <p className="py-10 text-center text-sm text-[#8b93a7]">Yuklanmoqda…</p>
      ) : (
        <>
          <div className="relative mb-3 max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#8b93a7]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bemor kodi, lab yoki xizmat..."
              className="h-12 w-full rounded-2xl border-0 bg-white pr-3 pl-10 text-[15px] text-[#1a1d26] shadow-[0_4px_16px_rgba(15,23,42,0.06)] outline-none placeholder:text-[#8b93a7] focus:ring-2 focus:ring-[#0F766E]/20"
            />
          </div>
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chips.map((item) => {
              const on = chip === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setChip(item.key)}
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold",
                    on && item.tone === "active" && "bg-[#0B1F4D] text-white",
                    on && item.tone === "sky" && "bg-[#0F766E] text-white",
                    on && item.tone === "green" && "bg-emerald-600 text-white",
                    on && item.tone === "muted" && "bg-[#4b5568] text-white",
                    !on && item.tone === "active" && "bg-[#f1f3f7] text-[#1a1d26]",
                    !on && item.tone === "sky" && "bg-[#F0FDFA] text-[#0F766E]",
                    !on && item.tone === "green" && "bg-emerald-50 text-emerald-700",
                    !on && item.tone === "muted" && "bg-[#f1f3f7] text-[#4b5568]",
                  )}
                >
                  {item.label}
                  <span className={cn("inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold", on ? "bg-white/20 text-white" : "bg-white text-inherit")}>{item.count}</span>
                </button>
              );
            })}
          </div>

          {items.length === 0 ? (
            <div className="rounded-[18px] border border-[#eceff5] bg-white px-6 py-14 text-center shadow-[0_4px_14px_rgba(15,23,42,0.04)]" data-testid="lab-orders-empty">
              <p className="text-[16px] font-semibold text-[#1a1d26]">{tab === "kelgan" ? "Hali buyurtma kelmagan" : "Hali buyurtma yo‘q"}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[#8b93a7]">
                {tab === "kelgan"
                  ? myLab
                    ? "Shifokorlardan kelgan buyurtmalar shu yerda ko‘rinadi."
                    : "Laboratoriya profilingizni joylang — tasdiqlangach buyurtmalar shu yerga keladi."
                  : "Lab tanlab crown, veneer yoki protez buyurtma bering."}
              </p>
              <Link href={tab === "kelgan" && !myLab ? "/laboratoriya/mening" : "/laboratoriya"} className={cn(buttonVariants(), "mt-5 inline-flex h-12 min-w-[180px] !rounded-2xl text-[14px] font-semibold")}>
                {tab === "kelgan" && !myLab ? "Laboratoriya sifatida e’lon berish" : "Laboratoriya"}
              </Link>
            </div>
          ) : (
            <ul className="space-y-3" data-testid="lab-orders">
              {items.map((item) => (
                <OrderCard key={item.id} item={item} forLab={tab === "kelgan"} busy={busyId === item.id} onStatus={change} />
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "yuborgan" && authed ? (
        <div className="mt-5">
          <Link href="/laboratoriya" className={cn(buttonVariants(), "h-12 !rounded-2xl px-6 text-[14px] font-semibold")}>
            <Plus className="size-4" />
            Yangi buyurtma
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function OrderCard({ item, forLab, busy, onStatus }: { item: LabOrder; forLab: boolean; busy: boolean; onStatus: (id: string, status: LabOrderStatus) => void }) {
  const stepIndex = orderStepIndex(item.status);
  const badge = orderStatusCopy[item.status];
  const next = forLab ? nextOrderStatus(item.status) : null;
  return (
    <li className="rounded-[18px] border border-[#eceff5] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]" data-testid="lab-order" data-status={item.status}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-[#1a1d26]">{forLab ? `Bemor kodi: ${item.patientCode}` : item.labName}</p>
          <p className="mt-0.5 text-[13px] text-[#4b5568]">
            {labServiceLabel(item.service)} · {labMaterialLabel(item.material)} · {item.dueDays} kun
            {forLab ? "" : ` · kod ${item.patientCode}`}
          </p>
          <p className="mt-0.5 text-[12px] text-[#8b93a7]">
            {forLab && item.doctorName ? `${item.doctorName} · ` : ""}
            {timeAgoUz(item.createdAt)}
          </p>
        </div>
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", badge.className)}>{badge.label}</span>
      </div>

      {item.status !== "bekor" ? (
        <ol className="mt-3 grid grid-cols-5 gap-1">
          {orderStatusSteps.map((step, index) => {
            const on = stepIndex >= 0 && index <= stepIndex;
            return (
              <li key={step.id} className="min-w-0">
                <span className={cn("block h-1.5 rounded-full", on ? "bg-[#0F766E]" : "bg-[#e6eaf2]")} />
                <span className={cn("mt-1 block truncate text-[10.5px] font-semibold sm:text-[11.5px]", index === stepIndex ? "text-[#0F766E]" : "text-[#8b93a7]")}>{step.title}</span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {item.note ? <p className="mt-2 text-[13px] leading-relaxed text-[#4b5568]">{item.note}</p> : null}

      {forLab ? (
        <p className="mt-2 text-[12.5px] text-[#4b5568]">
          <a href={phoneHref(item.phone)} className="inline-flex items-center gap-1.5 font-semibold text-[#0F766E]"><Phone className="size-3.5" />{item.phone}</a>
        </p>
      ) : item.labPhone ? (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px]" data-testid="lab-phone">
          <a href={phoneHref(item.labPhone)} className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-3 py-1.5 font-semibold text-[#0F766E]"><Phone className="size-3.5" />{item.labPhone}</a>
          {item.labTelegram ? (
            <a href={telegramHref(item.labTelegram)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-3 py-1.5 font-semibold text-[#0F766E]"><Send className="size-3.5" />Telegram</a>
          ) : null}
        </p>
      ) : item.status === "yangi" ? (
        <p className="mt-2 text-[12px] text-[#8b93a7]">Lab raqami buyurtma qabul qilingach ochiladi.</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {next ? (
          <Button type="button" className="h-11 min-w-[130px] !rounded-2xl text-[13px] font-semibold" disabled={busy} onClick={() => onStatus(item.id, next)}>
            {nextActionLabel[item.status]}
          </Button>
        ) : null}
        {forLab && canLabDecline(item.status) ? (
          <Button type="button" variant="ghost" className="h-11 !rounded-2xl text-[13px] font-semibold text-[#8b93a7]" disabled={busy} onClick={() => onStatus(item.id, "bekor")}>
            {item.status === "yangi" ? "Rad etish" : "Bekor qilish"}
          </Button>
        ) : null}
        {!forLab && canDoctorCancel(item.status) ? (
          <Button type="button" variant="ghost" className="h-11 !rounded-2xl text-[13px] font-semibold text-[#8b93a7]" disabled={busy} onClick={() => onStatus(item.id, "bekor")}>
            Buyurtmani bekor qilish
          </Button>
        ) : null}
      </div>
    </li>
  );
}
