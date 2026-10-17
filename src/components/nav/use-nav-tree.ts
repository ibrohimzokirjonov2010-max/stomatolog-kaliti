"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { activeNavGroup, activeNavHref } from "@/data/nav";

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
 * The group holding the active route is always opened on navigation; the last group
 * the user opened is remembered in localStorage.
 */
export function useNavTree() {
  const pathname = usePathname() ?? "/";
  const activeHref = activeNavHref(pathname);
  const activeGroup = activeNavGroup(pathname);
  const [open, setOpen] = useState<Set<string>>(() => new Set(activeGroup ? [activeGroup] : []));

  useEffect(() => {
    const stored = readStored();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with localStorage + route after mount
    setOpen((prev) => {
      const next = new Set(prev);
      if (activeGroup) next.add(activeGroup);
      if (stored) next.add(stored);
      return next;
    });
  }, [activeGroup]);

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
