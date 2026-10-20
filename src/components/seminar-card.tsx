"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Monitor,
  Tag,
  User,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SeatOccupancyLine, SeminarStatusBadge } from "@/components/seminar-status";
import { useSeminarRegs } from "@/components/seminar-provider";
import {
  getSeminarSpeakers,
  isSeminarUpcoming,
  seminarHref,
  seminarPriceText,
  type Seminar,
} from "@/data/seminars";
import { formatUzDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { seminarDate } from "@/data/seminars";

export function DateBadge({ iso, className }: { iso: string; className?: string }) {
  const date = formatUzDate(iso);
  return (
    <div
      className={cn(
        "rounded-[12px] bg-white px-2.5 py-1.5 text-center shadow-[0_6px_16px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      <p className="text-[18px] leading-none font-bold text-[#1a1d26]">{date.day}</p>
      <p className="mt-0.5 text-[10px] font-bold tracking-[0.08em] text-primary">{date.monthBadge}</p>
      <p className="text-[10px] font-medium text-[#8b93a7]">{date.year}</p>
    </div>
  );
}

export function MobileDateBadge({ iso, className }: { iso: string; className?: string }) {
  const date = formatUzDate(iso);
  return (
    <div
      className={cn(
        "flex size-[52px] shrink-0 flex-col items-center justify-center rounded-xl border border-[#dbe7ff] bg-[#eef4ff] text-[#0B1F4D]",
        className,
      )}
    >
      <p className="text-[16px] leading-none font-bold">{date.day}</p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#0066FF]">{date.monthBadge}</p>
    </div>
  );
}

export function MobileFeaturedDateBadge({ iso, className }: { iso: string; className?: string }) {
  const date = formatUzDate(iso);
  return (
    <div
      className={cn(
        "flex size-[54px] shrink-0 flex-col items-center justify-center rounded-xl bg-[#0B1F4D] text-white shadow-[0_6px_16px_rgba(11,31,77,0.28)]",
        className,
      )}
    >
      <p className="text-[18px] leading-none font-bold">{date.day}</p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90">{date.monthBadge}</p>
    </div>
  );
}

export function RegisterCta({
  seminar,
  featured = false,
  home = false,
}: {
  seminar: Seminar;
  featured?: boolean;
  home?: boolean;
}) {
  const { liveSeminar, seatsLeft, activeReg } = useSeminarRegs();
  const live = liveSeminar(seminar);
  const left = seatsLeft(seminar);
  const mine = activeReg(seminar.id);
  const upcoming = isSeminarUpcoming(live);
  const href = seminarHref(live.id);

  if (!upcoming) {
    return <p className="text-[12px] font-medium text-[#8b93a7]">O&apos;tgan</p>;
  }
  if (mine) {
    return (
      <Link
        href={home ? "/seminarlar/yozuvlarim" : href}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 font-semibold",
          featured || home ? "text-sm" : "text-[13px]",
          home && "mt-3 min-h-11",
        )}
      >
        <SeminarStatusBadge status={mine.status} />
        {mine.status === "pending" ? (
          <span className="text-primary">Tasdiqlash kerak</span>
        ) : (
          <span className="text-[#059669]">Tasdiqlangan</span>
        )}
      </Link>
    );
  }
  if (left <= 0) {
    return (
      <span
        className={cn(
          "font-semibold text-[#8b93a7]",
          featured || home
            ? "inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#f3f4f8] px-5 text-sm"
            : "text-[13px]",
          home && "mt-3 min-h-11",
        )}
      >
        Joy qolmadi
      </span>
    );
  }
  if (home) {
    return (
      <Link
        href={href}
        className={cn(
          buttonVariants({ size: "sm", variant: "outline" }),
          "mt-3 inline-flex min-h-11 w-full items-center justify-center !rounded-xl border-primary/35 bg-white text-[13px] font-semibold text-primary hover:bg-primary/5",
        )}
      >
        Ro&apos;yxatdan o&apos;tish
      </Link>
    );
  }
  if (featured) {
    return (
      <Link
        href={href}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0066FF] px-4 text-[13px] font-semibold text-white shadow-[0_6px_16px_rgba(0,102,255,0.35)] hover:bg-[#0052cc]"
      >
        Ro&apos;yxatdan o&apos;tish
        <ArrowRight className="size-4" />
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
    >
      Ro&apos;yxatdan o&apos;tish
      <ArrowRight className="size-3.5" />
    </Link>
  );
}

/** Poster-style seminar card — full image + bottom frosted glass bar */
export function SeminarCard({ seminar }: { seminar: Seminar }) {
  const { liveSeminar, seatsLeft } = useSeminarRegs();
  const live = liveSeminar(seminar);
  const date = seminarDate(live);
  const online = live.city === "Online";
  const upcoming = isSeminarUpcoming(live);
  const left = seatsLeft(seminar);
  const href = seminarHref(live.id);
  const shortTitle =
    live.title.length > 42 ? `${live.title.slice(0, 40).trim()}…` : live.title;

  return (
    <Link
      href={href}
      id={live.id}
      className="group relative block aspect-[3/4] max-h-[300px] scroll-mt-24 overflow-hidden rounded-[16px] shadow-[0_6px_20px_rgba(15,23,42,0.12)] ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
    >
      <Image
        src={live.image}
        alt=""
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

      {!upcoming ? (
        <span className="absolute top-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          O&apos;tgan
        </span>
      ) : left > 0 && left <= 12 ? (
        <span className="absolute top-2 right-2 rounded-full bg-[#ef4444] px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_4px_12px_rgba(239,68,68,0.4)]">
          O&apos;rin qoldi
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 p-2">
        <div className="rounded-xl border border-white/25 bg-white/18 p-2 shadow-[0_6px_18px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-start gap-2">
            <div className="shrink-0 rounded-lg bg-white/95 px-1.5 py-1 text-center shadow-sm">
              <p className="text-[13px] leading-none font-bold text-[#0B1F4D]">{date.day}</p>
              <p className="mt-0.5 text-[8px] font-bold tracking-wider text-[#0066FF]">
                {date.monthBadge}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-[12.5px] font-bold leading-snug text-white drop-shadow-sm">
                {shortTitle}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] text-white/90">
                <span className="inline-flex items-center gap-0.5">
                  {online ? (
                    <Monitor className="size-2.5 opacity-90" />
                  ) : (
                    <MapPin className="size-2.5 opacity-90" />
                  )}
                  {online ? "Online" : live.city}
                </span>
                <span className="text-white/40">·</span>
                <span className="font-semibold text-white">{seminarPriceText(live)}</span>
              </div>
            </div>
          </div>
          {upcoming && left > 0 ? (
            <p className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-white/85">
              <span className="inline-flex items-center gap-1">
                <Users className="size-2.5" />
                {left} ta joy
              </span>
              <span className="inline-flex items-center gap-0.5 text-white">
                Batafsil
                <ChevronRight className="size-3" />
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/** Cinematic hero — full-bleed poster with frosted glass info panel */
export function FeaturedSeminar({ seminar }: { seminar: Seminar }) {
  const { liveSeminar, seatsLeft, activeReg } = useSeminarRegs();
  const live = liveSeminar(seminar);
  const date = seminarDate(live);
  const speakers = getSeminarSpeakers(live);
  const primary = speakers[0];
  const left = seatsLeft(seminar);
  const mine = activeReg(seminar.id);
  const upcoming = isSeminarUpcoming(live);
  const href = seminarHref(live.id);
  const online = live.city === "Online";

  return (
    <article
      id={live.id}
      className="relative scroll-mt-24 overflow-hidden rounded-[18px] shadow-[0_8px_28px_rgba(15,23,42,0.12)] ring-1 ring-black/5"
    >
      <div className="relative min-h-[220px] sm:min-h-[240px] lg:min-h-[260px] lg:max-h-[280px]">
        <Image
          src={live.image}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 1100px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-end p-3 sm:min-h-[240px] sm:p-4 lg:min-h-[260px] lg:max-h-[280px] lg:justify-center lg:items-end lg:p-5">
          <div className="w-full max-w-sm rounded-[16px] border border-white/30 bg-white/15 p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:p-4 lg:mr-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex rounded-full bg-[#0066FF] px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] text-white uppercase">
                Featured
              </span>
              {!upcoming ? (
                <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold text-white">
                  O&apos;tgan
                </span>
              ) : left > 0 && left <= 12 ? (
                <span className="rounded-full bg-[#ef4444] px-2 py-0.5 text-[9px] font-bold text-white">
                  O&apos;rin qoldi · {left} ta
                </span>
              ) : null}
            </div>

            <h2 className="text-[17px] font-bold leading-snug tracking-tight text-white sm:text-[19px] line-clamp-2">
              {live.title}
            </h2>

            <ul className="mt-2.5 space-y-1 text-[12.5px] text-white/90">
              <li className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 shrink-0 text-white" />
                <span>
                  {date.when}, {live.time} — {live.timeEnd}
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-white" />
                <span>
                  {online ? "Online" : `${live.venue}, ${live.city}`}
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <Tag className="size-3.5 shrink-0 text-white" />
                <span className="font-semibold text-white">{seminarPriceText(live)}</span>
              </li>
              {primary ? (
                <li className="flex items-center gap-1.5 pt-0.5">
                  {primary.photo ? (
                    <Image
                      src={primary.photo}
                      alt=""
                      width={24}
                      height={24}
                      className="size-6 rounded-full object-cover ring-2 ring-white/40"
                    />
                  ) : (
                    <span className="grid size-6 place-items-center rounded-full bg-white/25 text-[9px] font-bold text-white">
                      {primary.name
                        .split(" ")
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join("")}
                    </span>
                  )}
                  <span>
                    <span className="font-semibold text-white">{primary.name}</span>
                    {speakers.length > 1 ? (
                      <span className="text-white/70"> +{speakers.length - 1} spiker</span>
                    ) : null}
                  </span>
                </li>
              ) : null}
            </ul>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!upcoming ? (
                <span className="inline-flex h-9 items-center rounded-lg bg-white/20 px-4 text-[13px] font-semibold text-white">
                  O&apos;tgan seminar
                </span>
              ) : mine ? (
                <Link
                  href={href}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-4 text-[13px] font-semibold text-[#0066FF]"
                >
                  <SeminarStatusBadge status={mine.status} />
                  {mine.status === "pending" ? "Tasdiqlash kerak" : "Tasdiqlangan"}
                </Link>
              ) : left <= 0 ? (
                <span className="inline-flex h-9 items-center rounded-lg bg-white/20 px-4 text-[13px] font-semibold text-white">
                  Joy qolmadi
                </span>
              ) : (
                <Link
                  href={href}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0066FF] px-4 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(0,102,255,0.4)] hover:bg-[#0052cc]"
                >
                  Ro&apos;yxatdan o&apos;tish
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
              {upcoming && left > 0 ? (
                <p className="text-[11px] font-medium text-white/80">
                  {live.seatsTaken}/{live.seatsTotal} · {left} ta joy qoldi
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Mobile featured — poster with glass overlay */
export function MobileFeaturedCard({ seminar }: { seminar: Seminar }) {
  const { liveSeminar, seatsLeft, activeReg } = useSeminarRegs();
  const live = liveSeminar(seminar);
  const online = live.city === "Online";
  const left = seatsLeft(seminar);
  const mine = activeReg(seminar.id);
  const upcoming = isSeminarUpcoming(live);
  const href = seminarHref(live.id);
  const date = seminarDate(live);
  const speakers = getSeminarSpeakers(live);

  return (
    <Link
      href={href}
      className="group relative block h-[200px] overflow-hidden rounded-[16px] shadow-[0_8px_24px_rgba(15,23,42,0.12)] ring-1 ring-black/5"
    >
      <Image
        src={live.image}
        alt=""
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      <MobileFeaturedDateBadge iso={live.date} className="absolute top-2 left-2 z-10 !size-[44px]" />
      <span className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
        <span className="size-1.5 rounded-full bg-[#0066FF]" />
        {online ? "Online" : "Offline"}
      </span>

      <div className="absolute inset-x-0 bottom-0 z-10 p-2.5">
        <div className="rounded-xl border border-white/25 bg-white/15 p-2.5 backdrop-blur-xl">
          <h3 className="line-clamp-1 text-[14px] font-bold leading-snug text-white">{live.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/90">
            <span className="inline-flex items-center gap-1">
              <User className="size-3 shrink-0" />
              {speakers[0]?.name}
              {speakers.length > 1 ? ` +${speakers.length - 1}` : ""}
            </span>
            <span className="text-white/40">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              {online ? "Online" : live.city}
            </span>
            <span className="text-white/40">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 shrink-0" />
              {date.day} {date.monthShort}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {!upcoming ? (
              <p className="flex-1 text-center text-[12px] font-medium text-white/70">O&apos;tgan</p>
            ) : mine ? (
              <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/90 text-[13px] font-semibold text-[#0066FF]">
                <SeminarStatusBadge status={mine.status} />
                {mine.status === "pending" ? "Tasdiqlash kerak" : "Tasdiqlangan"}
              </span>
            ) : left <= 0 ? (
              <span className="flex h-9 flex-1 items-center justify-center rounded-lg bg-white/20 text-[13px] font-semibold text-white">
                Joy qolmadi
              </span>
            ) : (
              <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0066FF] text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(0,102,255,0.35)]">
                Ro&apos;yxatdan o&apos;tish
                <ArrowRight className="size-3.5" />
              </span>
            )}
            {upcoming && left > 0 ? (
              <span className="shrink-0 text-[10px] font-semibold text-[#86efac]">{left} joy</span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Mobile poster grid item */
export function MobileSeminarListItem({
  seminar,
  divider = false,
}: {
  seminar: Seminar;
  divider?: boolean;
}) {
  void divider;
  return <SeminarCard seminar={seminar} />;
}

export function SeminarRow({ seminar }: { seminar: Seminar }) {
  const { liveSeminar } = useSeminarRegs();
  const live = liveSeminar(seminar);
  const date = seminarDate(live);
  const online = live.city === "Online";

  return (
    <article
      id={live.id}
      className="scroll-mt-24 grid grid-cols-1 items-center gap-3 border-b border-[#eceff5] bg-white px-4 py-3 last:border-0 sm:grid-cols-[96px_72px_minmax(0,1.4fr)_auto] lg:grid-cols-[96px_72px_minmax(0,1.4fr)_130px_140px_auto]"
    >
      <Image
        src={live.image}
        alt=""
        width={96}
        height={64}
        className="hidden h-16 w-24 rounded-lg object-cover sm:block"
      />
      <DateBadge iso={live.date} />
      <div>
        <h3 className="text-sm font-semibold text-[#1a1d26]">
          <Link href={seminarHref(live.id)} className="hover:text-primary">
            {live.title}
          </Link>
        </h3>
        <p className="text-[12px] text-[#8b93a7]">
          {live.speaker || live.organizer || "Ma’ruzachi aniqlanmoqda"} · {date.when}, {live.time}
        </p>
        <SeatOccupancyLine seminarId={live.id} className="mt-1" />
      </div>
      <p className="hidden items-center gap-1 text-sm text-[#4b5568] lg:inline-flex">
        {online ? <Monitor className="size-3.5 text-primary" /> : <MapPin className="size-3.5 text-primary" />}
        {live.city}
      </p>
      <p className="hidden text-sm font-semibold text-primary lg:block">{seminarPriceText(live)}</p>
      <div className="justify-self-start sm:justify-self-end">
        <RegisterCta seminar={seminar} />
      </div>
    </article>
  );
}
