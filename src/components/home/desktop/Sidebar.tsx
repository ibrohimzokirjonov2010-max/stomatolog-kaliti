"use client";

import Link from "next/link";
import { ChevronRight, Crown, User } from "lucide-react";
import { ShNavTree, useProfilActive } from "@/components/nav/sh-nav-tree";

export default function Sidebar() {
  const profilActive = useProfilActive();

  return (
    <aside className="sh-side">
      <ShNavTree />
      <Link className={profilActive ? "sh-nav active" : "sh-nav"} href="/profil" title="Profil">
        <User className="i" />
        <span>Profil</span>
      </Link>
      <Link className="sh-pro" href="/marketing">
        <span className="crown">
          <Crown className="i" />
        </span>
        <b>StomaHub Pro</b>
        <small>Klinikangiz uchun yana ko‘proq imkoniyatlar</small>
        <span className="go">
          Batafsil <ChevronRight className="i" />
        </span>
      </Link>
    </aside>
  );
}
