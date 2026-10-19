"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { desktopItemActive, desktopNavGroups, navMoreIcon, navTop, type NavItem } from "@/data/nav";
import { useNavTree } from "@/components/nav/use-nav-tree";
import "./nav-tree.css";

/** Grouped, collapsible nav for the desktop `.sh` shells (Bosh sahifa + four design groups). */
export function ShNavTree({ variant = "sh" }: { variant?: "sh" | "brd" }) {
  const base = variant === "brd" ? "brd-item" : "sh-nav";
  const on = variant === "brd" ? " on" : " active";
  const { activeHref, isOpen, toggle, isYanaOpen, toggleYana } = useNavTree("desktop");
  const link = (item: NavItem, sub = false) => {
    const Icon = item.icon;
    const active = desktopItemActive(item, activeHref);
    return (
      <Link
        key={`${item.href}-${item.label}`}
        className={`${base}${sub ? " nt-sub" : ""}${active ? on : ""}`}
        href={item.href}
        title={item.label}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="i" />
        <span>{item.label}</span>
      </Link>
    );
  };
  return (
    <nav className={variant === "brd" ? "brd-navlist nt nt-brd" : "sh-side-nav nt"} aria-label="Asosiy menyu">
      {link(navTop)}
      {desktopNavGroups.map((group) => {
        const open = isOpen(group.id);
        const GroupIcon = group.icon;
        const more = group.more ?? [];
        const yanaOpen = isYanaOpen(group.id);
        const MoreIcon = navMoreIcon;
        return (
          <div className={`${variant === "brd" ? "" : "sh-group "}nt-group${open ? " open" : ""}`} key={group.id} data-group={group.id}>
            <button type="button" className="nt-head" aria-expanded={open} onClick={() => toggle(group.id)} title={group.title}>
              <GroupIcon className="i nt-gi" />
              <span>{group.title}</span>
              <ChevronDown className="i nt-chev" />
            </button>
            {open ? (
              <div className="nt-items">
                {group.items.map((item) => link(item, true))}
                {more.length ? (
                  <div className={`nt-yana${yanaOpen ? " open" : ""}`}>
                    <button
                      type="button"
                      className={`${base} nt-sub nt-yana-btn`}
                      aria-expanded={yanaOpen}
                      onClick={() => toggleYana(group.id)}
                    >
                      <MoreIcon className="i" />
                      <span>Yana...</span>
                      <ChevronDown className="i nt-chev" />
                    </button>
                    {yanaOpen ? more.map((item) => link(item, true)) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function useProfilActive() {
  const { activeHref } = useNavTree();
  return activeHref === "/profil";
}
