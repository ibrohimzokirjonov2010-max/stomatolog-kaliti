"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Camera, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Phone, Trash2, Wallet, X } from "lucide-react";
import { Sheet } from "@/components/phone14/chrome";
import { ToothChart, ToothLegend } from "@/components/phone14/teeth";
import { VisitFinishSheet } from "@/components/phone14/visit-finish";
import { formatGroupedNumber } from "@/lib/format";
import {
  deleteXray,
  loadClinic,
  saveTooth,
  saveXray,
  toothLabel,
  TOOTH_OPTIONS,
  type ClinicXray,
  type ToothStatus,
} from "@/data/phone-records";
import { relDateLabel } from "@/data/phone14";
import { elapsedLabel, findQueueItem, type QueueAppt } from "@/data/phone-queue";

const TABS = ["Umumiy", "Tish kartasi", "Rejalar", "Tashriflar", "To‘lovlar", "Rentgen"] as const;

function money(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

export function PhonePatientProfile({ id }: { id: string }) {
  const [ready, setReady] = useState(false);
  const [rev, setRev] = useState(0);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Umumiy");
  const [dent, setDent] = useState<"katta" | "bola">("katta");
  const [tooth, setTooth] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [openVisit, setOpenVisit] = useState<string | null>(null);
  const [viewer, setViewer] = useState<ClinicXray | null>(null);
  const [scale, setScale] = useState(1);
  const [xrayError, setXrayError] = useState("");
  const [clock, setClock] = useState<Date | null>(null);
  const [visitId, setVisitId] = useState("");
  const [finish, setFinish] = useState<QueueAppt | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pinch = useRef({ dist: 0, scale: 1 });

  useEffect(() => { setReady(true); }, [id, rev]);
  useEffect(() => {
    setVisitId(new URLSearchParams(window.location.search).get("visit") || "");
  }, [id]);
  useEffect(() => {
    const tick = () => setClock(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const clinic = useMemo(() => (ready ? loadClinic(id) : null), [id, ready, rev]);

  if (!ready) {
    return <div className="p14 crm prof lg:hidden" data-testid="phone-bemor-profili"><p className="p14-empty">Yuklanmoqda</p></div>;
  }
  if (!clinic) {
    return (
      <div className="p14 crm prof lg:hidden" data-testid="phone-bemor-profili">
        <header className="crm-bar">
          <Link href="/crm/bemorlar" aria-label="Orqaga"><ChevronLeft /></Link>
          <h1>Bemor profili</h1>
          <span />
        </header>
        <p className="p14-empty">Bemor topilmadi</p>
        <Link href="/crm/bemorlar" className="crm-save">Bemorlar ro‘yxati</Link>
      </div>
    );
  }

  const { patient, visits, plans, payments, teeth, xrays } = clinic;
  const paid = payments.reduce((sum, item) => sum + item.amount, 0);
  const planTotal = plans.reduce((sum, item) => sum + item.total, 0);
  const unpaidDebt = visits.filter((item) => item.unpaid).reduce((sum, item) => sum + item.cost, 0);
  const total = planTotal + unpaidDebt;
  const debt = Math.max(0, planTotal - paid) + unpaidDebt;
  const live = visitId && clock ? findQueueItem(visitId, clock) : null;
  const showBanner = Boolean(live && live.status === "davolan" && live.patientId === patient.id);
  const mode = dent === "katta" ? "adult" : "child";
  const chart = mode === "adult" ? teeth.adult : teeth.child;
  const selected = tooth ? chart[tooth] : undefined;
  const toothVisits = tooth ? visits.filter((item) => item.tooth === tooth) : [];
  const toothPlans = tooth ? plans.flatMap((plan) => plan.services.filter((service) => service.tooth === tooth).map((service) => ({ ...service, plan: plan.name }))) : [];
  const allergy = patient.conditions?.includes("Allergiya") || patient.id === "b-0012";

  function setStatus(status: ToothStatus) {
    if (!tooth) return;
    saveTooth(patient.id, mode, tooth, status);
    setRev((value) => value + 1);
  }

  function onXray(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setXrayError("Faqat rasm fayli");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || "");
      if (src.length > 1_500_000) {
        setXrayError("Rasm juda katta. 1 MB dan kichikroq rasm tanlang.");
        return;
      }
      setXrayError("");
      try {
        saveXray({
          id: `xr-${Date.now()}`,
          patientId: patient.id,
          date: relDateLabel(0),
          type: "Periapikal",
          tooth: "—",
          src,
        });
        setRev((value) => value + 1);
      } catch {
        setXrayError("Rasmni saqlab bo‘lmadi");
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className={showBanner ? "p14 crm prof has-visit lg:hidden" : "p14 crm prof lg:hidden"} data-testid="phone-bemor-profili">
      <header className="crm-bar">
        <Link href="/crm/bemorlar" aria-label="Orqaga"><ChevronLeft /></Link>
        <h1>Bemor profili</h1>
        <button type="button" aria-label="Menyu" onClick={() => setMenu(true)}><MoreHorizontal /></button>
      </header>
      {showBanner && live && clock ? (
        <div className="visit-banner" data-testid="visit-banner">
          <b>Qabul davom etmoqda · {elapsedLabel(live.startedAt || clock.toISOString(), clock)}</b>
          <button type="button" data-testid="visit-finish" onClick={() => setFinish(live)}>Yakunlash</button>
        </div>
      ) : null}
      <div className="prof-hero">
        <span className="ava"><img src={patient.avatar} alt="" /></span>
        <div>
          <b>{patient.name}</b>
          <p className="spec"><Phone size={14} /> {patient.phone}</p>
          <p className="spec">ID: #{patient.num}</p>
          <p className="spec">{patient.age} yosh · {patient.gender}</p>
        </div>
        <span className={`pat-status ${patient.status}`}>{patient.statusLabel}</span>
      </div>
      <div className="act-row">
        <a href={`tel:${patient.phone.replace(/\s/g, "")}`}><Phone />Qo‘ng‘iroq</a>
        <Link href={`/crm/uchrashuvlar/yangi?patient=${patient.id}`}><CalendarPlus />Qabul</Link>
        <Link href={`/crm/tolovlar/yangi?patient=${patient.id}`}><Wallet />To‘lov</Link>
        <Link href={`/crm/bemorlar/yangi?edit=${patient.id}`}><Pencil />Tahrirlash</Link>
      </div>
      {allergy ? (
        <button type="button" className="allergy" onClick={() => setTab("Umumiy")}>
          <span className="bang">!</span>
          <span><b>Allergiya</b><small>{patient.id === "b-0012" ? "Penitsillin allergiyasi. Gipertoniya (dori qabul qiladi)" : "Allergiya belgilangan"}</small></span>
          <ChevronRight size={16} />
        </button>
      ) : null}
      <div className="prof-tabs" role="tablist" aria-label="Bemor bo‘limlari">
        {TABS.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={tab === item} data-testid={`profile-tab-${item}`} className={tab === item ? "on" : undefined} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      {tab === "Umumiy" ? (
        <>
          <div className="mini-cards">
            <article>
              <small>Balans</small>
              <b>{money(debt)}</b>
              <p className="spec">Umumiy: {money(total)}</p>
              <p className="spec">Qarz: {money(debt)}</p>
            </article>
            <article>
              <small>To‘lov holati</small>
              <b className={debt > 0 ? "debt-word" : undefined}>{debt > 0 ? "Qarzdor" : "To‘langan"}</b>
              <p className="spec">To‘langan: {money(paid)}</p>
            </article>
          </div>
          <div className="p14-head"><b>So‘nggi tashriflar</b><button type="button" onClick={() => setTab("Tashriflar")}>Barchasini ko‘rish</button></div>
          <div className="timeline">
            {visits.slice(0, 3).map((item) => (
              <article key={item.id} className="visit">
                <span className="rail" />
                <span><small className="spec">{item.date}, {item.time}</small><b>{item.procedure}</b><p>{item.notes}</p></span>
                <small>{item.doctor}</small>
              </article>
            ))}
            {visits.length === 0 ? <p className="p14-empty">Tashriflar yo‘q</p> : null}
          </div>
        </>
      ) : null}

      {tab === "Tish kartasi" ? (
        <section className="p14-card">
          <div className="p14-head"><b>Tish holati (FDI)</b>
            <span className="seg two">
              <button type="button" className={dent === "katta" ? "on" : undefined} onClick={() => { setDent("katta"); setTooth(null); }}>Katta</button>
              <button type="button" className={dent === "bola" ? "on" : undefined} onClick={() => { setDent("bola"); setTooth(null); }}>Bola</button>
            </span>
          </div>
          <ToothChart mode={dent} kinds={chart} selected={tooth ? [tooth] : []} onToggle={(next) => setTooth(next)} />
          <ToothLegend />
        </section>
      ) : null}

      {tab === "Rejalar" ? (
        <div className="list">
          <Link href={`/crm/davolash-rejalari/yangi?patient=${patient.id}`} className="crm-save">Yangi reja</Link>
          {plans.length === 0 ? <p className="p14-empty">Davolash rejalari yo‘q</p> : plans.map((plan) => (
            <article key={plan.id} className="p14-card plan-card">
              <div className="p14-head"><b>{plan.name}</b><span className="pat-status davolanishda">{plan.status}</span></div>
              <p className="spec">{plan.doctor} · {plan.date}</p>
              <p className="plan-progress">{plan.done}/{plan.stages} bosqich</p>
              <p className="spec">Umumiy {money(plan.total)} · To‘langan {money(plan.paid)} · Qoldiq {money(Math.max(0, plan.total - plan.paid))}</p>
              <ul>
                {plan.services.map((service) => (
                  <li key={`${plan.id}-${service.name}-${service.tooth}`}><span>{service.name}</span><b>#{service.tooth}</b></li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "Tashriflar" ? (
        <div className="list">
          {visits.length === 0 ? <p className="p14-empty">Tashriflar yo‘q</p> : visits.map((item) => (
            <button key={item.id} type="button" className="p14-card visit-card" aria-expanded={openVisit === item.id} onClick={() => setOpenVisit(openVisit === item.id ? null : item.id)}>
              <span className="visit-copy">
                <b>{item.procedure}</b>
                <span>{item.date} · {item.time} · {item.doctor}</span>
                <span>Tish {item.tooth} · {money(item.cost)}</span>
                {openVisit === item.id ? <span className="visit-more">{item.notes}</span> : null}
              </span>
              <span className={`pat-status ${item.unpaid ? "bekor" : "yangi"}`}>{item.status}</span>
            </button>
          ))}
        </div>
      ) : null}

      {tab === "To‘lovlar" ? (
        <div className="list">
          <div className="mini-cards">
            <article><small>Umumiy</small><b>{money(total)}</b></article>
            <article><small>To‘langan</small><b>{money(paid)}</b></article>
            <article><small>Qarz</small><b>{money(debt)}</b></article>
          </div>
          <Link href={`/crm/tolovlar/yangi?patient=${patient.id}`} className="crm-save">To‘lov qo‘shish</Link>
          {payments.length === 0 ? <p className="p14-empty">To‘lovlar yo‘q</p> : payments.map((item) => (
            <article key={item.id} className="p14-card">
              <div className="p14-head"><b>{money(item.amount)}</b><span className="pat-status yangi">{item.method}</span></div>
              <p className="spec">{item.date} · {item.plan}</p>
              <p className="spec">Chek {item.receipt}</p>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "Rentgen" ? (
        <div className="list">
          <button type="button" className="crm-save" onClick={() => fileRef.current?.click()}><Camera size={16} /> Rentgen yuklash</button>
          <input ref={fileRef} data-testid="xray-input" hidden type="file" accept="image/*" capture="environment" onChange={(event) => onXray(event.target.files?.[0])} />
          {xrayError ? <p className="crm-err">{xrayError}</p> : null}
          {xrays.length === 0 ? <p className="p14-empty">Rentgen suratlar hali yuklanmagan</p> : (
            <div className="xray-grid">
              {xrays.map((item) => (
                <button key={item.id} type="button" className="xray-card" onClick={() => { setViewer(item); setScale(1); }}>
                  <img src={item.src} alt="" />
                  <b>{item.type}</b>
                  <small>{item.date} · {item.tooth === "—" ? "umumiy" : `tish ${item.tooth}`}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tooth ? (
        <Sheet title={`Tish ${tooth}`} onClose={() => setTooth(null)}>
          <p className="spec">Hozirgi holat: {toothLabel(selected)}</p>
          <b>Tarix</b>
          {toothVisits.length === 0 ? <p className="spec">Bu tish bo‘yicha tashrif yo‘q</p> : toothVisits.map((item) => (
            <p key={item.id} className="spec">{item.date} · {item.procedure} · {item.doctor}</p>
          ))}
          <b>Rejadagi davolash</b>
          {toothPlans.length === 0 ? <p className="spec">Reja yo‘q</p> : toothPlans.map((item) => (
            <p key={`${item.plan}-${item.name}`} className="spec">{item.plan}: {item.name}</p>
          ))}
          <b>Holatni o‘zgartirish</b>
          <div className="tooth-status">
            {TOOTH_OPTIONS.map((item) => (
              <button key={item.id} type="button" className={selected === item.id || (!selected && item.id === "sog") ? "on" : undefined} onClick={() => setStatus(item.id)}>{item.label}</button>
            ))}
          </div>
        </Sheet>
      ) : null}

      {menu ? (
        <Sheet title="Amallar" onClose={() => setMenu(false)}>
          <div className="sheet-links">
            <Link href={`/crm/bemorlar/yangi?edit=${patient.id}`}>Tahrirlash</Link>
            <a href={`tel:${patient.phone.replace(/\s/g, "")}`}>Qo‘ng‘iroq</a>
            <Link href={`/crm/uchrashuvlar/yangi?patient=${patient.id}`}>Qabul</Link>
            <Link href={`/crm/tolovlar/yangi?patient=${patient.id}`}>To‘lov</Link>
          </div>
        </Sheet>
      ) : null}

      {finish ? <VisitFinishSheet appt={finish} onClose={() => setFinish(null)} /> : null}
      {viewer ? (
        <div className="xray-view" role="dialog" aria-label="Rentgen">
          <header className="xray-bar">
            <div>
              <b>{viewer.type}</b>
              <p>{viewer.date} · {viewer.tooth === "—" ? "umumiy" : `tish ${viewer.tooth}`}</p>
            </div>
            <span className="xray-tools">
              <button type="button" aria-label="Kichraytirish" onClick={() => setScale((value) => Math.max(1, Number((value - 0.25).toFixed(2))))}>−</button>
              <button type="button" aria-label="Kattalashtirish" onClick={() => setScale((value) => Math.min(4, Number((value + 0.25).toFixed(2))))}>+</button>
              <button type="button" aria-label="Yopish" onClick={() => setViewer(null)}><X /></button>
            </span>
          </header>
          <div
            className="xray-stage"
            onWheel={(event) => { event.preventDefault(); setScale((value) => Math.min(4, Math.max(1, value + (event.deltaY < 0 ? 0.2 : -0.2)))); }}
            onTouchStart={(event) => {
              if (event.touches.length === 2) {
                const dx = event.touches[0].clientX - event.touches[1].clientX;
                const dy = event.touches[0].clientY - event.touches[1].clientY;
                pinch.current = { dist: Math.hypot(dx, dy), scale };
              }
            }}
            onTouchMove={(event) => {
              if (event.touches.length !== 2 || !pinch.current.dist) return;
              const dx = event.touches[0].clientX - event.touches[1].clientX;
              const dy = event.touches[0].clientY - event.touches[1].clientY;
              const next = pinch.current.scale * (Math.hypot(dx, dy) / pinch.current.dist);
              setScale(Math.min(4, Math.max(1, next)));
            }}
          >
            <img src={viewer.src} alt={`${viewer.type}, ${viewer.date}`} style={{ transform: `scale(${scale})` }} />
          </div>
          <button type="button" className="crm-save danger" onClick={() => { deleteXray(viewer.id); setViewer(null); setRev((value) => value + 1); }}><Trash2 size={16} /> O‘chirish</button>
        </div>
      ) : null}
    </div>
  );
}
