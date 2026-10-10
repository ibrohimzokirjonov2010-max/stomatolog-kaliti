/**
 * Two-tone line icons for Ustalar (blue stroke = currentColor, teal accent = var(--ua)).
 * Set `style={{ ["--ua" as string]: "#fff" }}` together with a white text colour for active tiles.
 */
import type { CSSProperties, ReactNode } from "react";

export type UstaIconName =
  | "all"
  | "rentgen"
  | "kreslo"
  | "ornatish"
  | "tamirlash"
  | "konsultatsiya"
  | "mebel"
  | "servis"
  | "profilaktika"
  | "ehtiyot"
  | "kompressor"
  | "sterilizatsiya"
  | "skaner"
  | "boshqa";

const A = "var(--ua, #00C2A8)";

const paths: Record<UstaIconName, ReactNode> = {
  all: (
    <>
      <path d="M12 4.6c-2.3 0-4.1 1.4-4.1 3.4 0 1.1-.3 2.5-.9 3.9-.6 1.6-1.2 3.2-1.2 4.7 0 2 1.4 3.4 3.1 3.4 1.1 0 1.8-.6 3.1-.6s2 .6 3.1.6c1.7 0 3.1-1.4 3.1-3.4 0-1.5-.6-3.1-1.2-4.7-.6-1.4-.9-2.8-.9-3.9 0-2-1.8-3.4-4.1-3.4z" />
      <path d="M10 8.2c.6-.5 1.2-.7 2-.7" stroke={A} />
    </>
  ),
  rentgen: (
    <>
      <rect x="3.5" y="4" width="17" height="13" rx="2.2" />
      <path d="M12 7.2c-1.4 0-2.4.8-2.4 2 0 .7-.2 1.5-.5 2.3-.3.9-.6 1.7-.6 2.4 0 .9.6 1.5 1.4 1.5.6 0 .9-.3 1.6-.3s1 .3 1.6.3c.8 0 1.4-.6 1.4-1.5 0-.7-.3-1.5-.6-2.4-.3-.8-.5-1.6-.5-2.3 0-1.2-1-2-2.4-2z" stroke={A} />
      <path d="M8 20h8M12 17v3" />
    </>
  ),
  kreslo: (
    <>
      <path d="M6.5 4.5l2 8.5h7.2c1.2 0 2.1.8 2.3 2l.3 1.5" />
      <path d="M8.5 13l-1.5 3.5h11" />
      <path d="M12 16.5V20M8.5 20h7" />
      <path d="M13.5 8.5h4.5l1.5-2.5" stroke={A} />
      <circle cx="6" cy="3.8" r="1" stroke={A} />
    </>
  ),
  ornatish: (
    <>
      <path d="M14.7 6.3a3.6 3.6 0 0 0 4.6 4.6l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6z" />
      <path d="M5 5l3.2 3.2M4 7.5 7.5 4l2.3 2.3-3.5 3.5z" stroke={A} />
      <path d="M13.5 15.5l4 4" stroke={A} />
    </>
  ),
  tamirlash: (
    <>
      <circle cx="12" cy="12" r="3" stroke={A} />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" />
      <circle cx="12" cy="12" r="6.2" />
    </>
  ),
  konsultatsiya: (
    <>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v5a2.5 2.5 0 0 1-2.5 2.5H9l-3.5 3v-3H6.5A2.5 2.5 0 0 1 4 11.5z" />
      <path d="M17 9h.5A2.5 2.5 0 0 1 20 11.5v4a2.5 2.5 0 0 1-2.5 2.5H17v2.5L14 18h-2.5" stroke={A} />
      <path d="M8 8.2h5M8 10.8h3" />
    </>
  ),
  mebel: (
    <>
      <rect x="4" y="9" width="16" height="7" rx="2" />
      <path d="M6 16v3M18 16v3M7 9V6.5A1.5 1.5 0 0 1 8.5 5h7A1.5 1.5 0 0 1 17 6.5V9" stroke={A} />
    </>
  ),
  servis: (
    <>
      <path d="M12 3.8 19 7v5c0 4-3 7-7 8.2C8 19 5 16 5 12V7z" />
      <path d="M9 12l2 2 4-4" stroke={A} />
    </>
  ),
  profilaktika: (
    <>
      <path d="M14.7 6.3a3.6 3.6 0 0 0 4.6 4.6l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6z" />
      <path d="M6.5 3.5v3M5 5h3M18 15.5v3M16.5 17h3" stroke={A} />
    </>
  ),
  ehtiyot: (
    <>
      <circle cx="12" cy="12" r="2.6" stroke={A} />
      <path d="M10.4 3.8h3.2l.5 2.2 1.6.9 2.1-.8 1.6 2.8-1.7 1.4v1.4l1.7 1.4-1.6 2.8-2.1-.8-1.6.9-.5 2.2h-3.2l-.5-2.2-1.6-.9-2.1.8-1.6-2.8 1.7-1.4v-1.4L4.8 8.9l1.6-2.8 2.1.8 1.6-.9z" />
    </>
  ),
  kompressor: (
    <>
      <rect x="3.5" y="9" width="12" height="7.5" rx="3.75" />
      <path d="M15.5 12.8H19a1.5 1.5 0 0 1 1.5 1.5V17" />
      <circle cx="9.5" cy="5.8" r="2.3" stroke={A} />
      <path d="M9.5 8.1V9M6 16.5V19M13 16.5V19" />
    </>
  ),
  sterilizatsiya: (
    <>
      <rect x="3.5" y="5" width="17" height="13" rx="2.2" />
      <rect x="6" y="8" width="9" height="7" rx="1.2" stroke={A} />
      <path d="M17.5 8.5v.01M17.5 11.5v.01M17.5 14.5v.01" />
    </>
  ),
  skaner: (
    <>
      <path d="M5.5 18.5 14 10a2.1 2.1 0 0 1 3 3l-8.5 8.5" />
      <path d="M15 7.5 17.5 5l1.5 1.5L16.5 9" stroke={A} />
      <path d="M19.5 3.5l1 1" stroke={A} />
    </>
  ),
  boshqa: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12h.01M12 12h.01M15.8 12h.01" stroke={A} strokeWidth="2.6" />
    </>
  ),
};

export function UstaIcon({ name, className, style }: { name: UstaIconName; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
