"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Info, Phone, Send, ShieldCheck, UserPlus, X } from "lucide-react";
import { UstaRequestSheet } from "@/components/usta-request-sheet";
import { useUstaWork } from "@/components/usta-provider";
import { phoneHref, telegramHref } from "@/data/masters";
import type { UstaRequestDraft, UstaView } from "./usta-view";

type Kind = "call" | "telegram" | "order";

/** Close a dialog with Escape wherever focus is. */
export function useEscape(active: boolean, onEscape: () => void) {
  const ref = useRef(onEscape);
  useEffect(() => {
    ref.current = onEscape;
  });
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") ref.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);
}
type State = { kind: Kind; usta: UstaView; draft?: UstaRequestDraft } | null;

/**
 * Contact + order actions shared by the desktop catalog and profile.
 * - Database masters: orders go through the real request sheet (POST /api/work/masters/requests); phone and Telegram
 *   are revealed only after the master accepts a request (the server returns them on the request).
 * - Design samples: nothing is sent and no phone number is shown — the dialog says so plainly.
 */
export function useUstaActions() {
  const { requests } = useUstaWork();
  const [state, setState] = useState<State>(null);
  const [sheet, setSheet] = useState<{ usta: UstaView; draft?: UstaRequestDraft } | null>(null);

  function open(kind: Kind, usta: UstaView, draft?: UstaRequestDraft) {
    if (kind === "order" && usta.master && !usta.master.mine) {
      setSheet({ usta, draft });
      return;
    }
    setState({ kind, usta, draft });
  }

  const close = () => setState(null);
  useEscape(Boolean(state), close);
  let modal: ReactNode = null;

  if (state) {
    const { usta, kind } = state;
    const master = usta.master;
    const mine = requests.filter((item) => item.masterId === master?.id);
    const accepted = mine.find((item) => item.masterPhone);
    const pending = mine.find((item) => item.status === "yuborildi");
    let body: ReactNode;
    if (!master) {
      body = (
        <>
          <p className="us-lead"><Info className="i" /> <b>{usta.name}</b> — namuna profil.</p>
          <p>Bu profil sahifa dizaynini ko‘rsatish uchun qo‘yilgan: unga so‘rov yuborilmaydi va telefon raqami ko‘rsatilmaydi.</p>
          <p>Moderatsiyadan o‘tgan haqiqiy ustalar ro‘yxatning boshida chiqadi va ularga so‘rov to‘g‘ridan-to‘g‘ri yuboriladi.</p>
          <div className="us-acts">
            <Link href="/ustalar/mening" className="us-ghost"><UserPlus className="i" /> Usta sifatida ro‘yxatdan o‘tish</Link>
            <button type="button" className="us-btn" onClick={close}>Tushunarli</button>
          </div>
        </>
      );
    } else if (master.mine) {
      body = (
        <>
          <p>Bu sizning usta profilingiz. Kelgan so‘rovlarni “Mening profilim” sahifasida ko‘rasiz.</p>
          <div className="us-acts">
            <Link href="/ustalar/mening" className="us-btn">Mening profilim</Link>
          </div>
        </>
      );
    } else if (accepted) {
      body = (
        <>
          <p className="us-lead"><ShieldCheck className="i" /> {usta.name} so‘rovingizni qabul qilgan.</p>
          <div className="us-contact">
            {accepted.masterPhone ? <a href={phoneHref(accepted.masterPhone)} className="us-btn"><Phone className="i" /> {accepted.masterPhone}</a> : null}
            {accepted.masterTelegram ? <a href={telegramHref(accepted.masterTelegram)} target="_blank" rel="noreferrer" className="us-ghost"><Send className="i" /> Telegram</a> : null}
          </div>
        </>
      );
    } else {
      body = (
        <>
          <p className="us-lead"><ShieldCheck className="i" /> {kind === "telegram" ? "Telegram" : "Telefon raqami"} usta so‘rovingizni qabul qilgandan keyin ochiladi.</p>
          <p>Bu ustalarni va klinikalarni keraksiz qo‘ng‘iroqlardan himoya qiladi. So‘rov yuboring — usta qabul qilsa, bildirishnoma olasiz.</p>
          {pending ? <p className="us-note">So‘rovingiz yuborilgan, usta javobini kutmoqda. <Link href="/ustalar/sorovlarim">Mening so‘rovlarim</Link></p> : null}
          <div className="us-acts">
            <button type="button" className="us-ghost" onClick={close}>Yopish</button>
            <button type="button" className="us-btn" onClick={() => { setState(null); setSheet({ usta, draft: state.draft }); }}>So‘rov yuborish</button>
          </div>
        </>
      );
    }
    const title = kind === "order" ? "Buyurtma berish" : kind === "telegram" ? "Xabar yozish" : "Qo‘ng‘iroq";
    modal = (
      <div className="us-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.target === event.currentTarget && close()}>
        <div className="us-dialog">
          <div className="us-dialog-hd">
            <h3>{title}</h3>
            <button type="button" className="x" aria-label="Yopish" onClick={close}><X className="i" /></button>
          </div>
          {body}
        </div>
      </div>
    );
  }

  const node = (
    <>
      {modal}
      {sheet?.usta.master ? <UstaRequestSheet master={sheet.usta.master} onClose={() => setSheet(null)} /> : null}
    </>
  );

  return { open, node };
}
