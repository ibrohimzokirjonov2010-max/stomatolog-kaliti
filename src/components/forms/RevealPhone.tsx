"use client";

import { useState } from "react";

export function RevealPhone({ kind, id, initial }: { kind: "master" | "lab" | "job" | "classified" | "surplus"; id: string; initial?: string | null }) {
  const [phone, setPhone] = useState(initial || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (phone) {
    return (
      <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-semibold text-[#0F766E]">
        {phone}
      </a>
    );
  }
  return (
    <span>
      <button
        type="button"
        className="font-semibold text-[#0F766E]"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError("");
          void fetch("/api/reveal-phone", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind, id }),
          })
            .then(async (res) => {
              const data = (await res.json().catch(() => null)) as { ok?: boolean; phone?: string; error?: string } | null;
              if (!res.ok || !data?.phone) {
                setError(data?.error || (res.status === 401 ? "Raqamni ko‘rish uchun kiring." : "Raqam ochilmadi."));
                return;
              }
              setPhone(data.phone);
            })
            .catch(() => setError("Raqam ochilmadi."))
            .finally(() => setBusy(false));
        }}
      >
        {busy ? "Ochilmoqda…" : "Raqamni ko‘rsatish"}
      </button>
      {error ? <span className="mt-1 block text-[12px] text-[#9a3412]">{error}</span> : null}
    </span>
  );
}

const REASONS = [
  { id: "firibgarlik", label: "Firibgarlik" },
  { id: "noto‘g‘ri", label: "Noto‘g‘ri ma’lumot" },
  { id: "muddat", label: "Muddat yoki LOT mos emas" },
  { id: "qalbaki", label: "Qalbaki mahsulot" },
  { id: "bemor", label: "Bemor ma’lumoti oshkor" },
  { id: "spam", label: "Spam" },
  { id: "boshqa", label: "Boshqa" },
];

export function ReportButton({ kind, id }: { kind: "master" | "lab" | "job" | "classified" | "surplus" | "post"; id: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  return (
    <span className="inline-block">
      <button type="button" className="text-[13px] text-[#6b7280]" onClick={() => setOpen((value) => !value)}>
        Shikoyat
      </button>
      {open ? (
        <span className="mt-2 grid gap-1">
          {REASONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="rounded-lg border border-[#e6ebf2] px-2 py-1 text-left text-[12px]"
              onClick={() => {
                void fetch("/api/reports", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ kind, id, reason: item.id }),
                })
                  .then(async (res) => {
                    const data = (await res.json().catch(() => null)) as { error?: string } | null;
                    setNote(res.ok ? "Rahmat, shikoyat qabul qilindi." : data?.error || "Shikoyat yuborilmadi.");
                    setOpen(false);
                  })
                  .catch(() => setNote("Shikoyat yuborilmadi."));
              }}
            >
              {item.label}
            </button>
          ))}
        </span>
      ) : null}
      {note ? <span className="mt-1 block text-[12px] text-[#6b7280]">{note}</span> : null}
    </span>
  );
}
