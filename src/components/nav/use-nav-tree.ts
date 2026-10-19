"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { activeDesktopGroup, activeNavGroup, activeNavHref, desktopNavGroups } from "@/data/nav";

const STORAGE_KEY = "stomahub.nav.openGroup";

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(id: string | null) {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

/**
 * Shared state for the grouped navigation (desktop sidebars and the mobile drawer).
 * Mobile keeps the previous behaviour: the active group starts open, and the last
 * group the user opened is remembered. Desktop starts with every group open so the
 * design's chevrons are visible without changing the phone drawer.
 */
export function useNavTree(mode: "mobile" | "desktop" = "mobile") {
  const pathname = usePathname() ?? "/";
  const activeHref = activeNavHref(pathname);
  const activeGroup = mode === "desktop" ? activeDesktopGroup(pathname) : activeNavGroup(pathname);
  const [open, setOpen] = useState<Set<string>>(() =>
    mode === "desktop" ? new Set(desktopNavGroups.map((group) => group.id)) : new Set(activeGroup ? [activeGroup] : []),
  );

  useEffect(() => {
    if (mode === "desktop") {
      if (!activeGroup) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- keep the active group open after navigation
      setOpen((prev) => {
        if (prev.has(activeGroup)) return prev;
        const next = new Set(prev);
        next.add(activeGroup);
        return next;
      });
      return;
    }
    const stored = readStored();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with localStorage + route after mount
    setOpen((prev) => {
      const next = new Set(prev);
      if (activeGroup) next.add(activeGroup);
      if (stored) next.add(stored);
      return next;
    });
  }, [activeGroup, mode]);

  const toggle = useCallback((id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (readStored() === id) writeStored(null);
      } else {
        next.add(id);
        writeStored(id);
      }
      return next;
    });
  }, []);

  return { pathname, activeHref, activeGroup, isOpen: (id: string) => open.has(id), toggle };
}
