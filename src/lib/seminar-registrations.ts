/** Client-side shape of a real (server-side) seminar registration / ticket. "pending" = server "registered". */
export type RegistrationStatus = "pending" | "confirmed" | "attended" | "cancelled";
export type PaymentStatus = "free" | "awaiting" | "paid";

export type SeminarRegistration = {
  id: string;
  seminarId: string;
  seminarTitle?: string;
  name: string;
  phone: string;
  telegram?: string;
  clinic?: string;
  createdAt: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  price: number;
  ticketCode: string;
  attendedAt?: string;
  paidAt?: string;
};

export type ServerRegistration = {
  id: string;
  seminarId: string;
  seminarTitle?: string | null;
  name: string;
  phone: string;
  telegram: string | null;
  clinic: string | null;
  status: "registered" | "confirmed" | "attended" | "cancelled";
  paymentStatus: PaymentStatus;
  price: number;
  ticketCode: string;
  createdAt: string;
  attendedAt: string | null;
  paidAt: string | null;
};

export function fromServer(row: ServerRegistration): SeminarRegistration {
  return {
    id: row.id,
    seminarId: row.seminarId,
    seminarTitle: row.seminarTitle ?? undefined,
    name: row.name,
    phone: row.phone,
    telegram: row.telegram ?? undefined,
    clinic: row.clinic ?? undefined,
    createdAt: row.createdAt,
    status: row.status === "registered" ? "pending" : row.status,
    paymentStatus: row.paymentStatus,
    price: row.price,
    ticketCode: row.ticketCode,
    attendedAt: row.attendedAt ?? undefined,
    paidAt: row.paidAt ?? undefined,
  };
}

export type Occupancy = Record<string, { registered: number; confirmed: number; attended: number }>;

export function isActiveStatus(status: RegistrationStatus) {
  return status !== "cancelled";
}

export function findActiveReg(regs: SeminarRegistration[], seminarId: string): SeminarRegistration | undefined {
  return regs.find((r) => r.seminarId === seminarId && isActiveStatus(r.status));
}

export function paymentLabel(reg: Pick<SeminarRegistration, "paymentStatus" | "price">) {
  if (reg.paymentStatus === "paid") return "To‘lov qayd etilgan";
  if (reg.paymentStatus === "awaiting") return "To‘lov kutilmoqda (namuna)";
  return "Bepul";
}
