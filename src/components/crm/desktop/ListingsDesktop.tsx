"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { CrmFrame } from "@/components/crm/desktop/CrmFrame";
import { getListing, type Listing } from "@/data/listings";
import { classifiedToListing, type ClassifiedRow } from "@/lib/classified-view";
import { instagramHref, instagramValue, sourceUrlValue } from "@/lib/add-forms";
import { useStoredList } from "@/lib/stored-list";
import "./listings-desktop.css";

export function ListingDetailDesktop({ id }: { id: string }) {
  const [extra] = useStoredList("sk-elonlar-v1", [] as Listing[]);
  const [remote, setRemote] = useState<Listing | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancel = false;
    void fetch(`/api/work/classifieds/${id}`).then(async (res) => {
      const data = await res.json().catch(() => null) as { item?: ClassifiedRow } | null;
      if (!cancel && data?.item) setRemote(classifiedToListing(data.item));
      if (!cancel) setReady(true);
    }).catch(() => { if (!cancel) setReady(true); });
    return () => { cancel = true; };
  }, [id]);
  const item = remote ?? getListing(id, extra);
  if (!item && !ready) {
    return (
      <CrmFrame active="listings" listings placeholder="E‘lonlar bo‘yicha qidiring...">
        <div className="crm-empty">Yuklanmoqda…</div>
      </CrmFrame>
    );
  }
  if (!item) {
    return (
      <CrmFrame active="listings" listings placeholder="E‘lonlar bo‘yicha qidiring...">
        <div className="crm-empty">E’lon topilmadi</div>
      </CrmFrame>
    );
  }
  return (
    <CrmFrame active="listings" listings placeholder="E‘lonlar bo‘yicha qidiring...">
      <div data-testid="listing-detail">
        <Link href="/elonlar" className="crm-btn">Orqaga</Link>
        <div className="crm-split" style={{ marginTop: "calc(.4 * var(--u))", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,.8fr)" }}>
          <div className="crm-card">
            <img src={item.image} alt="" style={{ width: "100%", height: "calc(16 * var(--u))", objectFit: "cover" }} />
            <div style={{ padding: "calc(.6 * var(--u))" }}>
              <span className={`el-flag ${item.type}`} style={{ position: "static" }}>{item.typeLabel}</span>
              <h1 style={{ fontSize: "calc(1.2 * var(--u))", margin: "calc(.3 * var(--u)) 0" }}>{item.title}</h1>
              <p className="el-price">{item.priceLabel}</p>
              <p className="crm-muted">{item.city} · {item.dateLabel} · {item.views} ko‘rish</p>
              <p>{item.description}</p>
            </div>
          </div>
          <aside className="pl-box">
            <b>Bog‘lanish</b>
            <p className="crm-muted">E’lon egasi bilan chat yoki telefon orqali.</p>
            {item.phone ? <a className="crm-btn blue" href={`tel:${item.phone.replace(/\s/g, "")}`}>{item.phone}</a> : <p className="crm-muted">Telefon ko‘rsatilmagan.</p>}
            {item.telegram ? <a className="crm-btn" href={`https://t.me/${item.telegram.replace(/^@/, "")}`}>@{item.telegram.replace(/^@/, "")}</a> : null}
            {sourceUrlValue(item.sourceUrl ?? "") ? <a className="crm-btn" href={sourceUrlValue(item.sourceUrl ?? "")} target="_blank" rel="noopener nofollow" data-testid="listing-source">{sourceUrlValue(item.sourceUrl ?? "")}</a> : null}
            {instagramHref(item.instagram ?? "") ? <a className="crm-btn" href={instagramHref(item.instagram ?? "")} target="_blank" rel="noopener nofollow" data-testid="listing-instagram">{instagramValue(item.instagram ?? "")}</a> : null}
          </aside>
        </div>
      </div>
    </CrmFrame>
  );
}
