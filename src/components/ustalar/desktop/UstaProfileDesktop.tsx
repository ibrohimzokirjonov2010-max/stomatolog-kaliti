"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Cog,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Star,
  Timer,
  X,
} from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { useUstaWork } from "@/components/usta-provider";
import { getDesktopUsta } from "@/data/desktop-ustalar";
import { useEscape, useUstaActions } from "./UstaActions";
import { initials, masterToView, type UstaView } from "./usta-view";
import "./usta.css";

/** Brand names written the way the brands style them (text marks, not logo files). */
const brandClass: Record<string, string> = {
  Sirona: "sirona", KaVo: "kavo", Fengdan: "fengdan", "W&H": "wh", NSK: "nsk", Planmeca: "planmeca", Carestream: "carestream", Vatech: "vatech", Melag: "melag", "3Shape": "shape",
};

export function UstaProfileDesktop({ slug }: { slug: string }) {
  const { masters, mastersReady } = useUstaWork();
  const sample = getDesktopUsta(slug);
  const master = sample ? undefined : masters.find((item) => item.id === slug);
  const cartCount = useShopLineCount();
  if (sample) return <View usta={sample} />;
  if (master) return <View usta={masterToView(master)} />;
  return (
    <ShopShell searchPath="/ustalar" cartCount={cartCount} placeholder="Usta, xizmat yoki brend bo‘yicha qidiring..." showCamera={false}>
      <div className="usp-missing" data-testid="usta-missing">
        {mastersReady ? (
          <>
            <b>Usta topilmadi</b>
            <p>Profil o‘chirilgan yoki hali moderatsiyadan o‘tmagan bo‘lishi mumkin.</p>
            <Link href="/ustalar" className="us-btn">Ustalar ro‘yxati</Link>
          </>
        ) : (
          <p>Yuklanmoqda…</p>
        )}
      </div>
    </ShopShell>
  );
}

function View({ usta }: { usta: UstaView }) {
  const cartCount = useShopLineCount();
  const actions = useUstaActions();
  const [works, setWorks] = useState<number | null>(null);
  const [allWorks, setAllWorks] = useState(false);
  const [allReviews, setAllReviews] = useState(false);
  const real = Boolean(usta.master);
  useEscape(works !== null, () => setWorks(null));
  const shownWorks = usta.works.slice(0, 6);

  return (
    <ShopShell searchPath="/ustalar" cartCount={cartCount} placeholder="Usta, xizmat yoki brend bo‘yicha qidiring..." showCamera={false}>
      <div className="usp" data-testid="usta-profile">
        <nav className="usp-crumbs" aria-label="Breadcrumb">
          <Link href="/ustalar">Xizmatlar</Link><ChevronRight className="i" />
          <Link href="/ustalar">Ustalar</Link><ChevronRight className="i" />
          <b>{usta.name}</b>
        </nav>

        <section className="usp-top">
          <div className="usp-photo">{usta.image ? <img src={usta.image} alt={usta.name} /> : <span className="us-initials big">{initials(usta.name)}</span>}</div>
          <div className="usp-info">
            <h1>{usta.name} <span className="usp-verified"><BadgeCheck className="i" /> {real ? "Moderatsiyadan o‘tgan" : "Tasdiqlangan"}</span></h1>
            <p className="usp-role">{usta.role}</p>
            <ul className="usp-meta">
              <li><MapPin className="i" /> {usta.district ? `${usta.city}, ${usta.district}` : usta.city}</li>
              <li><BadgeCheck className="i" /> {usta.years} yil tajriba</li>
              <li><BriefcaseBusiness className="i" /> {usta.jobs} bajarilgan ish</li>
              {usta.response ? <li><Timer className="i" /> Javob vaqti: {usta.response}</li> : null}
            </ul>
            <p className="usp-rate">
              {usta.rating ? <><Star className="i star" /> <b>{usta.rating.toFixed(1)}</b> <span>({usta.reviews} sharh)</span></> : <><Star className="i none" /> <span>Hali baho yo‘q</span></>}
            </p>
            <div className="usp-cta">
              <button type="button" className="us-btn" onClick={() => actions.open("call", usta)}><Phone className="i" /> Qo‘ng‘iroq qilish</button>
              <button type="button" className="us-btn" onClick={() => actions.open("order", usta)}><Calendar className="i" /> Buyurtma berish</button>
              <button type="button" className="us-ghost navy" onClick={() => actions.open("telegram", usta)}><Send className="i" /> Xabar yozish</button>
            </div>
            <h3>Mutaxassislik va ko‘nikmalar</h3>
            <div className="usp-chips">{(usta.skills.length ? usta.skills : usta.tags).map((skill) => <span key={skill}>{skill}</span>)}</div>
            {usta.brands.length ? (
              <>
                <h3>Brendlar bo‘yicha tajriba</h3>
                <div className="usp-brands">{usta.brands.map((brand) => <span key={brand} className={brandClass[brand] ?? ""}>{brand}</span>)}</div>
              </>
            ) : usta.about ? (
              <>
                <h3>Usta haqida</h3>
                <p className="usp-about">{usta.about}</p>
              </>
            ) : null}
          </div>
        </section>

        <aside className="usp-rail">
          <section className="us-box usp-side">
            <h3><span className="ic"><Clock3 className="i" /></span> Ish vaqti</h3>
            {usta.hours ? (
              <dl>
                <div><dt>Dushanba – Shanba</dt><dd>{usta.hours.replace("–", " – ")}</dd></div>
                <div><dt><b>Yakshanba</b></dt><dd>{usta.weekend}</dd></div>
              </dl>
            ) : <p className="us-muted">Ish vaqti so‘rov yuborilganda kelishiladi.</p>}
          </section>
          <section className="us-box usp-side">
            <h3><span className="ic"><MapPin className="i" /></span> Xizmat hududi</h3>
            {(usta.areas.length ? usta.areas : [{ place: usta.district ? `${usta.city}, ${usta.district}` : usta.city, time: "" }]).map((area, index) => (
              <div className="usp-area" key={area.place}>
                {index === 0 ? <Building2 className="i" /> : index === 1 ? <Timer className="i" /> : <MapPin className="i" />}
                <span>{area.place}</span>
                {area.time ? <em className={index === 0 ? "fast" : undefined}>{index === 0 ? "⚡ " : ""}{area.time}</em> : null}
              </div>
            ))}
          </section>
          <section className="us-box usp-side usp-warranty">
            <h3><span className="ic solid"><ShieldCheck className="i" /></span> Kafolat</h3>
            {usta.warranty ? (
              <>
                <p>Bajarilgan ishlar uchun <b>{usta.warranty} kafolat</b></p>
                <small>Agar muammo takrorlansa, bepul xizmat ko‘rsatish.</small>
              </>
            ) : <p className="us-muted">Kafolat shartlari usta bilan kelishiladi.</p>}
          </section>
        </aside>

        <section className="us-box usp-services">
          <h3 className="usp-h"><Cog className="i" /> Xizmatlar va narxlar</h3>
          {usta.serviceRows.length ? (
            <table className="usp-table">
              <thead><tr><th>Xizmat turi</th><th>Narx (so‘m)</th><th>Izoh</th></tr></thead>
              <tbody>{usta.serviceRows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.price}</td><td>{row.note}</td></tr>)}</tbody>
            </table>
          ) : (
            <div className="usp-empty">
              <p>Narxlar ish hajmi va jihoz modeliga qarab so‘rovda kelishiladi.</p>
              <button type="button" className="us-btn" onClick={() => actions.open("order", usta)}>So‘rov yuborish</button>
            </div>
          )}
        </section>

        <section className="us-box usp-works">
          <div className="usp-h-row">
            <h3 className="usp-h"><Camera className="i" /> Bajarilgan ishlar</h3>
            {usta.works.length ? <button type="button" className="usp-link" onClick={() => setAllWorks(true)}>Barchasini ko‘rish <ArrowRight className="i" /></button> : null}
          </div>
          {shownWorks.length ? (
            <div className="usp-grid">
              {shownWorks.map((src, index) => (
                <button key={src + index} type="button" aria-label={`Ish rasmi ${index + 1}`} onClick={() => setWorks(index)}><img src={src} alt="" loading="lazy" /></button>
              ))}
            </div>
          ) : <p className="us-muted">Usta hali ish rasmlarini qo‘shmagan.</p>}
        </section>

        <section className="us-box usp-reviews">
          <div className="usp-h-row">
            <h3 className="usp-h"><Star className="i star" /> Sharhlar <span>({usta.reviews})</span></h3>
            {usta.reviewList.length ? <button type="button" className="usp-link" onClick={() => setAllReviews(true)}>Barchasini ko‘rish <ArrowRight className="i" /></button> : null}
          </div>
          {usta.reviewList.length ? (
            <div className="usp-revs">{usta.reviewList.slice(0, 4).map((review) => <Review key={review.name} review={review} />)}</div>
          ) : <p className="us-muted">Hali sharh yo‘q. Usta bilan ishlagan klinikalar sharhi shu yerda chiqadi.</p>}
        </section>

        <section className="us-box usp-dist">
          <h3><Star className="i green" /> Reyting taqsimoti</h3>
          {usta.stars.length ? (
            <>
              <p className="big"><Star className="i star" /> <b>{usta.rating.toFixed(1)}</b> / 5 <small>{usta.reviews} sharh asosida</small></p>
              {usta.stars.map((value, index) => (
                <div className="usp-bar" key={index}><span>{5 - index} <Star className="i star" /></span><i><b style={{ width: `${value}%` }} /></i><em>{value}%</em></div>
              ))}
            </>
          ) : <p className="us-muted">Baholar birinchi sharhlardan keyin ko‘rinadi.</p>}
        </section>

        {works !== null ? (
          <div className="us-modal" role="dialog" aria-modal="true" aria-label="Ish rasmi" onMouseDown={(event) => event.target === event.currentTarget && setWorks(null)} onKeyDown={(event) => { if (event.key === "ArrowRight") setWorks((works + 1) % usta.works.length); if (event.key === "ArrowLeft") setWorks((works - 1 + usta.works.length) % usta.works.length); }}>
            <div className="usp-lightbox">
              <img src={usta.works[works]} alt={`Ish rasmi ${works + 1}`} />
              <button type="button" className="nav l" aria-label="Oldingi" onClick={() => setWorks((works - 1 + usta.works.length) % usta.works.length)}><ChevronLeft className="i" /></button>
              <button type="button" className="nav r" aria-label="Keyingi" onClick={() => setWorks((works + 1) % usta.works.length)}><ChevronRight className="i" /></button>
              <button type="button" className="close" aria-label="Yopish" onClick={() => setWorks(null)}><X className="i" /></button>
              <span className="count">{works + 1} / {usta.works.length}</span>
            </div>
          </div>
        ) : null}

        {allWorks ? (
          <Dialog title={`Bajarilgan ishlar · ${usta.works.length}`} onClose={() => setAllWorks(false)}>
            <div className="usp-grid all">{usta.works.map((src, index) => <button key={src + index} type="button" aria-label={`Ish rasmi ${index + 1}`} onClick={() => { setAllWorks(false); setWorks(index); }}><img src={src} alt="" /></button>)}</div>
          </Dialog>
        ) : null}

        {allReviews ? (
          <Dialog title={`Sharhlar (${usta.reviews})`} onClose={() => setAllReviews(false)}>
            <div className="usp-revs col">{usta.reviewList.map((review) => <Review key={review.name} review={review} />)}</div>
            {usta.reviews > usta.reviewList.length ? <p className="us-muted">So‘nggi {usta.reviewList.length} ta sharh ko‘rsatilgan.</p> : null}
          </Dialog>
        ) : null}

        {actions.node}
      </div>
    </ShopShell>
  );
}

function Review({ review }: { review: UstaView["reviewList"][number] }) {
  return (
    <article className="usp-rev">
      <div className="hd">
        {review.avatar ? <img src={review.avatar} alt="" /> : <span className="us-initials sm">{initials(review.name)}</span>}
        <span><b>{review.name}</b><small>{review.clinic}</small></span>
        <time>{review.date}</time>
      </div>
      <span className="stars" aria-label={`${review.rating} yulduz`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={i < review.rating ? "i on" : "i"} />)}</span>
      <p>{review.text}</p>
    </article>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEscape(true, onClose);
  return (
    <div className="us-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="us-dialog wide">
        <div className="us-dialog-hd">
          <h3>{title}</h3>
          <button type="button" className="x" aria-label="Yopish" onClick={onClose}><X className="i" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
