"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { activeDesktopGroup, activeDesktopMoreGroup, activeNavHref, desktopNavGroups } from "@/data/nav";

const MOBILE_KEY = "stomahub.nav.openGroup";
const DESKTOP_KEY = "stomahub.nav.desktop";

function readMobile(): string | null {
  try {
    return window.localStorage.getItem(MOBILE_KEY);
  } catch {
    return null;
  }
}

function writeMobile(id: string | null) {
  try {
    if (id) window.localStorage.setItem(MOBILE_KEY, id);
    else window.localStorage.removeItem(MOBILE_KEY);
  } catch {
    /* storage unavailable */
  }
}

type DesktopSaved = { groups: string[]; yana: string[] };

function readDesktop(): DesktopSaved | null {
  try {
    const raw = window.localStorage.getItem(DESKTOP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DesktopSaved;
    if (!parsed || !Array.isArray(parsed.groups)) return null;
    return {
      groups: parsed.groups.filter((id) => typeof id === "string"),
      yana: Array.isArray(parsed.yana) ? parsed.yana.filter((id) => typeof id === "string") : [],
    };
  } catch {
    return null;
  }
}

function writeDesktop(groups: Set<string>, yana: Set<string>) {
  try {
    const saved: DesktopSaved = { groups: [...groups], yana: [...yana] };
    window.localStorage.setItem(DESKTOP_KEY, JSON.stringify(saved));
  } catch {
    /* storage unavailable */
  }
}

function defaultDesktopGroups(activeGroup: string | null) {
  const groups = new Set(desktopNavGroups.map((group) => group.id));
  if (activeGroup) groups.add(activeGroup);
  return groups;
}

/**
 * Shared state for the grouped navigation.
 * Mobile: the active group starts open, and the last group the user opened is remembered.
 * Desktop: every group starts open. A saved choice is restored, and the group for the
 * current route stays open. Open groups and "Yana..." rows are remembered separately
 * from the phone drawer.
 */
export function useNavTree(mode: "mobile" | "desktop" = "mobile") {
  const pathname = usePathname() ?? "/";
  const activeHref = activeNavHref(pathname);
  const activeGroup = activeDesktopGroup(pathname);
  const moreGroup = mode === "desktop" ? activeDesktopMoreGroup(pathname) : null;
  const [open, setOpen] = useState<Set<string>>(() =>
    mode === "desktop" ? defaultDesktopGroups(activeGroup) : new Set(activeGroup ? [activeGroup] : []),
  );
  const [yana, setYana] = useState<Set<string>>(() => new Set(moreGroup ? [moreGroup] : []));
  const openRef = useRef(open);
  const yanaRef = useRef(yana);
  openRef.current = open;
  yanaRef.current = yana;

  useEffect(() => {
    if (mode === "desktop") {
      const stored = readDesktop();
      const groups = stored ? new Set(stored.groups) : defaultDesktopGroups(activeGroup);
      if (activeGroup) groups.add(activeGroup);
      const extras = new Set(stored?.yana ?? []);
      if (moreGroup) extras.add(moreGroup);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the remembered desktop sidebar after mount
      setOpen(groups);
      setYana(extras);
      return;
    }
    const stored = readMobile();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with localStorage + route after mount
    setOpen((prev) => {
      const next = new Set(prev);
      if (activeGroup) next.add(activeGroup);
      if (stored) next.add(stored);
      return next;
    });
  }, [activeGroup, moreGroup, mode]);

  const toggle = useCallback(
    (id: string) => {
      setOpen((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          if (mode === "mobile" && readMobile() === id) writeMobile(null);
        } else {
          next.add(id);
          if (mode === "mobile") writeMobile(id);
        }
        if (mode === "desktop") writeDesktop(next, yanaRef.current);
        return next;
      });
    },
    [mode],
  );

  const toggleYana = useCallback((id: string) => {
    setYana((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeDesktop(openRef.current, next);
      return next;
    });
  }, []);

  return {
    pathname,
    activeHref,
    activeGroup,
    isOpen: (id: string) => open.has(id),
    toggle,
    isYanaOpen: (id: string) => yana.has(id),
    toggleYana,
  };
}
