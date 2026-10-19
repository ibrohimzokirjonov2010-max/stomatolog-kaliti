"use client";
/* eslint-disable @next/next/no-img-element -- seminar photos are fixed-size cards */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
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
import { useSeminarRegs } from "@/components/seminar-provider";
import { resolveRegSeminar, ticketPrices } from "@/data/reg-seminar";
import { getMobileSeminar } from "@/data/mobile-seminars";
import { formatMoney } from "@/lib/format";
import { rememberSeminarTicket, type SeminarTicket } from "@/lib/seminar-tickets";
import "./seminar-register.css";

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg‘ona", "Namangan", "Nukus", "Qarshi"];
const SPECIALTIES = ["Implantolog", "Endodontist", "Ortodont", "Terapevt-stomatolog", "Jarroh", "Bolalar stomatologi", "Boshqa"];
const YEARS = ["1", "2", "3", "5", "10", "15"];
const FAIL: Record<string, string> = {
  auth: "Ro‘yxatdan o‘tish uchun avval hisobingizga kiring.",
  duplicate: "Siz bu seminarga allaqachon yozilgansiz — «Seminarlarim»da ko‘ring.",
  full: "Afsuski, joy qolmadi.",
  closed: "Bu seminarga yozilish yopilgan.",
  invalid: "Ism va telefon raqamini to‘g‘ri kiriting.",
  missing: "Bu seminar namuna sifatida ko‘rsatilgan — unga ro‘yxat hali ochilmagan.",
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function SeminarRegisterFlow({ id }: { id: string }) {
  const seminar = useMemo(() => resolveRegSeminar(id), [id]);
  const { register } = useSeminarRegs();
  /** Design cards map onto the real catalog seminar they advertise (when there is one). */
  const regId = getMobileSeminar(id)?.realId ?? id;
  const [busy, setBusy] = useState(false);
  const [failReason, setFailReason] = useState("");
  const prices = seminar ? ticketPrices(seminar.price) : { standart: 0, vip: 0 };
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Toshkent");
  const [clinic, setClinic] = useState("");
  const [specialty, setSpecialty] = useState("Implantolog");
  const [experience, setExperience] = useState("3");
  const [diploma, setDiploma] = useState("");
  const [attendance, setAttendance] = useState<"oflayn" | "onlayn">(seminar?.tags.some((tag) => tag.label === "Onlayn") && !seminar.tags.some((tag) => tag.label === "Oflayn") ? "onlayn" : "oflayn");
  const [tier, setTier] = useState<"standart" | "vip">("standart");
  const [certificate, setCertificate] = useState(true);
  const [terms, setTerms] = useState(true);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<SeminarTicket | null>(null);
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!ticket) return;
    let alive = true;
    QRCode.toDataURL(ticket.code, { margin: 1, width: 320, errorCorrectionLevel: "M", color: { dark: "#0B1F4D", light: "#ffffff" } })
      .then((url) => {
        if (alive) setQr(url);
      })
      .catch(() => {
        if (alive) setQr("");
      });
    return () => {
      alive = false;
    };
  }, [ticket]);

  if (!seminar) {
    return (
      <div className="rg" data-testid="seminar-register">
        <header className="rg-top">
          <Link href="/seminarlar" className="rg-back" aria-label="Orqaga">
            <ChevronLeft />
          </Link>
          <div className="rg-brand">
            <b>STOMAHUB</b>
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

  const ticketPrice = tier === "vip" ? prices.vip : prices.standart;
  const vipExtra = tier === "vip" ? prices.vip - prices.standart : 0;
  const total = ticketPrice;

  function validate() {
    if (!name.trim()) return "F.I.SH kiriting";
    if (digits(phone).length < 9) return "Telefon raqamini kiriting";
    if (!email.includes("@") || !email.split("@")[1]?.includes(".")) return "Email manzilini kiriting";
    if (!city) return "Shaharni tanlang";
    if (!clinic.trim()) return "Klinika nomini kiriting";
    if (!specialty) return "Mutaxassislikni tanlang";
    if (!experience) return "Ish tajribasini tanlang";
    if (!terms) return "Shartlarga rozilik bildiring";
    return "";
  }

  function goPay() {
    const message = validate();
    setError(message);
    if (!message) setStep(2);
  }

  async function pay() {
    if (!seminar || busy) return;
    const message = validate();
    if (message) {
      setError(message);
      setStep(1);
      return;
    }
    setBusy(true);
    setError("");
    setFailReason("");
    const res = await register({ seminarId: regId, name: name.trim(), phone: digits(phone), clinic: clinic.trim() });
    setBusy(false);
    if (!res.ok) {
      const reason = res.reason === "error" && /Topilmadi/i.test(res.error ?? "") ? "missing" : res.reason;
      setFailReason(reason);
      setError(FAIL[reason] ?? res.error ?? "Ro‘yxatdan o‘tib bo‘lmadi. Qayta urinib ko‘ring.");
      return;
    }
    const reg = res.registration;
    const next: SeminarTicket = {
      id: reg.id,
      seminarId: regId,
      title: seminar.title,
      when: seminar.when,
      place: seminar.place,
      image: seminar.image,
      name: reg.name || name.trim(),
      price: reg.price ?? seminar.price,
      tier,
      code: reg.ticketCode || reg.id.slice(0, 8).toUpperCase(),
      createdAt: reg.createdAt,
    };
    rememberSeminarTicket(next);
    setTicket(next);
  }

  if (ticket) {
    return (
      <div className="rg" data-testid="seminar-register" data-step="success">
        <header className="rg-top">
          <Link href={`/seminarlar/${seminar.id}`} className="rg-back" aria-label="Orqaga">
            <ChevronLeft />
          </Link>
          <div className="rg-brand">
            <b>STOMAHUB</b>
            <span>Seminarga ro‘yxatdan o‘tish</span>
          </div>
        </header>
        <div className="rg-scroll">
          <div className="rg-ok" data-testid="rg-success">
            <div className="badge">
              <Check />
            </div>
            <h2>Ro‘yxatga olindingiz</h2>
            <p>Arizangiz tashkilotchiga yuborildi. U joyingizni tasdiqlaydi va to‘lovni siz bilan kelishadi. Chipta kodi «Seminarlarim»da ham saqlanadi.</p>
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
              {ticket.name} · {formatMoney(ticket.price, "UZS")} · to‘lov tashkilotchi bilan</span>
            <span>
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
          <b>STOMAHUB</b>
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
            Tasdiqlash
          </div>
        </div>
        <Summary seminar={seminar} />
        {error ? (
          <p className="rg-error" data-testid="rg-error">
            {error}
            {failReason === "auth" ? (
              <>
                {" "}
                <Link href={`/kirish?next=${encodeURIComponent(`/seminarlar/${id}/royxat`)}`}>Kirish →</Link>
              </>
            ) : failReason === "duplicate" ? (
              <>
                {" "}
                <Link href="/seminarlar/yozuvlarim">Seminarlarim →</Link>
              </>
            ) : null}
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
            <section className="rg-block" data-testid="rg-payinfo">
              <h2>
                <CreditCard /> To‘lov
              </h2>
              <p className="rg-honest">Onlayn to‘lov hozircha ulanmagan — bu yerda pul yechilmaydi. Ro‘yxatdan o‘tganingizdan so‘ng tashkilotchi joyingizni tasdiqlaydi va to‘lovni (naqd, karta yoki o‘tkazma) siz bilan kelishadi.</p>
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
                  VIP paket <b>{vipExtra ? `+${formatMoney(vipExtra, "UZS")}` : formatMoney(0, "UZS")}</b>
                </p>
                <p className="jami">
                  Jami summa <b data-testid="rg-summary-total">{formatMoney(total, "UZS")}</b>
                </p>
              </div>
            </section>
            <p className="rg-note">
              <Info />
              Ro‘yxatdan so‘ng chipta kodi va QR shu yerda va «Seminarlarim»da chiqadi. Sertifikat seminarda qatnashganingiz tasdiqlangach «Sertifikatlar» bo‘limida paydo bo‘ladi.
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
            <b>Davom etish →</b>
            <span>2-bosqich: tasdiqlash</span>
          </button>
        ) : (
          <button type="button" className="rg-go" data-testid="rg-pay" disabled={busy} onClick={() => void pay()}>
            <b>{busy ? "Yuborilmoqda..." : "Ro‘yxatdan o‘tish →"}</b>
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
