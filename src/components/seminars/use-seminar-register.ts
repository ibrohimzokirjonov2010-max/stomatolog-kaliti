"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useSeminarRegs } from "@/components/seminar-provider";
import { resolveRegSeminar, ticketPrices } from "@/data/reg-seminar";
import { rememberSeminarTicket, type SeminarTicket } from "@/lib/seminar-tickets";

export const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg‘ona", "Namangan", "Nukus", "Qarshi"];
export const SPECIALTIES = ["Implantolog", "Endodontist", "Ortodont", "Terapevt-stomatolog", "Jarroh", "Bolalar stomatologi", "Boshqa"];
export const YEARS = ["1", "2", "3", "5", "10", "15"];
const DISCOUNT = 100_000;

export const PAYMENTS = [
  { id: "click", name: "Click", text: "Click orqali to‘lov qilish", mark: "C", color: "#00b4d8" },
  { id: "payme", name: "Payme", text: "Payme orqali to‘lov qilish", mark: "P", color: "#14b87a" },
  { id: "uzum", name: "Uzum Bank", text: "Uzum Bank orqali to‘lov", mark: "U", color: "#7c3aed" },
  { id: "card", name: "Bank kartasi", text: "Uzcard, Humo, Visa", mark: "", color: "#0066ff" },
  { id: "installment", name: "Bo‘lib to‘lash", text: "Muddatli to‘lov (3-12 oy)", mark: "", color: "#0066ff" },
] as const;

export type PayId = (typeof PAYMENTS)[number]["id"];

function digits(value: string) {
  return value.replace(/\D/g, "");
}

/** Form state and submit logic shared by the phone and desktop seminar registration pages. */
export function useSeminarRegister(id: string, initialPayment: PayId = "installment") {
  const seminar = useMemo(() => resolveRegSeminar(id), [id]);
  const { register } = useSeminarRegs();
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
  const [payment, setPayment] = useState<PayId>(initialPayment);
  const [promo, setPromo] = useState("");
  const [promoOn, setPromoOn] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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

  const ticketPrice = tier === "vip" ? prices.vip : prices.standart;
  const vipExtra = tier === "vip" ? prices.vip - prices.standart : 0;
  const discount = promoOn ? Math.min(DISCOUNT, ticketPrice) : 0;
  const total = ticketPrice - discount;

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

  function back() {
    setError("");
    setStep(1);
  }

  function applyPromo() {
    if (!promo.trim()) {
      setPromoOn(false);
      setError("Promokod kiriting");
      return;
    }
    // No promo codes exist yet; do not grant a discount for any text typed here.
    setPromoOn(false);
    setError("Bunday promokod topilmadi");
  }

  async function pay() {
    if (!seminar || busy) return;
    const message = validate();
    if (message) {
      setError(message);
      setStep(1);
      return;
    }
    const next: SeminarTicket = {
      id: `SM-${Date.now().toString().slice(-6)}`,
      seminarId: seminar.id,
      title: seminar.title,
      when: seminar.when,
      place: seminar.place,
      image: seminar.image,
      name: name.trim(),
      price: total,
      tier,
      code: `SH-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
    };
    setBusy(true);
    const result = await register({
      seminarId: seminar.id,
      name: name.trim(),
      phone: digits(phone),
      clinic: clinic.trim(),
    });
    setBusy(false);
    if (!result.ok) {
      setError(
        result.reason === "duplicate" ? "Siz bu seminarga allaqachon yozilgansiz."
        : result.reason === "full" ? "Joy qolmadi."
        : result.reason === "auth" ? "Yozilish uchun avval tizimga kiring."
        : result.reason === "invalid" ? "Ism va telefon majburiy (kamida 9 raqam)."
        : result.reason === "closed" ? "Ro‘yxatga olish yopilgan."
        : result.error || "Yozib bo‘lmadi. Qayta urinib ko‘ring.",
      );
      return;
    }
    rememberSeminarTicket(next);
    setTicket(next);
    setError("");
  }

  return {
    seminar,
    prices,
    step,
    fields: { name, phone, email, city, clinic, specialty, experience, diploma },
    set: { setName, setPhone, setEmail, setCity, setClinic, setSpecialty, setExperience, setDiploma },
    attendance,
    setAttendance,
    tier,
    setTier,
    certificate,
    setCertificate,
    terms,
    setTerms,
    payment,
    setPayment,
    promo,
    setPromo,
    error,
    busy,
    ticket,
    qr,
    vipExtra,
    discount,
    total,
    goPay,
    back,
    applyPromo,
    pay,
  };
}

export type RegSeminarState = ReturnType<typeof useSeminarRegister>;
