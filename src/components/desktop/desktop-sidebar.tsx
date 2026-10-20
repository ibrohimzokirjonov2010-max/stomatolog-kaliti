"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Crown, Headset, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ShNavTree } from "@/components/nav/sh-nav-tree";
import "./desktop-chrome.css";

const HELP_PREFIXES = ["/mening-klinikam", "/klinika", "/crm", "/profil", "/buyurtmalarim"];
const COLLAPSE_KEY = "stomahub.nav.collapsed";

function wantsHelp(pathname: string) {
  return HELP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** The one desktop sidebar: design groups, then StomaHub Pro (or help on clinic and profile). */
export function DesktopSidebar() {
  const pathname = usePathname() ?? "/";
  const help = wantsHelp(pathname);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }

  return (
    <aside className={collapsed ? "sh-side is-collapsed" : "sh-side"} data-testid="desktop-sidebar" data-collapsed={collapsed ? "true" : "false"}>
      <button
        type="button"
        className="sh-collapse"
        aria-pressed={collapsed}
        aria-label={collapsed ? "Menyuni yoyish" : "Menyuni yig‘ish"}
        onClick={toggleCollapsed}
      >
        {collapsed ? <PanelLeftOpen className="i" /> : <PanelLeftClose className="i" />}
        <span>{collapsed ? "Yoyish" : "Yig‘ish"}</span>
      </button>
      <ShNavTree />
      {help ? (
        <div className="sh-pro sh-help" data-testid="sidebar-help">
          <span className="crown help">
            <Headset className="i" />
          </span>
          <b>Yordam kerakmi?</b>
          <small>24/7 qo‘llab-quvvatlash. Savolingizni yozing.</small>
          <Link className="go" href="/community">
            Yozish <ChevronRight className="i" />
          </Link>
        </div>
      ) : (
        <Link className="sh-pro" href="/marketing" data-testid="sidebar-pro">
          <span className="crown">
            <Crown className="i" />
          </span>
          <b>StomaHub Pro</b>
          <small>Klinikangiz uchun yana ko‘proq imkoniyatlar</small>
          <span className="go">
            Batafsil <ChevronRight className="i" />
          </span>
        </Link>
      )}
    </aside>
  );
}
