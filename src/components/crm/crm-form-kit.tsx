"use client";
/* eslint-disable @next/next/no-img-element -- avatars are data URLs or fixed-size thumbs */

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, ChevronDown, Search, X } from "lucide-react";
import "./crm-modal.css";

/** Shared pieces for the desktop CRM "add" dialogs (bemor, to‘lov, davolash rejasi, ombor). */

const noop = () => () => undefined;

export function CmDialog({
  testId,
  title,
  subtitle,
  width,
  onClose,
  children,
  footer,
}: {
  testId: string;
  title: string;
  subtitle: string;
  width: number;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const titleId = useId();
  // false during SSR and hydration, true after: the portal never renders into server HTML.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;
  return createPortal(
    <div className="cm-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="cm-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} data-testid={testId} style={{ width: `min(${width}px, calc(100vw - 24px))` }}>
        <header className="cm-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="cm-x" aria-label="Yopish" onClick={onClose}><X /></button>
        </header>
        <div className="cm-body">{children}</div>
        <footer className="cm-foot">{footer}</footer>
      </div>
    </div>,
    document.body,
  );
}

export function CmField({ label, req, hint, className, children }: { label: string; req?: boolean; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className ? `cm-field ${className}` : "cm-field"}>
      <span className="cm-label">
        {label}
        {req ? <em> *</em> : null}
        {hint ? <i> {hint}</i> : null}
      </span>
      {children}
    </div>
  );
}

export function CmError({ text }: { text?: string }) {
  return text ? <b className="cm-err" role="alert">{text}</b> : null;
}

export function CmSelect({
  value,
  options,
  onChange,
  label,
  placeholder,
  icon,
  testId,
  bad,
}: {
  value: string;
  options: (string | { value: string; label: string })[];
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  icon?: ReactNode;
  testId?: string;
  bad?: boolean;
}) {
  return (
    <span className={`cm-ctl cm-select${icon ? " lead" : ""}${bad ? " bad" : ""}${value ? "" : " empty"}`}>
      {icon ? <span className="cm-lead">{icon}</span> : null}
      <select aria-label={label} data-testid={testId} value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((item) => {
          const option = typeof item === "string" ? { value: item, label: item } : item;
          return <option key={option.value} value={option.value}>{option.label}</option>;
        })}
      </select>
      <ChevronDown className="cm-chev" />
    </span>
  );
}

export function isoToDot(iso: string) {
  const [year, month, day] = iso.split("-");
  return year && month && day ? `${day}.${month}.${year}` : "";
}

export function dotToIso(dot: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dot.trim());
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

export function validDot(dot: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dot.trim());
  if (!match) return false;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Types DD.MM.YYYY as you go: digits only, dots added automatically. */
function maskDot(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join(".");
}

export function CmDate({ value, onChange, label, testId, leadIcon, bad }: { value: string; onChange: (value: string) => void; label: string; testId?: string; leadIcon?: boolean; bad?: boolean }) {
  const native = useRef<HTMLInputElement>(null);
  return (
    <span className={`cm-ctl cm-date${leadIcon ? " lead" : ""}${bad ? " bad" : ""}`}>
      {leadIcon ? <span className="cm-lead"><CalendarDays /></span> : null}
      <input aria-label={label} data-testid={testId} inputMode="numeric" placeholder="DD.MM.YYYY" value={value} onChange={(event) => onChange(maskDot(event.target.value))} />
      <button type="button" className="cm-cal" aria-label={`${label}: kalendar`} onClick={() => { const el = native.current; if (!el) return; el.value = dotToIso(value); try { el.showPicker(); } catch { el.focus(); } }}>
        <CalendarDays />
      </button>
      <input ref={native} className="cm-native" type="date" tabIndex={-1} aria-hidden="true" onChange={(event) => onChange(isoToDot(event.target.value))} />
    </span>
  );
}

export function CmSwitch({ on, onChange, label, testId }: { on: boolean; onChange: (next: boolean) => void; label: string; testId?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} data-testid={testId} className={on ? "cm-switch on" : "cm-switch"} onClick={() => onChange(!on)}>
      <i />
    </button>
  );
}

export function CmAvatar({ src, name, size = 36 }: { src?: string; name: string; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
  return src ? (
    <img className="cm-ava" src={src} alt="" style={{ width: size, height: size }} />
  ) : (
    <span className="cm-ava ini" aria-hidden style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>{initials}</span>
  );
}

export type PickOption = { id: string; title: string; sub?: string; avatar?: string; icon?: ReactNode };

/** A select that shows the chosen person or plan as a card (avatar, name, details), with search. */
export function CmPicker({
  value,
  options,
  onChange,
  label,
  placeholder,
  empty,
  testId,
  bad,
  disabled,
}: {
  value: string;
  options: PickOption[];
  onChange: (id: string) => void;
  label: string;
  placeholder: string;
  empty: ReactNode;
  testId?: string;
  bad?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const picked = options.find((item) => item.id === value);
  const list = q.trim() ? options.filter((item) => `${item.title} ${item.sub ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())) : options;

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.stopPropagation(); setOpen(false); }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div className={`cm-picker${open ? " open" : ""}${bad ? " bad" : ""}`} ref={root}>
      <button type="button" className="cm-pick" aria-haspopup="listbox" aria-expanded={open} aria-label={label} data-testid={testId} disabled={disabled} onClick={() => { setOpen((v) => !v); setQ(""); }}>
        {picked ? (
          <>
            {picked.icon ? <span className="cm-pick-ic">{picked.icon}</span> : <CmAvatar src={picked.avatar} name={picked.title} />}
            <span className="cm-pick-t"><b>{picked.title}</b>{picked.sub ? <small>{picked.sub}</small> : null}</span>
          </>
        ) : (
          <span className="cm-pick-t ph">{placeholder}</span>
        )}
        <ChevronDown className="cm-chev" />
      </button>
      {open ? (
        <div className="cm-pop" role="listbox" aria-label={label}>
          {options.length > 5 ? (
            <label className="cm-pop-q"><Search /><input autoFocus aria-label="Qidirish" placeholder="Qidirish..." value={q} onChange={(event) => setQ(event.target.value)} /></label>
          ) : null}
          {options.length === 0 ? <div className="cm-pop-empty">{empty}</div> : null}
          {options.length > 0 && list.length === 0 ? <div className="cm-pop-empty">Topilmadi</div> : null}
          {list.map((item) => (
            <button key={item.id} type="button" role="option" aria-selected={item.id === value} className={item.id === value ? "on" : undefined} onClick={() => { onChange(item.id); setOpen(false); }}>
              {item.icon ? <span className="cm-pick-ic">{item.icon}</span> : <CmAvatar src={item.avatar} name={item.title} size={30} />}
              <span className="cm-pick-t"><b>{item.title}</b>{item.sub ? <small>{item.sub}</small> : null}</span>
              {item.id === value ? <Check className="cm-tick" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function digitsOf(value: string) {
  return value.replace(/\D/g, "");
}
