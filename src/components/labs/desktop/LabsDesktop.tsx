"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Briefcase,
  ChevronDown,
  ClipboardList,
  Clock,
  FlaskConical,
  Gem,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { Modal, OrderForm } from "@/components/lab-browse";
import { useLabWork } from "@/components/lab-provider";
import { labMaterialFilters, labMaterialLabel, labServiceFilters, labServiceLabel, orderStatusSteps, type Lab, type LabMaterial, type LabService } from "@/data/labs";
import { formatGroupedNumber } from "@/lib/format";
import { orderStepIndex } from "@/lib/lab-work";
import "./labs-desktop.css";

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "LB";
}

function days(min: number | null, max: number | null) {
  if (min && max && min !== max) return `${min}–${max} kun`;
  if (min || max) return `${min ?? max} kun`;
  return "";
}

function LabRow({ lab, onOrder }: { lab: Lab; onOrder: () => void }) {
  const cover = lab.photo || lab.photos?.[0] || lab.portfolio?.[0] || "";
  const items = (lab.priceItems ?? []).slice(0, 3);
  const thumbs = items.length ? [] : (lab.portfolio ?? lab.photos ?? []).slice(0, 3);
  const perks = [
    lab.materials.length ? { icon: Gem, text: `${lab.materials.map(labMaterialLabel).join(", ")} materiallar` } : null,
    lab.days ? { icon: Clock, text: `Muddat: ${lab.days} kundan` } : null,
    lab.courier === "ha" ? { icon: Truck, text: lab.courierArea ? `Kuryer: ${lab.courierArea}` : "Kuryer orqali yetkazib berish" } : null,
    lab.services.includes("cadcam") ? { icon: FlaskConical, text: "Raqamli texnologiya (CAD/CAM)" } : null,
  ].filter(Boolean).slice(0, 3) as { icon: typeof Gem; text: string }[];
  return (
    <article className="lbx-row" data-testid="lab-row">
      <Link href={`/laboratoriya/${lab.id}`} className="lbx-ph">
        {cover ? <img src={cover} alt="" /> : <span className="ph-blank"><FlaskConical size={28} /></span>}
        <span className="logo">{lab.logo ? <img src={lab.logo} alt="" /> : initials(lab.name)}</span>
      </Link>
      <div className="lbx-info">
        <h3><Link href={`/laboratoriya/${lab.id}`}>{lab.name}</Link>{lab.verified ? <BadgeCheck size={16} className="ok" /> : null}</h3>
        <p><MapPin size={13} />{[lab.city, lab.district].filter(Boolean).join(", ") || "—"}</p>
        <p><Briefcase size={13} />{[lab.years ? `${lab.years} yil tajriba` : "", lab.done ? `${lab.done}+ buyurtma` : ""].filter(Boolean).join(" • ") || "Yangi laboratoriya"}</p>
        {lab.courier === "ha" ? <span className="tag">Tezkor yetkazib berish</span> : lab.online ? <span className="tag">Onlayn</span> : null}
      </div>
      <div className="lbx-svc">
        <div className="head"><b>Asosiy xizmatlar</b><Link href={`/laboratoriya/${lab.id}`}>Barchasi</Link></div>
        {items.length ? (
          <div className="items">
            {items.map((item) => (
              <div key={item.id}>
                <span className="th">{item.photo ? <img src={item.photo} alt="" /> : <FlaskConical size={20} />}</span>
                <b>{item.title}</b>
                <strong>{item.price ? `${formatGroupedNumber(item.price)} so‘m` : "Kelishiladi"}</strong>
                <small>{days(item.daysMin, item.daysMax)}</small>
              </div>
            ))}
          </div>
        ) : thumbs.length ? (
          <div className="items">{thumbs.map((src) => <div key={src}><span className="th"><img src={src} alt="" /></span></div>)}</div>
        ) : (
          <p className="chips">{lab.services.map((id) => <span key={id}>{labServiceLabel(id)}</span>)}</p>
        )}
      </div>
      <div className="lbx-side">
        {lab.priceFrom ? <p className="from">{formatGroupedNumber(lab.priceFrom)} so‘mdan</p> : null}
        <ul>{perks.map((perk) => <li key={perk.text}><perk.icon size={14} />{perk.text}</li>)}</ul>
        <button type="button" className="lbx-order" data-testid="lab-order" onClick={onOrder}><ShoppingCart size={16} /> Buyurtma berish</button>
      </div>
    </article>
  );
}

export function LabsDesktop() {
  const params = useSearchParams();
  const { labs, labsReady, latest } = useLabWork();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [city, setCity] = useState("");
  const [service, setService] = useState<LabService | "">("");
  const [material, setMaterial] = useState<LabMaterial | "">("");
  const [maxDays, setMaxDays] = useState("");
  const [order, setOrder] = useState<string | null>(null);

  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lab of labs) if (lab.city) counts.set(lab.city, (counts.get(lab.city) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [labs]);

  const shown = useMemo(() => {
    const mq = query.trim().toLowerCase();
    return labs.filter((lab) => {
      if (city && lab.city !== city) return false;
      if (service && !lab.services.includes(service)) return false;
      if (material && !lab.materials.includes(material)) return false;
      if (maxDays && !(lab.days !== null && lab.days <= Number(maxDays))) return false;
      if (!mq) return true;
      return [lab.name, lab.city, lab.description ?? "", ...lab.services.map(labServiceLabel), ...lab.materials.map(labMaterialLabel), ...(lab.priceItems ?? []).map((item) => item.title)].join(" ").toLowerCase().includes(mq);
    });
  }, [city, labs, material, maxDays, query, service]);

  const step = latest ? orderStepIndex(latest.status) : -1;

  function reset() {
    setQuery("");
    setCity("");
    setService("");
    setMaterial("");
    setMaxDays("");
  }

  return (
    <ClinicShell accent="teal">
      <div className="lbx" data-testid="labs-desktop">
        <div className="lbx-head">
          <div>
            <h1>Laboratoriyalar</h1>
            <p>Ishonchli dental laboratoriyalar: krona, viner, implant va protez buyurtmasi</p>
          </div>
          <div className="lbx-acts">
            <Link href="/laboratoriya/buyurtmalarim" className="lbx-ghost"><ClipboardList size={17} /> Mening buyurtmalarim</Link>
            <button type="button" className="lbx-primary" data-testid="lab-new-order" disabled={labsReady && labs.length === 0} onClick={() => setOrder("")}><Plus size={17} /> Yangi buyurtma</button>
          </div>
        </div>

        <div className="lbx-grid">
          <div className="lbx-main">
            <div className="lbx-tools">
              <label className="lbx-search"><Search size={16} /><input aria-label="Laboratoriya qidirish" placeholder="Laboratoriya yoki xizmat qidirish..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
              <label className="lbx-sel"><select aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}><option value="">Barcha shaharlar</option>{cities.map(([name]) => <option key={name}>{name}</option>)}</select><ChevronDown size={15} /></label>
              <label className="lbx-sel"><select aria-label="Xizmat" value={service} onChange={(event) => setService(event.target.value as LabService | "")}><option value="">Barcha xizmatlar</option>{labServiceFilters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={15} /></label>
              <label className="lbx-sel"><select aria-label="Material" value={material} onChange={(event) => setMaterial(event.target.value as LabMaterial | "")}><option value="">Barcha materiallar</option>{labMaterialFilters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={15} /></label>
              <label className="lbx-sel"><select aria-label="Muddat" value={maxDays} onChange={(event) => setMaxDays(event.target.value)}><option value="">Istalgan muddat</option><option value="3">3 kungacha</option><option value="5">5 kungacha</option><option value="7">7 kungacha</option></select><ChevronDown size={15} /></label>
            </div>

            {latest ? (
              <Link href="/laboratoriya/buyurtmalarim" className="lbx-status">
                <b>Oxirgi buyurtma</b>
                {orderStatusSteps.map((item, index) => <span key={item.id} className={index < step ? "done" : index === step ? "now" : undefined}><i />{item.title}</span>)}
              </Link>
            ) : null}

            {!labsReady ? <div className="lbx-empty">Yuklanmoqda…</div> : shown.length === 0 ? (
              <div className="lbx-empty">
                <b>{labs.length ? "Bu filtrda laboratoriya topilmadi" : "Hozircha laboratoriyalar yo‘q"}</b>
                {labs.length ? <button type="button" onClick={reset}>Filtrlarni tozalash</button> : <Link href="/laboratoriya/yangi">Laboratoriya sifatida qo‘shilish</Link>}
              </div>
            ) : (
              <div className="lbx-list">{shown.map((lab) => <LabRow key={lab.id} lab={lab} onOrder={() => setOrder(lab.id)} />)}</div>
            )}
          </div>

          <aside className="lbx-rail">
            <section>
              <h3>Kategoriyalar</h3>
              <button type="button" className={service === "" ? "on" : undefined} onClick={() => setService("")}><LayoutGrid size={15} /><span>Barcha laboratoriyalar</span><b>{labs.length}</b></button>
              {labServiceFilters.map((item) => (
                <button key={item.id} type="button" className={service === item.id ? "on" : undefined} onClick={() => setService(service === item.id ? "" : item.id)}><FlaskConical size={15} /><span>{item.label}</span><b>{labs.filter((lab) => lab.services.includes(item.id)).length}</b></button>
              ))}
            </section>
            {cities.length ? (
              <section>
                <h3>Shaharlar</h3>
                <button type="button" className={city === "" ? "on" : undefined} onClick={() => setCity("")}><MapPin size={15} /><span>Barchasi</span><b>{labs.length}</b></button>
                {cities.map(([name, count]) => (
                  <button key={name} type="button" className={city === name ? "on" : undefined} onClick={() => setCity(city === name ? "" : name)}><MapPin size={15} /><span>{name}</span><b>{count}</b></button>
                ))}
              </section>
            ) : null}
            <Link href="/laboratoriya/yangi" className="lbx-join">Laboratoriya sifatida e’lon berish</Link>
          </aside>
        </div>
      </div>
      {order !== null ? (
        <Modal title="Yangi buyurtma" onClose={() => setOrder(null)}>
          <OrderForm labs={labs} preselectLabId={order} onCancel={() => setOrder(null)} onSaved={() => setOrder(null)} />
        </Modal>
      ) : null}
    </ClinicShell>
  );
}
