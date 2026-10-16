import type { SVGProps } from "react";

/** Simple molar outline (lucide has no tooth icon). Matches lucide stroke style. */
export function ToothIcon(props: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7.5 3C5 3 3.5 5 3.5 7.5c0 2 .8 3.4 1.3 5 .6 2 .8 4.5 1.5 6.5.4 1.2 1 2 1.8 2s1.3-.8 1.6-2l.7-3c.2-.8.6-1.2 1.6-1.2s1.4.4 1.6 1.2l.7 3c.3 1.2.8 2 1.6 2s1.4-.8 1.8-2c.7-2 .9-4.5 1.5-6.5.5-1.6 1.3-3 1.3-5C20.5 5 19 3 16.5 3c-1.8 0-2.8 1-4.5 1S9.3 3 7.5 3Z" />
    </svg>
  );
}
