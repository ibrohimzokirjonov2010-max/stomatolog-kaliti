"use client";
/* eslint-disable @next/next/no-img-element -- ticket thumbs are fixed-size */

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { loadSeminarTickets, type SeminarTicket } from "@/lib/seminar-tickets";
import "./seminar-register.css";

export function SeminarlarimMobile() {
  const [tickets, setTickets] = useState<SeminarTicket[]>([]);

  useEffect(() => {
    const read = () => setTickets(loadSeminarTickets());
    read();
    window.addEventListener("sk-seminar-tickets", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("sk-seminar-tickets", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return (
    <div className="sm-list lg:hidden" data-testid="seminarlarim">
      <h1>Seminarlarim</h1>
      <p className="sub">Ro‘yxatdan o‘tgan seminarlar</p>
      {tickets.length === 0 ? (
        <div className="sm-empty">
          <p>Hali seminar yo‘q</p>
          <Link href="/seminarlar">Seminar tanlash</Link>
        </div>
      ) : (
        tickets.map((ticket) => (
          <article key={ticket.id} className="sm-card" data-testid="seminar-ticket">
            <img src={ticket.image} alt="" />
            <div>
              <b>{ticket.title}</b>
              <span>{ticket.when}</span>
              <span>{ticket.place}</span>
              <span>
                {ticket.code} · {ticket.tier === "vip" ? "VIP" : "Standart"} · {formatMoney(ticket.price, "UZS")}
              </span>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
