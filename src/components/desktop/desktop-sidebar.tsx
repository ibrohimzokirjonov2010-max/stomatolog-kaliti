"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Crown, Headset } from "lucide-react";
import { ShNavTree } from "@/components/nav/sh-nav-tree";
import "./desktop-chrome.css";

const HELP_PREFIXES = ["/mening-klinikam", "/klinika", "/crm", "/profil", "/buyurtmalarim"];

function wantsHelp(pathname: string) {
  return HELP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** The one desktop sidebar: design groups, then StomaHub Pro (or help on clinic and profile). */
export function DesktopSidebar() {
  const pathname = usePathname() ?? "/";
  const help = wantsHelp(pathname);
  return (
    <aside className="sh-side" data-testid="desktop-sidebar">
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
