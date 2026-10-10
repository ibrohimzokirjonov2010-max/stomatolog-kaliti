import { redirect } from "next/navigation";

export default async function OrganizerRedirect({ searchParams }: { searchParams: Promise<{ seminar?: string }> }) {
  const { seminar } = await searchParams;
  redirect(`/seminarlar/yozuvlarim/tashkilotchi${seminar ? `?seminar=${encodeURIComponent(seminar)}` : ""}`);
}
