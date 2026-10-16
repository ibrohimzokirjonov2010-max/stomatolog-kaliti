import { cn } from "@/lib/utils";

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
export type ToothState = "healthy" | "treating" | "treated" | "problem";
const FILL: Record<ToothState, string> = {
  healthy: "#eef1f6",
  treating: "#5b9dff",
  treated: "#22b07d",
  problem: "#f15b5b",
};

function Tooth({ n, state, upper }: { n: number; state?: ToothState; upper: boolean }) {
  const molar = n % 10 >= 6;
  const premolar = n % 10 === 4 || n % 10 === 5;
  const w = molar ? 15 : premolar ? 12 : 10;
  return (
    <div className="flex flex-col items-center gap-0.5" title={`Tish ${n}`}>
      {upper ? <span className="text-[8px] text-[#9aa3b2]">{n}</span> : null}
      <svg width={w} height={30} viewBox={`0 0 ${w} 30`} className={cn(!upper && "rotate-180")}>
        <path
          d={`M1 4 Q${w / 2} -1 ${w - 1} 4 L${w - 2} 15 Q${w * 0.72} 29 ${w / 2} 22 Q${w * 0.28} 29 2 15 Z`}
          fill={state ? FILL[state] : "#fff"}
          stroke="#b9c2d3"
          strokeWidth={0.9}
        />
      </svg>
      {!upper ? <span className="text-[8px] text-[#9aa3b2]">{n}</span> : null}
    </div>
  );
}

/** Tooth chart. Teeth without data are drawn neutral (no fake statuses). */
export function Odontogram({ states = {} }: { states?: Record<number, ToothState> }) {
  return (
    <div>
      <div className="flex justify-between">{UPPER.map((n) => <Tooth key={n} n={n} upper state={states[n]} />)}</div>
      <div className="mt-1 flex justify-between">{LOWER.map((n) => <Tooth key={n} n={n} upper={false} state={states[n]} />)}</div>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6b7590]">
        {(
          [
            ["healthy", "Sog‘lom"],
            ["treating", "Davolanmoqda"],
            ["treated", "Davolangan"],
            ["problem", "Muammo"],
          ] as const
        ).map(([k, l]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-[#c9d1df]" style={{ background: FILL[k] }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
