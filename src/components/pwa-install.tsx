"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Share, SquarePlus, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "sh_pwa_dismissed_at";
const DISMISS_DAYS = 7;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const ua = window.navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|Instagram|FBAN|FBAV|Telegram/i.test(ua);
  return ios && !otherBrowser;
}

/** Product, cart and checkout keep a sticky Savatga / pay button. The banner must not sit on it. */
function coversStickyCta(path: string) {
  if (path.startsWith("/product/")) return true;
  if (path === "/savat" || path.startsWith("/savat/")) return true;
  if (path === "/cart" || path.startsWith("/cart/")) return true;
  if (path === "/checkout" || path.startsWith("/checkout/")) return true;
  if (path === "/buyurtma" || path.startsWith("/buyurtma/")) return true;
  if (/^\/forma\/[^/]+/.test(path) && !path.startsWith("/forma/buyurtmalarim")) return true;
  if (/^\/jihozlar\/[^/]+/.test(path)) return true;
  if (!path.startsWith("/marketplace/")) return false;
  const rest = path.slice("/marketplace/".length);
  if (!rest || rest.startsWith("dokon") || rest.startsWith("sotuvchi") || rest.startsWith("brendlar") || rest.startsWith("aksiyalar")) return false;
  return true;
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

/** Registers the service worker and shows a small "install app" card on phones. */
export function PwaInstall() {
  const pathname = usePathname() ?? "/";
  const hidden = coversStickyCta(pathname);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [bottom, setBottom] = useState("0.75rem");

  useEffect(() => {
    const show = (m: "android" | "ios") => {
      if (coversStickyCta(window.location.pathname)) return;
      const cart = document.querySelector("[data-sticky-cta]");
      const hasTabBar = !!document.querySelector('nav[aria-label="Mobil menyu"]');
      const bottom = cart
        ? "calc(9.4rem + env(safe-area-inset-bottom))"
        : hasTabBar
          ? "calc(4.6rem + env(safe-area-inset-bottom))"
          : "calc(0.75rem + env(safe-area-inset-bottom))";
      setBottom(bottom);
      setMode(m);
    };
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    if (isStandalone()) return;

    const forced = new URLSearchParams(window.location.search).get("pwa");
    const blocked = recentlyDismissed() && !forced;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!blocked) show("android");
    };
    const onInstalled = () => {
      setMode(null);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let t: number | undefined;
    if (forced === "ios" || (!blocked && isIosSafari())) {
      t = window.setTimeout(() => show("ios"), 2500);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (t) window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!mode || hidden) return;
    const cart = document.querySelector("[data-sticky-cta]");
    const hasTabBar = !!document.querySelector('nav[aria-label="Mobil menyu"]');
    setBottom(
      cart
        ? "calc(9.4rem + env(safe-area-inset-bottom))"
        : hasTabBar
          ? "calc(4.6rem + env(safe-area-inset-bottom))"
          : "calc(0.75rem + env(safe-area-inset-bottom))",
    );
  }, [hidden, mode, pathname]);

  useEffect(() => {
    if (!mode || hidden) return;
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "calc(7.5rem + env(safe-area-inset-bottom))";
    return () => {
      document.body.style.paddingBottom = prev;
    };
  }, [hidden, mode]);

  if (!mode || hidden) return null;

  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setMode(null);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
    setMode(null);
  };

  return (
    <div
      role="dialog"
      aria-label="StomaHub ilovasini o‘rnatish"
      className="fixed inset-x-3 z-[45] mx-auto max-w-md lg:hidden"
      style={{ bottom }}
    >
      <div className="relative flex items-start gap-3 rounded-2xl border border-[#e3ebfa] bg-white p-3 pr-9 text-[#0B1220] shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/pwa/icon-192.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-tight">StomaHub ilovasini o‘rnating</p>
          {mode === "android" ? (
            <>
              <p className="mt-0.5 text-[12.5px] leading-snug text-[#5b6478]">
                Telefon ekraniga qo‘shing — ilova kabi tez ochiladi.
              </p>
              <button
                type="button"
                onClick={install}
                className="mt-2 h-9 rounded-xl bg-[#0F766E] px-4 text-[13.5px] font-semibold text-white active:scale-[0.98]"
              >
                O‘rnatish
              </button>
            </>
          ) : (
            <p className="mt-1 text-[12.5px] leading-snug text-[#5b6478]">
              Pastdagi{" "}
              <span className="inline-flex translate-y-[2px] items-center text-[#0F766E]">
                <Share className="size-4" aria-label="Ulashish" />
              </span>{" "}
              <b className="text-[#0B1220]">Ulashish</b> tugmasini bosing, so‘ng{" "}
              <span className="inline-flex translate-y-[2px] items-center text-[#0B1220]">
                <SquarePlus className="size-4" aria-hidden />
              </span>{" "}
              <b className="text-[#0B1220]">«Bosh ekranga qo‘shish»</b> (Add to Home Screen) ni tanlang.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Yopish"
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-[#8b93a7] hover:bg-[#f2f5fb]"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
