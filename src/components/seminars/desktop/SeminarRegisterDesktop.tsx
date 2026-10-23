"use client";
/* eslint-disable @next/next/no-img-element -- seminar photos are fixed-size cards */

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUser,
  Clock,
  CreditCard,
  Crown,
  FileText,
  Info,
  MapPin,
  Tag,
  Ticket,
  User,
  Users,
  Video,
} from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { CITIES, PAYMENTS, SPECIALTIES, YEARS, useSeminarRegister, type RegSeminarState } from "@/components/seminars/use-seminar-register";
import { formatMoney } from "@/lib/format";
import "./seminar-register-desktop.css";

type Seminar = NonNullable<RegSeminarState["seminar"]>;

/** Desktop seminar registration — designs/add-forms-1020/semirga yolzish oyansi 1etpai + semiarga yozih 2etpai. */
export function SeminarRegisterDesktop({ id }: { id: string }) {
  const reg = useSeminarRegister(id, "click");
  const { seminar, step, ticket } = reg;

  return (
    <ClinicShell accent="teal">
      <div className="srd" data-testid="seminar-register-desktop" data-step={ticket ? "success" : step}>
        <header className="srd-head">
          {step === 2 && !ticket ? (
            <button type="button" className="srd-back" aria-label="Orqaga" onClick={reg.back}>
              <ArrowLeft />
            </button>
          ) : (
            <Link href={seminar ? `/seminarlar/${seminar.id}` : "/seminarlar"} className="srd-back" aria-label="Orqaga">
              <ArrowLeft />
            </Link>
          )}
          <div>
            <h1>
              STOMA<span>HUB</span>
            </h1>
            <p>Seminarga ro‘yxatdan o‘tish</p>
          </div>
        </header>

        {!seminar ? (
          <div className="srd-card srd-miss">
            <p>Seminar topilmadi</p>
            <Link href="/seminarlar">Seminarlar ro‘yxati</Link>
          </div>
        ) : ticket ? (
          <Success reg={reg} seminar={seminar} />
        ) : (
          <>
            <Steps step={step} />
            <div className="srd-grid">
              <div className="srd-main">
                <SeminarCard seminar={seminar} />
                {step === 1 ? <Details reg={reg} /> : <Payment reg={reg} />}
              </div>
              <aside className="srd-side">{step === 1 ? <SideOne reg={reg} /> : <SideTwo reg={reg} />}</aside>
            </div>
          </>
        )}
      </div>
    </ClinicShell>
  );
}

function Steps({ step }: { step: 1 | 2 }) {
  return (
    <ol className="srd-steps" aria-label="Bosqichlar">
      <li className={step === 1 ? "on" : "done"}>
        <b>{step === 1 ? "1" : <Check />}</b>
        Ma’lumotlar
      </li>
      <li className={step === 2 ? "line full" : "line"} aria-hidden />
      <li className={step === 2 ? "on" : undefined}>
        <b>2</b>
        To‘lov
      </li>
    </ol>
  );
}

function SeminarCard({ seminar }: { seminar: Seminar }) {
  const [topic, ...formats] = seminar.tags;
  return (
    <article className="srd-card srd-sem">
      <img src={seminar.image} alt="" />
      <div className="srd-sem-body">
        <div className="srd-tags">
          {topic ? <span className="topic">{topic.label}</span> : null}
          <span className="srd-tags-end">
            {formats.map((tag) => (
              <span key={tag.label} className={tag.tone}>
                {tag.label}
              </span>
            ))}
          </span>
        </div>
        <h2>{seminar.title}</h2>
        <div className="srd-sem-row">
          <ul>
            <li>
              <CircleUser /> {seminar.speaker}
            </li>
            <li>
              <CalendarDays /> {seminar.when}
            </li>
            <li>
              <MapPin /> {seminar.place}
            </li>
          </ul>
          <div className="srd-price">
            <b>{formatMoney(seminar.price, "UZS")}</b>
            <span>Boshlang‘ich narx</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="srd-field">
      <span>
        {label}
        {hint ? <em> {hint}</em> : null}
      </span>
      {children}
    </label>
  );
}

function Select({ value, options, label, onChange, testId }: { value: string; options: string[]; label: string; onChange: (value: string) => void; testId: string }) {
  return (
    <div className="srd-select">
      <select data-testid={testId} aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <ChevronDown />
    </div>
  );
}

function Choice({ on, icon, title, text, cost, testId, onClick }: { on: boolean; icon: ReactNode; title: string; text: string; cost?: string; testId: string; onClick: () => void }) {
  return (
    <button type="button" className={on ? "srd-choice on" : "srd-choice"} data-testid={testId} aria-pressed={on} onClick={onClick}>
      <i className="ic">{icon}</i>
      <span className="txt">
        <b>{title}</b>
        <small>{text}</small>
        {cost ? <strong>{cost}</strong> : null}
      </span>
      <span className="dot">{on ? <Check /> : null}</span>
    </button>
  );
}

function Details({ reg }: { reg: RegSeminarState }) {
  const { fields: f, set, prices } = reg;
  return (
    <section className="srd-card srd-form">
      <h3>
        <User /> Shaxsiy ma’lumotlar
      </h3>
      <div className="srd-fields">
        <Field label="F.I.SH">
          <input data-testid="srd-name" value={f.name} placeholder="Masalan: Ibrohim Zokirjonov" autoComplete="name" onChange={(event) => set.setName(event.target.value)} />
        </Field>
        <Field label="Telefon raqami">
          <div className="srd-phone">
            <span className="flag" aria-hidden>
              <i />
              <ChevronDown />
            </span>
            <span className="code">+998</span>
            <input data-testid="srd-phone" inputMode="tel" autoComplete="tel-national" value={f.phone} placeholder="90 123 45 67" onChange={(event) => set.setPhone(event.target.value)} />
          </div>
        </Field>
        <Field label="Email manzil">
          <input data-testid="srd-email" inputMode="email" autoComplete="email" value={f.email} placeholder="example@mail.com" onChange={(event) => set.setEmail(event.target.value)} />
        </Field>
        <Field label="Shahar">
          <Select testId="srd-city" label="Shahar" value={f.city} options={CITIES} onChange={set.setCity} />
        </Field>
        <Field label="Klinika nomi">
          <input data-testid="srd-clinic" value={f.clinic} placeholder="Masalan: Dent Smile Clinic" onChange={(event) => set.setClinic(event.target.value)} />
        </Field>
        <Field label="Mutaxassisligi">
          <Select testId="srd-spec" label="Mutaxassisligi" value={f.specialty} options={SPECIALTIES} onChange={set.setSpecialty} />
        </Field>
        <Field label="Ish tajribasi (yil)">
          <Select testId="srd-exp" label="Ish tajribasi" value={f.experience} options={YEARS} onChange={set.setExperience} />
        </Field>
        <Field label="Diplom/guvohnoma raqami" hint="(ixtiyoriy)">
          <input data-testid="srd-diploma" value={f.diploma} placeholder="Masalan: № 123456" onChange={(event) => set.setDiploma(event.target.value)} />
        </Field>
      </div>

      <h3 className="sep">
        <Users /> Ishtirok turi
      </h3>
      <div className="srd-choices">
        <Choice testId="srd-oflayn" on={reg.attendance === "oflayn"} icon={<Building2 />} title="Oflayn" text="Joyida ishtirok etish" onClick={() => reg.setAttendance("oflayn")} />
        <Choice testId="srd-onlayn" on={reg.attendance === "onlayn"} icon={<Video />} title="Onlayn" text="Onlayn qatnashish" onClick={() => reg.setAttendance("onlayn")} />
      </div>

      <h3 className="sep">
        <Ticket /> Chipta turi
      </h3>
      <div className="srd-choices">
        <Choice testId="srd-standart" on={reg.tier === "standart"} icon={<Tag />} title="Standart" text="Seminarga kirish, materiallar, kofe-breyk" cost={formatMoney(prices.standart, "UZS")} onClick={() => reg.setTier("standart")} />
        <Choice testId="srd-vip" on={reg.tier === "vip"} icon={<Crown />} title="VIP" text="Seminarga kirish, premium o‘rin, maxsus materiallar, sertifikat, tushlik" cost={formatMoney(prices.vip, "UZS")} onClick={() => reg.setTier("vip")} />
      </div>
    </section>
  );
}

function PayMark({ id, mark, color }: { id: string; mark: string; color: string }) {
  if (id === "card") {
    return (
      <i className="ic soft">
        <CreditCard />
      </i>
    );
  }
  if (id === "installment") {
    return (
      <i className="ic soft">
        <Clock />
      </i>
    );
  }
  return (
    <i className="ic mark" style={{ background: color }}>
      {mark}
      {id === "click" ? "!" : null}
    </i>
  );
}

function Payment({ reg }: { reg: RegSeminarState }) {
  return (
    <section className="srd-card srd-form">
      <h3>
        <CreditCard /> To‘lov usulini tanlang
      </h3>
      <div className="srd-choices srd-pays">
        {PAYMENTS.map((item) => (
          <button key={item.id} type="button" className={reg.payment === item.id ? "srd-choice on" : "srd-choice"} data-testid={`srd-pay-${item.id}`} aria-pressed={reg.payment === item.id} onClick={() => reg.setPayment(item.id)}>
            <PayMark id={item.id} mark={item.mark} color={item.color} />
            <span className="txt">
              <b>{item.name}</b>
              <small>{item.text}</small>
              {item.id === "card" ? (
                <span className="srd-logos" aria-hidden>
                  <span className="uz">UZCARD</span>
                  <span className="hu">HUMO</span>
                  <span className="vi">VISA</span>
                </span>
              ) : null}
            </span>
            <span className="dot">{reg.payment === item.id ? <Check /> : null}</span>
          </button>
        ))}
      </div>

      <h3 className="sep">
        <Tag /> Promokod
      </h3>
      <div className="srd-promo">
        <input data-testid="srd-promo" aria-label="Promokod" value={reg.promo} placeholder="Promokod kiriting" onChange={(event) => reg.setPromo(event.target.value)} />
        <button type="button" data-testid="srd-apply" onClick={reg.applyPromo}>
          Qo‘llash
        </button>
      </div>
    </section>
  );
}

function ErrorLine({ reg }: { reg: RegSeminarState }) {
  return reg.error ? (
    <p className="srd-error" role="alert" data-testid="srd-error">
      {reg.error}
    </p>
  ) : null;
}

function Toggle({ on, title, sub, text, testId, onClick }: { on: boolean; title: string; sub?: string; text: string; testId: string; onClick: () => void }) {
  return (
    <button type="button" className={on ? "srd-check on" : "srd-check"} data-testid={testId} aria-pressed={on} onClick={onClick}>
      <i>{on ? <Check /> : null}</i>
      <span>
        <b>{title}</b>
        {sub ? <span className="sub">{sub}</span> : null}
        <small>{text}</small>
      </span>
    </button>
  );
}

function SideOne({ reg }: { reg: RegSeminarState }) {
  return (
    <div className="srd-card srd-sum">
      <h3>
        <FileText /> Qo‘shimcha imkoniyatlar
      </h3>
      <Toggle testId="srd-cert" on={reg.certificate} title="Sertifikat kerak" text="Seminar yakunida elektron sertifikat beriladi" onClick={() => reg.setCertificate((value) => !value)} />
      <Toggle testId="srd-terms" on={reg.terms} title="Rozilik" sub="Shartlarga roziman" text="Seminar qatnashish shartlari va qaytarish siyosati bilan tanishdim" onClick={() => reg.setTerms((value) => !value)} />
      <div className="srd-total">
        <span>Jami summa</span>
        <b data-testid="srd-total">{formatMoney(reg.total, "UZS")}</b>
      </div>
      <ErrorLine reg={reg} />
      <button type="button" className="srd-go" data-testid="srd-next" onClick={reg.goPay}>
        <b>
          To‘lovga o‘tish <ArrowRight />
        </b>
        <span>2-bosqich: to‘lov</span>
      </button>
    </div>
  );
}

function SideTwo({ reg }: { reg: RegSeminarState }) {
  return (
    <div className="srd-card srd-sum">
      <h3>
        <FileText /> Buyurtma xulosasi
      </h3>
      <dl className="srd-rows" data-testid="srd-summary">
        <div>
          <dt>Seminar narxi</dt>
          <dd>{formatMoney(reg.prices.standart, "UZS")}</dd>
        </div>
        <div>
          <dt>VIP paket</dt>
          <dd>{formatMoney(reg.vipExtra, "UZS")}</dd>
        </div>
        <div>
          <dt>Chegirma (promokod)</dt>
          <dd className="green">{formatMoney(reg.discount, "UZS")}</dd>
        </div>
      </dl>
      <div className="srd-total big">
        <span>Jami summa</span>
        <b data-testid="srd-total">{formatMoney(reg.total, "UZS")}</b>
      </div>
      <p className="srd-note">
        <Info />
        <span>
          <b>To‘lovdan so‘ng elektron chipta (QR kodi) va sertifikat</b>
          sizning email manzilingizga va Telegram orqali yuboriladi.
        </span>
      </p>
      <ErrorLine reg={reg} />
      <button type="button" className="srd-go" data-testid="srd-pay" disabled={reg.busy} onClick={() => void reg.pay()}>
        <b>
          {reg.busy ? "Yuborilmoqda..." : `To‘lash ${formatMoney(reg.total, "UZS")}`}
          {!reg.busy ? <ArrowRight /> : null}
        </b>
      </button>
    </div>
  );
}

function Success({ reg, seminar }: { reg: RegSeminarState; seminar: Seminar }) {
  const ticket = reg.ticket!;
  return (
    <div className="srd-card srd-ok" data-testid="srd-success">
      <div className="badge">
        <Check />
      </div>
      <h2>Ro‘yxatdan o‘tdingiz</h2>
      <p>Elektron chipta tayyor. QR kodni kirishda ko‘rsating.</p>
      <div className="srd-ok-row">
        <div className="qr">{reg.qr ? <img src={reg.qr} alt="QR chipta" data-testid="srd-qr" /> : null}</div>
        <div className="info">
          <b>{ticket.title}</b>
          <span>
            <CalendarDays /> {ticket.when}
          </span>
          <span>
            <MapPin /> {ticket.place}
          </span>
          <span>
            <Ticket /> {ticket.name} · {ticket.tier === "vip" ? "VIP" : "Standart"} · {formatMoney(ticket.price, "UZS")}
          </span>
          <code data-testid="srd-code">{ticket.code}</code>
        </div>
      </div>
      <div className="srd-ok-actions">
        <Link href="/seminarlar/yozuvlarim" className="srd-go" data-testid="srd-seminarlarim">
          <b>Seminarlarim</b>
        </Link>
        <Link href={`/seminarlar/${seminar.id}`} className="srd-ghost">
          Seminar sahifasi
        </Link>
      </div>
    </div>
  );
}
