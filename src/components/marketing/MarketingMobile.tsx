"use client";
/* eslint-disable @next/next/no-img-element -- static design images */

import { useState, type FormEvent } from "react";
import { BarChart3, Building2, Check, FileText, Gem, Info, Phone, Send, Star, UserRound } from "lucide-react";
import { marketingNeeds } from "@/data/site";
import "./marketing-mobile.css";

const SERVICES: Record<string, { sub: string; image: string }> = {
  logo: { sub: "Logotip, ranglar, firma uslubi", image: "/img/marketing/logo.jpg" },
  website: { sub: "Klinika uchun zamonaviy veb-sayt", image: "/img/marketing/website.jpg" },
  ads: { sub: "Vizitka, flayer, banner, roll-up va boshqalar", image: "/img/marketing/ads.jpg" },
  instagram: { sub: "Postlar, storis, kontent reja", image: "/img/marketing/instagram.jpg" },
};

const WORKS = ["/img/marketing/work-1.jpg", "/img/marketing/work-2.jpg", "/img/marketing/work-3.jpg", "/img/marketing/work-4.jpg"];

/** Phone /marketing (mock "marketing telefon"). Sends the same lead as the desktop form. */
export function MarketingMobile() {
  const [needs, setNeeds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [clinic, setClinic] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  function toggle(id: string) {
    setNeeds((cur) => (cur.includes(id) ? cur.filter((item) => item !== id) : [...cur, id]));
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !clinic.trim() || !contact.trim()) {
      setError("Ism, klinika va telefon yoki Telegramni yozing.");
      return;
    }
    if (needs.length === 0) {
      setError("Kerakli xizmatlardan kamida bittasini belgilang.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/marketing-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, clinic, contact, needs, notes, website: "" }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "So‘rovni saqlab bo‘lmadi.");
        return;
      }
      setSent(true);
    } catch {
      setError("So‘rovni saqlab bo‘lmadi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mk lg:hidden" data-testid="marketing-mobile">
      <section className="mk-hero">
        <div className="mk-hero-copy">
          <h1>Klinikangiz uchun <span>marketing va dizayn</span></h1>
          <p>Professional dizayn va kontent bilan klinikangizni yanada tanitishingiz.</p>
        </div>
        <img src="/img/marketing/hero.jpg" alt="" />
        <div className="mk-badges">
          <span><Gem /> Zamonaviy dizayn</span>
          <span><BarChart3 /> Ko‘proq mijozlar</span>
          <span><Star /> Tajribali jamoa</span>
        </div>
      </section>

      <h2>Qaysi xizmatlar kerak?</h2>
      <p className="mk-lead">Bir nechta xizmatni tanlashingiz mumkin.</p>
      <div className="mk-services">
        {marketingNeeds.map((need) => {
          const meta = SERVICES[need.id];
          const on = needs.includes(need.id);
          return (
            <button key={need.id} type="button" className={on ? "mk-svc on" : "mk-svc"} aria-pressed={on} onClick={() => toggle(need.id)}>
              {meta ? <img src={meta.image} alt="" /> : null}
              <span className="mk-svc-copy"><b>{need.label}</b><small>{meta?.sub}</small></span>
              <i className="mk-check">{on ? <Check strokeWidth={3} /> : null}</i>
            </button>
          );
        })}
      </div>

      <h2>Ishlarimizdan namunalar</h2>
      <div className="mk-works">
        {WORKS.map((src) => <img key={src} src={src} alt="" />)}
      </div>

      {sent ? (
        <section className="mk-form mk-done" data-testid="marketing-sent">
          <Check />
          <b>Rahmat, {name}!</b>
          <p>{clinic} uchun so‘rovingiz yozib olindi. Tez orada Telegram yoki telefon orqali bog‘lanamiz.</p>
          <button type="button" onClick={() => { setSent(false); setNeeds([]); setNotes(""); }}>Yana so‘rov yuborish</button>
        </section>
      ) : (
        <form className="mk-form" onSubmit={submit}>
          <h2>So‘rov qoldiring</h2>
          <p className="mk-lead">Biz siz bilan bog‘lanib, barcha tafsilotlarni muhokama qilamiz.</p>
          <div className="mk-row">
            <label><span>Ismingiz <em>*</em></span><i><UserRound /><input value={name} placeholder="Masalan, Dilnoza Karimova" onChange={(event) => setName(event.target.value)} /></i></label>
            <label><span>Klinika nomi <em>*</em></span><i><Building2 /><input value={clinic} placeholder="Masalan, Smile Dental" onChange={(event) => setClinic(event.target.value)} /></i></label>
          </div>
          <label><span>Telefon yoki Telegram <em>*</em></span><i><Phone /><input value={contact} placeholder="+998 90 123 45 67 yoki @username" onChange={(event) => setContact(event.target.value)} /></i></label>
          <label><span>Qo‘shimcha izoh (ixtiyoriy)</span><i><FileText /><input value={notes} placeholder="Masalan: logotip va Instagram postlar kerak..." onChange={(event) => setNotes(event.target.value.slice(0, 1000))} /></i></label>
          <p className="mk-info"><Info /> Narx suhbatdan keyin. Onlayn to‘lov yo‘q.</p>
          {error ? <p className="mk-error" role="alert">{error}</p> : null}
          <button type="submit" className="mk-send" disabled={busy}><Send /> {busy ? "Yuborilmoqda…" : "So‘rov yuborish"}</button>
        </form>
      )}
    </div>
  );
}
