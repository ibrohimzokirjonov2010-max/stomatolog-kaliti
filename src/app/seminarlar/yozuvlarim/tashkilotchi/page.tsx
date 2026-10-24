"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, Phone, ScanLine } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentBadge, SeminarStatusBadge } from "@/components/seminar-status";
import { MySeminars } from "@/components/organizer/my-seminars";
import { OrganizerGate, type OrgApplication } from "@/components/organizer/organizer-gate";
import { getSeminar } from "@/data/seminars";
import type { SeminarRow } from "@/lib/seminar-remote";
import { cn } from "@/lib/utils";
import { fromServer, type SeminarRegistration, type ServerRegistration } from "@/lib/seminar-registrations";
import { seminarDate } from "@/data/seminars";

type Item = { seminarId: string; title: string; regs: ServerRegistration[] };
type Data = { auth: boolean; admin: boolean; items: Item[] };
type CheckResult =
  | { kind: "ok" | "already" | "cancelled"; reg: SeminarRegistration; title: string }
  | { kind: "notfound" }
  | { kind: "error"; message: string };

function whenOf(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("ru-RU")} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
}

function Inner() {
  const params = useSearchParams();
  const wanted = params.get("seminar");
  const [data, setData] = useState<Data | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [me, setMe] = useState<{ canCreate: boolean; application: OrgApplication | null } | null>(null);
  const [mine, setMine] = useState<SeminarRow[]>([]);
  const saved = params.get("saved");

  const load = useCallback(async () => {
    try {
      const [res, meRes, mineRes] = await Promise.all([
        fetch("/api/seminars/organizer", { cache: "no-store", credentials: "same-origin" }),
        fetch("/api/seminars/organizer-application", { cache: "no-store", credentials: "same-origin" }),
        fetch("/api/seminars/mine", { cache: "no-store", credentials: "same-origin" }),
      ]);
      const j = (await res.json()) as Data & { ok?: boolean };
      const m = (await meRes.json().catch(() => ({}))) as { canCreate?: boolean; application?: OrgApplication | null };
      const my = (await mineRes.json().catch(() => ({}))) as { seminars?: SeminarRow[] };
      setMe({ canCreate: Boolean(m.canCreate), application: m.application ?? null });
      setMine(my.seminars ?? []);
      setData({ auth: Boolean(j.auth), admin: Boolean(j.admin), items: j.items ?? [] });
    } catch {
      setData({ auth: true, admin: false, items: [] });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const items = useMemo(() => {
    const all = data?.items ?? [];
    return wanted ? [...all].sort((a, b) => (a.seminarId === wanted ? -1 : b.seminarId === wanted ? 1 : 0)) : all;
  }, [data, wanted]);

  async function runCheck(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setCheck(null);
    try {
      const res = await fetch("/api/seminars/checkin", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: string; reg?: ServerRegistration & { seminarTitle?: string }; error?: string };
      if (!res.ok || !j.ok) setCheck({ kind: "error", message: j.error ?? "Tekshirib bo‘lmadi." });
      else if (j.result === "ok" || j.result === "already" || j.result === "cancelled") {
        setCheck({ kind: j.result, reg: fromServer(j.reg!), title: j.reg?.seminarTitle ?? "" });
        if (j.result === "ok") {
          setCode("");
          void load();
        }
      } else setCheck({ kind: "notfound" });
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(reg: ServerRegistration) {
    await fetch(`/api/seminars/registrations/${reg.id}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "paid", seminarId: reg.seminarId }),
    });
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-4">
        <p className="text-[13px]">
          <Link href="/seminarlar/yozuvlarim" className="inline-flex items-center gap-1 text-[#0F766E] hover:underline">
            <ChevronLeft className="size-4" />
            Mening yozuvlarim
          </Link>
        </p>
        <h1 className="mt-2 text-[24px] font-bold tracking-tight text-[#1a1d26]">Tashkilotchi kabineti</h1>
        <p className="mt-1 text-sm text-[#8b93a7]">Seminar yaratish, yozilgan doktorlar va chipta tekshiruvi.</p>
      </header>

      {saved ? (
        <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] font-medium text-emerald-900" data-testid="saved-banner">
          {saved === "pending" ? "Seminar tasdiqqa yuborildi. Administrator ko‘rib chiqqach e’lon qilinadi." : saved === "published" ? "Seminar e’lon qilindi." : "O‘zgarishlar saqlandi."}
        </p>
      ) : null}

      {data && !data.auth ? (
        <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-14 text-center">
          <p className="text-[16px] font-semibold text-[#1a1d26]">Tizimga kiring</p>
          <Link href="/kirish?next=/seminarlar/yozuvlarim/tashkilotchi" className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}>
            Kirish
          </Link>
        </div>
      ) : data ? (
        <>
          {me?.canCreate ? <MySeminars seminars={mine} onChanged={() => void load()} /> : me ? <div className="mb-5"><OrganizerGate application={me.application} onDone={() => void load()} /></div> : null}
          {items.length > 0 ? <section className="mb-5 rounded-[16px] border border-[#F0FDFA] bg-[#f5f8ff] p-4">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#111827]">
              <ScanLine className="size-5 text-[#0F766E]" />
              Chiptani tekshirish
            </h2>
            <form onSubmit={runCheck} className="mt-3 flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SK-XXXXXXXXXX"
                aria-label="Chipta kodi"
                className="h-11 flex-1 bg-white font-mono tracking-wider"
                autoCapitalize="characters"
                autoComplete="off"
              />
              <Button type="submit" disabled={busy || !code.trim()} className="h-11 !rounded-xl px-4">
                {busy ? "…" : "Kirdi"}
              </Button>
            </form>
            {check ? (
              <div
                role="status"
                className={cn(
                  "mt-3 rounded-xl px-3.5 py-3 text-[13px]",
                  check.kind === "ok" ? "bg-emerald-50 text-emerald-900" : check.kind === "already" ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-800",
                )}
              >
                {check.kind === "ok" ? (
                  <>
                    <b>Kirdi deb belgilandi:</b> {check.reg.name} · +998 {check.reg.phone}
                    {check.reg.paymentStatus === "awaiting" ? <span className="mt-1 block font-semibold">Diqqat: to‘lov hali qayd etilmagan.</span> : null}
                  </>
                ) : check.kind === "already" ? (
                  <>
                    <b>Bu chipta oldin ishlatilgan:</b> {check.reg.name} ({check.reg.attendedAt ? whenOf(check.reg.attendedAt) : ""})
                  </>
                ) : check.kind === "cancelled" ? (
                  <>
                    <b>Chipta bekor qilingan:</b> {check.reg.name}
                  </>
                ) : check.kind === "notfound" ? (
                  "Chipta topilmadi yoki bu seminar sizga tegishli emas."
                ) : (
                  check.kind === "error" && check.message
                )}
              </div>
            ) : null}
          </section> : null}

          <div className="space-y-5">
            {items.map((item) => {
              const regs = item.regs;
              const active = regs.filter((r) => r.status !== "cancelled");
              const sem = getSeminar(item.seminarId);
              const date = sem ? seminarDate(sem) : null;
              return (
                <section key={item.seminarId} className="rounded-[16px] border border-[#eceff5] bg-white p-4">
                  <h2 className="text-[15px] font-bold text-[#1a1d26]">{item.title}</h2>
                  {date && sem ? (
                    <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[#8b93a7]">
                      <CalendarDays className="size-3.5" />
                      {date.when}, {sem.time}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[12.5px] text-[#4b5568]">
                    Yozilgan: <b>{active.length}</b> · To‘langan: <b>{active.filter((r) => r.paymentStatus === "paid").length}</b> · Kirgan:{" "}
                    <b>{active.filter((r) => r.status === "attended").length}</b>
                  </p>
                  {regs.length === 0 ? (
                    <p className="mt-3 text-sm text-[#8b93a7]">Hali yozilish yo‘q.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-[#f1f3f8]">
                      {regs.map((r) => {
                        const reg = fromServer(r);
                        return (
                          <li key={r.id} className="py-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[14px] font-semibold text-[#1a1d26]">{r.name}</p>
                                <a href={`tel:+998${r.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-[#0F766E]">
                                  <Phone className="size-3.5" />+998 {r.phone}
                                </a>
                                {r.clinic ? <p className="text-[12px] text-[#8b93a7]">{r.clinic}</p> : null}
                                <p className="text-[12px] text-[#8b93a7]">Yozilgan: {whenOf(r.createdAt)}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                <SeminarStatusBadge status={reg.status} />
                                <PaymentBadge reg={reg} />
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]">
                              <span className="font-mono font-semibold text-[#4b5568]">{r.ticketCode}</span>
                              {r.paymentStatus === "awaiting" && r.status !== "cancelled" ? (
                                <button type="button" onClick={() => void markPaid(r)} className="font-semibold text-[#0F766E] hover:underline">
                                  To‘lov qabul qilindi deb belgilash
                                </button>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </>
      ) : (
        <div className="h-40 animate-pulse rounded-[16px] bg-[#f1f3f8]" />
      )}
    </div>
  );
}

export default function OrganizerPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
