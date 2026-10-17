"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PhoneFrame, Sheet } from "@/components/phone14/chrome";
import { VisitFinishSheet } from "@/components/phone14/visit-finish";
import {
  countdownText,
  currentAppointment,
  dayKey,
  loadQueue,
  saveQueueItem,
  startVisit,
  type QueueAppt,
} from "@/data/phone-queue";

const WEEK = ["Yak", "Dsh", "Sesh", "Chor", "Pay", "Jum", "Shan"];
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
const FILTERS = ["Barchasi", "Keladigan", "Kutilayotgan", "Bajarildi"] as const;

function shift(date: Date, days: number) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function PhoneAppointments() {
  const router = useRouter();
  const strip = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [tab, setTab] = useState<(typeof FILTERS)[number]>("Barchasi");
  const [cal, setCal] = useState(false);
  const [cursor, setCursor] = useState<Date | null>(null);
  const [detail, setDetail] = useState<QueueAppt | null>(null);
  const [finish, setFinish] = useState<QueueAppt | null>(null);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 30_000);
    const bump = () => setRev((value) => value + 1);
    window.addEventListener("sk-queue", bump);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("sk-queue", bump);
    };
  }, []);

  const todayKey = now ? dayKey(now) : "";
  const activeKey = selected || todayKey;
  const days = useMemo(() => {
    if (!now) return [];
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Array.from({ length: 61 }, (_, index) => shift(base, index - 30));
  }, [now]);

  useEffect(() => {
    if (!todayKey) return;
    const node = strip.current?.querySelector<HTMLButtonElement>("[data-today='1']");
    node?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [todayKey]);

  const items = useMemo(() => (now ? loadQueue(now) : []), [now, rev]);
  const dayItems = items.filter((item) => item.date === activeKey && item.status !== "bekor");
  const counts = {
    Barchasi: dayItems.length,
    Keladigan: dayItems.filter((item) => item.status === "keladi").length,
    Kutilayotgan: dayItems.filter((item) => item.status === "kutil").length,
    Bajarildi: dayItems.filter((item) => item.status === "bajar").length,
  };
  const shown = dayItems.filter((item) => {
    if (tab === "Keladigan") return item.status === "keladi";
    if (tab === "Kutilayotgan") return item.status === "kutil";
    if (tab === "Bajarildi") return item.status === "bajar";
    return true;
  });
  const current = now && activeKey === todayKey ? currentAppointment(items, now) : null;

  useEffect(() => {
    if (!current) return;
    document.querySelector("[data-testid='appt-current']")?.scrollIntoView({ block: "center" });
  }, [current?.id, activeKey]);

  const activeDate = activeKey ? new Date(Number(activeKey.slice(0, 4)), Number(activeKey.slice(5, 7)) - 1, Number(activeKey.slice(8, 10))) : null;
  const monthCursor = cursor ?? activeDate;

  function patch(next: QueueAppt) {
    saveQueueItem(next);
    setRev((value) => value + 1);
    setDetail(null);
  }

  if (!now || !activeDate || !monthCursor) {
    return <PhoneFrame testId="phone-uchrashuvlar" tab="none"><p className="p14-empty">Yuklanmoqda</p></PhoneFrame>;
  }

  const monthLabel = `${MONTHS[activeDate.getMonth()]} ${activeDate.getFullYear()}`;

  return (
    <PhoneFrame testId="phone-uchrashuvlar" tab="none">
      <div className="p14-head">
        <div>
          <h1>Uchrashuvlar</h1>
          <p className="sub">Bemorlar uchrashuvlarini boshqaring</p>
        </div>
        <button type="button" className="p14-filter" onClick={() => { setCursor(activeDate); setCal(true); }}>Kalendar</button>
      </div>
      <p className="month-label">{monthLabel}</p>
      <div className="days snap" ref={strip}>
        {days.map((date) => {
          const key = dayKey(date);
          return (
            <button key={key} type="button" data-date={key} data-today={key === todayKey ? "1" : undefined} className={key === activeKey ? "on" : undefined} onClick={() => setSelected(key)}>
              <small>{WEEK[date.getDay()]}</small>
              <b>{date.getDate()}</b>
              <small>{MONTHS[date.getMonth()].slice(0, 3)}</small>
            </button>
          );
        })}
      </div>
      <div className="p14-row queue-chips">
        {FILTERS.map((item) => (
          <button key={item} type="button" className={tab === item ? "p14-chip on" : "p14-chip"} onClick={() => setTab(item)}>{item} ({counts[item]})</button>
        ))}
      </div>
      <div className="p14-head">
        <b>{activeKey === todayKey ? "Bugun" : monthLabel}, {activeDate.getDate()} {MONTHS[activeDate.getMonth()].toLowerCase()}</b>
        <span className="spec">{shown.length} ta uchrashuv</span>
      </div>
      <div className="list pad-fab">
        {shown.length === 0 ? <p className="p14-empty">Bu kunda uchrashuv yo‘q</p> : null}
        {shown.map((item, index) => {
          const live = current?.id === item.id;
          const previous = shown[index - 1];
          const lunch = tab === "Barchasi" && previous && previous.time < "13:00" && item.time >= "14:00";
          return (
            <div key={item.id}>
              {lunch ? <div className="lunch">13:00–14:00 · Tushlik tanaffusi<br />14:00 da davom etadi</div> : null}
              <article className={live ? "appt-card live" : "appt-card"} data-testid={live ? "appt-current" : `appt-${item.time}`}>
                <button type="button" className="appt-open" onClick={() => setDetail(item)}>
                  <b className="when">{item.time}</b>
                  <img src={item.avatar} alt="" />
                  <span>
                    <span className="pat-top">
                      <b>{item.name}</b>
                      <i className={`pat-status ${item.status}`}>{item.statusLabel}</i>
                      {live ? <i className="live-badge">{item.status === "davolan" || parseStartSafe(item, now) ? "Hozir" : "Navbatdagi"}</i> : null}
                    </span>
                    {live ? <small className="count-down">{countdownText(item, now)}</small> : null}
                    <p>{item.service}</p>
                    <p className="spec">{item.age} yosh | {item.gender} · {item.tooth}</p>
                  </span>
                </button>
                {live && item.status !== "davolan" && item.status !== "bajar" ? (
                  <button type="button" className="appt-go" data-testid="appt-start" onClick={() => { const next = startVisit(item, now); router.push(`/crm/bemorlar/${next.patientId}?visit=${next.id}`); }}>Boshlash</button>
                ) : null}
                {item.status === "davolan" ? (
                  <button type="button" className="appt-go" onClick={() => setFinish(item)}>Yakunlash</button>
                ) : null}
              </article>
            </div>
          );
        })}
      </div>
      <Link href="/crm/uchrashuvlar/yangi" className="p14-fab" data-testid="appt-add"><Plus size={16} /> Uchrashuv</Link>
      {detail ? (
        <Sheet title={detail.name} onClose={() => setDetail(null)}>
          <p className="spec">{detail.time}–{detail.end} · {detail.service}</p>
          <p className="spec">{detail.tooth}</p>
          <p>{detail.note}</p>
          <div className="sheet-links">
            <a href={`tel:${detail.phone}`}>Qo‘ng‘iroq</a>
            <p className="spec">Ko‘chirish</p>
            <div className="move-times">
              {["09:00", "10:30", "11:30", "12:00", "14:00", "15:30", "16:30"].map((time) => (
                <button key={time} type="button" className="p14-chip" onClick={() => patch({ ...detail, time, end: plusMinutes(time, 45) })}>{time}</button>
              ))}
            </div>
            <button type="button" onClick={() => patch({ ...detail, status: "bekor", statusLabel: "Bekor qilindi" })}>Bekor qilish</button>
          </div>
        </Sheet>
      ) : null}
      {finish ? <VisitFinishSheet appt={finish} onClose={() => setFinish(null)} /> : null}
      {cal && monthCursor ? (
        <Sheet title="Kalendar" onClose={() => setCal(false)}>
          <div className="cal-head">
            <button type="button" aria-label="Oldingi oy" onClick={() => setCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}>‹</button>
            <b>{MONTHS[monthCursor.getMonth()]} {monthCursor.getFullYear()}</b>
            <button type="button" aria-label="Keyingi oy" onClick={() => setCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="cal-grid">
            {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map((item) => <small key={item}>{item}</small>)}
            {calendarCells(monthCursor).map((cell, index) => cell ? (
              <button key={cell} type="button" className={cell === activeKey ? "on" : undefined} onClick={() => { setSelected(cell); setCal(false); }}>{Number(cell.slice(8))}</button>
            ) : <span key={`e-${index}`} />)}
          </div>
        </Sheet>
      ) : null}
    </PhoneFrame>
  );
}

function plusMinutes(time: string, minutes: number) {
  const [hh, mm] = time.split(":").map(Number);
  const total = hh * 60 + mm + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function parseStartSafe(appt: QueueAppt, now: Date) {
  const [hh, mm] = appt.time.split(":").map(Number);
  return hh * 60 + mm <= now.getHours() * 60 + now.getMinutes();
}

function calendarCells(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(dayKey(new Date(cursor.getFullYear(), cursor.getMonth(), day)));
  return cells;
}
