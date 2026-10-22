/** Small inline country flags for the brand directory (emoji flags render as letters on Windows). */
const STRIPES: Record<string, { dir: "h" | "v"; colors: string[] }> = {
  Avstriya: { dir: "h", colors: ["#c8102e", "#fff", "#c8102e"] },
  Germaniya: { dir: "h", colors: ["#000", "#dd0000", "#ffce00"] },
  Italiya: { dir: "v", colors: ["#009246", "#fff", "#ce2b37"] },
  Lixtenshteyn: { dir: "h", colors: ["#002b7f", "#ce1126"] },
  Slovakiya: { dir: "h", colors: ["#fff", "#0b4ea2", "#ee1c25"] },
};

export function Flag({ country, className }: { country: string; className?: string }) {
  const box = { className, width: 18, height: 12, viewBox: "0 0 18 12", "aria-hidden": true as const };
  const stripe = STRIPES[country];
  if (stripe) {
    const n = stripe.colors.length;
    return (
      <svg {...box}>
        {stripe.colors.map((color, i) =>
          stripe.dir === "h" ? <rect key={i} x="0" y={(12 / n) * i} width="18" height={12 / n} fill={color} /> : <rect key={i} x={(18 / n) * i} y="0" width={18 / n} height="12" fill={color} />,
        )}
        <rect width="18" height="12" fill="none" stroke="rgba(0,0,0,.12)" />
      </svg>
    );
  }
  switch (country) {
    case "AQSH":
      return (
        <svg {...box}>
          {Array.from({ length: 7 }, (_, i) => <rect key={i} y={i * (12 / 6.5)} width="18" height={12 / 13} fill="#b22234" />)}
          <rect width="18" height="12" fill="none" />
          <rect width="8" height="6.5" fill="#3c3b6e" />
        </svg>
      );
    case "Yaponiya":
      return <svg {...box}><rect width="18" height="12" fill="#fff" stroke="rgba(0,0,0,.12)" /><circle cx="9" cy="6" r="3.4" fill="#bc002d" /></svg>;
    case "Janubiy Koreya":
      return <svg {...box}><rect width="18" height="12" fill="#fff" stroke="rgba(0,0,0,.12)" /><path d="M5.8 6a3.2 3.2 0 0 1 6.4 0Z" fill="#cd2e3a" /><path d="M5.8 6a3.2 3.2 0 0 0 6.4 0Z" fill="#0047a0" /></svg>;
    case "Xitoy":
      return <svg {...box}><rect width="18" height="12" fill="#de2910" /><path d="m3.6 1.6.6 1.8h1.9l-1.5 1.1.6 1.8-1.6-1.1-1.5 1.1.6-1.8L1.2 3.4h1.9Z" fill="#ffde00" /></svg>;
    case "Shveytsariya":
      return <svg {...box}><rect width="18" height="12" fill="#d52b1e" /><path d="M8 2.5h2v2.5h2.5v2H10v2.5H8V7H5.5V5H8Z" fill="#fff" /></svg>;
    case "Finlyandiya":
      return <svg {...box}><rect width="18" height="12" fill="#fff" stroke="rgba(0,0,0,.12)" /><rect x="5" width="3" height="12" fill="#003580" /><rect y="4.5" width="18" height="3" fill="#003580" /></svg>;
    case "Braziliya":
      return <svg {...box}><rect width="18" height="12" fill="#009c3b" /><path d="M9 1.5 16 6l-7 4.5L2 6Z" fill="#ffdf00" /><circle cx="9" cy="6" r="2.4" fill="#002776" /></svg>;
    default:
      return null;
  }
}
