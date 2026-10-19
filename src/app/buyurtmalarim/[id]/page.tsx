import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MyOrderDetail } from "@/components/my-orders";
import { rpc } from "@/lib/server/db";
import { getSessionUserId } from "@/lib/server/session";
import type { Order, OrderPaymentState, OrderStatus, PaymentMethod } from "@/lib/orders";

export const dynamic = "force-dynamic";

function presentOrder(raw: Partial<Order> & { id: string }): Order {
  const createdAt = raw.createdAt ?? new Date().toISOString();
  const status = (raw.status as OrderStatus) ?? "pending_accept";
  return {
    id: raw.id,
    createdAt,
    name: raw.name ?? "",
    phone: raw.phone ?? "",
    city: raw.city ?? "",
    address: raw.address ?? "",
    note: raw.note ?? "",
    payment: (raw.payment as PaymentMethod) ?? "click",
    items: Array.isArray(raw.items) ? raw.items : [],
    total: Number(raw.total) || 0,
    status,
    statusHistory: Array.isArray(raw.statusHistory) && raw.statusHistory.length ? raw.statusHistory : [{ status, at: createdAt }],
    paymentState: (raw.paymentState as OrderPaymentState) ?? "awaiting_payment",
    shopId: raw.shopId,
    shopName: raw.shopName,
    confirmedAt: raw.confirmedAt,
    yandexTrackUrl: raw.yandexTrackUrl,
    courierName: raw.courierName,
    courierPhone: raw.courierPhone,
    carInfo: raw.carInfo,
    courierLocationUrl: raw.courierLocationUrl,
    courierLat: raw.courierLat,
    courierLng: raw.courierLng,
    courierLocationAt: raw.courierLocationAt,
    paidAt: raw.paidAt,
    commission: raw.commission,
    bonusUsed: raw.bonusUsed,
    payable: raw.payable,
    dispute: raw.dispute,
  };
}

export default async function BuyurtmaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId || "");
  if (!id) notFound();

  const userId = await getSessionUserId();
  if (!userId) redirect(`/kirish?next=${encodeURIComponent(`/buyurtmalarim/${encodeURIComponent(id)}`)}`);

  const data = await rpc<{ buyer?: Array<Partial<Order> & { id: string }>; seller?: Array<Partial<Order> & { id: string }> }>("sh_my_orders", {
    p_user: userId,
  });
  const raw = [...(data.buyer ?? []), ...(data.seller ?? [])].find((order) => order.id === id);
  if (!raw) notFound();

  return (
    <>
      <header className="mb-4 hidden lg:block">
        <p className="text-[13px] text-[#8b93a7]">
          <Link href="/buyurtmalarim" className="text-[#0066FF] hover:underline">
            Buyurtmalarim
          </Link>
          <span className="mx-1.5 text-[#d0d5e0]">/</span>
          <span className="truncate font-medium text-[#4b5568]">{id}</span>
        </p>
      </header>
      <MyOrderDetail orderId={id} initialOrder={presentOrder(raw)} />
    </>
  );
}
