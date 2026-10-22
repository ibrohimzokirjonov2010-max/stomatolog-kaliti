"use client";

import type { ToothState } from "@/data/crm";

/** Upper-jaw outlines (roots up, crown down) in a 24×40 box; the lower jaw mirrors them. */
const SHAPES = {
  incisor: "M9.2 2C10.6 1 13.4 1 14.8 2L16.4 18C18.4 19.2 18.9 22.5 18.5 28.2 18.1 34 15.9 38 12 38S5.9 34 5.5 28.2C5.1 22.5 5.6 19.2 7.6 18Z",
  canine: "M9.6 1.4C11 .5 13 .5 14.4 1.4L16.6 18C18.9 19.6 19.3 24 18.6 29 17.9 34 15 38.6 12 39 9 38.6 6.1 34 5.4 29 4.7 24 5.1 19.6 7.4 18Z",
  premolar: "M8.6 2C10.5 1 13.5 1 15.4 2L17 17C20 18.2 21 22 20.6 28 20.2 34 17 38 12 38S3.8 34 3.4 28C3 22 4 18.2 7 17Z",
  molar: "M4.2 3C5.2 1.5 7.6 1.5 8.6 3L10.6 14C11.3 12.6 12.7 12.6 13.4 14L15.4 3C16.4 1.5 18.8 1.5 19.8 3L21 17C23 19 23.3 24 22.8 29.2 22.3 34.6 19 38 12 38S1.7 34.6 1.2 29.2C.7 24 1 19 3 17Z",
} as const;

function shapeOf(id: string, baby: boolean) {
  const n = Number(id.slice(-1));
  if (n <= 2) return SHAPES.incisor;
  if (n === 3) return SHAPES.canine;
  if (baby || n >= 6) return SHAPES.molar;
  return SHAPES.premolar;
}

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
  const row = (ids: string[], lower: boolean) => (
    <div className={lower ? "tooth-row low" : "tooth-row"}>
      {ids.map((id) => {
        const baby = Number(id[0]) >= 5;
        const state = teeth[id] ?? "soglom";
        return (
          <button key={id} type="button" className={`tooth${state === "soglom" ? "" : " marked"}`} aria-label={`${id} tish`} onClick={() => onCycle(id)}>
            {lower ? null : <small>{id}</small>}
            <svg viewBox="0 0 24 40" aria-hidden="true">
              <path d={shapeOf(id, baby)} transform={lower ? "matrix(1 0 0 -1 0 40)" : undefined} fill={state === "soglom" ? "#f8fafc" : toothFill[state]} stroke={state === "soglom" ? "#c3cfde" : toothFill[state]} strokeWidth="1.1" strokeLinejoin="round" />
            </svg>
            {lower ? <small>{id}</small> : null}
          </button>
        );
      })}
    </div>
  );
  return (
    <div>
      {row(upper, false)}
      <div style={{ height: "calc(.35 * var(--u))" }} />
      {row(lower, true)}
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
