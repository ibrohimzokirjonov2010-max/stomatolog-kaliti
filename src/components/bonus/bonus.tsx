"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Gift, Sparkles } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import {
  BONUS_FIRST_PURCHASE_UZS,
  BONUS_SIGNUP_UZS,
  clearBonus,
  fetchBonusQuote,
  getBonusSnapshot,
  readBonusChoice,
  refreshBonus,
  subscribeBonus,
  subscribeBonusChoice,
  writeBonusChoice,
  type BonusHistoryItem,
  type BonusInfo,
  type BonusQuote,
} from "@/lib/bonus";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const som = (n: number) => formatMoney(n, "UZS");

/** Live bonus balance of the signed-in doctor (server ledger). `info` is null when signed out. */
export function useBonus() {
  const { ready, profile } = useDoctorProfile();
  const snap = useSyncExternalStore(subscribeBonus, getBonusSnapshot, getBonusSnapshot);
  const uid = profile?.id;
  useEffect(() => {
    if (!ready) return;
    if (!uid) {
      clearBonus();
      return;
    }
    void refreshBonus();
  }, [ready, uid]);
  return { ready, signedIn: Boolean(profile), loaded: snap.loaded, info: uid ? snap.info : null, refresh: refreshBonus };
}

function usePair(info: BonusInfo | null) {
  return {
    signup: info?.rules.signup ?? BONUS_SIGNUP_UZS,
    first: info?.rules.firstPurchase ?? BONUS_FIRST_PURCHASE_UZS,
  };
}

/** /royxat promo (also reusable elsewhere). */
export function SignupBonusPromo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-[#CCFBF1] bg-[linear-gradient(135deg,#e6f7f6,#f4fbfb)] px-4 py-3.5",
        className,
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-white shadow-[0_6px_14px_rgba(15, 118, 110, 0.3)]">
        <Gift className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[14.5px] font-bold leading-snug text-[#111827]">
          Ro‘yxatdan o‘ting va {som(BONUS_SIGNUP_UZS)} bonus oling, birinchi xariddan keyin yana {som(BONUS_FIRST_PURCHASE_UZS)}
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[#5b6b8c]">
          Bonus telefon raqami tasdiqlangach beriladi (bir telefonga bir marta). Faqat Marketplace’da ishlatiladi, naqdga yechilmaydi.
        </p>
      </div>
    </div>
  );
}

/** Marketplace banner: promo for visitors, balance for new bonus users, nothing for older accounts. */
export function MarketplaceBonusBanner({ className }: { className?: string }) {
  const { ready, signedIn, loaded, info } = useBonus();
  const { first } = usePair(info);
  if (!ready) return null;
  if (!signedIn) {
    return (
      <div className={cn("flex flex-wrap items-center gap-3 rounded-2xl border border-[#F0FDFA] bg-[linear-gradient(135deg,#eaf2ff,#f6f9ff)] px-4 py-3", className)}>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-white">
          <Gift className="size-5" />
        </span>
        <p className="min-w-0 flex-1 basis-56 text-[13.5px] font-semibold leading-snug text-[#111827]">
          Ro‘yxatdan o‘ting — {som(BONUS_SIGNUP_UZS)} bonus, birinchi xariddan keyin yana {som(BONUS_FIRST_PURCHASE_UZS)}.{" "}
          <span className="font-medium text-[#5b6b8c]">Faqat Marketplace’da; bonus telefon tasdiqlangach beriladi.</span>
        </p>
        <Link href="/royxat" className="inline-flex h-9 items-center rounded-full bg-[#0F766E] px-4 text-[13px] font-bold text-white hover:bg-[#115E59]">
          Ro‘yxatdan o‘tish
        </Link>
      </div>
    );
  }
  if (!loaded || !info || !(info.signupGranted || info.signupEligible)) return null;
  if (!info.signupGranted) {
    return (
      <div className={cn("flex flex-wrap items-center gap-3 rounded-2xl border border-[#f3d9a4] bg-[#fffaf0] px-4 py-3", className)} data-testid="bonus-pending">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f59e0b] text-white"><Gift className="size-5" /></span>
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-[13.5px] font-bold text-[#7c4a03]">
            {som(info.rules.signup)} bonus <span className="ml-1 rounded-full bg-[#fff4e0] px-2 py-0.5 text-[10.5px] font-semibold text-[#b45309]">Kutilmoqda</span>
          </p>
          <p className="text-[12.5px] leading-snug text-[#8a5a14]">{pendingText(info)}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-2xl border border-[#F0FDFA] bg-[linear-gradient(135deg,#eaf2ff,#f6f9ff)] px-4 py-3", className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-white">
        <Gift className="size-5" />
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#5b6b8c]">Bonus balans</p>
        <p className="text-[20px] font-extrabold leading-tight text-[#111827]" data-testid="bonus-balance">{som(info.balance)}</p>
      </div>
      <p className="basis-56 text-[12.5px] leading-snug text-[#5b6b8c]">
        {info.firstPurchasePending ? (
          <>
            Birinchi xaridingiz yetkazilib, tasdiqlangach yana <b className="text-[#0F766E]">+{som(first)}</b>. Savatda “Bonus ishlatish”ni yoqing.
          </>
        ) : (
          <>Savatda “Bonus ishlatish”ni yoqing. Faqat Marketplace buyurtmalarida, naqdga yechilmaydi.</>
        )}
      </p>
    </div>
  );
}

/** Cart/checkout "Bonus ishlatish" controller: server quote + persisted choice. */
export function useBonusUse(cartLines: { productId: string; qty: number }[]) {
  const { info } = useBonus();
  const choice = useSyncExternalStore(subscribeBonusChoice, readBonusChoice, () => false);
  const [rawQuote, setQuote] = useState<BonusQuote | null>(null);
  const key = useMemo(() => JSON.stringify(cartLines.map((l) => [l.productId, l.qty])), [cartLines]);
  const balance = info?.balance ?? 0;
  const active = balance > 0 && cartLines.length > 0;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const t = setTimeout(() => {
      void fetchBonusQuote(cartLines).then((q) => {
        if (!cancelled) setQuote(q);
      });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, balance, active]);

  const quote = active ? rawQuote : null;
  const setEnabled = useCallback((on: boolean) => writeBonusChoice(on), []);
  const usable = quote?.usable ?? 0;
  const applied = choice && usable > 0 ? usable : 0;
  return { info, balance, quote, usable, enabled: choice && usable > 0, setEnabled, applied };
}

export type BonusUse = ReturnType<typeof useBonusUse>;

export function BonusUseCard({ use, className }: { use: BonusUse; className?: string }) {
  const { info, balance, quote, usable, enabled, setEnabled } = use;
  if (!info || (balance <= 0 && !info.signupGranted)) return null;
  if (balance <= 0) {
    return (
      <div className={cn("flex items-center gap-2.5 rounded-xl border border-[#F0FDFA] bg-[#f3f8ff] p-3", className)} data-testid="bonus-use-card">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#0F766E] text-white"><Gift className="size-4" /></span>
        <p className="text-[12.5px] text-[#5b6b8c]">
          Bonus balans: <b className="text-[#111827]">{som(0)}</b>
          {info.firstPurchasePending ? ` · birinchi xariddan keyin +${som(info.rules.firstPurchase)}` : ""}
        </p>
      </div>
    );
  }
  const noEligible = quote != null && quote.eligible <= 0;
  const disabled = usable <= 0;
  return (
    <div className={cn("rounded-xl border border-[#F0FDFA] bg-[#f3f8ff] p-3", className)} data-testid="bonus-use-card">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#0F766E] text-white">
          <Gift className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold text-[#111827]">Bonus ishlatish</p>
          <p className="text-[12px] text-[#5b6b8c]">Balans: {som(balance)}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Bonus ishlatish"
          disabled={disabled}
          onClick={() => setEnabled(!enabled)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40",
            enabled ? "bg-[#0F766E]" : "bg-[#cbd5e1]",
          )}
        >
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", enabled ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>
      <p className="mt-2 text-[12px] leading-snug text-[#5b6b8c]">
        {noEligible
          ? "Savatda Marketplace mahsuloti yo‘q — bonus faqat Marketplace’da (materiallar, implantlar, asboblar) ishlaydi."
          : usable > 0
            ? `Shu buyurtmada ${som(usable)} gacha ishlatiladi (Marketplace mahsulotlari summasining ${quote?.maxSharePercent ?? 50}% gacha).`
            : "Hisoblanmoqda…"}
      </p>
    </div>
  );
}

/** Explains the "Kutilmoqda" signup bonus. */
function pendingText(info: BonusInfo) {
  if (info.signupReason === "limit") return "Bu qurilma yoki tarmoqdan bugungi bonus limiti tugagan. Keyinroq avtomatik beriladi.";
  return info.verificationEnabled
    ? "Bonus telefon tasdiqlangach beriladi. Telefon raqamingizni tasdiqlang."
    : "Bonus telefon tasdiqlangach beriladi. Telefon tasdiqlash hozircha yoqilmagan — tez orada.";
}

const typeLabel: Record<string, string> = { signup: "Ro‘yxatdan o‘tish bonusi", first_purchase: "Birinchi xarid bonusi" };

type Row = { key: string; title: string; sub: string; amount: number; status: "given" | "pending" | "spent" | "refund" | "expired" };
const statusText: Record<Row["status"], string> = {
  given: "Berildi",
  pending: "Kutilmoqda",
  spent: "Ishlatildi",
  refund: "Qaytarildi",
  expired: "Muddati tugadi",
};
const statusClass: Record<Row["status"], string> = {
  given: "bg-[#e7f8ee] text-[#15803d]",
  pending: "bg-[#fff4e0] text-[#b45309]",
  spent: "bg-[#eef1f6] text-[#4b5568]",
  refund: "bg-[#F0FDFA] text-[#115E59]",
  expired: "bg-[#fef2f2] text-[#dc2626]",
};
const dateOf = (iso: string) => new Date(iso).toLocaleDateString("uz-UZ");

/** Ledger rows + not-yet-granted ("Kutilmoqda") bonuses, newest first with pending on top. */
function buildRows(info: BonusInfo): Row[] {
  const rows: Row[] = [];
  if (info.signupGranted && !info.firstPurchaseGranted) {
    rows.push({
      key: "pending-first",
      title: typeLabel.first_purchase,
      sub: "Birinchi Marketplace xaridingiz yetkazilib, siz tasdiqlagach beriladi",
      amount: info.rules.firstPurchase,
      status: "pending",
    });
  } else if (!info.signupGranted && info.signupEligible) {
    rows.push({
      key: "pending-signup",
      title: typeLabel.signup,
      sub: pendingText(info),
      amount: info.rules.signup,
      status: "pending",
    });
  }
  info.history.forEach((h: BonusHistoryItem, i) => {
    const status: Row["status"] = h.kind === "grant" ? "given" : h.kind === "spend" ? "spent" : h.kind === "refund" ? "refund" : "expired";
    const title =
      h.kind === "grant" ? (h.type && typeLabel[h.type]) || "Bonus"
      : h.kind === "spend" ? "Buyurtmada ishlatildi"
      : h.kind === "refund" ? "Bonus qaytarildi"
      : "Bonus muddati tugadi";
    rows.push({
      key: `h${i}`,
      title,
      sub: `${dateOf(h.createdAt)}${h.orderId ? ` · ${h.orderId}` : ""}`,
      amount: h.amount,
      status,
    });
  });
  return rows;
}

/** Balance card for profile / "Buyurtmalarim" / /bonuslarim. `compact` shows the last 3 rows and links to the full page. */
export function BonusBalanceCard({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { ready, signedIn, loaded, info } = useBonus();
  if (ready && !signedIn && !compact) {
    return (
      <section className={cn("rounded-[20px] border border-[#e8eef4] bg-white px-4 py-6 text-center text-[13.5px] text-[#6b7280]", className)}>
        Bonuslaringizni ko‘rish uchun{" "}
        <Link href="/kirish?next=/bonuslarim" className="font-semibold text-[#0F766E] hover:underline">tizimga kiring</Link>.
      </section>
    );
  }
  if (!loaded || !info) return null;
  if (!info.signupGranted && !info.signupEligible && info.history.length === 0) {
    return compact ? null : (
      <section className={cn("rounded-[20px] border border-[#e8eef4] bg-white px-4 py-6 text-center text-[13.5px] text-[#6b7280]", className)}>
        Bonus dasturi faqat yangi ro‘yxatdan o‘tgan shifokorlar uchun. Sizning hisobingizda bonus yo‘q.
      </section>
    );
  }
  const rows = buildRows(info);
  const shown = compact ? rows.slice(0, 3) : rows;
  return (
    <section
      className={cn("overflow-hidden rounded-[20px] border border-[#F0FDFA] bg-[linear-gradient(135deg,#eaf2ff,#f8fbff)] shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)]", className)}
      data-testid="bonus-balance-card"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#0F766E] text-white shadow-[0_6px_14px_rgba(15, 118, 110, 0.3)]">
          <Gift className="size-5" />
        </span>
        <div className="min-w-0 flex-1 basis-40">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#5b6b8c]">Bonus balans (Marketplace)</p>
          <p className="text-[22px] font-extrabold leading-tight text-[#111827]">{som(info.balance)}</p>
          {info.expiresAt && info.balance > 0 ? (
            <p className="text-[11.5px] text-[#5b6b8c]">Amal qilish muddati: {dateOf(info.expiresAt)} gacha</p>
          ) : null}
        </div>
        <p className="basis-52 text-[12px] leading-snug text-[#5b6b8c]">
          Faqat Marketplace buyurtmalarida, to‘lovning {info.rules.maxSharePercent}% gacha. Naqdga yechilmaydi.
        </p>
      </div>
      {shown.length ? (
        <ul className="divide-y divide-[#F0FDFA] border-t border-[#F0FDFA] bg-white/80 text-[13px]" data-testid="bonus-history">
          {shown.map((r) => (
            <li key={r.key} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[#1a1d26]">{r.title}</p>
                <p className="truncate text-[11.5px] text-[#8b93a7]">{r.sub}</p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", statusClass[r.status])}>{statusText[r.status]}</span>
              <span className={cn("w-[84px] shrink-0 text-right font-semibold", r.status === "pending" ? "text-[#b45309]" : r.amount >= 0 ? "text-[#16a34a]" : "text-[#4b5568]")}>
                {r.amount >= 0 ? "+" : "−"}{som(Math.abs(r.amount))}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {compact ? (
        <Link href="/bonuslarim" className="block border-t border-[#F0FDFA] bg-white/80 px-4 py-2.5 text-center text-[13px] font-semibold text-[#0F766E] hover:bg-white sm:px-5">
          Bonuslarim tarixi →
        </Link>
      ) : null}
    </section>
  );
}

const SEEN_KEY = "sk-bonus-seen-v1";
function readSeen(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}
export function markBonusSeen(id: string, type: string) {
  try {
    const key = `${id}:${type}`;
    const seen = readSeen();
    if (!seen.includes(key)) window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, key]));
  } catch {
    /* ignore */
  }
}

/** Congratulation notices for granted bonuses the doctor has not dismissed yet (signup / first purchase). */
export function BonusNotice({ className }: { className?: string }) {
  const { loaded, info } = useBonus();
  const { profile } = useDoctorProfile();
  const [hidden, setHidden] = useState<string[]>([]);
  if (!loaded || !info || !profile) return null;
  const seen = readSeen(); // only reached after the client-side fetch, so no SSR mismatch
  const grants = info.history.filter((h) => h.kind === "grant" && h.type);
  const unseen = grants.filter((h) => !seen.includes(`${profile.id}:${h.type}`) && !hidden.includes(h.type as string));
  if (!unseen.length) return null;
  return (
    <div className={cn("space-y-2", className)} data-testid="bonus-notice">
      {unseen.map((h) => (
        <div key={h.type} className="flex items-start gap-3 rounded-2xl border border-[#b7e4c7] bg-[#effaf3] px-4 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#16a34a] text-white"><Sparkles className="size-4.5" /></span>
          <p className="min-w-0 flex-1 text-[13.5px] font-semibold leading-snug text-[#14532d]">
            {h.type === "signup"
              ? `Tabriklaymiz! ${som(h.amount)} bonus hisobingizga berildi. Birinchi xaridingiz yetkazilgach yana ${som(info.rules.firstPurchase)}.`
              : `Tabriklaymiz! Birinchi xarid bonusi — ${som(h.amount)} hisobingizga berildi.`}
          </p>
          <button
            type="button"
            className="shrink-0 text-[12px] font-semibold text-[#15803d] hover:underline"
            onClick={() => {
              markBonusSeen(profile.id, h.type as string);
              setHidden((x) => [...x, h.type as string]);
            }}
          >
            Yopish
          </button>
        </div>
      ))}
    </div>
  );
}
