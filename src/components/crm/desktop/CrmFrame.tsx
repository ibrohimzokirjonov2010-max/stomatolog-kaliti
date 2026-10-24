"use client";

import { type FormEvent, type ReactNode } from "react";
import {
  Stethoscope,
  } from "lucide-react";
import { Search } from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { MarketFrame, type HeaderLink } from "@/components/shop/desktop/MarketFrame";
import "./crm.css";

export type CrmKey =
  | "home"
  | "patients"
  | "appointments"
  | "plans"
  | "payments"
  | "services"
  | "stock"
  | "reports"
  | "seminars"
  | "courses"
  | "consults"
  | "masters"
  | "listings"
  | "books"
  | "sales"
  | "settings";

const headerLinks: HeaderLink[] = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/seminarlar", label: "Seminarlar" },
  { href: "/ustalar", label: "Ustalar" },
  { href: "/forma", label: "Forma" },
  { href: "/talim", label: "Ta’lim" },
  { href: "/crm/bemorlar", label: "CRM", key: "crm" },
];




export function CrmFrame({
  active,
  placeholder,
  headerQuery,
  onHeaderQuery,
  listings,
  inlineSearch,
  children,
}: {
  inlineSearch?: boolean;
  active: CrmKey;
  placeholder: string;
  headerQuery?: string;
  onHeaderQuery?: (value: string) => void;
  listings?: boolean;
  children: ReactNode;
}) {
  if (!listings) {
    return (
      <ClinicShell accent="teal">
        <div className="crm-teal">
          {inlineSearch && onHeaderQuery ? (
            <div className="crm-tools">
              <label className="crm-search">
                <Search className="i" />
                <input value={headerQuery ?? ""} onChange={(event) => onHeaderQuery(event.target.value)} placeholder={placeholder} aria-label="Qidirish" />
              </label>
            </div>
          ) : null}
          {children}
        </div>
      </ClinicShell>
    );
  }
  return (
    <MarketFrame
      active={active}
      headerLinks={headerLinks}
      headerActive={listings ? "" : "crm"}
      searchPlaceholder={placeholder}
      headerQuery={headerQuery}
      onHeaderQuery={onHeaderQuery}
      promoTitle="Klinika boshqaruvi"
      promoText="Bemor, qabul va ombor bir joyda"
      promoCta="Bemorlar"
      promoHref="/crm/bemorlar"
      promoImage="/img/jihoz/chair.jpg"
      promoIcon={<Stethoscope className="i" />}
      showPromo={false}
    >
      {children}
    </MarketFrame>
  );
}

export function CrmModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="crm-modal" role="dialog" aria-modal="true" aria-label={title}>
      <form
        className="crm-dialog"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
        }}
      >
        <header>
          <b>{title}</b>
          <button type="button" onClick={onClose} aria-label="Yopish">
            ×
          </button>
        </header>
        {children}
      </form>
    </div>
  );
}

export function CrmPager({
  page,
  pages,
  size,
  totalLabel,
  onPage,
  onSize,
}: {
  page: number;
  pages: number;
  size: number;
  totalLabel: string;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
}) {
  const shown = pages <= 6 ? Array.from({ length: pages }, (_, index) => index + 1) : [1, 2, 3, 4, pages];
  return (
    <div className="crm-pager">
      <span>{totalLabel}</span>
      <div>
        <button type="button" aria-label="Oldingi" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ‹
        </button>
        {shown.map((item, index) => (
          <span key={item}>
            {index > 0 && shown[index - 1] !== item - 1 ? <i>…</i> : null}
            <button type="button" className={item === page ? "on" : undefined} onClick={() => onPage(item)}>
              {item}
            </button>
          </span>
        ))}
        <button type="button" aria-label="Keyingi" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          ›
        </button>
      </div>
      <label>
        Sahifada:
        <select aria-label="Sahifa hajmi" value={size} onChange={(event) => onSize(Number(event.target.value))}>
          {[10, 25, 50].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
