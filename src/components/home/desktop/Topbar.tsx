"use client";

import { DesktopHeader } from "@/components/desktop/desktop-header";

/** Home and shop pages share the one desktop header. Legacy props still customize search. */
export default function Topbar({
  searchPath = "/marketplace",
  placeholder,
}: {
  variant?: "home" | "shop";
  searchPath?: string;
  cartCount?: number;
  placeholder?: string;
  showCamera?: boolean;
}) {
  return <DesktopHeader searchPath={searchPath} searchPlaceholder={placeholder} />;
}
