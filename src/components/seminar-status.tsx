"use client";

import { Button } from "@/components/ui/button";
import { useSeminarRegs } from "@/components/seminar-provider";
import { cn } from "@/lib/utils";
import { paymentLabel, type PaymentStatus, type RegistrationStatus, type SeminarRegistration } from "@/lib/seminar-registrations";
import { getSeminar, seatsLeft } from "@/data/seminars";

const copy: Record<RegistrationStatus, { label: string; className: string }> = {
  pending: {
    label: "Kutilmoqda",
    className: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  },
  confirmed: {
    label: "Tasdiqlangan",
    className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
  },
  attended: {
    label: "Kirdi",
    className: "bg-[#F0FDFA] text-[#115E59] ring-1 ring-[#99F6E4]/80",
  },
  cancelled: {
    label: "Bekor qilindi",
    className: "bg-slate-100 text-slate-500 ring-1 ring-slate-200/80",
  },
};

export function SeminarStatusBadge({
  status,
  className,
}: {
  status: RegistrationStatus;
  className?: string;
}) {
  const item = copy[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        item.className,
        className,
      )}
    >
      {item.label}
    </span>
  );
}

const payClass: Record<PaymentStatus, string> = {
  free: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80",
  awaiting: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  paid: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
};

/** Payment state is shown honestly: paid seminars stay "to‘lov kutilmoqda (namuna)" until the organizer records the payment. */
export function PaymentBadge({ reg, className }: { reg: Pick<SeminarRegistration, "paymentStatus" | "price">; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", payClass[reg.paymentStatus], className)}>
      {paymentLabel(reg)}
    </span>
  );
}

export function SeatOccupancyLine({
  seminarId,
  className,
}: {
  seminarId: string;
  className?: string;
}) {
  const { liveSeminar, occupancyOf } = useSeminarRegs();
  const catalog = getSeminar(seminarId);
  if (!catalog) return null;
  const live = liveSeminar(catalog);
  const remaining = seatsLeft(live);
  const occ = occupancyOf(seminarId);
  const confirmed = catalog.seatsTaken + occ.confirmed;
  return (
    <p className={cn("text-[12px] text-slate-500", className)}>
      {remaining} ta joy qoldi
      <span className="text-slate-300"> · </span>
      {confirmed} tasdiqlangan
      {occ.pending > 0 ? (
        <>
          <span className="text-slate-300"> · </span>
          {occ.pending} kutilmoqda
        </>
      ) : null}
    </p>
  );
}

function ConfirmButtons({
  registrationId,
  compact,
}: {
  registrationId: string;
  compact?: boolean;
}) {
  const { confirm, cancel } = useSeminarRegs();
  return (
    <div className={cn("flex gap-2", compact ? "flex-wrap" : "flex-col sm:flex-row")}>
      <Button
        type="button"
        className={cn("h-11 !rounded-xl", compact ? "" : "flex-1")}
        onClick={() => confirm(registrationId)}
      >
        Kelaman (tasdiqlash)
      </Button>
      <Button
        type="button"
        variant="outline"
        className={cn("h-11 !rounded-xl", compact ? "" : "flex-1")}
        onClick={() => cancel(registrationId)}
      >
        Kelolmayman
      </Button>
    </div>
  );
}

export function AttendanceActions({
  registration,
  compact = false,
}: {
  registration: SeminarRegistration;
  compact?: boolean;
}) {
  const { cancel } = useSeminarRegs();

  if (registration.status === "cancelled") return null;

  if (registration.status === "attended") {
    return compact ? null : (
      <div className="space-y-2">
        <SeminarStatusBadge status="attended" />
        <p className="text-[13.5px] leading-relaxed text-[#4b5568]">Seminarga kirishingiz tashkilotchi tomonidan qayd etilgan.</p>
      </div>
    );
  }

  if (registration.status === "confirmed") {
    if (compact) return null;
    return (
      <div className="space-y-3">
        <SeminarStatusBadge status="confirmed" />
        <p className="text-[13.5px] leading-relaxed text-[#4b5568]">
          Joy siz uchun saqlanadi. Agar reja o‘zgarsa, joy boshqa hamkasblarga ochiladi.
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-11 !rounded-xl"
          onClick={() => cancel(registration.id)}
        >
          Qatnasha olmayman
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <ConfirmButtons registrationId={registration.id} compact />
        <p className="text-[12px] leading-relaxed text-[#8b93a7]">
          Seminardan kamida 24 soat oldin tasdiqlash kerak.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SeminarStatusBadge status="pending" />
      <h2 className="text-[18px] font-bold tracking-tight text-[#1a1d26]">
        Joy band qilindi. Ishtirokingizni tasdiqlang
      </h2>
      <p className="text-[13.5px] leading-relaxed text-[#4b5568]">
        Yozuv qabul qilindi, lekin kelish hali tasdiqlanmagan. Seminar kuni qatnashasizmi?
      </p>
      <ConfirmButtons registrationId={registration.id} />
      <p className="text-[12.5px] leading-relaxed text-[#8b93a7]">
        Iltimos, seminardan kamida 24 soat oldin ishtirokingizni tasdiqlang. Tasdiqlanmagan joy
        boshqa hamkasblarga ochilishi mumkin.
      </p>
    </div>
  );
}
