"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Building2,
  FileText,
  Info,
  Link2,
  ShoppingBag,
  Trash2,
  User,
} from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import "./hisobni-ochirish-mobile.css";

const ITEMS = [
  { icon: User, title: "Profil ma’lumotlari", text: "Ism, telefon raqam, email, rasm va bio" },
  { icon: ShoppingBag, title: "E’lonlar va rezyume", text: "Barcha e’lonlaringiz, vakansiyalar va rezyume" },
  { icon: FileText, title: "Laboratoriya va usta profillari", text: "Yaratilgan barcha laboratoriya va usta profillari" },
  { icon: Building2, title: "Klinika ma’lumotlari", text: "Klinika bemorlari, xodimlari va bildirishnomalar" },
  { icon: Link2, title: "Google/Telegram bog‘lanishi", text: "Hisobga ulangan kirish usullari" },
];

/** Phone view of /hisobni-ochirish for a signed-in doctor; everyone else (and desktop) gets the legal page passed as children. */
export function HisobniOchirishSwitch({ contactHref, children }: { contactHref: string | null; children: ReactNode }) {
  const { ready, profile } = useDoctorProfile();
  if (!ready || !profile) return <>{children}</>;
  return (
    <>
      <HisobniOchirishMobile contactHref={contactHref} />
      <div className="hidden lg:block">{children}</div>
    </>
  );
}

function HisobniOchirishMobile({ contactHref }: { contactHref: string | null }) {
  const router = useRouter();
  const { profile } = useDoctorProfile();
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    if (busy) return;
    if (!agree) {
      setError("Avval tasdiqlash belgisini qo‘ying.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/privacy-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ scope: "hisob", name: profile?.fullName ?? "", phone: profile?.phone ?? "", email: profile?.email ?? "", message: "", website: "" }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; errors?: Record<string, string> } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? Object.values(json?.errors ?? {})[0] ?? "So‘rovni yuborib bo‘lmadi. Qayta urinib ko‘ring.");
        return;
      }
      setDone(true);
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ho lg:hidden" data-testid="mobile-hisobni-ochirish">
      <header className="ho-bar">
        <Link href="/profil" className="ho-back" aria-label="Orqaga"><ArrowLeft /></Link>
        <Link href="/" className="ho-logo">STOMA<span>HUB</span></Link>
        <span className="ho-gap" />
      </header>
      <div className="ho-body">
        <h1>Hisobni o‘chirish</h1>
        <p className="ho-lead">Hisobingizni butunlay o‘chirishni tasdiqlang</p>

        <section className="ho-alert">
          <div className="ho-art" aria-hidden>
            <span className="ho-bin"><Trash2 /></span>
            <span className="ho-warn"><AlertTriangle /></span>
          </div>
          <div>
            <b>Diqqat!</b>
            <p>Hisobingiz o‘chirilgach, ma’lumotlaringiz butunlay o‘chiriladi va ularni qayta tiklab bo‘lmaydi.</p>
          </div>
        </section>

        <section className="ho-card">
          <h2>Nimalar o‘chiriladi?</h2>
          <ul>
            {ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title}>
                  <i><Icon /></i>
                  <span><b>{item.title}</b><small>{item.text}</small></span>
                </li>
              );
            })}
          </ul>
          <p className="ho-keep">
            Buyurtma, to‘lov va nizo yozuvlari qonun talabi bilan belgilangan muddatgacha saqlanishi mumkin.{" "}
            <Link href="/maxfiylik">Batafsil</Link>
          </p>
        </section>

        {contactHref ? (
          <a href={contactHref} className="ho-note" rel="noreferrer">
            <Info />
            <span><b>E’tibor bering</b><small>Hisobingiz bilan bog‘liq muammo bo‘lsa, uni o‘chirish o‘rniga biz bilan bog‘laning. Biz yordam berishga tayyormiz.</small></span>
            <ChevronRight />
          </a>
        ) : null}

        {done ? (
          <section className="ho-done" data-testid="privacy-done">
            <CheckCircle2 />
            <b>So‘rovingiz yuborildi</b>
            <p>Administrator ko‘rib chiqadi va hisobingiz o‘chirilgach bildirishnoma olasiz. Tugallanmagan buyurtma bo‘lsa, avval u yakunlanadi.</p>
          </section>
        ) : (
          <>
            <label className="ho-check">
              <input type="checkbox" checked={agree} onChange={(event) => { setAgree(event.target.checked); setError(""); }} />
              <i aria-hidden><Check /></i>
              <span><b>Men hisobimni o‘chirishni tasdiqlayman</b><small>Men barcha ma’lumotlarim butunlay o‘chirilishini va ularni qayta tiklab bo‘lmasligini tushundim.</small></span>
            </label>
            {error ? <p role="alert" className="ho-error">{error}</p> : null}
            <button type="button" className="ho-delete" disabled={busy} onClick={() => void submit()}>
              <Trash2 /> {busy ? "Yuborilmoqda…" : "Hisobni o‘chirish"}
            </button>
            <button type="button" className="ho-cancel" onClick={() => router.push("/profil")}>Bekor qilish</button>
          </>
        )}
      </div>
    </div>
  );
}
