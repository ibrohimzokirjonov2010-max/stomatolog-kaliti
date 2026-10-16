"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Headphones, MapPin } from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { getMobileOrder, mobileOrders, type MobileOrder } from "@/data/mobile-orders";
import { som } from "@/components/shop/desktop/shop-cart";
import "./track-desktop.css";

const STEPS = [
  { title: "Qabul qilindi", text: "Buyurtma qabul qilindi" },
  { title: "Tayyorlanmoqda", text: "Sotuvchi yig‘moqda" },
  { title: "Yo‘lda", text: "Kuryer yo‘lda" },
  { title: "Yetkazildi", text: "Manzilga yetdi" },
];

const COURIER = {
  name: "Azizbek Nurmatov",
  role: "StomaHub kuryeri",
  rating: "4.9",
  photo: "/img/mobile/ut-aziz-face.jpg",
  phone: "+998 90 123 45 67",
};

function useOrder(id: string): MobileOrder | undefined {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("sk-placed-orders", onChange);
      return () => window.removeEventListener("sk-placed-orders", onChange);
    },
    () => (id ? getMobileOrder(id) : undefined),
    () => mobileOrders.find((order) => order.id === id),
  );
}

function activeIndex(order: MobileOrder) {
  if (order.status === "yetkazildi") return 3;
  if (order.status === "yetkazilmoqda") return 2;
  if (order.status === "bekor") return 0;
  return 0;
}

export function TrackDesktop({ id }: { id: string }) {
  const order = useOrder(id);
  const [help, setHelp] = useState(false);
  const [chat, setChat] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <ClinicShell accent="blue">
      <div className="trd" data-testid="track-desktop">
        <h1>Buyurtmani kuzatish</h1>
        <p className="sub">Buyurtma holatini real vaqtda kuzating.</p>
        {!order ? (
          <div className="trd-card" data-testid="trd-missing">
            <h2>Buyurtma topilmadi</h2>
            <Link className="trd-go" href="/buyurtmalarim">Buyurtmalarim</Link>
          </div>
        ) : (
          <div className="trd-grid">
            <div>
              <section className="trd-card">
                <div className="trd-status">
                  <span className="trd-check"><Check /></span>
                  <div>
                    <b>Buyurtma #{order.number}</b>
                    <strong>{order.status === "yetkazildi" ? "yetkazildi" : order.status === "bekor" ? "bekor qilindi" : "qabul qilindi"}</strong>
                    <span className="sub">{order.place || "Yunusobod, Toshkent"}</span>
                  </div>
                </div>
                <div className="trd-steps" data-testid="trd-steps">
                  {STEPS.map((item, index) => {
                    const active = activeIndex(order);
                    const state = index < active ? "done" : index === active ? "on" : "";
                    return (
                      <article key={item.title} className={state}>
                        <i />
                        <b>{item.title}</b>
                        <span>{item.text}</span>
                      </article>
                    );
                  })}
                </div>
              </section>
              <section className="trd-card" style={{ marginTop: "calc(.45 * var(--u))" }}>
                <h2 style={{ marginTop: 0, fontSize: "calc(.8 * var(--u))" }}>Mahsulotlar</h2>
                {order.items.map((item) => (
                  <div key={item.id} className="trd-line">
                    <img src={item.image} alt="" />
                    <span style={{ flex: 1 }}><b>{item.name}</b><br />{item.qty} ta</span>
                    <b>{som(item.price * item.qty)}</b>
                  </div>
                ))}
                <div className="trd-line"><span style={{ flex: 1 }}>Jami</span><b>{som(order.total)}</b></div>
              </section>
            </div>
            <aside>
              <section className="trd-card">
                <h2 style={{ marginTop: 0, fontSize: "calc(.8 * var(--u))" }}>Kuryer</h2>
                <div className="trd-courier">
                  <img src={COURIER.photo} alt="" />
                  <div>
                    <b>{COURIER.name}</b>
                    <span>{COURIER.role} · {COURIER.rating}</span>
                    <span style={{ display: "block" }}>{COURIER.phone}</span>
                  </div>
                </div>
                {chat ? (
                  <div className="trd-chat">
                    {sent ? <p data-testid="trd-sent">Xabar yuborildi</p> : (
                      <>
                        <textarea aria-label="Xabar" value={note} placeholder="Kuryerga yozing" onChange={(event) => setNote(event.target.value)} />
                        <button type="button" onClick={() => { if (note.trim()) setSent(true); }}>Yuborish</button>
                      </>
                    )}
                  </div>
                ) : (
                  <button type="button" className="trd-help" style={{ marginTop: "calc(.4 * var(--u))" }} data-testid="trd-chat" onClick={() => setChat(true)}>Kuryerga yozish</button>
                )}
                <div className="trd-map" aria-hidden>
                  <span className="trd-pin" />
                </div>
                <p style={{ display: "flex", gap: "calc(.2 * var(--u))", alignItems: "center", fontSize: "calc(.58 * var(--u))", color: "#24344d" }}>
                  <MapPin size={14} color="#0066ff" /> {order.place || "Yunusobod tumani, Toshkent"}
                </p>
              </section>
              <div className="trd-actions">
                <button type="button" className="trd-help" data-testid="trd-help" onClick={() => setHelp((value) => !value)}><Headphones size={16} /> Yordam</button>
                <Link className="trd-go" href="/buyurtmalarim">Buyurtmalarim</Link>
              </div>
              {help ? <p className="sub" data-testid="trd-help-text">Qo‘llab-quvvatlash: +998 71 200 00 00</p> : null}
            </aside>
          </div>
        )}
      </div>
    </ClinicShell>
  );
}
