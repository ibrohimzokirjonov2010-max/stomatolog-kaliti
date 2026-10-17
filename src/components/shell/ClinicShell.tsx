"use client";

import { type ReactNode } from "react";
import { DesktopHeader } from "@/components/desktop/desktop-header";
import { DesktopSidebar } from "@/components/desktop/desktop-sidebar";
import "./clinic-shell.css";

export function ClinicShell({ accent = "teal", children }: { accent?: "teal" | "blue"; children: ReactNode }) {
  return (
    <div className="sh dh" data-testid="clinic-shell" data-accent={accent}>
      <DesktopHeader searchPlaceholder="Qidirish..." />
      <div className="sh-body">
        <DesktopSidebar />
        <main className={accent === "blue" ? "sh-main dk shell-blue" : "sh-main dk shell-teal"}>{children}</main>
      </div>
    </div>
  );
}
