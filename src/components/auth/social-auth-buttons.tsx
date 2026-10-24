"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { AuthField, AuthPrimaryButton, authInputClassName } from "@/components/auth/auth-card";
import { readAttribution } from "@/lib/attribution";
import { afterAuthPath } from "@/lib/auth-next";
import { trackLeadConversion } from "@/lib/track-lead";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (cb?: (notification: { isNotDisplayed: () => boolean }) => void) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
    onTelegramAuth?: (user: TelegramWidgetUser) => void;
  }
}

type TelegramWidgetUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
};

type ModalKind = "google" | "telegram" | null;

function GoogleMark() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function TelegramMark() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        fill="#fff"
        d="M17.6 7.2 6.9 11.3c-.7.3-.7.7-.1.9l2.7.8 1 .3.4-1.1c.1-.3.5-.2.5 0l1.1 2.8c.1.4.4.5.7.3l7.2-4.4c.5-.3.3-.9-.6-1.7z"
      />
    </svg>
  );
}

export function SocialAuthButtons({
  locked = false,
  onLockedClick,
  placement = "before",
  verb = "davom etish",
}: {
  locked?: boolean;
  onLockedClick?: () => void;
  /** "before": buttons above the phone form with "yoki" under them; "after": "yoki" first, buttons below the form. */
  placement?: "before" | "after";
  /** Ending of the fallback Google label, e.g. "kirish" or "ro‘yxatdan o‘tish". */
  verb?: string;
}) {
  const router = useRouter();
  const { acceptServerProfile, ready } = useDoctorProfile();
  const [modal, setModal] = useState<ModalKind>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const tgMountRef = useRef<HTMLDivElement>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
  // The Telegram Login Widget needs the bot domain set via BotFather (/setdomain); until then it shows "Bot domain invalid".
  // Enable explicitly with NEXT_PUBLIC_TELEGRAM_LOGIN_ENABLED=true once the domain is configured.
  const telegramEnabled = process.env.NEXT_PUBLIC_TELEGRAM_LOGIN_ENABLED?.trim().toLowerCase() === "true";
  const telegramBot = telegramEnabled ? process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() || "" : "";

  const finish = useCallback(
    (rawProfile: unknown, leadCreated = false) => {
      setError("");
      const result = acceptServerProfile(rawProfile);
      if (!result.ok) {
        setError("Kirish amalga oshmadi. Qayta urinib ko‘ring.");
        return;
      }
      if (leadCreated) trackLeadConversion();
      setModal(null);
      router.push(afterAuthPath(result.profile.phone));
    },
    [acceptServerProfile, router],
  );

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setError("");
      setBusy(true);
      try {
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential, attribution: readAttribution() }),
        });
        const result = (await response.json().catch(() => null)) as
          | { ok?: boolean; profile?: unknown; leadCreated?: boolean }
          | null;
        if (!response.ok || !result?.ok) {
          setError("Google tasdiqlanmadi. Iltimos, qayta urinib ko‘ring.");
          return;
        }
        finish(result.profile, Boolean(result.leadCreated));
      } catch {
        setError("Google bilan kirib bo‘lmadi. Qayta urinib ko‘ring.");
      } finally {
        setBusy(false);
      }
    },
    [finish],
  );

  const handleTelegramAuth = useCallback(
    async (user: TelegramWidgetUser) => {
      setError("");
      setBusy(true);
      try {
        const response = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const result = (await response.json().catch(() => null)) as
          | { ok?: boolean; user?: TelegramWidgetUser }
          | null;

        if (!response.ok || !result?.ok || !result.user) {
          setError("Telegram tasdiqlanmadi. Iltimos, qayta urinib ko‘ring.");
          return;
        }

        finish((result as { profile?: unknown }).profile);
      } catch {
        setError("Telegramni tasdiqlab bo‘lmadi. Iltimos, qayta urinib ko‘ring.");
      } finally {
        setBusy(false);
      }
    },
    [finish],
  );

  // Google Identity Services when client id is set
  useEffect(() => {
    if (!googleClientId || !ready) return;

    const scriptId = "google-gsi";
    function init() {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: { credential?: string }) => {
          if (!response.credential) {
            setError("Google ma’lumoti olinmadi.");
            return;
          }
          void handleGoogleCredential(response.credential);
        },
      });
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 360,
          text: "continue_with",
          shape: "pill",
        });
      }
    }

    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      if (window.google?.accounts?.id) {
        init();
      } else {
        existingScript.addEventListener("load", init, { once: true });
      }
      return () => existingScript.removeEventListener("load", init);
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
    return () => script.removeEventListener("load", init);
  }, [googleClientId, ready, handleGoogleCredential]);

  // Telegram Login Widget when bot username is set
  useEffect(() => {
    if (!telegramBot || !ready || !tgMountRef.current) return;

    window.onTelegramAuth = handleTelegramAuth;

    const mount = tgMountRef.current;
    mount.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", telegramBot);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "20");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    mount.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [telegramBot, ready, handleTelegramAuth]);

  function openFallback(kind: ModalKind) {
    setError("");
    setFullName("");
    setEmail("");
    setTelegramUsername("");
    setModal(kind);
  }

  function submitFallback(event: FormEvent) {
    event.preventDefault();
    // Unverified name-only login is disabled: sessions are issued only after
    // Google/Telegram verification on the server, or phone + password.
    setError(
      modal === "google"
        ? "Google kirish hozircha sozlanmagan. Telefon va parol bilan kiring."
        : "Telegram kirish hozircha sozlanmagan. Telefon va parol bilan kiring.",
    );
  }

  const divider = (
    <div className="relative flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-[#e8eef4]" />
      <span className="text-[13px] font-medium text-[#8b93a7]">yoki</span>
      <div className="h-px flex-1 bg-[#e8eef4]" />
    </div>
  );

  return (
    <div className="relative space-y-3">
      {placement === "after" ? divider : null}
      {locked ? (
        <button
          type="button"
          aria-label="Avval Shartlar va Maxfiylik siyosatiga rozilik bering"
          onClick={onLockedClick}
          className={`absolute inset-x-0 z-10 h-12 cursor-not-allowed rounded-xl bg-white/60 ${placement === "after" ? "top-[42px]" : "top-0"}`}
        />
      ) : null}
      {googleClientId ? (
        <div ref={googleBtnRef} className="flex min-h-12 w-full justify-center overflow-hidden rounded-xl" />
      ) : (
        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => openFallback("google")}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#e2e8f0] bg-white text-[15px] font-semibold text-[#1a1d26] transition hover:bg-[#f8fafc] disabled:opacity-60"
        >
          <GoogleMark />
          Google bilan {verb}
        </button>
      )}

      {telegramBot ? <div ref={tgMountRef} className="flex min-h-12 w-full justify-center" /> : null}

      {placement === "before" ? divider : null}

      {error && !modal ? (
        <p className="rounded-xl bg-[#fff1f0] px-3 py-2.5 text-[13px] font-medium text-[#d92d20]">
          {error}
        </p>
      ) : null}

      {modal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-outfit)] text-xl font-bold text-[#0f172a]">
                  {modal === "google" ? "Google bilan kirish" : "Telegram bilan kirish"}
                </h2>
                <p className="mt-1 text-[14px] text-[#64748b]">
                  {modal === "google"
                    ? "Ismingizni yozing — profilingiz tayyor bo‘ladi."
                    : "Ism va Telegram @username yozing."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="grid size-10 place-items-center rounded-full text-[#64748b] hover:bg-[#f1f5f9]"
                aria-label="Yopish"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={submitFallback} className="space-y-4">
              <AuthField label="To‘liq ism">
                <input
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Aliyev Jasur"
                  className={authInputClassName()}
                  autoFocus
                />
              </AuthField>
              {modal === "google" ? (
                <AuthField label="Email" hint="ixtiyoriy">
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@gmail.com"
                    className={authInputClassName()}
                  />
                </AuthField>
              ) : (
                <AuthField label="Telegram">
                  <input
                    type="text"
                    autoComplete="username"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="@username"
                    className={authInputClassName()}
                  />
                </AuthField>
              )}
              {error ? (
                <p className="rounded-xl bg-[#fff1f0] px-3 py-2.5 text-[13px] font-medium text-[#d92d20]">
                  {error}
                </p>
              ) : null}
              <AuthPrimaryButton disabled={busy || !ready}>
                {busy ? "Kutilmoqda…" : "Davom etish"}
              </AuthPrimaryButton>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
