"use client";

import type { ToothState } from "@/data/crm";

const PATH = "M12 2.2c3.2 0 6 2.2 6.4 6.2.3 3.2-.2 6.2-1 9.2-.7 2.6-1.6 5.2-5.4 5.2s-4.7-2.6-5.4-5.2c-.8-3-1.3-6-1-9.2C6 4.4 8.8 2.2 12 2.2z";

export const ADULT_UPPER = ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"];
export const ADULT_LOWER = ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"];
export const BABY_UPPER = ["55", "54", "53", "52", "51", "61", "62", "63", "64", "65"];
export const BABY_LOWER = ["85", "84", "83", "82", "81", "71", "72", "73", "74", "75"];

export const toothFill: Record<ToothState, string> = {
  soglom: "#e8eef5",
  davolanmoqda: "#60a5fa",
  davolangan: "#86efac",
  muammo: "#f87171",
  kariyes: "#3b82f6",
  plomba: "#a78bfa",
  endo: "#22c55e",
  implant: "#ef4444",
  koronka: "#c4b5fd",
  ekstraksiya: "#b91c1c",
};

export function cycleTooth(current: ToothState | undefined, order: ToothState[]) {
  const index = order.indexOf(current ?? "soglom");
  return order[(index + 1) % order.length];
}

export function ToothChart({
  upper,
  lower,
  teeth,
  onCycle,
  legend,
}: {
  upper: string[];
  lower: string[];
  teeth: Record<string, ToothState>;
  onCycle: (id: string) => void;
  legend: { id: ToothState; label: string }[];
}) {
  const row = (ids: string[]) => (
    <div className="tooth-row">
      {ids.map((id) => (
        <button key={id} type="button" className="tooth" aria-label={`${id} tish`} onClick={() => onCycle(id)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={PATH} fill={toothFill[teeth[id] ?? "soglom"]} stroke="#cbd5e1" strokeWidth="1" />
          </svg>
          <small>{id}</small>
        </button>
      ))}
    </div>
  );
  return (
    <div>
      {row(upper)}
      <div style={{ height: "calc(.35 * var(--u))" }} />
      {row(lower)}
      <div className="tooth-legend">
        {legend.map((item) => (
          <span key={item.id}>
            <i style={{ background: toothFill[item.id] }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
