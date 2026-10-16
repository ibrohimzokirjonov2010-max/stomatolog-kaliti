"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Clock, Plus, Trash2, XCircle } from "lucide-react";
import { Sheet, VisitForm, type Visit, type VisitStatus } from "@/components/clinic-dashboard";
import { cn } from "@/lib/utils";
import { CrmFrame, CrmTitle, type useClinic } from "./crm-shared";

type Clinic = ReturnType<typeof useClinic>;
type View = "kun" | "hafta" | "oy";

const START = 8;
const END = 18;
const ROW = 56;
const DAYS = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const MON_SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

/** Real visit statuses only (Keldi / Kutilyapti / Bekor). */
const TONE: Record<VisitStatus, { box: string; label: string; dot: string }> = {
  Kutilyapti: { box: "border-[#5b9dff] bg-[#eef4ff] text-[#1d4fa8]", label: "Kutilmoqda", dot: "bg-[#5b9dff]" },
  Keldi: { box: "border-[#22b07d] bg-[#e9f8f1] text-[#11724f]", label: "Yakunlangan", dot: "bg-[#22b07d]" },
  Bekor: { box: "border-[#f15b5b] bg-[#fdeeee] text-[#b42b2b]", label: "Bekor qilingan", dot: "bg-[#f15b5b]" },
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const monday = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const minutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function UchrashuvlarPage() {
  return <CrmFrame next="/klinika/uchrashuvlar">{(c) => <Uchrashuvlar c={c} />}</CrmFrame>;
}

function Uchrashuvlar({ c }: { c: Clinic }) {
  const today = c.state?.today || iso(new Date());
  const visits = useMemo(() => c.state?.visits ?? [], [c.state]);
  const [anchor, setAnchor] = useState(today);
  const [view, setView] = useState<View>("hafta");
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Visit | null>(null);

  const a = parse(anchor);
  const days = view === "kun" ? [a] : Array.from({ length: 7 }, (_, i) => addDays(monday(a), i));
  const byDay = useMemo(() => {
    const m = new Map<string, Visit[]>();
    for (const v of visits) m.set(v.date, [...(m.get(v.date) ?? []), v].sort((x, y) => x.time.localeCompare(y.time)));
    return m;
  }, [visits]);
  const todays = byDay.get(today) ?? [];
  const step = view === "kun" ? 1 : view === "hafta" ? 7 : 30;
  const rangeLabel =
    view === "kun"
      ? `${a.getDate()}-${MONTHS[a.getMonth()]} ${a.getFullYear()}`
      : view === "hafta"
        ? `${days[0].getDate()} – ${days[6].getDate()} ${MONTHS[days[6].getMonth()]} ${days[6].getFullYear()}`
        : `${MONTHS[a.getMonth()]} ${a.getFullYear()}`;

  const shift = (n: number) => {
    if (view === "oy") setAnchor(iso(new Date(a.getFullYear(), a.getMonth() + n, 1)));
    else setAnchor(iso(addDays(a, n * step)));
  };

  return (
    <div>
      <CrmTitle
        title="Uchrashuvlar"
        subtitle="Klinika jadvali va bemor qabuli"
        actions={
          <>
            <button type="button" onClick={() => setAnchor(today)} className="h-10 rounded-xl border border-[#d6e4ff] bg-white px-5 text-[13px] font-semibold text-[#0066FF]">
              Bugun
            </button>
            <button type="button" onClick={() => setAdding(true)} className="hidden h-10 items-center gap-2 rounded-xl bg-[#0066FF] px-5 text-[13px] font-semibold text-white hover:bg-[#0057d9] lg:flex">
              <Plus className="size-4" /> Yangi uchrashuv
            </button>
          </>
        }
      />
      {c.error ? <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-600">{c.error}</p> : null}

      {/* Mobile: date strip + timeline */}
      <div className="lg:hidden">
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {Array.from({ length: 14 }, (_, i) => addDays(monday(parse(today)), i)).map((d) => {
            const k = iso(d);
            const on = k === anchor;
            return (
              <button key={k} type="button" onClick={() => setAnchor(k)} className={cn("flex w-12 shrink-0 flex-col items-center rounded-xl border py-2", on ? "border-[#0066FF] bg-[#0066FF] text-white" : "border-[#e6eaf2] bg-white text-[#1f2a44]")}>
                <span className="text-[11px] opacity-80">{DAYS[(d.getDay() + 6) % 7]}</span>
                <span className="text-[16px] font-bold">{d.getDate()}</span>
                {byDay.get(k)?.length ? <span className={cn("mt-0.5 size-1.5 rounded-full", on ? "bg-white" : "bg-[#0066FF]")} /> : <span className="mt-0.5 size-1.5" />}
              </button>
            );
          })}
        </div>
        <Timeline list={byDay.get(anchor) ?? []} onOpen={setOpen} />
        <button type="button" aria-label="Yangi uchrashuv" onClick={() => setAdding(true)} className="fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-[0_8px_24px_rgba(0,102,255,0.4)]">
          <Plus className="size-6" />
        </button>
      </div>

      {/* Desktop */}
      <div className="hidden items-start gap-4 lg:flex">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button type="button" aria-label="Oldingi" onClick={() => shift(-1)} className="grid size-10 place-items-center rounded-xl border border-[#e6eaf2] bg-white"><ChevronLeft className="size-4" /></button>
            <button type="button" aria-label="Keyingi" onClick={() => shift(1)} className="grid size-10 place-items-center rounded-xl border border-[#e6eaf2] bg-white"><ChevronRight className="size-4" /></button>
            <div className="flex h-10 items-center gap-2 rounded-xl border border-[#e6eaf2] bg-white px-4 text-[13px] font-semibold text-[#0B1F4D]">
              {rangeLabel} <CalendarDays className="size-4 text-[#6b7590]" />
            </div>
            <div className="ml-2 flex rounded-xl border border-[#e6eaf2] bg-white p-1">
              {(["kun", "hafta", "oy"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)} className={cn("h-8 rounded-lg px-5 text-[12.5px] font-semibold capitalize", view === v ? "bg-[#0066FF] text-white" : "text-[#1f2a44]")}>
                  {v === "kun" ? "Kun" : v === "hafta" ? "Hafta" : "Oy"}
                </button>
              ))}
            </div>
            <div className="ml-auto flex flex-wrap gap-3 text-[11.5px] text-[#4a5470]">
              {(Object.keys(TONE) as VisitStatus[]).map((s) => (
                <span key={s} className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-full", TONE[s].dot)} />{TONE[s].label}</span>
              ))}
            </div>
          </div>

          {view === "oy" ? (
            <MonthGrid anchor={a} today={today} byDay={byDay} onPick={(k) => { setAnchor(k); setView("kun"); }} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#eceff5] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <div className="grid border-b border-[#eef1f6]" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0,1fr))` }}>
                <div className="py-2.5 text-center text-[11.5px] text-[#6b7590]">Vaqt</div>
                {days.map((d) => {
                  const k = iso(d);
                  return (
                    <div key={k} className={cn("border-l border-[#eef1f6] py-2 text-center", k === today && "bg-[#eef4ff]")}>
                      <div className={cn("text-[12.5px] font-semibold", k === today ? "text-[#0066FF]" : "text-[#0B1F4D]")}>{DAYS[(d.getDay() + 6) % 7]}</div>
                      <div className="text-[11px] text-[#8b93a7]">{d.getDate()} {MON_SHORT[d.getMonth()]}</div>
                    </div>
                  );
                })}
              </div>
              <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0,1fr))`, height: (END - START + 1) * ROW }}>
                <div>
                  {Array.from({ length: END - START + 1 }, (_, i) => (
                    <div key={i} className="pt-1 text-center text-[11.5px] text-[#4a5470]" style={{ height: ROW }}>
                      {String(START + i).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
                {days.map((d) => {
                  const k = iso(d);
                  return (
                    <div key={k} className={cn("relative border-l border-[#eef1f6]", k === today && "bg-[#f7faff]")}>
                      {Array.from({ length: END - START + 1 }, (_, i) => (
                        <div key={i} className="border-b border-dashed border-[#eef1f6]" style={{ height: ROW }} />
                      ))}
                      {(byDay.get(k) ?? []).map((v) => {
                        const top = ((minutes(v.time) - START * 60) / 60) * ROW;
                        if (top < 0 || top > (END - START) * ROW) return null;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setOpen(v)}
                            className={cn("absolute right-1 left-1 overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm", TONE[v.status].box)}
                            style={{ top: top + 2, height: ROW - 6 }}
                          >
                            <div className="opacity-80">{v.time}</div>
                            <div className="truncate font-bold">{v.name}</div>
                            <div className="truncate opacity-80">{v.procedure}</div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="sticky top-0 w-[290px] shrink-0 space-y-4 2xl:w-[320px]">
          <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#0B1F4D]">Bugungi uchrashuvlar</h2>
              <span className="text-[11.5px] text-[#6b7590]">{parse(today).getDate()} {MONTHS[parse(today).getMonth()]}</span>
            </div>
            {todays.length === 0 ? (
              <p className="py-6 text-center text-[12.5px] text-[#8b93a7]">Bugun uchrashuv yo‘q</p>
            ) : (
              <ul className="divide-y divide-[#f2f4f8]">
                {todays.map((v) => (
                  <li key={v.id}>
                    <button type="button" onClick={() => setOpen(v)} className="flex w-full items-center gap-3 py-2.5 text-left">
                      <span className="w-11 text-[13px] font-bold text-[#0B1F4D]">{v.time}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-[#0B1F4D]">{v.name}</span>
                        <span className="block truncate text-[11.5px] text-[#8b93a7]">{v.procedure}</span>
                      </span>
                      <span className={cn("rounded-md border-0 px-2 py-0.5 text-[10.5px] font-semibold", TONE[v.status].box)}>{TONE[v.status].label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            <h2 className="mb-3 text-[15px] font-bold text-[#0B1F4D]">Statistika (bugun)</h2>
            <div className="grid grid-cols-2 gap-2">
              <Stat icon={CalendarDays} tone="bg-[#eef4ff] text-[#0066FF]" n={todays.length} label="Uchrashuv" />
              <Stat icon={Clock} tone="bg-[#eef4ff] text-[#0066FF]" n={todays.filter((v) => v.status === "Kutilyapti").length} label="Kutilmoqda" />
              <Stat icon={CalendarCheck} tone="bg-[#e9f8f1] text-[#17914f]" n={todays.filter((v) => v.status === "Keldi").length} label="Yakunlangan" />
              <Stat icon={XCircle} tone="bg-[#fdeeee] text-[#d93b3b]" n={todays.filter((v) => v.status === "Bekor").length} label="Bekor qilingan" />
            </div>
          </div>
        </aside>
      </div>

      {adding ? (
        <Sheet title="Yangi uchrashuv" onClose={() => setAdding(false)}>
          <VisitForm patients={c.state?.patients ?? []} today={anchor} onSubmit={(d) => c.op("visit_save", d)} onDone={() => setAdding(false)} />
        </Sheet>
      ) : null}
      {open ? (
        <Sheet title={open.name} onClose={() => setOpen(null)}>
          <div className="space-y-3 text-[14px]">
            <p className="text-[#4a5470]">{open.date.split("-").reverse().join(".")} · {open.time} — {open.procedure}</p>
            <span className={cn("inline-block rounded-md px-2 py-0.5 text-[12px] font-semibold", TONE[open.status].box)}>{TONE[open.status].label}</span>
            <div className="flex flex-wrap gap-2 pt-2">
              {open.status === "Kutilyapti" ? (
                <>
                  <button type="button" disabled={c.busy} onClick={() => void c.op("visit_status", { status: "Keldi" }, open.id).then(() => setOpen(null))} className="h-10 rounded-xl bg-[#e9f8f1] px-4 text-[13px] font-semibold text-[#17914f]">Keldi</button>
                  <button type="button" disabled={c.busy} onClick={() => void c.op("visit_status", { status: "Bekor" }, open.id).then(() => setOpen(null))} className="h-10 rounded-xl bg-[#f1f3f7] px-4 text-[13px] font-semibold text-[#4a5470]">Bekor qilish</button>
                </>
              ) : null}
              <button type="button" disabled={c.busy} onClick={() => window.confirm("Yozuvni o‘chirasizmi?") && void c.op("visit_delete", {}, open.id).then(() => setOpen(null))} className="flex h-10 items-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold text-red-600 hover:bg-red-50">
                <Trash2 className="size-4" /> O‘chirish
              </button>
            </div>
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}

function Stat({ icon: Icon, tone, n, label }: { icon: typeof Clock; tone: string; n: number; label: string }) {
  return (
    <div className={cn("rounded-xl p-3 text-center", tone.split(" ")[0])}>
      <Icon className={cn("mx-auto size-5", tone.split(" ")[1])} />
      <div className="mt-1 text-[18px] font-extrabold text-[#0B1F4D]">{n}</div>
      <div className="text-[11px] text-[#6b7590]">{label}</div>
    </div>
  );
}

function Timeline({ list, onOpen }: { list: Visit[]; onOpen: (v: Visit) => void }) {
  if (!list.length)
    return (
      <div className="rounded-2xl border border-dashed border-[#d9e0ec] bg-white px-6 py-12 text-center">
        <CalendarDays className="mx-auto size-9 text-[#0066FF]" strokeWidth={1.5} />
        <p className="mt-2 text-[14px] font-semibold text-[#0B1F4D]">Bu kunda uchrashuv yo‘q</p>
      </div>
    );
  return (
    <ul className="space-y-2.5">
      {list.map((v) => (
        <li key={v.id} className="flex gap-3">
          <span className="w-12 pt-3 text-right text-[13px] font-bold text-[#0B1F4D]">{v.time}</span>
          <button type="button" onClick={() => onOpen(v)} className={cn("min-w-0 flex-1 rounded-2xl border-l-4 bg-white p-3 text-left shadow-[0_2px_12px_rgba(15,23,42,0.05)]", TONE[v.status].box)}>
            <div className="truncate text-[14px] font-bold">{v.name}</div>
            <div className="truncate text-[12.5px] opacity-80">{v.procedure}</div>
            <div className="mt-1 text-[11.5px] font-semibold">{TONE[v.status].label}</div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function MonthGrid({ anchor, today, byDay, onPick }: { anchor: Date; today: string; byDay: Map<string, Visit[]>; onPick: (k: string) => void }) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = monday(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eceff5] bg-white">
      <div className="grid grid-cols-7 border-b border-[#eef1f6] text-center text-[12px] font-semibold text-[#4a5470]">
        {DAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const k = iso(d);
          const n = byDay.get(k)?.length ?? 0;
          return (
            <button key={k} type="button" onClick={() => onPick(k)} className={cn("h-20 border-b border-l border-[#f2f4f8] p-2 text-left", d.getMonth() !== anchor.getMonth() && "opacity-40", k === today && "bg-[#eef4ff]")}>
              <div className="text-[12.5px] font-semibold text-[#0B1F4D]">{d.getDate()}</div>
              {n ? <div className="mt-1 inline-block rounded-md bg-[#0066FF] px-1.5 text-[11px] font-semibold text-white">{n} ta</div> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
