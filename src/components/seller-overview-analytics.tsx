"use client";

import { useMemo } from "react";
import { BarChart3, Package, TrendingUp } from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { formatMoney } from "@/lib/format";
import { salesLast7Days, topSoldProducts } from "@/lib/seller-work";
import { cn } from "@/lib/utils";

const SAMPLE_SALES = [
  { label: "18.09", total: 1_200_000, count: 1 },
  { label: "19.09", total: 0, count: 0 },
  { label: "20.09", total: 2_450_000, count: 2 },
  { label: "21.09", total: 890_000, count: 1 },
  { label: "22.09", total: 3_100_000, count: 3 },
  { label: "23.09", total: 1_750_000, count: 2 },
  { label: "24.09", total: 2_200_000, count: 2 },
];

function BarChart({
  points,
  sample,
}: {
  points: { label: string; total: number }[];
  sample?: boolean;
}) {
  const max = Math.max(...points.map((p) => p.total), 1);
  return (
    <div className="mt-3">
      <div className="flex h-28 items-end gap-1.5 sm:h-36 sm:gap-2">
        {points.map((p) => {
          const h = Math.max(6, Math.round((p.total / max) * 100));
          return (
            <div key={p.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <div
                className={cn(
                  "w-full max-w-[28px] rounded-t-md sm:max-w-[36px]",
                  sample ? "bg-[#93c5fd]/80" : "bg-[#0066FF]",
                )}
                style={{ height: `${h}%` }}
                title={formatMoney(p.total, "UZS")}
              />
              <span className="shrink-0 text-[9px] font-medium text-[#8b93a7] sm:text-[10px]">{p.label}</span>
            </div>
          );
        })}
      </div>
      {sample ? (
        <p className="mt-2 text-[11px] text-[#8b93a7]">Namuna diagramma — haqiqiy buyurtmalar kelganda yangilanadi.</p>
      ) : null}
    </div>
  );
}

function SectionDonut({
  marketplace,
  forma,
  jihozlar,
}: {
  marketplace: number;
  forma: number;
  jihozlar: number;
}) {
  const total = marketplace + forma + jihozlar;
  const parts = [
    { id: "marketplace", label: "Marketplace", value: marketplace, color: "#0066FF" },
    { id: "forma", label: "Forma", value: forma, color: "#16a34a" },
    { id: "jihozlar", label: "Jihozlar", value: jihozlar, color: "#f59e0b" },
  ];
  const r = 36;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const slices =
    total === 0
      ? [{ color: "#e6eaf2", dash: c, offset: 0 }]
      : parts
          .filter((p) => p.value > 0)
          .map((p) => {
            const dash = (p.value / total) * c;
            const slice = { color: p.color, dash, offset: -offset };
            offset += dash;
            return slice;
          });

  return (
    <div className="mt-3 flex items-center gap-4">
      <svg viewBox="0 0 96 96" className="size-20 shrink-0 sm:size-24" aria-hidden>
        <g transform="rotate(-90 48 48)">
          {slices.map((s, i) => (
            <circle
              key={i}
              cx="48"
              cy="48"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${s.dash} ${c - s.dash}`}
              strokeDashoffset={s.offset}
            />
          ))}
        </g>
        <text x="48" y="52" textAnchor="middle" className="fill-[#1a1d26] text-[14px] font-bold">
          {total}
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {parts.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 text-[12.5px]">
            <span className="inline-flex items-center gap-1.5 text-[#4b5568]">
              <span className="size-2.5 rounded-full" style={{ background: p.color }} />
              {p.label}
            </span>
            <span className="font-semibold text-[#1a1d26]">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SellerOverviewAnalytics() {
  const { session, shopOrders, myProducts, stats } = useSellerWork();
  const shopId = session?.id ?? "";

  const sales = useMemo(() => (shopId ? salesLast7Days(shopOrders, shopId) : []), [shopId, shopOrders]);
  const hasSales = sales.some((d) => d.total > 0 || d.count > 0);
  const chartPoints = hasSales ? sales : SAMPLE_SALES;

  const top = useMemo(
    () => (shopId ? topSoldProducts(shopOrders, shopId, myProducts, 5) : []),
    [myProducts, shopId, shopOrders],
  );

  const weekTotal = hasSales ? sales.reduce((a, d) => a + d.total, 0) : 0;

  return (
    <div className="space-y-2.5 sm:space-y-4">
      <section className="rounded-[14px] border border-[#eceff5] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-[16px] sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-[#1a1d26] sm:text-[16px]">
              <BarChart3 className="size-4 text-[#0066FF]" />
              Sotuv — oxirgi 7 kun
            </h2>
            <p className="mt-0.5 text-[12px] text-[#8b93a7] sm:text-[13px]">
              {hasSales ? `Jami: ${formatMoney(weekTotal, "UZS")}` : "Hali buyurtma yo‘q — namuna ko‘rinish"}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f1ff] px-2 py-0.5 text-[11px] font-semibold text-[#0066FF]">
            <TrendingUp className="size-3" />
            Demo
          </span>
        </div>
        <BarChart points={chartPoints} sample={!hasSales} />
      </section>

      <section className="rounded-[14px] border border-[#eceff5] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-[16px] sm:p-5">
        <h2 className="text-[15px] font-semibold text-[#1a1d26] sm:text-[16px]">Mahsulotlar bo‘limlari</h2>
        <p className="mt-0.5 text-[12px] text-[#8b93a7]">Marketplace / Forma / Jihozlar</p>
        <SectionDonut
          marketplace={stats.bySection.marketplace}
          forma={stats.bySection.forma}
          jihozlar={stats.bySection.jihozlar}
        />
      </section>

      <section className="rounded-[14px] border border-[#eceff5] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-[16px] sm:p-5">
        <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-[#1a1d26] sm:text-[16px]">
          <Package className="size-4 text-[#0066FF]" />
          Eng ko‘p sotilganlar
        </h2>
        <p className="mt-0.5 text-[12px] text-[#8b93a7]">Demo buyurtmalardan</p>
        {top.length ? (
          <ol className="mt-3 space-y-2">
            {top.map((row, i) => (
              <li
                key={row.productId + row.name}
                className="flex items-center gap-2.5 rounded-[12px] border border-[#eceff5] bg-[#f7f9fc] p-2 sm:p-2.5"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-[#0066FF]">
                  {i + 1}
                </span>
                {row.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.image} alt="" className="size-10 rounded-lg object-contain bg-white" />
                ) : (
                  <span className="size-10 rounded-lg bg-white" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#1a1d26]">{row.name}</p>
                  <p className="truncate text-[11px] text-[#8b93a7]">
                    {row.brand} · {row.qty} dona
                  </p>
                </div>
                <p className="shrink-0 text-[12px] font-semibold text-[#1a1d26]">{formatMoney(row.revenue, "UZS")}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-3 rounded-xl bg-[#f7f9fc] px-3 py-6 text-center">
            <p className="text-[14px] font-medium text-[#1a1d26]">Hali sotuv yo‘q</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#8b93a7]">
              Mijoz buyurtma bersa, shu yerda top mahsulotlar chiqadi. Namuna: Marketplace orqali o‘zingiz test
              buyurtma qiling.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
