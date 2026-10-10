import { redirect } from "next/navigation";

/** Notification deep link → the ticket page. */
export default async function TicketRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/seminarlar/yozuvlarim/${encodeURIComponent(id)}`);
}
