"use client";
/* eslint-disable @next/next/no-img-element -- seminar photos are fixed-size cards */

import Link from "next/link";
import {
  Award,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  CreditCard,
  Crown,
  FileText,
  Info,
  MapPin,
  Shield,
  Ticket,
  User,
  Users,
  Wifi,
} from "lucide-react";
import { CITIES, PAYMENTS, SPECIALTIES, YEARS, useSeminarRegister } from "@/components/seminars/use-seminar-register";
import { resolveRegSeminar } from "@/data/reg-seminar";
import { formatMoney } from "@/lib/format";
import "./seminar-register.css";

export function SeminarRegisterFlow({ id }: { id: string }) {
  const reg = useSeminarRegister(id);
  const { seminar, prices, step, attendance, setAttendance, tier, setTier, certificate, setCertificate, terms, setTerms, payment, setPayment, promo, setPromo, error, busy, ticket, qr, vipExtra, discount, total, goPay, applyPromo, pay } = reg;
  const { name, phone, email, city, clinic, specialty, experience, diploma } = reg.fields;
  const { setName, setPhone, setEmail, setCity, setClinic, setSpecialty, setExperience, setDiploma } = reg.set;

  if (!seminar) {
    return (
      <div className="rg" data-testid="seminar-register">
        <header className="rg-top">
          <Link href="/seminarlar" className="rg-back" aria-label="Orqaga">
            <ChevronLeft />
          </Link>
          <div className="rg-brand">
            <b>STOMA<span>HUB</span></b>
            <span>Seminarga ro‘yxatdan o‘tish</span>
          </div>
        </header>
        <div className="rg-miss">
          <p>Seminar topilmadi</p>
          <Link href="/seminarlar">Seminarlar</Link>
        </div>
      </div>
    );
  }

  if (ticket) {
    return (
      <div className="rg" data-testid="seminar-register" data-step="success">
        <header className="rg-top">
          <Link href={`/seminarlar/${seminar.id}`} className="rg-back" aria-label="Orqaga">
            <ChevronLeft />
          </Link>
          <div className="rg-brand">
            <b>STOMA<span>HUB</span></b>
            <span>Seminarga ro‘yxatdan o‘tish</span>
          </div>
        </header>
        <div className="rg-scroll">
          <div className="rg-ok" data-testid="rg-success">
            <div className="badge">
              <Check />
            </div>
            <h2>Ro‘yxatdan o‘tdingiz</h2>
            <p>Elektron chipta tayyor. QR kodni kirishda ko‘rsating.</p>
            <div className="rg-qr">{qr ? <img src={qr} alt="QR chipta" data-testid="rg-qr" /> : null}</div>
            <p className="rg-code" data-testid="rg-code">
              {ticket.code}
            </p>
          </div>
          <article className="rg-block rg-ticket">
            <b>{ticket.title}</b>
            <span>{ticket.when}</span>
            <span>{ticket.place}</span>
            <span>
              {ticket.name} · {tier === "vip" ? "VIP" : "Standart"} · {formatMoney(ticket.price, "UZS")}
            </span>
          </article>
        </div>
        <div className="rg-bar">
          <Link href="/seminarlar/yozuvlarim" className="rg-go" data-testid="rg-seminarlarim">
            <b>Seminarlarim</b>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rg" data-testid="seminar-register" data-step={step}>
      <header className="rg-top">
        <Link href={`/seminarlar/${seminar.id}`} className="rg-back" aria-label="Orqaga">
          <ChevronLeft />
        </Link>
        <div className="rg-brand">
          <b>STOMA<span>HUB</span></b>
          <span>Seminarga ro‘yxatdan o‘tish</span>
        </div>
      </header>
      <div className="rg-scroll">
        <div className="rg-steps" aria-label="Bosqichlar">
          <div className={step === 1 ? "rg-step on" : "rg-step done"}>
            <i>{step === 1 ? "1" : <Check />}</i>
            Ma’lumotlar
          </div>
          <div className={step === 2 ? "rg-line on" : "rg-line"} />
          <div className={step === 2 ? "rg-step on" : "rg-step"}>
            <i>2</i>
            To‘lov
          </div>
        </div>
        <Summary seminar={seminar} />
        {error ? (
          <p className="rg-error" data-testid="rg-error">
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <>
            <section className="rg-block">
              <h2>
                <User /> Shaxsiy ma’lumotlar
              </h2>
              <div className="rg-grid">
                <label className="rg-field">
                  <span>F.I.SH</span>
                  <div className="rg-ctl">
                    <input data-testid="rg-name" aria-label="F.I.SH" value={name} placeholder="Masalan: Ibrohim Zokirjonov" onChange={(event) => setName(event.target.value)} />
                  </div>
                </label>
                <label className="rg-field">
                  <span>Telefon raqami</span>
                  <div className="rg-ctl rg-phone">
                    <span className="rg-flag">
                      🇺🇿
                      <ChevronDown />
                      +998
                      <em />
                    </span>
                    <input data-testid="rg-phone" aria-label="Telefon" inputMode="tel" value={phone} placeholder="90 123 45 67" onChange={(event) => setPhone(event.target.value)} />
                  </div>
                </label>
                <label className="rg-field">
                  <span>Email manzil</span>
                  <div className="rg-ctl">
                    <input data-testid="rg-email" aria-label="Email" inputMode="email" value={email} placeholder="example@email.com" onChange={(event) => setEmail(event.target.value)} />
                  </div>
                </label>
                <label className="rg-field">
                  <span>Shahar</span>
                  <div className="rg-ctl">
                    <select data-testid="rg-city" aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>
                      {CITIES.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <ChevronDown className="chev" />
                  </div>
                </label>
                <label className="rg-field">
                  <span>Klinika nomi</span>
                  <div className="rg-ctl">
                    <input data-testid="rg-clinic" aria-label="Klinika nomi" value={clinic} placeholder="Masalan: Dent Smile Clinic" onChange={(event) => setClinic(event.target.value)} />
                  </div>
                </label>
                <label className="rg-field">
                  <span>Mutaxassisligi</span>
                  <div className="rg-ctl">
                    <select data-testid="rg-spec" aria-label="Mutaxassisligi" value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
                      {SPECIALTIES.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <ChevronDown className="chev" />
                  </div>
                </label>
                <label className="rg-field">
                  <span>Ish tajribasi (yil)</span>
                  <div className="rg-ctl">
                    <select data-testid="rg-exp" aria-label="Ish tajribasi" value={experience} onChange={(event) => setExperience(event.target.value)}>
                      {YEARS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <ChevronDown className="chev" />
                  </div>
                </label>
                <label className="rg-field">
                  <span>Diplom/guvohnoma raqami (ixtiyoriy)</span>
                  <div className="rg-ctl">
                    <input data-testid="rg-diploma" aria-label="Diplom raqami" value={diploma} placeholder="Masalan: № 123456" onChange={(event) => setDiploma(event.target.value)} />
                  </div>
                </label>
              </div>
            </section>

            <section className="rg-block">
              <h2>
                <Users /> Ishtirok turi
              </h2>
              <div className="rg-choices">
                <button type="button" className={attendance === "oflayn" ? "rg-choice on" : "rg-choice"} data-testid="rg-oflayn" aria-pressed={attendance === "oflayn"} onClick={() => setAttendance("oflayn")}>
                  <i className="ic">
                    <Users />
                  </i>
                  <b>Oflayn</b>
                  <small>Joyida ishtirok etish</small>
                  <span className="rg-dot">{attendance === "oflayn" ? <Check /> : null}</span>
                </button>
                <button type="button" className={attendance === "onlayn" ? "rg-choice on" : "rg-choice"} data-testid="rg-onlayn" aria-pressed={attendance === "onlayn"} onClick={() => setAttendance("onlayn")}>
                  <i className="ic">
                    <Wifi />
                  </i>
                  <b>Onlayn</b>
                  <small>Onlayn qatnashish</small>
                  <span className="rg-dot">{attendance === "onlayn" ? <Check /> : null}</span>
                </button>
              </div>
            </section>

            <section className="rg-block">
              <h2>
                <Ticket /> Chipta turi
              </h2>
              <div className="rg-choices">
                <button type="button" className={tier === "standart" ? "rg-choice on" : "rg-choice"} data-testid="rg-standart" aria-pressed={tier === "standart"} onClick={() => setTier("standart")}>
                  <i className="ic">
                    <Ticket />
                  </i>
                  <b>Standart</b>
                  <small>Seminarga kirish, materiallar, kofe-breyk</small>
                  <span className="cost">{formatMoney(prices.standart, "UZS")}</span>
                  <span className="rg-dot">{tier === "standart" ? <Check /> : null}</span>
                </button>
                <button type="button" className={tier === "vip" ? "rg-choice on" : "rg-choice"} data-testid="rg-vip" aria-pressed={tier === "vip"} onClick={() => setTier("vip")}>
                  <i className="ic">
                    <Crown />
                  </i>
                  <b>VIP</b>
                  <small>Seminarga kirish, premium o‘rin, maxsus materiallar, sertifikat, tushlik</small>
                  <span className="cost">{formatMoney(prices.vip, "UZS")}</span>
                  <span className="rg-dot">{tier === "vip" ? <Check /> : null}</span>
                </button>
              </div>
            </section>

            <section className="rg-block">
              <h2>
                <Award /> Qo‘shimcha imkoniyatlar
              </h2>
              <button type="button" className={certificate ? "rg-check on" : "rg-check"} data-testid="rg-cert" aria-pressed={certificate} onClick={() => setCertificate((value) => !value)}>
                <i>{certificate ? <Check /> : null}</i>
                <span>
                  <b>Sertifikat kerak</b>
                  Seminar yakunida elektron sertifikat beriladi
                </span>
              </button>
            </section>

            <section className="rg-block">
              <h2>
                <Shield /> Rozilik
              </h2>
              <button type="button" className={terms ? "rg-check on" : "rg-check"} data-testid="rg-terms" aria-pressed={terms} onClick={() => setTerms((value) => !value)}>
                <i>{terms ? <Check /> : null}</i>
                <span>
                  <b>Shartlarga roziman</b>
                  Seminar qatnashish shartlari va qaytarish siyosati bilan tanishdim
                </span>
              </button>
            </section>
          </>
        ) : (
          <>
            <section className="rg-block">
              <h2>
                <CreditCard /> To‘lov usulini tanlang
              </h2>
              <div className="rg-choices">
                {PAYMENTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={payment === item.id ? "rg-pay on" : "rg-pay"}
                    data-testid={`rg-pay-${item.id}`}
                    aria-pressed={payment === item.id}
                    onClick={() => setPayment(item.id)}
                  >
                    {item.id === "card" ? (
                      <i className="ic" style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: "#eef3f8", marginBottom: 6 }}>
                        <CreditCard style={{ width: 16, height: 16 }} />
                      </i>
                    ) : item.id === "installment" ? (
                      <i className="ic" style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: "#e8f1ff", color: "#0066ff", marginBottom: 6 }}>
                        <Clock style={{ width: 16, height: 16 }} />
                      </i>
                    ) : (
                      <span className="rg-mark" style={{ background: item.color }}>
                        {item.mark}
                      </span>
                    )}
                    <b>{item.name}</b>
                    <small>{item.text}</small>
                    {item.id === "card" ? (
                      <span className="rg-logos">
                        <span className="uz">UZCARD</span>
                        <span className="hu">HUMO</span>
                        <span className="vi">VISA</span>
                      </span>
                    ) : null}
                    <span className="rg-dot">{payment === item.id ? <Check /> : null}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="rg-block">
              <h2>
                <Ticket /> Promokod
              </h2>
              <div className="rg-promo">
                <input data-testid="rg-promo" aria-label="Promokod" value={promo} placeholder="Promokod kiriting" onChange={(event) => setPromo(event.target.value)} />
                <button type="button" data-testid="rg-apply" onClick={applyPromo}>
                  Qo‘llash
                </button>
              </div>
            </section>
            <section className="rg-block">
              <h2>
                <FileText /> Buyurtma xulosasi
              </h2>
              <div className="rg-rows" data-testid="rg-summary">
                <p>
                  Seminar narxi <b>{formatMoney(prices.standart, "UZS")}</b>
                </p>
                <p className={vipExtra === 0 ? "free" : undefined}>
                  VIP paket <b>{formatMoney(vipExtra, "UZS")}</b>
                </p>
                <p className="free">
                  Chegirma (promokod) <b>{formatMoney(discount, "UZS")}</b>
                </p>
                <p className="jami">
                  Jami summa <b data-testid="rg-summary-total">{formatMoney(total, "UZS")}</b>
                </p>
              </div>
            </section>
            <p className="rg-note">
              <Info />
              To‘lovdan so‘ng elektron chipta (QR kodi) va sertifikat sizning email manzilingizga va Telegram orqali yuboriladi.
            </p>
          </>
        )}
      </div>
      <div className="rg-bar">
        <div className="rg-sum">
          <span>{step === 1 ? "Jami summa" : "To‘lov summasi"}</span>
          <b data-testid="rg-total">{formatMoney(total, "UZS")}</b>
        </div>
        {step === 1 ? (
          <button type="button" className="rg-go" data-testid="rg-next" onClick={goPay}>
            <b>To‘lovga o‘tish →</b>
            <span>2-bosqich: to‘lov</span>
          </button>
        ) : (
          <button type="button" className="rg-go" data-testid="rg-pay" disabled={busy} onClick={() => void pay()}>
            <b>To‘lash {formatMoney(total, "UZS")} →</b>
          </button>
        )}
      </div>
    </div>
  );
}

function Summary({ seminar }: { seminar: NonNullable<ReturnType<typeof resolveRegSeminar>> }) {
  return (
    <article className="rg-card">
      <img src={seminar.image} alt="" />
      <div>
        <div className="rg-tags">
          {seminar.tags.map((tag) => (
            <span key={tag.label} className={tag.tone}>
              {tag.label}
            </span>
          ))}
        </div>
        <h1>{seminar.title}</h1>
        <div className="rg-card-row">
          <div className="rg-meta">
            <p>
              <User /> {seminar.speaker}
            </p>
            <p>
              <CalendarDays /> {seminar.when}
            </p>
            <p>
              <MapPin /> {seminar.place}
            </p>
          </div>
          <div className="rg-price">
            <b>{formatMoney(seminar.price, "UZS")}</b>
            <span>Boshlang‘ich narx</span>
          </div>
        </div>
      </div>
    </article>
  );
}
