"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { markAllNotificationsRead, markNotificationRead, notificationTimeAgo, useNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";

/**
 * Real notification center (reads the `notifications` table). The badge/dot only shows while something is unread;
 * read state is stored in the database. Used by the desktop topbar and the phone header.
 */
export function NotificationBell({
  variant,
  buttonClassName,
  minBadge = 0,
}: {
  variant: "desktop" | "mobile";
  buttonClassName?: string;
  /** Shown when the account has no unread items yet, so a designed home badge can stay visible. */
  minBadge?: number;
}) {
  const { profile } = useDoctorProfile();
  const { items, unread, loaded } = useNotifications(Boolean(profile));
  const [open, setOpen] = useState(false);
  const mobile = variant === "mobile";
  const badge = unread > 0 ? unread : minBadge;

  return (
    <div className={cn(mobile ? "" : "relative")}>
      <button
        type="button"
        aria-label={badge ? `Bildirishnomalar, ${badge} ta yangi` : "Bildirishnomalar"}
        aria-expanded={open}
        data-testid="notif-bell"
        onClick={() => setOpen((v) => !v)}
        className={cn("relative grid place-items-center", mobile ? "size-11 rounded-xl text-[#1a1d26]" : "size-10 rounded-full hover:bg-slate-50", buttonClassName)}
      >
        <Bell className={cn(mobile ? "size-5" : "size-[18px] text-slate-600")} />
        {badge > 0 ? (
          <span
            data-testid="notif-badge"
            className={cn(
              "absolute flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[10px] font-bold text-white ring-2 ring-white",
              mobile ? "top-1.5 right-1.5" : "top-0.5 right-0.5",
            )}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button type="button" aria-label="Yopish" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Bildirishnomalar"
            className={cn(
              "z-40 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_12px_40px_rgba(15,23,42,0.14)]",
              mobile ? "fixed inset-x-3 top-[calc(env(safe-area-inset-top)+3.6rem)]" : "absolute right-0 mt-2 w-[360px]",
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#f0f3f8] px-4 py-3">
              <p className="text-[14px] font-semibold text-[#1a1d26]">Bildirishnomalar</p>
              {unread > 0 ? (
                <button type="button" data-testid="notif-read-all" onClick={() => markAllNotificationsRead()} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0F766E]">
                  <CheckCheck className="size-3.5" /> Hammasini o‘qilgan qilish
                </button>
              ) : null}
            </div>
            <div className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5">
              {!profile ? (
                <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">Bildirishnomalarni ko‘rish uchun tizimga kiring.</p>
              ) : !loaded ? (
                <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">Yuklanmoqda…</p>
              ) : items.length === 0 ? (
                <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">Hozircha bildirishnoma yo‘q.</p>
              ) : (
                items.slice(0, 20).map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || "/buyurtmalarim"}
                    onClick={() => {
                      markNotificationRead(n.id);
                      setOpen(false);
                    }}
                    className={cn("block rounded-xl px-3 py-2.5 hover:bg-slate-50", !n.readAt && "bg-[#F0FDFA]")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13.5px] font-semibold text-[#1a1d26]">{n.title}</p>
                      {!n.readAt ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#0F766E]" aria-label="O‘qilmagan" /> : null}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{notificationTimeAgo(n.createdAt)}</p>
                  </Link>
                ))
              )}
            </div>
            <div className="border-t border-[#f0f3f8] px-3 py-2.5">
              <Link href="/buyurtmalarim" onClick={() => setOpen(false)} className="block rounded-xl py-2 text-center text-[13px] font-semibold text-[#0F766E] hover:bg-[#F0FDFA]">
                Buyurtmalarim
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
