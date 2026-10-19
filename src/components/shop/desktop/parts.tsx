"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Headphones, MessageCircle, Minus, Plus, ShieldCheck, Star, Trash2, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { shopClear, shopRemove, shopSetQty, som, type ShopLine } from "./shop-cart";
import { deliveryFee } from "@/data/checkout-pricing";

export function Stars({ value, reviews }: { value: number; reviews?: number }) {
  return (
    <span className="dk-meta">
      <Star className="i" />
      <b>{value.toFixed(1)}</b>
      {reviews != null ? <span>({reviews} ta sharh)</span> : null}
    </span>
  );
}

export function Stepper({ qty, onChange }: { qty: number; onChange: (qty: number) => void }) {
  return (
    <span className="dk-step">
      <button type="button" aria-label="Kamaytirish" onClick={() => onChange(qty - 1)}>
        <Minus className="i" style={{ width: "0.7em", height: "0.7em" }} />
      </button>
      <span>{qty}</span>
      <button type="button" aria-label="Ko‘paytirish" onClick={() => onChange(qty + 1)}>
        <Plus className="i" style={{ width: "0.7em", height: "0.7em" }} />
      </button>
    </span>
  );
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 100_000,
  labels,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  step?: number;
  labels?: [string, string];
}) {
  const [lo, hi] = value;
  const left = ((lo - min) / (max - min)) * 100;
  const right = 100 - ((hi - min) / (max - min)) * 100;
  return (
    <div>
      <div className="dk-range">
        <div className="rail" />
        <div className="fill" style={{ left: `${left}%`, right: `${right}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label="Eng past narx"
          onChange={(event) => onChange([Math.min(Number(event.target.value), hi), hi])}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label="Eng yuqori narx"
          onChange={(event) => onChange([lo, Math.max(Number(event.target.value), lo)])}
        />
      </div>
      <div className="dk-range-labs">
        <span>{labels?.[0] ?? "0"}</span>
        <span>{labels?.[1] ?? "50 000 000"}</span>
      </div>
    </div>
  );
}

const perks = [
  [ShieldCheck, "Rasmiy distribyutor mahsulotlari", "100% original mahsulotlar"],
  [Check, "Xavfsiz to‘lov", "Click, Payme, Uzum, Paynet"],
] as const;

export function CartRail({ lines }: { lines: ShopLine[] }) {
  const router = useRouter();
  const real = useCart();
  const [chat, setChat] = useState(false);
  const [text, setText] = useState("");
  const [log, setLog] = useState<{ me?: boolean; text: string }[]>([
    { text: "Assalomu alaykum! Qanday yordam bera olamiz?" },
  ]);
  const qty = lines.reduce((sum, line) => sum + line.qty, 0);
  const sub = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const fee = deliveryFee(sub);

  function checkout() {
    // Lines already live in the real cart — just check out all of them.
    real.setAllSelected(true);
    router.push("/checkout");
  }

  return (
    <aside>
      <section className="dk-cart" data-testid="shop-cart">
        <div className="hd">
          <h3>Savatim ({lines.length})</h3>
          <button type="button" className="dk-link" onClick={() => shopClear()}>
            Barchasini tozalash
          </button>
        </div>
        {lines.length === 0 ? <p className="dk-sub">Savat bo‘sh. Mahsulot qo‘shing.</p> : null}
        {lines.map((line) => (
          <div className="dk-line" key={line.key ?? line.id}>
            <img src={line.image} alt="" />
            <div className="info">
              <b>{line.name}</b>
              {line.variant ? <span className="var">{line.variant}</span> : null}
              <small>{som(line.price)}</small>
            </div>
            <Stepper qty={line.qty} onChange={(next) => shopSetQty(line.key ?? line.id, next)} />
            <button type="button" className="dk-x" aria-label="O‘chirish" onClick={() => shopRemove(line.key ?? line.id)}>
              <Trash2 className="i" />
            </button>
          </div>
        ))}
        <div className="dk-sum">
          <div>
            <span>Mahsulotlar ({qty} ta)</span>
            <b>{som(sub)}</b>
          </div>
          <div>
            <span>Yetkazib berish</span>
            <b>{som(fee)}</b>
          </div>
          <div className="tot">
            <span>Jami summa</span>
            <span>{som(sub + fee)}</span>
          </div>
        </div>
        <button type="button" className="dk-checko" onClick={checkout} disabled={lines.length === 0}>
          Rasmiylashtirish <ArrowRight className="i" />
        </button>
      </section>
      <div className="dk-perks">
        {perks.map(([Icon, title, text]) => (
          <div className="dk-perk" key={title}>
            <span className="ic">
              <Icon className="i" />
            </span>
            <span>
              <b>{title}</b>
              <small>{text}</small>
            </span>
          </div>
        ))}
      </div>
      <section className="dk-box dk-help">
        <div>
          <b>Savolingiz bormi?</b>
          <small>Biz yordam berishga tayyormiz!</small>
          <button type="button" className="dk-chatbtn" onClick={() => setChat(true)}>
            <Headphones className="i" /> Onlayn chat
          </button>
        </div>
        <img src="/img/shop/support.jpg" alt="" />
      </section>
      {chat ? (
        <div className="dk-chat" role="dialog" aria-label="Onlayn chat">
          <header>
            Onlayn chat
            <button type="button" aria-label="Yopish" onClick={() => setChat(false)}>
              <X className="i" />
            </button>
          </header>
          <div className="log">
            {log.map((item, index) => (
              <div className={item.me ? "msg me" : "msg"} key={index}>
                {item.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const value = text.trim();
              if (!value) return;
              setLog((current) => [...current, { me: true, text: value }, { text: "Rahmat! Operator tez orada javob beradi." }]);
              setText("");
            }}
          >
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Xabar yozing..." aria-label="Xabar" />
            <button type="submit">
              <MessageCircle className="i" />
            </button>
          </form>
        </div>
      ) : null}
    </aside>
  );
}

export function CheckRow({ on, label, count, onClick }: { on: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button type="button" className={on ? "dk-check on" : "dk-check"} onClick={onClick}>
      <span className="dk-boxi">{on ? <Check className="i" /> : null}</span>
      <span>{label}</span>
      {count != null ? <em>{count.toLocaleString("ru-RU")}</em> : null}
    </button>
  );
}

export function RadioRow({ on, label, count, onClick }: { on: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button type="button" className={on ? "dk-radio on" : "dk-radio"} onClick={onClick}>
      <span className="dot" />
      <span>{label}</span>
      {count != null ? <em style={{ marginLeft: "auto", color: "#90a0b5", fontStyle: "normal" }}>{count.toLocaleString("ru-RU")}</em> : null}
    </button>
  );
}

export function Drop({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className={open ? "dk-drop on" : "dk-drop"}>
      <button type="button" onClick={onToggle}>
        {label}
      </button>
      {open ? <div className="dk-pop">{children}</div> : null}
    </div>
  );
}
