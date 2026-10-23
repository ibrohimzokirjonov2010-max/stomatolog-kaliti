"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Headphones, MessageCircle, Minus, Plus, ShieldCheck, Trash2, Truck, Undo2, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { FREE_DELIVERY_MIN_UZS, freeDeliveryText, returnWindowText } from "@/lib/commerce-terms";
import { shopDeliveryFee } from "@/lib/cart-totals";
import { shopClear, shopRemove, shopSetQty, som, useShopCart } from "./shop-cart";

export function MarketRail() {
  const router = useRouter();
  const lines = useShopCart();
  const cart = useCart();
  const [chat, setChat] = useState(false);
  const [text, setText] = useState("");
  const [log, setLog] = useState<{ me?: boolean; text: string }[]>([{ text: "Assalomu alaykum! Qanday yordam bera olamiz?" }]);
  const qty = lines.reduce((sum, line) => sum + line.qty, 0);
  const sub = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const products = cart.items.map((item) => item.product);
  const fee = shopDeliveryFee(products);
  const allFree = products.length > 0 && products.every((item) => item.attrs?.freeDelivery === true);
  const official = products.some((item) => item.attrs?.official === true);

  const perks: { icon: typeof Truck; title: string; text: string }[] = [];
  if (FREE_DELIVERY_MIN_UZS > 0) perks.push({ icon: Truck, title: "Yetkazib berish", text: freeDeliveryText() });
  if (official) perks.push({ icon: ShieldCheck, title: "Rasmiy distribyutor mahsulotlari", text: "Savatdagi belgilangan mahsulotlar" });
  perks.push({ icon: Banknote, title: "Naqd to‘lov", text: "Yetkazib berilganda" });
  perks.push({ icon: Undo2, title: returnWindowText(), text: "Sifat kafolati" });

  return (
    <aside className="mpx-rail">
      <section className="mpx-cartbox" data-testid="shop-cart">
        <div className="hd">
          <h3>Savatim ({lines.length})</h3>
          {lines.length ? (
            <button type="button" className="clear" onClick={() => shopClear()}>
              Barchasini tozalash
            </button>
          ) : null}
        </div>
        {lines.length === 0 ? <p className="mpx-spec">Savat bo‘sh. Mahsulot qo‘shing.</p> : null}
        {lines.map((line) => (
          <div className="mpx-line" key={line.id}>
            <img src={line.image || "/images/product-composite.png"} alt="" />
            <div>
              <b>{line.name}</b>
              <small>{som(line.price)}</small>
              <span className="mpx-step">
                <button type="button" aria-label="Kamaytirish" onClick={() => shopSetQty(line.id, line.qty - 1)}>
                  <Minus className="i" />
                </button>
                <span>{line.qty}</span>
                <button type="button" aria-label="Ko‘paytirish" onClick={() => shopSetQty(line.id, line.qty + 1)}>
                  <Plus className="i" />
                </button>
              </span>
            </div>
            <button type="button" className="mpx-x" aria-label="O‘chirish" onClick={() => shopRemove(line.id)}>
              <Trash2 className="i" />
            </button>
          </div>
        ))}
        <div className="mpx-sum">
          <div>
            <span>Mahsulotlar ({qty} ta)</span>
            <b>{som(sub)}</b>
          </div>
          <div>
            <span>Yetkazib berish</span>
            <b>{allFree ? "Bepul" : som(fee)}</b>
          </div>
          <div className="tot">
            <span>Jami summa</span>
            <span>{som(sub + (allFree ? 0 : fee))}</span>
          </div>
        </div>
        <button type="button" className="mpx-checko" disabled={lines.length === 0} onClick={() => router.push("/savat/rasmiylashtirish")}>
          Rasmiylashtirish →
        </button>
      </section>
      <div className="mpx-perks">
        {perks.map((perk) => (
          <div className="mpx-perk" key={perk.title}>
            <span className="ic">
              <perk.icon className="i" />
            </span>
            <span>
              <b>{perk.title}</b>
              <small>{perk.text}</small>
            </span>
          </div>
        ))}
      </div>
      <section className="mpx-help">
        <img src="/img/shop/support.jpg" alt="" />
        <div>
          <b>Savolingiz bormi?</b>
          <small>Biz yordam berishga tayyormiz!</small>
          <button type="button" className="mpx-chatbtn" onClick={() => setChat(true)}>
            <Headphones className="i" /> Onlayn chat
          </button>
        </div>
      </section>
      {chat ? (
        <div className="mpx-chat" role="dialog" aria-label="Onlayn chat">
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
              const next = text.trim();
              if (!next) return;
              setLog((current) => [...current, { me: true, text: next }, { text: "Qabul qildik. Operator tez orada javob beradi." }]);
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
