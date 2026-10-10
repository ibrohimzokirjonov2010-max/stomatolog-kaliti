"use client";

import { useEffect, useSyncExternalStore } from "react";

export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  orderId: string | null;
  readAt: string | null;
  createdAt: string;
};

type State = { items: AppNotification[]; unread: number; loaded: boolean };

const EMPTY: State = { items: [], unread: 0, loaded: false };
const POLL_MS = 12000;

let state: State = EMPTY;
const subs = new Set<() => void>();
let users = 0;
let timer: number | undefined;
let inflight: Promise<void> | null = null;

function set(next: State) {
  state = next;
  subs.forEach((f) => f());
}

/** Reload from the server (the read state lives in the database, so every device agrees). */
export function refreshNotifications(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (inflight) return inflight;
  inflight = fetch("/api/notifications", { cache: "no-store", credentials: "same-origin" })
    .then((r) => r.json())
    .then((j: { ok?: boolean; items?: AppNotification[]; unread?: number }) => {
      if (!j?.ok) return;
      set({ items: j.items ?? [], unread: Number(j.unread ?? 0), loaded: true });
    })
    .catch(() => undefined)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function tick() {
  if (document.visibilityState === "visible") void refreshNotifications();
}

function start() {
  void refreshNotifications();
  timer = window.setInterval(tick, POLL_MS);
  document.addEventListener("visibilitychange", tick);
  window.addEventListener("focus", tick);
  window.addEventListener("sk-notifs-refresh", tick);
}

function stop() {
  window.clearInterval(timer);
  document.removeEventListener("visibilitychange", tick);
  window.removeEventListener("focus", tick);
  window.removeEventListener("sk-notifs-refresh", tick);
  set(EMPTY);
}

async function postRead(body: { ids?: number[]; all?: boolean }) {
  try {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
  } catch {
    /* next poll reconciles */
  }
}

export function markNotificationRead(id: number) {
  const target = state.items.find((n) => n.id === id);
  if (!target || target.readAt) return;
  const now = new Date().toISOString();
  set({ ...state, items: state.items.map((n) => (n.id === id ? { ...n, readAt: now } : n)), unread: Math.max(0, state.unread - 1) });
  void postRead({ ids: [id] });
}

export function markAllNotificationsRead() {
  if (!state.unread) return;
  const now = new Date().toISOString();
  set({ ...state, items: state.items.map((n) => (n.readAt ? n : { ...n, readAt: now })), unread: 0 });
  void postRead({ all: true });
}

/** Ask for an immediate reload (e.g. right after the user changed an order). */
export function pingNotifications() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("sk-notifs-refresh"));
}

function subscribe(cb: () => void) {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

/** Shared notification list; polls every ~12 s and on tab focus while at least one consumer is enabled. */
export function useNotifications(enabled: boolean) {
  const s = useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
  useEffect(() => {
    if (!enabled) return;
    users += 1;
    if (users === 1) start();
    return () => {
      users -= 1;
      if (users === 0) stop();
    };
  }, [enabled]);
  return s;
}

export function notificationTimeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Hozir";
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} kun oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
}
