"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Percent,
  Trash2,
  Wallet,
  Hourglass,
  Landmark,
} from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { LineChart, Panel, PillTabs, SelectBox, SoonTag, shortMoney } from "@/components/seller-desktop-ui";
import { cardBrandLabel } from "@/data/shops";
import { displayCommissionRate } from "@/lib/order-money";
import { formatMoney } from "@/lib/format";
import { pingSellerLive } from "@/lib/use-seller-live";
import { cn } from "@/lib/utils";

type LedgerRow = { id: number; orderId: string; kind: "release" | "commission"; amount: number; createdAt: string; payment?: string };
type PayoutRow = {
  id: string; amount: number; status: "pending" | "paid" | "rejected"; createdAt: string; processedAt?: string; adminNote?: string;
  cardLast4?: string; cardHolder?: string; cardBank?: string; cardBrand?: string; unseen?: boolean;
};
type Finance = {
  commissionRate: number;
  released: number;
  commission: number;
  reserved: number;
  balance: number;
  held: number;
  heldGross: number;
  heldCommission: number;
  heldOrders: number;
  ledger: LedgerRow[];
  payouts: PayoutRow[];
  payoutsUnseen?: number;
};

type PayRow = { key: string; at: string; type: "in" | "out"; order: string; method: string; amount: number; status: string; tone: string; note?: string };

type PayTab = "overview" | "card" | "settlements" | "history" | "fees";

const TABS: { id: PayTab; label: string }[] = [
  { id: "overview", label: "Umumiy" },
  { id: "card", label: "Karta sozlamalari" },
  { id: "settlements", label: "Hisob-kitoblar" },
  { id: "history", label: "To‘lov tarixi" },
  { id: "fees", label: "Chegirmalar va komissiyalar" },
];

const MIN_PAYOUT = 1000;
const pad = (n: number) => String(n).padStart(2, "0");
const dKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};
const payLabel = (p?: string) => (p === "click" ? "Click" : p === "payme" ? "Payme" : p === "naqd" ? "Naqd pul" : "—");

const cardErrors: Record<string, string> = {
  holder: "Karta egasining ismini kiriting.",
  expiry: "Amal qilish muddati noto‘g‘ri (MM/YY).",
  number: "Karta raqami noto‘g‘ri.",
  brand: "Faqat Uzcard, Humo, Visa yoki Mastercard.",
  luhn: "Karta raqami noto‘g‘ri.",
  session: "Avval tizimga kiring.",
};

function maskNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}
function maskExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function Metric({ icon, tone, title, value, hint }: { icon: ReactNode; tone: string; title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-[#eceff5] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <span className={cn("grid size-11 place-items-center rounded-xl", tone)}>{icon}</span>
        <p className="text-[13px] font-medium text-[#6b7280]">{title}</p>
      </div>
      <p className="mt-3 text-[26px] leading-none font-extrabold tracking-tight text-[#0B1F4D]">{value}</p>
      <p className="mt-2.5 flex items-center gap-1 text-[12.5px] font-medium text-[#0066FF]">
        {hint}
        <ArrowRight className="size-3.5" />
      </p>
    </div>
  );
}

export function SellerPaymentsDesktop({ cardSettings }: { cardSettings: ReactNode }) {
  const { shopOrders, card, linkCard, unlinkCard, session } = useSellerWork();
  const [tab, setTab] = useState<PayTab>("overview");
  const [fin, setFin] = useState<Finance | null>(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState("7");
  const [showAll, setShowAll] = useState(false);

  // refresh whenever orders change (status / escrow moves)
  const orderSig = useMemo(() => shopOrders.map((o) => `${o.id}:${o.paymentState}`).join("|"), [shopOrders]);
  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    let alive = true;
    fetch("/api/seller/finance", { credentials: "same-origin", cache: "no-store" })
      .then((res) => res.json() as Promise<{ ok?: boolean; finance?: Finance; error?: string }>)
      .then((data) => {
        if (!alive) return;
        if (data.ok && data.finance) {
          setFin(data.finance);
          setError("");
          if ((data.finance.payoutsUnseen ?? 0) > 0) {
            // the seller has now seen the status change → clear the nav badge (rows keep their "Yangi" tag until next reload)
            void fetch("/api/seller/finance", {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "seen" }),
            }).then(() => pingSellerLive());
          }
        } else setError(data.error ?? "Yuklab bo‘lmadi.");
      })
      .catch(() => alive && setError("Tarmoq xatosi."));
    return () => {
      alive = false;
    };
  }, [orderSig, tick]);

  /* chart series from real ledger */
  const days = Number(range);
  const chart = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    const labels: string[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      keys.push(dKey(d));
      labels.push(`${pad(d.getDate())}.${pad(d.getMonth() + 1)}`);
    }
    const idx = new Map(keys.map((k, i) => [k, i]));
    const received = keys.map(() => 0);
    const comm = keys.map(() => 0);
    for (const r of fin?.ledger ?? []) {
      const i = idx.get(dKey(new Date(r.createdAt)));
      if (i == null) continue;
      if (r.kind === "release") received[i] += r.amount;
      else comm[i] += r.amount;
    }
    const tips = keys.map((k) => {
      const [y, m, d] = k.split("-");
      return `${d}.${m}.${y}`;
    });
    return { labels, tips, received, comm };
  }, [fin, days]);

  const rows = useMemo(() => {
    const list: PayRow[] = [];
    for (const r of fin?.ledger ?? []) {
      if (r.kind !== "release") continue;
      list.push({ key: `l${r.id}`, at: r.createdAt, type: "in", order: r.orderId, method: payLabel(r.payment), amount: r.amount, status: "Olingan", tone: "green" });
    }
    for (const p of fin?.payouts ?? []) {
      list.push({
        key: `p${p.id}`,
        at: p.createdAt,
        type: "out",
        order: "—",
        method: p.cardLast4 ? `${p.cardBrand ? `${p.cardBrand} ` : ""}•••• ${p.cardLast4}` : "—",
        amount: p.amount,
        status: p.status === "pending" ? "Jarayonda" : p.status === "paid" ? "Bajarildi" : "Rad etildi",
        note: p.adminNote,
        tone: p.status === "pending" ? "amber" : p.status === "paid" ? "green" : "red",
      });
    }
    return list.sort((a, b) => b.at.localeCompare(a.at));
  }, [fin]);

  const money = (n: number) => formatMoney(n, "UZS");

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#0B1F4D]">Karta va to‘lov</h1>
        <p className="mt-1 text-[13.5px] text-[#6b7280]">To‘lov sozlamalari, balans, to‘lov tarixi va hisob-kitoblar.</p>
      </header>

      <PillTabs tabs={TABS} value={tab} onChange={setTab} />

      {error ? <p className="rounded-xl bg-[#fef2f2] px-3 py-2 text-[13px] text-[#b91c1c]">{error}</p> : null}

      {tab === "overview" ? (
        <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Metric
                icon={<Wallet className="size-5 text-[#0066FF]" />}
                tone="bg-[#e8f1ff]"
                title="Hisob balansi"
                value={fin ? money(fin.balance) : "…"}
                hint="Sotuvlardan kelgan mablag‘"
              />
              <Metric
                icon={<Hourglass className="size-5 text-[#d97706]" />}
                tone="bg-[#fff4e5]"
                title="Kutilayotgan to‘lov"
                value={fin ? money(fin.held) : "…"}
                hint={fin ? `Escrowda (${fin.heldOrders} ta buyurtma)` : "…"}
              />
              <Metric
                icon={<CheckCircle2 className="size-5 text-[#16a34a]" />}
                tone="bg-[#ecfdf3]"
                title="Jami olingan to‘lov"
                value={fin ? money(fin.released) : "…"}
                hint="Hamma vaqt davomida"
              />
            </div>

            <Panel
              title="To‘lovlar dinamikasi"
              action={
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-3 text-[12px] text-[#4b5568]">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#0066FF]" />
                      Olingan to‘lovlar
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#7c3aed]" />
                      Komissiya
                    </span>
                  </span>
                  <SelectBox
                    label="Davr"
                    value={range}
                    onChange={setRange}
                    options={[
                      { value: "7", label: "7 kun" },
                      { value: "14", label: "14 kun" },
                      { value: "30", label: "30 kun" },
                    ]}
                  />
                </div>
              }
            >
              <div className="mt-4">
                <LineChart
                  labels={chart.labels}
                  tooltipLabels={chart.tips}
                  series={[
                    { key: "rec", label: "Olingan to‘lovlar", color: "#0066FF", values: chart.received, area: true, fmt: money },
                    { key: "com", label: "Komissiya", color: "#7c3aed", values: chart.comm, fmt: money },
                  ]}
                  height={210}
                />
              </div>
            </Panel>

            <Panel
              title="So‘nggi to‘lovlar"
              action={
                rows.length > 6 ? (
                  <button type="button" className="text-[12.5px] font-semibold text-[#0066FF] hover:underline" onClick={() => setTab("history")}>
                    Barchasini ko‘rish
                  </button>
                ) : null
              }
            >
              <PaymentsTable rows={rows.slice(0, 6)} money={money} />
            </Panel>
          </div>

          <aside className="space-y-4">
            <CardsPanel card={card} linkCard={linkCard} unlinkCard={unlinkCard} holderDefault={session?.ownerName ?? ""} />
            <Panel title="To‘lov olish sozlamalari">
              <dl className="mt-3 divide-y divide-[#f1f4f9] text-[13px]">
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <dt className="text-[#6b7280]">To‘lov usullari</dt>
                  <dd className="font-semibold text-[#0B1F4D]">Naqd pul</dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <dt className="text-[#6b7280]">Click, Payme, Uzum</dt>
                  <dd className="font-semibold text-[#8b93a7]">Tez orada</dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <dt className="text-[#6b7280]">Hisob-kitob davri</dt>
                  <dd className="font-semibold text-[#8b93a7]">Tez orada</dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <dt className="text-[#6b7280]">Minimal chiqarib olish</dt>
                  <dd className="font-semibold text-[#0B1F4D]">{money(MIN_PAYOUT)}</dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <dt className="text-[#6b7280]">Komissiya</dt>
                  <dd className="font-semibold text-[#0B1F4D]">{fin ? `${displayCommissionRate(fin.commissionRate)}%` : "…"}</dd>
                </div>
              </dl>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[#8b93a7]">
                Komissiyani platforma belgilaydi. Hozircha faqat Naqd pul ishlaydi. Click, Payme va Uzum ulanmagan.
              </p>
            </Panel>
            <PayoutPanel fin={fin} card={card} onDone={load} money={money} />
          </aside>
        </div>
      ) : null}

      {tab === "card" ? <div className="max-w-3xl">{cardSettings}</div> : null}

      {tab === "history" ? (
        <Panel
          title="To‘lov tarixi"
          action={<span className="text-[12.5px] text-[#8b93a7]">{rows.length} ta yozuv</span>}
        >
          <PaymentsTable rows={showAll ? rows : rows.slice(0, 25)} money={money} />
          {!showAll && rows.length > 25 ? (
            <button type="button" className="mt-3 text-[13px] font-semibold text-[#0066FF] hover:underline" onClick={() => setShowAll(true)}>
              Yana ko‘rsatish ({rows.length - 25})
            </button>
          ) : null}
        </Panel>
      ) : null}

      {tab === "fees" ? (
        <div className="grid grid-cols-3 gap-4">
          <Metric icon={<Percent className="size-5 text-[#7c3aed]" />} tone="bg-[#f3e8ff]" title="Komissiya stavkasi" value={fin ? `${displayCommissionRate(fin.commissionRate)}%` : "…"} hint="Buyurtmadagi stavka bilan bir xil" />
          <Metric icon={<Landmark className="size-5 text-[#0066FF]" />} tone="bg-[#e8f1ff]" title="Ushlangan komissiya" value={fin ? money(fin.commission) : "…"} hint="Yetkazilgan buyurtmalardan" />
          <Metric icon={<Clock className="size-5 text-[#d97706]" />} tone="bg-[#fff4e5]" title="Kutilayotgan komissiya" value={fin ? money(fin.heldCommission) : "…"} hint="Escrowdagi buyurtmalardan" />
          <Panel title="Chegirmalar" className="col-span-3">
            <p className="mt-2 flex items-center gap-2 text-[13px] text-[#6b7280]">
              Do‘kon darajasidagi aksiya va promokodlar <SoonTag />
            </p>
            <p className="mt-1 text-[12.5px] text-[#8b93a7]">Mahsulot chegirmasini “Mahsulotlar” bo‘limida har bir mahsulot uchun belgilaysiz.</p>
          </Panel>
        </div>
      ) : null}

      {tab === "settlements" ? (
        <Panel title="Hisob-kitoblar">
          <div className="mt-6 grid place-items-center py-10 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-[#f1f4f9]">
              <Clock className="size-7 text-[#8b93a7]" />
            </span>
            <p className="mt-3 text-[15px] font-bold text-[#0B1F4D]">Tez orada</p>
            <p className="mt-1 max-w-sm text-[13px] text-[#6b7280]">
              Davriy hisob-kitoblar (reestr) hali ulanmagan. Hozircha tushumlar “To‘lov tarixi”da ko‘rinadi.
            </p>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function StatusPill({ tone, children }: { tone: string; children: ReactNode }) {
  const cls = tone === "green" ? "bg-[#ecfdf3] text-[#15803d]" : tone === "amber" ? "bg-[#fff4e5] text-[#c2410c]" : "bg-[#fef2f2] text-[#b91c1c]";
  return <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-semibold", cls)}>{children}</span>;
}

function PaymentsTable({
  rows,
  money,
}: {
  rows: PayRow[];
  money: (n: number) => string;
}) {
  if (!rows.length) {
    return <p className="mt-4 rounded-xl bg-[#f7f9fc] px-4 py-8 text-center text-[13px] text-[#8b93a7]">Hozircha to‘lovlar yo‘q. Shifokor buyurtmani qabul qilgach, tushum shu yerda ko‘rinadi.</p>;
  }
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-[#eef1f6] text-[11.5px] font-semibold text-[#8b93a7]">
            <th className="w-10 py-2.5">#</th>
            <th className="py-2.5">Sana</th>
            <th className="py-2.5">Turi</th>
            <th className="py-2.5">Buyurtma</th>
            <th className="py-2.5">To‘lov usuli</th>
            <th className="py-2.5 text-right">Summa</th>
            <th className="py-2.5 pl-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-[#f4f6fa] last:border-0">
              <td className="py-3">
                <span className={cn("grid size-7 place-items-center rounded-full", r.type === "in" ? "bg-[#ecfdf3] text-[#16a34a]" : "bg-[#fef2f2] text-[#dc2626]")}>
                  {r.type === "in" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                </span>
              </td>
              <td className="py-3 text-[#4b5568]">{fmtDate(r.at)}</td>
              <td className="py-3 font-medium text-[#0B1F4D]">{r.type === "in" ? "Sotuvdan tushum" : "Pul yechib olish"}</td>
              <td className="py-3 font-medium text-[#0066FF]">{r.order}</td>
              <td className="py-3 text-[#4b5568]">{r.method}</td>
              <td className={cn("py-3 text-right font-bold whitespace-nowrap", r.type === "in" ? "text-[#16a34a]" : "text-[#dc2626]")}>
                {r.type === "in" ? "+ " : "- "}
                {money(r.amount)}
              </td>
              <td className="py-3 pl-4">
                <StatusPill tone={r.tone}>{r.status}</StatusPill>
                {r.note ? <span className="mt-1 block max-w-[220px] text-[11.5px] leading-snug text-[#6b7280]">{r.note}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardsPanel({
  card,
  linkCard,
  unlinkCard,
  holderDefault,
}: {
  card: ReturnType<typeof useSellerWork>["card"];
  linkCard: ReturnType<typeof useSellerWork>["linkCard"];
  unlinkCard: () => void;
  holderDefault: string;
}) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ holder: holderDefault, number: "", expiry: "", bank: "" });

  function submit(e: FormEvent) {
    e.preventDefault();
    const res = linkCard(form);
    if (!res.ok) return setErr(cardErrors[res.reason] ?? "Karta qo‘shilmadi.");
    setErr("");
    setForm({ holder: form.holder, number: "", expiry: "", bank: form.bank });
    setOpen(false);
  }

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">To‘lov kartalari</span>
      }
      action={
        <button
          type="button"
          disabled
          className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-xl border border-[#e4e9f2] px-3 text-[12.5px] font-semibold text-[#8b93a7]"
        >
          Karta qo‘shish · Tez orada
        </button>
      }
    >
      <div className="mt-3 space-y-2.5">
        {card ? (
          <div className="flex items-center gap-3 rounded-xl border border-[#e4e9f2] p-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e8f1ff]">
              <CreditCard className="size-5 text-[#0066FF]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-[#0B1F4D]">
                {card.bank || cardBrandLabel[card.brand]}
                <span className="rounded-full bg-[#ecfdf3] px-2 py-0.5 text-[10.5px] font-semibold text-[#15803d]">Asosiy karta</span>
              </p>
              <p className="mt-0.5 text-[12.5px] tracking-wide text-[#4b5568]">**** **** **** {card.last4}</p>
              <p className="truncate text-[11.5px] text-[#8b93a7] uppercase">
                {card.holder} · {cardBrandLabel[card.brand]} · {card.expiryMasked}
              </p>
            </div>
            <button type="button" onClick={unlinkCard} className="grid size-8 place-items-center rounded-lg text-[#8b93a7] hover:bg-[#fef2f2] hover:text-[#dc2626]" aria-label="Kartani o‘chirish">
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : (
          <p className="rounded-xl bg-[#f7f9fc] px-3 py-4 text-center text-[13px] text-[#8b93a7]">Karta ulanmagan.</p>
        )}
      </div>
      <p className="mt-3 rounded-xl bg-[#fff8ec] px-3 py-2 text-[11.5px] leading-relaxed text-[#9a5b0c]">
        <b>Xavfsizlik:</b> to‘liq karta raqami hech qayerda saqlanmaydi. Brauzerda faqat oxirgi 4 raqam va brend turadi; pul yechish so‘rovida serverga oxirgi 4 raqam, karta egasi va bank yuboriladi.
      </p>
      {open ? (
        <form className="mt-3 grid grid-cols-2 gap-2.5" onSubmit={submit}>
          <label className="col-span-2 text-[12px] font-medium text-[#4b5568]">
            Karta raqami
            <input
              className="mt-1 h-10 w-full rounded-lg border border-[#e4e9f2] px-3 text-[13.5px] tracking-wide outline-none focus:border-[#0066FF]"
              inputMode="numeric"
              autoComplete="off"
              placeholder="4242 4242 4242 4242"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: maskNumber(e.target.value) })}
            />
          </label>
          <label className="text-[12px] font-medium text-[#4b5568]">
            Amal qilish (MM/YY)
            <input
              className="mt-1 h-10 w-full rounded-lg border border-[#e4e9f2] px-3 text-[13.5px] outline-none focus:border-[#0066FF]"
              inputMode="numeric"
              placeholder="12/28"
              value={form.expiry}
              onChange={(e) => setForm({ ...form, expiry: maskExpiry(e.target.value) })}
            />
          </label>
          <label className="text-[12px] font-medium text-[#4b5568]">
            Bank (ixtiyoriy)
            <input
              className="mt-1 h-10 w-full rounded-lg border border-[#e4e9f2] px-3 text-[13.5px] outline-none focus:border-[#0066FF]"
              placeholder="Kapitalbank"
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
            />
          </label>
          <label className="col-span-2 text-[12px] font-medium text-[#4b5568]">
            Karta egasi
            <input
              className="mt-1 h-10 w-full rounded-lg border border-[#e4e9f2] px-3 text-[13.5px] outline-none focus:border-[#0066FF]"
              value={form.holder}
              onChange={(e) => setForm({ ...form, holder: e.target.value })}
            />
          </label>
          {card ? <p className="col-span-2 text-[11.5px] text-[#8b93a7]">Hozircha bitta karta saqlanadi.</p> : null}
          {err ? <p className="col-span-2 text-[12.5px] text-[#dc2626]">{err}</p> : null}
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="h-10 rounded-xl bg-[#0066FF] px-4 text-[13px] font-semibold text-white hover:bg-[#0055d4]">
              Ulash
            </button>
            <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border border-[#e4e9f2] px-4 text-[13px] font-semibold text-[#4b5568]">
              Bekor
            </button>
          </div>
        </form>
      ) : null}
    </Panel>
  );
}

function PayoutPanel({ fin, card, onDone, money }: { fin: Finance | null; card: ReturnType<typeof useSellerWork>["card"]; onDone: () => void | Promise<void>; money: (n: number) => string }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const value = Number(amount.replace(/\D/g, "")) || 0;
  const balance = fin?.balance ?? 0;
  const invalid = value < MIN_PAYOUT || value > balance || !card;

  async function submit() {
    if (invalid || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/seller/finance", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        // only masked requisites leave the browser: last 4 digits, holder, bank, brand — never the full number
        body: JSON.stringify({ amount: value, card: card ? { last4: card.last4, holder: card.holder, bank: card.bank ?? "", brand: cardBrandLabel[card.brand] } : null }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setMsg({ ok: true, text: "So‘rov yuborildi. Holati pastda ko‘rinadi — admin ko‘rib chiqadi." });
        setAmount("");
        await onDone();
      } else setMsg({ ok: false, text: data.error ?? "Yuborib bo‘lmadi." });
    } catch {
      setMsg({ ok: false, text: "Tarmoq xatosi." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Pul yechib olish">
      <label className="mt-3 block text-[12px] font-medium text-[#4b5568]">
        Summani kiriting (so‘m)
        <input
          className="mt-1 h-11 w-full rounded-xl border border-[#e4e9f2] px-3.5 text-[15px] font-semibold text-[#0B1F4D] outline-none focus:border-[#0066FF]"
          inputMode="numeric"
          value={amount ? new Intl.NumberFormat("ru-RU").format(value) : ""}
          placeholder="500 000"
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <p className="mt-1.5 text-[12px] text-[#8b93a7]">Mavjud: {money(balance)}</p>
      {!card ? <p className="mt-1 text-[12px] text-[#c2410c]">Pul yechish uchun avval «To‘lov kartalari»da karta qo‘shing.</p> : <p className="mt-1 text-[12px] text-[#8b93a7]">Karta: {cardBrandLabel[card.brand]} •••• {card.last4} · {card.holder}</p>}
      <button
        type="button"
        disabled={invalid || busy}
        onClick={submit}
        className="mt-3 h-11 w-full rounded-xl bg-[#0066FF] text-[14px] font-semibold text-white transition-colors hover:bg-[#0055d4] disabled:cursor-not-allowed disabled:bg-[#b9d2ff]"
      >
        {busy ? "Yuborilmoqda…" : "So‘rov yuborish"}
      </button>
      {msg ? <p className={cn("mt-2 text-[12.5px]", msg.ok ? "text-[#15803d]" : "text-[#dc2626]")}>{msg.text}</p> : null}
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-[#8b93a7]">
        So‘rovlar odatda 1–24 soat ichida qayta ishlanadi. Serverga faqat karta oxirgi 4 raqami, egasi va banki yuboriladi; pul o‘tkazmasini admin qo‘lda bajaradi.
      </p>
      {fin?.payouts.length ? (
        <div className="mt-3 border-t border-[#eef1f6] pt-3">
          <p className="mb-2 text-[12.5px] font-bold text-[#0B1F4D]">So‘rovlar holati</p>
          <ul className="space-y-2">
            {fin.payouts.slice(0, 5).map((p) => {
              const st = p.status === "pending" ? ["Jarayonda", "amber"] : p.status === "paid" ? ["Bajarildi", "green"] : ["Rad etildi", "red"];
              return (
                <li key={p.id} className="rounded-xl bg-[#f7f9fc] px-3 py-2 text-[12.5px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#0B1F4D]">{money(p.amount)}</span>
                    <span className="flex items-center gap-1.5">
                      {p.unseen ? <span className="rounded-full bg-[#ef4444] px-1.5 text-[10px] leading-[16px] font-bold text-white">Yangi</span> : null}
                      <StatusPill tone={st[1]}>{st[0]}</StatusPill>
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-[#8b93a7]">{fmtDate(p.createdAt)}{p.cardLast4 ? ` · •••• ${p.cardLast4}` : ""}</p>
                  {p.adminNote ? <p className="mt-1 text-[12px] text-[#4b5568]">{p.status === "rejected" ? "Sabab" : "Izoh"}: {p.adminNote}</p> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </Panel>
  );
}

export { shortMoney };
