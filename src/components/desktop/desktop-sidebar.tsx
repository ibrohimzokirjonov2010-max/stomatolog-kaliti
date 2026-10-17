"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { ShNavTree, useProfilActive } from "@/components/nav/sh-nav-tree";
import "./desktop-chrome.css";

/** The one desktop sidebar: ShNavTree plus Profil. Page promos stay in the content column. */
export function DesktopSidebar() {
  const profilActive = useProfilActive();
  return (
    <aside className="sh-side" data-testid="desktop-sidebar">
      <ShNavTree />
      <Link className={profilActive ? "sh-nav active" : "sh-nav"} href="/profil" title="Profil">
        <UserRound className="i" />
        <span>Profil</span>
      </Link>
    </aside>
  );
}
