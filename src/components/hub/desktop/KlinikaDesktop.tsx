"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus, Settings, Users, Wallet, Armchair } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { chairs as seedChairs, clinicDate, inventory, labOrders, patients as seedPatients, revenueMonths, staff, type PatientRow, type Slot } from "@/data/desktop-hub";
import "./hub.css";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

function iso(date: Date) {
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function labelOf(date: Date) {
  return `${date.getDate()}-${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function KlinikaDesktop() {
  const cartCount = useShopLineCount();
  const [date, setDate] = useState(() => new Date(`${clinicDate}T00:00:00`));
  const [chairState, setChairState] = useState(seedChairs);
  const [patients, setPatients] = useState<PatientRow[]>(seedPatients);
  const [range, setRange] = useState<"6" | "3">("6");
  const [filter, setFilter] = useState<"all" | "busy" | "free">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState<{ chair: string; time: string } | null>(null);
  const [settings, setSettings] = useState(false);
  const [clinicName, setClinicName] = useState("Smile Dental Clinic");
  const [ordered, setOrdered] = useState<string | null>(null);

  const day = iso(date);
  const isDesignDay = day === clinicDate;
  const bars = range === "6" ? revenueMonths : revenueMonths.slice(3);

  const view = useMemo(() => {
    return chairState.map((chair) => {
      const slots = isDesignDay ? chair.slots : chair.slots.map((slot) => (slot.kind === "lunch" ? slot : { time: slot.time, kind: "free" as const }));
      const busy = slots.filter((slot) => slot.kind === "visit").length;
      return { ...chair, slots, busy, total: 8 };
    });
  }, [chairState, isDesignDay]);

  function shift(delta: number) {
    setDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      return next;
    });
  }

  function book(name: string, note: string) {
    if (!bookOpen) return;
    setChairState((prev) =>
      prev.map((chair) => {
        if (chair.id !== bookOpen.chair) return chair;
        return {
          ...chair,
          slots: chair.slots.map((slot) => (slot.time === bookOpen.time ? { ...slot, kind: "visit", name, note, avatar: "/images/avatar-azizbek.png" } : slot)),
        };
      }),
    );
    if (!isDesignDay) {
      setDate(new Date(`${clinicDate}T00:00:00`));
    }
    setBookOpen(null);
  }

  return (
    <ShopShell searchPath="/mening-klinikam" cartCount={cartCount} placeholder="Stomatologga nima kerak?" showCamera={false}>
      <div className="hub-page">
        <div className="hub-clinic-h">
          <div className="hub-brand">
            <span className="logo" aria-hidden>
              <svg viewBox="0 0 24 24" className="i">
                <path
                  fill="currentColor"
                  d="M12 2.2c1.7 0 3 .9 3.5 2.3.4 1.1.2 2.1-.2 3 .9.3 1.9.2 2.8-.3 1.1-.6 2.5-.2 3.2 1 .7 1.1.5 2.5-.3 3.4-.7.8-1.2 1.9-1.2 3.1 0 2.2-.9 4.6-1.8 5.8-.5.7-1.6.8-2.2.1-.5-.6-1-1.7-1.4-1.7s-.9 1.1-1.4 1.7c-.6.7-1.7.6-2.2-.1-.9-1.2-1.8-3.6-1.8-5.8 0-1.2-.5-2.3-1.2-3.1-.8-.9-1-2.3-.3-3.4.7-1.2 2.1-1.6 3.2-1 .9.5 1.9.6 2.8.3-.4-.9-.6-1.9-.2-3C9 3.1 10.3 2.2 12 2.2z"
                />
              </svg>
            </span>
            <div>
              <h1>
                {clinicName} <BadgeCheck className="i" />
              </h1>
              <small>
                <MapPin className="i" /> Toshkent, Chilonzor
                <button type="button" className="hub-more" onClick={() => setSettings(true)}>
                  <Settings className="i" /> Sozlamalar
                </button>
              </small>
            </div>
          </div>
          <div className="hub-actions">
            <button type="button" className="hub-btn ghost" onClick={() => setPatientOpen(true)}>
              <Plus className="i" /> Bemor qo‘shish
            </button>
            <button
              type="button"
              className="hub-btn"
              onClick={() => {
                const chair = view.find((item) => item.slots.some((slot) => slot.kind === "free"));
                const slot = chair?.slots.find((item) => item.kind === "free");
                if (chair && slot) setBookOpen({ chair: chair.id, time: slot.time });
              }}
            >
              Qabulga yozish
            </button>
          </div>
        </div>

        <div className="hub-kpis">
          <article className="hub-kpi">
            <span className="ic">
              <CalendarDays className="i" />
            </span>
            <div>
              <div className="lab">Bugungi qabullar</div>
              <b>
                14 <span className="up">+27%</span>
              </b>
              <small>Jami 18 ta slotdan</small>
            </div>
          </article>
          <article className="hub-kpi">
            <span className="ic">
              <Users className="i" />
            </span>
            <div>
              <div className="lab">Yangi bemorlar</div>
              <b>
                {5 + Math.max(0, patients.length - seedPatients.length)} <span className="up">+67%</span>
              </b>
              <small>Bu hafta: {12 + Math.max(0, patients.length - seedPatients.length)} ta</small>
            </div>
          </article>
          <article className="hub-kpi">
            <span className="ic">
              <Wallet className="i" />
            </span>
            <div>
              <div className="lab">Oylik daromad</div>
              <b>
                86 400 000 so‘m <span className="up">+12%</span>
              </b>
              <small>O‘tgan oy: 77 100 000 so‘m</small>
            </div>
          </article>
          <article className="hub-kpi">
            <span className="ic">
              <Armchair className="i" />
            </span>
            <div>
              <div className="lab">Kreslo bandligi</div>
              <b>78%</b>
              <small>3 ta kreslodan</small>
            </div>
          </article>
        </div>

        <div className="hub-sched">
          <section className="hub-box">
            <h3>
              <span>
                Bugungi qabul jadvali{" "}
                <Link className="hub-more" href="/crm/uchrashuvlar">Uchrashuvlar →</Link>
              </span>
              <span className="hub-actions">
                <button type="button" onClick={() => shift(-1)} aria-label="Oldingi kun">
                  <ChevronLeft className="i" />
                </button>
                <b>{labelOf(date)}</b>
                <button type="button" onClick={() => shift(1)} aria-label="Keyingi kun">
                  <ChevronRight className="i" />
                </button>
                <div className={filterOpen ? "dk-drop on" : "dk-drop"}>
                  <button type="button" onClick={() => setFilterOpen((open) => !open)}>
                    {filter === "busy" ? "Band qabullar" : filter === "free" ? "Bo‘sh slotlar" : "Barcha qabullar"}
                  </button>
                  {filterOpen ? (
                    <div className="dk-pop">
                      {(
                        [
                          ["all", "Barcha qabullar"],
                          ["busy", "Band qabullar"],
                          ["free", "Bo‘sh slotlar"],
                        ] as const
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          className="hub-check"
                          onClick={() => {
                            setFilter(id);
                            setFilterOpen(false);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </span>
            </h3>
            {!isDesignDay ? <div className="hub-note">Bu kunda jadval bo‘sh. 24-oktabr qabullari saqlanadi — yangi qabul yozish uchun slotni bosing.</div> : null}
            <div className="hub-chairs">
              {view.map((chair) => (
                <div className="hub-chair" key={chair.id}>
                  <h4>
                    <Armchair className="i" /> {chair.name}
                    <span className={chair.busy <= 3 ? "pill gray" : "pill"}>
                      {chair.busy <= 3 ? "Bo‘sh" : "Band"} {chair.busy}/{chair.total}
                    </span>
                  </h4>
                  {chair.slots
                    .filter((slot) => {
                      if (filter === "busy") return slot.kind === "visit";
                      if (filter === "free") return slot.kind === "free";
                      return true;
                    })
                    .map((slot) => (
                      <SlotRow key={slot.time} slot={slot} onFree={() => setBookOpen({ chair: chair.id, time: slot.time })} />
                    ))}
                </div>
              ))}
            </div>
          </section>
          <div className="hub-rail">
            <section className="hub-box">
              <h3>
                <span>
                  Daromad statistikasi{" "}
                  <Link className="hub-more" href="/crm/tolovlar">To‘lovlar →</Link>
                </span>
                <div className={false ? "dk-drop on" : "dk-drop"}>
                  <button type="button" onClick={() => setRange(range === "6" ? "3" : "6")}>
                    {range === "6" ? "Oxirgi 6 oy" : "Oxirgi 3 oy"}
                  </button>
                </div>
              </h3>
              <b>86 400 000 so‘m</b>
              <div className="hub-bars">
                {bars.map((bar, index) => (
                  <div key={bar.m}>
                    <i className={index === bars.length - 1 ? "on" : ""} style={{ height: `${bar.v}%` }} />
                    <span>{bar.m}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="hub-box">
              <h3>Ombor ogohlantirishlari <Link className="hub-more" href="/crm/ombor">Omborga o‘tish →</Link></h3>
              {inventory.map((item) => (
                <button key={item.id} type="button" className="hub-alert" onClick={() => setOrdered(item.name)}>
                  <span className={item.tone === "red" ? "hub-dot" : "hub-dot amber"} />
                  <div>
                    <b>{item.name}</b>
                    <small>{item.brand}</small>
                  </div>
                  <em className={item.tone}>{item.note}</em>
                </button>
              ))}
              {ordered ? <div className="hub-note">{ordered} marketplace savatiga qo‘shish uchun katalog ochiladi.</div> : null}
              <Link className="hub-btn block" href="/marketplace" style={{ marginTop: "calc(.5 * var(--u))" }}>
                Marketplacedan buyurtma qilish →
              </Link>
            </section>
          </div>
        </div>

        <div className="hub-bot">
          <section className="hub-box">
            <h3>Bemorlar ro‘yxati <Link className="hub-more" href="/crm/bemorlar">Barcha bemorlar →</Link></h3>
            <table className="hub-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ism familiya</th>
                  <th>Telefon</th>
                  <th>Oxirgi tashrif</th>
                  <th>Keyingi tashrif</th>
                  <th>Qarzdorlik</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient, index) => (
                  <tr key={patient.id}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="nm">
                        <img src={patient.avatar} alt="" />
                        {patient.name}
                      </span>
                    </td>
                    <td>{patient.phone}</td>
                    <td>{patient.last}</td>
                    <td>{patient.next}</td>
                    <td className={patient.debt ? "debt" : ""}>{patient.debt ? som(patient.debt) : "0 so‘m"}</td>
                    <td>
                      <span className={patient.debt ? "st bad" : "st ok"}>{patient.debt ? "Qarzdor" : "Faol"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="hub-box">
            <h3>Xodimlar</h3>
            <div className="hub-staff">
              {staff.map((person) => (
                <div key={person.name}>
                  <img src={person.avatar} alt="" />
                  <b>{person.name}</b>
                  <small>{person.role}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="hub-box">
            <h3>Faol laboratoriya buyurtmalari</h3>
            <table className="hub-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bemor</th>
                  <th>FDI</th>
                  <th>Ish turi</th>
                  <th>Material</th>
                  <th>Holat</th>
                  <th>Muddat</th>
                </tr>
              </thead>
              <tbody>
                {labOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.patient}</td>
                    <td>{order.fdi}</td>
                    <td>{order.work}</td>
                    <td>{order.material}</td>
                    <td>
                      <span className={`st ${order.tone}`}>{order.status}</span>
                    </td>
                    <td>{order.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>

      {patientOpen ? (
        <div className="hub-modal" onClick={() => setPatientOpen(false)}>
          <form
            className="hub-dialog"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const row: PatientRow = {
                id: `pt-${Date.now()}`,
                name: String(data.get("name") || ""),
                phone: String(data.get("phone") || ""),
                last: "15.10.2026",
                next: "—",
                debt: 0,
                avatar: "/images/avatar-azizbek.png",
              };
              setPatients((prev) => [row, ...prev]);
              setPatientOpen(false);
            }}
          >
            <h3>Bemor qo‘shish</h3>
            <label>Ism familiya</label>
            <input name="name" required />
            <label>Telefon</label>
            <input name="phone" required placeholder="+998" />
            <div className="hub-actions">
              <button className="hub-btn" type="submit">
                Saqlash
              </button>
              <button className="hub-btn ghost" type="button" onClick={() => setPatientOpen(false)}>
                Bekor
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {bookOpen ? (
        <div className="hub-modal" onClick={() => setBookOpen(null)}>
          <form
            className="hub-dialog"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              book(String(data.get("name") || "Bemor"), String(data.get("note") || "Qabul"));
            }}
          >
            <h3>
              Qabulga yozish · {bookOpen.time}
            </h3>
            <label>Bemor</label>
            <input name="name" required />
            <label>Sabab</label>
            <input name="note" placeholder="Konsultatsiya" />
            <div className="hub-actions">
              <button className="hub-btn" type="submit">
                Yozish
              </button>
              <button className="hub-btn ghost" type="button" onClick={() => setBookOpen(null)}>
                Bekor
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {settings ? (
        <div className="hub-modal" onClick={() => setSettings(false)}>
          <form
            className="hub-dialog"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setClinicName(String(data.get("name") || clinicName));
              setSettings(false);
            }}
          >
            <h3>Sozlamalar</h3>
            <label>Klinika nomi</label>
            <input name="name" defaultValue={clinicName} />
            <div className="hub-actions">
              <button className="hub-btn" type="submit">
                Saqlash
              </button>
              <button className="hub-btn ghost" type="button" onClick={() => setSettings(false)}>
                Bekor
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </ShopShell>
  );
}

function SlotRow({ slot, onFree }: { slot: Slot; onFree: () => void }) {
  if (slot.kind === "lunch") {
    return (
      <div className="hub-slot lunch">
        <time>{slot.time}</time>
        <span>— Tushlik</span>
      </div>
    );
  }
  if (slot.kind === "free") {
    return (
      <div className="hub-slot">
        <time>{slot.time}</time>
        <button type="button" className="hub-free" onClick={onFree}>
          <Plus className="i" /> Bemor qabul qilish
        </button>
      </div>
    );
  }
  return (
    <div className="hub-slot">
      <time>{slot.time}</time>
      <div className="who">
        {slot.avatar ? <img src={slot.avatar} alt="" /> : null}
        <div>
          <b>{slot.name}</b>
          <small>{slot.note}</small>
        </div>
      </div>
    </div>
  );
}
