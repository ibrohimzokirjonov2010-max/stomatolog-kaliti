import { cn } from "@/lib/utils";

/** Neutral clinic avatar (initials) — used for user-posted vacancies that have no bundled brand logo. */
export function ClinicInitials({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const text = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F0FDFA] text-[15px] font-bold text-[#0F766E] ring-1 ring-[#CCFBF1]", className)}
      style={style}
      aria-hidden
    >
      {text || "K"}
    </span>
  );
}
