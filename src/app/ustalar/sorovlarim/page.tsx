"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, MapPin, Phone, Send } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUstaWork } from "@/components/usta-provider";
import { phoneHref, requestServices, requestServicesV2, serviceLabels, telegramHref } from "@/data/masters";
import { formatUzDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { statusCopy, whenCopy, type RequestStatus, type UstaRequest } from "@/lib/usta-work";

function rank(item: UstaRequest) {
  if (item.status === "yuborildi") return 0;
  if (item.status === "jarayonda") return 1;
  if (item.status === "bajarildi") return 2;
  return 3;
}

export default function UstaRequestsPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const { requests, incoming, setStatus, requestsReady, authed } = useUstaWork();
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") === "kelgan" ? "kelgan" : "yuborgan";
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const source = tab === "kelgan" ? incoming : requests;
  const items = [...source].sort((a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt));

  async function change(id: string, status: RequestStatus) {
    if (busyId) return;
    setBusyId(id);
    setError("");
    const res = await setStatus(id, status);
    setBusyId(null);
    if (!res.ok) setError(res.error);
  }

  return (
    <div>
      <header className="mb-4">
        <p className="text-[13px] text-[#8b93a7]">
          <Link href="/ustalar" className="text-[#0F766E] hover:underline">
            Ustalar
          </Link>
          <span className="mx-1">/</span>
          <span>Mening so‘rovlarim</span>
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#111827] lg:text-[#1a1d26]">Mening so‘rovlarim</h1>
        <p className="mt-1 text-sm text-[#8b93a7]">Usta telefon raqami faqat u so‘rovingizni qabul qilgandan keyin ochiladi.</p>
        <div className="mt-3 inline-flex rounded-full bg-[#eef2f8] p-1" role="tablist">
          {(
            [
              ["yuborgan", `Yuborganlarim${requests.length ? ` (${requests.length})` : ""}`],
              ["kelgan", `Kelgan so‘rovlar${incoming.length ? ` (${incoming.length})` : ""}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => router.replace(id === "kelgan" ? "/ustalar/sorovlarim?tab=kelgan" : "/ustalar/sorovlarim", { scroll: false })}
              className={cn("h-10 rounded-full px-4 text-[13px] font-semibold", tab === id ? "bg-white text-[#0F766E] shadow-sm" : "text-[#6b7280]")}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {error ? <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      {requestsReady && !authed ? (
        <div className="rounded-[18px] border border-[#eceff5] bg-white px-6 py-16 text-center shadow-[0_4px_14px_rgba(17, 24, 39, 0.04)]">
          <p className="text-[16px] font-semibold text-[#1a1d26]">Avval tizimga kiring</p>
          <p className="mt-1 text-sm text-[#8b93a7]">So‘rovlaringiz akkauntingizga bog‘langan.</p>
          <Link href="/kirish?next=/ustalar/sorovlarim" className={cn(buttonVariants(), "mt-5 inline-flex h-12 min-w-[160px] !rounded-2xl text-[14px] font-semibold")}>
            Kirish
          </Link>
        </div>
      ) : !requestsReady ? (
        <p className="py-10 text-center text-sm text-[#8b93a7]">Yuklanmoqda…</p>
      ) : items.length === 0 ? (
        <div className="rounded-[18px] border border-[#eceff5] bg-white px-6 py-16 text-center shadow-[0_4px_14px_rgba(17, 24, 39, 0.04)]" data-testid="usta-requests-empty">
          <p className="text-[16px] font-semibold text-[#1a1d26]">{tab === "kelgan" ? "Hali so‘rov kelmagan" : "Hali so‘rov yo‘q"}</p>
          <p className="mt-1 text-sm text-[#8b93a7]">
            {tab === "kelgan" ? "Usta profilingiz tasdiqlangach, klinikalardan kelgan so‘rovlar shu yerda ko‘rinadi." : "Usta tanlab xizmat so‘rovi yuboring."}
          </p>
          <Link href={tab === "kelgan" ? "/ustalar/mening" : "/ustalar"} className={cn(buttonVariants(), "mt-5 inline-flex h-12 min-w-[160px] !rounded-2xl text-[14px] font-semibold")}>
            {tab === "kelgan" ? "Mening usta profilim" : "Ustalar"}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3" data-testid="usta-requests">
          {items.map((item) => (
            <RequestRow key={item.id} item={item} incoming={tab === "kelgan"} busy={busyId === item.id} onStatus={change} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestRow({ item, incoming, busy, onStatus }: { item: UstaRequest; incoming: boolean; busy: boolean; onStatus: (id: string, status: RequestStatus) => void }) {
  const v2 = (item.services ?? []).map((id) => requestServicesV2.find((row) => row.id === id)?.label ?? id);
  const service = v2.length ? v2.join(", ") : requestServices.find((row) => row.id === item.service)?.label ?? serviceLabels[item.service];
  const when = `${item.when === "sana" && item.date ? formatUzDate(item.date).when : whenCopy[item.when]}${item.timeRange ? `, ${item.timeRange}` : ""}`;
  const badge = statusCopy[item.status];
  return (
    <li className="rounded-[18px] border border-[#eceff5] bg-white p-4 shadow-[0_4px_14px_rgba(17, 24, 39, 0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-[#1a1d26]">{incoming ? item.name : item.masterName}</p>
          <p className="mt-0.5 text-[13px] text-[#4b5568]">{service}</p>
        </div>
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", badge.className)}>{badge.label}</span>
      </div>
      <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-[#8b93a7]">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          {item.clinic}
          {item.district ? ` · ${item.district}` : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5" />
          {when}
        </span>
      </p>
      {item.note ? <p className="mt-2 text-[13px] leading-relaxed text-[#4b5568]">{item.note}</p> : null}
      {item.address ? <p className="mt-1 text-[12px] text-[#8b93a7]">{item.address}</p> : null}
      {item.extra ? <p className="mt-1 text-[12.5px] text-[#4b5568]">Qo‘shimcha: {item.extra}</p> : null}
      {item.media?.length ? (
        <div className="mt-2 flex gap-1.5 overflow-x-auto" data-testid="request-media">
          {item.media.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[#f4f6fa]">
              {/\.(mp4|mov|webm)$/i.test(url) ? (
                <video src={url} muted playsInline preload="metadata" className="size-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="Biriktirilgan rasm" className="size-full object-cover" loading="lazy" />
              )}
            </a>
          ))}
        </div>
      ) : null}
      {incoming ? (
        <p className="mt-1 text-[12.5px] text-[#4b5568]">
          <a href={phoneHref(item.phone)} className="font-semibold text-[#0F766E]">{item.phone}</a>
        </p>
      ) : item.masterPhone ? (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px]" data-testid="master-phone">
          <a href={phoneHref(item.masterPhone)} className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-3 py-1.5 font-semibold text-[#0F766E]">
            <Phone className="size-3.5" />
            {item.masterPhone}
          </a>
          {item.masterTelegram ? (
            <a href={telegramHref(item.masterTelegram)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-3 py-1.5 font-semibold text-[#0F766E]">
              <Send className="size-3.5" />
              Telegram
            </a>
          ) : null}
        </p>
      ) : item.status === "yuborildi" ? (
        <p className="mt-1 text-[12px] text-[#8b93a7]">Usta raqami u qabul qilgach ochiladi.</p>
      ) : null}
      {item.status === "yuborildi" || item.status === "jarayonda" ? (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {incoming && item.status === "yuborildi" ? (
            <>
              <Button type="button" className="h-11 min-w-[112px] !rounded-2xl text-[13px] font-semibold" disabled={busy} onClick={() => onStatus(item.id, "jarayonda")}>
                Qabul qilish
              </Button>
              <Button type="button" variant="outline" className="h-11 !rounded-2xl text-[13px] font-semibold" disabled={busy} onClick={() => onStatus(item.id, "rad")}>
                Rad etish
              </Button>
            </>
          ) : null}
          {incoming && item.status === "jarayonda" ? (
            <>
              <Button type="button" className="h-11 min-w-[112px] !rounded-2xl text-[13px] font-semibold" disabled={busy} onClick={() => onStatus(item.id, "bajarildi")}>
                Bajarildi
              </Button>
              <Button type="button" variant="ghost" className="h-11 !rounded-2xl text-[13px] font-semibold text-[#8b93a7]" disabled={busy} onClick={() => onStatus(item.id, "bekor")}>
                Bekor qilish
              </Button>
            </>
          ) : null}
          {!incoming ? (
            <Button type="button" variant="ghost" className="h-11 !rounded-2xl text-[13px] font-semibold text-[#8b93a7]" disabled={busy} onClick={() => onStatus(item.id, "bekor")}>
              So‘rovni bekor qilish
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
