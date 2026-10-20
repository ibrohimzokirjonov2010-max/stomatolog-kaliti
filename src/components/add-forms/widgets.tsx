"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { formatUzPhone } from "@/lib/phone-uz";
import "./add-form.css";

export function AddPage({
  crumbs,
  title,
  sub,
  testId,
  children,
}: {
  crumbs: { href?: string; label: string }[];
  title: string;
  sub?: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <div className="af" data-testid={testId}>
      <nav className="af-crumbs" aria-label="Breadcrumb">
        {crumbs.map((item, index) => (
          <span key={item.label}>
            {index > 0 ? <span> › </span> : null}
            {item.href ? <Link href={item.href}>{item.label}</Link> : <b>{item.label}</b>}
          </span>
        ))}
      </nav>
      <div className="af-head">
        <div>
          <h1>{title}</h1>
          {sub ? <p>{sub}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="af-card">
      <div className="af-step">
        <span className="af-num">{n}</span>
        <div>
          <h2>{title}</h2>
          {hint ? <small>{hint}</small> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Field({ label, error, children, required }: { label: string; error?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="af-label">
      {label}
      {required ? <i> *</i> : null}
      {children}
      {error ? <p className="af-err">{error}</p> : null}
    </label>
  );
}

export function TextField(props: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; error?: string; required?: boolean; testId?: string; maxLength?: number }) {
  return (
    <Field label={props.label} error={props.error} required={props.required}>
      <input className={`af-input${props.error ? " bad" : ""}`} data-testid={props.testId} value={props.value} placeholder={props.placeholder} maxLength={props.maxLength} onChange={(event) => props.onChange(event.target.value)} />
    </Field>
  );
}

export function AreaField(props: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; error?: string; required?: boolean; testId?: string }) {
  return (
    <Field label={props.label} error={props.error} required={props.required}>
      <textarea className={`af-area${props.error ? " bad" : ""}`} data-testid={props.testId} value={props.value} placeholder={props.placeholder} onChange={(event) => props.onChange(event.target.value)} />
    </Field>
  );
}

export function SelectField(props: { label: string; value: string; onChange: (value: string) => void; placeholder: string; options: readonly (string | { id: string; label: string })[]; error?: string; required?: boolean; testId?: string }) {
  const options = props.options.map((item) => (typeof item === "string" ? { id: item, label: item } : item));
  return (
    <Field label={props.label} error={props.error} required={props.required}>
      <select className={`af-select${props.error ? " bad" : ""}`} data-testid={props.testId} value={props.value} onChange={(event) => props.onChange(event.target.value)}>
        <option value="">{props.placeholder}</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>{item.label}</option>
        ))}
      </select>
    </Field>
  );
}

export function PhoneField(props: { value: string; onChange: (value: string) => void; error?: string; required?: boolean; testId?: string }) {
  return (
    <Field label="Telefon" error={props.error} required={props.required}>
      <div className={`af-phone${props.error ? " bad" : ""}`}>
        <span>+998</span>
        <input data-testid={props.testId} inputMode="numeric" placeholder="90 123 45 67" value={formatUzPhone(props.value).replace(/^\+998\s?/, "")} onChange={(event) => props.onChange(formatUzPhone(event.target.value))} />
      </div>
    </Field>
  );
}

export function TelegramField(props: { value: string; onChange: (value: string) => void; error?: string; testId?: string }) {
  return (
    <Field label="Telegram" error={props.error}>
      <div className={`af-tg${props.error ? " bad" : ""}`}>
        <span>@</span>
        <input data-testid={props.testId} placeholder="username" value={props.value.replace(/^@/, "")} onChange={(event) => props.onChange(event.target.value.replace(/^@/, ""))} />
      </div>
    </Field>
  );
}

export function Toggle({ on, label, onChange, testId }: { on: boolean; label: string; onChange: (value: boolean) => void; testId?: string }) {
  return (
    <button type="button" className={`af-switch${on ? " on" : ""}`} data-testid={testId} aria-pressed={on} onClick={() => onChange(!on)}>
      <i />
      {label}
    </button>
  );
}

export function Checks({ options, value, onChange, error }: { options: readonly { id: string; label: string }[]; value: string[]; onChange: (value: string[]) => void; error?: string }) {
  return (
    <div>
      <div className="af-checks">
        {options.map((item) => {
          const on = value.includes(item.id);
          return (
            <button key={item.id} type="button" className={`af-check${on ? " on" : ""}`} aria-pressed={on} onClick={() => onChange(on ? value.filter((id) => id !== item.id) : [...value, item.id])}>
              <span className="af-box">{on ? "✓" : ""}</span>
              {item.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="af-err">{error}</p> : null}
    </div>
  );
}

export function Chips({ options, value, onChange }: { options: readonly { id: string; label: string }[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="af-pills">
      {options.map((item) => (
        <button key={item.id} type="button" className={`af-chip${value === item.id ? " on" : ""}`} onClick={() => onChange(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export type LocalPhoto = { key: string; name: string; file?: File; url: string; preview: string };

export function PhotoPicker({
  photos,
  onChange,
  max = 8,
  title,
  hint,
}: {
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
  max?: number;
  title: string;
  hint: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  function add(files: FileList | null) {
    if (!files) return;
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (next.length >= max) break;
      if (!file.type.startsWith("image/")) continue;
      next.push({ key: `${Date.now()}-${file.name}-${next.length}`, name: file.name, file, url: "", preview: URL.createObjectURL(file) });
    }
    onChange(next);
  }
  return (
    <div>
      <div
        className="af-drop"
        onClick={() => input.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          add(event.dataTransfer.files);
        }}
      >
        <div>
          <strong>{title}</strong>
          <small>{hint}</small>
        </div>
      </div>
      <input ref={input} hidden type="file" accept="image/*" multiple={max > 1} onChange={(event) => { add(event.target.files); event.target.value = ""; }} />
      {photos.length ? (
        <div className="af-photos">
          {photos.map((photo, index) => (
            <div key={photo.key} className="af-photo" draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
              event.preventDefault();
              const from = Number(event.dataTransfer.getData("text/plain"));
              if (Number.isNaN(from) || from === index) return;
              const next = [...photos];
              const [item] = next.splice(from, 1);
              next.splice(index, 0, item);
              onChange(next);
            }}>
              <img src={photo.preview || photo.url} alt="" />
              {index === 0 ? <em>Asosiy</em> : null}
              <button type="button" aria-label="Rasmni olib tashlash" onClick={() => onChange(photos.filter((item) => item.key !== photo.key))}>×</button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LogoPicker({ photo, onChange }: { photo: LocalPhoto | null; onChange: (photo: LocalPhoto | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <button type="button" className="af-logo" onClick={() => input.current?.click()}>
        {photo ? <img src={photo.preview || photo.url} alt="" /> : "Logo"}
      </button>
      <input ref={input} hidden type="file" accept="image/*" onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        onChange({ key: `${Date.now()}`, name: file.name, file, url: "", preview: URL.createObjectURL(file) });
      }} />
    </div>
  );
}

export function ProfileSwitch({
  items,
  active,
  onPick,
  onCreate,
}: {
  items: { id: string; name: string; meta: string }[];
  active: string;
  onPick: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="af-card">
      <div className="af-step">
        <span className="af-num">↔</span>
        <div>
          <h2>Mening profillarim</h2>
          <small>Bir nechta profil saqlashingiz mumkin</small>
        </div>
      </div>
      <div className="af-profiles">
        {items.map((item) => (
          <button key={item.id} type="button" className={`af-profile${active === item.id ? " on" : ""}`} onClick={() => onPick(item.id)}>
            <span className="dot">{item.name.slice(0, 1).toUpperCase() || "P"}</span>
            <b>{item.name || "Profil"}</b>
            <small>{item.meta}</small>
          </button>
        ))}
        <button type="button" className={`af-profile${active === "" ? " on" : ""}`} onClick={onCreate}>
          <span className="dot">+</span>
          <b>Yangi profil</b>
          <small>Bo‘sh forma</small>
        </button>
      </div>
    </section>
  );
}

export function FormActions({ draft, publish, pending, draftLabel, publishLabel }: { draft: () => void; publish: () => void; pending: boolean; draftLabel: string; publishLabel: string }) {
  return (
    <div className="af-actions">
      <button type="button" className="af-btn" disabled={pending} onClick={draft}>{draftLabel}</button>
      <button type="button" className="af-btn primary" disabled={pending} data-testid="add-publish" onClick={publish}>{publishLabel}</button>
    </div>
  );
}

export function Banners({ note, error }: { note: string; error: string }) {
  return (
    <>
      {note ? <p className="af-note">{note}</p> : null}
      {error ? <p className="af-fail">{error}</p> : null}
    </>
  );
}
