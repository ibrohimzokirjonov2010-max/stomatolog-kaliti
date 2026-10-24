"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Headphones, MessageCircle, Minus, Plus, Star, Trash2, Truck, Undo2, X } from "lucide-react";
import { FREE_DELIVERY_MIN_UZS, freeDeliveryText, returnWindowText } from "@/lib/commerce-terms";
import { shopClear, shopRemove, shopSetQty, som, type ShopLine } from "./shop-cart";

export function Stars({ value, reviews }: { value: number; reviews?: number }) {
  if (!(reviews && reviews > 0) || !(value > 0)) return null;
  return (
    <span className="dk-meta">
      <Star className="i" />
      <b>{value.toFixed(1)}</b>
      <span>({reviews} ta sharh)</span>
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
  return (
    <div className="dk-range-labs" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        <span>{labels?.[0] ?? "Dan"}</span>
        <input
          type="number"
          min={min}
          max={hi}
          step={step}
          value={lo}
          aria-label="Eng past narx"
          onChange={(event) => onChange([Math.min(Number(event.target.value) || min, hi), hi])}
        />
      </label>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        <span>{labels?.[1] ?? "Gacha"}</span>
        <input
          type="number"
          min={lo}
          max={max}
          step={step}
          value={hi}
          aria-label="Eng yuqori narx"
          onChange={(event) => onChange([lo, Math.max(Number(event.target.value) || max, lo)])}
        />
      </label>
    </div>
  );
}

const perks = [
  ...(FREE_DELIVERY_MIN_UZS > 0 ? [[Truck, "Yetkazib berish", freeDeliveryText()] as const] : []),
  [Check, "Naqd to‘lov", "Yetkazib berilganda"] as const,
  [Undo2, returnWindowText(), "Sifat kafolati"] as const,
];

export function CartRail({ lines }: { lines: ShopLine[] }) {
  const router = useRouter();
  const [chat, setChat] = useState(false);
  const [text, setText] = useState("");
  const [log, setLog] = useState<{ me?: boolean; text: string }[]>([
    { text: "Assalomu alaykum! Qanday yordam bera olamiz?" },
  ]);
  const qty = lines.reduce((sum, line) => sum + line.qty, 0);
  const sub = lines.reduce((sum, line) => sum + line.price * line.qty, 0);

  function checkout() {
    router.push("/savat/rasmiylashtirish");
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
          <div className="dk-line" key={line.id}>
            <img src={line.image} alt="" />
            <div>
              <b>{line.name}</b>
              <small>{som(line.price)}</small>
              <Stepper qty={line.qty} onChange={(next) => shopSetQty(line.id, next)} />
            </div>
            <button type="button" className="dk-x" aria-label="O‘chirish" onClick={() => shopRemove(line.id)}>
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
            <b>savatda</b>
          </div>
          <div className="tot">
            <span>Jami (yetkazishsiz)</span>
            <span>{som(sub)}</span>
          </div>
        </div>
        <button type="button" className="dk-checko" onClick={checkout} disabled={lines.length === 0}>
          Rasmiylashtirish
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
        <img src="/img/shop/support.jpg" alt="" />
        <div>
          <b>Savolingiz bormi?</b>
          <small>Biz yordam berishga tayyormiz!</small>
          <button type="button" className="dk-chatbtn" onClick={() => setChat(true)}>
            <Headphones className="i" /> Onlayn chat
          </button>
        </div>
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

/** Two-line filter box (small label over the chosen value) backed by a native select. */
export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: (string | [string, string])[] }) {
  return (
    <label className="dk-field">
      <small>{label}</small>
      <select value={value} aria-label={label} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const [id, text] = typeof option === "string" ? [option, option] : option;
          return (
            <option key={id} value={id}>
              {text}
            </option>
          );
        })}
      </select>
      <ChevronDown className="i" />
    </label>
  );
}
