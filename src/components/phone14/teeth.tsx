const ADULT = [
  ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"],
  ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"],
];
const BABY = [
  ["55", "54", "53", "52", "51", "61", "62", "63", "64", "65"],
  ["85", "84", "83", "82", "81", "71", "72", "73", "74", "75"],
];

export const TOOTH_KIND: Record<string, string> = {
  "16": "implant",
  "14": "plomba",
  "11": "endo",
  "26": "krona",
  "31": "implant",
  "36": "plomba",
};

function molar(front: boolean) {
  return front
    ? "M14 6c4-3 10-3 14 0 2 4 3 8 2 12-1 2-2 3-3 3v10c0 3-1 6-2 8-1 2-2 1-2-1l-1-8h-2l-1 8c0 2-1 3-2 1-1-2-2-5-2-8V21c-1 0-2-1-3-3-1-4 0-8 2-12z"
    : "M6 16c1-8 6-13 14-13s13 5 14 13c2 4 2 8 0 11-1 2-3 3-4 3l1 12c0 3-2 6-4 6s-3-2-3-5v-8h-2v8c0 3-1 5-3 5s-4-3-4-6l1-12c-1 0-3-1-4-3-2-3-2-7 0-11z";
}

export function ToothMark({ id, kind, selected }: { id: string; kind?: string; selected?: boolean }) {
  const front = /1[123]|2[123]|3[123]|4[123]|5[12]|6[12]|7[12]|8[12]/.test(id);
  const gid = `enamel-${id}`;
  return (
    <svg viewBox="0 0 40 56" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f3f6fb" />
          <stop offset="1" stopColor="#d5deea" />
        </linearGradient>
      </defs>
      <path d={molar(!front ? false : id.endsWith("1") || id.endsWith("2") || id.endsWith("3"))} fill={`url(#${gid})`} stroke={selected ? "#0E8F94" : "#c5d0dc"} strokeWidth={selected ? 1.8 : 1} />
      {kind === "plomba" ? <ellipse cx="20" cy="18" rx="6" ry="4" fill="#3b82f6" /> : null}
      {kind === "endo" ? <path d="M20 16 v22" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" /> : null}
      {kind === "krona" ? <path d="M8 12c3-6 21-6 24 0 1 4-1 7-4 8H12c-3-1-5-4-4-8z" fill="#e0b044" stroke="#b8892b" /> : null}
      {kind === "implant" ? (
        <>
          <path d="M16 28h8l-1 16h-6z" fill="#9aa7b8" />
          <path d="M15 32h10M15 36h10M15 40h10" stroke="#6b7788" strokeWidth="1" />
        </>
      ) : null}
      {kind === "gone" ? <path d="M12 14l16 20M28 14L12 34" stroke="#94a3b8" strokeWidth="2" /> : null}
    </svg>
  );
}

export function ToothChart({
  mode = "katta",
  selected,
  onToggle,
  palette,
}: {
  mode?: "katta" | "bola";
  selected?: string[];
  onToggle?: (id: string) => void;
  palette?: boolean;
}) {
  const rows = mode === "katta" ? ADULT : BABY;
  return (
    <div className="teeth" aria-label="Tish kartasi">
      {rows.map((row) => (
        <div key={row[0]} className="crm-arch">
          {row.map((id) => {
            const on = selected?.includes(id);
            const kind = palette ? TOOTH_KIND[id] : undefined;
            return (
              <button key={id} type="button" className={on ? "crm-tooth on" : "crm-tooth"} aria-pressed={Boolean(on)} aria-label={`Tish ${id}`} onClick={() => onToggle?.(id)}>
                <ToothMark id={id} kind={kind} selected={on} />
                <small>{id}</small>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function ToothLegend() {
  const items = [["#e8eef5", "Sog‘lom"], ["#3b82f6", "Plomba"], ["#ef4444", "Endo"], ["#e0b044", "Krona"], ["#8b97a8", "Implant"], ["#94a3b8", "Olib tashlangan"]];
  return <p className="crm-legend">{items.map(([color, label]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</p>;
}
