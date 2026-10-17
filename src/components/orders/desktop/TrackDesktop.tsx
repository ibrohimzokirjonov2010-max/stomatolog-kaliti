"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { formatGroupedNumber } from "@/lib/format";
import "./track-desktop.css";

const ITEMS = [
  { name: "Implant tizimi", qty: "1 dona", price: 1250000, image: "/img/designs/prod-implant.png" },
  { name: "Kompozit (universal)", qty: "2 dona", price: 340000, image: "/img/designs/prod-composite.png" },
  { name: "Periodontal kuretlar to‘plami", qty: "1 dona", price: 330000, image: "/img/designs/prod-curette.png" },
];
const STEPS = [
  ["Qabul qilindi", "14 okt, 10:24", "Buyurtmangiz qabul qilindi", "done"],
  ["Tayyorlanmoqda", "14 okt, 11:15", "Mahsulotlar tayyorlanmoqda", "done"],
  ["Yo‘lda", "14 okt, 13:05", "Kuryerga topshirildi", "current"],
  ["Yetkazildi", "Tez orada", "", "todo"],
];

function som(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

export function TrackDesktop({ id }: { id: string }) {
  const [chat, setChat] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [help, setHelp] = useState(false);
  const [called, setCalled] = useState(false);

  return (
    <ClinicShell accent="blue">
      <div className="tkx" data-testid="track-desktop" data-order={id}>
        <div className="tkx-crumb"><Link href="/">Bosh sahifa</Link><span>›</span><Link href="/buyurtmalarim">Buyurtmalarim</Link><span>›</span><b>Buyurtmani kuzatish</b></div>
        <div className="tkx-grid">
          <div>
            <section className="tkx-card">
              <p className="tkx-no">Buyurtma #SH-10245</p>
              <h1>Buyurtmangiz yo‘lda</h1>
              <p>Buyurtmangiz manzilingizga yetkazib berilmoqda. Iltimos, telefoningizni yoqib qo‘ying.</p>
              <b className="tkx-eta">Bugun, 14:30 – 15:00 <small>(35 daqiqa qoldi)</small></b>
              <div className="tkx-steps" data-testid="trd-steps">
                {STEPS.map(([title, when, hint, state]) => (
                  <div key={title} className={state}>
                    <i />
                    <b>{title}</b>
                    <small>{when}</small>
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            </section>
            <img className="tkx-map" src="/img/designs/toshkent-map.png" alt="Toshkent xaritasi: Yunusobod, Mirzo Ulug‘bek, Chilonzor, Sergeli" />
            <section className="tkx-card">
              <h2>Yetkazish manzili</h2>
              <p><b>Ibrohim</b><br />+998 90 123 45 67<br />Toshkent, Yunusobod tumani<br />Amir Temur ko‘chasi, 25-uy, 3-xonadon, 5-qavat</p>
              <button type="button" onClick={() => setChat(false)}>Manzilni ko‘rish</button>
            </section>
            <section className="tkx-card">
              <h2>Kuryer holati</h2>
              <div className="tkx-log"><b>Yo‘lda · 14 okt 2024, 13:05</b><span>Kuryer manzilingizga harakatlanmoqda</span></div>
              <div className="tkx-log"><b>Tayyorlanmoqda · 14 okt 2024, 11:15</b><span>Mahsulotlar tayyorlanmoqda</span></div>
              <div className="tkx-log"><b>Qabul qilindi · 14 okt 2024, 10:24</b><span>Buyurtmangiz qabul qilindi</span></div>
            </section>
          </div>
          <aside>
            <section className="tkx-card">
              <h2>Kuryer ma’lumotlari</h2>
              <div className="tkx-courier">
                <img src="/img/designs/courier.png" alt="" />
                <div><b>Akmaljon</b><span>4.9 (320 ta baho)</span><small>StomaHub kuryeri</small></div>
              </div>
              <div className="tkx-row">
                <button type="button" onClick={() => setCalled(true)}>Qo‘ng‘iroq qilish</button>
                <button type="button" data-testid="trd-chat" onClick={() => setChat(true)}>Xabar yozish</button>
              </div>
              {called ? <p data-testid="trd-called">Qo‘ng‘iroq: +998 90 123 45 67</p> : null}
              {chat ? (
                sent ? <p data-testid="trd-sent">Xabar yuborildi</p> : (
                  <div>
                    <textarea aria-label="Xabar" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Kuryerga xabar" />
                    <button type="button" onClick={() => { if (note.trim()) setSent(true); }}>Yuborish</button>
                  </div>
                )
              ) : null}
            </section>
            <section className="tkx-card">
              <h2>Buyurtma mahsulotlari (3 ta)</h2>
              {ITEMS.map((item) => (
                <div key={item.name} className="tkx-line"><img src={item.image} alt="" /><div><b>{item.name}</b><small>{item.qty}</small></div><em>{som(item.price)}</em></div>
              ))}
              <div className="tkx-sum"><span>Mahsulotlar (3 ta)<b>{som(1920000)}</b></span><span>Yetkazish<b>{som(25000)}</b></span><span>Jami<b>{som(1945000)}</b></span></div>
            </section>
            <section className="tkx-card">
              <h2>Buyurtma ma’lumotlari</h2>
              <div className="tkx-meta"><span>Buyurtma raqami</span><b>#SH-10245</b></div>
              <div className="tkx-meta"><span>Sana</span><b>14 okt 2024, 10:24</b></div>
              <div className="tkx-meta"><span>Do‘kon</span><b>DentPro.uz</b></div>
              <div className="tkx-meta"><span>To‘lov usuli</span><b>Click</b></div>
              <div className="tkx-meta"><span>Holati</span><b>Yo‘lda</b></div>
            </section>
          </aside>
        </div>
        <footer className="tkx-foot">
          <button type="button" data-testid="trd-help" onClick={() => setHelp((value) => !value)}>Yordam</button>
          <Link href="/buyurtmalarim">Buyurtmalarimga qaytish</Link>
          {help ? <p data-testid="trd-help-text">Qo‘llab-quvvatlash: +998 71 200 00 00</p> : null}
        </footer>
      </div>
    </ClinicShell>
  );
}
